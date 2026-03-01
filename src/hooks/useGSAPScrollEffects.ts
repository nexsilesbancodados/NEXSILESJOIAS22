import { useEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function useGSAPScrollEffects() {
  useEffect(() => {
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
          { scale: 0.85, opacity: 0 },
          {
            scale: 1, opacity: 1, duration: 1, ease: 'power3.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
          }
        );
      });

      // Slide from left
      gsap.utils.toArray<HTMLElement>('[data-gsap-left]').forEach((el) => {
        gsap.fromTo(el,
          { x: -80, opacity: 0 },
          {
            x: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
          }
        );
      });

      // Slide from right
      gsap.utils.toArray<HTMLElement>('[data-gsap-right]').forEach((el) => {
        gsap.fromTo(el,
          { x: 80, opacity: 0 },
          {
            x: 0, opacity: 1, duration: 0.8, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
          }
        );
      });

      // Stagger children
      gsap.utils.toArray<HTMLElement>('[data-gsap-stagger]').forEach((el) => {
        const children = el.children;
        gsap.fromTo(children,
          { y: 40, opacity: 0 },
          {
            y: 0, opacity: 1, stagger: 0.12, duration: 0.6, ease: 'power2.out',
            scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' },
          }
        );
      });

      // Rotate-in
      gsap.utils.toArray<HTMLElement>('[data-gsap-rotate]').forEach((el) => {
        gsap.fromTo(el,
          { rotation: -5, opacity: 0, scale: 0.9 },
          {
            rotation: 0, opacity: 1, scale: 1, duration: 1, ease: 'back.out(1.7)',
            scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
          }
        );
      });

      // Text reveal (clip-path wipe)
      gsap.utils.toArray<HTMLElement>('[data-gsap-reveal]').forEach((el) => {
        gsap.fromTo(el,
          { clipPath: 'inset(0 100% 0 0)' },
          {
            clipPath: 'inset(0 0% 0 0)', duration: 1.2, ease: 'power4.inOut',
            scrollTrigger: { trigger: el, start: 'top 80%', toggleActions: 'play none none reverse' },
          }
        );
      });

      // Counter animation
      gsap.utils.toArray<HTMLElement>('[data-gsap-counter]').forEach((el) => {
        const target = parseInt(el.dataset.gsapCounter || '0');
        const obj = { val: 0 };
        gsap.to(obj, {
          val: target,
          duration: 2,
          ease: 'power1.out',
          scrollTrigger: { trigger: el, start: 'top 85%', toggleActions: 'play none none reverse' },
          onUpdate: () => { el.textContent = Math.round(obj.val).toString(); },
        });
      });

      // Navbar shrink on scroll
      const navbar = document.querySelector('[data-gsap-navbar]');
      if (navbar) {
        ScrollTrigger.create({
          start: 'top -80',
          onUpdate: (self) => {
            if (self.direction === 1) {
              gsap.to(navbar, { y: -2, boxShadow: '0 4px 30px rgba(244,63,94,0.1)', duration: 0.3 });
            } else {
              gsap.to(navbar, { y: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.05)', duration: 0.3 });
            }
          },
        });
      }
    });

    return () => ctx.revert();
  }, []);
}
