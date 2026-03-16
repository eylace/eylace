import { useState, useEffect } from 'react';
import { Phone, Mail, FileWarning, RefreshCw, Trash2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface IncompleteOrder {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  cart_total: number;
  status: string;
  created_at: string;
  cart_items: any;
}

export const DashboardIncompleteOrders = () => {
  const [orders, setOrders] = useState<IncompleteOrder[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchIncomplete = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('incomplete_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);
    setOrders((data as IncompleteOrder[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchIncomplete(); }, []);

  const markContacted = async (id: string) => {
    await supabase.from('incomplete_orders').update({ status: 'contacted' }).eq('id', id);
    toast.success('স্ট্যাটাস আপডেট হয়েছে');
    fetchIncomplete();
  };

  const deleteOrder = async (id: string) => {
    await supabase.from('incomplete_orders').delete().eq('id', id);
    toast.success('ডিলিট হয়েছে');
    fetchIncomplete();
  };

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-[hsl(var(--warning))]" />
            ইনকমপ্লিট অর্ডার
            <Badge variant="destructive" className="text-[10px]">{orders.length}</Badge>
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={fetchIncomplete} className="h-7">
            <RefreshCw className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">লোড হচ্ছে...</div>
        ) : orders.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">কোনো ইনকমপ্লিট অর্ডার নেই 🎉</div>
        ) : (
          <div className="divide-y divide-border">
            {orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {o.first_name || 'Unknown'} {o.last_name || ''}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {o.phone || o.email || 'No contact'} • ৳{Number(o.cart_total).toLocaleString()} • {format(new Date(o.created_at), 'dd MMM, h:mm a')}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <Badge variant={o.status === 'contacted' ? 'default' : 'destructive'} className="text-[10px]">
                    {o.status === 'contacted' ? 'কন্ট্যাক্টেড' : 'অ্যাবান্ডনড'}
                  </Badge>
                  {o.phone && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" asChild>
                      <a href={`tel:${o.phone}`}><Phone className="h-3.5 w-3.5 text-[hsl(var(--success))]" /></a>
                    </Button>
                  )}
                  {o.status !== 'contacted' && (
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => markContacted(o.id)}>
                      <Mail className="h-3.5 w-3.5 text-primary" />
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => deleteOrder(o.id)}>
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
