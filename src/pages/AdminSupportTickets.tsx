import { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import {
  Search, Send, MoreVertical, Info, MessageSquare, AlertCircle, Clock,
  CheckCircle2, XCircle, Filter, ArrowLeft, Paperclip, StickyNote,
  UserPlus, Tag, Trash2, ListChecks, Inbox, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow, format, isToday } from 'date-fns';

type Ticket = {
  id: string;
  ticket_number: string;
  customer_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string | null;
  customer_avatar: string | null;
  subject: string;
  description: string | null;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed';
  assigned_to: string | null;
  tags: string[] | null;
  last_message_at: string;
  last_message_preview: string | null;
  unread_admin_count: number;
  created_at: string;
};

type Message = {
  id: string;
  ticket_id: string;
  sender_id: string | null;
  sender_type: 'customer' | 'admin' | 'manager' | 'system';
  sender_name: string;
  sender_avatar: string | null;
  message: string;
  attachments: any;
  is_internal_note: boolean;
  created_at: string;
};

const STATUS_META: Record<string, { label: string; color: string; icon: any }> = {
  open: { label: 'Open', color: 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-950 dark:text-amber-300', icon: AlertCircle },
  in_progress: { label: 'In Progress', color: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-950 dark:text-blue-300', icon: Clock },
  waiting_customer: { label: 'Waiting', color: 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-950 dark:text-purple-300', icon: Clock },
  resolved: { label: 'Resolved', color: 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300', icon: CheckCircle2 },
  closed: { label: 'Closed', color: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300', icon: XCircle },
};

const PRIORITY_META: Record<string, string> = {
  urgent: 'bg-red-500/10 text-red-700 border-red-200 dark:text-red-400',
  high: 'bg-orange-500/10 text-orange-700 border-orange-200 dark:text-orange-400',
  medium: 'bg-yellow-500/10 text-yellow-700 border-yellow-200 dark:text-yellow-400',
  low: 'bg-emerald-500/10 text-emerald-700 border-emerald-200 dark:text-emerald-400',
};

function initials(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(s => s[0]?.toUpperCase()).join('') || '?';
}

function formatTime(iso: string) {
  const d = new Date(iso);
  return isToday(d) ? format(d, 'p') : format(d, 'MMM d');
}

export default function AdminSupportTickets() {
  const { user } = useAuth();
  const [view, setView] = useState<'inbox' | 'list'>('inbox');
  const [tab, setTab] = useState<'all' | 'open' | 'in_progress' | 'waiting_customer' | 'resolved' | 'closed'>('all');
  const [priority, setPriority] = useState<'all' | 'low' | 'medium' | 'high' | 'urgent'>('all');
  const [search, setSearch] = useState('');
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [internalNote, setInternalNote] = useState(false);
  const [sending, setSending] = useState(false);
  const [showInfo, setShowInfo] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [bulk, setBulk] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [mobileChatOpen, setMobileChatOpen] = useState(false);

  // Load tickets
  const loadTickets = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('support_tickets')
      .select('*')
      .order('last_message_at', { ascending: false });
    if (error) {
      toast.error('Failed to load tickets');
    } else {
      setTickets((data ?? []) as Ticket[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTickets(); }, [loadTickets]);

  // Realtime tickets
  useEffect(() => {
    const ch = supabase
      .channel('support_tickets_admin')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'support_tickets' }, () => loadTickets())
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [loadTickets]);

  // Load messages for active ticket
  const loadMessages = useCallback(async (ticketId: string) => {
    const { data, error } = await supabase
      .from('support_messages')
      .select('*')
      .eq('ticket_id', ticketId)
      .order('created_at', { ascending: true });
    if (error) {
      toast.error('Failed to load messages');
      return;
    }
    setMessages((data ?? []) as Message[]);
    // mark admin-side read
    await supabase.from('support_tickets').update({ unread_admin_count: 0 }).eq('id', ticketId);
  }, []);

  useEffect(() => {
    if (!activeId) { setMessages([]); return; }
    loadMessages(activeId);
    const ch = supabase
      .channel(`support_messages_${activeId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'support_messages', filter: `ticket_id=eq.${activeId}` }, payload => {
        setMessages(prev => [...prev, payload.new as Message]);
      })
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [activeId, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const filtered = useMemo(() => {
    return tickets.filter(t => {
      if (tab !== 'all' && t.status !== tab) return false;
      if (priority !== 'all' && t.priority !== priority) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          t.subject.toLowerCase().includes(q) ||
          t.customer_name.toLowerCase().includes(q) ||
          t.customer_email.toLowerCase().includes(q) ||
          t.ticket_number.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [tickets, tab, priority, search]);

  const counts = useMemo(() => ({
    all: tickets.length,
    open: tickets.filter(t => t.status === 'open').length,
    in_progress: tickets.filter(t => t.status === 'in_progress').length,
    waiting_customer: tickets.filter(t => t.status === 'waiting_customer').length,
    resolved: tickets.filter(t => t.status === 'resolved').length,
    closed: tickets.filter(t => t.status === 'closed').length,
    unread: tickets.reduce((a, t) => a + (t.unread_admin_count || 0), 0),
  }), [tickets]);

  const active = tickets.find(t => t.id === activeId) || null;

  const sendReply = async () => {
    if (!active || !reply.trim()) return;
    setSending(true);
    const senderName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Support';
    const { error } = await supabase.from('support_messages').insert({
      ticket_id: active.id,
      sender_id: user?.id ?? null,
      sender_type: 'admin',
      sender_name: senderName,
      sender_avatar: user?.user_metadata?.avatar_url ?? null,
      message: reply.trim(),
      is_internal_note: internalNote,
    });
    setSending(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    setReply('');
    inputRef.current?.focus();
    if (internalNote) toast.success('Internal note added');
  };

  const updateStatus = async (newStatus: string) => {
    if (!active) return;
    const patch: any = { status: newStatus };
    if (newStatus === 'resolved') patch.resolved_at = new Date().toISOString();
    if (newStatus === 'closed') patch.closed_at = new Date().toISOString();
    const { error } = await supabase.from('support_tickets').update(patch).eq('id', active.id);
    if (error) toast.error(error.message);
    else toast.success(`Marked as ${newStatus.replace('_', ' ')}`);
  };

  const updatePriority = async (p: string) => {
    if (!active) return;
    const { error } = await supabase.from('support_tickets').update({ priority: p }).eq('id', active.id);
    if (error) toast.error(error.message);
    else toast.success(`Priority set to ${p}`);
  };

  const deleteTicket = async (id: string) => {
    const { error } = await supabase.from('support_tickets').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    toast.success('Ticket deleted');
    setConfirmDelete(null);
    if (activeId === id) setActiveId(null);
  };

  const bulkUpdateStatus = async (newStatus: string) => {
    if (bulk.size === 0) return;
    const patch: any = { status: newStatus };
    if (newStatus === 'resolved') patch.resolved_at = new Date().toISOString();
    if (newStatus === 'closed') patch.closed_at = new Date().toISOString();
    const { error } = await supabase.from('support_tickets').update(patch).in('id', Array.from(bulk));
    if (error) toast.error(error.message);
    else { toast.success(`Updated ${bulk.size} tickets`); setBulk(new Set()); }
  };

  const openTicket = (t: Ticket) => {
    setActiveId(t.id);
    setMobileChatOpen(true);
  };

  return (
    <AdminLayout>
      <div className="space-y-4">
        {/* Header + stats */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Support Tickets</h1>
            <p className="text-sm text-muted-foreground">Manage customer conversations & resolve tickets</p>
          </div>
          <div className="flex items-center gap-2">
            <Tabs value={view} onValueChange={(v) => setView(v as any)}>
              <TabsList className="h-9">
                <TabsTrigger value="inbox" className="text-xs gap-1"><MessageSquare className="h-3.5 w-3.5" />Chat</TabsTrigger>
                <TabsTrigger value="list" className="text-xs gap-1"><ListChecks className="h-3.5 w-3.5" />List</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-6 gap-2">
          {[
            { k: 'all', label: 'Total', icon: Inbox, color: 'text-foreground' },
            { k: 'open', label: 'Open', icon: AlertCircle, color: 'text-amber-600' },
            { k: 'in_progress', label: 'In Progress', icon: Clock, color: 'text-blue-600' },
            { k: 'waiting_customer', label: 'Waiting', icon: Clock, color: 'text-purple-600' },
            { k: 'resolved', label: 'Resolved', icon: CheckCircle2, color: 'text-emerald-600' },
            { k: 'closed', label: 'Closed', icon: XCircle, color: 'text-slate-500' },
          ].map(s => (
            <button
              key={s.k}
              onClick={() => setTab(s.k as any)}
              className={`text-left rounded-xl border bg-card p-3 transition hover:border-primary/40 hover:shadow-sm ${tab === s.k ? 'border-primary ring-1 ring-primary/30' : 'border-border'}`}
            >
              <div className="flex items-center justify-between">
                <s.icon className={`h-4 w-4 ${s.color}`} />
                <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</span>
              </div>
              <p className="mt-1 text-xl font-bold">{(counts as any)[s.k]}</p>
            </button>
          ))}
        </div>

        {view === 'inbox' ? (
          <Card className="overflow-hidden">
            <div className="grid md:grid-cols-[340px_1fr] h-[calc(100vh-280px)] min-h-[480px]">
              {/* LEFT: ticket list */}
              <div className="border-r border-border flex flex-col bg-muted/30">
                <div className="p-3 space-y-2 border-b border-border bg-card">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search tickets..."
                      className="pl-9 h-9 rounded-full bg-background"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
                      <SelectTrigger className="h-8 text-xs flex-1"><Filter className="h-3 w-3 mr-1" /><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priorities</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                      </SelectContent>
                    </Select>
                    {counts.unread > 0 && (
                      <Badge variant="destructive" className="text-[10px]">{counts.unread} new</Badge>
                    )}
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {loading ? (
                    <div className="flex items-center justify-center py-12 text-muted-foreground text-sm">
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Loading...
                    </div>
                  ) : filtered.length === 0 ? (
                    <div className="text-center py-12 text-sm text-muted-foreground">
                      <Inbox className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      No tickets found
                    </div>
                  ) : (
                    <ul className="divide-y divide-border">
                      {filtered.map(t => {
                        const SM = STATUS_META[t.status];
                        const isActive = activeId === t.id;
                        return (
                          <li key={t.id}>
                            <button
                              onClick={() => openTicket(t)}
                              className={`w-full text-left p-3 flex gap-3 hover:bg-accent/50 transition ${isActive ? 'bg-accent' : ''}`}
                            >
                              <div className="relative shrink-0">
                                <Avatar className="h-10 w-10">
                                  <AvatarImage src={t.customer_avatar ?? undefined} />
                                  <AvatarFallback className="text-xs bg-primary/10 text-primary font-semibold">
                                    {initials(t.customer_name)}
                                  </AvatarFallback>
                                </Avatar>
                                {t.unread_admin_count > 0 && (
                                  <span className="absolute -bottom-0.5 -right-0.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
                                    {t.unread_admin_count}
                                  </span>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between gap-2">
                                  <p className="font-semibold text-sm truncate">{t.customer_name}</p>
                                  <span className="text-[10px] text-muted-foreground shrink-0">{formatTime(t.last_message_at)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-0.5">
                                  {t.last_message_preview || t.subject}
                                </p>
                                <div className="flex items-center gap-1 mt-1.5">
                                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${SM.color}`}>{SM.label}</Badge>
                                  <Badge variant="outline" className={`text-[9px] px-1.5 py-0 h-4 ${PRIORITY_META[t.priority]}`}>{t.priority}</Badge>
                                </div>
                              </div>
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </ScrollArea>
              </div>

              {/* RIGHT: chat panel (desktop) */}
              <div className="hidden md:flex flex-col">
                {!active ? (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground/40" />
                      <p className="mt-3 text-sm font-medium">Select a ticket to view conversation</p>
                      <p className="text-xs text-muted-foreground mt-1">Choose from the list on the left</p>
                    </div>
                  </div>
                ) : (
                  <ChatPanel
                    ticket={active}
                    messages={messages}
                    reply={reply}
                    setReply={setReply}
                    internalNote={internalNote}
                    setInternalNote={setInternalNote}
                    sending={sending}
                    onSend={sendReply}
                    onStatusChange={updateStatus}
                    onPriorityChange={updatePriority}
                    onShowInfo={() => setShowInfo(true)}
                    onDelete={() => setConfirmDelete(active.id)}
                    scrollRef={scrollRef}
                    inputRef={inputRef}
                  />
                )}
              </div>
            </div>
          </Card>
        ) : (
          // LIST view
          <Card>
            <CardContent className="p-0">
              <div className="flex items-center gap-3 p-4 border-b border-border">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..." className="pl-9" />
                </div>
                {bulk.size > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{bulk.size} selected</Badge>
                    <Select onValueChange={bulkUpdateStatus}>
                      <SelectTrigger className="h-8 w-40"><SelectValue placeholder="Bulk action" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Mark Open</SelectItem>
                        <SelectItem value="in_progress">Mark In Progress</SelectItem>
                        <SelectItem value="resolved">Mark Resolved</SelectItem>
                        <SelectItem value="closed">Mark Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr className="text-left">
                      <th className="p-3 w-10"><input type="checkbox" checked={bulk.size === filtered.length && filtered.length > 0} onChange={(e) => setBulk(e.target.checked ? new Set(filtered.map(t => t.id)) : new Set())} /></th>
                      <th className="p-3">Ticket</th>
                      <th className="p-3">Customer</th>
                      <th className="p-3">Subject</th>
                      <th className="p-3">Priority</th>
                      <th className="p-3">Status</th>
                      <th className="p-3">Updated</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(t => {
                      const SM = STATUS_META[t.status];
                      return (
                        <tr key={t.id} className="border-b border-border hover:bg-muted/30">
                          <td className="p-3"><input type="checkbox" checked={bulk.has(t.id)} onChange={(e) => {
                            const next = new Set(bulk); e.target.checked ? next.add(t.id) : next.delete(t.id); setBulk(next);
                          }} /></td>
                          <td className="p-3 font-mono text-xs">{t.ticket_number}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7"><AvatarFallback className="text-[10px]">{initials(t.customer_name)}</AvatarFallback></Avatar>
                              <div>
                                <p className="font-medium">{t.customer_name}</p>
                                <p className="text-[11px] text-muted-foreground">{t.customer_email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="p-3 max-w-xs truncate">{t.subject}</td>
                          <td className="p-3"><Badge variant="outline" className={PRIORITY_META[t.priority]}>{t.priority}</Badge></td>
                          <td className="p-3"><Badge variant="outline" className={SM.color}><SM.icon className="h-3 w-3 mr-1" />{SM.label}</Badge></td>
                          <td className="p-3 text-xs text-muted-foreground">{formatDistanceToNow(new Date(t.last_message_at), { addSuffix: true })}</td>
                          <td className="p-3 text-right">
                            <Button size="sm" variant="outline" onClick={() => { setView('inbox'); openTicket(t); }}>
                              <MessageSquare className="h-3 w-3 mr-1" /> Open
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                    {filtered.length === 0 && (
                      <tr><td colSpan={8} className="p-12 text-center text-muted-foreground">No tickets match the filters</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Mobile chat sheet */}
      <Sheet open={mobileChatOpen && !!active} onOpenChange={setMobileChatOpen}>
        <SheetContent side="right" className="p-0 w-full sm:max-w-md md:hidden">
          <SheetHeader className="sr-only"><SheetTitle>Conversation</SheetTitle></SheetHeader>
          {active && (
            <ChatPanel
              ticket={active}
              messages={messages}
              reply={reply}
              setReply={setReply}
              internalNote={internalNote}
              setInternalNote={setInternalNote}
              sending={sending}
              onSend={sendReply}
              onStatusChange={updateStatus}
              onPriorityChange={updatePriority}
              onShowInfo={() => setShowInfo(true)}
              onDelete={() => setConfirmDelete(active.id)}
              onBack={() => setMobileChatOpen(false)}
              scrollRef={scrollRef}
              inputRef={inputRef}
            />
          )}
        </SheetContent>
      </Sheet>

      {/* Info side panel */}
      <Sheet open={showInfo} onOpenChange={setShowInfo}>
        <SheetContent className="w-full sm:max-w-sm">
          <SheetHeader><SheetTitle>Ticket Details</SheetTitle></SheetHeader>
          {active && (
            <div className="mt-6 space-y-4">
              <div className="flex items-center gap-3">
                <Avatar className="h-14 w-14">
                  <AvatarImage src={active.customer_avatar ?? undefined} />
                  <AvatarFallback className="text-lg bg-primary/10 text-primary">{initials(active.customer_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{active.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{active.customer_email}</p>
                  {active.customer_phone && <p className="text-xs text-muted-foreground">{active.customer_phone}</p>}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-muted-foreground">Ticket #</span><span className="font-mono">{active.ticket_number}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Subject</span><span className="text-right max-w-[60%]">{active.subject}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Category</span><span>{active.category}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Priority</span><Badge variant="outline" className={PRIORITY_META[active.priority]}>{active.priority}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge variant="outline" className={STATUS_META[active.status].color}>{STATUS_META[active.status].label}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Created</span><span>{format(new Date(active.created_at), 'PPp')}</span></div>
              </div>

              {active.description && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">Description</p>
                  <p className="text-sm bg-muted/40 rounded p-3">{active.description}</p>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <Button variant="outline" className="w-full" onClick={() => setConfirmDelete(active.id)}>
                  <Trash2 className="h-4 w-4 mr-2" /> Delete Ticket
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Delete confirm */}
      <Dialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete this ticket?</DialogTitle>
            <DialogDescription>The ticket and all messages will be permanently removed. This cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>Cancel</Button>
            <Button variant="destructive" onClick={() => confirmDelete && deleteTicket(confirmDelete)}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

/* ---------------- Chat panel ---------------- */
function ChatPanel({
  ticket, messages, reply, setReply, internalNote, setInternalNote, sending,
  onSend, onStatusChange, onPriorityChange, onShowInfo, onDelete, onBack,
  scrollRef, inputRef,
}: {
  ticket: Ticket;
  messages: Message[];
  reply: string;
  setReply: (v: string) => void;
  internalNote: boolean;
  setInternalNote: (v: boolean) => void;
  sending: boolean;
  onSend: () => void;
  onStatusChange: (s: string) => void;
  onPriorityChange: (p: string) => void;
  onShowInfo: () => void;
  onDelete: () => void;
  onBack?: () => void;
  scrollRef: React.RefObject<HTMLDivElement>;
  inputRef: React.RefObject<HTMLTextAreaElement>;
}) {
  const SM = STATUS_META[ticket.status];
  return (
    <div className="flex flex-col h-full">
      {/* Chat header */}
      <div className="flex items-center justify-between gap-3 p-3 border-b border-border bg-card">
        <div className="flex items-center gap-3 min-w-0">
          {onBack && (
            <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onBack}><ArrowLeft className="h-4 w-4" /></Button>
          )}
          <Avatar className="h-10 w-10">
            <AvatarImage src={ticket.customer_avatar ?? undefined} />
            <AvatarFallback className="bg-primary/10 text-primary text-xs">{initials(ticket.customer_name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-semibold text-sm truncate">{ticket.customer_name}</p>
            <p className="text-[11px] text-muted-foreground truncate">
              <span className="font-mono">{ticket.ticket_number}</span> · {ticket.subject}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className={`hidden sm:inline-flex ${SM.color}`}><SM.icon className="h-3 w-3 mr-1" />{SM.label}</Badge>
          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={onShowInfo}><Info className="h-4 w-4" /></Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>Set status</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onStatusChange('open')}><AlertCircle className="h-3.5 w-3.5 mr-2" />Open</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange('in_progress')}><Clock className="h-3.5 w-3.5 mr-2" />In Progress</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange('waiting_customer')}><Clock className="h-3.5 w-3.5 mr-2" />Waiting Customer</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange('resolved')}><CheckCircle2 className="h-3.5 w-3.5 mr-2" />Resolved</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onStatusChange('closed')}><XCircle className="h-3.5 w-3.5 mr-2" />Closed</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => onPriorityChange('urgent')}><Tag className="h-3.5 w-3.5 mr-2 text-red-600" />Urgent</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPriorityChange('high')}><Tag className="h-3.5 w-3.5 mr-2 text-orange-600" />High</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPriorityChange('medium')}><Tag className="h-3.5 w-3.5 mr-2 text-yellow-600" />Medium</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPriorityChange('low')}><Tag className="h-3.5 w-3.5 mr-2 text-emerald-600" />Low</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive focus:text-destructive">
                <Trash2 className="h-3.5 w-3.5 mr-2" />Delete Ticket
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 bg-muted/20">
        {messages.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">
            No messages yet. Send the first reply.
          </div>
        ) : messages.map(m => {
          const isAgent = m.sender_type === 'admin' || m.sender_type === 'manager';
          const isSystem = m.sender_type === 'system';
          if (isSystem) {
            return (
              <div key={m.id} className="text-center">
                <span className="inline-block text-[11px] text-muted-foreground bg-background border border-border rounded-full px-3 py-1">
                  {m.message}
                </span>
              </div>
            );
          }
          if (m.is_internal_note) {
            return (
              <div key={m.id} className="flex justify-center">
                <div className="max-w-[85%] bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-lg p-3 shadow-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <StickyNote className="h-3 w-3 text-amber-700 dark:text-amber-400" />
                    <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wide">
                      Internal note · {m.sender_name}
                    </span>
                  </div>
                  <p className="text-sm text-amber-900 dark:text-amber-100 whitespace-pre-wrap">{m.message}</p>
                  <p className="text-[10px] text-amber-700/70 dark:text-amber-400/70 mt-1">{format(new Date(m.created_at), 'p')}</p>
                </div>
              </div>
            );
          }
          return (
            <div key={m.id} className={`flex gap-2 ${isAgent ? 'justify-end' : 'justify-start'}`}>
              {!isAgent && (
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarImage src={m.sender_avatar ?? undefined} />
                  <AvatarFallback className="text-[10px]">{initials(m.sender_name)}</AvatarFallback>
                </Avatar>
              )}
              <div className={`max-w-[78%] rounded-2xl px-3.5 py-2 shadow-sm ${
                isAgent
                  ? 'bg-primary text-primary-foreground rounded-br-sm'
                  : 'bg-card text-foreground rounded-bl-sm border border-border'
              }`}>
                <div className="flex items-center justify-between gap-3 mb-0.5">
                  <span className={`text-[11px] font-semibold ${isAgent ? 'opacity-80' : 'text-muted-foreground'}`}>{m.sender_name}</span>
                  <span className={`text-[10px] ${isAgent ? 'opacity-70' : 'text-muted-foreground'}`}>{format(new Date(m.created_at), 'p')}</span>
                </div>
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{m.message}</p>
              </div>
              {isAgent && (
                <Avatar className="h-7 w-7 shrink-0 mt-0.5">
                  <AvatarImage src={m.sender_avatar ?? undefined} />
                  <AvatarFallback className="text-[10px] bg-primary/15 text-primary">{initials(m.sender_name)}</AvatarFallback>
                </Avatar>
              )}
            </div>
          );
        })}
      </div>

      {/* Composer */}
      <div className="border-t border-border bg-card p-3">
        {internalNote && (
          <div className="mb-2 text-[11px] text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded px-2 py-1 flex items-center gap-2">
            <StickyNote className="h-3 w-3" /> Internal note — only support staff can see this
          </div>
        )}
        <div className="flex items-end gap-2">
          <Textarea
            ref={inputRef}
            value={reply}
            onChange={e => setReply(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(); }
            }}
            placeholder={internalNote ? 'Write an internal note...' : 'Type your reply... (Enter to send, Shift+Enter for new line)'}
            rows={2}
            className="resize-none min-h-[48px] max-h-32"
          />
          <div className="flex flex-col gap-1.5">
            <Button
              type="button"
              variant={internalNote ? 'default' : 'outline'}
              size="icon"
              className="h-9 w-9"
              onClick={() => setInternalNote(!internalNote)}
              title="Toggle internal note"
            >
              <StickyNote className="h-4 w-4" />
            </Button>
            <Button onClick={onSend} disabled={sending || !reply.trim()} size="icon" className="h-9 w-9">
              {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
