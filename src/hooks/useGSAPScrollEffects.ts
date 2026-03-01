import { useEffect } from 'react';

// GSAP scroll effects - lightweight version that doesn't conflict with framer-motion
export function useGSAPScrollEffects() {
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    
    const init = async () => {
      const gsapModule = await import('gsap');
      const scrollTriggerModule = await import('gsap/ScrollTrigger');
      
      const gsap = gsapModule.default;
      const ScrollTrigger = scrollTriggerModule.ScrollTrigger;
      gsap.registerPlugin(ScrollTrigger);

      const ctx = gsap.context(() => {
        // Parallax on images with data-parallax
        gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
          const speed = parseFloat(el.dataset.parallax || '0.3');
          gsap.to(el, {
            yPercent: speed * 100,
            ease: 'none',
            scrollTrigger: {
              trigger: el.parentElement,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          });
        });

        // Scale-in elements
        gsap.utils.toArray<HTMLElement>('[data-gsap-scale]').forEach((el) => {
          gsap.fromTo(el,
            { scale: 0.88 },
            {
              scale: 1, duration: 1.2, ease: 'power3.out',
              scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 40%', scrub: 1 },
            }
          );
        });

        // Rotate-in  
        gsap.utils.toArray<HTMLElement>('[data-gsap-rotate]').forEach((el) => {
          gsap.fromTo(el,
            { rotation: -6, scale: 0.92 },
            {
              rotation: 0, scale: 1, duration: 1, ease: 'power2.out',
              scrollTrigger: { trigger: el, start: 'top 90%', end: 'top 50%', scrub: 1 },
            }
          );
        });

        // Text reveal (clip-path wipe)
        gsap.utils.toArray<HTMLElement>('[data-gsap-reveal]').forEach((el) => {
          gsap.fromTo(el,
            { clipPath: 'inset(0 100% 0 0)' },
            {
              clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power4.inOut',
              scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none none' },
            }
          );
        });

        // Navbar shadow on scroll
        const navbar = document.querySelector('[data-gsap-navbar]');
        if (navbar) {
          ScrollTrigger.create({
            start: 'top -80',
            onUpdate: (self) => {
              if (self.direction === 1) {
                gsap.to(navbar, { boxShadow: '0 4px 30px rgba(244,63,94,0.15)', duration: 0.3 });
              } else {
                gsap.to(navbar, { boxShadow: '0 1px 3px rgba(0,0,0,0.05)', duration: 0.3 });
              }
            },
          });
        }
      });

      cleanup = () => ctx.revert();
    };

    // Delay to let framer-motion render first
    const timeout = setTimeout(init, 500);
    return () => {
      clearTimeout(timeout);
      cleanup?.();
    };
  }, []);
}
