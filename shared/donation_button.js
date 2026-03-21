(function() {
  const style = document.createElement('style');
  style.textContent = `
    #exit-donation-popup {
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 320px;
      background: var(--bg-secondary, rgba(17,17,17,0.85));
      backdrop-filter: blur(8px);
      -webkit-backdrop-filter: blur(8px);
      border: 1px solid var(--border-color, #222);
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      border-radius: var(--border-radius, 6px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.8);
      z-index: 10000;
      font-family: "JetBrains Mono", monospace;
      color: var(--text-primary, #fff);
      
      /* Hidden state */
      transform: translateY(150%);
      opacity: 0;
      pointer-events: none;
      transition: transform 0.5s cubic-bezier(0.4, 2.2, 0, 1), opacity 0.4s ease;
    }

    #exit-donation-popup.visible {
      transform: translateY(0);
      opacity: 1;
      pointer-events: auto;
    }

    .popup-inner {
      padding: 1.2rem;
      padding-bottom: 2.2rem; /* Extra padding at the bottom to make room for the X */
      position: relative;
      display: flex;
      flex-direction: column;
      gap: 0.8rem;
    }

    .donation-text {
      font-size: 0.85rem;
      line-height: 1.4;
      margin: 0;
    }

    .donate-btn {
      display: block;
      background-color: var(--bg-tertiary, #222);
      color: var(--text-primary, #fff);
      padding: 0.5rem;
      text-decoration: none;
      border-radius: var(--border-radius, 6px);
      font-size: 0.85rem;
      font-weight: 700;
      text-transform: uppercase;
      text-align: center;
      border: 1px solid var(--border-color, #222);
      transition: all 0.3s ease;
    }

    .donate-btn:hover {
      background-color: var(--accent-red, #ff0043);
      border-color: transparent;
      color: #fff;
    }

    .popup-divider {
      border: 0;
      height: 1px;
      background: var(--border-color, #222);
      margin: 0.2rem 0;
    }

    .admin-message {
      font-size: 0.75rem;
      color: var(--text-muted, #666);
      font-style: italic;
      margin: 0;
    }

    /* X positioned at the bottom right */
    #close-donation-popup {
      position: absolute;
      bottom: 8px;
      right: 12px;
      background: transparent;
      border: none;
      color: var(--text-secondary, #aaa);
      font-size: 1.1rem;
      cursor: pointer;
      transition: color 0.3s ease;
      line-height: 1;
      font-family: monospace;
      padding: 4px;
    }

    #close-donation-popup:hover {
      color: var(--accent-red, #ff0043);
    }
  `;
  document.head.appendChild(style);
  const popup = document.createElement('div');
  popup.id = 'exit-donation-popup';
  popup.innerHTML = `
    <div class="popup-inner">
      <p class="donation-text">if you've gotten value out of the files we share, please consider donating here:</p>
      <a href="https://buymeacoffee.com/kits4leaksp" target="_blank" class="donate-btn">BUYMEACOFFEE</a>
      <hr class="popup-divider">
      <p class="admin-message">Fuck you kits4beats</p>
      <button id="close-donation-popup" aria-label="Close">X</button>
    </div>
  `;
  document.body.appendChild(popup);

  const closeBtn = document.getElementById('close-donation-popup');
  let hasShown = sessionStorage.getItem('donationPopupShown');

  const onMouseLeave = (e) => {
    if (e.clientY < 10 && !hasShown) {
      popup.classList.add('visible');
      sessionStorage.setItem('donationPopupShown', 'true');
      hasShown = true;
    }
  };

  closeBtn.addEventListener('click', () => {
    popup.classList.remove('visible');
  });

  document.addEventListener('mouseout', onMouseLeave);

})();
