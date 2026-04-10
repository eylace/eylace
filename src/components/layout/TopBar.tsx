import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TopBarConfig {
  enabled: boolean;
  headlines: string[];
  bg_color: string;
  text_color: string;
  speed: number; // seconds for one full scroll
}

export const TopBar = () => {
  const [config, setConfig] = useState<TopBarConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'top_bar_headlines')
      .maybeSingle()
      .then(({ data }) => {
        if (data?.value) {
          const val = data.value as unknown as TopBarConfig;
          if (val.enabled && val.headlines?.length > 0) setConfig(val);
        }
      });
  }, []);

  if (!config || dismissed) return null;

  const separator = '  ★  ';
  const fullText = config.headlines.join(separator) + separator;
  const duration = config.speed || 30;

  return (
    <div
      className="relative overflow-hidden"
      style={{
        backgroundColor: config.bg_color || '#1a1a2e',
        color: config.text_color || '#ffffff',
        height: '40px',
      }}
    >
      <div className="absolute inset-0 flex items-center">
        <div
          className="topbar-marquee whitespace-nowrap text-sm font-medium"
          style={{
            animationDuration: `${duration}s`,
          }}
        >
          <span>{fullText}</span>
          <span>{fullText}</span>
        </div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="absolute right-2 top-1/2 -translate-y-1/2 z-10 opacity-60 hover:opacity-100 transition-opacity bg-black/20 rounded-full p-1"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
};
