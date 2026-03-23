const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev"
const IMAGE_EXTENSIONS = ["jpg", "png", "webp", "avif", "jpeg", "gif"]
const STORAGE_KEY = 'image_url_cache_v1'
const imageUrlCache = new Map()

try {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
    const parsed = JSON.parse(stored)
    Object.entries(parsed).forEach(([k, v]) => imageUrlCache.set(k, v))
  }
} catch (e) {
  console.warn("Failed to load image cache:", e)
}

function saveImageCache() {
  try {
    const obj = Object.fromEntries(imageUrlCache.entries())
    localStorage.setItem(STORAGE_KEY, JSON.stringify(obj))
  } catch (e) {
    console.warn("Failed to save image cache:", e)
  }
}

function resolveItemImageUrl(id) {
  const isKits4Beats = document.cookie.includes('db_source=kits4beats')
  if (isKits4Beats) {
    return Promise.resolve("/errors/default.jpg")
  }

  const key = String(id)
  const cached = imageUrlCache.get(key)
  if (cached) return Promise.resolve(cached)

  const promises = IMAGE_EXTENSIONS.map(ext => {
    return new Promise((resolve, reject) => {
      const url = `${PUB_URL}/${key}.${ext}`
      const probe = new Image()
      probe.onload = () => resolve(url)
      probe.onerror = reject
      probe.src = url
    })
  })

  return Promise.any(promises)
    .then(validUrl => {
      imageUrlCache.set(key, validUrl)
      saveImageCache()
      return validUrl
    })
    .catch(() => {
      const fallback = "/errors/default.jpg"
      imageUrlCache.set(key, fallback)
      saveImageCache()
      return fallback
    })
}

const ITEMS_PER_PAGE = 6
const ITEMS_PER_CHUNK = 30

let allDownloads = []
let totalItemsCount = 0
const fetchedOffsets = new Set()

const pagination = new Pagination({
  containerId: "paginationContainer",
  contentContainerId: "downloadsList",
  itemsPerPage: ITEMS_PER_PAGE,
  paginationLimit: 6,
  onPageChange: (page) => loadDownloads(page)
});

const preloadedImageIds = new Set()
const cardCache = new Map()

function preloadPageImages(page) {
  if (!totalItemsCount) return;
  const totalPages = Math.ceil(totalItemsCount / ITEMS_PER_PAGE);
  if (!Number.isFinite(page) || page < 1 || page > totalPages) return;

  const startIdx = (page - 1) * ITEMS_PER_PAGE;
  const endIdx = startIdx + ITEMS_PER_PAGE;
  
  const items = allDownloads.slice(startIdx, endIdx);

  for (const item of items) {
    if (!item || item.id == null) continue;
    const id = String(item.id);
    if (preloadedImageIds.has(id)) continue;
    preloadedImageIds.add(id);

    if (!cardCache.has(item.id)) {
      cardCache.set(item.id, buildCard(item));
    }
  }
}

function setListLoading(isLoading) {
  const list = document.getElementById("downloadsList")
  if (!list) return
  if (isLoading) list.classList.add("is-loading")
  else list.classList.remove("is-loading")
}



async function loadDownloads(page = 1) {
  try {
    page = parseInt(page) || 1;
    
    const chunkIndex = Math.floor((page - 1) * ITEMS_PER_PAGE / ITEMS_PER_CHUNK);
    const offset = chunkIndex * ITEMS_PER_CHUNK;
    
    if (!fetchedOffsets.has(offset)) {
      setListLoading(true);
      const timestamp = Date.now().toString();
      const signature = await DrumkitUtils.generateSignature(timestamp);
      
      const response = await fetch(`/api/kits?limit=${ITEMS_PER_CHUNK}&offset=${offset}`, {
        headers: { 
          'X-Request-Signature': signature,
          'X-Request-Timestamp': timestamp
        }
      });
      
      if (!response.ok) throw new Error('Network response was not ok');
      
      const { data, total } = await response.json();
      totalItemsCount = total;
      
      data.forEach((item, index) => {
        allDownloads[offset + index] = item;
      });
      
      fetchedOffsets.add(offset);
      pagination.setTotalItems(total);
    }

    pagination.currentPage = page;
    renderCurrentPage(page);
    pagination.render(); 
    
    const pageInChunk = ((page - 1) * ITEMS_PER_PAGE % ITEMS_PER_CHUNK) / ITEMS_PER_PAGE;
    if (pageInChunk >= 4) {
      const nextOffset = offset + ITEMS_PER_CHUNK;
      if (nextOffset < totalItemsCount && !fetchedOffsets.has(nextOffset)) {
        loadChunkInBackground(nextOffset);
      }
    }

  } catch (error) {
    console.error("Error loading downloads:", error);
    const list = document.getElementById("downloadsList");
    if (list) {
      list.innerHTML = '<p class="loading">Failed to load downloads. Please refresh the page.</p>';
    }
  } finally {
    setListLoading(false);
  }
}

