// Rose Amir Pour - Portfolio Script
// Adapted from Adam Camilleri's portfolio with all animations preserved

// ==========================================================================
// Shared Animation Foundation (inlined from shared/animations.js)
// ==========================================================================

const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function shouldAnimate() {
    return !prefersReducedMotion.matches;
}

const TIMING = {
    interaction: 0.2,
    entrance: 0.6,
    staggerDelay: 0.1,
};

const EASING = 'power2.out';

function gsapAvailable() {
    if (typeof gsap === 'undefined') {
        console.warn('[animations.js] GSAP not found on window.');
        return false;
    }
    return true;
}

function revealOnScroll(selector, options) {
    if (!shouldAnimate()) return;
    if (!gsapAvailable()) return;
    options = options || {};

    gsap.registerPlugin(ScrollTrigger);

    document.querySelectorAll(selector).forEach(function(el) {
        ScrollTrigger.create({
            trigger: el,
            start: 'top 85%',
            once: true,
            ...options,
            onEnter: function() {
                gsap.fromTo(el,
                    { opacity: 0, y: 30 },
                    { opacity: 1, y: 0, duration: TIMING.entrance, ease: EASING, clearProps: 'opacity,transform' }
                );
            },
        });
    });
}

function staggerCards(selector) {
    if (!shouldAnimate()) return;
    if (!gsapAvailable()) return;

    gsap.registerPlugin(ScrollTrigger);

    ScrollTrigger.batch(selector, {
        start: 'top 85%',
        once: true,
        onEnter: function(batch) {
            gsap.fromTo(batch,
                { opacity: 0, y: 30 },
                { opacity: 1, y: 0, duration: TIMING.entrance, ease: EASING, stagger: TIMING.staggerDelay, clearProps: 'opacity,transform' }
            );
        },
    });
}

function initScrollAnimations(config) {
    if (!shouldAnimate()) return;
    config = config || {};

    function init() {
        if (config.sections) {
            revealOnScroll(config.sections);
        }
        if (config.cards) {
            staggerCards(config.cards);
        }
    }

    if (config.afterEvent) {
        var trigger = document.querySelector(config.afterEvent);
        if (trigger) {
            trigger.addEventListener('transitionend', function() { init(); }, { once: true });
        } else {
            init();
        }
    } else {
        init();
    }
}

// ==========================================================================
// Rotating hero phrases
// ==========================================================================

var HERO_PHRASES = [
    { article: 'an', line1: 'Aspiring Cognitive', line2: 'Researcher' },
    { article: 'a', line1: 'Dedicated Research', line2: 'Assistant' },
    { article: 'a', line1: 'Passionate Science', line2: 'Communicator' },
    { article: 'an', line1: 'Emerging Psychology', line2: 'Scholar' }
];

var heroCurrentIndex = 0;

var CURTAIN_DURATION_MS = 250;

function runCurtainAnimation() {
    window.scrollTo(0, 0);
    heroCurrentIndex = Math.floor(Math.random() * HERO_PHRASES.length);
    var phrase = HERO_PHRASES[heroCurrentIndex];
    document.getElementById('heroN').classList.toggle('visible', phrase.article === 'an');
    document.getElementById('heroLine1').textContent = phrase.line1;
    document.getElementById('heroLine2').textContent = phrase.line2;

    var curtain = document.getElementById('heroCurtain');
    var overlay = document.getElementById('heroLoadOverlay');
    curtain.classList.remove('hero-curtain--rising', 'hero-curtain--done');
    overlay.classList.remove('hero-load-overlay--done');
    overlay.style.background = '#ffffff';
    document.querySelector('header').classList.remove('header--revealed');
    document.querySelectorAll('.animate-reveal').forEach(function(el) { el.classList.remove('animate-reveal--visible'); });
    document.querySelectorAll('.scroll-reveal').forEach(function(el) { el.classList.remove('scroll-reveal--visible'); });

    requestAnimationFrame(function() {
        curtain.classList.add('hero-curtain--rising');
        setTimeout(function() {
            overlay.style.background = '#1a1a1a';
            curtain.classList.add('hero-curtain--done');
            overlay.classList.add('hero-load-overlay--done');
            document.querySelector('header').classList.add('header--revealed');
            curtain.style.pointerEvents = 'none';
            startHeroReveal();
        }, CURTAIN_DURATION_MS);
    });
}

