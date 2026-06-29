import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Copy, Check, ExternalLink, Search } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  referralCode: string;
}

export const AffiliateLinksTab = ({ referralCode }: Props) => {
  const [productSlug, setProductSlug] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [products, setProducts] = useState<{ id: string; name: string; slug: string }[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [loadingProducts, setLoadingProducts] = useState(false);

  const baseUrl = window.location.origin;
  const generalLink = `${baseUrl}/?ref=${referralCode}`;
  const productLink = productSlug ? `${baseUrl}/product/${productSlug}?ref=${referralCode}` : '';

  useEffect(() => {
    let active = true;
    const search = productSearch.trim();
    setLoadingProducts(true);
    const handle = setTimeout(async () => {
      let q = supabase
        .from('products')
        .select('id, name, slug')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(20);
      if (search) q = q.ilike('name', `%${search}%`);
      const { data } = await q;
      if (!active) return;
      setProducts((data || []) as any);
      setLoadingProducts(false);
    }, 250);
    return () => { active = false; clearTimeout(handle); };
  }, [productSearch]);

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
        <CardContent className="pt-4 space-y-3">
          <p className="text-sm font-medium text-foreground">Browse Products</p>
          <p className="text-xs text-muted-foreground">Pick any product to instantly get your unique affiliate link.</p>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search products..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
            />
          </div>
          <div className="max-h-72 overflow-y-auto border rounded-md divide-y">
            {loadingProducts && products.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">Loading…</p>
            ) : products.length === 0 ? (
              <p className="p-3 text-xs text-muted-foreground">No products found.</p>
            ) : (
              products.map(p => {
                const link = `${baseUrl}/product/${p.slug}?ref=${referralCode}`;
                const key = `prod-${p.id}`;
                return (
                  <div key={p.id} className="flex items-center justify-between gap-2 p-2.5 text-xs">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-muted-foreground truncate">{link}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => copyToClipboard(link, key)}>
                      {copied === key ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
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
