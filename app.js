//Public Development URL
function getItemImageUrl(id) {
  const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev"
  return `${PUB_URL}/${id}.jpg`
}

const ITEMS_PER_PAGE = 6

let allDownloads = []
let currentPage = 1

async function loadDownloads() {
  try {
    const response = await fetch("dl-data/dl-data.json")
    if (!response.ok) throw new Error("Failed to load downloads")

    allDownloads = await response.json()
    currentPage = 1
    renderCurrentPage()
    renderPagination()
  } catch (error) {
    console.error("Error loading downloads:", error)
    const list = document.getElementById("downloadsList")
    list.innerHTML = '<p class="loading">Failed to load downloads. Please refresh the page.</p>'
  }
}

function renderCurrentPage() {
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
  const endIdx = startIdx + ITEMS_PER_PAGE
  const pageItems = allDownloads.slice(startIdx, endIdx)

  renderDownloads(pageItems)
}

function renderDownloads(downloads) {
  const list = document.getElementById("downloadsList")
  list.innerHTML = ""

  if (downloads.length === 0) {
    list.innerHTML = '<p class="loading">No downloads available.</p>'
    return
  }

  downloads.forEach((item) => {
    const card = document.createElement("div")
    card.className = "download-item"

    const imageUrl = getItemImageUrl(item.id)

    card.innerHTML = `
      <div class="item-image">
        <img src="${imageUrl}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='/placeholder.jpg'">
      </div>
      <div class="item-content">
        <h3 class="item-title">${escapeHtml(item.title)}</h3>
        <p class="item-description">${escapeHtml(item.description)}</p>
        <div class="item-meta">
          <div class="meta-row">
            <span>File Size:</span>
            <span>${escapeHtml(item.fileSize)}</span>
          </div>
          <div class="meta-row">
            <span>Updated:</span>
            <span>${escapeHtml(item.updateDate)}</span>
          </div>
        </div>
        <a href="${encodeURIComponent(item.slug)}" class="download-btn">View Details</a>
      </div>
    `

    list.appendChild(card)
  })
}

function renderPagination() {
  const totalPages = Math.ceil(allDownloads.length / ITEMS_PER_PAGE)
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
