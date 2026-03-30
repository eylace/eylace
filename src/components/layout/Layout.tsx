import { ReactNode, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { TopBar } from './TopBar';
import BackToTop from './BackToTop';
import { useWebsiteSetup } from '@/hooks/useWebsiteSetup';

interface LayoutProps {
  children: ReactNode;
}

function hexToHSL(hex: string): string | null {
  if (!hex || !hex.startsWith('#')) return null;
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = parseInt(hex[1] + hex[1], 16);
    g = parseInt(hex[2] + hex[2], 16);
    b = parseInt(hex[3] + hex[3], 16);
  } else if (hex.length === 7) {
    r = parseInt(hex.slice(1, 3), 16);
    g = parseInt(hex.slice(3, 5), 16);
    b = parseInt(hex.slice(5, 7), 16);
  } else return null;

  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

export const Layout = ({ children }: LayoutProps) => {
  const setup = useWebsiteSetup();

  useEffect(() => {
    const root = document.documentElement;

    // Load Google Fonts dynamically (non-blocking, outside rAF)
    const fonts = [setup.fontFamily, setup.headingFont].filter(Boolean);
    const uniqueFonts = [...new Set(fonts)];
    const existingLink = document.getElementById('dynamic-google-fonts');
    if (existingLink) existingLink.remove();
    if (uniqueFonts.length > 0) {
      const link = document.createElement('link');
      link.id = 'dynamic-google-fonts';
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?${uniqueFonts.map(f => `family=${f.replace(/\s+/g, '+')}:wght@300;400;500;600;700`).join('&')}&display=swap`;
      document.head.appendChild(link);
    }

    // Batch all style mutations in a single rAF to avoid forced reflows
    const rafId = requestAnimationFrame(() => {
      root.style.setProperty('--font-body', setup.fontFamily);
      root.style.setProperty('--font-heading', setup.headingFont);
      root.style.fontSize = `${setup.fontSize}px`;

      const primaryHSL = hexToHSL(setup.primaryColor);
      const accentHSL = hexToHSL(setup.accentColor);
      if (primaryHSL) {
        root.style.setProperty('--primary', primaryHSL);
        root.style.setProperty('--primary-foreground', '0 0% 100%');
      }
      if (accentHSL) {
        root.style.setProperty('--accent', accentHSL);
        root.style.setProperty('--accent-foreground', '0 0% 100%');
        root.style.setProperty('--ring', accentHSL);
      }

      if (setup.borderRadius) {
        root.style.setProperty('--radius', `${setup.borderRadius}px`);
      }
    });

    // Apply custom CSS
    let styleEl = document.getElementById('website-custom-css') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'website-custom-css';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = setup.customCss || '';

    return () => {
      cancelAnimationFrame(rafId);
      root.style.removeProperty('--font-body');
      root.style.removeProperty('--font-heading');
      root.style.removeProperty('--primary');
      root.style.removeProperty('--primary-foreground');
      root.style.removeProperty('--accent');
      root.style.removeProperty('--accent-foreground');
      root.style.removeProperty('--ring');
      root.style.removeProperty('--radius');
      root.style.fontSize = '';
    };
  }, [setup.fontFamily, setup.headingFont, setup.fontSize, setup.customCss, setup.primaryColor, setup.accentColor, setup.borderRadius]);

  return (
    <div className="flex flex-col min-h-screen" style={{ fontFamily: `var(--font-body, 'Inter'), sans-serif` }}>
      <TopBar />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};
