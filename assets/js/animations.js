/* 
   Optimized Animations System v2
   Easy Logikal Comercialización
*/

document.addEventListener('DOMContentLoaded', () => {
    // 1. Performance: Pause GSAP/ScrollTrigger on low-end or background
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) return;

    // Register GSAP Plugins
    gsap.registerPlugin(ScrollTrigger);

    // Global GSAP Defaults for Performance
    gsap.defaults({
        ease: "power2.out",
        duration: 0.6,
        force3D: true // Force GPU acceleration
    });

    // 2. Entrance Animations with requestAnimationFrame approach
    requestAnimationFrame(() => {
        startEntranceAnimations();
        initScrollReveals();
        initImageReveals();
    });

    function startEntranceAnimations() {
        if (!document.querySelector('.hero-title')) return;

        const heroTl = gsap.timeline({
            defaults: { ease: "expo.out" }
        });
        
        heroTl.fromTo('.hero-title', 
            { y: 60, opacity: 0 },
            { y: 0, opacity: 1, duration: 1.2 }
        )
        .fromTo('.hero-description', 
            { y: 30, opacity: 0 },
            { y: 0, opacity: 1, duration: 1 }, 
            "-=0.9"
        )
        .fromTo('.hero-btns .btn', 
            { y: 20, opacity: 0 },
            { y: 0, opacity: 1, stagger: 0.15, duration: 0.8 }, 
            "-=0.7"
        );
    }

    // 3. Smooth Header Scroll (Throttled/Optimized)
    const header = document.querySelector('.header');
    if (header) {
        ScrollTrigger.create({
            start: 'top -100',
            onUpdate: (self) => {
                // Use CSS classes instead of constant GSAP updates for header visibility
                if (self.direction === 1 && self.scroll() > 200) {
                    header.classList.add('header-hidden');
                } else {
                    header.classList.remove('header-hidden');
                }
                
                if (self.scroll() > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            }
        });
    }

    // 4. Scroll Reveal Animations (Batch Optimized)
    function initScrollReveals() {
        const revealItems = document.querySelectorAll('[data-reveal]');
        
        // Use batching for better performance on multiple items
        ScrollTrigger.batch(revealItems, {
            onEnter: batch => {
                gsap.to(batch, {
                    opacity: 1,
                    y: 0,
                    x: 0,
                    stagger: 0.1,
                    duration: 0.8,
                    ease: "power2.out",
                    onStart: () => {
                        batch.forEach(el => el.classList.add('active'));
                    },
                    // Remove clearProps to avoid sudden reset jumps
                    overwrite: true
                });
            },
            start: "top 90%",
            once: true
        });
    }

    // 5. Image Reveal Interaction (GPU Optimized)
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
                duration: 1,
                ease: "power2.inOut",
                onComplete: () => {
                    // Optional: remove overlay from DOM to save memory
                    // overlay.remove(); 
                }
            });
        });
    }

    // 6. Global Parallax Effect (Selective & Light)
    const parallaxItems = document.querySelectorAll('[data-parallax]');
    parallaxItems.forEach(item => {
        const speed = item.getAttribute('data-parallax') || 0.1;
        gsap.to(item, {
            scrollTrigger: {
                trigger: item,
                start: "top bottom",
                end: "bottom top",
                scrub: true
            },
            y: (i, target) => -ScrollTrigger.maxScroll(window) * speed,
            ease: "none"
        });
    });
});
