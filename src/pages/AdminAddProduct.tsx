import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, X, Upload, Save, ArrowLeft, Package, Image as ImageIcon, DollarSign, Search, Truck, Shield, ShoppingCart, Video, FileText, Sparkles, AlertTriangle, FolderOpen, Tag } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { MediaManagerModal } from '@/components/admin/MediaManagerModal';

interface ProductFormState {
  name: string;
  slug: string;
  description: string;
  price: string;
  original_price: string;
  cost_per_item: string;
  discount: string;
  discount_type: string;
  stock: string;
  category_id: string;
  brand_id: string;
  warranty_id: string;
  label_id: string;
  images: string[];
  thumbnail: string;
  videos: string[];
  video_thumbnails: string[];
  youtube_link: string;
  pdf_url: string;
  is_active: boolean;
  is_flash_sale: boolean;
  is_free_shipping: boolean;
  is_prime: boolean;
  is_digital: boolean;
  variations: { name: string; options: string[] }[];
  unit: string;
  weight: string;
  min_qty: string;
  barcode: string;
  meta_title: string;
  meta_description: string;
  meta_keywords: string;
  meta_image: string;
  canonical_url: string;
  short_description: string;
  shipping_type: string;
  shipping_cost: string;
  is_product_quantity_multiply: boolean;
  estimated_shipping_days: string;
  is_refundable: boolean;
  is_featured: boolean;
  is_todays_deal: boolean;
  flash_deal_title: string;
  hsn_code: string;
  gst_rate: string;
  frequently_bought_ids: string[];
  note: string;
}

const defaultForm: ProductFormState = {
  name: '', slug: '', description: '', price: '', original_price: '', cost_per_item: '', discount: '', discount_type: 'flat',
  stock: '', category_id: '', brand_id: '', warranty_id: '', label_id: '',
  images: [], thumbnail: '', videos: [], video_thumbnails: [], youtube_link: '', pdf_url: '',
  is_active: true, is_flash_sale: false, is_free_shipping: false, is_prime: false, is_digital: false,
  variations: [], unit: '', weight: '', min_qty: '1', barcode: '',
  meta_title: '', meta_description: '', meta_keywords: '',
  shipping_type: 'free', shipping_cost: '', is_product_quantity_multiply: false, estimated_shipping_days: '',
  is_refundable: true, is_featured: false, is_todays_deal: false, flash_deal_title: '',
  hsn_code: '', gst_rate: '', frequently_bought_ids: [], note: '',
};

type MediaTarget = 'gallery' | 'thumbnail' | 'videos' | 'video_thumbnails' | 'pdf';

const MEDIA_TARGET_CONFIG: Record<MediaTarget, { acceptedKinds: ('image' | 'video' | 'document')[]; multiple: boolean; uploadFolder: string }> = {
  gallery: { acceptedKinds: ['image'], multiple: true, uploadFolder: 'gallery' },
  thumbnail: { acceptedKinds: ['image'], multiple: false, uploadFolder: 'thumbnails' },
  videos: { acceptedKinds: ['video'], multiple: true, uploadFolder: 'videos' },
  video_thumbnails: { acceptedKinds: ['image'], multiple: true, uploadFolder: 'video-thumbs' },
  pdf: { acceptedKinds: ['document'], multiple: false, uploadFolder: 'pdfs' },
};

const mergeUnique = (existing: string[], incoming: string[]) => Array.from(new Set([...existing, ...incoming]));

