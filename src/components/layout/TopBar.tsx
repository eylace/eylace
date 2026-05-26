import { useState } from 'react';
import { Link } from 'react-router-dom';
import { X } from 'lucide-react';
import { useWebsiteSetup } from '@/hooks/useWebsiteSetup';

export const TopBar = () => {
  const setup = useWebsiteSetup();
  const [dismissed, setDismissed] = useState(false);

  if (!setup.topBarEnabled || dismissed) return null;
  const text = (setup.topBarText || '').trim();
  const links = setup.topBarLinks || [];
  if (!text && links.length === 0) return null;

  const separator = '  ★  ';
  const marqueeText = text ? text + separator : '';

  return (
    <div
      className="relative overflow-hidden"
      style={{
        backgroundColor: setup.topBarBgColor || '#1a1a2e',
        color: setup.topBarTextColor || '#ffffff',
        height: '40px',
      }}
    >
      <div className="absolute inset-0 flex items-center justify-between px-4 gap-4">
        {marqueeText ? (
          <div className="flex-1 overflow-hidden">
            <div
              className="topbar-marquee whitespace-nowrap text-sm font-medium"
              style={{ animationDuration: '30s' }}
            >
              <span>{marqueeText.repeat(2)}</span>
              <span>{marqueeText.repeat(2)}</span>
            </div>
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {links.length > 0 && (
          <div className="hidden md:flex items-center gap-4 text-xs shrink-0">
            {links.map((l, i) => (
              <Link
                key={i}
                to={l.url || '#'}
                className="hover:underline opacity-90 hover:opacity-100"
              >
                {l.label}
              </Link>
            ))}
          </div>
        )}
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
