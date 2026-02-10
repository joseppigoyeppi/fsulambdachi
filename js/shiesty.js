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
            title: "Brother Shiesty Done Spoke",
            text: "After careful deliberation (took him bout 0.3 seconds cuz he already knew), Brother Shiesty find yo ass GUILTY of bein an associate member. That alone is enough. You ain't even gotta do nothin wrong — the fact that you an AM is the crime.",
            sentence: "SENTENCE: 50 push-ups and you better say 'thank you sir' after every single one. Lose count and you startin over. He WILL make you start over."
        },
        {
            guilty: true,
            title: "It's a Wrap for You",
            text: "Brother Shiesty reviewed yo case file. It's 47 pages long. Every single page just say 'guilty' in bigger and bigger font. The last page is just the word GUILTY in size 400 font takin up the whole damn page. He laminated it.",
            sentence: "SENTENCE: You on dish duty till further notice. 'Further notice' is whenever Brother Shiesty FEEL like lettin you off. Could be a week. Could be never. Probably never."
        },
        {
            guilty: true,
            title: "Justice Been Served Nigga",
            text: "You really thought you could plead innocent? Bruh. Brother Shiesty got security camera footage, three witnesses, yo own group chat messages screenshotted IN 4K, AND yo mama on speed dial. She already disappointed in you. He called her first.",
            sentence: "SENTENCE: Community service hours TRIPLED. And you drivin Brother Shiesty to Chick-fil-A every day this week. His order complicated as hell and he WILL change it at the window."
        },
        {
            guilty: true,
            title: "Court Adjourned. Get Out.",
            text: "Brother Shiesty ain't even need to hear yo defense lil bro. He already know what you did, when you did it, what you was wearin, what you ate for breakfast, and what yo heart rate was. This man is OMNISCIENT when it come to catchin AMs lackin.",
            sentence: "SENTENCE: Public apology at next chapter meeting. Minimum 5 minutes. Must include the phrase 'I have learned my lesson and I will never disrespect Brother Shiesty again.' Say it with yo chest or say it again."
        },
        {
            guilty: true,
            title: "Lmao You Really Thought",
            text: "The audacity. The AUDACITY of you pressin that button thinkin you had a chance. Brother Shiesty been knew you was guilty before you even walked in. He wrote the verdict last Tuesday. He been waitin for this moment all week.",
            sentence: "SENTENCE: You runnin laps around the chapter house at 6 AM tomorrow. Brother Shiesty will be on the porch in a lawn chair sippin coffee timing you. Don't be late or it's double."
        },
        {
            guilty: false,
            title: "Nah... Hold On...",
            text: "Against ALL odds... Brother Shiesty has found you... not guilty. This has happened exactly TWICE in the entire history of the chapter. Savor this shit. Screenshot it. Frame it. Put it on yo resume. Tell yo grandkids. It will NEVER happen again. You used up all yo luck for the rest of yo life.",
            sentence: "You free to go. But Brother Shiesty still watchin yo ass. He ALWAYS watchin. Sleep with one eye open tonight lil bro. And say thank you on yo way out."
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
