const SUPABASE_URL =
  process.env.drumkits_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://fwrnbfwzolplbmiaaeme.supabase.co";

const SUPABASE_ANON_KEY =
  process.env.drumkits_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLIC_ANON_KEY;

const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev";
const IMAGE_EXTENSIONS = ["jpg", "png", "webp", "avif", "jpeg", "gif"];

// 1. Move image logic to the server to hide the R2 bucket URL
async function resolveItemImageUrl(id, isKits4Beats) {
  if (isKits4Beats) return "/errors/default.jpg";

  const promises = IMAGE_EXTENSIONS.map(ext => {
    return new Promise(async (resolve, reject) => {
      const url = `${PUB_URL}/${id}.${ext}`;
      try {
        // Use HEAD request to check if file exists without downloading it
        const res = await fetch(url, { method: 'HEAD' });
        if (res.ok) resolve(url);
        else reject();
      } catch {
        reject();
      }
    });
  });

  try {
    return await Promise.any(promises);
  } catch {
    return "/errors/default.jpg";
  }
}

function getSupabaseRestUrl(searchQuery, tableName = 'drum_kits') {
  const base = SUPABASE_URL.replace(/\/$/, "");
  let url = `${base}/rest/v1/${tableName}?select=*&order=id.desc`;
  
  if (searchQuery) {
    const flexSearch = searchQuery.trim().replace(/[\s\W_]+/g, '*');
    url += `&title=ilike.*${encodeURIComponent(flexSearch)}*`;
  }
  return url;
}

// 2. Time-based token validation
function isValidSignature(token) {
  if (!token) return false;
  try {
    const decoded = Buffer.from(token, 'base64').toString('ascii');
    const [prefix, timestampStr] = decoded.split('-');
    if (prefix !== 'internal' && prefix !== 'secure') return false; // Match the frontend logic
    
    const timeSent = parseInt(timestampStr, 10);
    const currentTime = Math.floor(Date.now() / 10000);
    
    // Allow a 10-second window (previous, current, or next tick) to account for slight clock drift
    return Math.abs(currentTime - timeSent) <= 1;
  } catch (e) {
    return false;
  }
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Enforce the new dynamic security token
  const clientSig = req.headers['x-internal-sig'];
  if (!isValidSignature(clientSig)) {
    return res.status(403).json({ error: "Fuck you." });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "Config missing on server." });
  }

  const searchQuery = req.query.q || req.query.search || "";
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 6;
  const offset = (page - 1) * limit;
  
  const cookies = (req.headers.cookie || '').split(';');
  let dbSource = 'drum_kits';
  let isKits4Beats = false;

  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'db_source' && value === 'kits4beats') {
      dbSource = 'kits4beats_drumkits';
      isKits4Beats = true;
      break;
    }
  }

  try {
    const fetchUrl = `${getSupabaseRestUrl(searchQuery, dbSource)}&limit=${limit}&offset=${offset}`;
    
    // 3. Fetch only the requested page from Supabase, and ask for the total count
    const response = await fetch(fetchUrl, {
      method: 'GET',
      cache: "no-store",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
        // This tells Supabase to return the total row count in the headers
        Prefer: "count=exact" 
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase error ${response.status}: ${body}`);
    }

    const data = await response.json();
    
    // Parse the total count from Supabase's Content-Range header (e.g., "0-5/6861")
    const rangeHeader = response.headers.get('content-range');
    const totalItems = rangeHeader ? parseInt(rangeHeader.split('/')[1]) : 0;

    // 4. Attach the correct image URL to each item before sending to the frontend
    const dataWithImages = await Promise.all(data.map(async (item) => {
      const imageUrl = await resolveItemImageUrl(item.id, isKits4Beats);
      return { ...item, imageUrl };
    }));

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ 
      data: dataWithImages, 
      totalItems: totalItems 
    });

  } catch (error) {
    console.error("/api/kits failed:", error);
    return res.status(500).json({ error: "Failed to load kits." });
  }
}
