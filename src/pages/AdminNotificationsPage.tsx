import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Bell, Send, Plus, Trash2, Users, Mail, Smartphone } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'push' | 'email' | 'sms';
  audience: string;
  sentAt: string;
  status: 'sent' | 'draft' | 'scheduled';
}

const AdminNotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([
    { id: '1', title: 'Order Shipped', message: 'Your order has been shipped!', type: 'push', audience: 'Order Customers', sentAt: new Date().toISOString(), status: 'sent' },
    { id: '2', title: 'Welcome Offer', message: 'Get 20% off on your first order', type: 'email', audience: 'New Users', sentAt: new Date().toISOString(), status: 'sent' },
    { id: '3', title: 'Flash Sale Starting', message: 'Flash sale starts in 1 hour!', type: 'push', audience: 'All Users', sentAt: '', status: 'draft' },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [newNotif, setNewNotif] = useState({ title: '', message: '', type: 'push' as const, audience: 'All Users' });

  // Notification templates
  const [templates] = useState({
    orderConfirmation: { enabled: true, email: true, push: true },
    orderShipped: { enabled: true, email: true, push: true },
    orderDelivered: { enabled: true, email: true, push: false },
    newReview: { enabled: true, email: false, push: true },
    lowStock: { enabled: true, email: true, push: false },
    newSeller: { enabled: true, email: true, push: false },
    promotions: { enabled: false, email: false, push: false },
  });

  const handleSend = () => {
    if (!newNotif.title.trim()) return;
    const notif: Notification = {
      id: Date.now().toString(),
      ...newNotif,
      sentAt: new Date().toISOString(),
      status: 'sent',
    };
    setNotifications(prev => [notif, ...prev]);
    setNewNotif({ title: '', message: '', type: 'push', audience: 'All Users' });
    setAddOpen(false);
    toast.success('Notification sent');
  };

  const deleteNotif = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    toast.success('Notification deleted');
  };

  const getTypeIcon = (type: string) => {
    switch (type) { case 'email': return <Mail className="h-4 w-4" />; case 'sms': return <Smartphone className="h-4 w-4" />; default: return <Bell className="h-4 w-4" />; }
  };

  return (
    <AdminLayout titleKey="admin.title.notifications" descriptionKey="admin.desc.notifications">
      <Tabs defaultValue="history">
        <TabsList>
          <TabsTrigger value="history">Notification History</TabsTrigger>
          <TabsTrigger value="templates">Auto Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="mt-4">
          <Card className="border border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Bell className="h-5 w-5" /> Notifications ({notifications.length})</CardTitle>
              <Dialog open={addOpen} onOpenChange={setAddOpen}>
                <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> Send Notification</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Send Notification</DialogTitle></DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2"><Label>Title</Label><Input value={newNotif.title} onChange={e => setNewNotif(p => ({ ...p, title: e.target.value }))} placeholder="Notification title" /></div>
                    <div className="space-y-2"><Label>Message</Label><Textarea value={newNotif.message} onChange={e => setNewNotif(p => ({ ...p, message: e.target.value }))} placeholder="Notification message..." /></div>
                    <div className="space-y-2">
                      <Label>Channel</Label>
                      <Select value={newNotif.type} onValueChange={v => setNewNotif(p => ({ ...p, type: v as any }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="push">Push Notification</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="sms">SMS</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Audience</Label>
                      <Select value={newNotif.audience} onValueChange={v => setNewNotif(p => ({ ...p, audience: v }))}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="All Users">All Users</SelectItem>
                          <SelectItem value="Active Users">Active Users</SelectItem>
                          <SelectItem value="New Users">New Users</SelectItem>
                          <SelectItem value="Order Customers">Order Customers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                    <Button onClick={handleSend}><Send className="h-4 w-4 mr-1" /> Send</Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Channel</TableHead>
                    <TableHead>Audience</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notifications.map(n => (
                    <TableRow key={n.id}>
                      <TableCell><div><p className="font-medium text-sm">{n.title}</p><p className="text-xs text-muted-foreground truncate max-w-[200px]">{n.message}</p></div></TableCell>
                      <TableCell><Badge variant="outline" className="capitalize gap-1">{getTypeIcon(n.type)} {n.type}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{n.audience}</TableCell>
                      <TableCell><Badge variant={n.status === 'sent' ? 'default' : 'secondary'}>{n.status}</Badge></TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteNotif(n.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="templates" className="mt-4">
          <Card className="border border-border">
            <CardHeader><CardTitle className="text-base">Automatic Notification Templates</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {[
                { key: 'orderConfirmation', label: 'Order Confirmation', desc: 'When a new order is placed' },
                { key: 'orderShipped', label: 'Order Shipped', desc: 'When an order is shipped' },
                { key: 'orderDelivered', label: 'Order Delivered', desc: 'When an order is delivered' },
                { key: 'newReview', label: 'New Review', desc: 'When a product receives a review' },
                { key: 'lowStock', label: 'Low Stock Alert', desc: 'When product stock is running low' },
                { key: 'newSeller', label: 'New Seller Application', desc: 'When a new seller applies' },
                { key: 'promotions', label: 'Promotional', desc: 'Send promotional notifications' },
              ].map(template => (
                <div key={template.key} className="flex items-center justify-between p-3 border border-border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">{template.label}</p>
                    <p className="text-xs text-muted-foreground">{template.desc}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1"><Mail className="h-3 w-3 text-muted-foreground" /><Switch defaultChecked={(templates as any)[template.key]?.email} /></div>
                    <div className="flex items-center gap-1"><Bell className="h-3 w-3 text-muted-foreground" /><Switch defaultChecked={(templates as any)[template.key]?.push} /></div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminNotificationsPage;
