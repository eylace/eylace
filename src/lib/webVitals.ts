import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

/**
 * Report Core Web Vitals (FCP, LCP, CLS, INP, TTFB) to the console and
 * window-level event for any analytics handlers to consume. Buffered so
 * late-loading analytics (GTM, GA4, FB CAPI) still receive every metric.
 */

type Reporter = (m: Metric) => void;

const buffered: Metric[] = [];

const report: Reporter = (metric) => {
  buffered.push(metric);

  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info(
      `[web-vitals] ${metric.name}=${metric.value.toFixed(2)} (${metric.rating})`
    );
  }

  try {
    window.dispatchEvent(new CustomEvent('web-vitals', { detail: metric }));
  } catch {
    /* noop */
  }

  // Forward to GA4 / GTM if present.
  const w = window as unknown as { gtag?: (...a: unknown[]) => void; dataLayer?: unknown[] };
  if (typeof w.gtag === 'function') {
    w.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_rating: metric.rating,
      metric_delta: metric.delta,
      non_interaction: true,
    });
  } else if (Array.isArray(w.dataLayer)) {
    w.dataLayer.push({ event: 'web-vitals', metric });
  }
};

let started = false;
export function initWebVitals(): void {
  if (started || typeof window === 'undefined') return;
  started = true;
  onCLS(report);
  onFCP(report);
  onLCP(report);
  onINP(report);
  onTTFB(report);
}

/** Read everything reported so far — handy for tests / debug overlays. */
export function getReportedMetrics(): Metric[] {
  return buffered.slice();
}