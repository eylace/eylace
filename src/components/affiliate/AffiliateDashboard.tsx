import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, Link2, DollarSign, Wallet, Settings } from 'lucide-react';
import { AffiliateLinksTab } from './AffiliateLinksTab';
import { AffiliateConversionsTab } from './AffiliateConversionsTab';
import { AffiliatePayoutsTab } from './AffiliatePayoutsTab';
import { AffiliateSettingsTab } from './AffiliateSettingsTab';

interface AffiliateData {
  affiliate: any;
  conversions: any[];
  payouts: any[];
  clicks: any[];
}

interface Props {
  data: AffiliateData;
  onRefresh: () => void;
}

export const AffiliateDashboard = ({ data, onRefresh }: Props) => {
  const { affiliate, conversions, payouts } = data;
  const pendingBalance = (affiliate.total_earnings || 0) - (affiliate.total_paid || 0);

  const stats = [
    { label: 'Total Clicks', value: affiliate.total_clicks || 0, icon: BarChart3, color: 'text-blue-500' },
    { label: 'Conversions', value: affiliate.total_conversions || 0, icon: Link2, color: 'text-green-500' },
    { label: 'Total Earnings', value: `৳${(affiliate.total_earnings || 0).toFixed(2)}`, icon: DollarSign, color: 'text-accent' },
    { label: 'Pending Balance', value: `৳${pendingBalance.toFixed(2)}`, icon: Wallet, color: 'text-orange-500' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map(s => (
          <Card key={s.label}>
            <CardContent className="pt-4 pb-4">
              <div className="flex items-center gap-3">
                <s.icon className={`h-8 w-8 ${s.color}`} />
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-lg font-bold text-foreground">{s.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-muted-foreground">Your Referral Code</CardTitle>
        </CardHeader>
        <CardContent>
          <code className="text-xl font-mono font-bold text-accent">{affiliate.referral_code}</code>
          <p className="text-xs text-muted-foreground mt-1">Commission Rate: {affiliate.commission_rate}%</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="links">
        <TabsList className="grid grid-cols-4 w-full">
          <TabsTrigger value="links"><Link2 className="h-4 w-4 mr-1" />Links</TabsTrigger>
          <TabsTrigger value="conversions"><BarChart3 className="h-4 w-4 mr-1" />Conversions</TabsTrigger>
          <TabsTrigger value="payouts"><Wallet className="h-4 w-4 mr-1" />Payouts</TabsTrigger>
          <TabsTrigger value="settings"><Settings className="h-4 w-4 mr-1" />Settings</TabsTrigger>
        </TabsList>
        <TabsContent value="links"><AffiliateLinksTab referralCode={affiliate.referral_code} /></TabsContent>
        <TabsContent value="conversions"><AffiliateConversionsTab conversions={conversions} /></TabsContent>
        <TabsContent value="payouts"><AffiliatePayoutsTab payouts={payouts} pendingBalance={pendingBalance} onRefresh={onRefresh} /></TabsContent>
        <TabsContent value="settings"><AffiliateSettingsTab affiliate={affiliate} onRefresh={onRefresh} /></TabsContent>
      </Tabs>
    </div>
  );
};
