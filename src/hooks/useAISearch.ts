import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AISearchResult {
  product_ids: string[];
  ai_message: string;
}

export const useAISearch = () => {
  const [isSearching, setIsSearching] = useState(false);
  const [aiMessage, setAiMessage] = useState('');
  const [aiProductIds, setAiProductIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const searchWithAI = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setAiProductIds([]);
      setAiMessage('');
      return;
    }

    setIsSearching(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-product-search', {
        body: { query: query.trim() },
      });

      if (fnError) throw fnError;

      if (data?.error) {
        setError(data.error);
        setAiProductIds([]);
        setAiMessage('');
        return;
      }

      const result = data as AISearchResult;
      setAiProductIds(result.product_ids || []);
      setAiMessage(result.ai_message || '');
    } catch (err: any) {
      console.error('AI search error:', err);
      setError(err?.message || 'AI search failed');
      setAiProductIds([]);
      setAiMessage('');
    } finally {
      setIsSearching(false);
    }
  }, []);

  const clearAISearch = useCallback(() => {
    setAiProductIds([]);
    setAiMessage('');
    setError(null);
  }, []);

  return {
    searchWithAI,
    clearAISearch,
    isSearching,
    aiMessage,
    aiProductIds,
    error,
  };
};
