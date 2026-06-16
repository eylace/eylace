import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LanguageProvider, useLanguage } from '@/contexts/LanguageContext';
import { translations } from '@/i18n/translations';
import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mobile viewport (iPhone 12-ish)
const setMobileViewport = () => {
  Object.defineProperty(window, 'innerWidth', { writable: true, value: 390 });
  Object.defineProperty(window, 'innerHeight', { writable: true, value: 844 });
  window.dispatchEvent(new Event('resize'));
};

// Mirror of the CTA block from ProductDetail to test in isolation
function CtaBlock({ product, websiteSetup }: any) {
  const { t } = useLanguage();
  return (
    <div data-testid="cta-buttons" className="grid grid-cols-2 gap-2 sm:gap-3 min-h-[3rem]">
      <Button
        type="button"
        variant="outline"
        size="xl"
        data-testid="cta-call"
        aria-label={`${t('product.callNow')} ${websiteSetup.ctaCallNumber}`}
        className="w-full min-h-12 touch-manipulation"
        onClick={() => window.open(`tel:${websiteSetup.ctaCallNumber}`, '_self')}
      >
        <Phone aria-hidden="true" />
        <span className="truncate">{t('product.callNow')}</span>
      </Button>
      <Button
        type="button"
        variant="outline"
        size="xl"
        data-testid="cta-whatsapp"
        aria-label={t('product.whatsapp')}
        className="w-full min-h-12 touch-manipulation"
        onClick={() => {
          const num = websiteSetup.ctaWhatsappNumber.replace(/^0/, '88');
          const msg = `${t('product.whatsappInquiry')}: ${product.name}`;
          const url = `https://wa.me/${num}?text=${encodeURIComponent(msg)}`;
          window.open(url, '_blank', 'noopener,noreferrer');
        }}
      >
        <MessageCircle aria-hidden="true" />
        <span className="truncate">{t('product.whatsapp')}</span>
      </Button>
    </div>
  );
}

const product = { name: 'Rechargeable Mini Smart Turbo Fan' };
const websiteSetup = {
  ctaCallNumber: '01711111111',
  ctaWhatsappNumber: '01711111111',
};

describe('ProductDetail Call/WhatsApp CTA (mobile)', () => {
  let openSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    setMobileViewport();
    localStorage.clear();
    openSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
  });

  afterEach(() => {
    openSpy.mockRestore();
  });

  it('renders both CTA buttons with proper touch targets (min 44px)', () => {
    render(
      <LanguageProvider>
        <CtaBlock product={product} websiteSetup={websiteSetup} />
      </LanguageProvider>
    );
    const call = screen.getByTestId('cta-call');
    const wa = screen.getByTestId('cta-whatsapp');
    expect(call.className).toMatch(/min-h-12/);
    expect(wa.className).toMatch(/min-h-12/);
    expect(call.className).toMatch(/touch-manipulation/);
    expect(wa.className).toMatch(/touch-manipulation/);
    expect(call).toHaveAttribute('aria-label');
    expect(wa).toHaveAttribute('aria-label');
  });

  it('uses English prefilled message when language is EN', () => {
    localStorage.setItem('eylace-lang', 'en');
    render(
      <LanguageProvider>
        <CtaBlock product={product} websiteSetup={websiteSetup} />
      </LanguageProvider>
    );
    expect(screen.getByText(translations['product.callNow'].en)).toBeInTheDocument();
    expect(screen.getByText(translations['product.whatsapp'].en)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cta-whatsapp'));
    const url = openSpy.mock.calls[0][0] as string;
    expect(url).toContain('https://wa.me/88');
    expect(decodeURIComponent(url.split('text=')[1])).toBe(
      `${translations['product.whatsappInquiry'].en}: ${product.name}`
    );
  });

  it('uses Bangla prefilled message when language is BN', () => {
    localStorage.setItem('eylace-lang', 'bn');
    render(
      <LanguageProvider>
        <CtaBlock product={product} websiteSetup={websiteSetup} />
      </LanguageProvider>
    );
    expect(screen.getByText(translations['product.callNow'].bn)).toBeInTheDocument();
    expect(screen.getByText(translations['product.whatsapp'].bn)).toBeInTheDocument();

    fireEvent.click(screen.getByTestId('cta-whatsapp'));
    const url = openSpy.mock.calls[0][0] as string;
    expect(decodeURIComponent(url.split('text=')[1])).toBe(
      `${translations['product.whatsappInquiry'].bn}: ${product.name}`
    );
  });

  it('Call button opens tel: link with the configured number', () => {
    render(
      <LanguageProvider>
        <CtaBlock product={product} websiteSetup={websiteSetup} />
      </LanguageProvider>
    );
    fireEvent.click(screen.getByTestId('cta-call'));
    expect(openSpy).toHaveBeenCalledWith(
      `tel:${websiteSetup.ctaCallNumber}`,
      '_self'
    );
  });

  it('WhatsApp opens external link with noopener,noreferrer', () => {
    render(
      <LanguageProvider>
        <CtaBlock product={product} websiteSetup={websiteSetup} />
      </LanguageProvider>
    );
    fireEvent.click(screen.getByTestId('cta-whatsapp'));
    expect(openSpy.mock.calls[0][1]).toBe('_blank');
    expect(openSpy.mock.calls[0][2]).toBe('noopener,noreferrer');
  });

  it('container reserves height to prevent layout shift', () => {
    render(
      <LanguageProvider>
        <CtaBlock product={product} websiteSetup={websiteSetup} />
      </LanguageProvider>
    );
    const container = screen.getByTestId('cta-buttons');
    expect(container.className).toMatch(/min-h-\[3rem\]/);
    expect(container.className).toMatch(/grid-cols-2/);
  });
});
