const ITEMS_PER_PAGE = 6
const SEARCH_PAGE_STATE_KEY = "drumkits:search:state:v1"

let searchResults = []
let currentPage = 1
let searchQuery = ""

function readSavedSearchState() {
  try {
    const raw = sessionStorage.getItem(SEARCH_PAGE_STATE_KEY)
    if (!raw) return { query: "", page: 1 }

    const parsed = JSON.parse(raw)
    const page = Number(parsed?.page)
    return {
      query: typeof parsed?.query === "string" ? parsed.query : "",
      page: Number.isFinite(page) && page > 0 ? Math.floor(page) : 1,
    }
  } catch {
    return { query: "", page: 1 }
  }
}

function saveSearchState() {
  try {
    sessionStorage.setItem(
      SEARCH_PAGE_STATE_KEY,
      JSON.stringify({ query: searchQuery, page: currentPage })
    )
  } catch {
  }
}

function clampCurrentPage(totalPages) {
  currentPage = Math.min(Math.max(currentPage, 1), Math.max(totalPages, 1))
}

function renderSearchView() {
  if (!Array.isArray(searchResults) || searchResults.length === 0) {
    showNoResults()
    return
  }

  const totalPages = Math.ceil(searchResults.length / ITEMS_PER_PAGE)
  clampCurrentPage(totalPages)
  renderCurrentPage()
  renderPagination()
  saveSearchState()
}

function getSearchQueryFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get("q") || ""
}

async function performSearch() {
  const { searchKitsSync, searchKits } = window.DrumkitDataStore
  const { escapeHtml } = window.DrumkitUtils

  const saved = readSavedSearchState()
  const queryFromUrl = getSearchQueryFromUrl()
  searchQuery = queryFromUrl || saved.query
  
  if (!searchQuery) {
    showError("No search query provided.")
    return
  }

  currentPage = queryFromUrl === saved.query ? saved.page : 1

  // Update page title and search query display
  const queryTitle = document.getElementById("searchQueryTitle")
  const queryText = document.getElementById("searchQueryText")
  
  if (queryTitle) {
    queryTitle.textContent = `Search Results for "${escapeHtml(searchQuery)}"`
  }
  
  if (queryText) {
    queryText.textContent = `Found results matching your search...`
  }

  const cachedMatches = searchKitsSync(searchQuery)
  if (cachedMatches.length > 0) {
    searchResults = cachedMatches
    renderSearchView()
  }

  try {
    const freshMatches = await searchKits(searchQuery, { allowStale: true, revalidate: true })
    if (!cachedMatches || freshMatches !== cachedMatches) {
      searchResults = freshMatches
      if (!cachedMatches.length) {
        currentPage = queryFromUrl === saved.query ? saved.page : 1
      }
      renderSearchView()
    }
  } catch (error) {
    console.error("Error performing search:", error)
    if (!cachedMatches || cachedMatches.length === 0) {
      showError("Failed to perform search. Please try again.")
    }
  }
}

function showNoResults() {
  const { escapeHtml } = window.DrumkitUtils

  const list = document.getElementById("searchResultsList")
  const queryText = document.getElementById("searchQueryText")
  
  if (queryText) {
    queryText.textContent = `No results found for "${escapeHtml(searchQuery)}"`
  }

  saveSearchState()
  
  list.innerHTML = '<p class="loading">No kits found matching your search. Try different keywords.</p>'
  
  const paginationContainer = document.getElementById("paginationContainer")
  if (paginationContainer) {
    paginationContainer.innerHTML = ""
  }
}

function showError(message) {
  const { escapeHtml } = window.DrumkitUtils

  const list = document.getElementById("searchResultsList")
  const queryText = document.getElementById("searchQueryText")
  
  if (queryText) {
    queryText.textContent = ""
  }
  
  list.innerHTML = `<p class="loading">${escapeHtml(message)}</p>`
  
  const paginationContainer = document.getElementById("paginationContainer")
  if (paginationContainer) {
    paginationContainer.innerHTML = ""
  }
}

function renderCurrentPage() {
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const pageItems = searchResults.slice(startIdx, endIdx)

  renderResults(pageItems)
}

function renderResults(results) {
  const { getKitImageUrl, applyFallbackImage } = window.DrumkitAssets
  const { escapeHtml } = window.DrumkitUtils

  const list = document.getElementById("searchResultsList")
  list.innerHTML = ""

  if (results.length === 0) {
    list.innerHTML = '<p class="loading">No results available.</p>'
    return
  }

  results.forEach((item) => {
    const card = document.createElement("div")
    card.className = "download-item"

    const imageUrl = getKitImageUrl(item.id)

    card.innerHTML = `
  <div class="item-image">
    <img src="${imageUrl}" alt="${escapeHtml(item.title)}" loading="lazy">
  </div>
  <div class="item-content">
    <h3 class="item-title">${escapeHtml(item.title)}</h3>

    ${item.description && item.description !== "null"
      ? `<p class="item-description">${escapeHtml(item.description)}</p>`
      : ''
    }

    <a href="/${item.slug}" class="download-btn">View Details</a>
  </div>
  `;

    const img = card.querySelector("img")
    applyFallbackImage(img)
    list.appendChild(card)
  })
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
      saveSearchState()
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
      saveSearchState()
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
      saveSearchState()
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }
  container.appendChild(nextBtn)
}

document.addEventListener("DOMContentLoaded", performSearch)

window.addEventListener("drumkits:data-updated", () => {
  if (!searchQuery) return
  performSearch()
})