const AdminAddProduct = () => {
  const navigate = useNavigate();
  const { id: editId } = useParams<{ id: string }>();
  const isEdit = !!editId;

  const [loading, setLoading] = useState(false);
  const [loadingProduct, setLoadingProduct] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [warranties, setWarranties] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);
  const [allProducts, setAllProducts] = useState<any[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [mediaTarget, setMediaTarget] = useState<MediaTarget | null>(null);
  const flashDeals = ['Flash Sale', 'Flash Deal', 'Electronic', 'Winter Sale', 'End of Season'];

  const [form, setForm] = useState<ProductFormState>({ ...defaultForm });

  useEffect(() => {
    Promise.all([
      supabase.from('categories').select('id, name, parent_id').order('name'),
      supabase.from('brands').select('id, name').eq('is_active', true).order('name'),
      supabase.from('warranties').select('id, name, duration').eq('is_active', true).order('name'),
      supabase.from('product_labels').select('id, name, color').eq('is_active', true).order('name'),
      supabase.from('products').select('id, name, images').eq('is_active', true).order('name').limit(100),
    ]).then(([catRes, brandRes, warrantyRes, labelRes, prodRes]) => {
      if (catRes.data) setCategories(catRes.data);
      if (brandRes.data) setBrands(brandRes.data);
      if (warrantyRes.data) setWarranties(warrantyRes.data);
      if (labelRes.data) setLabels(labelRes.data);
      if (prodRes.data) setAllProducts(prodRes.data);
    });
  }, []);

  // Load product for editing
  useEffect(() => {
    if (!editId) return;
    setLoadingProduct(true);
    supabase.from('products').select('*').eq('id', editId).single().then(({ data, error }) => {
      if (error || !data) { toast.error('Product not found'); navigate('/admin/products'); return; }
      const attrs = (data.attributes as any) || {};
      setForm({
        name: data.name || '',
        slug: data.slug || '',
        description: data.description || '',
        price: String(data.price || ''),
        original_price: String(data.original_price || ''),
        cost_per_item: String((data as any).cost_per_item ?? ''),
        discount: String(data.discount || ''),
        discount_type: attrs.discount_type || 'flat',
        stock: String(data.stock || ''),
        category_id: data.category_id || '',
        brand_id: data.brand_id || '',
        warranty_id: data.warranty_id || '',
        label_id: data.label_id || '',
        images: data.images || [],
        thumbnail: attrs.thumbnail || '',
        videos: attrs.videos || [],
        video_thumbnails: attrs.video_thumbnails || [],
        youtube_link: attrs.youtube_link || '',
        pdf_url: attrs.pdf_url || '',
        is_active: data.is_active ?? true,
        is_flash_sale: data.is_flash_sale ?? false,
        is_free_shipping: data.is_free_shipping ?? false,
        is_prime: data.is_prime ?? false,
        is_digital: data.is_digital ?? false,
        variations: (data.variations as any) || [],
        unit: attrs.unit || '',
        weight: attrs.weight || '',
        min_qty: attrs.min_qty || '1',
        barcode: attrs.barcode || '',
        meta_title: attrs.meta_title || '',
        meta_description: attrs.meta_description || '',
        meta_keywords: attrs.meta_keywords || '',
        shipping_type: attrs.shipping_type || 'free',
        shipping_cost: attrs.shipping_cost || '',
        is_product_quantity_multiply: attrs.is_product_quantity_multiply || false,
        estimated_shipping_days: attrs.estimated_shipping_days || '',
        is_refundable: attrs.is_refundable ?? true,
        is_featured: attrs.is_featured || false,
        is_todays_deal: attrs.is_todays_deal || false,
        flash_deal_title: attrs.flash_deal_title || '',
        hsn_code: attrs.hsn_code || '',
        gst_rate: attrs.gst_rate || '',
        frequently_bought_ids: attrs.frequently_bought_ids || [],
        note: attrs.note || '',
      });
      setTags(attrs.tags || []);
      setLoadingProduct(false);
    });
  }, [editId, navigate]);

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  const handleNameChange = (name: string) => {
    setForm(f => ({ ...f, name, slug: isEdit ? f.slug : generateSlug(name) }));
  };

  const removeImage = (index: number) => setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  const removeVideo = (index: number) => setForm(f => ({ ...f, videos: f.videos.filter((_, i) => i !== index) }));
  const removeVideoThumb = (index: number) => setForm(f => ({ ...f, video_thumbnails: f.video_thumbnails.filter((_, i) => i !== index) }));

  const handleMediaSelect = (urls: string[]) => {
    if (!mediaTarget || !urls.length) return;

    if (mediaTarget === 'gallery') {
      setForm((currentForm) => ({ ...currentForm, images: mergeUnique(currentForm.images, urls) }));
      return;
    }

    if (mediaTarget === 'thumbnail') {
      setForm((currentForm) => ({ ...currentForm, thumbnail: urls[0] }));
      return;
    }

    if (mediaTarget === 'videos') {
      setForm((currentForm) => ({ ...currentForm, videos: mergeUnique(currentForm.videos, urls) }));
      return;
    }

    if (mediaTarget === 'video_thumbnails') {
      setForm((currentForm) => ({ ...currentForm, video_thumbnails: mergeUnique(currentForm.video_thumbnails, urls) }));
      return;
    }

    setForm((currentForm) => ({ ...currentForm, pdf_url: urls[0] }));
  };

  const addTag = () => { const t = tagInput.trim(); if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); setTagInput(''); } };
  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  const addVariation = () => setForm(f => ({ ...f, variations: [...f.variations, { name: '', options: [''] }] }));
  const removeVariation = (index: number) => setForm(f => ({ ...f, variations: f.variations.filter((_, i) => i !== index) }));
  const updateVariation = (index: number, field: string, value: any) => {
    setForm(f => ({ ...f, variations: f.variations.map((v, i) => i === index ? { ...v, [field]: value } : v) }));
  };

  const toggleFrequentlyBought = (productId: string) => {
    setForm(f => ({
      ...f,
      frequently_bought_ids: f.frequently_bought_ids.includes(productId)
        ? f.frequently_bought_ids.filter(id => id !== productId)
        : [...f.frequently_bought_ids, productId],
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug || !form.price) { toast.error('Name, slug and price are required'); return; }
    setLoading(true);
    const payload = {
      name: form.name, slug: form.slug, description: form.description || null,
      price: parseFloat(form.price),
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      cost_per_item: form.cost_per_item ? parseFloat(form.cost_per_item) : 0,
      discount: form.discount ? parseInt(form.discount) : 0,
      stock: form.stock ? parseInt(form.stock) : 0,
      category_id: form.category_id || null, brand_id: form.brand_id || null,
      warranty_id: form.warranty_id || null, label_id: form.label_id || null,
      images: form.images, is_active: form.is_active, is_flash_sale: form.is_flash_sale,
      is_free_shipping: form.shipping_type === 'free' || form.is_free_shipping,
      is_prime: form.is_prime, is_digital: form.is_digital,
      variations: form.variations.length > 0 ? form.variations : [],
      attributes: {
        unit: form.unit, weight: form.weight, min_qty: form.min_qty, barcode: form.barcode, tags,
        thumbnail: form.thumbnail, videos: form.videos, video_thumbnails: form.video_thumbnails,
        youtube_link: form.youtube_link, pdf_url: form.pdf_url,
        meta_title: form.meta_title, meta_description: form.meta_description, meta_keywords: form.meta_keywords,
        shipping_type: form.shipping_type, shipping_cost: form.shipping_cost,
        is_product_quantity_multiply: form.is_product_quantity_multiply,
        estimated_shipping_days: form.estimated_shipping_days, is_refundable: form.is_refundable,
        is_featured: form.is_featured, is_todays_deal: form.is_todays_deal, flash_deal_title: form.flash_deal_title,
        hsn_code: form.hsn_code, gst_rate: form.gst_rate, frequently_bought_ids: form.frequently_bought_ids,
        note: form.note, discount_type: form.discount_type,
      },
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from('products').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }
    if (error) { toast.error('Failed to save: ' + error.message); }
    else { toast.success(isEdit ? 'Product updated!' : 'Product created!'); navigate('/admin/products'); }
    setLoading(false);
  };

  const parentCategories = categories.filter(c => !c.parent_id);
  const getChildren = (parentId: string) => categories.filter(c => c.parent_id === parentId);

  if (loadingProduct) {
    return (
      <AdminLayout title="Loading..." description="">
        <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title={isEdit ? 'Edit Product' : 'Add New Product'} description={isEdit ? 'Update product details' : 'Create a new physical product'}>
      <div className="mb-4 flex items-center gap-3">
        <Button variant="outline" size="sm" onClick={() => navigate('/admin/products')} className="gap-1">
          <ArrowLeft className="h-4 w-4" /> Back
        </Button>
        <h2 className="text-lg font-semibold">{isEdit ? 'Edit Product' : 'Add New Product'}</h2>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="w-full flex flex-wrap h-auto gap-1 bg-muted/50 p-1 rounded-lg">
          <TabsTrigger value="general" className="gap-1.5 text-xs sm:text-sm"><Package className="h-3.5 w-3.5" /> General</TabsTrigger>
          <TabsTrigger value="media" className="gap-1.5 text-xs sm:text-sm"><ImageIcon className="h-3.5 w-3.5" /> Files & Media</TabsTrigger>
          <TabsTrigger value="price" className="gap-1.5 text-xs sm:text-sm"><DollarSign className="h-3.5 w-3.5" /> Price & Stock</TabsTrigger>
          <TabsTrigger value="seo" className="gap-1.5 text-xs sm:text-sm"><Search className="h-3.5 w-3.5" /> SEO</TabsTrigger>
          <TabsTrigger value="shipping" className="gap-1.5 text-xs sm:text-sm"><Truck className="h-3.5 w-3.5" /> Shipping</TabsTrigger>
          <TabsTrigger value="warranty" className="gap-1.5 text-xs sm:text-sm"><Shield className="h-3.5 w-3.5" /> Warranty</TabsTrigger>
          <TabsTrigger value="frequently" className="gap-1.5 text-xs sm:text-sm"><ShoppingCart className="h-3.5 w-3.5" /> Frequently Bought</TabsTrigger>
        </TabsList>

        {/* ======== GENERAL TAB ======== */}
        <TabsContent value="general" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Product Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Product Name *</Label>
                  <Input value={form.name} onChange={e => handleNameChange(e.target.value)} placeholder="Product name" />
                </div>
                <div>
                  <Label>Brand</Label>
                  <Select value={form.brand_id} onValueChange={v => setForm(f => ({ ...f, brand_id: v === '__none__' ? '' : v }))}>
                    <SelectTrigger><SelectValue placeholder="Select Brand" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">[No Brand]</SelectItem>
                      {brands.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-1">You can choose a brand if you'd like to display your product by brand.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <Label>Unit *</Label>
                  <Input value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} placeholder="e.g. pc, kg, ltr" />
                </div>
                <div>
                  <Label>Weight (In Kg)</Label>
                  <Input type="number" value={form.weight} onChange={e => setForm(f => ({ ...f, weight: e.target.value }))} placeholder="0.00" />
                </div>
                <div>
                  <Label>Minimum Purchase Qty *</Label>
                  <Input type="number" value={form.min_qty} onChange={e => setForm(f => ({ ...f, min_qty: e.target.value }))} placeholder="1" />
                  <p className="text-xs text-muted-foreground mt-1">The minimum quantity needs to be purchased by your customer.</p>
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="gap-1 text-xs">
                      {tag}
                      <button onClick={() => removeTag(tag)}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input value={tagInput} onChange={e => setTagInput(e.target.value)} placeholder="Add a tag..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addTag())} />
                  <Button variant="outline" size="sm" onClick={addTag} type="button">Add</Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">This is used for search. Input those words by which customer can find this product.</p>
              </div>

              <div>
                <Label>Barcode</Label>
                <Input value={form.barcode} onChange={e => setForm(f => ({ ...f, barcode: e.target.value }))} placeholder="Product barcode" />
              </div>

              <div>
                <Label>Product Category</Label>
                <Select value={form.category_id} onValueChange={v => setForm(f => ({ ...f, category_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent>
                    {parentCategories.map(cat => (
                      <div key={cat.id}>
                        <SelectItem value={cat.id} className="font-medium">{cat.name}</SelectItem>
                        {getChildren(cat.id).map(child => (
                          <SelectItem key={child.id} value={child.id} className="pl-8 text-muted-foreground">↳ {child.name}</SelectItem>
                        ))}
                      </div>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Custom Label</Label>
                <Select value={form.label_id} onValueChange={v => setForm(f => ({ ...f, label_id: v === '__none__' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Label" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">[No Label]</SelectItem>
                    {labels.map(l => <SelectItem key={l.id} value={l.id}><span className="flex items-center gap-2"><span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: l.color }} />{l.name}</span></SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Description</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Product description..." rows={5} />
              </div>

              {/* Variations */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Variations</Label>
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
                          <Input className="h-7 w-24 text-xs" placeholder="Option" value={opt} onChange={e => { const newOpts = [...v.options]; newOpts[oi] = e.target.value; updateVariation(vi, 'options', newOpts); }} />
                          {v.options.length > 1 && <button onClick={() => updateVariation(vi, 'options', v.options.filter((_, i) => i !== oi))} className="text-destructive"><X className="h-3 w-3" /></button>}
                        </div>
                      ))}
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => updateVariation(vi, 'options', [...v.options, ''])}><Plus className="h-3 w-3 mr-1" /> Option</Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Refund, Status, Featured, Flash Deal, HSN */}
          <Card>
            <CardHeader><CardTitle className="text-sm">Refund & Status</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <Switch checked={form.is_refundable} onCheckedChange={v => setForm(f => ({ ...f, is_refundable: v }))} />
                <Label>Refundable?</Label>
              </div>
              <div>
                <Label>Note (Add from preset)</Label>
                <Textarea value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} placeholder="Add note..." rows={2} />
              </div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Status (Active)</Label>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Switch checked={form.is_featured} onCheckedChange={v => setForm(f => ({ ...f, is_featured: v }))} />
                  <Label>Featured</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-12">If you enable this, this product will be granted as a featured product.</p>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <Switch checked={form.is_todays_deal} onCheckedChange={v => setForm(f => ({ ...f, is_todays_deal: v }))} />
                  <Label>Today's Deal</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-12">If you enable this, this product will be granted as a today's deal product.</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <Switch checked={form.is_flash_sale} onCheckedChange={v => setForm(f => ({ ...f, is_flash_sale: v }))} />
                  <Label>Flash Deal</Label>
                </div>
                <p className="text-xs text-muted-foreground ml-12">If you want to select this product as a flash deal, you can use it.</p>
                {form.is_flash_sale && (
                  <div className="ml-12">
                    <Label className="text-xs">Choose Flash Title</Label>
                    <Select value={form.flash_deal_title} onValueChange={v => setForm(f => ({ ...f, flash_deal_title: v }))}>
                      <SelectTrigger className="w-56"><SelectValue placeholder="Choose Flash Title" /></SelectTrigger>
                      <SelectContent>
                        {flashDeals.map(fd => <SelectItem key={fd} value={fd}>{fd}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">HSN & GST</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>HSN Code</Label>
                <Input value={form.hsn_code} onChange={e => setForm(f => ({ ...f, hsn_code: e.target.value }))} placeholder="HSN Code" />
              </div>
              <div>
                <Label>GST Rate (%)</Label>
                <Input type="number" value={form.gst_rate} onChange={e => setForm(f => ({ ...f, gst_rate: e.target.value }))} placeholder="0" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== FILES & MEDIA TAB ======== */}
        <TabsContent value="media" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Gallery Images</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">These images are visible in product details page gallery. Minimum dimensions required: 900px width X 900px height.</p>
              <div className="flex flex-wrap gap-3">
                {form.images.map((img, i) => (
                  <div key={i} className="relative h-24 w-24 rounded-lg border border-border overflow-hidden group">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => removeImage(i)} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setMediaTarget('gallery')} className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Browse</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Thumbnail Image</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">This image is visible in all product box. Minimum dimensions required: 195px width X 195px height. Keep some blank space around main object of your image as we had to crop some edge in different devices to make it responsive. If no thumbnail is uploaded, the product's first gallery image will be used as the thumbnail image.</p>
              <div className="flex items-center gap-3">
                {form.thumbnail && (
                  <div className="relative h-24 w-24 rounded-lg border border-border overflow-hidden group">
                    <img src={form.thumbnail} alt="Thumbnail" className="h-full w-full object-cover" />
                    <button onClick={() => setForm(f => ({ ...f, thumbnail: '' }))} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                  </div>
                )}
                <button type="button" onClick={() => setMediaTarget('thumbnail')} className="h-24 w-24 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Browse</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Video className="h-4 w-4" /> Videos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Try to upload videos under 30 seconds for better performance.</p>
              <div className="flex flex-wrap gap-3">
                {form.videos.map((vid, i) => (
                  <div key={i} className="relative h-20 w-32 rounded-lg border border-border overflow-hidden group bg-muted flex items-center justify-center">
                    <Video className="h-6 w-6 text-muted-foreground" />
                    <span className="absolute bottom-1 left-1 text-[9px] text-muted-foreground truncate max-w-[100px]">Video {i + 1}</span>
                    <button onClick={() => removeVideo(i)} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setMediaTarget('videos')} className="h-20 w-32 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                  <span className="text-[10px] text-muted-foreground mt-1">Browse</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Video Thumbnails</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">Add thumbnails in the same order as your videos. If you upload only one image, it will be used for all videos.</p>
              <div className="flex flex-wrap gap-3">
                {form.video_thumbnails.map((img, i) => (
                  <div key={i} className="relative h-20 w-20 rounded-lg border border-border overflow-hidden group">
                    <img src={img} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => removeVideoThumb(i)} className="absolute top-0.5 right-0.5 h-5 w-5 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"><X className="h-3 w-3" /></button>
                  </div>
                ))}
                <button type="button" onClick={() => setMediaTarget('video_thumbnails')} className="h-20 w-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-accent transition-colors">
                  <Upload className="h-4 w-4 text-muted-foreground" />
                  <span className="text-[9px] text-muted-foreground mt-1">Browse</span>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><Video className="h-4 w-4" /> Youtube video / shorts link</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Input value={form.youtube_link} onChange={e => setForm(f => ({ ...f, youtube_link: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." />
              <p className="text-xs text-muted-foreground">Use proper link without extra parameter. Don't use short share link/embedded iframe code.</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm flex items-center gap-2"><FileText className="h-4 w-4" /> PDF Specification</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {form.pdf_url && (
                <div className="flex items-center gap-3 p-2 border border-border rounded-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  <a href={form.pdf_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline truncate flex-1">View PDF</a>
                  <button onClick={() => setForm(f => ({ ...f, pdf_url: '' }))} className="text-destructive"><X className="h-4 w-4" /></button>
                </div>
              )}
              <button type="button" onClick={() => setMediaTarget('pdf')} className="flex items-center gap-2 px-4 py-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-accent transition-colors w-fit">
                <Upload className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Browse</span>
              </button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== PRICE & STOCK TAB ======== */}
        <TabsContent value="price" className="mt-4 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Pricing</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div><Label>Unit Price *</Label><Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} placeholder="0.00" /></div>
                <div><Label>Original Price</Label><Input type="number" value={form.original_price} onChange={e => setForm(f => ({ ...f, original_price: e.target.value }))} placeholder="0.00" /></div>
                <div>
                  <Label>Cost per item</Label>
                  <Input type="number" step="0.01" value={form.cost_per_item} onChange={e => setForm(f => ({ ...f, cost_per_item: e.target.value }))} placeholder="0.00" />
                  <p className="text-xs text-muted-foreground mt-1">Your purchase cost — used for profit calculation</p>
                </div>
                <div><Label>Discount</Label><Input type="number" value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))} placeholder="0" /></div>
                <div>
                  <Label>Discount Type</Label>
                  <Select value={form.discount_type} onValueChange={v => setForm(f => ({ ...f, discount_type: v }))}>
                    <SelectTrigger><SelectValue placeholder="Choose Discount Type" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="flat">Flat</SelectItem>
                      <SelectItem value="percent">Percent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-sm">Stock Management</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Current Stock *</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" /></div>
                <div><Label>SKU</Label><Input placeholder="Auto-generated or custom SKU" value={form.slug} readOnly className="bg-muted/50" /></div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.is_prime} onCheckedChange={v => setForm(f => ({ ...f, is_prime: v }))} />
                <Label className="text-sm">Prime</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== SEO TAB ======== */}
        <TabsContent value="seo" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Search Engine Optimization</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div><Label>Meta Title</Label><Input value={form.meta_title} onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))} placeholder="Product meta title" maxLength={60} /><p className="text-xs text-muted-foreground mt-1">{form.meta_title.length}/60 characters</p></div>
              <div><Label>Meta Description</Label><Textarea value={form.meta_description} onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))} placeholder="Product meta description" rows={3} maxLength={160} /><p className="text-xs text-muted-foreground mt-1">{form.meta_description.length}/160 characters</p></div>
              <div><Label>Meta Keywords</Label><Input value={form.meta_keywords} onChange={e => setForm(f => ({ ...f, meta_keywords: e.target.value }))} placeholder="keyword1, keyword2, keyword3" /></div>
              <div><Label>Slug</Label><Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="product-slug" /></div>
              <div className="p-4 border border-border rounded-lg bg-muted/30">
                <p className="text-sm font-medium text-primary mb-1">Google Search Preview</p>
                <p className="text-base font-medium text-primary truncate">{form.meta_title || form.name || 'Product Title'}</p>
                <p className="text-xs text-muted-foreground truncate">https://yourstore.com/products/{form.slug || 'product-slug'}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{form.meta_description || form.description || 'Product description will appear here...'}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== SHIPPING TAB ======== */}
        <TabsContent value="shipping" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Shipping Configuration</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Shipping Type</Label>
                <Select value={form.shipping_type} onValueChange={v => setForm(f => ({ ...f, shipping_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="free">Free Shipping</SelectItem>
                    <SelectItem value="flat">Flat Rate</SelectItem>
                    <SelectItem value="product_wise">Product Wise</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {form.shipping_type !== 'free' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div><Label>Shipping Cost</Label><Input type="number" value={form.shipping_cost} onChange={e => setForm(f => ({ ...f, shipping_cost: e.target.value }))} placeholder="0.00" /></div>
                  <div className="flex items-center gap-3 pt-6">
                    <Switch checked={form.is_product_quantity_multiply} onCheckedChange={v => setForm(f => ({ ...f, is_product_quantity_multiply: v }))} />
                    <Label className="text-sm">Multiply with quantity</Label>
                  </div>
                </div>
              )}
              <div><Label>Estimated Shipping Days</Label><Input type="number" value={form.estimated_shipping_days} onChange={e => setForm(f => ({ ...f, estimated_shipping_days: e.target.value }))} placeholder="e.g. 3-5" /></div>
              <div className="flex items-center gap-3">
                <Switch checked={form.is_free_shipping} onCheckedChange={v => setForm(f => ({ ...f, is_free_shipping: v }))} />
                <Label>Free Shipping Badge</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== WARRANTY TAB ======== */}
        <TabsContent value="warranty" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Warranty Information</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Warranty</Label>
                <Select value={form.warranty_id} onValueChange={v => setForm(f => ({ ...f, warranty_id: v === '__none__' ? '' : v }))}>
                  <SelectTrigger><SelectValue placeholder="Select Warranty" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">[No Warranty]</SelectItem>
                    {warranties.map(w => <SelectItem key={w.id} value={w.id}>{w.name} ({w.duration})</SelectItem>)}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Choose a warranty policy to attach to this product.</p>
              </div>
              {form.warranty_id && (() => {
                const w = warranties.find(w => w.id === form.warranty_id);
                return w ? (
                  <div className="p-3 border border-border rounded-lg bg-muted/30">
                    <p className="text-sm font-medium">Selected Warranty</p>
                    <p className="text-xs text-muted-foreground">{w.name} — {w.duration}</p>
                  </div>
                ) : null;
              })()}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ======== FREQUENTLY BOUGHT TAB ======== */}
        <TabsContent value="frequently" className="mt-4">
          <Card>
            <CardHeader><CardTitle className="text-sm">Frequently Bought Together</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-xs text-muted-foreground">Select products that are commonly purchased together with this product.</p>
              {form.frequently_bought_ids.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {form.frequently_bought_ids.map(id => {
                    const p = allProducts.find(pr => pr.id === id);
                    return p ? (
                      <Badge key={id} variant="secondary" className="gap-1">{p.name}<button onClick={() => toggleFrequentlyBought(id)}><X className="h-3 w-3" /></button></Badge>
                    ) : null;
                  })}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                {allProducts.filter(p => p.id !== editId).map(p => (
                  <div key={p.id} onClick={() => toggleFrequentlyBought(p.id)}
                    className={`flex items-center gap-2 p-2 border rounded-lg cursor-pointer transition-colors ${form.frequently_bought_ids.includes(p.id) ? 'border-primary bg-primary/5' : 'border-border hover:border-accent'}`}>
                    {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-3 w-3" /></div>}
                    <span className="text-xs truncate flex-1">{p.name}</span>
                    {form.frequently_bought_ids.includes(p.id) && <Badge className="text-[9px] h-4 bg-primary text-primary-foreground">✓</Badge>}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Save Bar */}
      <div className="sticky bottom-0 mt-6 p-4 border-t border-border bg-background flex items-center justify-end gap-3 rounded-t-lg shadow-lg">
        <Button variant="outline" onClick={() => navigate('/admin/products')}>Cancel</Button>
        <Button onClick={handleSubmit} disabled={loading} className="gap-2">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          {isEdit ? 'Update Product' : 'Save Product'}
        </Button>
      </div>

      <MediaManagerModal
        open={mediaTarget !== null}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) setMediaTarget(null);
        }}
        onSelect={handleMediaSelect}
        multiple={mediaTarget ? MEDIA_TARGET_CONFIG[mediaTarget].multiple : false}
        acceptedKinds={mediaTarget ? MEDIA_TARGET_CONFIG[mediaTarget].acceptedKinds : ['image']}
        uploadFolder={mediaTarget ? MEDIA_TARGET_CONFIG[mediaTarget].uploadFolder : 'gallery'}
      />
    </AdminLayout>
  );
};

export default AdminAddProduct;
