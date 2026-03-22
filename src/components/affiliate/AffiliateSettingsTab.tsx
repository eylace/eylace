import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

interface Props {
  affiliate: any;
  onRefresh: () => void;
}

export const AffiliateSettingsTab = ({ affiliate, onRefresh }: Props) => {
  const [paymentMethod, setPaymentMethod] = useState(affiliate.payment_method || 'bkash');
  const details = affiliate.payment_details || {};
  const [accountNumber, setAccountNumber] = useState(details.account_number || '');
  const [accountName, setAccountName] = useState(details.account_name || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=update-settings`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            payment_method: paymentMethod,
            payment_details: { account_number: accountNumber, account_name: accountName },
          }),
        }
      );
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Settings saved');
      onRefresh();
    } catch {
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="mt-4">
      <CardContent className="pt-4 space-y-4">
        <div>
          <Label>Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="bkash">bKash</SelectItem>
              <SelectItem value="nagad">Nagad</SelectItem>
              <SelectItem value="rocket">Rocket</SelectItem>
              <SelectItem value="bank">Bank Transfer</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{paymentMethod === 'bank' ? 'Account Number' : 'Mobile Number'}</Label>
          <Input value={accountNumber} onChange={e => setAccountNumber(e.target.value)} placeholder={paymentMethod === 'bank' ? 'Account number' : '01XXXXXXXXX'} />
        </div>
        <div>
          <Label>Account Holder Name</Label>
          <Input value={accountName} onChange={e => setAccountName(e.target.value)} placeholder="Full name" />
        </div>
        <Button onClick={handleSave} disabled={saving} variant="accent">
          <Save className="h-4 w-4 mr-2" />{saving ? 'Saving...' : 'Save Settings'}
        </Button>
      </CardContent>
    </Card>
  );
};
