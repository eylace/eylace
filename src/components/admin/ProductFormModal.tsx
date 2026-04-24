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
import { Loader2, Plus, X, Sparkles, Tag, Search, Package, FileText, DollarSign, Truck, Shield, Image as ImageIcon, Settings2, FolderOpen } from 'lucide-react';
import { MediaManagerModal } from './MediaManagerModal';

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  product?: any;
  onSaved: () => void;
}

const defaultForm = {
  name: '', slug: '', description: '', short_description: '',
  price: '', original_price: '', cost_per_item: '', discount: '', stock: '', sku: '',
  category_id: '', brand_id: '', warranty_id: '', label_id: '', size_guide_id: '',
  images: [] as string[],
  is_active: true, is_flash_sale: false, is_free_shipping: false, is_prime: false, is_digital: false,
  digital_file_url: '',
  variations: [] as { name: string; options: string[] }[],
  attributes: [] as { name: string; value: string }[],
  tags: [] as string[],
  meta_title: '', meta_description: '', meta_keywords: '',
  meta_image: '', canonical_url: '',
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
  const [predefinedAttributes, setPredefinedAttributes] = useState<{ id: string; name: string; values: string[] }[]>([]);
  const [predefinedColors, setPredefinedColors] = useState<{ id: string; name: string; hex_code: string }[]>([]);
  const [sizeGuides, setSizeGuides] = useState<{ id: string; name: string }[]>([]);
  const [aiGenerating, setAiGenerating] = useState(false);
  const [tagInput, setTagInput] = useState('');
  const [activeTab, setActiveTab] = useState('general');
  const [mediaManagerOpen, setMediaManagerOpen] = useState(false);
  const [mediaTarget, setMediaTarget] = useState<'images' | 'meta_image'>('images');

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
        cost_per_item: String(product.cost_per_item || ''),
        discount: String(product.discount || ''), stock: String(product.stock || ''),
        sku: product.sku || '',
        category_id: product.category_id || '', brand_id: product.brand_id || '',
        warranty_id: product.warranty_id || '', label_id: product.label_id || '',
        size_guide_id: product.size_guide_id || '',
        images: product.images || [],
        is_active: product.is_active ?? true, is_flash_sale: product.is_flash_sale ?? false,
        is_free_shipping: product.is_free_shipping ?? false, is_prime: product.is_prime ?? false,
        is_digital: product.is_digital ?? false,
        digital_file_url: product.digital_file_url || '',
        variations: product.variations || [], attributes: attrs,
        tags: product.tags || [],
        meta_title: product.meta_title || '', meta_description: product.meta_description || '',
        meta_keywords: product.meta_keywords || '',
        meta_image: product.meta_image || '',
        canonical_url: product.canonical_url || '',
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
      supabase.from('product_attributes').select('id, name, values').eq('is_active', true).order('name'),
      supabase.from('colors').select('id, name, hex_code').eq('is_active', true).order('name'),
      supabase.from('size_guides').select('id, name').eq('is_active', true).order('name'),
    ]).then(([cats, brs, wars, lbls, attrs, cols, sgs]) => {
      if (cats.data) setCategories(cats.data);
      if (brs.data) setBrands(brs.data);
      if (wars.data) setWarranties(wars.data);
      if (lbls.data) setLabels(lbls.data);
      if (attrs.data) setPredefinedAttributes(attrs.data as any);
      if (cols.data) setPredefinedColors(cols.data as any);
      if (sgs.data) setSizeGuides(sgs.data as any);
    });
  }, [open]);

  const generateSlug = (name: string) =>
    name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: product ? f.slug : generateSlug(name) }));
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
      cost_per_item: form.cost_per_item ? parseFloat(form.cost_per_item) : 0,
      discount: form.discount ? parseInt(form.discount) : 0,
      stock: form.stock ? parseInt(form.stock) : 0,
      category_id: form.category_id || null,
      brand_id: form.brand_id || null,
      warranty_id: form.warranty_id || null,
      label_id: form.label_id || null,
      size_guide_id: form.size_guide_id || null,
      images: form.images,
      is_active: form.is_active, is_flash_sale: form.is_flash_sale,
      is_free_shipping: form.is_free_shipping, is_prime: form.is_prime,
      is_digital: form.is_digital,
      digital_file_url: form.is_digital ? form.digital_file_url || null : null,
      variations: form.variations.length > 0 ? form.variations : [],
      attributes: form.attributes.filter(a => a.name.trim()) || [],
      flash_sale_ends: form.is_flash_sale && form.flash_sale_ends ? form.flash_sale_ends : null,
      flash_sale_starts: form.is_flash_sale && form.flash_sale_starts ? form.flash_sale_starts : null,
      short_description: form.short_description?.trim() || null,
      tags: form.tags.length > 0 ? form.tags : [],
      meta_title: form.meta_title?.trim() || null,
      meta_description: form.meta_description?.trim() || null,
      meta_keywords: form.meta_keywords?.trim() || null,
      meta_image: form.meta_image?.trim() || null,
      canonical_url: form.canonical_url?.trim() || null,
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
    <>
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
              <div
                onClick={() => { setMediaTarget('images'); setMediaManagerOpen(true); }}
                className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors"
              >
                <FolderOpen className="h-5 w-5 text-muted-foreground" />
                <span className="text-[10px] text-muted-foreground mt-1">Browse</span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">First image will be used as the product thumbnail. Click "Browse" to open Media Manager — pick from library or upload new files.</p>
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
                <Label>Cost Per Item</Label>
                <Input type="number" value={form.cost_per_item} onChange={e => setForm(f => ({ ...f, cost_per_item: e.target.value }))} placeholder="0.00" />
                <p className="text-[10px] text-muted-foreground mt-1">Base cost for profit calculation</p>
              </div>
              <div>
                <Label>Discount %</Label>
                <Input type="number" value={form.discount} readOnly className="bg-muted cursor-not-allowed" placeholder="Auto" />
                {form.discount && <p className="text-xs text-[hsl(var(--success))] mt-1">{form.discount}% off</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
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

            <div>
              <Label>Size Guide</Label>
              <Select value={form.size_guide_id} onValueChange={v => setForm(f => ({ ...f, size_guide_id: v }))}>
                <SelectTrigger><SelectValue placeholder={sizeGuides.length ? "Attach a pre-created size guide" : "No size guides — create one in Size Guides page"} /></SelectTrigger>
                <SelectContent>{sizeGuides.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}</SelectContent>
              </Select>
              <p className="text-[10px] text-muted-foreground mt-1">Customers see this on the product page. Manage guides under Admin → Size Guides.</p>
            </div>

            {/* Variations */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="font-semibold">Variations (Color, Size, etc.)</Label>
                <div className="flex items-center gap-2">
                  <Select value="" onValueChange={(name) => {
                    if (form.variations.some(v => v.name.toLowerCase() === name.toLowerCase())) {
                      toast.info(`${name} variation already added`); return;
                    }
                    setForm(f => ({ ...f, variations: [...f.variations, { name, options: [''] }] }));
                  }}>
                    <SelectTrigger className="h-7 w-36 text-xs"><SelectValue placeholder="Quick add..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Color">Color</SelectItem>
                      <SelectItem value="Size">Size</SelectItem>
                      <SelectItem value="Material">Material</SelectItem>
                      <SelectItem value="Style">Style</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={addVariation} className="gap-1 h-7 text-xs"><Plus className="h-3 w-3" /> Custom</Button>
                </div>
              </div>
              {form.variations.map((v, vi) => (
                <div key={vi} className="p-3 border border-border rounded-lg mb-2 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input placeholder="e.g. Color, Size" value={v.name} onChange={e => updateVariation(vi, 'name', e.target.value)} className="flex-1" />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeVariation(vi)}><X className="h-4 w-4" /></Button>
                  </div>
                  {v.name.toLowerCase() === 'color' && predefinedColors.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pb-1 border-b border-border/50">
                      <span className="text-[10px] text-muted-foreground self-center mr-1">Quick add:</span>
                      {predefinedColors.map(c => {
                        const already = v.options.includes(c.name);
                        return (
                          <button key={c.id} type="button" disabled={already}
                            onClick={() => {
                              const cleaned = v.options.filter(o => o.trim());
                              updateVariation(vi, 'options', [...cleaned, c.name]);
                            }}
                            className={`flex items-center gap-1 px-2 py-0.5 rounded-full border text-[10px] transition ${already ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent hover:text-accent-foreground'}`}>
                            <span className="h-2.5 w-2.5 rounded-full border border-border" style={{ backgroundColor: c.hex_code }} />
                            {c.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  {v.name.toLowerCase() === 'size' && (
                    <div className="flex flex-wrap gap-1.5 pb-1 border-b border-border/50">
                      <span className="text-[10px] text-muted-foreground self-center mr-1">Quick add:</span>
                      {['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'].map(s => {
                        const already = v.options.includes(s);
                        return (
                          <button key={s} type="button" disabled={already}
                            onClick={() => {
                              const cleaned = v.options.filter(o => o.trim());
                              updateVariation(vi, 'options', [...cleaned, s]);
                            }}
                            className={`px-2 py-0.5 rounded-full border text-[10px] transition ${already ? 'opacity-40 cursor-not-allowed' : 'hover:bg-accent hover:text-accent-foreground'}`}>{s}</button>
                        );
                      })}
                    </div>
                  )}
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
                <div className="flex items-center gap-2">
                  {predefinedAttributes.length > 0 && (
                    <Select value="" onValueChange={(attrId) => {
                      const attr = predefinedAttributes.find(a => a.id === attrId);
                      if (!attr) return;
                      if (form.attributes.some(a => a.name.toLowerCase() === attr.name.toLowerCase())) {
                        toast.info(`${attr.name} attribute already added`); return;
                      }
                      setForm(f => ({ ...f, attributes: [...f.attributes, { name: attr.name, value: '' }] }));
                    }}>
                      <SelectTrigger className="h-7 w-44 text-xs"><SelectValue placeholder="Pick from library..." /></SelectTrigger>
                      <SelectContent>
                        {predefinedAttributes.map(a => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                  <Button variant="outline" size="sm" onClick={addAttribute} className="gap-1 h-7 text-xs"><Plus className="h-3 w-3" /> Custom</Button>
                </div>
              </div>
              {predefinedAttributes.length === 0 && (
                <p className="text-[10px] text-muted-foreground mb-2">Tip: Pre-create attributes (Material, Fabric, etc.) under Admin → Attributes for faster reuse.</p>
              )}
              {form.attributes.map((attr, ai) => {
                const matched = predefinedAttributes.find(p => p.name.toLowerCase() === attr.name.toLowerCase());
                return (
                <div key={ai} className="flex items-center gap-2 mb-2">
                  <Input placeholder="e.g. Material" value={attr.name} onChange={e => {
                    const newAttrs = [...form.attributes]; newAttrs[ai] = { ...attr, name: e.target.value };
                    setForm(f => ({ ...f, attributes: newAttrs }));
                  }} className="flex-1" />
                  {matched && matched.values?.length > 0 ? (
                    <Select value={attr.value} onValueChange={v => {
                      const newAttrs = [...form.attributes]; newAttrs[ai] = { ...attr, value: v };
                      setForm(f => ({ ...f, attributes: newAttrs }));
                    }}>
                      <SelectTrigger className="flex-1"><SelectValue placeholder={`Pick ${matched.name}`} /></SelectTrigger>
                      <SelectContent>
                        {matched.values.map((val, i) => <SelectItem key={i} value={val}>{val}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input placeholder="e.g. Cotton" value={attr.value} onChange={e => {
                      const newAttrs = [...form.attributes]; newAttrs[ai] = { ...attr, value: e.target.value };
                      setForm(f => ({ ...f, attributes: newAttrs }));
                    }} className="flex-1" />
                  )}
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeAttribute(ai)}><X className="h-4 w-4" /></Button>
                </div>
                );
              })}
            </div>
          </TabsContent>

          {/* === SEO === */}
          <TabsContent value="seo" className="space-y-5 mt-4">
            <div className="rounded-lg border border-dashed border-border bg-muted/20 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1 flex items-center gap-1.5"><Search className="h-3.5 w-3.5" /> Search Engine Optimization</p>
              Optimize how this product appears on Google, Bing, Facebook and Twitter. Leave blank to auto-fill from product details.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Meta Title</Label>
                <Input
                  value={form.meta_title}
                  onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                  placeholder="SEO title (50-60 chars recommended)"
                  maxLength={70}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{form.meta_title.length}/60 chars</p>
                  <span className={`text-xs font-medium ${form.meta_title.length > 60 ? 'text-destructive' : form.meta_title.length >= 30 ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`}>
                    {form.meta_title.length > 60 ? 'Too long' : form.meta_title.length >= 30 ? 'Good' : 'Add more'}
                  </span>
                </div>
              </div>

              <div>
                <Label>Canonical URL <span className="text-muted-foreground font-normal text-xs">(optional)</span></Label>
                <Input
                  value={form.canonical_url}
                  onChange={e => setForm(f => ({ ...f, canonical_url: e.target.value }))}
                  placeholder="https://yourstore.com/product/..."
                />
                <p className="text-xs text-muted-foreground mt-1">Use to point duplicates to the original URL</p>
              </div>
            </div>

            <div>
              <Label>Meta Description</Label>
              <Textarea
                value={form.meta_description}
                onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                placeholder="A concise summary that appears in search results (140-160 chars)"
                maxLength={200}
                rows={3}
              />
              <div className="flex items-center justify-between mt-1">
                <p className="text-xs text-muted-foreground">{form.meta_description.length}/160 chars</p>
                <span className={`text-xs font-medium ${form.meta_description.length > 160 ? 'text-destructive' : form.meta_description.length >= 120 ? 'text-[hsl(var(--success))]' : 'text-muted-foreground'}`}>
                  {form.meta_description.length > 160 ? 'Too long' : form.meta_description.length >= 120 ? 'Good' : 'Add more'}
                </span>
              </div>
            </div>

            <div>
              <Label>Focus Keywords</Label>
              <Input
                value={form.meta_keywords}
                onChange={e => setForm(f => ({ ...f, meta_keywords: e.target.value }))}
                placeholder="primary keyword, secondary keyword, brand name"
              />
              <p className="text-xs text-muted-foreground mt-1">Comma-separated. Helps with internal search & some engines.</p>
            </div>

            {/* SEO Tags */}
            <div>
              <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> SEO Tags</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={tagInput}
                  onChange={e => setTagInput(e.target.value)}
                  placeholder="Type a tag and press Enter..."
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                />
                <Button type="button" variant="outline" size="sm" onClick={addTag}>
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add
                </Button>
              </div>
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.tags.map((tag, i) => (
                    <Badge key={i} variant="secondary" className="gap-1 text-xs pl-2 pr-1 py-1">
                      <Tag className="h-3 w-3" />{tag}
                      <button
                        type="button"
                        onClick={() => setForm(f => ({ ...f, tags: f.tags.filter((_, idx) => idx !== i) }))}
                        className="ml-0.5 hover:bg-destructive/20 rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1.5">Used for search filters, related products, and structured data.</p>
            </div>

            {/* Meta Image / Social Share Image */}
            <div>
              <Label className="flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Social Share Image (Open Graph)</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={form.meta_image}
                  onChange={e => setForm(f => ({ ...f, meta_image: e.target.value }))}
                  placeholder="https://... (1200×630 recommended)"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => { setMediaTarget('meta_image'); setMediaManagerOpen(true); }}>
                  <FolderOpen className="h-3.5 w-3.5 mr-1" /> Browse
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Image shown when shared on Facebook, Twitter, WhatsApp. Falls back to first product image.</p>
              {(form.meta_image || form.images[0]) && (
                <div className="mt-2 inline-block rounded-md border border-border overflow-hidden bg-muted/30">
                  <img
                    src={form.meta_image || form.images[0]}
                    alt="Social share preview"
                    className="h-24 w-44 object-cover"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
              )}
            </div>

            {/* Google SERP Preview */}
            <div className="rounded-lg border border-border bg-card p-4 space-y-1">
              <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                <Search className="h-3 w-3" /> Google Search Preview
              </p>
              <p className="text-xs text-[hsl(var(--success))] truncate">
                yourstore.com › product › {form.slug || 'product-slug'}
              </p>
              <p className="text-base text-[#1a0dab] dark:text-[#8ab4f8] font-medium leading-snug line-clamp-1 hover:underline cursor-pointer">
                {form.meta_title || form.name || 'Product Title'}
              </p>
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {form.meta_description || form.short_description || form.description?.replace(/<[^>]*>/g, '').slice(0, 160) || 'Product description will appear here...'}
              </p>
            </div>

            {/* Social Card Preview */}
            {(form.meta_image || form.images[0]) && (
              <div className="rounded-lg border border-border overflow-hidden bg-card max-w-md">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground px-4 pt-3 flex items-center gap-1.5">
                  <ImageIcon className="h-3 w-3" /> Social Share Preview
                </p>
                <img
                  src={form.meta_image || form.images[0]}
                  alt=""
                  className="w-full h-44 object-cover mt-2 border-y border-border"
                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                />
                <div className="p-3 bg-muted/30">
                  <p className="text-[11px] uppercase text-muted-foreground tracking-wide">yourstore.com</p>
                  <p className="text-sm font-semibold text-foreground line-clamp-1">{form.meta_title || form.name || 'Product Title'}</p>
                  <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{form.meta_description || form.short_description || 'Description...'}</p>
                </div>
              </div>
            )}
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
    <MediaManagerModal
      open={mediaManagerOpen}
      onOpenChange={setMediaManagerOpen}
      multiple={mediaTarget === 'images'}
      acceptedKinds={['image']}
      uploadFolder="products"
      onSelect={(urls) => {
        if (mediaTarget === 'meta_image') {
          setForm(f => ({ ...f, meta_image: urls[0] || '' }));
        } else {
          setForm(f => ({ ...f, images: Array.from(new Set([...f.images, ...urls])) }));
        }
      }}
    />
    </>
  );
};
