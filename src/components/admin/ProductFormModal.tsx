import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, X, Upload } from 'lucide-react';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  onSaved: () => void;
}

export const AdminProductFormModal = ({ open, onOpenChange, product, onSaved }: ProductFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [imageUploading, setImageUploading] = useState(false);

  const [form, setForm] = useState({
    name: '',
    slug: '',
    description: '',
    price: '',
    original_price: '',
    discount: '',
    stock: '',
    category_id: '',
    images: [] as string[],
    is_active: true,
    is_flash_sale: false,
    is_free_shipping: false,
    is_prime: false,
    variations: [] as { name: string; options: string[] }[],
  });

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        slug: product.slug || '',
        description: product.description || '',
        price: String(product.price || ''),
        original_price: String(product.original_price || ''),
        discount: String(product.discount || ''),
        stock: String(product.stock || ''),
        category_id: product.category_id || '',
        images: product.images || [],
        is_active: product.is_active ?? true,
        is_flash_sale: product.is_flash_sale ?? false,
        is_free_shipping: product.is_free_shipping ?? false,
        is_prime: product.is_prime ?? false,
        variations: product.variations || [],
      });
    } else {
      setForm({
        name: '', slug: '', description: '', price: '', original_price: '', discount: '',
        stock: '', category_id: '', images: [], is_active: true, is_flash_sale: false,
        is_free_shipping: false, is_prime: false, variations: [],
      });
    }
  }, [product, open]);

  useEffect(() => {
    supabase.from('categories').select('id, name').order('name').then(({ data }) => {
      if (data) setCategories(data);
    });
  }, []);

  const generateSlug = (name: string) => {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  };

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: product ? f.slug : generateSlug(name) }));
  };

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
      toast.success(`${newImages.length} image(s) uploaded`);
    } catch (err: any) {
      toast.error('Upload failed: ' + err.message);
    } finally {
      setImageUploading(false);
    }
  };

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const addVariation = () => {
    setForm(f => ({ ...f, variations: [...f.variations, { name: '', options: [''] }] }));
  };

  const removeVariation = (index: number) => {
    setForm(f => ({ ...f, variations: f.variations.filter((_, i) => i !== index) }));
  };

  const updateVariation = (index: number, field: string, value: any) => {
    setForm(f => ({
      ...f,
      variations: f.variations.map((v, i) => i === index ? { ...v, [field]: value } : v),
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug || !form.price) {
      toast.error('Name, slug and price are required');
      return;
    }

    setLoading(true);
    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      discount: form.discount ? parseInt(form.discount) : 0,
      stock: form.stock ? parseInt(form.stock) : 0,
      category_id: form.category_id || null,
      images: form.images,
      is_active: form.is_active,
      is_flash_sale: form.is_flash_sale,
      is_free_shipping: form.is_free_shipping,
      is_prime: form.is_prime,
      variations: form.variations.length > 0 ? form.variations : [],
    };

    let error;
    if (product) {
      ({ error } = await supabase.from('products').update(payload).eq('id', product.id));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }

    if (error) {
      toast.error('Failed to save product: ' + error.message);
    } else {
      toast.success(product ? 'Product updated!' : 'Product created!');
      onSaved();
      onOpenChange(false);
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          {/* Basic Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Product Name *</Label>
              <Input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Product name" />
            </div>
            <div>
              <Label>Slug *</Label>
              <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="product-slug" />
            </div>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Product description..." rows={3} />
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <Label>Price *</Label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <Label>Original Price</Label>
              <Input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} placeholder="0.00" />
            </div>
            <div>
              <Label>Discount %</Label>
              <Input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="0" />
            </div>
            <div>
              <Label>Stock</Label>
              <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
            </div>
          </div>

          {/* Category */}
          <div>
            <Label>Category</Label>
            <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(c => (
                  <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Images */}
          <div>
            <Label className="mb-2 block">Product Images</Label>
            <div className="flex flex-wrap gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative h-20 w-20 rounded-lg border border-border overflow-hidden group">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <label className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
                {imageUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                ) : (
                  <>
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-[10px] text-muted-foreground mt-1">Upload</span>
                  </>
                )}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={imageUploading} />
              </label>
            </div>
          </div>

          {/* Toggles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { key: 'is_active', label: 'Active' },
              { key: 'is_flash_sale', label: 'Flash Sale' },
              { key: 'is_free_shipping', label: 'Free Shipping' },
              { key: 'is_prime', label: 'Prime' },
            ].map(t => (
              <div key={t.key} className="flex items-center gap-2">
                <Switch
                  checked={(form as any)[t.key]}
                  onCheckedChange={v => setForm(f => ({ ...f, [t.key]: v }))}
                />
                <Label className="text-sm">{t.label}</Label>
              </div>
            ))}
          </div>

          {/* Variations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <Label>Variations</Label>
              <Button variant="outline" size="sm" onClick={addVariation} className="gap-1 h-7 text-xs">
                <Plus className="h-3 w-3" /> Add Variation
              </Button>
            </div>
            {form.variations.map((v, vi) => (
              <div key={vi} className="p-3 border border-border rounded-lg mb-2 space-y-2">
                <div className="flex items-center gap-2">
                  <Input
                    placeholder="e.g. Color, Size"
                    value={v.name}
                    onChange={e => updateVariation(vi, 'name', e.target.value)}
                    className="flex-1"
                  />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeVariation(vi)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {v.options.map((opt, oi) => (
                    <div key={oi} className="flex items-center gap-1">
                      <Input
                        className="h-7 w-24 text-xs"
                        placeholder="Option"
                        value={opt}
                        onChange={e => {
                          const newOpts = [...v.options];
                          newOpts[oi] = e.target.value;
                          updateVariation(vi, 'options', newOpts);
                        }}
                      />
                      {v.options.length > 1 && (
                        <button onClick={() => updateVariation(vi, 'options', v.options.filter((_, i) => i !== oi))} className="text-destructive">
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  ))}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs"
                    onClick={() => updateVariation(vi, 'options', [...v.options, ''])}
                  >
                    <Plus className="h-3 w-3 mr-1" /> Option
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={loading} className="gap-2">
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {product ? 'Update Product' : 'Create Product'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
