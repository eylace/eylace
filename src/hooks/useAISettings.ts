import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AISettings {
  ai_search_enabled: boolean;
  ai_chat_enabled: boolean;
  ai_chat_greeting: string;
  ai_description_enabled: boolean;
  ai_analyzer_enabled: boolean;
  fb_messenger_enabled: boolean;
  [key: string]: any;
}

const defaultSettings: AISettings = {
  ai_search_enabled: true,
  ai_chat_enabled: true,
  ai_chat_greeting: 'আসসালামু আলাইকুম! 👋 Grand Mall Emporium-এ স্বাগতম। আমি আপনার AI শপিং সহকারী। কিভাবে সাহায্য করতে পারি?',
  ai_description_enabled: true,
  ai_analyzer_enabled: true,
  fb_messenger_enabled: false,
};

export const useAISettings = () => {
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  const loadSettings = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'ai_settings')
        .maybeSingle();
      if (data?.value) {
        setSettings({ ...defaultSettings, ...(data.value as any) });
      }
    } catch (e) {
      console.error('Failed to load AI settings', e);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  return { settings, loading };
};
