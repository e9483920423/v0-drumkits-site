import { createHash } from "node:crypto";

const SUPABASE_URL =
  process.env.drumkits_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://fwrnbfwzolplbmiaaeme.supabase.co";

const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.drumkits_SUPABASE_SERVICE_ROLE_KEY;

const SUPABASE_ANON_KEY =
  process.env.drumkits_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_PUBLIC_ANON_KEY;

function escapeIlikeValue(value = "") {
  return String(value)
    .replace(/\\/g, "\\\\")
    .replace(/%/g, "\\%")
    .replace(/_/g, "\\_")
    .replace(/,/g, "\\,");
}

function getSupabaseRestUrl(query = {}) {
  const base = SUPABASE_URL.replace(/\/$/, "");
  const params = new URLSearchParams();

  const hasSlugFilter = typeof query.slug === "string" && query.slug.trim().length > 0;
  const selectFields = "id,slug,title,description,file_size,update_date,download";

  params.set("select", selectFields);
  params.set("order", "id.desc");

  if (hasSlugFilter) {
    params.set("slug", `eq.${query.slug.trim()}`);
  }

  if (typeof query.q === "string" && query.q.trim()) {
    const q = escapeIlikeValue(query.q.trim());
    params.set("or", `title.ilike.*${q}*,description.ilike.*${q}*,slug.ilike.*${q}*`);
  }

  const limit = Number.parseInt(query.limit, 10);
  const page = Number.parseInt(query.page, 10);

  if (Number.isFinite(limit) && limit > 0) {
    const normalizedLimit = Math.min(limit, 100);
    const normalizedPage = Number.isFinite(page) && page > 0 ? page : 1;
    const offset = (normalizedPage - 1) * normalizedLimit;
    params.set("limit", String(normalizedLimit));
    params.set("offset", String(offset));
  }

  return `${base}/rest/v1/drum_kits?${params.toString()}`;
}

function buildStrongEtag(payload) {
  const serialized = JSON.stringify(payload ?? []);
  const hash = createHash("sha1").update(serialized).digest("base64");
  return `"${hash}"`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const supabaseKey = SUPABASE_SERVICE_ROLE_KEY || SUPABASE_ANON_KEY;

  if (!SUPABASE_URL || !supabaseKey) {
    return res.status(500).json({ error: "Supabase config missing on server." });
  }

  try {
    const response = await fetch(getSupabaseRestUrl(), {
      method: 'GET',
      cache: "no-store",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${supabaseKey}`,
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Supabase error ${response.status}: ${body}`);
    }

    const data = await response.json();
    const normalizedData = Array.isArray(data) ? data : [];
    const etag = buildStrongEtag(normalizedData);

    res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
    res.setHeader("ETag", etag);

    const incomingEtag = req.headers["if-none-match"];
    if (incomingEtag && incomingEtag === etag) {
      return res.status(304).end();
    }

    return res.status(200).json({ data: normalizedData });
  } catch (error) {
    console.error("/api/kits failed:", error);
    return res.status(500).json({ error: "Failed to load kits." });
  }
}
