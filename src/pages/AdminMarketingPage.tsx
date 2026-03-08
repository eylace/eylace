import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Megaphone, Plus, Mail, Bell, Image, Trash2, Edit, Send } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'push' | 'banner';
  status: 'draft' | 'active' | 'completed' | 'paused';
  audience: string;
  content: string;
  createdAt: string;
}

const AdminMarketingPage = () => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([
    { id: '1', name: 'Summer Sale Announcement', type: 'email', status: 'active', audience: 'All Customers', content: 'Get up to 50% off on summer collection!', createdAt: new Date().toISOString() },
    { id: '2', name: 'Flash Sale Alert', type: 'push', status: 'draft', audience: 'Active Users', content: 'Flash sale starts in 1 hour!', createdAt: new Date().toISOString() },
    { id: '3', name: 'Homepage Banner', type: 'banner', status: 'active', audience: 'All Visitors', content: 'Free shipping on orders over $50', createdAt: new Date().toISOString() },
  ]);
  const [addOpen, setAddOpen] = useState(false);
  const [newCampaign, setNewCampaign] = useState({ name: '', type: 'email' as const, audience: 'All Customers', content: '' });

  const handleCreate = () => {
    if (!newCampaign.name.trim()) return;
    const campaign: Campaign = {
      id: Date.now().toString(),
      ...newCampaign,
      status: 'draft',
      createdAt: new Date().toISOString(),
    };
    setCampaigns(prev => [campaign, ...prev]);
    setNewCampaign({ name: '', type: 'email', audience: 'All Customers', content: '' });
    setAddOpen(false);
    toast.success('Campaign created');
  };

  const toggleStatus = (id: string) => {
    setCampaigns(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'active' ? 'paused' : 'active' } : c));
    toast.success('Campaign status updated');
  };

  const deleteCampaign = (id: string) => {
    setCampaigns(prev => prev.filter(c => c.id !== id));
    toast.success('Campaign deleted');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active': return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>;
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'completed': return <Badge variant="outline">Completed</Badge>;
      case 'paused': return <Badge className="bg-orange-500/10 text-orange-600 border-orange-500/20">Paused</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) { case 'email': return <Mail className="h-4 w-4" />; case 'push': return <Bell className="h-4 w-4" />; default: return <Image className="h-4 w-4" />; }
  };

  return (
    <AdminLayout titleKey="admin.title.marketing" descriptionKey="admin.desc.marketing">
      <div className="space-y-6">
        <Tabs defaultValue="campaigns">
          <TabsList>
            <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
            <TabsTrigger value="banners">Promo Banners</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
          </TabsList>

          <TabsContent value="campaigns" className="mt-4">
            <Card className="border border-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Megaphone className="h-5 w-5" /> Campaigns ({campaigns.length})</CardTitle>
                <Dialog open={addOpen} onOpenChange={setAddOpen}>
                  <DialogTrigger asChild><Button size="sm"><Plus className="h-4 w-4 mr-1" /> New Campaign</Button></DialogTrigger>
                  <DialogContent>
                    <DialogHeader><DialogTitle>Create Campaign</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2"><Label>Campaign Name</Label><Input value={newCampaign.name} onChange={e => setNewCampaign(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Summer Sale" /></div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select value={newCampaign.type} onValueChange={v => setNewCampaign(p => ({ ...p, type: v as any }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="push">Push Notification</SelectItem>
                            <SelectItem value="banner">Banner</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Target Audience</Label>
                        <Select value={newCampaign.audience} onValueChange={v => setNewCampaign(p => ({ ...p, audience: v }))}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="All Customers">All Customers</SelectItem>
                            <SelectItem value="Active Users">Active Users</SelectItem>
                            <SelectItem value="New Users">New Users</SelectItem>
                            <SelectItem value="All Visitors">All Visitors</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2"><Label>Content</Label><Textarea value={newCampaign.content} onChange={e => setNewCampaign(p => ({ ...p, content: e.target.value }))} placeholder="Campaign message..." /></div>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
                      <Button onClick={handleCreate}>Create</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Campaign</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Audience</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {campaigns.map(c => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium">{c.name}</TableCell>
                        <TableCell><Badge variant="outline" className="capitalize gap-1">{getTypeIcon(c.type)} {c.type}</Badge></TableCell>
                        <TableCell className="text-sm text-muted-foreground">{c.audience}</TableCell>
                        <TableCell>{getStatusBadge(c.status)}</TableCell>
                        <TableCell className="text-right space-x-1">
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => toggleStatus(c.id)}>
                            <Send className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCampaign(c.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banners" className="mt-4">
            <Card className="border border-border">
              <CardContent className="p-6">
                <div className="space-y-4">
                  <h3 className="font-semibold text-foreground">Promotional Banners</h3>
                  <p className="text-sm text-muted-foreground">Manage homepage promotional banners and slide shows.</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {['Hero Slider', 'Category Banner', 'Flash Sale Banner', 'Footer Promo'].map(banner => (
                      <Card key={banner} className="border border-border">
                        <CardContent className="p-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><Image className="h-5 w-5 text-muted-foreground" /></div>
                            <div><p className="font-medium text-sm">{banner}</p><p className="text-xs text-muted-foreground">Active</p></div>
                          </div>
                          <Button variant="outline" size="sm">Edit</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="newsletter" className="mt-4">
            <Card className="border border-border">
              <CardContent className="p-6 space-y-4">
                <h3 className="font-semibold text-foreground">Newsletter Management</h3>
                <p className="text-sm text-muted-foreground">Send newsletters to your subscriber list.</p>
                <div className="space-y-3">
                  <div className="space-y-2"><Label>Subject</Label><Input placeholder="Newsletter subject..." /></div>
                  <div className="space-y-2"><Label>Content</Label><Textarea placeholder="Write your newsletter content..." rows={6} /></div>
                  <Button><Send className="h-4 w-4 mr-1" /> Send Newsletter</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminMarketingPage;
