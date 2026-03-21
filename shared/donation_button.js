(function () {

  // ─── Config ───────────────────────────────────────────────────────────────
  const STORAGE_KEY      = 'donationPopupDismissed';
  const COOLDOWN_DAYS    = 1;          // re-show after this many days
  const EXIT_THRESHOLD_Y = 10;         // px from top to trigger exit intent
  const SCROLL_THRESHOLD = 40;         // % of page scrolled before fallback timer fires
  const FALLBACK_DELAY   = 45_000;     // ms — show after 45 s if exit intent never fired
  // ──────────────────────────────────────────────────────────────────────────

  // Check cooldown: dismissed within COOLDOWN_DAYS? bail out.
  function isDismissedRecently() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    if (isNaN(ts)) return false;
    return Date.now() - ts < COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  }

  if (isDismissedRecently()) return;

  // ─── Inject styles ────────────────────────────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #exit-donation-popup {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 300px;
      background-color: var(--bg-secondary, #111);
      border: 1px solid var(--border-color, #222);
      border-top: 1px solid rgba(255,255,255,0.14);
      border-radius: var(--border-radius, 6px);
      box-shadow: 0 10px 30px rgba(0,0,0,0.8);
      z-index: 10000;
      font-family: "JetBrains Mono", monospace;
      color: var(--text-primary, #fff);
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);

      transform: translateY(calc(100% + 30px));
      opacity: 0;
      pointer-events: none;
      transition: transform 0.5s cubic-bezier(0.4, 2.2, 0, 1),
                  opacity  0.4s ease;
    }

    #exit-donation-popup.visible {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    /* Inner layout mirrors .item-content card style */
    .dp-inner {
      padding: 1rem;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* Header row: label + close button */
    .dp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .dp-label {
      font-size: 0.62rem;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: var(--text-muted, #666);
    }

    #close-donation-popup {
      background: transparent;
      border: 1px solid var(--border-color, #222);
      border-radius: var(--border-radius, 6px);
      color: var(--text-secondary, #aaa);
      font-size: 0.7rem;
      font-family: "JetBrains Mono", monospace;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      cursor: pointer;
      padding: 0.2rem 0.5rem;
      transition: var(--transition, all 0.3s ease);
      line-height: 1;
    }

    #close-donation-popup:hover {
      background-color: var(--accent-red, #ff0043);
      border-color: var(--accent-red, #ff0043);
      color: #fff;
    }

    .dp-divider {
      border: 0;
      height: 1px;
      background: var(--border-color, #222);
      margin: 0;
    }

    .dp-text {
      font-size: 0.82rem;
      line-height: 1.5;
      color: var(--text-secondary, #aaa);
      margin: 0;
    }

    /* Mirrors .download-btn */
    .dp-donate-btn {
      display: block;
      background-color: var(--bg-tertiary, #222);
      color: var(--text-primary, #fff);
      padding: 0.45rem 0.75rem;
      text-decoration: none;
      border-radius: var(--border-radius, 6px);
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      text-align: center;
      border: 1px solid var(--border-color, #222);
      font-family: "JetBrains Mono", monospace;
      transition: var(--transition, all 0.3s ease);
    }

    .dp-donate-btn:hover {
      background-color: var(--accent-red, #ff0043);
      border-color: transparent;
      color: #fff;
    }

    /* Cooldown hint */
    .dp-footer {
      font-size: 0.68rem;
      color: var(--text-muted, #666);
      font-style: italic;
      margin: 0;
      text-align: right;
    }
  `;
  document.head.appendChild(style);

  // ─── Build popup ──────────────────────────────────────────────────────────
  const popup = document.createElement('div');
  popup.id = 'exit-donation-popup';
  popup.setAttribute('role', 'dialog');
  popup.setAttribute('aria-label', 'Support us');
  popup.innerHTML = `
    <div class="dp-inner">
      <div class="dp-header">
        <span class="dp-label">Support the site</span>
        <button id="close-donation-popup" aria-label="Close">[ X ]</button>
      </div>
      <hr class="dp-divider">
      <p class="dp-text">If you've gotten any value out of the stuff we share, please consider donating your support will help us keep the site running and the downloads active & at some point move away from ads.</p>
      <a href="https://buymeacoffee.com/kits4leaksp" target="_blank" rel="noopener" class="dp-donate-btn">
        Buy Me a Coffee
      </a>
      <p class="dp-footer">Fuck kits4beats</p>
    </div>
  `;
  document.body.appendChild(popup);

  // ─── Show / hide helpers ──────────────────────────────────────────────────
  let shown = false;

  function showPopup() {
    if (shown) return;
    shown = true;
    popup.classList.add('visible');
    // Clean up all triggers once shown
    document.removeEventListener('mouseout', onMouseLeave);
    window.removeEventListener('scroll', onScroll);
    clearTimeout(fallbackTimer);
  }

  function hidePopup() {
    popup.classList.remove('visible');
    // Record dismissal timestamp so cooldown kicks in
    localStorage.setItem(STORAGE_KEY, String(Date.now()));
  }

  document.getElementById('close-donation-popup')
    .addEventListener('click', hidePopup);

  // ─── Trigger 1: exit intent (desktop) ────────────────────────────────────
  function onMouseLeave(e) {
    if (e.clientY < EXIT_THRESHOLD_Y && e.relatedTarget === null) {
      showPopup();
    }
  }
  document.addEventListener('mouseout', onMouseLeave);

  // ─── Trigger 2: scroll depth fallback (mobile + non-exit users) ──────────
  function onScroll() {
    const scrolled = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
    if (scrolled >= SCROLL_THRESHOLD) {
      showPopup();
    }
  }
  window.addEventListener('scroll', onScroll, { passive: true });

  // ─── Trigger 3: time-based fallback ──────────────────────────────────────
  const fallbackTimer = setTimeout(showPopup, FALLBACK_DELAY);

})();
