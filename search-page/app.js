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
let currentPage = 1
let searchQuery = ""

document.addEventListener('DOMContentLoaded', () => {
  performSearch()
})

function getSearchQueryFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get("q") || ""
}

async function performSearch() {
  searchQuery = getSearchQueryFromUrl()
  
  if (!searchQuery) {
    showError("No search query provided.")
    return
  }

  const queryTitle = document.getElementById("searchQueryTitle")
  if (queryTitle) {
    queryTitle.textContent = `Search Results for "${escapeHtml(searchQuery)}"`
  }

  try {
    const response = await fetch(`/api/kits?search=${encodeURIComponent(searchQuery)}`)
    if (!response.ok) throw new Error('Network response was not ok')
    
    const { data } = await response.json()

    searchResults = data || []
    currentPage = 1
    
    if (searchResults.length === 0) {
      showNoResults()
    } else {
      renderCurrentPage()
      renderPagination()
    }
  } catch (error) {
    console.error("Error performing search:", error)
    showError("Failed to perform search. Please try again.")
  }
}

function renderCurrentPage() {
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const pageItems = searchResults.slice(startIdx, endIdx)
  renderResults(pageItems)
}

function renderResults(results) {
  const list = document.getElementById("searchResultsList")
  if (!list) return
  list.innerHTML = ""

  results.forEach((item) => {
    const card = document.createElement("div")
    card.className = "download-item"

    const imageWrap = document.createElement("div")
    imageWrap.className = "item-image"
    
    const img = document.createElement("img")
    img.alt = ""
    img.loading = "lazy"
    img.src = "/errors/default.jpg"
    resolveItemImageUrl(item.id).then(url => img.src = url)
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
      <h3 class="item-title">${escapeHtml(item.title)}</h3>
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
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }
  return String(text).replace(/[&<>"']/g, (m) => map[m])
}

function renderPagination() {
  const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE)
  const container = document.getElementById("paginationContainer")

  if (totalPages <= 1) {
    container.innerHTML = ""
    return
  }

  container.innerHTML = ""

  const prevBtn = document.createElement("button")
  prevBtn.className = "pagination-btn"
  prevBtn.textContent = "← Previous"
  prevBtn.disabled = currentPage === 1
  prevBtn.onclick = () => {
    if (currentPage > 1) {
      currentPage--
      renderCurrentPage()
      renderPagination()
      saveScrollPosition();
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }
  container.appendChild(prevBtn)

  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button")
    btn.className = "pagination-btn"
    if (i === currentPage) btn.classList.add("active")
    btn.textContent = i
    btn.onclick = () => {
      currentPage = i
      renderCurrentPage()
      renderPagination()
      saveScrollPosition();
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
    container.appendChild(btn)
  }

  const nextBtn = document.createElement("button")
  nextBtn.className = "pagination-btn"
  nextBtn.textContent = "Next →"
  nextBtn.disabled = currentPage === totalPages
  nextBtn.onclick = () => {
    if (currentPage < totalPages) {
      currentPage++
      renderCurrentPage()
      renderPagination()
      saveScrollPosition();
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }
  container.appendChild(nextBtn)
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

