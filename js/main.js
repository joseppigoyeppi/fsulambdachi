/* ============================================
   Lambda Chi Alpha - Zeta Rho Chapter at FSU
   Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavbar();
    initMobileNav();
    initScrollAnimations();
    initCounterAnimation();
    initSmoothScroll();
    initScrollToTop();
});

/* ============================================
   Scroll to Top on Page Load/Reload
   ============================================ */
function initScrollToTop() {
    // Scroll to top on page load
    if ('scrollRestoration' in history) {
        history.scrollRestoration = 'manual';
    }
    window.scrollTo(0, 0);
}

/* ============================================
   Navbar Scroll Effect
   ============================================ */
function initNavbar() {
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;

        // Add/remove scrolled class
        if (currentScroll > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }

        // Hide/show navbar on scroll (optional - for mobile)
        if (window.innerWidth < 768) {
            if (currentScroll > lastScroll && currentScroll > 200) {
                navbar.style.transform = 'translateY(-100%)';
            } else {
                navbar.style.transform = 'translateY(0)';
            }
        }

        lastScroll = currentScroll;
    });
}

/* ============================================
   Mobile Navigation
   ============================================ */
function initMobileNav() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navbar = document.getElementById('navbar');
    const navLinks = document.querySelectorAll('.nav-link');

    if (!navToggle || !navMenu) return;

    navToggle.addEventListener('click', () => {
        navToggle.classList.toggle('active');
        navMenu.classList.toggle('active');
        navbar.classList.toggle('menu-open');
        document.body.style.overflow = navMenu.classList.contains('active') ? 'hidden' : '';
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            navbar.classList.remove('menu-open');
            document.body.style.overflow = '';
        });
    });

    // Close menu on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && navMenu.classList.contains('active')) {
            navToggle.classList.remove('active');
            navMenu.classList.remove('active');
            navbar.classList.remove('menu-open');
            document.body.style.overflow = '';
        }
    });
}

/* ============================================
   Scroll Animations (Intersection Observer)
   ============================================ */
function initScrollAnimations() {
    // Elements to animate
    const animatedElements = document.querySelectorAll(`
        .about-content,
        .about-images,
        .value-card,
        .alumni-card,
        .philanthropy-image,
        .philanthropy-content,
        .instagram-item,
        .leader-card,
        .timeline-item,
        .section-tag,
        .section-title,
        .stat-item,
        .contact-info-card,
        .mentor-card,
        .officer-card,
        .house-gallery-item,
        .heritage-divider,
        .contact-form
    `);

    // Create observer
    const observerOptions = {
        root: null,
        rootMargin: '0px 0px -50px 0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');

                // Add stagger delay for grid items
                const parent = entry.target.parentElement;
                if (parent) {
                    const siblings = Array.from(parent.children);
                    const index = siblings.indexOf(entry.target);
                    entry.target.style.transitionDelay = `${index * 0.1}s`;
                }
            }
        });
    }, observerOptions);

    // Add initial class and observe
    animatedElements.forEach(el => {
        el.classList.add('fade-in');
        observer.observe(el);
    });
}

/* ============================================
   Counter Animation
   ============================================ */
function initCounterAnimation() {
    const stats = document.querySelectorAll('.stat-number');

    const observerOptions = {
        root: null,
        threshold: 0.5
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const text = target.textContent;

                // Don't animate if already animated
                if (target.dataset.animated) return;
                target.dataset.animated = 'true';

                // Check if it's a number we can animate
                const match = text.match(/(\d+)/);
                if (match) {
                    const endValue = parseInt(match[1]);
                    const prefix = text.slice(0, text.indexOf(match[1]));
                    const suffix = text.slice(text.indexOf(match[1]) + match[1].length);

                    animateCounter(target, 0, endValue, 2000, prefix, suffix);
                }
            }
        });
    }, observerOptions);

    stats.forEach(stat => observer.observe(stat));
}

function animateCounter(element, start, end, duration, prefix = '', suffix = '') {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Easing function (ease-out cubic)
        const easeOut = 1 - Math.pow(1 - progress, 3);

        const current = Math.floor(start + (end - start) * easeOut);

        // Format number with K/M suffix if needed
        let displayValue;
        if (end >= 1000 && suffix.includes('K')) {
            displayValue = Math.floor(current / 1000) + 'K';
        } else {
            displayValue = current.toLocaleString();
        }

        element.textContent = prefix + displayValue + suffix;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

/* ============================================
   Smooth Scroll for Anchor Links
   ============================================ */
function initSmoothScroll() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const href = this.getAttribute('href');
            if (href === '#') return;

            e.preventDefault();
            const target = document.querySelector(href);

            if (target) {
                const navbarHeight = document.querySelector('.navbar').offsetHeight;
                const targetPosition = target.getBoundingClientRect().top + window.pageYOffset - navbarHeight;

                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

/* ============================================
   Image Lazy Loading Enhancement
   ============================================ */
function initLazyImages() {
    const images = document.querySelectorAll('img[data-src]');

    const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });

    images.forEach(img => imageObserver.observe(img));
}

/* ============================================
   Hero & Page Hero Entrance Animations
   ============================================ */
function initHeroEntrance() {
    const hero = document.querySelector('.hero');
    if (hero) {
        requestAnimationFrame(() => {
            setTimeout(() => {
                hero.classList.add('hero--loaded');
            }, 100);
        });
    }

    const pageHero = document.querySelector('.page-hero');
    if (pageHero) {
        requestAnimationFrame(() => {
            setTimeout(() => {
                pageHero.classList.add('page-hero--loaded');
            }, 100);
        });
    }
}

document.addEventListener('DOMContentLoaded', initHeroEntrance);

/* ============================================
   Parallax Effect (subtle, for hero)
   ============================================ */
function initParallax() {
    const heroBg = document.querySelector('.hero-background');
    if (!heroBg) return;

    // Use passive scroll listener for performance
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        if (scrolled < window.innerHeight) {
            const rate = scrolled * 0.25;
            heroBg.style.transform = `translateY(${rate}px)`;
        }
    }, { passive: true });
}

// Initialize parallax if exists
document.addEventListener('DOMContentLoaded', initParallax);

/* ============================================
   Utility: Debounce Function
   ============================================ */
function debounce(func, wait = 20, immediate = true) {
    let timeout;
    return function() {
        const context = this, args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}

/* ============================================
   Active Navigation Link Highlighting
   ============================================ */
function highlightActiveNav() {
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-link');

    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        const linkPage = href.split('/').pop();

        link.classList.remove('active');

        if (linkPage === currentPage ||
            (currentPage === 'index.html' && href === 'index.html') ||
            (currentPage === '' && href === 'index.html')) {
            link.classList.add('active');
        }
    });
}

document.addEventListener('DOMContentLoaded', highlightActiveNav);
