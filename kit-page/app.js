function getItemImageUrl(id) {
  const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev"
  return `${PUB_URL}/${id}.jpg`
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

function setLoading() {
  const mainContent = document.getElementById("mainContent")
  if (!mainContent) return

  mainContent.innerHTML = `
    <div class="item-hero">
      <div class="item-image-wrapper">
        <img src="/errors/default.jpg" alt="Loading…" width="420" height="420">
      </div>
      <div class="item-details">
        <h1 class="item-title">Loading…</h1>
        <p class="item-description">Please wait.</p>
      </div>
    </div>
  `
}

function createSmartImage(imageUrl, altText) {
  const img = document.createElement("img")
  img.src = "/errors/default.jpg"
  img.alt = altText || "Kit"
  img.loading = "eager"
  img.decoding = "async"
  img.width = 420
  img.height = 420

  const probe = new Image()
  probe.decoding = "async"
  probe.onload = () => {
    img.src = imageUrl
  }
  probe.onerror = () => {
  }
  probe.src = imageUrl

  return img
}

function isSafeUrl(url) {
  try {
    const u = new URL(url, window.location.origin)
    return u.protocol === "https:" || u.protocol === "http:"
  } catch {
    return false
  }
}

async function loadKitBySlug() {
  setLoading()
  let slug = getSlugFromUrl()
  if (!slug) {
    const params = new URLSearchParams(window.location.search)
    slug = params.get("slug")
  }

  if (!slug) {
    showError("No item specified. Please return to the home page.")
    return
  }

  const newUrl = `${window.location.origin}/${encodeURIComponent(slug)}`
  window.history.replaceState({}, "", newUrl)

  try {
    const { data, error } = await supabaseClient
      .from("drum_kits")
      .select("id,slug,title,description,download,file_size,update_date")
      .eq("slug", slug)
      .single()

    if (error) throw error
    if (!data) throw new Error("Not found")

    renderKit(data)
  } catch (error) {
    console.error("Error loading item:", error)
    showError(`Item "${slug}" not found. Please return to the home page.`)
  }
}

function renderKit(item) {
  const mainContent = document.getElementById("mainContent")
  if (!mainContent) return

  mainContent.innerHTML = ""

  const hero = document.createElement("div")
  hero.className = "item-hero"

  const imageWrap = document.createElement("div")
  imageWrap.className = "item-image-wrapper"

  const imageUrl = getItemImageUrl(item.id)
  imageWrap.appendChild(createSmartImage(imageUrl, item.title))

  const details = document.createElement("div")
  details.className = "item-details"

  const title = document.createElement("h1")
  title.className = "item-title"
  title.textContent = item.title || "Untitled"

  const desc = document.createElement("p")
  desc.className = "item-description"
  desc.textContent =
    item.description && item.description !== "null"
      ? item.description
      : "No description provided."

  const specs = document.createElement("div")
  specs.className = "item-specs"

  const sizeRow = document.createElement("div")
  sizeRow.className = "spec-row"

  const sizeLabel = document.createElement("span")
  sizeLabel.className = "spec-label"
  sizeLabel.textContent = "File Size:"

  const sizeValue = document.createElement("span")
  sizeValue.className = "spec-value"
  sizeValue.textContent = item.file_size ?? "N/A"

  sizeRow.appendChild(sizeLabel)
  sizeRow.appendChild(sizeValue)
  specs.appendChild(sizeRow)

  if (item.update_date) {
    const updateRow = document.createElement("div")
    updateRow.className = "spec-row"

    const updateLabel = document.createElement("span")
    updateLabel.className = "spec-label"
    updateLabel.textContent = "Last Updated:"

    const updateValue = document.createElement("span")
    updateValue.className = "spec-value"
    updateValue.textContent = item.update_date

    updateRow.appendChild(updateLabel)
    updateRow.appendChild(updateValue)
    specs.appendChild(updateRow)
  }

  const actions = document.createElement("div")
  actions.className = "action-buttons"

  const downloadBtn = document.createElement("a")
  downloadBtn.className = "btn download-btn"
  downloadBtn.textContent = "Download Now"
  downloadBtn.target = "_blank"
  downloadBtn.rel = "noopener noreferrer"

  if (item.download && isSafeUrl(item.download)) {
    downloadBtn.href = item.download
  } else {
    downloadBtn.href = "#"
    downloadBtn.textContent = "Download Unavailable"
    downloadBtn.classList.add("disabled")
    downloadBtn.onclick = (e) => e.preventDefault()
  }

  const backBtn = document.createElement("a")
  backBtn.className = "btn back-btn"
  backBtn.href = "/"
  backBtn.textContent = "← Back to Collection"

  actions.appendChild(downloadBtn)
  actions.appendChild(backBtn)

  details.appendChild(title)
  details.appendChild(desc)
  details.appendChild(specs)
  details.appendChild(actions)

  hero.appendChild(imageWrap)
  hero.appendChild(details)

  mainContent.appendChild(hero)
}

function showError(message) {
  const mainContent = document.getElementById("mainContent")
  if (!mainContent) return

  mainContent.innerHTML = `
    <div class="error-message">
      <p>${escapeHtml(message)}</p>
      <p style="margin-top: 1rem;"><a href="/">← Return to home</a></p>
    </div>
  `
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

document.addEventListener("DOMContentLoaded", loadKitBySlug)
