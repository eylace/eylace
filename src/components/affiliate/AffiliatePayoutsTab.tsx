import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Wallet } from 'lucide-react';

interface Props {
  payouts: any[];
  pendingBalance: number;
  onRefresh: () => void;
}

export const AffiliatePayoutsTab = ({ payouts, pendingBalance, onRefresh }: Props) => {
  const [requesting, setRequesting] = useState(false);

  const requestPayout = async () => {
    setRequesting(true);
    try {
      const { data, error } = await supabase.functions.invoke('affiliate-manage', {
        body: {},
        headers: { 'Content-Type': 'application/json' },
      });
      // Use query param approach
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/affiliate-manage?action=request-payout`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({}),
        }
      );
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Failed');
      toast.success(`Payout request submitted for ৳${result.amount}`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || 'Failed to request payout');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <div className="space-y-4 mt-4">
      <Card>
        <CardContent className="pt-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Available for Payout</p>
            <p className="text-2xl font-bold text-accent">৳{pendingBalance.toFixed(2)}</p>
            {pendingBalance < 500 && <p className="text-xs text-muted-foreground">Minimum ৳500 required</p>}
          </div>
          <Button onClick={requestPayout} disabled={requesting || pendingBalance < 500} variant="accent">
            <Wallet className="h-4 w-4 mr-2" />
            {requesting ? 'Requesting...' : 'Request Payout'}
          </Button>
        </CardContent>
      </Card>

      {payouts.length > 0 && (
        <Card>
          <CardContent className="pt-4 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map(p => (
                  <TableRow key={p.id}>
                    <TableCell className="text-xs">{format(new Date(p.created_at), 'MMM dd, yyyy')}</TableCell>
                    <TableCell className="font-medium">৳{p.amount?.toFixed(2)}</TableCell>
                    <TableCell className="capitalize">{p.payment_method}</TableCell>
                    <TableCell>
                      <Badge className={p.status === 'completed' ? 'bg-green-100 text-green-800' : p.status === 'failed' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                        {p.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
