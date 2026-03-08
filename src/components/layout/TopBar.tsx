import { useState } from 'react';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useWebsiteSetup } from '@/hooks/useWebsiteSetup';

export const TopBar = () => {
  const setup = useWebsiteSetup();
  const [dismissed, setDismissed] = useState(false);

  if (!setup.topBarEnabled || dismissed || !setup.topBarText) return null;

  return (
    <div
      className="relative flex items-center justify-center gap-4 px-4 py-2 text-sm font-medium"
      style={{ backgroundColor: setup.topBarBgColor, color: setup.topBarTextColor }}
    >
      <span>{setup.topBarText}</span>
      {setup.topBarLinks?.length > 0 && (
        <div className="hidden md:flex items-center gap-3 ml-4">
          {setup.topBarLinks.map((link, i) => (
            <Link
              key={i}
              to={link.url}
              className="text-xs underline underline-offset-2 opacity-80 hover:opacity-100 transition-opacity"
              style={{ color: setup.topBarTextColor }}
            >
              {link.label}
            </Link>
          ))}
        </div>
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
