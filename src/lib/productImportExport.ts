import * as XLSX from 'xlsx';
import { supabase } from '@/integrations/supabase/client';

/**
 * Robust product import/export supporting CSV and Excel (XLSX/XLS).
 * - Auto-detects format by extension and content
 * - Flexible header matching (case-insensitive, accepts aliases)
 * - Resolves category/brand/seller by name (creates category/brand if missing)
 * - Upserts by slug to prevent duplicates
 * - Batch processing for large files
 */

export interface ProductRow {
  name: string;
  slug?: string;
  description?: string;
  price: number;
  original_price?: number | null;
  discount?: number | null;
  stock?: number;
  category?: string;
  brand?: string;
  seller?: string;
  is_active?: boolean;
  is_digital?: boolean;
  is_flash_sale?: boolean;
  is_free_shipping?: boolean;
  is_prime?: boolean;
  images?: string[];
}

export interface ImportResult {
  success: number;
  failed: number;
  errors: { row: number; message: string }[];
  total: number;
}

// ---------- Header normalization ----------
const HEADER_ALIASES: Record<string, string> = {
  // canonical : variants
  name: 'name', 'product name': 'name', title: 'name',
  slug: 'slug', 'url slug': 'slug',
  description: 'description', desc: 'description', details: 'description',
  price: 'price', 'sell price': 'price', 'selling price': 'price',
  'original_price': 'original_price', 'original price': 'original_price', 'mrp': 'original_price', 'compare price': 'original_price', 'compare_at_price': 'original_price',
  discount: 'discount', 'discount %': 'discount', 'discount percent': 'discount',
  stock: 'stock', quantity: 'stock', qty: 'stock', inventory: 'stock',
  category: 'category', 'category name': 'category',
  brand: 'brand', 'brand name': 'brand',
  seller: 'seller', vendor: 'seller', 'seller name': 'seller',
  'is_active': 'is_active', active: 'is_active', published: 'is_active', status: 'is_active',
  'is_digital': 'is_digital', digital: 'is_digital',
  'is_flash_sale': 'is_flash_sale', 'flash sale': 'is_flash_sale', "today's deal": 'is_flash_sale', 'flash_sale': 'is_flash_sale',
  'is_free_shipping': 'is_free_shipping', 'free shipping': 'is_free_shipping', 'free_shipping': 'is_free_shipping',
  'is_prime': 'is_prime', featured: 'is_prime', prime: 'is_prime',
  images: 'images', 'image urls': 'images', 'image_urls': 'images', photos: 'images', image: 'images',
};

const normHeader = (h: string): string => {
  const k = String(h || '').trim().toLowerCase().replace(/\s+/g, ' ');
  return HEADER_ALIASES[k] || HEADER_ALIASES[k.replace(/\s+/g, '_')] || k.replace(/\s+/g, '_');
};

// ---------- Value coercion ----------
const toBool = (v: unknown): boolean => {
  if (typeof v === 'boolean') return v;
  if (typeof v === 'number') return v !== 0;
  const s = String(v ?? '').trim().toLowerCase();
  return ['1', 'true', 'yes', 'y', 'active', 'published', 'on'].includes(s);
};

const toNum = (v: unknown): number | null => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return isFinite(v) ? v : null;
  const cleaned = String(v).replace(/[,\s$৳€£]/g, '').trim();
  if (!cleaned) return null;
  const n = parseFloat(cleaned);
  return isFinite(n) ? n : null;
};

const toImages = (v: unknown): string[] => {
  if (!v) return [];
  if (Array.isArray(v)) return v.map(String).map(s => s.trim()).filter(Boolean);
  return String(v)
    .split(/[|,\n;]/)
    .map(s => s.trim())
    .filter(s => s && (s.startsWith('http') || s.startsWith('/') || s.startsWith('data:')));
};

const slugify = (s: string): string =>
  s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '') || `product-${Date.now()}`;

// ---------- File parsing ----------
export async function parseFile(file: File): Promise<Record<string, any>[]> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const buf = await file.arrayBuffer();

  // Use SheetJS for both CSV and Excel — handles encoding, quoted fields, formulas
  const wb = XLSX.read(buf, { type: 'array', cellDates: true, raw: false });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('No sheets found in file');
  const sheet = wb.Sheets[sheetName];

  // Get rows as array-of-arrays first to extract headers cleanly
  const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '', blankrows: false });
  if (rows.length < 2) return [];

  const rawHeaders = rows[0].map((h: any) => String(h ?? '').trim());
  const headers = rawHeaders.map(normHeader);

  return rows.slice(1).map(row => {
    const obj: Record<string, any> = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = row[i] ?? '';
    });
    return obj;
  }).filter(o => Object.values(o).some(v => v !== '' && v !== null && v !== undefined));
}

// ---------- Resolve foreign keys (category, brand, seller) ----------
async function resolveOrCreateCategory(name: string, cache: Map<string, string>): Promise<string | null> {
  const key = name.toLowerCase().trim();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key)!;
  const { data } = await supabase.from('categories').select('id').ilike('name', name).limit(1).maybeSingle();
  if (data?.id) { cache.set(key, data.id); return data.id; }
  // Create
  const { data: created } = await supabase.from('categories').insert({ name, slug: slugify(name) }).select('id').maybeSingle();
  if (created?.id) { cache.set(key, created.id); return created.id; }
  return null;
}

