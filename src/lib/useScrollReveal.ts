import { useEffect } from 'react';

/** Reveal only the public presentation; keep forms, dialogs and miniature sites stable. */
export function useScrollReveal(active: boolean) {
  useEffect(() => {
    const root = document.querySelector('.atlas-public-site');
    if (!active || !root || typeof IntersectionObserver === 'undefined') return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const targets = 'section h1, section h2, section h2 ~ p, section span.uppercase, section .grid > *, section [data-reveal], footer > div > *';
    const registered = new Set<HTMLElement>();
    const show = (element: HTMLElement) => element.classList.add('is-visible');
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        show(entry.target as HTMLElement);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.08, rootMargin: '0px 0px -24px 0px' });
    const register = () => {
      if (preference.matches) return;
      for (const element of root.querySelectorAll<HTMLElement>(targets)) {
        if (registered.has(element) || element.closest('[data-reveal-skip], dialog, [role="dialog"]') ||
          element.parentElement?.closest('.reveal')) continue;
        registered.add(element);
        if (element.classList.contains('is-visible') || element.getBoundingClientRect().bottom <= 0) {
          show(element); continue;
        }
        const parent = element.parentElement;
        const grouped = parent?.matches('.grid, [data-reveal-group]');
        const index = grouped ? Math.max(0, Array.from(parent!.children).indexOf(element)) : 0;
        const interval = parent?.hasAttribute('data-reveal-group') ? 200 : 100;
        element.style.setProperty('--reveal-delay', `${Math.min(index, 5) * interval}ms`);
        element.classList.add('reveal');
        observer.observe(element);
      }
    };
    const onPreference = () => {
      if (preference.matches) {
        observer.disconnect();
        registered.forEach(show);
      } else register();
    };
    register();
    const mutations = new MutationObserver(register);
    mutations.observe(root, { childList: true, subtree: true });
    preference.addEventListener('change', onPreference);
    return () => {
      observer.disconnect(); mutations.disconnect();
      preference.removeEventListener('change', onPreference);
      registered.forEach(element => { element.classList.remove('reveal'); element.style.removeProperty('--reveal-delay'); });
    };
  }, [active]);
}
