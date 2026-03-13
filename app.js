const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev"
const IMAGE_EXTENSIONS = ["jpg", "png", "webp", "avif", "jpeg", "gif"]
const imageUrlCache = new Map()

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
      return validUrl
    })
    .catch(() => {
      const fallback = "/errors/default.jpg"
      imageUrlCache.set(key, fallback)
      return fallback
    })
}

const ITEMS_PER_PAGE = 6

let allDownloads = []

const pagination = new Pagination({
  containerId: "paginationContainer",
  itemsPerPage: ITEMS_PER_PAGE,
  paginationLimit: 6,
  onPageChange: (page) => {
    renderCurrentPage(page);
  }
});

const preloadedImageIds = new Set()
const cardCache = new Map()

function preloadPageImages(page) {
  const totalPages = Math.ceil(allDownloads.length / ITEMS_PER_PAGE)
  if (!Number.isFinite(page) || page < 1 || page > totalPages) return

  const startIdx = (page - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const items = allDownloads.slice(startIdx, endIdx)

  for (const item of items) {
    if (!item || item.id == null) continue
    const id = String(item.id)
    if (preloadedImageIds.has(id)) continue
    preloadedImageIds.add(id)

    if (!cardCache.has(item.id)) {
      cardCache.set(item.id, buildCard(item))
    }
  }
}

function setListLoading(isLoading) {
  const list = document.getElementById("downloadsList")
  if (!list) return
  if (isLoading) list.classList.add("is-loading")
  else list.classList.remove("is-loading")
}



async function loadDownloads() {
  try {
    const response = await fetch('/api/kits', {
      headers: { 'X-Internal-Request': 'true' }
    });
    if (!response.ok) throw new Error('Network response was not ok');
    
    const { data } = await response.json();

    allDownloads = data || []
    preloadedImageIds.clear()
    cardCache.clear()
    preloadPageImages(1)
    preloadPageImages(2)
    preloadPageImages(3)
    pagination.setTotalItems(allDownloads.length);
    renderCurrentPage(pagination.currentPage);
    pagination.render();
  } catch (error) {
    console.error("Error loading downloads:", error)
    const list = document.getElementById("downloadsList")
    if (list) {
      list.innerHTML = '<p class="loading">Failed to load downloads. Please refresh the page.</p>'
    }
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
  img.src = "/errors/default.jpg"

  resolveItemImageUrl(id).then((url) => { img.src = url })
  return img
}

function buildCard(item) {
  const card = document.createElement("div")
  card.className = "download-item"
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

  downloads.forEach((item) => {
    if (!cardCache.has(item.id)) {
      cardCache.set(item.id, buildCard(item))
    }
    frag.appendChild(cardCache.get(item.id))
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
