let allDownloads = []

function getItemImageUrl(id) {
  const PUB_URL = "https://pub-f33f60358a234f7f8555b2ef8b758e15.r2.dev"
  return `${PUB_URL}/${id}.jpg`
}

async function loadDownloads() {
  try {
    const { data, error } = await supabaseClient
      .from('drum_kits')
      .select('*')
      .order('id', { ascending: false })

    if (error) throw error

    allDownloads = data || []
    displayItem()
  } catch (error) {
    console.error("Error loading downloads:", error)
    showError("Failed to load item data. Please try again.")
  }
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
    showError(`Item "${slug}" not found. Please return to the home page.`)
    return
  }

  const imageUrl = getItemImageUrl(item.id)

  const mainContent = document.getElementById("mainContent")
  mainContent.innerHTML = `
    <div class="item-hero">
      <div class="item-image-wrapper">
        <img src="${imageUrl}" alt="${escapeHtml(item.title)}" onerror="this.src='/errors/default.jpg'">
      </div>
      <div class="item-details">
        <h1 class="item-title">${escapeHtml(item.title)}</h1>
        <p class="item-description">${escapeHtml(item.description)}</p>
        <div class="item-specs">
          <div class="spec-row">
            <span class="spec-label">File Size:</span>
            <span class="spec-value">${escapeHtml(item.file_size ?? 'N/A')}</span>
          </div>
          ${item.update_date ? `
          <div class="spec-row">
            <span class="spec-label">Last Updated:</span>
            <span class="spec-value">${escapeHtml(item.update_date)}</span>
          </div>
          ` : ''}
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
  if (text == null) return ''
  if (typeof text !== 'string') {
    text = String(text)
  }
  const map = {
    "&": "&",
    "<": "<",
    ">": ">",
    '"': """,
    "'": "&#039;",
  }
  return text.replace(/[&<>"']/g, (m) => map[m])
}

document.addEventListener("DOMContentLoaded", loadDownloads)