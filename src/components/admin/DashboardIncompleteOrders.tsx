import { useState, useEffect } from 'react';
import { Phone, Mail, FileWarning, RefreshCw, Trash2, ChevronDown, ChevronUp, ShoppingBag, MapPin, Clock, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface IncompleteOrder {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string | null;
  cart_total: number;
  status: string;
  created_at: string;
  cart_items: any;
  notes: string | null;
}

export const DashboardIncompleteOrders = () => {
  const [orders, setOrders] = useState<IncompleteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchIncomplete = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('incomplete_orders')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);
    setOrders((data as unknown as IncompleteOrder[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchIncomplete(); }, []);

  const markContacted = async (id: string) => {
    await (supabase.from('incomplete_orders') as any).update({ status: 'contacted' }).eq('id', id);
    toast.success('স্ট্যাটাস আপডেট হয়েছে');
    fetchIncomplete();
  };

  const deleteOrder = async (id: string) => {
    await (supabase.from('incomplete_orders') as any).delete().eq('id', id);
    toast.success('ডিলিট হয়েছে');
    fetchIncomplete();
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    abandoned: { label: 'অ্যাবান্ডনড', color: 'bg-destructive/10 text-destructive' },
    contacted: { label: 'কন্ট্যাক্টেড', color: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' },
  };

  const abandonedCount = orders.filter(o => o.status !== 'contacted').length;

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FileWarning className="h-4 w-4 text-[hsl(var(--warning))]" />
            ইনকমপ্লিট অর্ডার
            {abandonedCount > 0 && <Badge variant="destructive" className="text-[10px]">{abandonedCount} অ্যাবান্ডনড</Badge>}
            <Badge variant="secondary" className="text-[10px]">{orders.length} টোটাল</Badge>
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
            {orders.map((o) => {
              const isExpanded = expandedId === o.id;
              const st = statusConfig[o.status || 'abandoned'] || statusConfig.abandoned;
              const cartItems = Array.isArray(o.cart_items) ? o.cart_items : [];
              const hasContact = o.phone || o.email;

              return (
                <div key={o.id} className={cn("transition-all", isExpanded && "bg-muted/30")}>
                  {/* Main Row - like order card */}
                  <div
                    className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors gap-2 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : o.id)}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">
                            {o.first_name || 'Unknown'} {o.last_name || ''}
                          </p>
                          <Badge className={cn('text-[10px] px-1.5', st.color)}>{st.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          {o.phone && (
                            <span className="flex items-center gap-0.5">
                              <Phone className="h-3 w-3" /> {o.phone}
                            </span>
                          )}
                          {o.email && (
                            <span className="flex items-center gap-0.5">
                              <Mail className="h-3 w-3" /> {o.email}
                            </span>
                          )}
                          <span className="flex items-center gap-0.5">
                            <Clock className="h-3 w-3" /> {format(new Date(o.created_at), 'dd MMM, h:mm a')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-foreground">৳{Number(o.cart_total).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground">{cartItems.length} আইটেম</span>

                      {/* Quick action buttons */}
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {o.phone && (
                          <Button variant="default" size="sm" className="h-7 gap-1 text-[10px] px-2" asChild>
                            <a href={`tel:${o.phone}`}>
                              <Phone className="h-3 w-3" /> কল
                            </a>
                          </Button>
                        )}
                        {o.phone && (
                          <Button variant="outline" size="sm" className="h-7 gap-1 text-[10px] px-2" asChild>
                            <a href={`https://wa.me/${o.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                              <MessageCircle className="h-3 w-3" /> WA
                            </a>
                          </Button>
                        )}
                        {o.status !== 'contacted' && (
                          <Button variant="secondary" size="sm" className="h-7 text-[10px] px-2" onClick={() => markContacted(o.id)}>
                            কন্ট্যাক্টেড
                          </Button>
                        )}
                      </div>

                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Cart Items */}
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1">
                            <ShoppingBag className="h-3.5 w-3.5" /> কার্ট আইটেম
                          </p>
                          {cartItems.length > 0 ? (
                            <div className="space-y-1.5">
                              {cartItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center justify-between bg-background rounded-md px-3 py-2 border border-border/50 text-xs">
                                  <span className="font-medium text-foreground truncate flex-1">{item.name || 'Product'}</span>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-muted-foreground">x{item.qty || 1}</span>
                                    <span className="font-semibold">৳{Number(item.price || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-muted-foreground">কার্ট ডেটা নেই</p>
                          )}
                        </div>

                        {/* Address & Contact */}
                        <div className="space-y-3">
                          {(o.address || o.city) && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1">
                                <MapPin className="h-3.5 w-3.5" /> শিপিং অ্যাড্রেস
                              </p>
                              <p className="text-xs text-foreground bg-background rounded-md px-3 py-2 border border-border/50">
                                {[o.address, o.city, o.state, o.zip_code, o.country].filter(Boolean).join(', ')}
                              </p>
                            </div>
                          )}

                          {/* Action Buttons */}
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {o.phone && (
                              <Button size="sm" className="h-8 gap-1.5 text-xs" asChild>
                                <a href={`tel:${o.phone}`}>
                                  <Phone className="h-3.5 w-3.5" /> ফোন করুন
                                </a>
                              </Button>
                            )}
                            {o.email && (
                              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                                <a href={`mailto:${o.email}`}>
                                  <Mail className="h-3.5 w-3.5" /> ইমেইল
                                </a>
                              </Button>
                            )}
                            {o.phone && (
                              <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild>
                                <a href={`https://wa.me/${o.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                                </a>
                              </Button>
                            )}
                            <Button variant="destructive" size="sm" className="h-8 gap-1.5 text-xs ml-auto" onClick={() => deleteOrder(o.id)}>
                              <Trash2 className="h-3.5 w-3.5" /> ডিলিট
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
