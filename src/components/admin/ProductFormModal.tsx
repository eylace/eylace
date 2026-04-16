import { useState, useEffect } from 'react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, X, Upload, Sparkles, Tag, Search, Package, FileText, DollarSign, Truck, Shield, Image as ImageIcon, Settings2, FolderOpen } from 'lucide-react';
import { MediaManagerModal } from './MediaManagerModal';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  onSaved: () => void;
}

const defaultForm = {
  name: '', slug: '', description: '', short_description: '',
  price: '', original_price: '', discount: '', stock: '', sku: '',
  category_id: '', brand_id: '', warranty_id: '', label_id: '',
  images: [] as string[],
  is_active: true, is_flash_sale: false, is_free_shipping: false, is_prime: false, is_digital: false,
  digital_file_url: '',
  variations: [] as { name: string; options: string[] }[],
  attributes: [] as { name: string; value: string }[],
  tags: [] as string[],
  meta_title: '', meta_description: '', meta_keywords: '',
  weight: '', length: '', width: '', height: '',
  flash_sale_ends: '',
  flash_sale_starts: '',
};

export const AdminProductFormModal = ({ open, onOpenChange, product, onSaved }: ProductFormModalProps) => {
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [imageUploading, setImageUploading] = useState(false);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('general');

  const [form, setForm] = useState({ ...defaultForm });

  useEffect(() => {
    if (product) {
      const attrs = Array.isArray(product.attributes)
        ? product.attributes.map((a: any) => ({ name: String(a.name || ''), value: String(a.value || '') }))
        : [];
      setForm({
        name: product.name || '', slug: product.slug || '',
        description: product.description || '', short_description: product.short_description || '',
        price: String(product.price || ''), original_price: String(product.original_price || ''),
        discount: String(product.discount || ''), stock: String(product.stock || ''),
        sku: product.sku || '',
        category_id: product.category_id || '', brand_id: product.brand_id || '',
        warranty_id: product.warranty_id || '', label_id: product.label_id || '',
        images: product.images || [],
        is_active: product.is_active ?? true, is_flash_sale: product.is_flash_sale ?? false,
        is_free_shipping: product.is_free_shipping ?? false, is_prime: product.is_prime ?? false,
        is_digital: product.is_digital ?? false,
        digital_file_url: product.digital_file_url || '',
        variations: product.variations || [], attributes: attrs,
        tags: product.tags || [],
        meta_title: product.meta_title || '', meta_description: product.meta_description || '',
        meta_keywords: product.meta_keywords || '',
        weight: String(product.weight || ''), length: String(product.length || ''),
        width: String(product.width || ''), height: String(product.height || ''),
        flash_sale_ends: product.flash_sale_ends ? product.flash_sale_ends.slice(0, 16) : '',
        flash_sale_starts: product.flash_sale_starts ? product.flash_sale_starts.slice(0, 16) : '',
      });
    } else {
      setForm({ ...defaultForm });
    }
    setActiveTab('general');
  }, [product, open]);

  useEffect(() => {
    if (!open) return;
    Promise.all([
      supabase.from('categories').select('id, name').order('name'),
      supabase.from('brands').select('id, name').eq('is_active', true).order('name'),
      supabase.from('warranties').select('id, name').eq('is_active', true).order('name'),
      supabase.from('product_labels').select('id, name, color').eq('is_active', true).order('name'),
    ]).then(([cats, brs, wars, lbls]) => {
      if (cats.data) setCategories(cats.data);
      if (brs.data) setBrands(brs.data);
      if (wars.data) setWarranties(wars.data);
      if (lbls.data) setLabels(lbls.data);
    });
  }, [open]);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

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

  const removeImage = (index: number) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));

  const addVariation = () => setForm(f => ({ ...f, variations: [...f.variations, { name: '', options: [''] }] }));
  const removeVariation = (index: number) => setForm(f => ({ ...f, variations: f.variations.filter((_, i) => i !== index) }));
  const updateVariation = (index: number, field: string, value: any) => {
    setForm(f => ({ ...f, variations: f.variations.map((v, i) => i === index ? { ...v, [field]: value } : v) }));
  };

  const addAttribute = () => setForm(f => ({ ...f, attributes: [...f.attributes, { name: '', value: '' }] }));
  const removeAttribute = (index: number) => setForm(f => ({ ...f, attributes: f.attributes.filter((_, i) => i !== index) }));

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !form.tags.includes(t)) {
      setForm(f => ({ ...f, tags: [...f.tags, t] }));
      setTagInput('');
    }
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug || !form.price) {
      toast.error('Name, slug and price are required');
      return;
    }
    setLoading(true);
    const payload: any = {
      name: form.name, slug: form.slug,
      description: form.description || null,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      discount: form.discount ? parseInt(form.discount) : 0,
      stock: form.stock ? parseInt(form.stock) : 0,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      warranty_id: form.warranty_id || null,
      label_id: form.label_id || null,
      images: form.images,
      is_active: form.is_active, is_flash_sale: form.is_flash_sale,
      is_free_shipping: form.is_free_shipping, is_prime: form.is_prime,
      is_digital: form.is_digital,
      digital_file_url: form.is_digital ? form.digital_file_url || null : null,
      variations: form.variations.length > 0 ? form.variations : [],
      attributes: form.attributes.filter(a => a.name.trim()) || [],
      flash_sale_ends: form.is_flash_sale && form.flash_sale_ends ? form.flash_sale_ends : null,
      flash_sale_starts: form.is_flash_sale && form.flash_sale_starts ? form.flash_sale_starts : null,
    };

    let error;
    if (product) {
      ({ error } = await supabase.from('products').update(payload).eq('id', product.id));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }

    if (error) {
      toast.error('Failed to save: ' + error.message);
    } else {
      toast.success(product ? 'Product updated!' : 'Product created!');
      onSaved();
      onOpenChange(false);
    }
    setLoading(false);
  };

  const tabClass = "text-xs data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 py-1.5 rounded-md";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            {product ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 sm:grid-cols-7 gap-1 h-auto p-1 bg-muted/50">
            <TabsTrigger value="general" className={tabClass}><FileText className="h-3 w-3 mr-1 hidden sm:inline" />General</TabsTrigger>
            <TabsTrigger value="media" className={tabClass}><ImageIcon className="h-3 w-3 mr-1 hidden sm:inline" />Media</TabsTrigger>
            <TabsTrigger value="pricing" className={tabClass}><DollarSign className="h-3 w-3 mr-1 hidden sm:inline" />Pricing</TabsTrigger>
            <TabsTrigger value="inventory" className={tabClass}><Package className="h-3 w-3 mr-1 hidden sm:inline" />Inventory</TabsTrigger>
            <TabsTrigger value="seo" className={tabClass}><Search className="h-3 w-3 mr-1 hidden sm:inline" />SEO</TabsTrigger>
            <TabsTrigger value="shipping" className={tabClass}><Truck className="h-3 w-3 mr-1 hidden sm:inline" />Shipping</TabsTrigger>
            <TabsTrigger value="advanced" className={tabClass}><Settings2 className="h-3 w-3 mr-1 hidden sm:inline" />Advanced</TabsTrigger>
          </TabsList>

          {/* === GENERAL === */}
          <TabsContent value="general" className="space-y-4 mt-4">
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

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Brand</Label>
                <Select value={form.brand_id} onValueChange={v => setForm(f => ({ ...f, brand_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select brand" /></SelectTrigger>
                  <SelectContent>{brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Label</Label>
                <Select value={form.label_id} onValueChange={v => setForm(f => ({ ...f, label_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select label" /></SelectTrigger>
                  <SelectContent>{labels.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <Label>Description</Label>
                <Button
                  type="button" variant="outline" size="sm"
                  className="gap-1 h-7 text-xs" disabled={aiGenerating || !form.name}
                  onClick={async () => {
                    setAiGenerating(true);
                    try {
                      const categoryName = categories.find(c => c.id === form.category_id)?.name;
                      const { data, error } = await supabase.functions.invoke('ai-generate-description', {
                        body: { productName: form.name, category: categoryName, price: form.price }
                      });
                      if (error) throw error;
                      if (data?.error) throw new Error(data.error);
                      setForm(f => ({ ...f, description: data.description }));
                      toast.success('AI Description generated!');
                    } catch (e: any) {
                      toast.error(e.message || 'AI generation failed');
                    }
                    setAiGenerating(false);
                  }}
                >
                  {aiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                  AI Generate
                </Button>
              </div>
              <RichTextEditor value={form.description} onChange={v => setForm(f => ({ ...f, description: v }))} placeholder="Full product description with formatting..." />
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add tag..." className="flex-1"
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}><Plus className="h-3 w-3" /></Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 text-xs">
                      <Tag className="h-3 w-3" />{tag}
                      <button onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, j) => j !== i) }))}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {[
                { key: 'is_active', label: 'Active' },
                { key: 'is_flash_sale', label: 'Flash Sale' },
                { key: 'is_free_shipping', label: 'Free Shipping' },
                { key: 'is_prime', label: 'Prime' },
                { key: 'is_digital', label: 'Digital Product' },
              ].map(t => (
                <div key={t.key} className="flex items-center gap-2 p-2 border border-border rounded-lg">
                  <Switch checked={(form as any)[t.key]} onCheckedChange={v => setForm(f => ({ ...f, [t.key]: v }))} />
                  <Label className="text-xs">{t.label}</Label>
                </div>
              ))}
            </div>

            {form.is_flash_sale && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Flash Sale Starts</Label>
                  <Input type="datetime-local" value={form.flash_sale_starts} onChange={e => setForm(f => ({ ...f, flash_sale_starts: e.target.value }))} />
                </div>
                <div>
                  <Label>Flash Sale Ends</Label>
                  <Input type="datetime-local" value={form.flash_sale_ends} onChange={e => setForm(f => ({ ...f, flash_sale_ends: e.target.value }))} />
                </div>
              </div>
            )}

            {form.is_digital && (
              <div>
                <Label>Digital File URL</Label>
                <Input value={form.digital_file_url} onChange={e => setForm(f => ({ ...f, digital_file_url: e.target.value }))} placeholder="https://..." />
              </div>
            )}
          </TabsContent>

          {/* === MEDIA === */}
          <TabsContent value="media" className="space-y-4 mt-4">
            <Label className="text-sm font-semibold">Product Images</Label>
            <div className="flex flex-wrap gap-3">
              {form.images.map((img, i) => (
                <div key={i} className="relative h-24 w-24 rounded-lg border border-border overflow-hidden group">
                  <img src={img} alt="" className="h-full w-full object-cover" />
                  <button onClick={() => removeImage(i)}
                    className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <X className="h-3 w-3" />
                  </button>
                  {i === 0 && <span className="absolute bottom-0 left-0 right-0 bg-primary/80 text-primary-foreground text-[9px] text-center py-0.5">Thumbnail</span>}
                </div>
              ))}
              <label className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
                {imageUploading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : (
                  <><Upload className="h-5 w-5 text-muted-foreground" /><span className="text-[10px] text-muted-foreground mt-1">Upload</span></>
                )}
                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} disabled={imageUploading} />
              </label>
            </div>
            <p className="text-xs text-muted-foreground">First image will be used as the product thumbnail. Drag to reorder (coming soon).</p>
          </TabsContent>

          {/* === PRICING === */}
          <TabsContent value="pricing" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label>Price *</Label>
                <Input type="number" value={form.price} onChange={e => {
                  const newPrice = e.target.value;
                  setForm(f => {
                    const op = parseFloat(f.original_price);
                    const p = parseFloat(newPrice);
                    const autoDiscount = op && p && op > p ? String(Math.round(((op - p) / op) * 100)) : '';
                    return { ...f, price: newPrice, discount: autoDiscount };
                  });
                }} placeholder="0.00" />
              </div>
              <div>
                <Label>Original Price</Label>
                <Input type="number" value={form.original_price} onChange={e => {
                  const newOp = e.target.value;
                  setForm(f => {
                    const op = parseFloat(newOp);
                    const p = parseFloat(f.price);
                    const autoDiscount = op && p && op > p ? String(Math.round(((op - p) / op) * 100)) : '';
                    return { ...f, original_price: newOp, discount: autoDiscount };
                  });
                }} placeholder="0.00" />
              </div>
              <div>
                <Label>Discount %</Label>
                <Input type="number" value={form.discount} readOnly className="bg-muted cursor-not-allowed" placeholder="Auto" />
                {form.discount && <p className="text-xs text-[hsl(var(--success))] mt-1">{form.discount}% off</p>}
              </div>
              <div>
                <Label>SKU</Label>
                <Input value={form.sku} onChange={e => setForm(f => ({ ...f, sku: e.target.value }))} placeholder="SKU-001" />
              </div>
            </div>
          </TabsContent>

          {/* === INVENTORY === */}
          <TabsContent value="inventory" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Stock Quantity</Label>
                <Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <Label>Warranty</Label>
                <Select value={form.warranty_id} onValueChange={v => setForm(f => ({ ...f, warranty_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select warranty" /></SelectTrigger>
                  <SelectContent>{warranties.map(w => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            {/* Variations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">Variations (Color, Size, etc.)</Label>
                <Button variant="outline" size="sm" onClick={addVariation} className="gap-1 h-7 text-xs"><Plus className="h-3 w-3" /> Add Variation</Button>
              </div>
              {form.variations.map((v, vi) => (
                <div key={vi} className="p-3 border border-border rounded-lg mb-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input placeholder="e.g. Color, Size" value={v.name} onChange={e => updateVariation(vi, 'name', e.target.value)} className="flex-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeVariation(vi)}><X className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {v.options.map((opt, oi) => (
                      <div key={oi} className="flex items-center gap-1">
                        <Input className="h-7 w-24 text-xs" placeholder="Option" value={opt}
                          onChange={e => { const newOpts = [...v.options]; newOpts[oi] = e.target.value; updateVariation(vi, 'options', newOpts); }}
                        />
                        {v.options.length > 1 && <button onClick={() => updateVariation(vi, 'options', v.options.filter((_, i) => i !== oi))} className="text-destructive"><X className="h-3 w-3" /></button>}
                      </div>
                    ))}
                    <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateVariation(vi, 'options', [...v.options, ''])}><Plus className="h-3 w-3 mr-1" /> Option</Button>
                  </div>
                </div>
              ))}
            </div>

            {/* Attributes */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">Product Attributes</Label>
                <Button variant="outline" size="sm" onClick={addAttribute} className="gap-1 h-7 text-xs"><Plus className="h-3 w-3" /> Add Attribute</Button>
              </div>
              {form.attributes.map((attr, ai) => (
                <div key={ai} className="flex items-center gap-2 mb-2">
                  <Input placeholder="e.g. Material" value={attr.name} onChange={e => {
                    const newAttrs = [...form.attributes]; newAttrs[ai] = { ...attr, name: e.target.value };
                    setForm(f => ({ ...f, attributes: newAttrs }));
                  }} className="flex-1" />
                  <Input placeholder="e.g. Cotton" value={attr.value} onChange={e => {
                    const newAttrs = [...form.attributes]; newAttrs[ai] = { ...attr, value: e.target.value };
                    setForm(f => ({ ...f, attributes: newAttrs }));
                  }} className="flex-1" />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAttribute(ai)}><X className="h-4 w-4" /></Button>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* === SEO === */}
          <TabsContent value="seo" className="space-y-4 mt-4">
            <div>
              <Label>Meta Title</Label>
              <Input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} placeholder="SEO title (max 60 chars)" maxLength={60} />
              <p className="text-xs text-muted-foreground mt-1">{form.meta_title.length}/60 characters</p>
            </div>
            <div>
              <Label>Meta Description</Label>
              <Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="SEO description (max 160 chars)" maxLength={160} rows={3} />
              <p className="text-xs text-muted-foreground mt-1">{form.meta_description.length}/160 characters</p>
            </div>
            <div>
              <Label>Meta Keywords</Label>
              <Input value={form.meta_keywords} onChange={e => setForm(f => ({ ...f, meta_keywords: e.target.value }))} placeholder="keyword1, keyword2, keyword3" />
            </div>
            <div className="p-3 bg-muted/50 rounded-lg border border-border">
              <p className="text-xs font-medium text-foreground mb-1">Preview</p>
              <p className="text-sm text-primary font-medium truncate">{form.meta_title || form.name || 'Product Title'}</p>
              <p className="text-xs text-[hsl(var(--success))]">yourstore.com/product/{form.slug || 'product-slug'}</p>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{form.meta_description || form.description?.replace(/<[^>]*>/g, '').slice(0, 160) || 'Product description will appear here...'}</p>
            </div>
          </TabsContent>

          {/* === SHIPPING === */}
          <TabsContent value="shipping" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <Label>Weight (kg)</Label>
                <Input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="0.0" step="0.01" />
              </div>
              <div>
                <Label>Length (cm)</Label>
                <Input type="number" value={form.length} onChange={e => setForm(f => ({ ...f, length: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <Label>Width (cm)</Label>
                <Input type="number" value={form.width} onChange={e => setForm(f => ({ ...f, width: e.target.value }))} placeholder="0" />
              </div>
              <div>
                <Label>Height (cm)</Label>
                <Input type="number" value={form.height} onChange={e => setForm(f => ({ ...f, height: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="flex items-center gap-2 p-3 border border-border rounded-lg">
              <Switch checked={form.is_free_shipping} onCheckedChange={v => setForm(f => ({ ...f, is_free_shipping: v }))} />
              <div>
                <Label className="text-sm">Free Shipping</Label>
                <p className="text-xs text-muted-foreground">This product ships for free</p>
              </div>
            </div>
          </TabsContent>

          {/* === ADVANCED === */}
          <TabsContent value="advanced" className="space-y-4 mt-4">
            <div className="p-4 border border-border rounded-lg space-y-3">
              <h4 className="text-sm font-semibold flex items-center gap-2"><Shield className="h-4 w-4" /> Product Visibility & Controls</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { key: 'is_active', label: 'Active', desc: 'Product visible on storefront' },
                  { key: 'is_prime', label: 'Prime', desc: 'Mark as premium/prime product' },
                  { key: 'is_flash_sale', label: 'Flash Sale', desc: 'Include in flash sale section' },
                  { key: 'is_digital', label: 'Digital Product', desc: 'This is a downloadable product' },
                ].map(t => (
                  <div key={t.key} className="flex items-center gap-3 p-3 border border-border rounded-lg">
                    <Switch checked={(form as any)[t.key]} onCheckedChange={v => setForm(f => ({ ...f, [t.key]: v }))} />
                    <div>
                      <Label className="text-sm">{t.label}</Label>
                      <p className="text-xs text-muted-foreground">{t.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
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
