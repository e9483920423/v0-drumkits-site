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

function getSupabaseRestUrl() {
  const base = SUPABASE_URL.replace(/\/$/, "");
  return `${base}/rest/v1/drum_kits?select=*&order=id.desc`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: "Supabase config missing on server." });
  }

  try {
    const response = await fetch(getSupabaseRestUrl(), {
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
    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json({ data: data || [] });
  } catch (error) {
    console.error("/api/kits failed:", error);
    return res.status(500).json({ error: "Failed to load kits." });
  }
}