async function resolveOrCreateBrand(name: string, cache: Map<string, string>): Promise<string | null> {
  const key = name.toLowerCase().trim();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key)!;
  const { data } = await supabase.from('brands').select('id').ilike('name', name).limit(1).maybeSingle();
  if (data?.id) { cache.set(key, data.id); return data.id; }
  const { data: created } = await supabase.from('brands').insert({ name, slug: slugify(name) }).select('id').maybeSingle();
  if (created?.id) { cache.set(key, created.id); return created.id; }
  return null;
}

async function resolveSeller(name: string, cache: Map<string, string>): Promise<string | null> {
  const key = name.toLowerCase().trim();
  if (!key) return null;
  if (cache.has(key)) return cache.get(key)!;
  const { data } = await supabase.from('sellers').select('id').ilike('name', name).limit(1).maybeSingle();
  if (data?.id) { cache.set(key, data.id); return data.id; }
  return null; // don't auto-create sellers
}

// ---------- Import ----------
export async function importProducts(
  file: File,
  onProgress?: (pct: number, current: number, total: number) => void
): Promise<ImportResult> {
  const rawRows = await parseFile(file);
  const total = rawRows.length;
  const result: ImportResult = { success: 0, failed: 0, errors: [], total };
  if (total === 0) return result;

  const catCache = new Map<string, string>();
  const brandCache = new Map<string, string>();
  const sellerCache = new Map<string, string>();

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    const rowNum = i + 2; // +1 header, +1 1-indexed

    try {
      const name = String(row.name ?? '').trim();
      if (!name) throw new Error('Missing name');

      const price = toNum(row.price);
      if (price === null) throw new Error('Invalid or missing price');

      const slug = (String(row.slug ?? '').trim() || slugify(name));

      const payload: any = {
        name,
        slug,
        description: String(row.description ?? '') || null,
        price,
        original_price: toNum(row.original_price),
        discount: toNum(row.discount) ?? 0,
        stock: Math.max(0, Math.floor(toNum(row.stock) ?? 0)),
        is_active: row.is_active === '' || row.is_active === undefined ? true : toBool(row.is_active),
        is_digital: toBool(row.is_digital),
        is_flash_sale: toBool(row.is_flash_sale),
        is_free_shipping: toBool(row.is_free_shipping),
        is_prime: toBool(row.is_prime),
        images: toImages(row.images),
      };

      if (row.category) payload.category_id = await resolveOrCreateCategory(String(row.category), catCache);
      if (row.brand) payload.brand_id = await resolveOrCreateBrand(String(row.brand), brandCache);
      if (row.seller) payload.seller_id = await resolveSeller(String(row.seller), sellerCache);

      // Upsert by slug
      const { error } = await supabase.from('products').upsert(payload, { onConflict: 'slug' });
      if (error) throw new Error(error.message);
      result.success++;
    } catch (e: any) {
      result.failed++;
      result.errors.push({ row: rowNum, message: e?.message || 'Unknown error' });
    }

    onProgress?.(Math.round(((i + 1) / total) * 100), i + 1, total);
  }

  return result;
}

// ---------- Export ----------
export async function exportProducts(format: 'csv' | 'xlsx'): Promise<number> {
  const { data, error } = await supabase
    .from('products')
    .select('*, categories(name), sellers(name), brands(name)')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);

  const rows = (data || []).map((p: any) => ({
    name: p.name,
    slug: p.slug,
    description: p.description || '',
    price: Number(p.price) || 0,
    original_price: p.original_price ?? '',
    discount: p.discount ?? 0,
    stock: p.stock ?? 0,
    category: p.categories?.name || '',
    brand: p.brands?.name || '',
    seller: p.sellers?.name || '',
    is_active: p.is_active ? 'Yes' : 'No',
    is_digital: p.is_digital ? 'Yes' : 'No',
    is_flash_sale: p.is_flash_sale ? 'Yes' : 'No',
    is_free_shipping: p.is_free_shipping ? 'Yes' : 'No',
    is_prime: p.is_prime ? 'Yes' : 'No',
    images: (p.images || []).join('|'),
    created_at: p.created_at,
  }));

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  const filename = `products-export-${new Date().toISOString().slice(0, 10)}.${format}`;

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(ws);
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    triggerDownload(blob, filename);
  } else {
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    triggerDownload(blob, filename);
  }

  return rows.length;
}

export function downloadTemplate(format: 'csv' | 'xlsx') {
  const sample = [
    {
      name: 'Sample T-Shirt',
      slug: 'sample-t-shirt',
      description: 'Comfortable cotton t-shirt',
      price: 599,
      original_price: 799,
      discount: 25,
      stock: 100,
      category: 'Fashion',
      brand: 'Generic',
      seller: '',
      is_active: 'Yes',
      is_digital: 'No',
      is_flash_sale: 'No',
      is_free_shipping: 'Yes',
      is_prime: 'No',
      images: 'https://example.com/img1.jpg|https://example.com/img2.jpg',
    },
  ];
  const ws = XLSX.utils.json_to_sheet(sample);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Products');

  const filename = `products-template.${format}`;
  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(ws);
    triggerDownload(new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' }), filename);
  } else {
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    triggerDownload(new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), filename);
  }
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
