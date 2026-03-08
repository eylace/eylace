import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Upload, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const AdminAddDigitalProduct = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  const [form, setForm] = useState({
    name: '', slug: '', description: '', price: '', original_price: '', stock: '',
    category_id: '', images: [] as string[], is_active: true, digital_file_url: '',
  });

  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => { if (data) setCategories(data); });
  }, []);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    setImageUploading(true);
    try {
      const newImages: string[] = [];
      for (const file of Array.from(files)) {
        const ext = file.name.split('.').pop();
        const path = `products/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage.from('product-images').upload(path, file);
        if (error) throw error;
        const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
        newImages.push(urlData.publicUrl);
      }
      setForm(f => ({ ...f, images: [...f.images, ...newImages] }));
    } catch (err: any) { toast.error('Upload failed: ' + err.message); }
    setImageUploading(false);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.price) { toast.error('Name and price are required'); return; }
    setLoading(true);
    const { error } = await supabase.from('products').insert({
      name: form.name,
      slug: form.slug || generateSlug(form.name),
      description: form.description || null,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      stock: form.stock ? parseInt(form.stock) : 999999,
      category_id: form.category_id || null,
      images: form.images,
      is_active: form.is_active,
      is_digital: true,
      digital_file_url: form.digital_file_url || null,
      is_free_shipping: true,
    });
    if (error) { toast.error('Failed: ' + error.message); } else { toast.success('Digital product created!'); navigate('/admin/products'); }
    setLoading(false);
  };

  return (
    <AdminLayout title="Add Digital Product" description="Create a new digital/downloadable product">
      <Card className="max-w-2xl">
        <CardHeader><CardTitle>New Digital Product</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><Label>Product Name *</Label><Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))} /></div>
            <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={3} /></div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div><Label>Price *</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} /></div>
            <div><Label>Original Price</Label><Input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} /></div>
            <div><Label>Category</Label>
              <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div><Label>Digital File URL</Label><Input value={form.digital_file_url} onChange={e => setForm(f => ({ ...f, digital_file_url: e.target.value }))} placeholder="https://..." /></div>
          <div>
            <Label className="mb-2 block">Product Images</Label>
            <div className="flex flex-wrap gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg border overflow-hidden group">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100"><X className="h-3 w-3" /></button>
                </div>
              ))}
              <label className="h-20 w-20 rounded-lg border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:border-accent">
                {imageUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Upload className="h-4 w-4 text-muted-foreground" /><span className="text-[10px] text-muted-foreground">Upload</span></>}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={imageUploading} />
              </label>
            </div>
          </div>
          <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} /><Label>Active</Label></div>
          <Button onClick={handleSubmit} disabled={loading} className="w-full gap-2">{loading && <Loader2 className="h-4 w-4 animate-spin" />}Create Digital Product</Button>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminAddDigitalProduct;
