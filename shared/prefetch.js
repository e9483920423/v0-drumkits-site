;(function () {
  "use strict"

  function prefersReducedMotion() {
    return !!window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
  }

  function shouldAvoidPrefetch() {
    const c = navigator.connection
    if (c?.saveData) return true
    if (typeof c?.effectiveType === "string" && c.effectiveType.includes("2g")) return true
    return false
  }

  function toCleanUrl(href) {
    try {
      const url = new URL(href, window.location.href)
      url.hash = ""
      return url
    } catch {
      return null
    }
  }

  function isHttpUrl(url) {
    return url.protocol === "http:" || url.protocol === "https:"
  }

  function isInternalLink(anchor) {
    if (!anchor || !anchor.href) return false
    if (anchor.target === "_blank") return false
    if (anchor.hasAttribute("download")) return false

    try {
      const url = new URL(anchor.href, window.location.href)
      if (!isHttpUrl(url)) return false
      return url.origin === window.location.origin
    } catch {
      return false
    }
  }

  function isSameDocumentIgnoringHash(aHref, bHref) {
    try {
      const a = toCleanUrl(aHref)
      const b = toCleanUrl(bHref)
      return a && b && a.href === b.href
    } catch {
      return false
    }
  }

  const prefetched = new Set()

  function prefetchUrl(href) {
    if (prefetched.has(href)) return
    prefetched.add(href)

    const link = document.createElement("link")
    link.rel = "prefetch"
    link.href = href
    link.as = "document"
    document.head.appendChild(link)
  }

  function onPointerOver(e) {
    if (shouldAvoidPrefetch()) return

    const anchor = e.target.closest("a")
    if (!anchor || !isInternalLink(anchor)) return

    if (isSameDocumentIgnoringHash(anchor.href, window.location.href)) return

    const clean = toCleanUrl(anchor.href)
    if (clean) prefetchUrl(clean.href)
  }

  function setupSpeculationRules() {
    if (!HTMLScriptElement.supports || !HTMLScriptElement.supports('speculationrules')) return

    const specScript = document.createElement('script')
    specScript.type = 'speculationrules'
    specScript.textContent = JSON.stringify({
      prefetch: [
        {
          source: 'document',
          where: {
            and: [
              { href_matches: '/*' },
              { not: { href_matches: ['/logout', '/api/*', '/submit', '*/download'] } },
              { not: { selector_matches: '.download-btn, .no-prerender' } }
            ]
          },
          eagerness: 'moderate'
        }
      ]
    })
    document.head.appendChild(specScript)
  }

  document.addEventListener("pointerover", onPointerOver, { capture: true, passive: true })
  document.addEventListener("touchstart", onPointerOver, { capture: true, passive: true })

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupSpeculationRules)
  } else {
    setupSpeculationRules()
  }
})()
