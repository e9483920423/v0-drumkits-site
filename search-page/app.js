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
let searchResults = []
let searchQuery = ""

const pagination = new Pagination({
  containerId: "paginationContainer",
  contentContainerId: "searchResultsList",
  itemsPerPage: ITEMS_PER_PAGE,
  paginationLimit: 6,
  onPageChange: (page) => performSearch(page)
});

document.addEventListener('DOMContentLoaded', () => {
  performSearch()
})

function getSearchQueryFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get("q") || ""
}

async function performSearch(page = 1) {
  page = parseInt(page) || 1;
  searchQuery = getSearchQueryFromUrl()
  
  if (!searchQuery) {
    showError("No search query provided.")
    return
  }

  const queryTitle = document.getElementById("searchQueryTitle")
  if (queryTitle) {
    queryTitle.textContent = `Search Results for "${DrumkitUtils.escapeHtml(searchQuery)}"`
  }

  try {
    const timestamp = Date.now().toString();
    const signature = await DrumkitUtils.generateSignature(timestamp);
    const limit = ITEMS_PER_PAGE;
    const offset = (page - 1) * limit;

    const response = await fetch(`/api/kits?search=${encodeURIComponent(searchQuery)}&limit=${limit}&offset=${offset}`, {
      headers: { 
        'X-Request-Signature': signature,
        'X-Request-Timestamp': timestamp
      }
    })
    if (!response.ok) throw new Error('Network response was not ok')
    
    const { data, total } = await response.json()

    searchResults = data || []
    if (searchResults.length === 0 && page === 1) {
      showNoResults()
    } else {
      pagination.setTotalItems(total);
      pagination.currentPage = page;
      renderCurrentPage(1); // Render the 1st (and only) chunk we fetched
      pagination.render();
    }
  } catch (error) {
    console.error("Error performing search:", error)
    showError("Failed to perform search. Please try again.")
  }
}

function renderCurrentPage() {
  renderResults(searchResults)
}

function renderResults(results) {
  const list = document.getElementById("searchResultsList")
  if (!list) return
  list.innerHTML = ""

  results.forEach((item, index) => {
    const card = document.createElement("div")
    card.className = "download-item reveal"
    card.style.animationDelay = `${index * 0.05}s`

    const imageWrap = document.createElement("div")
    imageWrap.className = "item-image"
    
    const img = document.createElement("img")
    img.alt = ""
    img.loading = "lazy"
    img.className = "smart-image"
    img.src = "/errors/default.jpg"
    
    resolveItemImageUrl(item.id).then(url => {
      img.src = url
      img.onload = () => img.classList.add("loaded")
      if (img.complete) img.classList.add("loaded")
    })
    
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

    const content = document.createElement("div")
    content.className = "item-content"
    content.innerHTML = `
      <h2 class="item-title">${escapeHtml(item.title)}</h2>
      ${item.description ? `<p class="item-description">${escapeHtml(item.description)}</p>` : ''}
      <a href="/${item.slug}" class="download-btn">View Details</a>
    `

    card.appendChild(imageWrap)
    card.appendChild(content)
    list.appendChild(card)
  })
}

function escapeHtml(text) {
  if (text == null) return ''
  if (typeof text !== 'string') {
    text = String(text)
  }
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

function showNoResults() {
  const list = document.getElementById("searchResultsList");
  if (list) {
    list.innerHTML = '<p class="loading">No results found.</p>';
  }
  const paginationContainer = document.getElementById("paginationContainer");
  if (paginationContainer) paginationContainer.innerHTML = '';
}

function showError(message) {
  const list = document.getElementById("searchResultsList");
  if (list) {
    list.innerHTML = `<p class="loading">${escapeHtml(message)}</p>`;
  }
  const paginationContainer = document.getElementById("paginationContainer");
  if (paginationContainer) paginationContainer.innerHTML = '';
}

