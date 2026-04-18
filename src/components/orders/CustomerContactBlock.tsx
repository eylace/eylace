import { Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CustomerContactBlockProps {
  phone?: string | null;
  className?: string;
}

/**
 * Reusable contact block: phone + Call Now + WhatsApp buttons
 * Shown in customer-facing order page, admin and seller order details.
 */
export const CustomerContactBlock = ({ phone, className = '' }: CustomerContactBlockProps) => {
  if (!phone) return null;
  const cleaned = phone.replace(/[^\d+]/g, '');
  const wa = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned.startsWith('88') ? cleaned : `88${cleaned}`;

  return (
    <div className={`flex flex-wrap items-center gap-3 py-3 ${className}`}>
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Phone className="h-4 w-4 text-destructive" />
        <span className="font-mono">{phone}</span>
      </div>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-700 dark:text-emerald-400"
      >
        <a href={`tel:${cleaned}`}>
          <Phone className="h-3.5 w-3.5" /> Call Now
        </a>
      </Button>
      <Button
        asChild
        size="sm"
        variant="outline"
        className="h-8 gap-1.5 border-emerald-500/40 bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 hover:text-emerald-700 dark:text-emerald-400"
      >
        <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer noopener">
          <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
        </a>
      </Button>
    </div>
  );
};