async function loadChunkInBackground(offset) {
  if (fetchedOffsets.has(offset)) return;
  try {
    const timestamp = Date.now().toString();
    const signature = await DrumkitUtils.generateSignature(timestamp);
    const response = await fetch(`/api/kits?limit=${ITEMS_PER_CHUNK}&offset=${offset}`, {
      headers: { 
        'X-Request-Signature': signature,
        'X-Request-Timestamp': timestamp
      }
    });
    if (response.ok) {
      const { data } = await response.json();
      data.forEach((item, index) => {
        allDownloads[offset + index] = item;
      });
      fetchedOffsets.add(offset);
      preloadPageImages(Math.floor(offset / ITEMS_PER_PAGE) + 1);
    }
  } catch (e) {
    console.warn("Background fetch failed:", e);
  }
}

function renderCurrentPage(page = 1) {
  const list = document.getElementById("downloadsList")
  let prevMinHeight = ""
  if (list) {
    prevMinHeight = list.style.minHeight || ""
    const h = list.getBoundingClientRect().height
    if (h > 0) list.style.minHeight = `${Math.ceil(h)}px`
  }

  setListLoading(true)

  const startIdx = (page - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const pageItems = allDownloads.slice(startIdx, endIdx)

  renderDownloads(pageItems)

  preloadPageImages(page + 1)
  preloadPageImages(page + 2)
  preloadPageImages(page + 3)

  requestAnimationFrame(() => {
    setListLoading(false)
    if (list) list.style.minHeight = prevMinHeight
  })
}

function createSmartImage(id) {
  const img = document.createElement("img")
  img.alt = ""
  img.loading = "eager"
  img.decoding = "async"
  img.width = 320
  img.height = 320
  img.className = "smart-image"
  img.src = "/errors/default.jpg"

  resolveItemImageUrl(id).then((url) => { 
    img.src = url
    img.onload = () => img.classList.add("loaded")
    if (img.complete) img.classList.add("loaded")
  })
  return img
}

function buildCard(item) {
  const card = document.createElement("div")
  card.className = "download-item reveal"
  const imageWrap = document.createElement("div")
  imageWrap.className = "item-image"
  const img = createSmartImage(item.id)
  imageWrap.appendChild(img)
  card.addEventListener("mousemove", (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    const moveX = (x - 0.5) * 20; 
    const moveY = (y - 0.5) * 20;

    img.style.transform = `scale(1.1) translate(${moveX}px, ${moveY}px)`;
  });

  card.addEventListener("mouseleave", () => {
    img.style.transform = `scale(1) translate(0, 0)`;
  });
  if (item.category) {
    const badge = document.createElement("span")
    badge.className = "category-badge"
    badge.textContent = item.category
    imageWrap.appendChild(badge)
  }

  const content = document.createElement("div")
  content.className = "item-content"
  content.innerHTML = `
    <h3 class="item-title">${escapeHtml(item.title)}</h3>
    ${item.description && item.description !== "null"
      ? `<p class="item-description">${escapeHtml(item.description)}</p>`
      : ''
    }
    <a href="/${item.slug}" class="download-btn">View Details</a>
  `

  card.appendChild(imageWrap)
  card.appendChild(content)
  return card
}

function renderDownloads(downloads) {
  const list = document.getElementById("downloadsList")
  if (!list) return

  if (!downloads || downloads.length === 0) {
    list.innerHTML = '<p class="loading">No downloads available.</p>'
    return
  }

  const frag = document.createDocumentFragment()

  downloads.forEach((item, index) => {
    let card = cardCache.get(item.id);
    if (!card) {
      card = buildCard(item);
      cardCache.set(item.id, card);
    }
    
    card.classList.remove('reveal');
    void card.offsetWidth;
    card.classList.add('reveal');
    card.style.animationDelay = `${index * 0.05}s`;
    
    frag.appendChild(card)
  })

  list.replaceChildren(frag)
}



function escapeHtml(text) {
  if (text == null) return ''
  if (typeof text !== 'string') text = String(text)
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

document.addEventListener("DOMContentLoaded", loadDownloads)
