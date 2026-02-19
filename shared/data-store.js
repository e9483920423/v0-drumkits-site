const CACHE_VERSION = 1;
const DRUMKIT_CACHE_KEY = `drumkits:all:v${CACHE_VERSION}`;
const DRUMKIT_CACHE_TTL_MS = 5 * 60 * 1000;

;(function pruneOldCacheKeys() {
  try {
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const key = localStorage.key(i);
      if (key && key.startsWith("drumkits:all:") && key !== DRUMKIT_CACHE_KEY) {
        localStorage.removeItem(key);
      }
    }
  } catch {}
})();

let inMemoryKits = null;
let inMemoryTimestamp = 0;
let inFlightKitsPromise = null;

function normalizeKit(row) {
  return {
    id: row?.id,
    slug: row?.slug || "",
    title: row?.title || "Untitled",
    description: row?.description || "",
    file_size: row?.file_size ?? row?.fileSize ?? "N/A",
    update_date: row?.update_date ?? row?.updateDate ?? null,
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
  const now = Date.now();

  inMemoryKits = data;
  inMemoryTimestamp = now;

  try {
    localStorage.setItem(
      DRUMKIT_CACHE_KEY,
      JSON.stringify({ timestamp: now, data })
    );
  } catch {
  }

  try {
    window.dispatchEvent(
      new CustomEvent("drumkits:data-updated", { detail: { data, timestamp: now } })
    );
  } catch {}
}

function isLikelyLocalStaticPreview() {
  return (
    window.location.hostname === "127.0.0.1" ||
    window.location.hostname === "localhost"
  );
}

async function fetchKitsFromLocalJsonFallback() {
  const response = await fetch("/dl-data/dl-data.json", {
    headers: { Accept: "application/json" },
  });

  if (!response.ok) {
    throw new Error(`Failed fallback kits load (${response.status})`);
  }

  const rows = await response.json();
  return (Array.isArray(rows) ? rows : []).map(normalizeKit);
}

async function fetchKitsFromApi() {
  try {
    const response = await fetch("/api/kits", {
      headers: { Accept: "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Failed to load kits (${response.status})`);
    }

    const payload = await response.json();
    const rows = Array.isArray(payload?.data) ? payload.data : [];
    return rows.map(normalizeKit);
  } catch (error) {
    if (isLikelyLocalStaticPreview()) {
      return fetchKitsFromLocalJsonFallback();
    }
    throw error;
  }
}

function getCachedKitsSync({ allowStale = true } = {}) {
  if (Array.isArray(inMemoryKits)) {
    if (allowStale || Date.now() - inMemoryTimestamp <= DRUMKIT_CACHE_TTL_MS) {
      return inMemoryKits;
    }
  }

  const cached = readLocalCache();
  if (!cached) return null;

  if (!allowStale && Date.now() - cached.timestamp > DRUMKIT_CACHE_TTL_MS) {
    return null;
  }

  inMemoryKits = cached.data;
  inMemoryTimestamp = cached.timestamp;
  return inMemoryKits;
}

function refreshKitsInBackground() {
  if (inFlightKitsPromise) return;

  inFlightKitsPromise = fetchKitsFromApi()
    .then((kits) => {
      writeLocalCache(kits);
      return kits;
    })
    .catch((err) => {
      console.warn("[DrumkitDataStore] Background refresh failed:", err);
    })
    .finally(() => {
      inFlightKitsPromise = null;
    });
}

async function getAllKits({ forceRefresh = false, allowStale = true, revalidate = false } = {}) {
  if (!forceRefresh && Array.isArray(inMemoryKits)) {
    const isFresh = Date.now() - inMemoryTimestamp <= DRUMKIT_CACHE_TTL_MS;
    if (isFresh || allowStale) {
      if (!isFresh && revalidate) refreshKitsInBackground();
      return inMemoryKits;
    }
  }

  if (!forceRefresh) {
    const cached = readLocalCache();
    if (cached) {
      inMemoryKits = cached.data;
      inMemoryTimestamp = cached.timestamp;

      const isFresh = Date.now() - cached.timestamp <= DRUMKIT_CACHE_TTL_MS;
      if (isFresh || allowStale) {
        if (!isFresh && revalidate) refreshKitsInBackground();
        return inMemoryKits;
      }
    }
  }

  if (inFlightKitsPromise) {
    return inFlightKitsPromise;
  }

  inFlightKitsPromise = fetchKitsFromApi()
    .then((kits) => {
      writeLocalCache(kits);
      return kits;
    })
    .finally(() => {
      inFlightKitsPromise = null;
    });

  return inFlightKitsPromise;
}

function searchKitsSync(query) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];

  const kits = getCachedKitsSync({ allowStale: true }) || [];
  return kits.filter((item) => {
    const title = (item?.title || "").toLowerCase();
    const description = (item?.description || "").toLowerCase();
    const slug = (item?.slug || "").toLowerCase();
    return title.includes(q) || description.includes(q) || slug.includes(q);
  });
}

async function searchKits(query, options = {}) {
  const q = (query || "").trim().toLowerCase();
  if (!q) return [];

  const kits = await getAllKits(options);
  return kits.filter((item) => {
    const title = (item?.title || "").toLowerCase();
    const description = (item?.description || "").toLowerCase();
    const slug = (item?.slug || "").toLowerCase();
    return title.includes(q) || description.includes(q) || slug.includes(q);
  });
}

function getKitBySlugSync(slug) {
  const normalizedSlug = (slug || "").trim();
  if (!normalizedSlug) return null;

  const kits = getCachedKitsSync({ allowStale: true }) || [];
  return kits.find((item) => item.slug === normalizedSlug) || null;
}

async function getKitBySlug(slug, options = {}) {
  const normalizedSlug = (slug || "").trim();
  if (!normalizedSlug) return null;

  const kits = await getAllKits(options);
  return kits.find((item) => item.slug === normalizedSlug) || null;
}

window.DrumkitDataStore = {
  getCachedKitsSync,
  getAllKits,
  searchKitsSync,
  searchKits,
  getKitBySlugSync,
  getKitBySlug,
  DRUMKIT_CACHE_TTL_MS,
};
