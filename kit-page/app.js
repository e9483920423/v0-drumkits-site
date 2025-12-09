let allDownloads = []

function getItemImageUrl(id) {
  const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev"
  return `${PUB_URL}/${id}.jpg`
}

async function loadDownloads() {
  try {
    const response = await fetch("../dl-data/dl-data.json")
    if (!response.ok) throw new Error("Failed to load downloads")
    allDownloads = await response.json()
    displayItem()
  } catch (error) {
    console.error("Error loading downloads:", error)
    showError("Failed to load item data. Please try again.")
  }
}

function displayItem() {
  const params = new URLSearchParams(window.location.search)
  const slug = params.get("slug")

  if (!slug) {
    showError("No item specified. Please return to the home page.")
    return
  }

  const item = allDownloads.find((d) => d.slug === slug)

  if (!item) {
    showError(`Item "${slug}" not found. Please return to the home page.`)
    return
  }

  const imageUrl = getItemImageUrl(item.id)

  const mainContent = document.getElementById("mainContent")
  mainContent.innerHTML = `
    <div class="item-hero">
      <div class="item-image-wrapper">
        <img src="${imageUrl}" alt="${escapeHtml(item.title)}">
      </div>
      <div class="item-details">
        <h1 class="item-title">${escapeHtml(item.title)}</h1>
        <p class="item-description">${escapeHtml(item.description)}</p>
        <div class="item-specs">
          <div class="spec-row">
            <span class="spec-label">File Size:</span>
            <span class="spec-value">${escapeHtml(item.fileSize)}</span>
          </div>
          <div class="spec-row">
            <span class="spec-label">Last Updated:</span>
            <span class="spec-value">${escapeHtml(item.updateDate)}</span>
          </div>
        </div>
        <div class="action-buttons">
          <a href="${escapeHtml(item.download)}" class="btn download-btn" target="_blank">Download Now</a>
          <a href="/" class="btn back-btn">← Back to Collection</a>
        </div>
      </div>
    </div>
  `
}

function showError(message) {
  const mainContent = document.getElementById("mainContent")
  mainContent.innerHTML = `
    <div class="error-message">
      <p>${escapeHtml(message)}</p>
      <p style="margin-top: 1rem;"><a href="/">← Return to home</a></p>
    </div>
  `
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
