/* ============================================
   Lambda Chi Alpha - Zeta Rho Chapter at FSU
   Main JavaScript
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize all components
    initNavbar();
    initMobileNav();
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
   Hero Entrance Animation (homepage only)
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
