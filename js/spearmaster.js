/* ============================================
   SPEAR MASTER — 1995 Dial-Up Era JavaScript
   Best Viewed in Internet Exploder 4.0
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {
    initDialupLoading();
    initHitCounter();
    initDaysCounter();
    initGuestbookSubmit();
    initSparkleTrail();
    initRandomPopups();
});

/* ============================================
   Dial-up Loading Screen
   ============================================ */
function initDialupLoading() {
    const loading = document.getElementById('spear-loading');
    const bar = document.getElementById('dialup-bar');
    const status = document.getElementById('loading-status');
    if (!loading || !bar || !status) return;

    const statuses = [
        'Dialing 1-800-SPEAR-ME...',
        'BEEEE BOOOOO BRRRRRRR KSHHHHH...',
        'Conecting to AOL...',
        'Verificating password: sp3arM4str69...',
        'ERROR... jk lol gotcha...',
        'Dowloading websight (2.3 kb)...',
        'Almost done promis...',
        'Loadding the good stuff...',
        'ok for real this tiem...',
        'WELCOM TO SPEAR MASTERS HOMEPAGE!!!'
    ];

    let step = 0;
    const interval = setInterval(() => {
        if (step < statuses.length) {
            status.textContent = statuses[step];
            bar.style.width = ((step + 1) / statuses.length * 100) + '%';
            step++;
        } else {
            clearInterval(interval);
            setTimeout(() => {
                loading.classList.add('hidden');
            }, 500);
        }
    }, 400);
}

/* ============================================
   Hit Counter (random but persistent-ish)
   ============================================ */
function initHitCounter() {
    const counter = document.getElementById('hit-counter');
    if (!counter) return;

    let count = parseInt(localStorage.getItem('spear-hits') || '0');
    count += Math.floor(Math.random() * 3) + 1;
    localStorage.setItem('spear-hits', count.toString());

    // Animate counting up
    let current = 0;
    const target = count;
    const padded = target.toString().padStart(6, '0');

    const interval = setInterval(() => {
        current += Math.ceil(target / 30);
        if (current >= target) {
            current = target;
            clearInterval(interval);
        }
        counter.textContent = current.toString().padStart(6, '0');
    }, 50);
}

/* ============================================
   Days Counter (since "launch")
   ============================================ */
function initDaysCounter() {
    const counter = document.getElementById('days-counter');
    if (!counter) return;

    // Site "launched" in fall 2022 (7 semesters ago)
    const launch = new Date('2022-08-15');
    const now = new Date();
    const days = Math.floor((now - launch) / (1000 * 60 * 60 * 24));
    counter.textContent = days.toLocaleString();
}

/* ============================================
   Guestbook Submit Button
   ============================================ */
function initGuestbookSubmit() {
    const btn = document.getElementById('gb-submit');
    if (!btn) return;

    const responses = [
        "THANK U FOR SIGNING MY GUESTBOK!!! ur my new best frend!!!",
        "GUESTBOK SUBMISHEN RECIEVED!!! i will print this out and put it on my frige!!!",
        "WOW a REEL coment!!! this is the best day of my life (after the day i discuvered lambada chi)!!!",
        "THANK YOU!!! can u also email lambada chi and tell them to give me a bid?? pleese?? my emale is on the sight",
        "OMG ANOTHER VISITER!!! ok that brings my total frends count to... *counts on fingres*... FORE!!!",
        "your coment has been SAVED to my databace (a notepad file on my desktop called guestbok.txt)",
        "AMAZEING!!! ur coment will be added to the sight in 3-5 buisness days (i have to ask my mom how to update the HTML)"
    ];

    btn.addEventListener('click', function() {
        const textarea = document.querySelector('.gb-textarea');
        const msg = textarea ? textarea.value.trim() : '';

        if (!msg) {
            alert('PLEESE WRITE SOMTHING!!! my guestbok is EMPTY and it makes me sad :(');
            return;
        }

        const response = responses[Math.floor(Math.random() * responses.length)];
        alert(response);

        if (textarea) textarea.value = '';
    });
}

/* ============================================
   Sparkle Cursor Trail
   ============================================ */
function initSparkleTrail() {
    const container = document.getElementById('sparkle-container');
    if (!container) return;

    const sparkles = ['✨', '⭐', '💫', '🌟', '✦', '★', '⚡'];
    let throttle = false;

    document.addEventListener('mousemove', function(e) {
        if (throttle) return;
        throttle = true;
        setTimeout(() => throttle = false, 80);

        const sparkle = document.createElement('div');
        sparkle.className = 'sparkle';
        sparkle.textContent = sparkles[Math.floor(Math.random() * sparkles.length)];
        sparkle.style.left = e.clientX + 'px';
        sparkle.style.top = e.clientY + 'px';
        container.appendChild(sparkle);

        setTimeout(() => sparkle.remove(), 800);
    });
}

/* ============================================
   Random Annoying Popups (just alerts)
   ============================================ */
function initRandomPopups() {
    const popups = [
        "REMINDER: Spear Mastr is STILL waiting for his bid from Lambada Chi Alfha. Its been 7 semsters. SEVEN.",
        "DID YOU NO: Spear Mastr can hold his breth for ALMOST 40 secands?? That is LONGER then most fish (he thinks).",
        "IMPORTENT ANOWNCMENT: Spear Mastr just updated his resume to inclood 'websight deziner' under his skilz",
        "FUN FACT: Spear Mastr has sent exactley 247 emails to the Lambda Chi chaptir email. They have responded to ZERO of them. But he stays POSTIVE.",
        "BREAKKING NEWS: Spear Mastr was seen outsied the chaptir howse again. He says he was 'just walking by' but he had a sleeping bag."
    ];

    // Random popup after 30-60 seconds
    const delay = Math.random() * 30000 + 30000;
    setTimeout(() => {
        alert(popups[Math.floor(Math.random() * popups.length)]);
    }, delay);

    // Another one 60-120 seconds later
    setTimeout(() => {
        alert(popups[Math.floor(Math.random() * popups.length)]);
    }, delay + Math.random() * 60000 + 60000);
}
