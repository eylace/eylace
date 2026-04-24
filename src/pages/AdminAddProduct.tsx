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
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Loader2, Plus, X, Upload, Save, ArrowLeft, Package, Image as ImageIcon, DollarSign, Search, Truck, Shield, ShoppingCart, Video, FileText, Sparkles, AlertTriangle, FolderOpen, Tag, Calendar as CalendarIcon, ChevronDown, Palette, RefreshCw } from 'lucide-react';
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
  discount_starts_at: string;
  discount_ends_at: string;
  stock: string;
  sku: string;
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
  selected_color_ids: string[];
  selected_attribute_ids: string[];
  attribute_values: Record<string, string[]>; // attributeId -> selected values
  variation_enabled: boolean;
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
  discount_starts_at: '', discount_ends_at: '',
  stock: '', sku: '', category_id: '', brand_id: '', warranty_id: '', label_id: '',
  images: [], thumbnail: '', videos: [], video_thumbnails: [], youtube_link: '', pdf_url: '',
  is_active: true, is_flash_sale: false, is_free_shipping: false, is_prime: false, is_digital: false,
  variations: [], selected_color_ids: [], selected_attribute_ids: [], attribute_values: {}, variation_enabled: false,
  unit: '', weight: '', min_qty: '1', barcode: '',
  meta_title: '', meta_description: '', meta_keywords: '',
  meta_image: '', canonical_url: '', short_description: '',
  shipping_type: 'free', shipping_cost: '', is_product_quantity_multiply: false, estimated_shipping_days: '',
  is_refundable: true, is_featured: false, is_todays_deal: false, flash_deal_title: '',
  hsn_code: '', gst_rate: '', frequently_bought_ids: [], note: '',
};

type MediaTarget = 'gallery' | 'thumbnail' | 'videos' | 'video_thumbnails' | 'pdf' | 'meta_image';

