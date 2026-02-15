async function loadHeader() {
  const headerPlaceholder = document.getElementById("header-placeholder")
  if (!headerPlaceholder) return

  try {
    const headerPath = "/header.html"

    const response = await fetch(headerPath)
    if (!response.ok) throw new Error("Failed to load header")

    const headerContent = await response.text()
    headerPlaceholder.innerHTML = headerContent
  } catch (error) {
    console.error("Error loading header:", error)
  }
}

function blockRightClick() {
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault()
  })
}

document.addEventListener("DOMContentLoaded", () => {
  blockRightClick()
  loadHeader()
})
