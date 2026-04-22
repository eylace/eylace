import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Loader2, AlertCircle, BookOpen } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useCurrency } from '@/contexts/CurrencyContext';
import {
  useAccountingAccounts,
  useAccountingTransactions,
  generateRefNumber,
} from '@/hooks/useAccounting';

interface JournalLine {
  account_id: string;
  debit: number;
  credit: number;
  description: string;
}

const emptyLine = (): JournalLine => ({ account_id: '', debit: 0, credit: 0, description: '' });

interface Props {
  canManage: boolean;
}

export const JournalEntriesTab = ({ canManage }: Props) => {
  const { transactions, isLoading, refetch } = useAccountingTransactions();
  const { accounts } = useAccountingAccounts();
  const { formatPrice } = useCurrency();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [memo, setMemo] = useState('');
  const [lines, setLines] = useState<JournalLine[]>([emptyLine(), emptyLine()]);

  const totals = useMemo(() => {
    const debit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
    const credit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
    return { debit, credit, balanced: Math.abs(debit - credit) < 0.005 && debit > 0 };
  }, [lines]);

  const reset = () => {
    setLines([emptyLine(), emptyLine()]);
    setMemo('');
    setDate(new Date().toISOString().slice(0, 10));
  };

  const updateLine = (idx: number, patch: Partial<JournalLine>) => {
    setLines(prev => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));
  };

  const addLine = () => setLines(prev => [...prev, emptyLine()]);
  const removeLine = (idx: number) => setLines(prev => prev.length > 2 ? prev.filter((_, i) => i !== idx) : prev);

  const submit = async () => {
    if (!totals.balanced) return toast.error('Debits must equal credits and be greater than zero');
    const filled = lines.filter(l => l.account_id && (Number(l.debit) > 0 || Number(l.credit) > 0));
    if (filled.length < 2) return toast.error('At least two account lines required');

    setSaving(true);
    const ref = generateRefNumber('JRN');
    const rows = filled.map(l => {
      const isDebit = Number(l.debit) > 0;
      return {
        reference_number: ref,
        transaction_date: date,
        type: 'journal',
        account_id: l.account_id,
        amount: isDebit ? Number(l.debit) : Number(l.credit),
        category: isDebit ? 'Debit' : 'Credit',
        description: l.description || memo,
        notes: memo,
      };
    });
    const { error } = await (supabase as any).from('accounting_transactions').insert(rows);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success('Journal entry posted to ledger');
    setOpen(false);
    reset();
    refetch();
  };

  const remove = async (id: string) => {
    if (!confirm('Delete this transaction?')) return;
    const { error } = await (supabase as any).from('accounting_transactions').delete().eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Deleted'); refetch();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2"><BookOpen className="h-4 w-4" /> Transactions / Journal Entries</CardTitle>
          <p className="text-xs text-muted-foreground mt-0.5">Double-entry ledger — debits must equal credits</p>
        </div>
        {canManage && (
          <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
            <DialogTrigger asChild><Button size="sm" variant="accent"><Plus className="h-4 w-4 mr-1" />New Journal Entry</Button></DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader><DialogTitle>Create Journal Entry</DialogTitle></DialogHeader>
              <div className="space-y-4 py-2">
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>Date</Label><Input type="date" value={date} onChange={e => setDate(e.target.value)} /></div>
                  <div><Label>Memo / Reference</Label><Input value={memo} onChange={e => setMemo(e.target.value)} placeholder="Brief description" /></div>
                </div>

                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-2 font-medium">Account</th>
                        <th className="text-left p-2 font-medium w-48">Description</th>
                        <th className="text-right p-2 font-medium w-32">Debit</th>
                        <th className="text-right p-2 font-medium w-32">Credit</th>
                        <th className="w-10"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line, idx) => (
                        <tr key={idx} className="border-t">
                          <td className="p-1.5">
                            <Select value={line.account_id} onValueChange={v => updateLine(idx, { account_id: v })}>
                              <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Select account" /></SelectTrigger>
                              <SelectContent className="max-h-72">
                                {accounts.filter(a => a.is_active).map(a => (
                                  <SelectItem key={a.id} value={a.id} className="text-xs">{a.code} — {a.name} <span className="text-muted-foreground">({a.type})</span></SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </td>
                          <td className="p-1.5">
                            <Input className="h-8 text-xs" value={line.description} onChange={e => updateLine(idx, { description: e.target.value })} placeholder="Optional" />
                          </td>
                          <td className="p-1.5">
                            <Input className="h-8 text-xs text-right tabular-nums" type="number" step="0.01" value={line.debit || ''} onChange={e => updateLine(idx, { debit: Number(e.target.value), credit: 0 })} />
                          </td>
                          <td className="p-1.5">
                            <Input className="h-8 text-xs text-right tabular-nums" type="number" step="0.01" value={line.credit || ''} onChange={e => updateLine(idx, { credit: Number(e.target.value), debit: 0 })} />
                          </td>
                          <td className="p-1.5">
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeLine(idx)} disabled={lines.length <= 2}>
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-muted/30 border-t">
                      <tr>
                        <td colSpan={2} className="p-2 text-xs"><Button size="sm" variant="outline" onClick={addLine}><Plus className="h-3 w-3 mr-1" />Add Line</Button></td>
                        <td className="p-2 text-right tabular-nums font-semibold">{formatPrice(totals.debit)}</td>
                        <td className="p-2 text-right tabular-nums font-semibold">{formatPrice(totals.credit)}</td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className={`flex items-center gap-2 p-3 rounded-lg ${totals.balanced ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' : 'bg-amber-500/10 text-amber-700 dark:text-amber-300'}`}>
                  <AlertCircle className="h-4 w-4" />
                  <span className="text-xs">
                    {totals.balanced ? `Balanced — ${formatPrice(totals.debit)} on each side.` : `Out of balance: Debit ${formatPrice(totals.debit)} vs Credit ${formatPrice(totals.credit)} (diff ${formatPrice(Math.abs(totals.debit - totals.credit))})`}
                  </span>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={submit} disabled={saving || !totals.balanced}>
                  {saving && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}Post to Ledger
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Reference</TableHead><TableHead>Type</TableHead><TableHead>Account</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {isLoading && <TableRow><TableCell colSpan={7} className="text-center py-6"><Loader2 className="h-4 w-4 animate-spin inline" /></TableCell></TableRow>}
            {transactions.map(t => (
              <TableRow key={t.id}>
                <TableCell className="text-xs">{new Date(t.transaction_date).toLocaleDateString()}</TableCell>
                <TableCell className="font-mono text-[11px] text-muted-foreground">
                  {t.reference_number}
                  {t.is_auto_generated && <Badge variant="outline" className="ml-1 text-[9px] py-0">auto</Badge>}
                </TableCell>
                <TableCell><Badge variant="outline" className="text-[10px] capitalize">{t.type}</Badge></TableCell>
                <TableCell className="text-xs">{t.account?.name || '—'} {t.category && <span className="text-muted-foreground">({t.category})</span>}</TableCell>
                <TableCell className="text-xs max-w-xs truncate">{t.description}</TableCell>
                <TableCell className={`text-right tabular-nums text-sm font-medium ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : t.type === 'expense' ? 'text-rose-600 dark:text-rose-400' : 'text-foreground'}`}>
                  {formatPrice(Number(t.amount))}
                </TableCell>
                <TableCell>{canManage && <Button size="icon" variant="ghost" onClick={() => remove(t.id)}><Trash2 className="h-3.5 w-3.5 text-destructive" /></Button>}</TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && !isLoading && <TableRow><TableCell colSpan={7} className="text-center py-8 text-sm text-muted-foreground">No transactions yet</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};