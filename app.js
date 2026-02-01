// Supabase configuration
const SUPABASE_URL = "https://jdianavibwqbxgjkzniq.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaWFuYXZpYndxYnhnamtabmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc2NjQ2NTgsImV4cCI6MjA1MzI0MDY1OH0.sYBk_X-LyGBHF8hYjFzpfpGDiuKSNBHazfmb8_VVdbc"

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
    const response = await fetch(`${SUPABASE_URL}/rest/v1/drum_kits?select=*&order=id.asc`, {
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
      }
    })
    if (!response.ok) throw new Error("Failed to load downloads")

    const data = await response.json()
    // Map Supabase column names to expected format
    allDownloads = data.map(item => ({
      id: item.id,
      slug: item.slug,
      title: item.title,
      description: item.description,
      fileSize: item.file_size,
      updateDate: item.update_date,
      download: item.download,
      category: item.category,
      src: item.src
    }))
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
        <a href="/${item.slug}" class="download-btn">View Details</a>
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
