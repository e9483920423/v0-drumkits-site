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

function getSupabaseRestUrl(searchQuery, tableName = 'drum_kits') {
  const base = SUPABASE_URL.replace(/\/$/, "");
  let url = `${base}/rest/v1/${tableName}?select=*&order=id.desc`;
  
  if (searchQuery) {
    url += `&title=ilike.*${encodeURIComponent(searchQuery)}*`;
  }
  
  return url;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "Supabase config missing on server." });
  }

  const searchQuery = req.query.q || req.query.search || "";
  
  const cookies = (req.headers.cookie || '').split(';');
  let dbSource = 'drum_kits';
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === 'db_source' && value === 'kits4beats') {
      dbSource = 'kits4beats_drumkits';
      break;
    }
  }

  try {
    let allData = [];
    let offset = 0;
    const limit = 1000;
    const baseUrl = getSupabaseRestUrl(searchQuery, dbSource);

    while (true) {
      const fetchUrl = `${baseUrl}&limit=${limit}&offset=${offset}`;
      const response = await fetch(fetchUrl, {
        method: 'GET',
        cache: "no-store",
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const body = await response.text();
        throw new Error(`Supabase error ${response.status}: ${body}`);
      }

      const data = await response.json();
      if (!data || data.length === 0) {
        break;
      }

      allData = allData.concat(data);

      if (data.length < limit) {
        break;
      }
      offset += limit;
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ data: allData });
  } catch (error) {
    console.error("/api/kits failed:", error);
    return res.status(500).json({ error: "Failed to load kits." });
  }
}
