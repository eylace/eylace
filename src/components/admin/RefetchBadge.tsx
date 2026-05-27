import { Loader2 } from 'lucide-react';
import { useIsFetching, useIsMutating } from '@tanstack/react-query';

/**
 * Subtle "Updating…" pill shown in the admin header whenever any admin-*
 * query is background-refetching or a mutation is in flight. Replaces the
 * full-screen spinner so revisits feel instant.
 */
export function RefetchBadge() {
  const fetching = useIsFetching({
    predicate: (q) =>
      Array.isArray(q.queryKey) &&
      typeof q.queryKey[0] === 'string' &&
      q.queryKey[0].startsWith('admin-') &&
      // only background fetches (data already present)
      q.state.data !== undefined,
  });
  const mutating = useIsMutating();
  const active = fetching > 0 || mutating > 0;
  if (!active) return null;
  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-accent/10 text-accent text-[10px] font-medium"
    >
      <Loader2 className="h-3 w-3 animate-spin" />
      Updating…
    </span>
  );
}