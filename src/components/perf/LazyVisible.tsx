import { ReactNode, useEffect, useRef, useState } from 'react';

interface LazyVisibleProps {
  children: ReactNode;
  /** Pixel margin around the root to start mounting early. */
  rootMargin?: string;
  /** Minimum placeholder height to reserve to avoid CLS. */
  minHeight?: number | string;
  /** Once mounted, keep mounted (default true). */
  keepMounted?: boolean;
}

/**
 * Defers mounting of its children until the placeholder is near the viewport.
 * Prevents below-the-fold sections from running data fetches & rendering
 * during the initial page load, which dramatically improves TTI / LCP / TBT.
 */
export const LazyVisible = ({
  children,
  rootMargin = '400px 0px',
  minHeight = 320,
  keepMounted = true,
}: LazyVisibleProps) => {
  const ref = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (visible && keepMounted) return;
    const el = ref.current;
    if (!el) return;

    // Fallback for browsers without IO
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setVisible(true);
            io.disconnect();
            break;
          }
        }
      },
      { rootMargin, threshold: 0.01 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible, keepMounted, rootMargin]);

  return (
    <div ref={ref} style={!visible ? { minHeight } : undefined}>
      {visible ? children : null}
    </div>
  );
};
