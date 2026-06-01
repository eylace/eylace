import { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export interface SmartBarConfig {
  enabled: boolean;
  text?: string;                       // legacy single message
  messages?: string[];                 // optional rotating messages
  rotation_seconds?: number;           // seconds per message
  link?: string;
  open_in_new_tab?: boolean;
  bg_color?: string;
  text_color?: string;
  gradient_enabled?: boolean;
  gradient_end_color?: string;
  icon?: string;                       // emoji or single char
  position?: 'top' | 'bottom';
  animation?: 'none' | 'marquee' | 'pulse' | 'slide';
  dismissible?: boolean;
  text_size?: 'sm' | 'base' | 'lg';
  font_weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  audience?: 'all' | 'guests' | 'users';
  starts_at?: string | null;
  ends_at?: string | null;
  /** Quick navigation links shown to the right of the message (desktop only). */
  links?: { label: string; url: string }[];
}

const sizeClass = (s?: string) =>
  s === 'lg' ? 'text-base md:text-[15px]' :
  s === 'sm' ? 'text-xs' :
  'text-sm';

const weightClass = (w?: string) =>
  w === 'bold' ? 'font-bold' :
  w === 'semibold' ? 'font-semibold' :
  w === 'normal' ? 'font-normal' :
  'font-medium';

/**
 * Hash the config so dismissing a specific message doesn't permanently
 * suppress future edits.
 */
const hashConfig = (c: SmartBarConfig) => {
  const src = JSON.stringify([c.text, c.messages, c.bg_color, c.text_color, c.icon, c.position]);
  let h = 5381;
  for (let i = 0; i < src.length; i++) h = ((h << 5) + h + src.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
};

export const SmartBar = () => {
  const { user } = useAuth();
  const [config, setConfig] = useState<SmartBarConfig | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('system_settings')
      .select('value')
      .eq('key', 'smart_bar')
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled || !data?.value) return;
        setConfig(data.value as unknown as SmartBarConfig);
      });
    return () => { cancelled = true; };
  }, []);

  // Re-evaluate dismissal whenever the config hash changes
  const dismissKey = useMemo(
    () => (config ? `smartbar:dismissed:${hashConfig(config)}` : ''),
    [config]
  );
  useEffect(() => {
    if (!dismissKey) return;
    setDismissed(localStorage.getItem(dismissKey) === '1');
  }, [dismissKey]);

  // Compose the list of messages to display
  const messages = useMemo(() => {
    if (!config) return [];
    const list = (config.messages?.length ? config.messages : [config.text || '']).filter(Boolean);
    return list;
  }, [config]);

  // Auto-rotate messages
  const rotation = Math.max(2, config?.rotation_seconds ?? 5);
  useEffect(() => {
    if (messages.length <= 1) return;
    const id = setInterval(() => {
      setActiveIdx((i) => (i + 1) % messages.length);
    }, rotation * 1000);
    return () => clearInterval(id);
  }, [messages.length, rotation]);

  if (!config || !config.enabled || messages.length === 0 || dismissed) return null;

  // Audience gating
  if (config.audience === 'guests' && user) return null;
  if (config.audience === 'users' && !user) return null;

  // Schedule gating
  const now = Date.now();
  if (config.starts_at && new Date(config.starts_at).getTime() > now) return null;
  if (config.ends_at && new Date(config.ends_at).getTime() < now) return null;

  const bg = config.bg_color || '#f97316';
  const fg = config.text_color || '#ffffff';
  const background = config.gradient_enabled && config.gradient_end_color
    ? `linear-gradient(90deg, ${bg}, ${config.gradient_end_color})`
    : bg;

  const current = messages[activeIdx % messages.length];
  const link = config.link?.trim();
  const isExternal = link ? /^https?:\/\//i.test(link) : false;
  const newTab = config.open_in_new_tab || isExternal;

  const inner = (
    <span
      className={`inline-flex items-center gap-2 ${sizeClass(config.text_size)} ${weightClass(config.font_weight)} ${
        config.animation === 'pulse' ? 'animate-pulse' : ''
      }`}
    >
      {config.icon && <span aria-hidden>{config.icon}</span>}
      <span
        key={activeIdx}
        className={config.animation === 'slide' ? 'smartbar-slide-in' : ''}
      >
        {current}
      </span>
    </span>
  );

  const content = link ? (
    isExternal ? (
      <a
        href={link}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
        className="hover:underline underline-offset-2"
      >
        {inner}
      </a>
    ) : (
      <Link
        to={link}
        target={newTab ? '_blank' : undefined}
        rel={newTab ? 'noopener noreferrer' : undefined}
        className="hover:underline underline-offset-2"
      >
        {inner}
      </Link>
    )
  ) : inner;

  const isMarquee = config.animation === 'marquee' && messages.length > 0;
  const positionClass =
    config.position === 'bottom'
      ? 'fixed bottom-0 left-0 right-0 z-40 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]'
      : 'relative';

  const quickLinks = (config.links || []).filter((l) => l && l.label && l.url);

  return (
    <div
      className={`${positionClass} flex items-center justify-center px-10 py-2.5 overflow-hidden`}
      style={{ background, color: fg }}
      role="region"
      aria-label="Promotional bar"
    >
      <div className="flex items-center justify-between w-full gap-4">
        {isMarquee ? (
          <div className="flex items-center flex-1 overflow-hidden">
            <div className="topbar-marquee whitespace-nowrap" style={{ animationDuration: `${Math.max(15, 60 - rotation * 2)}s` }}>
              <span className="inline-flex items-center px-8">{content}</span>
              <span className="inline-flex items-center px-8" aria-hidden>{content}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1 text-center truncate">{content}</div>
        )}

        {quickLinks.length > 0 && (
          <div className="hidden md:flex items-center gap-4 text-xs shrink-0 opacity-95">
            {quickLinks.map((l, i) => {
              const isExt = /^https?:\/\//i.test(l.url);
              return isExt ? (
                <a
                  key={i}
                  href={l.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline underline-offset-2"
                >
                  {l.label}
                </a>
              ) : (
                <Link key={i} to={l.url} className="hover:underline underline-offset-2">
                  {l.label}
                </Link>
              );
            })}
          </div>
        )}
      </div>
      {config.dismissible !== false && (
        <button
          type="button"
          onClick={() => {
            setDismissed(true);
            try { localStorage.setItem(dismissKey, '1'); } catch {}
          }}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full opacity-70 hover:opacity-100 hover:bg-black/10 transition"
          aria-label="Dismiss promotional bar"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
};
