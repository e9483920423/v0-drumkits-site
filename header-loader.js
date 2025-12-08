async function loadHeader() {
  const headerPlaceholder = document.getElementById("header-placeholder")
  if (!headerPlaceholder) return

  try {
    // Determine the correct path based on current location
    const isKitPage = window.location.pathname.includes("kit-page")
    const headerPath = isKitPage ? "../header.html" : "header.html"

    const response = await fetch(headerPath)
    if (!response.ok) throw new Error("Failed to load header")

    const headerContent = await response.text()
    headerPlaceholder.innerHTML = headerContent
  } catch (error) {
    console.error("Error loading header:", error)
  }
}

document.addEventListener("DOMContentLoaded", loadHeader)
