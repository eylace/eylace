import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, RefreshCw, Settings as SettingsIcon, History, CheckCircle2, XCircle, MinusCircle } from 'lucide-react';
import { useAccountingAccounts, useAccountingSettings, useAccountingSyncLogs } from '@/hooks/useAccounting';
import { useCurrency } from '@/contexts/CurrencyContext';
import { toast } from 'sonner';

export const AccountingSettingsTab = () => {
  const { accounts } = useAccountingAccounts();
  const { settings, isLoading, isSaving, save } = useAccountingSettings();
  const { logs, isLoading: logsLoading, refetch } = useAccountingSyncLogs(100);
  const { formatPrice } = useCurrency();

  const [autoSync, setAutoSync] = useState(true);
  const [revenueCode, setRevenueCode] = useState('4000');

  useEffect(() => {
    if (!isLoading) {
      setAutoSync(settings.auto_sync_enabled);
      setRevenueCode(settings.revenue_account_code);
    }
  }, [settings, isLoading]);

  const incomeAccounts = accounts.filter(a => a.type === 'income' && a.is_active);

  const onSave = async () => {
    const { error } = await save({ auto_sync_enabled: autoSync, revenue_account_code: revenueCode });
    if (error) toast.error(error.message); else toast.success('Settings saved');
  };

  const statusBadge = (s: string) => {
    if (s === 'success') return <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 gap-1"><CheckCircle2 className="h-3 w-3" />Success</Badge>;
    if (s === 'failed') return <Badge className="bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/30 gap-1"><XCircle className="h-3 w-3" />Failed</Badge>;
    return <Badge variant="outline" className="gap-1"><MinusCircle className="h-3 w-3" />Skipped</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><SettingsIcon className="h-4 w-4" /> Auto-Sync Settings</CardTitle>
          <CardDescription>Automatically post delivered orders to the accounting ledger as income.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/20">
            <div>
              <p className="text-sm font-medium">Enable auto-sync of delivered orders</p>
              <p className="text-xs text-muted-foreground">When ON, every order moving to <span className="font-medium">delivered</span> creates an income transaction.</p>
            </div>
            <Switch checked={autoSync} onCheckedChange={setAutoSync} disabled={isLoading} />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs">Revenue account (where delivered-order income is posted)</Label>
            <Select value={revenueCode} onValueChange={setRevenueCode} disabled={isLoading}>
              <SelectTrigger className="w-full md:w-[420px]"><SelectValue placeholder="Select revenue account" /></SelectTrigger>
              <SelectContent>
                {incomeAccounts.length === 0 && <div className="px-3 py-2 text-xs text-muted-foreground">No income accounts found</div>}
                {incomeAccounts.map(a => (
                  <SelectItem key={a.id} value={a.code}>
                    <span className="font-mono mr-2">{a.code}</span>{a.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-[11px] text-muted-foreground">Default: <span className="font-mono">4000 — Sales Revenue</span></p>
          </div>

          <div className="flex justify-end">
            <Button onClick={onSave} disabled={isSaving || isLoading} size="sm">
              {isSaving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Save Settings
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2"><History className="h-4 w-4" /> Sync Logs</CardTitle>
            <CardDescription>Recent auto-sync attempts (latest 100).</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={refetch} disabled={logsLoading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${logsLoading ? 'animate-spin' : ''}`} />Refresh
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Time</TableHead><TableHead>Order</TableHead><TableHead>Status</TableHead><TableHead>Message</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
            <TableBody>
              {logsLoading && <TableRow><TableCell colSpan={5} className="text-center py-6"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>}
              {logs.map(l => (
                <TableRow key={l.id}>
                  <TableCell className="text-[11px] text-muted-foreground">{new Date(l.created_at).toLocaleString()}</TableCell>
                  <TableCell className="font-mono text-xs">{l.order_number || '—'}</TableCell>
                  <TableCell>{statusBadge(l.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground max-w-md truncate">{l.message}</TableCell>
                  <TableCell className="text-right tabular-nums text-sm">{l.amount != null ? formatPrice(Number(l.amount)) : '—'}</TableCell>
                </TableRow>
              ))}
              {logs.length === 0 && !logsLoading && <TableRow><TableCell colSpan={5} className="text-center py-8 text-sm text-muted-foreground">No sync activity yet — deliver an order to generate a log entry.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};