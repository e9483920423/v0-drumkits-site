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

function getSupabaseRestUrl(searchQuery, tableName = 'drum_kits', slug = "") {
  const base = SUPABASE_URL.replace(/\/$/, "");
  let url = `${base}/rest/v1/${tableName}?select=*&order=id.desc`;
  
  if (slug) {
    url += `&slug=eq.${encodeURIComponent(slug)}`;
  } else if (searchQuery) {
    const flexSearch = searchQuery.trim().replace(/[\s\W_]+/g, '*');
    url += `&title=ilike.*${encodeURIComponent(flexSearch)}*`;
  }
  
  return url;
}

import crypto from 'crypto';

const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET || "d7b8k9s2-p0q1-r3s4-t5u6-v7w8x9y0z1a2";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // 1. Basic Origin/Referer Check
  const origin = req.headers.origin;
  const referer = req.headers.referer;
  const host = req.headers.host;
  
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1');
  const isAllowedOrigin = origin && (origin.includes('drumkits.site') || origin.includes('vercel.app'));
  const isAllowedReferer = referer && (referer.includes('drumkits.site') || referer.includes('vercel.app'));

  if (!isLocal && !isAllowedOrigin && !isAllowedReferer) {
     return res.status(403).json({ error: "Access denied." });
  }

  // 2. Signature Verification
  const signature = req.headers['x-request-signature'];
  const timestamp = req.headers['x-request-timestamp'];

  if (!signature || !timestamp) {
    return res.status(403).json({ error: "Missing authentication." });
  }

  // Check if timestamp is within a 2-minute window to allow for clock drift
  const now = Date.now();
  const requestTime = parseInt(timestamp, 10);
  if (isNaN(requestTime) || Math.abs(now - requestTime) > 120000) {
    return res.status(403).json({ error: "Request expired." });
  }

  const expectedSignature = crypto
    .createHash('sha256')
    .update(timestamp + INTERNAL_SECRET)
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(403).json({ error: "Invalid signature." });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "Config missing on server." });
  }

  const searchQuery = req.query.q || req.query.search || "";
  const slugQuery = req.query.slug || "";
  const limit = Math.min(parseInt(req.query.limit) || 20, 100); // Max 100 per request
  const offset = parseInt(req.query.offset) || 0;
  
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
    const baseUrl = getSupabaseRestUrl(searchQuery, dbSource, slugQuery);
    // Request with count=exact to get the total matches
    const fetchUrl = `${baseUrl}&limit=${limit}&offset=${offset}`;
    
    const response = await fetch(fetchUrl, {
      method: 'GET',
      cache: "no-store",
      headers: {
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Accept: "application/json",
        "Prefer": "count=exact" 
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase error ${response.status}: ${body}`);
    }

    const data = await response.json();
    const contentRange = response.headers.get("content-range");
    let total = 0;
    if (contentRange) {
      const parts = contentRange.split("/");
      if (parts.length > 1) total = parseInt(parts[1], 10);
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ 
      data, 
      total,
      limit,
      offset
    });
  } catch (error) {
    console.error("/api/kits failed:", error);
    return res.status(500).json({ error: "Failed to load kits." });
  }
}
