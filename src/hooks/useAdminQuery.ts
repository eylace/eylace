import {
  useQuery,
  useQueryClient,
  type QueryKey,
  type UseQueryOptions,
} from '@tanstack/react-query';
import { useCallback } from 'react';

/**
 * useAdminQuery — drop-in cache wrapper for admin pages.
 *
 * Behavior:
 *  - Data is cached in QueryClient and persists across route changes,
 *    so revisiting an admin page renders instantly with no spinner.
 *  - Manual refresh only: call `refetch()` (returned) or
 *    `invalidateAdminQuery(key)` after a mutation/save/delete.
 *  - No window-focus / reconnect / remount refetching.
 *
 * Replace this pattern:
 *    const [items, setItems] = useState<T[]>([]);
 *    const [loading, setLoading] = useState(true);
 *    const fetch = async () => { setLoading(true); ...; setLoading(false); };
 *    useEffect(() => { fetch(); }, []);
 *
 * With:
 *    const { data: items = [], isLoading: loading, refetch: fetch } =
 *      useAdminQuery(['admin-something'], async () => {
 *        const { data } = await supabase.from('...').select('*');
 *        return data ?? [];
 *      });
 */
export function useAdminQuery<TData = unknown>(
  queryKey: QueryKey,
  queryFn: () => Promise<TData>,
  options?: Omit<
    UseQueryOptions<TData, Error, TData, QueryKey>,
    'queryKey' | 'queryFn'
  >,
) {
  return useQuery<TData, Error, TData, QueryKey>({
    queryKey,
    queryFn,
    staleTime: Infinity,
    gcTime: 30 * 60 * 1000,
    refetchOnMount: false,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
    ...options,
  });
}

/** Imperatively invalidate one or more admin query keys after a mutation. */
export function useInvalidateAdmin() {
  const qc = useQueryClient();
  return useCallback(
    (key: QueryKey) => qc.invalidateQueries({ queryKey: key }),
    [qc],
  );
}