/* ============================================
   THE LOST BROTHER — Alex Klapperich
   Corrupted Page JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    initEvilLoading();
    initEvilParticles();
    initDarknessFlicker();
    initStaticFlashes();
    initSummonButton();
    initEvilScrollAnimations();
    initPortraitHover();
});

/* ============================================
   Loading Screen — corrupted file access
   ============================================ */
function initEvilLoading() {
    const loading = document.getElementById('evil-loading');
    if (!loading) return;

    // Hide after the corrupt progress bar fills
    setTimeout(() => {
        loading.classList.add('hidden');

        // Shake + static flash on reveal
        document.body.classList.add('screen-shake');
        const staticOverlay = document.getElementById('static-overlay');
        if (staticOverlay) {
            staticOverlay.classList.add('flash');
            setTimeout(() => staticOverlay.classList.remove('flash'), 200);
        }
        setTimeout(() => document.body.classList.remove('screen-shake'), 400);
    }, 2800);
}

/* ============================================
   Floating Ember Particles
   ============================================ */
function initEvilParticles() {
    const container = document.getElementById('evil-particles');
    if (!container) return;

    function createParticle() {
        const particle = document.createElement('div');
        particle.classList.add('evil-particle');

        particle.style.left = Math.random() * 100 + '%';

        const size = Math.random() * 3 + 1.5;
        particle.style.width = size + 'px';
        particle.style.height = size + 'px';

        const duration = Math.random() * 10 + 8;
        particle.style.animationDuration = duration + 's';
        particle.style.animationDelay = Math.random() * 5 + 's';

        // Muted ember colors
        const colors = ['#FF4500', '#FF6B35', '#8B0000', '#B8860B', '#CC0000'];
        const color = colors[Math.floor(Math.random() * colors.length)];
        particle.style.background = color;
        particle.style.boxShadow = `0 0 ${size * 2}px ${color}`;

        container.appendChild(particle);

        setTimeout(() => particle.remove(), (duration + 5) * 1000);
    }

    // Sparse initial particles
    for (let i = 0; i < 10; i++) {
        setTimeout(createParticle, i * 400);
    }

    setInterval(createParticle, 1200);
}

/* ============================================
   Random Darkness Flicker
   ============================================ */
function initDarknessFlicker() {
    const overlay = document.getElementById('darkness-overlay');
    if (!overlay) return;

    function triggerFlicker() {
        overlay.classList.add('flicker');
        setTimeout(() => overlay.classList.remove('flicker'), 300);

        // Next flicker: 10-30 seconds
        setTimeout(triggerFlicker, Math.random() * 20000 + 10000);
    }

    // First flicker after 6-12 seconds
    setTimeout(triggerFlicker, Math.random() * 6000 + 6000);
}

/* ============================================
   Random Static/Noise Flashes
   ============================================ */
function initStaticFlashes() {
    const overlay = document.getElementById('static-overlay');
    if (!overlay) return;

    function triggerStatic() {
        overlay.classList.add('flash');
        setTimeout(() => overlay.classList.remove('flash'), 200);

        // Next: 15-40 seconds
        setTimeout(triggerStatic, Math.random() * 25000 + 15000);
    }

    // First static after 8-15 seconds
    setTimeout(triggerStatic, Math.random() * 7000 + 8000);
}

/* ============================================
   Portrait Hover — intensify corruption
   ============================================ */
function initPortraitHover() {
    const portrait = document.getElementById('shrine-portrait');
    if (!portrait) return;

    portrait.parentElement.addEventListener('mouseenter', () => {
        portrait.style.filter = 'grayscale(30%) contrast(1.6) brightness(0.6) sepia(10%)';
        // Trigger a static flash
        const staticOverlay = document.getElementById('static-overlay');
        if (staticOverlay) {
            staticOverlay.classList.add('flash');
            setTimeout(() => staticOverlay.classList.remove('flash'), 200);
        }
    });

    portrait.parentElement.addEventListener('mouseleave', () => {
        portrait.style.filter = '';
    });
}

/* ============================================
   Summon / Contact Button
   ============================================ */
function initSummonButton() {
    const btn = document.getElementById('summon-btn');
    const result = document.getElementById('summon-result');
    if (!btn || !result) return;

    btn.addEventListener('click', function() {
        btn.classList.add('summoning');
        btn.querySelector('.summon-text').style.display = 'none';
        btn.querySelector('.summon-text-active').style.display = 'block';

        // Screen shake
        document.body.classList.add('screen-shake');
        setTimeout(() => document.body.classList.remove('screen-shake'), 400);

        // Rapid darkness + static flickers
        const darkness = document.getElementById('darkness-overlay');
        const staticEl = document.getElementById('static-overlay');
        let count = 0;
        const flickerInterval = setInterval(() => {
            if (darkness) {
                darkness.classList.add('flicker');
                setTimeout(() => darkness.classList.remove('flicker'), 200);
            }
            if (staticEl) {
                staticEl.classList.add('flash');
                setTimeout(() => staticEl.classList.remove('flash'), 150);
            }
            count++;
            if (count >= 5) clearInterval(flickerInterval);
        }, 500);

        // Show result
        setTimeout(() => {
            btn.classList.remove('summoning');
            btn.closest('.evil-ritual-circle').style.display = 'none';
            result.style.display = 'block';

            // Final shake
            document.body.classList.add('screen-shake');
            setTimeout(() => document.body.classList.remove('screen-shake'), 400);
        }, 3500);
    });
}

/* ============================================
   Scroll Animations
   ============================================ */
function initEvilScrollAnimations() {
    const elements = document.querySelectorAll(
        '.evil-commandment-card, .coven-card, .evil-text-card, .evil-section-header'
    );

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';

                const parent = entry.target.parentElement;
                if (parent) {
                    const siblings = Array.from(parent.children);
                    const index = siblings.indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.08}s`;
                }
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -40px 0px'
    });

    elements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(25px)';
        el.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
        observer.observe(el);
    });
}