function startHeroReveal() {
    var delays = { 0: 0, 1: 200, 2: 450, 3: 700, 4: 1100 };
    document.querySelectorAll('.animate-reveal').forEach(function(el) {
        var d = parseInt(el.dataset.delay || '0', 10);
        setTimeout(function() { el.classList.add('animate-reveal--visible'); }, delays[d] || 0);
    });
    setTimeout(startCountUp, 800);
}

function startCountUp() {
    document.querySelectorAll('.stat-number').forEach(function(el) {
        var target = parseInt(el.dataset.count || '0', 10);
        var suffix = el.dataset.suffix || '';
        var duration = 1000;
        var startTime = performance.now();
        function update(currentTime) {
            var elapsed = currentTime - startTime;
            var progress = Math.min(elapsed / duration, 1);
            var eased = 1 - Math.pow(1 - progress, 3);
            var value = Math.floor(eased * target);
            el.textContent = value + suffix;
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target + suffix;
        }
        requestAnimationFrame(update);
    });
}

function shuffleHeroTitle() {
    var line1El = document.querySelector('.hero-line1');
    var line2El = document.querySelector('.hero-line2');
    var nEl = document.getElementById('heroN');

    // Phase 1: slide lines out + fade the "n" if present
    line1El.classList.remove('animate-reveal--visible');
    line2El.classList.remove('animate-reveal--visible');
    if (nEl) nEl.classList.remove('visible');

    // Phase 2: swap text, toggle "n", slide lines back in
    setTimeout(function() {
        heroCurrentIndex = (heroCurrentIndex + 1) % HERO_PHRASES.length;
        var phrase = HERO_PHRASES[heroCurrentIndex];
        document.getElementById('heroLine1').textContent = phrase.line1;
        document.getElementById('heroLine2').textContent = phrase.line2;

        requestAnimationFrame(function() {
            requestAnimationFrame(function() {
                if (nEl && phrase.article === 'an') nEl.classList.add('visible');
                line1El.classList.add('animate-reveal--visible');
                setTimeout(function() { line2El.classList.add('animate-reveal--visible'); }, 240);
            });
        });
    }, 700);
}

// ==========================================================================
// Floating Hearts/Petals in Hero
// ==========================================================================

function spawnHeroPetals() {
    var container = document.getElementById('heroPetals');
    if (!container) return;
    var symbols = ['♥', '♡', '✿', '❀', '✾'];

    function createPetal() {
        var el = document.createElement('span');
        el.className = 'hero-petal';
        el.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        el.style.left = Math.random() * 100 + '%';
        el.style.fontSize = (0.6 + Math.random() * 1) + 'rem';
        el.style.animationDuration = (6 + Math.random() * 8) + 's';
        el.style.animationDelay = (Math.random() * 2) + 's';
        container.appendChild(el);
        setTimeout(function() { el.remove(); }, 16000);
    }

    // Spawn initial batch
    for (var i = 0; i < 6; i++) {
        setTimeout(createPetal, i * 800);
    }
    // Continue spawning
    setInterval(createPetal, 2500);
}

// ==========================================================================
// Cursor Trail Hearts on Hero
// ==========================================================================

function initCursorTrail() {
    var symbols = ['♥', '♡'];
    var throttle = 0;

    document.addEventListener('mousemove', function(e) {
        var now = Date.now();
        if (now - throttle < 80) return;
        throttle = now;

        var heart = document.createElement('span');
        heart.className = 'cursor-heart';
        heart.textContent = symbols[Math.floor(Math.random() * symbols.length)];
        heart.style.left = e.clientX + 'px';
        heart.style.top = e.clientY + 'px';
        heart.style.fontSize = (10 + Math.random() * 8) + 'px';
        document.body.appendChild(heart);
        setTimeout(function() { heart.remove(); }, 800);
    });
}

// ==========================================================================
// DOMContentLoaded - main init
// ==========================================================================

