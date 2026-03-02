import { useState, useEffect, useRef } from 'react';
import { Loader2, Upload, X, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const productSchema = z.object({
  name: z.string().trim().min(2, 'Product name is required').max(200),
  description: z.string().trim().max(5000).optional(),
  price: z.number().positive('Price must be greater than 0'),
  original_price: z.number().positive().optional().nullable(),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  category_id: z.string().optional().nullable(),
  is_active: z.boolean(),
});

interface ProductFormData {
  id?: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  stock: number;
  category_id: string | null;
  is_active: boolean;
  images: string[];
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sellerId: string;
  product?: ProductFormData | null;
  onSuccess: () => void;
}

const emptyForm: ProductFormData = {
  name: '',
  description: '',
  price: 0,
  original_price: null,
  stock: 0,
  category_id: null,
  is_active: true,
  images: [],
};

export const ProductFormModal = ({ open, onOpenChange, sellerId, product, onSuccess }: Props) => {
  const [form, setForm] = useState<ProductFormData>(emptyForm);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isEditing = !!product?.id;

  useEffect(() => {
    if (product) {
      setForm(product);
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [product, open]);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('categories').select('id, name').order('name');
      if (data) setCategories(data);
    };
    fetchCategories();
  }, []);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') + '-' + Date.now().toString(36);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;

    setIsUploading(true);
    const newImages: string[] = [];

    for (const file of Array.from(files)) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error(`${file.name} is too large (max 5MB)`);
        continue;
      }

      const ext = file.name.split('.').pop();
      const path = `${sellerId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

      const { error } = await supabase.storage.from('product-images').upload(path, file);
      if (error) {
        toast.error(`Failed to upload ${file.name}`);
        continue;
      }

      const { data: urlData } = supabase.storage.from('product-images').getPublicUrl(path);
      newImages.push(urlData.publicUrl);
    }

    setForm(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
    setIsUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const result = productSchema.safeParse(form);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach(err => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setIsSaving(true);

    const payload = {
      name: form.name.trim(),
      slug: isEditing ? undefined : generateSlug(form.name),
      description: form.description || null,
      price: form.price,
      original_price: form.original_price || null,
      stock: form.stock,
      category_id: form.category_id || null,
      is_active: form.is_active,
      images: form.images,
      seller_id: sellerId,
    };

    let error;
    if (isEditing) {
      const { slug, seller_id, ...updatePayload } = payload;
      ({ error } = await supabase.from('products').update(updatePayload).eq('id', product!.id!));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }

    if (error) {
      toast.error(isEditing ? 'Failed to update product' : 'Failed to create product');
      console.error(error);
    } else {
      toast.success(isEditing ? 'Product updated!' : 'Product created!');
      onSuccess();
      onOpenChange(false);
    }

    setIsSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Product' : 'Add New Product'}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Images */}
          <div className="space-y-2">
            <Label>Product Images</Label>
            <div className="flex flex-wrap gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border group">
                  <img src={img} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-accent hover:text-accent transition-colors"
              >
                {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Plus className="h-5 w-5" /><span className="text-[10px]">Upload</span></>}
              </button>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} className="hidden" />
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="p-name">Product Name *</Label>
            <Input id="p-name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} maxLength={200} />
            {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="p-desc">Description</Label>
            <Textarea id="p-desc" value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={4} maxLength={5000} />
          </div>

          {/* Price & Original Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-price">Price *</Label>
              <Input id="p-price" type="number" step="0.01" min="0" value={form.price || ''} onChange={e => setForm(f => ({ ...f, price: parseFloat(e.target.value) || 0 }))} />
              {errors.price && <p className="text-sm text-destructive">{errors.price}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="p-orig-price">Original Price</Label>
              <Input id="p-orig-price" type="number" step="0.01" min="0" value={form.original_price ?? ''} onChange={e => setForm(f => ({ ...f, original_price: e.target.value ? parseFloat(e.target.value) : null }))} placeholder="Optional" />
            </div>
          </div>

          {/* Stock & Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="p-stock">Stock *</Label>
              <Input id="p-stock" type="number" min="0" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: parseInt(e.target.value) || 0 }))} />
              {errors.stock && <p className="text-sm text-destructive">{errors.stock}</p>}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={form.category_id || ''} onValueChange={v => setForm(f => ({ ...f, category_id: v || null }))}>
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
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
            <Label>Active (visible to customers)</Label>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Saving...</> : isEditing ? 'Update Product' : 'Create Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
