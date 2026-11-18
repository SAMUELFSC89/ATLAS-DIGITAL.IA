import { useEffect } from 'react';

const TARGETS = [
  'h2', 'h2 ~ p', 'h2 ~ span', 'span.uppercase', '.grid > *', '[data-reveal]',
].map(selector => `section:not(#home) ${selector}`).join(',');

/**
 * Elements of the landing sections fade and rise into place as they enter the screen.
 * Grid items enter in sequence. Visitors who prefer reduced motion see everything at once (see index.css).
 */
export function useScrollReveal(active: boolean) {
  useEffect(() => {
    if (!active || typeof IntersectionObserver === 'undefined') return;
    const elements = Array.from(document.querySelectorAll<HTMLElement>(TARGETS))
      .filter(element => !element.closest('main') && !element.classList.contains('is-visible'));
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    for (const element of elements) {
      // Nested matches (a heading inside a grid card) would animate twice; the outer element is enough.
      // The effect can run twice (React StrictMode), so elements marked in the first run are observed again.
      if (element.parentElement?.closest('.reveal')) continue;
      const siblings = element.parentElement?.classList.contains('grid') ? Array.from(element.parentElement.children) : [];
      const index = Math.max(0, siblings.indexOf(element));
      element.style.setProperty('--reveal-delay', `${Math.min(index, 6) * 90}ms`);
      element.classList.add('reveal');
      observer.observe(element);
    }
    return () => observer.disconnect();
  }, [active]);
}
