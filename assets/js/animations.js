/* 
   Animations with GSAP
   Easy Logikal Comercialización
*/

document.addEventListener('DOMContentLoaded', () => {
    // Register GSAP Plugins
    gsap.registerPlugin(ScrollTrigger);

    // 1. Start Entrance Animations Immediately
    startEntranceAnimations();

    function startEntranceAnimations() {
        // Hero Section Animations
        const heroTl = gsap.timeline();
        
        heroTl.from('.hero-title', {
            y: 100,
            opacity: 0,
            duration: 1.2,
            ease: 'power4.out'
        })
        .from('.hero-description', {
            y: 50,
            opacity: 0,
            duration: 1,
            ease: 'power3.out'
        }, '-=0.8')
        .from('.hero-btns .btn', {
            y: 30,
            opacity: 0,
            duration: 0.8,
            stagger: 0.2,
            ease: 'power2.out'
        }, '-=0.6');
    }

    // 2. Removed Page Transition Logic (Instant Navigation)
    /*
    const transitionOverlay = document.createElement('div');
    transitionOverlay.className = 'page-transition-overlay';
    document.body.appendChild(transitionOverlay);

    document.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && !href.startsWith('#') && !link.target && href !== 'javascript:void(0)') {
                e.preventDefault();
                gsap.to(transitionOverlay, {
                    scaleY: 1,
                    duration: 0.6,
                    ease: 'power4.inOut',
                    transformOrigin: 'bottom',
                    onComplete: () => {
                        window.location.href = href;
                    }
                });
            }
        });
    });
    */

    // 3. Smooth Header Scroll
    const header = document.querySelector('.header');
    ScrollTrigger.create({
        start: 'top -50',
        onUpdate: (self) => {
            if (self.direction === 1) {
                gsap.to(header, { yPercent: -100, duration: 0.3 });
            } else {
                gsap.to(header, { yPercent: 0, duration: 0.3 });
            }
            if (self.scroll() > 100) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }
    });

    // 4. Scroll Reveal Animations (Optimized)
    const revealItems = document.querySelectorAll('[data-reveal]');
    revealItems.forEach(item => {
        const direction = item.getAttribute('data-reveal');
        let x = 0, y = 0;
        
        if (direction === 'left') x = -40;
        if (direction === 'right') x = 40;
        if (direction === 'up') y = 30;
        if (direction === 'down') y = -30;

        gsap.from(item, {
            scrollTrigger: {
                trigger: item,
                start: 'top 92%',
                toggleActions: 'play none none none'
            },
            x: x,
            y: y,
            opacity: 0,
            duration: 0.8,
            ease: 'power2.out',
            clearProps: 'all'
        });
    });

    // 5. Image Reveal Interaction (Cleaned Up)
    const imgWrappers = document.querySelectorAll('.image-wrapper:not(.no-reveal)');
    imgWrappers.forEach(wrapper => {
        const overlay = document.createElement('div');
        overlay.className = 'reveal-img-overlay';
        wrapper.style.position = 'relative';
        wrapper.style.overflow = 'hidden';
        wrapper.appendChild(overlay);

        gsap.to(overlay, {
            scrollTrigger: {
                trigger: wrapper,
                start: 'top 85%',
            },
            xPercent: 100,
            duration: 1,
            ease: 'power2.inOut'
        });
    });
});
