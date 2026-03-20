import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Phone, Mail, FileWarning, RefreshCw, Trash2, ChevronDown, ChevronUp, ShoppingBag, MapPin, Clock, MessageCircle, Search, Download, CheckCheck, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { exportToCSV } from '@/lib/csvExport';

interface IncompleteOrder {
  id: string; first_name: string | null; last_name: string | null; email: string | null;
  phone: string | null; address: string | null; city: string | null; state: string | null;
  zip_code: string | null; country: string | null; cart_total: number; status: string;
  created_at: string; cart_items: any; notes: string | null; session_id: string | null;
}

export const DashboardIncompleteOrders = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<IncompleteOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const fetchIncomplete = async () => {
    setLoading(true);
    const { data } = await supabase.from('incomplete_orders').select('*').order('created_at', { ascending: false }).limit(100);
    setOrders((data as unknown as IncompleteOrder[]) || []);
    setSelectedIds(new Set());
    setLoading(false);
  };

  useEffect(() => { fetchIncomplete(); }, []);

  const filteredOrders = useMemo(() => {
    let result = orders;
    if (statusFilter !== 'all') {
      result = result.filter(o => (o.status || 'abandoned') === statusFilter);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(o =>
        (o.first_name || '').toLowerCase().includes(q) ||
        (o.last_name || '').toLowerCase().includes(q) ||
        (o.phone || '').includes(q) ||
        (o.email || '').toLowerCase().includes(q)
      );
    }
    return result;
  }, [orders, statusFilter, searchQuery]);

  const updateStatus = async (id: string, status: string) => {
    await (supabase.from('incomplete_orders') as any).update({ status }).eq('id', id);
    toast.success(t('admin.incomplete.statusUpdated'));
    fetchIncomplete();
  };

  const deleteOrder = async (id: string) => {
    await (supabase.from('incomplete_orders') as any).delete().eq('id', id);
    toast.success(t('admin.incomplete.deleted'));
    fetchIncomplete();
  };

  const bulkDelete = async () => {
    if (selectedIds.size === 0) return;
    for (const id of selectedIds) {
      await (supabase.from('incomplete_orders') as any).delete().eq('id', id);
    }
    toast.success(`${selectedIds.size} orders deleted`);
    fetchIncomplete();
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredOrders.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleExportCSV = () => {
    exportToCSV(filteredOrders, [
      { key: 'first_name', label: 'First Name' },
      { key: 'last_name', label: 'Last Name' },
      { key: 'phone', label: 'Phone' },
      { key: 'email', label: 'Email' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'cart_total', label: 'Cart Total' },
      { key: 'status', label: 'Status' },
      { key: 'created_at', label: 'Date' },
    ], 'incomplete-orders');
  };

  const statusConfig: Record<string, { label: string; color: string }> = {
    abandoned: { label: t('admin.incomplete.abandonedLabel'), color: 'bg-destructive/10 text-destructive' },
    contacted: { label: t('admin.incomplete.contactedLabel'), color: 'bg-[hsl(var(--warning))]/10 text-[hsl(var(--warning))]' },
    converted: { label: 'Converted', color: 'bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]' },
  };

  const abandonedCount = orders.filter(o => (o.status || 'abandoned') === 'abandoned').length;
  const contactedCount = orders.filter(o => o.status === 'contacted').length;
  const convertedCount = orders.filter(o => o.status === 'converted').length;

  return (
    <Card className="border border-border">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-base font-semibold flex items-center gap-2 cursor-pointer hover:text-primary transition-colors" onClick={() => navigate('/admin/incomplete-orders')}>
            <FileWarning className="h-4 w-4 text-[hsl(var(--warning))]" />
            {t('admin.incomplete.title')}
          </CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            {abandonedCount > 0 && <Badge variant="destructive" className="text-[10px]">{abandonedCount} Abandoned</Badge>}
            {contactedCount > 0 && <Badge variant="secondary" className="text-[10px]">{contactedCount} Contacted</Badge>}
            {convertedCount > 0 && <Badge className="text-[10px] bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]">{convertedCount} Converted</Badge>}
            <Badge variant="outline" className="text-[10px]">{orders.length} {t('admin.incomplete.total')}</Badge>
          </div>
        </div>
        {/* Toolbar */}
        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search name, phone, email..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="h-8 pl-8 text-xs"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-8 w-[130px] text-xs">
              <Filter className="h-3 w-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="abandoned">Abandoned</SelectItem>
              <SelectItem value="contacted">Contacted</SelectItem>
              <SelectItem value="converted">Converted</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" className="h-8 text-xs gap-1" onClick={handleExportCSV}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          {selectedIds.size > 0 && (
            <Button variant="destructive" size="sm" className="h-8 text-xs gap-1" onClick={bulkDelete}>
              <Trash2 className="h-3.5 w-3.5" /> Delete ({selectedIds.size})
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={fetchIncomplete} className="h-8"><RefreshCw className="h-3.5 w-3.5" /></Button>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-6 text-center text-muted-foreground text-sm">{t('admin.incomplete.loading')}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-6 text-center text-muted-foreground text-sm">{t('admin.incomplete.noOrders')}</div>
        ) : (
          <div className="divide-y divide-border">
            {/* Select all header */}
            <div className="flex items-center gap-2 px-4 py-2 bg-muted/20 text-xs text-muted-foreground">
              <Checkbox checked={selectedIds.size === filteredOrders.length && filteredOrders.length > 0} onCheckedChange={toggleSelectAll} />
              <span>{selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select all'}</span>
            </div>
            {filteredOrders.map((o) => {
              const isExpanded = expandedId === o.id;
              const st = statusConfig[o.status || 'abandoned'] || statusConfig.abandoned;
              const cartItems = Array.isArray(o.cart_items) ? o.cart_items : [];
              return (
                <div key={o.id} className={cn("transition-all", isExpanded && "bg-muted/30")}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors gap-2">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Checkbox checked={selectedIds.has(o.id)} onCheckedChange={() => toggleSelect(o.id)} onClick={e => e.stopPropagation()} />
                      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : o.id)}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-semibold text-foreground">{o.first_name || 'Unknown'} {o.last_name || ''}</p>
                          <Badge className={cn('text-[10px] px-1.5', st.color)}>{st.label}</Badge>
                        </div>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5 flex-wrap">
                          {o.phone && (<span className="flex items-center gap-0.5"><Phone className="h-3 w-3" /> {o.phone}</span>)}
                          {o.email && (<span className="flex items-center gap-0.5"><Mail className="h-3 w-3" /> {o.email}</span>)}
                          <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" /> {format(new Date(o.created_at), 'dd MMM yyyy, h:mm a')}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-foreground">৳{Number(o.cart_total).toLocaleString()}</span>
                      <span className="text-[10px] text-muted-foreground">{cartItems.length} {t('admin.incomplete.items')}</span>
                      <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                        {o.phone && (<Button variant="default" size="sm" className="h-7 gap-1 text-[10px] px-2" asChild><a href={`tel:${o.phone}`}><Phone className="h-3 w-3" /> {t('admin.incomplete.call')}</a></Button>)}
                        {o.phone && (<Button variant="outline" size="sm" className="h-7 gap-1 text-[10px] px-2" asChild><a href={`https://wa.me/${o.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3 w-3" /> {t('admin.incomplete.wa')}</a></Button>)}
                        {o.status !== 'contacted' && o.status !== 'converted' && (
                          <Button variant="secondary" size="sm" className="h-7 text-[10px] px-2" onClick={() => updateStatus(o.id, 'contacted')}>{t('admin.incomplete.contacted')}</Button>
                        )}
                        {o.status !== 'converted' && (
                          <Button variant="secondary" size="sm" className="h-7 text-[10px] px-2 gap-1" onClick={() => updateStatus(o.id, 'converted')}><CheckCheck className="h-3 w-3" /> Converted</Button>
                        )}
                      </div>
                      <div className="cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : o.id)}>
                        {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </div>
                  {isExpanded && (
                    <div className="px-4 pb-4 space-y-3 border-t border-border/50 pt-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-muted-foreground mb-2 flex items-center gap-1"><ShoppingBag className="h-3.5 w-3.5" /> {t('admin.incomplete.cartItems')}</p>
                          {cartItems.length > 0 ? (
                            <div className="space-y-1.5">
                              {cartItems.map((item: any, idx: number) => (
                                <div key={idx} className="flex items-center gap-2 bg-background rounded-md px-3 py-2 border border-border/50 text-xs">
                                  {item.image && (
                                    <img src={item.image} alt={item.name || 'Product'} className="h-10 w-10 rounded object-cover shrink-0 border border-border/30" />
                                  )}
                                  <div className="flex-1 min-w-0">
                                    <span className="font-medium text-foreground truncate block">{item.name || 'Product'}</span>
                                    {item.variation && typeof item.variation === 'object' && Object.keys(item.variation).length > 0 && (
                                      <div className="flex gap-1 mt-0.5 flex-wrap">
                                        {Object.entries(item.variation).map(([key, val]) => (
                                          <Badge key={key} variant="outline" className="text-[9px] px-1 py-0">{key}: {String(val)}</Badge>
                                        ))}
                                      </div>
                                    )}
                                    {item.product_id && (
                                      <span className="text-[9px] text-muted-foreground">ID: {String(item.product_id).slice(0, 8)}...</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-3 shrink-0">
                                    <span className="text-muted-foreground">x{item.qty || 1}</span>
                                    <span className="font-semibold">৳{Number(item.price || 0).toLocaleString()}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (<p className="text-xs text-muted-foreground">{t('admin.incomplete.noCartData')}</p>)}
                        </div>
                        <div className="space-y-3">
                          {(o.address || o.city) && (
                            <div>
                              <p className="text-xs font-semibold text-muted-foreground mb-1 flex items-center gap-1"><MapPin className="h-3.5 w-3.5" /> {t('admin.incomplete.shippingAddress')}</p>
                              <p className="text-xs text-foreground bg-background rounded-md px-3 py-2 border border-border/50">{[o.address, o.city, o.state, o.zip_code, o.country].filter(Boolean).join(', ')}</p>
                            </div>
                          )}
                          <div className="flex items-center gap-2 flex-wrap pt-1">
                            {o.phone && (<Button size="sm" className="h-8 gap-1.5 text-xs" asChild><a href={`tel:${o.phone}`}><Phone className="h-3.5 w-3.5" /> {t('admin.incomplete.phoneCall')}</a></Button>)}
                            {o.email && (<Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild><a href={`mailto:${o.email}`}><Mail className="h-3.5 w-3.5" /> {t('admin.incomplete.email')}</a></Button>)}
                            {o.phone && (<Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" asChild><a href={`https://wa.me/${o.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"><MessageCircle className="h-3.5 w-3.5" /> {t('admin.incomplete.whatsapp')}</a></Button>)}
                            <Button variant="destructive" size="sm" className="h-8 gap-1.5 text-xs ml-auto" onClick={() => deleteOrder(o.id)}><Trash2 className="h-3.5 w-3.5" /> {t('admin.incomplete.delete')}</Button>
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
