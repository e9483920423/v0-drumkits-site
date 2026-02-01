// Supabase configuration
const SUPABASE_URL = "https://jdianavibwqbxgjkzniq.supabase.co"
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpkaWFuYXZpYndxYnhnamt6bmlxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUyMjM4NTEsImV4cCI6MjA4MDc5OTg1MX0.qafIxFwH1w0c6zWb69G6226pyfUPINx7I4_idyiGPs8"

let allDownloads = []

function getItemImageUrl(id) {
  const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev"
  return `${PUB_URL}/${id}.jpg`
}

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
    displayItem()
  } catch (error) {
    console.error("Error loading downloads:", error)
    showError("Failed to load item data. Please try again.")
  }
}

function getSlugFromUrl() {
  // Get slug from path (last segment)
  let slug = window.location.pathname.split("/").filter(Boolean).pop()

  // Normalize the slug to handle any encoding issues
  if (slug) {
    try {
      slug = decodeURIComponent(slug)
    } catch (e) {
      // If decoding fails, use the original slug
      console.warn("Could not decode slug, using original:", slug)
    }
  }

  return slug
}

function displayItem() {
  // Get slug using improved extraction method
  let slug = getSlugFromUrl()

  // If slug is missing, try query string (old links)
  if (!slug) {
    const params = new URLSearchParams(window.location.search)
    slug = params.get("slug")
  }

  if (!slug) {
    showError("No item specified. Please return to the home page.")
    return
  }

  // Optional: clean URL in the browser
  const newUrl = `${window.location.origin}/${slug}`
  window.history.replaceState({}, "", newUrl)

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
