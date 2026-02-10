/* ============================================
   BROTHER SHIESTY — Gangster Page JavaScript
   Straight Outta Zeta Rho
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    initShiestyLoading();
    initStatCounters();
    initGavelButton();
    initScrollAnimations();
});

/* ============================================
   Loading Screen
   ============================================ */
function initShiestyLoading() {
    const loading = document.getElementById('shiesty-loading');
    if (!loading) return;

    setTimeout(() => {
        loading.classList.add('hidden');
        // Bass shake on reveal
        document.body.classList.add('bass-shake');
        setTimeout(() => document.body.classList.remove('bass-shake'), 300);
    }, 2200);
}

/* ============================================
   Animated Stat Counters
   ============================================ */
function initStatCounters() {
    const numbers = document.querySelectorAll('.shiesty-stat-number');
    if (!numbers.length) return;

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && !entry.target.dataset.animated) {
                entry.target.dataset.animated = 'true';
                const target = parseInt(entry.target.dataset.target);
                animateNumber(entry.target, 0, target, 2000);
            }
        });
    }, { threshold: 0.5 });

    numbers.forEach(num => observer.observe(num));
}

function animateNumber(el, start, end, duration) {
    const startTime = performance.now();

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const current = Math.floor(start + (end - start) * easeOut);

        el.textContent = current.toLocaleString();

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            // Add % suffix for the fear rating
            if (el.closest('.shiesty-stat') &&
                el.closest('.shiesty-stat').querySelector('.shiesty-stat-label') &&
                el.closest('.shiesty-stat').querySelector('.shiesty-stat-label').textContent.includes('%')) {
                el.textContent = end + '%';
            }
        }
    }

    requestAnimationFrame(update);
}

/* ============================================
   Gavel / Verdict Button
   ============================================ */
function initGavelButton() {
    const btn = document.getElementById('gavel-btn');
    const result = document.getElementById('verdict-result');
    if (!btn || !result) return;

    const verdicts = [
        {
            guilty: true,
            title: "Brother Shiesty Has Spoken",
            text: "After careful deliberation (about 0.3 seconds), Brother Shiesty finds you GUILTY of being an associate member. That alone is enough.",
            sentence: "SENTENCE: 50 push-ups and you better say 'thank you sir' after each one."
        },
        {
            guilty: true,
            title: "The Verdict Is In",
            text: "Brother Shiesty reviewed your case file. It's 47 pages long. Every page just says 'guilty' in increasingly large font.",
            sentence: "SENTENCE: You're on dish duty until further notice. 'Further notice' is when Brother Shiesty feels like it."
        },
        {
            guilty: true,
            title: "Justice Has Been Served",
            text: "You thought you could plead innocent? Brother Shiesty has security camera footage, three witnesses, and your own group chat messages screenshotted. In 4K.",
            sentence: "SENTENCE: Community service hours doubled. And you're driving Brother Shiesty to Chick-fil-A. His order is complicated."
        },
        {
            guilty: true,
            title: "Court Is Adjourned",
            text: "Brother Shiesty doesn't even need to hear your defense. He already knows what you did, when you did it, and which shoes you were wearing. He ALWAYS knows.",
            sentence: "SENTENCE: Public apology at next chapter meeting. Minimum 3 minutes. Must include the phrase 'I have learned my lesson.'"
        },
        {
            guilty: false,
            title: "A Rare Moment",
            text: "Against all odds, Brother Shiesty has found you... not guilty. This has happened exactly twice in chapter history. Savor this moment. Screenshot it. It will never happen again.",
            sentence: "You're free to go. But Brother Shiesty is still watching. He's ALWAYS watching."
        }
    ];

    btn.addEventListener('click', function() {
        btn.classList.add('judging');

        // Bass shake
        document.body.classList.add('bass-shake');
        setTimeout(() => document.body.classList.remove('bass-shake'), 300);

        // Pick verdict (90% guilty, 10% not guilty)
        const isGuilty = Math.random() > 0.1;
        const guiltyVerdicts = verdicts.filter(v => v.guilty);
        const notGuiltyVerdicts = verdicts.filter(v => !v.guilty);
        const verdict = isGuilty
            ? guiltyVerdicts[Math.floor(Math.random() * guiltyVerdicts.length)]
            : notGuiltyVerdicts[Math.floor(Math.random() * notGuiltyVerdicts.length)];

        setTimeout(() => {
            btn.classList.remove('judging');
            btn.closest('.gavel-area').style.display = 'none';
            result.style.display = 'block';

            const stamp = document.getElementById('verdict-stamp');
            const title = document.getElementById('verdict-title');
            const text = document.getElementById('verdict-text');
            const sentence = document.getElementById('verdict-sentence');

            stamp.textContent = verdict.guilty ? 'GUILTY' : 'NOT GUILTY';
            stamp.className = 'verdict-stamp ' + (verdict.guilty ? 'guilty' : 'not-guilty');
            title.textContent = verdict.title;
            text.textContent = verdict.text;
            sentence.textContent = verdict.sentence;

            // One more shake for impact
            document.body.classList.add('bass-shake');
            setTimeout(() => document.body.classList.remove('bass-shake'), 300);
        }, 2000);
    });
}

/* ============================================
   Scroll Animations
   ============================================ */
function initScrollAnimations() {
    const elements = document.querySelectorAll(
        '.charge-card, .record-card, .commandment-item, .shiesty-section-header, .shiesty-quote-block'
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
        el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
        observer.observe(el);
    });
}
