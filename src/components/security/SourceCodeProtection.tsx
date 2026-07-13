import { useEffect } from 'react';

/**
 * Client-side deterrents against casual inspection.
 * NOTE: real data protection lives in Supabase RLS + Edge Functions.
 * This only discourages non-technical users from opening devtools / right-click.
 */
export const SourceCodeProtection = () => {
  useEffect(() => {
    if (import.meta.env.DEV) return;

    // Skip protection inside the admin panel so staff can still debug.
    if (window.location.pathname.startsWith('/admin')) return;

    const blockContext = (e: MouseEvent) => {
      e.preventDefault();
    };

    const blockKeys = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      // F12
      if (e.key === 'F12') { e.preventDefault(); return; }
      // Ctrl+U (view source), Ctrl+S (save)
      if (e.ctrlKey && (k === 'u' || k === 's')) { e.preventDefault(); return; }
      // Ctrl+Shift+I / J / C  (devtools)
      if (e.ctrlKey && e.shiftKey && (k === 'i' || k === 'j' || k === 'c')) {
        e.preventDefault();
        return;
      }
      // Cmd+Opt+I / J / C on macOS
      if (e.metaKey && e.altKey && (k === 'i' || k === 'j' || k === 'c')) {
        e.preventDefault();
      }
    };

    const blockDrag = (e: DragEvent) => e.preventDefault();
    const blockSelectStart = (e: Event) => {
      const t = e.target as HTMLElement | null;
      // Allow selection inside inputs / textareas / contentEditable
      if (!t) return;
      const tag = t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || t.isContentEditable) return;
      // Allow selection on elements explicitly opted-in
      if (t.closest('[data-allow-select]')) return;
    };

    document.addEventListener('contextmenu', blockContext);
    document.addEventListener('keydown', blockKeys);
    document.addEventListener('dragstart', blockDrag);
    document.addEventListener('selectstart', blockSelectStart);

    return () => {
      document.removeEventListener('contextmenu', blockContext);
      document.removeEventListener('keydown', blockKeys);
      document.removeEventListener('dragstart', blockDrag);
      document.removeEventListener('selectstart', blockSelectStart);
    };
  }, []);

  return null;
};
