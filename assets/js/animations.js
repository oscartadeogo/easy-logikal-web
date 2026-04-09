/* 
   Optimized Animations System v3 – Professional
   Easy Logikal Comercialización
   Easings: expo.out / power3.out | Stagger coordinado | Hover micro-interactions
*/

document.addEventListener('DOMContentLoaded', () => {
    // Respect prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Register GSAP Plugins
    gsap.registerPlugin(ScrollTrigger);

    // Global GSAP Defaults – refined easings
    gsap.defaults({
        ease: "expo.out",
        duration: 0.7,
        force3D: true
    });

    // Kick off all animations after first paint
    requestAnimationFrame(() => {
        startEntranceAnimations();
        initScrollReveals();
        initImageReveals();
        initCardHoverEffects();
    });

    // ─── Hero Entrance ────────────────────────────────────────────────────────
    function startEntranceAnimations() {
        if (!document.querySelector('.hero-title')) return;

        const heroTl = gsap.timeline({
            defaults: { ease: "expo.out" }
        });

        heroTl
            .fromTo('.hero-title',
                { y: 70, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.3 }
            )
            .fromTo('.hero-description',
                { y: 35, opacity: 0 },
                { y: 0, opacity: 1, duration: 1.1 },
                "-=1.0"
            )
            .fromTo('.hero-btns .btn',
                { y: 25, opacity: 0 },
                { y: 0, opacity: 1, stagger: 0.18, duration: 0.9 },
                "-=0.8"
            );
    }

    // ─── Header Scroll (CSS-class based, no constant GSAP updates) ────────────
    const header = document.querySelector('.header');
    if (header) {
        ScrollTrigger.create({
            start: 'top -100',
            onUpdate: (self) => {
                if (self.direction === 1 && self.scroll() > 200) {
                    header.classList.add('header-hidden');
                } else {
                    header.classList.remove('header-hidden');
                }
                header.classList.toggle('scrolled', self.scroll() > 50);
            }
        });
    }

    // ─── Scroll Reveal – stagger coordinado ───────────────────────────────────
    function initScrollReveals() {
        const revealItems = document.querySelectorAll('[data-reveal]');
        if (!revealItems.length) return;

        ScrollTrigger.batch(revealItems, {
            onEnter: batch => {
                gsap.to(batch, {
                    opacity: 1,
                    y: 0,
                    x: 0,
                    stagger: { amount: 0.4, from: "start" },
                    duration: 0.9,
                    ease: "power3.out",
                    onStart: () => batch.forEach(el => el.classList.add('active')),
                    overwrite: true
                });
            },
            start: "top 90%",
            once: true
        });
    }

    // ─── Image Reveal (GPU optimized) ─────────────────────────────────────────
    function initImageReveals() {
        const imgWrappers = document.querySelectorAll('.image-wrapper:not(.no-reveal)');
        imgWrappers.forEach(wrapper => {
            if (wrapper.querySelector('.reveal-img-overlay')) return;

            const overlay = document.createElement('div');
            overlay.className = 'reveal-img-overlay';
            wrapper.style.position = 'relative';
            wrapper.style.overflow = 'hidden';
            wrapper.appendChild(overlay);

            gsap.set(overlay, { xPercent: -101 });

            gsap.to(overlay, {
                scrollTrigger: {
                    trigger: wrapper,
                    start: 'top 85%',
                    toggleActions: "play none none none"
                },
                xPercent: 101,
                duration: 1.1,
                ease: "power3.inOut"
            });
        });
    }

    // ─── Card Hover Micro-interactions ────────────────────────────────────────
    function initCardHoverEffects() {
        const cards = document.querySelectorAll('.product-card, .category-card');
        cards.forEach(card => {
            const img = card.querySelector('img');

            card.addEventListener('mouseenter', () => {
                gsap.to(card, { y: -8, duration: 0.3, ease: 'power3.out', overwrite: 'auto' });
                if (img) gsap.to(img, { scale: 1.08, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
            });

            card.addEventListener('mouseleave', () => {
                gsap.to(card, { y: 0, duration: 0.45, ease: 'expo.out', overwrite: 'auto' });
                if (img) gsap.to(img, { scale: 1, duration: 0.4, ease: 'power2.out', overwrite: 'auto' });
            });
        });
    }

    // ─── Parallax (selective & light) ─────────────────────────────────────────
    document.querySelectorAll('[data-parallax]').forEach(item => {
        const speed = parseFloat(item.getAttribute('data-parallax')) || 0.1;
        gsap.to(item, {
            scrollTrigger: {
                trigger: item,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            },
            y: () => -ScrollTrigger.maxScroll(window) * speed,
            ease: "none"
        });
    });
});
