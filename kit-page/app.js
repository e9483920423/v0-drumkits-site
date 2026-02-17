const TABLE_NAME = "drum_kits"
const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev"
const DEFAULT_IMAGE = "/errors/default.jpg"
const HILLTOP_DIRECT_URL =
  "https://amazing-population.com/b.3FVX0YP/3Hp/v/b/m/V/J/ZsDP0/2sNnzbYQylNvzjMa5oLUTlYr3GNPjhIw3-NsDaAN"
const HILLTOP_DELAY_MS = 5000

let allDownloads = []
let hilltopReadyAt = 0
let hilltopUnlocked = false

function escapeHtml(text) {
  if (text == null) return ""
  if (typeof text !== "string") text = String(text)
  const map = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

function isSafeUrl(url) {
  try {
    const u = new URL(url)
    return u.protocol === "https:" || u.protocol === "http:"
  } catch {
    return false
  }
}

function getItemImageUrl(id) {
  return `${PUB_URL}/${id}.jpg`
}

function createSmartImage(imageUrl, altText, width = 800, height = 800) {
  const img = document.createElement("img")
  img.alt = altText || ""
  img.loading = "eager"
  img.decoding = "async"
  img.style.visibility = "hidden"
  if (width) img.width = width
  if (height) img.height = height
  img.onload = () => {
    img.style.visibility = "visible"
  }
  img.onerror = () => {
    img.src = DEFAULT_IMAGE
    img.style.visibility = "visible"
  }
  img.src = imageUrl
  return img
}

function getSlugFromUrl() {
  let slug = window.location.pathname.split("/").filter(Boolean).pop()
  if (slug) {
    try {
      slug = decodeURIComponent(slug)
    } catch (e) {
      console.warn("Could not decode slug, using original:", slug)
    }
  }
  return slug
}

async function loadDownloads() {
  const mainContent = document.getElementById("mainContent")
  if (mainContent) mainContent.innerHTML = `<p class="loading">Loading…</p>`

  try {
    const { data, error } = await supabaseClient
      .from(TABLE_NAME)
      .select("*")
      .order("id", { ascending: false })

    if (error) throw error

    allDownloads = data || []
    displayItem()
  } catch (error) {
    console.error("Error loading downloads:", error)
    showError("Failed to load item data. Please try again.")
  }
}

function displayItem() {
  let slug = getSlugFromUrl()
  if (!slug) {
    const params = new URLSearchParams(window.location.search)
    slug = params.get("slug")
  }

  if (!slug) {
    showError("No item specified. Please return to the home page.")
    return
  }

  const newUrl = `${window.location.origin}/${slug}`
  window.history.replaceState({}, "", newUrl)

  const item = allDownloads.find((d) => d.slug === slug)

  if (!item) {
    showError(`Item "${escapeHtml(slug)}" not found. Please return to the home page.`)
    return
  }

  const mainContent = document.getElementById("mainContent")
  if (!mainContent) return

  const imageUrl = getItemImageUrl(item.id)
  const safeDownload = isSafeUrl(item.download) ? item.download : "#"

  hilltopReadyAt = 0
  hilltopUnlocked = false

  const heroDiv = document.createElement("div")
  heroDiv.className = "item-hero"

  const imageWrapper = document.createElement("div")
  imageWrapper.className = "item-image-wrapper"

  const heroImage = createSmartImage(imageUrl, item.title, 800, 800)
  imageWrapper.appendChild(heroImage)

  const detailsDiv = document.createElement("div")
  detailsDiv.className = "item-details"
  detailsDiv.innerHTML = `
    <h1 class="item-title">${escapeHtml(item.title)}</h1>
    <p class="item-description">${escapeHtml(item.description)}</p>
    <div class="item-specs">
      <div class="spec-row">
        <span class="spec-label">File Size:</span>
        <span class="spec-value">${escapeHtml(item.file_size ?? "N/A")}</span>
      </div>
      ${item.update_date ? `
      <div class="spec-row">
        <span class="spec-label">Last Updated:</span>
        <span class="spec-value">${escapeHtml(item.update_date)}</span>
      </div>
      ` : ""}
    </div>
    <div class="action-buttons">
      <div id="download-unlock" class="btn download-locked-btn" role="button" tabindex="0">🔒 Tap to Unlock Download</div>
      <a href="${escapeHtml(safeDownload)}" class="btn download-btn" target="_blank" rel="noopener noreferrer" style="display:none">Download Now</a>
      <a href="/" class="btn back-btn">← Back to Collection</a>
    </div>
  `

  heroDiv.appendChild(imageWrapper)
  heroDiv.appendChild(detailsDiv)
  mainContent.replaceChildren(heroDiv)

  renderRandomItems(item.slug)
}

function getRandomItems(excludeSlug, count = 4) {
  const pool = allDownloads.filter((d) => d && d.slug && d.slug !== excludeSlug)

  for (let i = pool.length - 1; i > 0; i--) {
    const rand = crypto.getRandomValues(new Uint32Array(1))[0]
    const j = Math.floor((rand / 0xFFFFFFFF) * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return pool.slice(0, count)
}

function renderRandomItems(currentSlug) {
  const section = document.getElementById("randomItemsSection")
  if (!section) return

  const randomItems = getRandomItems(currentSlug, 4)

  if (randomItems.length === 0) {
    section.innerHTML = ""
    return
  }

  const grid = document.createElement("div")
  grid.className = "random-items-grid"

  randomItems.forEach((item) => {
    const imageUrl = getItemImageUrl(item.id)

    const card = document.createElement("article")
    card.className = "random-item-card"

    const imageLink = document.createElement("a")
    imageLink.href = `/${encodeURIComponent(item.slug)}`
    imageLink.className = "random-item-image-wrap"
    imageLink.setAttribute("aria-label", `View ${escapeHtml(item.title)}`)

    const img = createSmartImage(imageUrl, item.title, 320, 320)
    imageLink.appendChild(img)

    const title = document.createElement("h3")
    title.className = "random-item-title"
    title.textContent = item.title

    const detailsLink = document.createElement("a")
    detailsLink.href = `/${encodeURIComponent(item.slug)}`
    detailsLink.className = "random-item-link"
    detailsLink.textContent = "View Details"

    card.appendChild(imageLink)
    card.appendChild(title)
    card.appendChild(detailsLink)
    grid.appendChild(card)
  })

  const inner = document.createElement("div")
  inner.className = "random-items-inner"
  inner.appendChild(grid)

  section.replaceChildren(inner)
}

function showError(message) {
  const mainContent = document.getElementById("mainContent")
  if (!mainContent) return

  mainContent.innerHTML = `
    <div class="error-message">
      <p>${escapeHtml(message)}</p>
      <p style="margin-top:1rem"><a href="/">← Return to home</a></p>
    </div>
  `

  const randomSection = document.getElementById("randomItemsSection")
  if (randomSection) randomSection.innerHTML = ""
}

function updateDownloadButtonText(button, message) {
  button.textContent = message
  button.disabled = true
  button.style.opacity = "0.7"
  button.style.cursor = "not-allowed"
}

function resetDownloadButton(button) {
  button.textContent = "Download Now"
  button.disabled = false
  button.style.opacity = ""
  button.style.cursor = ""
}

function showHilltopCountdownInButton(button) {
  const tick = () => {
    const left = Math.max(0, hilltopReadyAt - Date.now())
    if (left <= 0) {
      resetDownloadButton(button)
      return
    }
    const sec = Math.ceil(left / 1000)
    updateDownloadButtonText(button, `Please wait ${sec}s...`)
    requestAnimationFrame(tick)
  }
  requestAnimationFrame(tick)
}

document.addEventListener(
  "click",
  (e) => {
    const unlockBtn = e.target.closest("#download-unlock")
    if (unlockBtn) {
      e.preventDefault()

      const now = Date.now()

      if (hilltopReadyAt && now < hilltopReadyAt) {
        showHilltopCountdownInButton(unlockBtn)
        return
      }

      window.open(HILLTOP_DIRECT_URL, "_blank", "noopener,noreferrer")
      hilltopReadyAt = now + HILLTOP_DELAY_MS
      showHilltopCountdownInButton(unlockBtn)

      setTimeout(() => {
        const unlock = document.getElementById("download-unlock")
        const dlBtn = document.querySelector("a.download-btn")
        if (unlock) unlock.style.display = "none"
        if (dlBtn) dlBtn.style.display = ""
        hilltopUnlocked = true
      }, HILLTOP_DELAY_MS)

      return
    }

    const dlBtn = e.target.closest("a.download-btn")
    if (!dlBtn) return
  },
  true
)

document.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return
  const unlockBtn = e.target.closest("#download-unlock")
  if (unlockBtn) unlockBtn.click()
})

document.addEventListener("DOMContentLoaded", loadDownloads)
