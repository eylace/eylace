import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';

interface SmartBarConfig {
  enabled: boolean;
  text: string;
  link: string;
  bg_color: string;
  text_color: string;
}

export const SmartBar = () => {
  const [config, setConfig] = useState<SmartBarConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    supabase.from('system_settings').select('value').eq('key', 'smart_bar').maybeSingle().then(({ data }) => {
      if (data?.value) {
        const val = data.value as unknown as SmartBarConfig;
        if (val.enabled && val.text) setConfig(val);
      }
    });
  }, []);

  if (!config || dismissed) return null;

  return (
    <div
      className="relative flex items-center justify-center px-4 py-2.5 text-sm font-medium"
      style={{ backgroundColor: config.bg_color || 'hsl(var(--primary))', color: config.text_color || 'hsl(var(--primary-foreground))' }}
    >
      {config.link ? (
        <Link to={config.link} className="hover:underline">{config.text}</Link>
      ) : (
        <span>{config.text}</span>
      )}
      <button
        onClick={() => setDismissed(true)}
        className="absolute right-3 top-1/2 -translate-y-1/2 opacity-70 hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
