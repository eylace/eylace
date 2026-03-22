import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  referralCode: string;
}

export const AffiliateLinksTab = ({ referralCode }: Props) => {
  const [productSlug, setProductSlug] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const baseUrl = window.location.origin;
  const generalLink = `${baseUrl}/?ref=${referralCode}`;
  const productLink = productSlug ? `${baseUrl}/product/${productSlug}?ref=${referralCode}` : '';

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success('Link copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm font-medium text-foreground">General Referral Link</p>
          <div className="flex gap-2">
            <Input value={generalLink} readOnly className="text-xs" />
            <Button size="sm" variant="outline" onClick={() => copyToClipboard(generalLink, 'general')}>
              {copied === 'general' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Product-Specific Link</p>
          <p className="text-xs text-muted-foreground">Enter a product slug to generate a direct referral link</p>
          <div className="flex gap-2">
            <Input
              placeholder="e.g. wireless-headphones"
              value={productSlug}
              onChange={(e) => setProductSlug(e.target.value)}
            />
          </div>
          {productLink && (
            <div className="flex gap-2">
              <Input value={productLink} readOnly className="text-xs" />
              <Button size="sm" variant="outline" onClick={() => copyToClipboard(productLink, 'product')}>
                {copied === 'product' ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <p className="text-sm font-medium text-foreground mb-2">How it works</p>
          <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
            <li>Share your referral link on social media, blog, or directly</li>
            <li>When someone clicks and makes a purchase within 30 days, you earn commission</li>
            <li>Commission is calculated as {referralCode ? 'your set rate' : '5%'} of the order total</li>
            <li>Request payout once your balance reaches ৳500</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
