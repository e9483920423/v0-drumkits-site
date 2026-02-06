function getItemImageUrl(id) {
  const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev"
  return `${PUB_URL}/${id}.jpg`
}

const ITEMS_PER_PAGE = 6
const PAGINATION_LIMIT = 6 

let allDownloads = []
let currentPage = 1


let expandLeft = false
let expandRight = false
function getPaginationRange(current, total, limit = PAGINATION_LIMIT) {
  if (total <= limit) {
    const all = []
    for (let i = 1; i <= total; i++) all.push(i)
    return { pages: all, showLeftDots: false, showRightDots: false, showFirst: false, showLast: false }
  }

  const windowSize = Math.max(1, limit - 2)
  const half = Math.floor(windowSize / 2)

  let start = current - half
  let end = current + (windowSize - half - 1)
  if (start < 2) {
    start = 2
    end = start + windowSize - 1
  }
  if (end > total - 1) {
    end = total - 1
    start = end - windowSize + 1
  }

  const pages = []
  for (let i = start; i <= end; i++) pages.push(i)

  return {
    pages,
    showFirst: true,
    showLast: true,
    showLeftDots: start > 2,
    showRightDots: end < total - 1,
  }
}

async function loadDownloads() {
  try {
    const { data, error } = await supabaseClient
      .from('drum_kits')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error

    allDownloads = data || []
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
    `
    list.appendChild(card)
  })
}

function renderPagination() {
  const totalPages = Math.ceil(allDownloads.length / ITEMS_PER_PAGE)
  const container = document.getElementById("paginationContainer")

  if (!container) return

  if (totalPages <= 1) {
    container.innerHTML = ""
    return
  }

  currentPage = Math.min(Math.max(currentPage, 1), totalPages)

  container.innerHTML = ""

  const goTo = (page) => {
    if (page < 1 || page > totalPages) return
    currentPage = page
    expandLeft = false
    expandRight = false
    renderCurrentPage()
    renderPagination()
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const makeBtn = (label, page, { active = false, disabled = false } = {}) => {
    const btn = document.createElement("button")
    btn.className = "pagination-btn"
    if (active) btn.classList.add("active")
    btn.textContent = label
    btn.disabled = disabled
    btn.onclick = () => goTo(page)
    return btn
  }

  const makeDotsBtn = (side, from, to) => {
    const btn = document.createElement("button")
    btn.type = "button"
    btn.className = "pagination-btn pagination-dots-btn"
    btn.textContent = "…"
    btn.title = "Show more pages"

    btn.onclick = () => {
      if (side === "left") expandLeft = !expandLeft
      if (side === "right") expandRight = !expandRight
      renderPagination()
    }

    if (from > to) btn.disabled = true

    return btn
  }

  container.appendChild(
    makeBtn("← Previous", currentPage - 1, { disabled: currentPage === 1 })
  )

  const range = getPaginationRange(currentPage, totalPages, PAGINATION_LIMIT)

  if (range.showFirst) {
    container.appendChild(makeBtn("1", 1, { active: currentPage === 1 }))
  }

  if (range.showLeftDots) {
    if (expandLeft) {
      const firstVisible = range.pages[0]
      for (let p = 2; p < firstVisible; p++) {
        container.appendChild(makeBtn(String(p), p, { active: p === currentPage }))
      }
      // clicking dots again collapses
      container.appendChild(makeDotsBtn("left", 2, range.pages[0] - 1))
    } else {
      container.appendChild(makeDotsBtn("left", 2, range.pages[0] - 1))
    }
  }

  range.pages.forEach((p) => {
    container.appendChild(makeBtn(String(p), p, { active: p === currentPage }))
  })

  if (range.showRightDots) {
    const lastVisible = range.pages[range.pages.length - 1]

    if (expandRight) {
      container.appendChild(makeDotsBtn("right", lastVisible + 1, totalPages - 1))

      for (let p = lastVisible + 1; p <= totalPages - 1; p++) {
        container.appendChild(makeBtn(String(p), p, { active: p === currentPage }))
      }
    } else {
      container.appendChild(makeDotsBtn("right", lastVisible + 1, totalPages - 1))
    }
  }

  if (range.showLast) {
    container.appendChild(
      makeBtn(String(totalPages), totalPages, { active: currentPage === totalPages })
    )
  }
  container.appendChild(
    makeBtn("Next →", currentPage + 1, { disabled: currentPage === totalPages })
  )
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
