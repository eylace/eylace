import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Loader2, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const AdminSellerRatings = () => {
  const [sellers, setSellers] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editSeller, setEditSeller] = useState<any>(null);
  const [newRating, setNewRating] = useState('');

  const fetch = useCallback(async () => {
    setIsLoading(true);
    const { data } = await supabase.from('sellers').select('*').order('rating', { ascending: false });
    if (data) setSellers(data);
    setIsLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const updateRating = async () => {
    if (!editSeller) return;
    const val = parseFloat(newRating);
    if (isNaN(val) || val < 0 || val > 5) { toast.error('Rating must be 0-5'); return; }
    const { error } = await supabase.from('sellers').update({ rating: val }).eq('id', editSeller.id);
    if (!error) { toast.success('Rating updated'); setEditSeller(null); fetch(); } else toast.error('Failed');
  };

  return (
    <AdminLayout titleKey="admin.sellers.ratings" descriptionKey="admin.sellers.ratingsDesc">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Star className="h-5 w-5 text-yellow-500" /> Seller Ratings & Followers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-accent" /></div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Seller</TableHead>
                  <TableHead>Rating</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sellers.map(s => (
                  <TableRow key={s.id}>
                    <TableCell className="font-medium">{s.name}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {[1,2,3,4,5].map(i => <Star key={i} className={`h-3.5 w-3.5 ${i <= (s.rating || 0) ? 'text-yellow-500 fill-yellow-500' : 'text-muted-foreground'}`} />)}
                        <span className="ml-1 text-sm">{s.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </TableCell>
                    <TableCell>{s.is_verified ? <Badge className="bg-green-500/10 text-green-600">Verified</Badge> : <Badge variant="secondary">Unverified</Badge>}</TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => { setEditSeller(s); setNewRating(String(s.rating || 0)); }}>Edit Rating</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!editSeller} onOpenChange={() => setEditSeller(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Edit Rating for {editSeller?.name}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Label>Rating (0-5)</Label>
            <Input type="number" min={0} max={5} step={0.1} value={newRating} onChange={e => setNewRating(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditSeller(null)}>Cancel</Button>
            <Button onClick={updateRating}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSellerRatings;