document.addEventListener('DOMContentLoaded', function() {
    runCurtainAnimation();
    setInterval(shuffleHeroTitle, 5000);
    spawnHeroPetals();
    initCursorTrail();

    // Lenis smooth scroll
    var lenis = null;
    try {
        lenis = new Lenis({ lerp: 0.1, duration: 1.2 });
        function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
        requestAnimationFrame(raf);
    } catch(e) {
        console.warn('Lenis failed to load:', e);
    }

    // Scroll reveal for sections
    var revealSections = document.querySelectorAll('.scroll-reveal');
    var revealObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('scroll-reveal--visible');
                entry.target.style.opacity = '';
                entry.target.style.transform = '';
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });
    revealSections.forEach(function(s) { revealObserver.observe(s); });

    // Safety fallback: force all content visible after 3s
    setTimeout(function() {
        document.querySelectorAll('.scroll-reveal').forEach(function(el) {
            el.classList.add('scroll-reveal--visible');
            el.style.opacity = '';
            el.style.transform = '';
        });
        document.querySelectorAll('.animate-reveal').forEach(function(el) {
            el.classList.add('animate-reveal--visible');
        });
    }, 3000);

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function(e) {
            var href = this.getAttribute('href');
            if (href && href !== '#') {
                e.preventDefault();
                if (lenis) {
                    lenis.scrollTo(href, { offset: 0 });
                } else {
                    document.querySelector(href).scrollIntoView({ behavior: 'smooth' });
                }
                history.replaceState(null, '', href);
            }
        });
    });

    // Mobile Navigation
    var burger = document.querySelector('.burger');
    var navLinks = document.querySelector('.nav-links');

    burger.addEventListener('click', function() {
        navLinks.classList.toggle('nav-active');
        burger.classList.toggle('toggle');
    });

    // Close mobile menu on nav link click
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(function(anchor) {
        anchor.addEventListener('click', function() {
            if (navLinks.classList.contains('nav-active')) {
                navLinks.classList.remove('nav-active');
                burger.classList.remove('toggle');
            }
        });
    });

    // Active Navigation on Scroll
    var sections = document.querySelectorAll('section');
    var navItems = document.querySelectorAll('.nav-links a');

    window.addEventListener('scroll', function() {
        var current = '';

        sections.forEach(function(section) {
            var sectionTop = section.offsetTop;
            var sectionHeight = section.clientHeight;
            if (pageYOffset >= (sectionTop - sectionHeight / 3)) {
                current = section.getAttribute('id');
            }
        });

        navItems.forEach(function(item) {
            item.classList.remove('active');
            if (item.getAttribute('href') === '#' + current) {
                item.classList.add('active');
            }
        });
    });

    // Form Animation
    var formInputs = document.querySelectorAll('.form-group input, .form-group textarea');

    formInputs.forEach(function(input) {
        input.addEventListener('focus', function() {
            input.parentElement.classList.add('focused');
        });

        input.addEventListener('blur', function() {
            if (input.value === '') {
                input.parentElement.classList.remove('focused');
            }
        });

        // Check on page load
        if (input.value !== '') {
            input.parentElement.classList.add('focused');
        }
    });

    // 3D Tilt + Shine on research cards
    document.querySelectorAll('.project-card-h').forEach(function(card) {
        card.addEventListener('mousemove', function(e) {
            var rect = this.getBoundingClientRect();
            var x = e.clientX - rect.left;
            var y = e.clientY - rect.top;
            var cx = rect.width / 2;
            var cy = rect.height / 2;
            var rotateY = ((x - cx) / cx) * 7;
            var rotateX = -((y - cy) / cy) * 4;
            this.style.transform = 'perspective(1000px) rotateX(' + rotateX + 'deg) rotateY(' + rotateY + 'deg) scale3d(1.02,1.02,1.02)';
        });
        card.addEventListener('mouseleave', function() {
            this.style.transform = '';
        });
    });

    // Form Submission
    var contactForm = document.getElementById('contactForm');
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            var submitBtn = this.querySelector('.submit-btn');
            var originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = 'Sending... <i class="fas fa-spinner fa-spin"></i>';
            submitBtn.disabled = true;
        });
    }

    // GSAP scroll animations - wait for curtain to finish
    var scrollAnimsStarted = false;
    function startScrollAnims() {
        if (scrollAnimsStarted) return;
        scrollAnimsStarted = true;
        initScrollAnimations({
            cards: '.project-card-h'
        });
    }
    var curtain = document.getElementById('heroCurtain');
    if (curtain) {
        curtain.addEventListener('transitionend', function() {
            startScrollAnims();
        }, { once: true });
        // Fallback if curtain already finished
        setTimeout(function() {
            startScrollAnims();
        }, 2000);
    } else {
        startScrollAnims();
    }
});

// Re-run curtain when page restored from bfcache
window.addEventListener('pageshow', function(event) {
    if (event.persisted) {
        runCurtainAnimation();
    }
});
