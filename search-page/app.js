//Public Development URL
function getItemImageUrl(id) {
  const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev"
  return `${PUB_URL}/${id}.jpg`
}

const ITEMS_PER_PAGE = 6

let searchResults = []
let currentPage = 1
let searchQuery = ""

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

  // Update page title and search query display
  const queryTitle = document.getElementById("searchQueryTitle")
  const queryText = document.getElementById("searchQueryText")
  
  if (queryTitle) {
    queryTitle.textContent = `Search Results for "${escapeHtml(searchQuery)}"`
  }
  
  if (queryText) {
    queryText.textContent = `Found results matching your search...`
  }

  try {
    const { data, error } = await supabaseClient
      .from('drum_kits')
      .select('*')
      .ilike('title', `%${searchQuery}%`)
      .order('id', { ascending: false })

    if (error) throw error

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

function showNoResults() {
  const list = document.getElementById("searchResultsList")
  const queryText = document.getElementById("searchQueryText")
  
  if (queryText) {
    queryText.textContent = `No results found for "${escapeHtml(searchQuery)}"`
  }
  
  list.innerHTML = '<p class="loading">No kits found matching your search. Try different keywords.</p>'
  
  const paginationContainer = document.getElementById("paginationContainer")
  if (paginationContainer) {
    paginationContainer.innerHTML = ""
  }
}

function showError(message) {
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
  const list = document.getElementById("searchResultsList")
  list.innerHTML = ""

  if (results.length === 0) {
    list.innerHTML = '<p class="loading">No results available.</p>'
    return
  }

  results.forEach((item) => {
    const card = document.createElement("div")
    card.className = "download-item"

    const imageUrl = getItemImageUrl(item.id)

    card.innerHTML = `
  <div class="item-image">
    <img src="${imageUrl}" alt="${escapeHtml(item.title)}" loading="lazy"
         onerror="this.src='/errors/default.jpg'">
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
      window.scrollTo({ top: 0, behavior: "smooth" })
    }
  }
  container.appendChild(nextBtn)
}

function escapeHtml(text) {
  // Handle null, undefined, or non-string values
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

document.addEventListener("DOMContentLoaded", performSearch)
