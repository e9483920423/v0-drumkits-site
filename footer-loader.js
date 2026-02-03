async function loadFooter() {
  const footer = document.querySelector("footer")
  if (!footer) return

  try {
    const footerPath = "/footer.html"

    const response = await fetch(footerPath)
    if (!response.ok) throw new Error("Failed to load footer")

    const footerContent = await response.text()
    footer.innerHTML = footerContent
  } catch (error) {
    console.error("Error loading footer:", error)
  }
}

document.addEventListener("DOMContentLoaded", loadFooter)
