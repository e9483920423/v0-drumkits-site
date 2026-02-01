async function loadFooter() {
  const footerPlaceholder = document.getElementById("footer-placeholder")
  if (!footerPlaceholder) return

  try {
    const footerPath = "/footer.html"

    const response = await fetch(footerPath)
    if (!response.ok) throw new Error("Failed to load footer")

    const footerContent = await response.text()
    footerPlaceholder.innerHTML = footerContent
  } catch (error) {
    console.error("Error loading footer:", error)
  }
}

document.addEventListener("DOMContentLoaded", loadFooter)
