import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tag, Zap, Info } from 'lucide-react';

export const SellerPromotionsTab = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Tag className="h-5 w-5" /> Promotions & Discounts
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <Info className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <p className="font-medium text-sm">Product-Level Discounts</p>
              <p className="text-sm text-muted-foreground mt-1">
                You can set discounts on individual products from the Products tab by editing 
                the original price and sale price fields.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-5 w-5" /> Flash Sales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start gap-3 p-4 bg-muted rounded-lg">
            <Info className="h-5 w-5 text-accent mt-0.5" />
            <div>
              <p className="font-medium text-sm">Platform Flash Sales</p>
              <p className="text-sm text-muted-foreground mt-1">
                Flash sales are organized by the platform admin. Your eligible products will 
                be automatically included when the admin creates a flash sale campaign. 
                Contact support to nominate products.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tips to Boost Sales</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 text-sm">
            {[
              'Set competitive pricing with original & discounted prices',
              'Keep your product images high quality and well-lit',
              'Write detailed product descriptions with key features',
              'Respond quickly to customer reviews',
              'Maintain healthy stock levels to avoid "Out of Stock"',
              'Participate in seasonal campaigns and flash sales',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5 min-w-[20px] justify-center">{i + 1}</Badge>
                <span className="text-muted-foreground">{tip}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};
