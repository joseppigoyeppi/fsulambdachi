(() => {
  const ticket = document.getElementById('ticket');
  const readerVideo = document.getElementById('readerVideo');
  const readerFallback = document.getElementById('readerFallback');

  let startY = null;
  let currentOffset = 0;
  let dragging = false;
  let maxUp = -72;

  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

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
    // Allow dragging until only a sliver of the ticket is still on screen.
    maxUp = -(ticket.getBoundingClientRect().bottom - 40);
    ticket.setPointerCapture?.(event.pointerId);
  });

  ticket.addEventListener('pointermove', (event) => {
    if (!dragging || startY === null) return;
    const delta = event.clientY - startY;
    // Follow the finger upward; resist downward movement.
    const followed = delta < 0 ? delta : delta * .12;
    setTicketY(clamp(followed, maxUp, 10));
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    startY = null;
    springHome(currentOffset);
  };

  ticket.addEventListener('pointerup', endDrag);
  ticket.addEventListener('pointercancel', endDrag);
  ticket.addEventListener('lostpointercapture', endDrag);

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
