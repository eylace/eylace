import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Save } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export default function AdminRefundCategoryBased() {
  const [rules, setRules] = useState<Record<string, { enabled: boolean; days: number; maxPercent: number }>>({});

  const { data: categories = [] } = useQuery({
    queryKey: ['admin-categories-refund'],
    queryFn: async () => {
      const { data } = await supabase.from('categories').select('id, name, slug').order('name');
      return data || [];
    },
  });

  const getRule = (id: string) => rules[id] || { enabled: true, days: 14, maxPercent: 100 };

  const updateRule = (id: string, key: string, value: any) => {
    setRules(prev => ({ ...prev, [id]: { ...getRule(id), [key]: value } }));
  };

  const handleSave = () => toast.success('Category refund rules saved');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Category Based Refund</h1>
            <p className="text-muted-foreground">Set custom refund rules per product category</p>
          </div>
          <Button onClick={handleSave}><Save className="h-4 w-4 mr-2" />Save All</Button>
        </div>

        <Card>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Refund Enabled</TableHead>
                  <TableHead>Refund Window (days)</TableHead>
                  <TableHead>Max Refund %</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categories.map(cat => {
                  const rule = getRule(cat.id);
                  return (
                    <TableRow key={cat.id}>
                      <TableCell className="font-medium">{cat.name}</TableCell>
                      <TableCell><Switch checked={rule.enabled} onCheckedChange={v => updateRule(cat.id, 'enabled', v)} /></TableCell>
                      <TableCell><Input type="number" className="w-24 h-8" value={rule.days} onChange={e => updateRule(cat.id, 'days', +e.target.value)} disabled={!rule.enabled} /></TableCell>
                      <TableCell><Input type="number" className="w-24 h-8" value={rule.maxPercent} onChange={e => updateRule(cat.id, 'maxPercent', +e.target.value)} disabled={!rule.enabled} /></TableCell>
                    </TableRow>
                  );
                })}
                {categories.length === 0 && <TableRow><TableCell colSpan={4} className="text-center py-8 text-muted-foreground">No categories found</TableCell></TableRow>}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
