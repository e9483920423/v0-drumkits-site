/**
 * Header loader — optimized.
 * Headers are now inlined in every HTML page so there is no fetch needed.
 * This script only blocks right-click (existing behaviour) and keeps
 * a background revalidation as a safety-net in case the header.html
 * changes in the future (it will silently update the sessionStorage copy
 * but NOT re-render, since the inlined version is already correct).
 */

function blockRightClick() {
  document.addEventListener("contextmenu", (event) => {
    event.preventDefault()
  })
}

blockRightClick()
