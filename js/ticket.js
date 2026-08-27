(() => {
  const ticket = document.getElementById('ticket');
  const fullscreenButton = document.getElementById('fullscreenButton');
  const closeButton = document.getElementById('closeButton');
  const toast = document.getElementById('toast');
  const readerVideo = document.getElementById('readerVideo');
  const readerFallback = document.getElementById('readerFallback');

  let startY = null;
  let currentOffset = 0;
  let dragging = false;
  let toastTimer;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

  function showToast(message, ms = 3300) {
    clearTimeout(toastTimer);
    toast.textContent = message;
    toast.classList.add('show');
    toastTimer = setTimeout(() => toast.classList.remove('show'), ms);
  }

  function setTicketY(y) {
    currentOffset = y;
    ticket.style.transform = `translate3d(0, ${y}px, 0)`;
  }

  function springHome(from = currentOffset) {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setTicketY(0);
      return;
    }

    const peak = Math.min(from, -30);
    const animation = ticket.animate([
      { transform: `translate3d(0, ${from}px, 0)`, offset: 0 },
      { transform: `translate3d(0, ${peak - 10}px, 0)`, offset: .18 },
      { transform: 'translate3d(0, 8px, 0)', offset: .72 },
      { transform: 'translate3d(0, -2px, 0)', offset: .9 },
      { transform: 'translate3d(0, 0, 0)', offset: 1 }
    ], {
      duration: 560,
      easing: 'cubic-bezier(.22,.78,.25,1)'
    });

    animation.onfinish = () => setTicketY(0);
  }

  ticket.addEventListener('pointerdown', (event) => {
    dragging = true;
    startY = event.clientY;
    currentOffset = 0;
    ticket.setPointerCapture?.(event.pointerId);
  });

  ticket.addEventListener('pointermove', (event) => {
    if (!dragging || startY === null) return;
    const delta = event.clientY - startY;
    // Only follow upward movement, with increasing resistance.
    const resisted = delta < 0 ? delta * .58 : delta * .12;
    setTicketY(clamp(resisted, -72, 10));
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    startY = null;
    const launchPoint = currentOffset < -18 ? Math.min(currentOffset - 16, -48) : currentOffset;
    springHome(launchPoint);
  };

  ticket.addEventListener('pointerup', endDrag);
  ticket.addEventListener('pointercancel', endDrag);
  ticket.addEventListener('lostpointercapture', endDrag);

  async function enterFullscreen() {
    try {
      const root = document.documentElement;
      const request = root.requestFullscreen || root.webkitRequestFullscreen;

      if (request) {
        await request.call(root);
        return;
      }

      const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
      if (standalone) {
        showToast('Already running in standalone mode.');
      } else {
        showToast('For a true address-bar-free iPhone view, use Share → Add to Home Screen, then open FSU Tickets from the Home Screen.', 5600);
      }
    } catch (error) {
      showToast('iPhone Safari may block page fullscreen. Use Share → Add to Home Screen for the seamless standalone view.', 5600);
    }
  }

  fullscreenButton.addEventListener('click', enterFullscreen);

  closeButton.addEventListener('click', () => {
    window.location.href = '../index.html';
  });

  // If the supplied screen recording exists, it becomes the loop automatically.
  readerVideo.addEventListener('loadeddata', () => {
    readerVideo.dataset.loaded = 'true';
    readerFallback.classList.add('hidden');
    readerVideo.play().catch(() => {});
  });

  readerVideo.addEventListener('error', () => {
    readerVideo.removeAttribute('data-loaded');
    readerFallback.classList.remove('hidden');
  });

  // Re-attempt playback after user interaction in case iOS paused autoplay.
  document.addEventListener('touchstart', () => {
    if (readerVideo.dataset.loaded === 'true' && readerVideo.paused) {
      readerVideo.play().catch(() => {});
    }
  }, { passive: true, once: true });
})();
