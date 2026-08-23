import { useEffect, useState } from 'react';

/** Tracks the `prefers-reduced-motion` media query live (accessibility requirement). */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(() =>
    typeof window !== 'undefined' ? window.matchMedia('(prefers-reduced-motion: reduce)').matches : false
  );

  useEffect(() => {
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return reduced;
}

/** Below this width the story renders the lightweight, non-WebGL mobile fallback. */
export const MOBILE_BREAKPOINT_PX = 820;

export function useIsMobileViewport(): boolean {
  const [isMobile, setIsMobile] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth < MOBILE_BREAKPOINT_PX : false
  );

  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const handler = (event: MediaQueryListEvent) => setIsMobile(event.matches);
    setIsMobile(query.matches);
    query.addEventListener('change', handler);
    return () => query.removeEventListener('change', handler);
  }, []);

  return isMobile;
}

/** Reports whether `ref` is intersecting the viewport — used to pause rendering/animation off-screen. */
export function useInViewport<T extends Element>(
  ref: React.RefObject<T | null>,
  rootMargin = '0px'
): boolean {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { rootMargin }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [ref, rootMargin]);

  return inView;
}
