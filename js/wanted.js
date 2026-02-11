/* ============================================
   MOST WANTED — Government Style JavaScript
   Zeta Rho Bureau of Investigation
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    initScrollAnimations();
    initClassifiedStamp();
});

/* ============================================
   Scroll Animations — fade in elements
   ============================================ */
function initScrollAnimations() {
    const elements = document.querySelectorAll(
        '.charge-item, .incident-card, .tip-card, .victim-statement-card, ' +
        '.wanted-section-title, .wanted-section-subtitle, .last-seen-box, .wanted-poster'
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Stagger siblings
                const parent = entry.target.parentElement;
                if (parent) {
                    const siblings = Array.from(parent.children).filter(
                        c => c.classList.contains('fade-in')
                    );
                    const index = siblings.indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.1}s`;
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -30px 0px'
    });

    elements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

/* ============================================
   Classified Stamp Watermark
   ============================================ */
function initClassifiedStamp() {
    // Add a faint CLASSIFIED watermark to certain sections
    const sections = document.querySelectorAll('.wanted-section');
    sections.forEach(section => {
        const watermark = document.createElement('div');
        watermark.style.cssText = `
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-35deg);
            font-family: 'Archivo Black', sans-serif;
            font-size: 8rem;
            color: rgba(139, 0, 0, 0.03);
            letter-spacing: 0.2em;
            pointer-events: none;
            z-index: 0;
            white-space: nowrap;
            user-select: none;
        `;
        watermark.textContent = 'CLASSIFIED';
        section.style.position = 'relative';
        section.style.overflow = 'hidden';
        section.appendChild(watermark);
    });
}
