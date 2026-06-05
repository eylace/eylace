import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface TrackingSettings {
  globalEnabled: boolean;
  gtm: { enabled: boolean; containerId: string; testMode: boolean };
  facebookCapi: { enabled: boolean; pixelId: string; accessToken: string; testEventCode: string };
  metaPixel: { enabled: boolean; pixelId: string };
  ga4Client: { enabled: boolean; measurementId: string };
  ga4Server: { enabled: boolean; measurementId: string; apiSecret: string };
  tiktok: { enabled: boolean; pixelId: string };
  clarity: { enabled: boolean; projectId: string };
  searchConsole: { enabled: boolean; verificationCode: string; metaTag: string };
  customScript: { enabled: boolean; headHtml: string; bodyHtml: string };
}

const injectScript = (id: string, content: string, type: 'inline' | 'src' = 'inline') => {
  if (document.getElementById(id)) return;
  const script = document.createElement('script');
  script.id = id;
  if (type === 'src') script.src = content;
  else script.textContent = content;
  script.async = true;
  document.head.appendChild(script);
};

const injectMeta = (id: string, name: string, content: string) => {
  if (document.getElementById(id)) return;
  const meta = document.createElement('meta');
  meta.id = id;
  meta.name = name;
  meta.content = content;
  document.head.appendChild(meta);
};

const removeElement = (id: string) => {
  document.getElementById(id)?.remove();
};

export function TrackingScriptInjector() {
  const [settings, setSettings] = useState<TrackingSettings | null>(null);

  useEffect(() => {
    (async () => {
      // Use sanitized RPC that strips server-side secrets (CAPI access token, GA4 API secret)
      const { data, error } = await supabase.rpc('get_public_tracking_settings');
      if (!error && data && typeof data === 'object') {
        setSettings(data as any);
      }
    })();
  }, []);

  useEffect(() => {
    if (!settings || !settings.globalEnabled) {
      // Clean up all scripts if disabled
      ['tracking-gtm', 'tracking-gtm-noscript', 'tracking-gtm-dl', 'tracking-ga4', 'tracking-ga4-config', 'tracking-fb', 'tracking-fb-noscript', 'tracking-meta-pixel', 'tracking-tiktok', 'tracking-clarity', 'tracking-sc-meta', 'tracking-custom-head', 'tracking-custom-body'].forEach(removeElement);
      return;
    }

    // GTM
    if (settings.gtm.enabled && settings.gtm.containerId) {
      injectScript('tracking-gtm-dl', `window.dataLayer = window.dataLayer || [];`);
      injectScript('tracking-gtm', `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${settings.gtm.containerId}');`);
    }

    // GA4 Client
    if (settings.ga4Client.enabled && settings.ga4Client.measurementId) {
      injectScript('tracking-ga4', `https://www.googletagmanager.com/gtag/js?id=${settings.ga4Client.measurementId}`, 'src');
      injectScript('tracking-ga4-config', `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','${settings.ga4Client.measurementId}',{send_page_view:true});`);
    }

    // Facebook Pixel
    if (settings.facebookCapi.enabled && settings.facebookCapi.pixelId) {
      injectScript('tracking-fb', `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${settings.facebookCapi.pixelId}');fbq('track','PageView');`);
    }

    // Meta Pixel (client-side, independent of CAPI)
    if (settings.metaPixel?.enabled && settings.metaPixel.pixelId) {
      injectScript('tracking-meta-pixel', `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${settings.metaPixel.pixelId}');fbq('track','PageView');`);
    }

    // TikTok Pixel
    if (settings.tiktok.enabled && settings.tiktok.pixelId) {
      injectScript('tracking-tiktok', `!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${settings.tiktok.pixelId}');ttq.page();}(window,document,'ttq');`);
    }

    // Microsoft Clarity
    if (settings.clarity.enabled && settings.clarity.projectId) {
      injectScript('tracking-clarity', `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script","${settings.clarity.projectId}");`);
    }

    // Search Console meta tag
    if (settings.searchConsole.enabled && settings.searchConsole.metaTag) {
      const match = settings.searchConsole.metaTag.match(/content="([^"]+)"/);
      const content = match ? match[1] : settings.searchConsole.verificationCode;
      if (content) injectMeta('tracking-sc-meta', 'google-site-verification', content);
    } else if (settings.searchConsole.enabled && settings.searchConsole.verificationCode) {
      injectMeta('tracking-sc-meta', 'google-site-verification', settings.searchConsole.verificationCode);
    }

    // Custom Script (raw HTML in head/body)
    removeElement('tracking-custom-head');
    removeElement('tracking-custom-body');
    if (settings.customScript?.enabled) {
      if (settings.customScript.headHtml?.trim()) {
        const wrapper = document.createElement('div');
        wrapper.id = 'tracking-custom-head';
        wrapper.style.display = 'none';
        wrapper.innerHTML = settings.customScript.headHtml;
        // Re-create script nodes so they execute
        wrapper.querySelectorAll('script').forEach((old) => {
          const s = document.createElement('script');
          for (const a of Array.from(old.attributes)) s.setAttribute(a.name, a.value);
          s.text = old.textContent || '';
          old.replaceWith(s);
        });
        document.head.appendChild(wrapper);
      }
      if (settings.customScript.bodyHtml?.trim()) {
        const wrapper = document.createElement('div');
        wrapper.id = 'tracking-custom-body';
        wrapper.style.display = 'none';
        wrapper.innerHTML = settings.customScript.bodyHtml;
        wrapper.querySelectorAll('script').forEach((old) => {
          const s = document.createElement('script');
          for (const a of Array.from(old.attributes)) s.setAttribute(a.name, a.value);
          s.text = old.textContent || '';
          old.replaceWith(s);
        });
        document.body.appendChild(wrapper);
      }
    }
  }, [settings]);

  // Push Data Layer events for navigation
  useEffect(() => {
    if (!settings?.globalEnabled) return;
    const pushDL = () => {
      if ((window as any).dataLayer) {
        (window as any).dataLayer.push({ event: 'page_view', page_path: window.location.pathname, page_title: document.title });
      }
    };
    pushDL();
    window.addEventListener('popstate', pushDL);
    return () => window.removeEventListener('popstate', pushDL);
  }, [settings?.globalEnabled]);

  return null;
}

// Helper to push custom events from anywhere
export const pushTrackingEvent = (eventName: string, data: Record<string, any> = {}) => {
  if ((window as any).dataLayer) {
    (window as any).dataLayer.push({ event: eventName, ...data });
  }
  if ((window as any).fbq) {
    (window as any).fbq('trackCustom', eventName, data);
  }
  if ((window as any).ttq) {
    (window as any).ttq.track(eventName, data);
  }
};
