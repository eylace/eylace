import { ReactNode, useEffect } from 'react';
import { Header } from './Header';
import { Footer } from './Footer';
import { TopBar } from './TopBar';
import { useWebsiteSetup } from '@/hooks/useWebsiteSetup';

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  const setup = useWebsiteSetup();

  // Apply font and custom CSS dynamically
  useEffect(() => {
    const root = document.documentElement;
    root.style.setProperty('--font-body', setup.fontFamily);
    root.style.setProperty('--font-heading', setup.headingFont);
    root.style.fontSize = `${setup.fontSize}px`;

    // Load Google Fonts dynamically
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

    // Apply custom CSS
    let styleEl = document.getElementById('website-custom-css') as HTMLStyleElement;
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'website-custom-css';
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = setup.customCss || '';

    return () => {
      root.style.removeProperty('--font-body');
      root.style.removeProperty('--font-heading');
      root.style.fontSize = '';
    };
  }, [setup.fontFamily, setup.headingFont, setup.fontSize, setup.customCss]);

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
