import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HelpCircle, Mail, MessageSquare, FileText, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const SellerSupportTab = () => {
  return (
    <div className="space-y-6 max-w-3xl">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <HelpCircle className="h-5 w-5" /> Seller Support
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-2 hover:border-accent transition-colors">
              <CardContent className="pt-6 text-center">
                <Mail className="h-8 w-8 mx-auto mb-3 text-accent" />
                <p className="font-medium">Email Support</p>
                <p className="text-xs text-muted-foreground mt-1">seller-support@eylace.com</p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-accent transition-colors">
              <CardContent className="pt-6 text-center">
                <MessageSquare className="h-8 w-8 mx-auto mb-3 text-accent" />
                <p className="font-medium">Live Chat</p>
                <p className="text-xs text-muted-foreground mt-1">Available 9 AM – 9 PM</p>
              </CardContent>
            </Card>
            <Card className="border-2 hover:border-accent transition-colors">
              <CardContent className="pt-6 text-center">
                <FileText className="h-8 w-8 mx-auto mb-3 text-accent" />
                <p className="font-medium">Knowledge Base</p>
                <p className="text-xs text-muted-foreground mt-1">Articles & guides</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Helpful Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[
              { label: 'Seller Center', href: '/seller-center' },
              { label: 'Seller Policies', href: '/seller-policies' },
              { label: 'Seller Support Page', href: '/seller-support' },
              { label: 'FAQ', href: '/faq' },
            ].map(link => (
              <Button key={link.href} variant="ghost" asChild className="w-full justify-between">
                <Link to={link.href}>
                  {link.label}
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
