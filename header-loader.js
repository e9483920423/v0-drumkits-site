const HEADER_CACHE_KEY = "drumkits:header:v1"

function readCachedHeader() {
  try {
    const raw = sessionStorage.getItem(HEADER_CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed || typeof parsed.html !== "string") return null
    return parsed.html
  } catch {
    return null
  }
}

function writeCachedHeader(html) {
  try {
    sessionStorage.setItem(
      HEADER_CACHE_KEY,
      JSON.stringify({ html, timestamp: Date.now() })
    )
  } catch {
  }
}

function renderHeaderContent(headerContent) {
  const headerPlaceholder = document.getElementById("header-placeholder")
  if (!headerPlaceholder || !headerContent) return
  headerPlaceholder.innerHTML = headerContent
}

async function loadHeader() {
  const cachedHeader = readCachedHeader()
  if (cachedHeader) {
    renderHeaderContent(cachedHeader)
  }

  try {
    const headerPath = "/header.html"

    const response = await fetch(headerPath)
    if (!response.ok) throw new Error("Failed to load header")

    const headerContent = await response.text()
    if (!cachedHeader || cachedHeader !== headerContent) {
      renderHeaderContent(headerContent)
      writeCachedHeader(headerContent)
    }
  } catch (error) {
    console.error("Error loading header:", error)
  }
}

function blockRightClick() {
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault()
  })
}

blockRightClick()

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", loadHeader)
} else {
  loadHeader()
}
