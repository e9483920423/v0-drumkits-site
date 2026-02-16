const DRUMKIT_CACHE_KEY = "drumkits:all:v1";
const DRUMKIT_CACHE_TTL_MS = 5 * 60 * 1000;

let inMemoryKits = null;
let inFlightKitsPromise = null;

function normalizeKit(row) {
  return {
    id: row?.id,
    slug: row?.slug || "",
    title: row?.title || "Untitled",
    description: row?.description || "",
    file_size: row?.file_size || row?.fileSize || "N/A",
    update_date: row?.update_date || row?.updateDate || null,
    download: row?.download || "",
  };
}

function readLocalCache() {
  try {
    const raw = localStorage.getItem(DRUMKIT_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !Array.isArray(parsed.data) || typeof parsed.timestamp !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalCache(data) {
  try {
    localStorage.setItem(
      DRUMKIT_CACHE_KEY,
      JSON.stringify({
        timestamp: Date.now(),
        data,
      })
    );
  } catch {
    // Ignore storage failures (private mode/quota/etc)
  }
}

async function fetchKitsFromApi() {
  const response = await fetch("/api/kits", {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed to load kits (${response.status})`);
  }

  const payload = await response.json();
  const rows = Array.isArray(payload?.data) ? payload.data : [];
  return rows.map(normalizeKit);
}

async function getAllKits({ forceRefresh = false } = {}) {
  if (!forceRefresh && Array.isArray(inMemoryKits)) {
    return inMemoryKits;
  }

  if (!forceRefresh) {
    const cached = readLocalCache();
    if (cached && Date.now() - cached.timestamp <= DRUMKIT_CACHE_TTL_MS) {
      inMemoryKits = cached.data;
      return inMemoryKits;
    }
  }

  if (!forceRefresh && inFlightKitsPromise) {
    return inFlightKitsPromise;
  }

  inFlightKitsPromise = fetchKitsFromApi()
    .then((kits) => {
      inMemoryKits = kits;
      writeLocalCache(kits);
      return kits;
    })
    .finally(() => {
      inFlightKitsPromise = null;
    });

  return inFlightKitsPromise;
}

async function searchKits(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];

  const kits = await getAllKits();
  return kits.filter((item) => {
    const title = (item?.title || "").toLowerCase();
    const description = (item?.description || "").toLowerCase();
    const slug = (item?.slug || "").toLowerCase();
    return title.includes(q) || description.includes(q) || slug.includes(q);
  });
}

async function getKitBySlug(slug) {
  const normalizedSlug = (slug || "").trim();
  if (!normalizedSlug) return null;

  const kits = await getAllKits();
  return kits.find((item) => item.slug === normalizedSlug) || null;
}

window.DrumkitDataStore = {
  getAllKits,
  searchKits,
  getKitBySlug,
  DRUMKIT_CACHE_TTL_MS,
};