const MEDIA_TARGET_CONFIG: Record<MediaTarget, { acceptedKinds: ('image' | 'video' | 'document')[]; multiple: boolean; uploadFolder: string }> = {
  gallery: { acceptedKinds: ['image'], multiple: true, uploadFolder: 'gallery' },
  thumbnail: { acceptedKinds: ['image'], multiple: false, uploadFolder: 'thumbnails' },
  videos: { acceptedKinds: ['video'], multiple: true, uploadFolder: 'videos' },
  video_thumbnails: { acceptedKinds: ['image'], multiple: true, uploadFolder: 'video-thumbs' },
  pdf: { acceptedKinds: ['document'], multiple: false, uploadFolder: 'pdfs' },
  meta_image: { acceptedKinds: ['image'], multiple: false, uploadFolder: 'seo' },
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
  const [colors, setColors] = useState<Array<{ id: string; name: string; hex_code: string }>>([]);
  const [attributes, setAttributes] = useState<Array<{ id: string; name: string; values: string[] }>>([]);
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
      supabase.from('colors').select('id, name, hex_code').eq('is_active', true).order('name'),
      supabase.from('product_attributes').select('id, name, values').eq('is_active', true).order('name'),
    ]).then(([catRes, brandRes, warrantyRes, labelRes, prodRes, colorRes, attrRes]) => {
      if (catRes.data) setCategories(catRes.data);
      if (brandRes.data) setBrands(brandRes.data);
      if (warrantyRes.data) setWarranties(warrantyRes.data);
      if (labelRes.data) setLabels(labelRes.data);
      if (prodRes.data) setAllProducts(prodRes.data);
      if (colorRes.data) setColors(colorRes.data as any);
      if (attrRes.data) setAttributes(attrRes.data as any);
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
        discount_starts_at: attrs.discount_starts_at || '',
        discount_ends_at: attrs.discount_ends_at || (data.flash_sale_ends ? String(data.flash_sale_ends).slice(0, 10) : ''),
        stock: String(data.stock || ''),
        sku: attrs.sku || '',
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
        selected_color_ids: attrs.selected_color_ids || [],
        selected_attribute_ids: attrs.selected_attribute_ids || [],
        attribute_values: attrs.attribute_values || {},
        variation_enabled: attrs.variation_enabled ?? ((data.variations as any)?.length > 0),
        unit: attrs.unit || '',
        weight: attrs.weight || '',
        min_qty: attrs.min_qty || '1',
        barcode: attrs.barcode || '',
        meta_title: (data as any).meta_title || attrs.meta_title || '',
        meta_description: (data as any).meta_description || attrs.meta_description || '',
        meta_keywords: (data as any).meta_keywords || attrs.meta_keywords || '',
        meta_image: (data as any).meta_image || attrs.meta_image || '',
        canonical_url: (data as any).canonical_url || attrs.canonical_url || '',
        short_description: (data as any).short_description || attrs.short_description || '',
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
      setTags((data as any).tags || attrs.tags || []);
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

    if (mediaTarget === 'meta_image') {
      setForm((currentForm) => ({ ...currentForm, meta_image: urls[0] }));
      return;
    }

    setForm((currentForm) => ({ ...currentForm, pdf_url: urls[0] }));
  };

  const addTag = () => { const t = tagInput.trim(); if (t && !tags.includes(t)) { setTags(prev => [...prev, t]); setTagInput(''); } };
  const removeTag = (tag: string) => setTags(prev => prev.filter(t => t !== tag));

  // === SEO helpers ===========================================================
  const stripHtml = (s: string) => (s || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();

  const handleAutoFillSeo = () => {
    if (!form.name) {
      toast.error('Please enter a product name first');
      return;
    }
    const cat = categories.find(c => c.id === form.category_id)?.name || '';
    const brand = brands.find(b => b.id === form.brand_id)?.name || '';
    const baseTitle = [form.name, brand, cat].filter(Boolean).join(' | ').slice(0, 60);
    const cleanShort = stripHtml(form.short_description || form.description);
    const baseDesc = (cleanShort || `Buy ${form.name}${cat ? ' from ' + cat : ''} online. Best price, fast delivery.`).slice(0, 160);
    const keywordParts = [form.name, brand, cat, ...tags].filter(Boolean);
    const baseKeywords = Array.from(new Set(keywordParts.flatMap(p => p.split(/\s+/)))).slice(0, 12).join(', ');
    const slug = form.slug || generateSlug(form.name);
    const canonical = form.canonical_url || `${window.location.origin}/product/${slug}`;
    setForm(f => ({
      ...f,
      meta_title: f.meta_title || baseTitle,
      meta_description: f.meta_description || baseDesc,
      meta_keywords: f.meta_keywords || baseKeywords,
      canonical_url: f.canonical_url || canonical,
      meta_image: f.meta_image || f.thumbnail || f.images[0] || f.video_thumbnails[0] || '',
    }));
    toast.success('SEO fields auto-filled — review and save.');
  };

  // Duplicate detection
  const [seoDuplicates, setSeoDuplicates] = useState<Array<{ id: string; name: string; slug: string; match_type: string }>>([]);
  const [duplicateChecking, setDuplicateChecking] = useState(false);
  const checkSeoDuplicates = async () => {
    setDuplicateChecking(true);
    try {
      const { data, error } = await (supabase as any).rpc('find_seo_duplicates', {
        _product_id: editId || null,
        _meta_title: form.meta_title || null,
        _meta_description: form.meta_description || null,
        _canonical_url: form.canonical_url || null,
      });
      if (error) throw error;
      setSeoDuplicates(data || []);
    } catch (err: any) {
      console.error('Duplicate check failed', err);
      toast.error('Could not check for duplicates');
    } finally {
      setDuplicateChecking(false);
    }
  };

  // Auto-run duplicate check (debounced) when SEO fields settle
  useEffect(() => {
    if (!form.meta_title && !form.meta_description && !form.canonical_url) {
      setSeoDuplicates([]);
      return;
    }
    const t = setTimeout(() => { checkSeoDuplicates(); }, 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.meta_title, form.meta_description, form.canonical_url]);

  // Effective values (with fallbacks) used in previews
  const effectiveMetaImage = form.meta_image || form.thumbnail || form.images[0] || form.video_thumbnails[0] || '';
  const effectiveTitle = form.meta_title || form.name || 'Product Title';
  const effectiveDescription = form.meta_description || form.short_description || stripHtml(form.description).slice(0, 160) || 'Product description will appear here...';

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

  // === Variation Configuration helpers ======================================
  const toggleColor = (colorId: string) => {
    setForm(f => ({
      ...f,
      selected_color_ids: f.selected_color_ids.includes(colorId)
        ? f.selected_color_ids.filter(id => id !== colorId)
        : [...f.selected_color_ids, colorId],
    }));
  };

  const toggleAttribute = (attrId: string) => {
    setForm(f => {
      const isSelected = f.selected_attribute_ids.includes(attrId);
      const next_attribute_values = { ...f.attribute_values };
      if (isSelected) {
        delete next_attribute_values[attrId];
      } else {
        next_attribute_values[attrId] = next_attribute_values[attrId] || [];
      }
      return {
        ...f,
        selected_attribute_ids: isSelected
          ? f.selected_attribute_ids.filter(id => id !== attrId)
          : [...f.selected_attribute_ids, attrId],
        attribute_values: next_attribute_values,
      };
    });
  };

  const toggleAttributeValue = (attrId: string, value: string) => {
    setForm(f => {
      const current = f.attribute_values[attrId] || [];
      const next = current.includes(value) ? current.filter(v => v !== value) : [...current, value];
      return { ...f, attribute_values: { ...f.attribute_values, [attrId]: next } };
    });
  };

  // Build the canonical `variations` payload from color + attribute selections.
  const buildVariationsPayload = (
    colorIds: string[],
    attrIds: string[],
    attrValues: Record<string, string[]>,
  ) => {
    const out: { name: string; options: string[] }[] = [];
    if (colorIds.length > 0) {
      out.push({
        name: 'Color',
        options: colorIds
          .map(id => colors.find(c => c.id === id)?.name)
          .filter((n): n is string => !!n),
      });
    }
    for (const attrId of attrIds) {
      const attr = attributes.find(a => a.id === attrId);
      const values = attrValues[attrId] || [];
      if (attr && values.length > 0) {
        out.push({ name: attr.name, options: values });
      }
    }
    return out;
  };

  // === SKU Generator ========================================================
  // Standard format: {NAMEPREFIX}-{CATPREFIX}-{TIMESTAMP}-{RAND}
  // Example: WIRE-AUDI-K9X4-7B3
  const generateSku = () => {
    const slug = (form.name || 'PRD')
      .toUpperCase()
      .replace(/[^A-Z0-9]+/g, '')
      .slice(0, 4) || 'PRD';
    const cat = categories.find(c => c.id === form.category_id)?.name || '';
    const catPrefix = cat
      ? cat.toUpperCase().replace(/[^A-Z0-9]+/g, '').slice(0, 4)
      : 'GEN';
    const ts = Date.now().toString(36).toUpperCase().slice(-4);
    const rand = Math.random().toString(36).toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3);
    const sku = `${slug}-${catPrefix}-${ts}-${rand}`;
    setForm(f => ({ ...f, sku }));
    toast.success(`SKU generated: ${sku}`);
  };

  // === Discount Date Range ===================================================
  const discountRange: DateRange | undefined = (form.discount_starts_at || form.discount_ends_at)
    ? {
        from: form.discount_starts_at ? new Date(form.discount_starts_at) : undefined,
        to: form.discount_ends_at ? new Date(form.discount_ends_at) : undefined,
      }
    : undefined;

  const setDiscountRange = (range: DateRange | undefined) => {
    setForm(f => ({
      ...f,
      discount_starts_at: range?.from ? format(range.from, 'yyyy-MM-dd') : '',
      discount_ends_at: range?.to ? format(range.to, 'yyyy-MM-dd') : '',
    }));
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug || !form.price) { toast.error('Name, slug and price are required'); return; }
    setLoading(true);
    // Build variations from the new color/attribute selectors when enabled,
    // otherwise fall back to the legacy `variations` array.
    const builtVariations = form.variation_enabled
      ? buildVariationsPayload(form.selected_color_ids, form.selected_attribute_ids, form.attribute_values)
      : form.variations;
    const payload: any = {
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
      variations: builtVariations.length > 0 ? builtVariations : [],
      // Discount window — drives both display countdown and flash-sale expiry
      flash_sale_starts: form.discount_starts_at ? new Date(form.discount_starts_at).toISOString() : null,
      flash_sale_ends: form.discount_ends_at ? new Date(form.discount_ends_at).toISOString() : null,
      // ✅ SEO fields saved to dedicated top-level columns (with server-side validation)
      meta_title: form.meta_title?.trim() || null,
      meta_description: form.meta_description?.trim() || null,
      meta_keywords: form.meta_keywords?.trim() || null,
      meta_image: form.meta_image?.trim() || null,
      canonical_url: form.canonical_url?.trim() || null,
      short_description: form.short_description?.trim() || null,
      tags: tags.length > 0 ? tags : [],
      attributes: {
        unit: form.unit, weight: form.weight, min_qty: form.min_qty, barcode: form.barcode,
        sku: form.sku || null,
        thumbnail: form.thumbnail, videos: form.videos, video_thumbnails: form.video_thumbnails,
        youtube_link: form.youtube_link, pdf_url: form.pdf_url,
        shipping_type: form.shipping_type, shipping_cost: form.shipping_cost,
        is_product_quantity_multiply: form.is_product_quantity_multiply,
        estimated_shipping_days: form.estimated_shipping_days, is_refundable: form.is_refundable,
        is_featured: form.is_featured, is_todays_deal: form.is_todays_deal, flash_deal_title: form.flash_deal_title,
        hsn_code: form.hsn_code, gst_rate: form.gst_rate, frequently_bought_ids: form.frequently_bought_ids,
        note: form.note, discount_type: form.discount_type,
        discount_starts_at: form.discount_starts_at || null,
        discount_ends_at: form.discount_ends_at || null,
        variation_enabled: form.variation_enabled,
        selected_color_ids: form.selected_color_ids,
        selected_attribute_ids: form.selected_attribute_ids,
        attribute_values: form.attribute_values,
      },
    };

    let error;
    if (isEdit) {
      ({ error } = await supabase.from('products').update(payload).eq('id', editId));
    } else {
      ({ error } = await supabase.from('products').insert(payload));
    }
    if (error) {
      // Surface SEO validation errors with friendly wording
      const msg = error.message || 'Unknown error';
      if (/meta title|meta description|canonical url|tags list/i.test(msg)) {
        toast.error('SEO validation: ' + msg);
      } else {
        toast.error('Failed to save: ' + msg);
      }
    } else {
      toast.success(isEdit ? 'Product updated!' : 'Product created!');
      navigate('/admin/products');
    }
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

              {/* Discount Date Range */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <Label className="flex items-center gap-1.5"><CalendarIcon className="h-3.5 w-3.5" /> Discount Date Range</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal mt-1"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4 text-muted-foreground" />
                        {discountRange?.from ? (
                          discountRange.to ? (
                            <>
                              {format(discountRange.from, 'PP')} – {format(discountRange.to, 'PP')}
                            </>
                          ) : (
                            format(discountRange.from, 'PP')
                          )
                        ) : (
                          <span className="text-muted-foreground">Select Date</span>
                        )}
                        {discountRange?.from && (
                          <X
                            className="ml-auto h-3.5 w-3.5 text-muted-foreground hover:text-destructive"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setDiscountRange(undefined); }}
                          />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={discountRange}
                        onSelect={setDiscountRange}
                        numberOfMonths={2}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <p className="text-xs text-muted-foreground mt-1">
                    Optional. The discount will only be active between these dates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ===== Product Variation Configuration ===== */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <CardTitle className="text-sm flex items-center gap-2">
                <Palette className="h-4 w-4" /> Product Variation Configuration
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{form.variation_enabled ? 'Enabled' : 'Disabled'}</span>
                <Switch
                  checked={form.variation_enabled}
                  onCheckedChange={v => setForm(f => ({ ...f, variation_enabled: v }))}
                />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Colors row */}
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 items-start">
                <Label className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium">
                  Colors
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!form.variation_enabled}
                      className="w-full justify-between text-left font-normal h-auto min-h-10 py-2"
                    >
                      {form.selected_color_ids.length === 0 ? (
                        <span className="text-muted-foreground">Nothing selected</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {form.selected_color_ids.map(id => {
                            const c = colors.find(x => x.id === id);
                            if (!c) return null;
                            return (
                              <Badge key={id} variant="secondary" className="gap-1 pl-1.5 pr-1 py-0.5">
                                <span className="h-3 w-3 rounded-full border border-border" style={{ backgroundColor: c.hex_code }} />
                                {c.name}
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleColor(id); }}
                                  className="hover:bg-destructive/20 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-2" align="start">
                    <div className="text-xs font-medium px-2 py-1 text-muted-foreground">Select colors</div>
                    <div className="max-h-[280px] overflow-y-auto space-y-1">
                      {colors.length === 0 && (
                        <p className="text-xs text-muted-foreground p-2">
                          No colors found. Create some in Products → Colors.
                        </p>
                      )}
                      {colors.map(c => {
                        const checked = form.selected_color_ids.includes(c.id);
                        return (
                          <button
                            type="button"
                            key={c.id}
                            onClick={() => toggleColor(c.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${checked ? 'bg-accent/15' : 'hover:bg-muted'}`}
                          >
                            <Checkbox checked={checked} className="pointer-events-none" />
                            <span className="h-4 w-4 rounded-full border border-border" style={{ backgroundColor: c.hex_code }} />
                            <span className="flex-1 text-left">{c.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Attributes row */}
              <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-3 items-start">
                <Label className="rounded-md border border-border bg-muted/40 px-3 py-2 text-sm font-medium">
                  Attributes
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      disabled={!form.variation_enabled}
                      className="w-full justify-between text-left font-normal h-auto min-h-10 py-2"
                    >
                      {form.selected_attribute_ids.length === 0 ? (
                        <span className="text-muted-foreground">Nothing selected</span>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {form.selected_attribute_ids.map(id => {
                            const a = attributes.find(x => x.id === id);
                            if (!a) return null;
                            const count = (form.attribute_values[id] || []).length;
                            return (
                              <Badge key={id} variant="secondary" className="gap-1 pl-2 pr-1 py-0.5">
                                {a.name}{count > 0 && <span className="text-[10px] text-muted-foreground">×{count}</span>}
                                <button
                                  type="button"
                                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleAttribute(id); }}
                                  className="hover:bg-destructive/20 rounded-full p-0.5"
                                >
                                  <X className="h-3 w-3" />
                                </button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}
                      <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[320px] p-2" align="start">
                    <div className="text-xs font-medium px-2 py-1 text-muted-foreground">Select attributes</div>
                    <div className="max-h-[280px] overflow-y-auto space-y-1">
                      {attributes.length === 0 && (
                        <p className="text-xs text-muted-foreground p-2">
                          No attributes found. Create some in Products → Attributes.
                        </p>
                      )}
                      {attributes.map(a => {
                        const checked = form.selected_attribute_ids.includes(a.id);
                        return (
                          <button
                            type="button"
                            key={a.id}
                            onClick={() => toggleAttribute(a.id)}
                            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm transition-colors ${checked ? 'bg-accent/15' : 'hover:bg-muted'}`}
                          >
                            <Checkbox checked={checked} className="pointer-events-none" />
                            <span className="flex-1 text-left">{a.name}</span>
                            <span className="text-[10px] text-muted-foreground">{a.values?.length || 0} options</span>
                          </button>
                        );
                      })}
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Per-attribute value selectors (cascading) */}
              {form.variation_enabled && form.selected_attribute_ids.length > 0 && (
                <div className="space-y-3 pt-1">
                  {form.selected_attribute_ids.map(attrId => {
                    const attr = attributes.find(a => a.id === attrId);
                    if (!attr) return null;
                    const selected = form.attribute_values[attrId] || [];
                    return (
                      <div key={attrId} className="rounded-lg border border-border bg-muted/20 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <Label className="text-xs font-semibold flex items-center gap-1.5">
                            <Tag className="h-3 w-3" /> {attr.name}
                            <span className="text-muted-foreground font-normal">({selected.length}/{attr.values?.length || 0} selected)</span>
                          </Label>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(attr.values || []).map(value => {
                            const isSel = selected.includes(value);
                            return (
                              <button
                                type="button"
                                key={value}
                                onClick={() => toggleAttributeValue(attrId, value)}
                                className={`px-2.5 py-1 rounded-md text-xs border transition-all ${
                                  isSel
                                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                                    : 'bg-background text-foreground border-border hover:border-primary/40'
                                }`}
                              >
                                {value}
                              </button>
                            );
                          })}
                          {(!attr.values || attr.values.length === 0) && (
                            <span className="text-xs text-muted-foreground italic">No values defined for this attribute</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Choose the attributes of this product and then input values of each attribute.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-sm">Stock Management</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div><Label>Current Stock *</Label><Input type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} placeholder="0" /></div>
                <div>
                  <Label>SKU</Label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Product SKU"
                      value={form.sku}
                      onChange={e => setForm(f => ({ ...f, sku: e.target.value }))}
                    />
                    <Button type="button" variant="secondary" onClick={generateSku} className="gap-1.5 shrink-0">
                      <RefreshCw className="h-3.5 w-3.5" /> Generate
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Click <span className="font-medium">Generate</span> for an automatic SKU using the product name & category.
                  </p>
                </div>
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
            <CardHeader className="flex flex-row items-center justify-between gap-3">
              <div>
                <CardTitle className="text-sm flex items-center gap-2"><Search className="h-4 w-4" /> Search Engine Optimization</CardTitle>
                <p className="text-xs text-muted-foreground mt-1">Control how this product appears on Google, Facebook, Twitter and WhatsApp.</p>
              </div>
              <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={handleAutoFillSeo}>
                <Sparkles className="h-3.5 w-3.5" /> Auto-fill SEO
              </Button>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Duplicate warning */}
              {seoDuplicates.length > 0 && (
                <div className="rounded-lg border border-[hsl(var(--warning,38_92%_50%))] bg-[hsl(var(--warning,38_92%_50%)/0.08)] p-3">
                  <p className="text-xs font-semibold flex items-center gap-1.5 text-[hsl(var(--warning,38_92%_50%))] mb-1.5">
                    <AlertTriangle className="h-3.5 w-3.5" /> Possible duplicate SEO ({seoDuplicates.length})
                  </p>
                  <ul className="text-xs space-y-1 text-foreground/90">
                    {seoDuplicates.slice(0, 5).map((d) => (
                      <li key={`${d.id}-${d.match_type}`} className="flex items-center justify-between gap-2">
                        <span className="truncate">
                          <span className="font-medium">{d.name}</span>
                          <span className="text-muted-foreground"> — same {d.match_type.replace('_', ' ')}</span>
                        </span>
                        <a href={`/admin/products/edit/${d.id}`} target="_blank" rel="noreferrer" className="text-primary hover:underline whitespace-nowrap">View</a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Short description */}
              <div>
                <Label>Short Description <span className="text-muted-foreground font-normal text-xs">(used as fallback meta description)</span></Label>
                <Textarea
                  value={form.short_description}
                  onChange={e => setForm(f => ({ ...f, short_description: e.target.value }))}
                  placeholder="One or two sentences summarising the product"
                  rows={2}
                  maxLength={300}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Label>Meta Title</Label>
                  <Input
                    value={form.meta_title}
                    onChange={e => setForm(f => ({ ...f, meta_title: e.target.value }))}
                    placeholder="SEO title (50–60 chars recommended)"
                    maxLength={70}
                  />
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{form.meta_title.length}/60 characters</p>
                    <span className={`text-xs font-medium ${form.meta_title.length > 60 ? 'text-destructive' : form.meta_title.length >= 30 ? 'text-[hsl(var(--success,142_71%_45%))]' : 'text-muted-foreground'}`}>
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
                  <p className="text-xs text-muted-foreground mt-1">Use to point duplicates to the original URL.</p>
                </div>
              </div>

              <div>
                <Label>Meta Description</Label>
                <Textarea
                  value={form.meta_description}
                  onChange={e => setForm(f => ({ ...f, meta_description: e.target.value }))}
                  placeholder="A concise summary that appears in search results (140–160 chars)"
                  rows={3}
                  maxLength={200}
                />
                <div className="flex items-center justify-between mt-1">
                  <p className="text-xs text-muted-foreground">{form.meta_description.length}/160 characters</p>
                  <span className={`text-xs font-medium ${form.meta_description.length > 160 ? 'text-destructive' : form.meta_description.length >= 120 ? 'text-[hsl(var(--success,142_71%_45%))]' : 'text-muted-foreground'}`}>
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

              <div>
                <Label>Slug</Label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="product-slug" />
              </div>

              {/* SEO Tags */}
              <div>
                <Label className="flex items-center gap-1.5"><Tag className="h-3.5 w-3.5" /> SEO Tags <span className="text-muted-foreground font-normal text-xs">({tags.length}/30)</span></Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={tagInput}
                    onChange={e => setTagInput(e.target.value)}
                    placeholder="Type a tag and press Enter"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                  />
                  <Button type="button" variant="outline" size="sm" onClick={addTag}>
                    <Plus className="h-3.5 w-3.5 mr-1" /> Add
                  </Button>
                </div>
                {tags.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {tags.map((tag, i) => (
                      <Badge key={i} variant="secondary" className="gap-1 text-xs pl-2 pr-1 py-1">
                        <Tag className="h-3 w-3" />{tag}
                        <button
                          type="button"
                          onClick={() => removeTag(tag)}
                          className="ml-0.5 hover:bg-destructive/20 rounded-full p-0.5"
                          aria-label={`Remove tag ${tag}`}
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                )}
              </div>

              {/* Meta Image */}
              <div>
                <Label className="flex items-center gap-1.5"><ImageIcon className="h-3.5 w-3.5" /> Social Share Image (Open Graph)</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={form.meta_image}
                    onChange={e => setForm(f => ({ ...f, meta_image: e.target.value }))}
                    placeholder="https://… (1200×630 recommended)"
                  />
                  <Button type="button" variant="outline" size="sm" onClick={() => setMediaTarget('meta_image')}>
                    <FolderOpen className="h-3.5 w-3.5 mr-1" /> Browse
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Used when shared on Facebook, Twitter, WhatsApp. Falls back to thumbnail / first gallery image / video thumbnail.
                </p>
                {effectiveMetaImage && (
                  <div className="mt-2 inline-block rounded-md border border-border overflow-hidden bg-muted/30">
                    <img
                      src={effectiveMetaImage}
                      alt="Social share preview"
                      className="h-24 w-44 object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                    />
                  </div>
                )}
              </div>

              {/* Google Search Preview */}
              <div className="rounded-lg border border-border bg-card p-4 space-y-1">
                <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground mb-2 flex items-center gap-1.5">
                  <Search className="h-3 w-3" /> Google Search Preview
                </p>
                <p className="text-xs text-[hsl(var(--success,142_71%_45%))] truncate">
                  yourstore.com › product › {form.slug || 'product-slug'}
                </p>
                <p className="text-base text-[#1a0dab] dark:text-[#8ab4f8] font-medium leading-snug line-clamp-1 hover:underline cursor-pointer">
                  {effectiveTitle}
                </p>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {effectiveDescription}
                </p>
              </div>

              {/* Social Share Card */}
              {effectiveMetaImage && (
                <div className="rounded-lg border border-border overflow-hidden bg-card max-w-md">
                  <p className="text-[11px] uppercase tracking-wide font-semibold text-muted-foreground px-4 pt-3 flex items-center gap-1.5">
                    <ImageIcon className="h-3 w-3" /> Social Share Preview
                  </p>
                  <img
                    src={effectiveMetaImage}
                    alt=""
                    className="w-full h-44 object-cover mt-2 border-y border-border"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="p-3 bg-muted/30">
                    <p className="text-[11px] uppercase text-muted-foreground tracking-wide">yourstore.com</p>
                    <p className="text-sm font-semibold text-foreground line-clamp-1">{effectiveTitle}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{effectiveDescription}</p>
                  </div>
                </div>
              )}

              {duplicateChecking && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="h-3 w-3 animate-spin" /> Checking for duplicate SEO across products…
                </p>
              )}
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
