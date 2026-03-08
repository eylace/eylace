import { useState, useRef } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Upload, Loader2, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const AdminBulkImport = () => {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [results, setResults] = useState<{ success: number; errors: string[] } | null>(null);
  const [progress, setProgress] = useState(0);
  const fileRef = useRef<HTMLInputElement>(null);

  const parseCSV = (text: string): Record<string, string>[] => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return [];
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    return lines.slice(1).map(line => {
      const values = line.match(/(".*?"|[^,]+)/g) || [];
      const obj: Record<string, string> = {};
      headers.forEach((h, i) => { obj[h] = (values[i] || '').trim().replace(/^"|"$/g, ''); });
      return obj;
    });
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResults(null);
    setProgress(0);

    try {
      const text = await file.text();
      const rows = parseCSV(text);
      if (rows.length === 0) { toast.error('No data found in CSV'); setImporting(false); return; }

      let success = 0;
      const errors: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        const slug = (row.slug || row.name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `product-${Date.now()}`;

        try {
          const { error } = await supabase.from('products').insert({
            name: row.name || 'Untitled',
            slug: slug + '-' + i,
            description: row.description || null,
            price: parseFloat(row.price) || 0,
            original_price: row.original_price ? parseFloat(row.original_price) : null,
            stock: row.stock ? parseInt(row.stock) : 0,
            discount: row.discount ? parseInt(row.discount) : 0,
            is_active: row.is_active !== 'false',
            images: row.images ? row.images.split('|').map(s => s.trim()) : [],
          });
          if (error) { errors.push(`Row ${i + 1}: ${error.message}`); } else { success++; }
        } catch (e: any) { errors.push(`Row ${i + 1}: ${e.message}`); }

        setProgress(Math.round(((i + 1) / rows.length) * 100));
      }

      setResults({ success, errors });
      if (success > 0) toast.success(`${success} products imported!`);
      if (errors.length > 0) toast.error(`${errors.length} errors`);
    } catch (e: any) { toast.error('Import failed: ' + e.message); }
    setImporting(false);
  };

  return (
    <AdminLayout title="Bulk Import" description="Import products from CSV file">
      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" />Bulk Import Products</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">Upload a CSV file with columns: name, slug, description, price, original_price, stock, discount, is_active, images (pipe-separated URLs)</p>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>{file ? file.name : 'Choose CSV File'}</Button>
          </div>

          {file && (
            <Button onClick={handleImport} disabled={importing} className="w-full gap-2">
              {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {importing ? `Importing... ${progress}%` : 'Start Import'}
            </Button>
          )}

          {importing && <Progress value={progress} className="h-2" />}

          {results && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>{results.success} products imported successfully</span>
              </div>
              {results.errors.length > 0 && (
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-destructive mb-2">
                    <AlertCircle className="h-4 w-4" />{results.errors.length} errors
                  </div>
                  <div className="max-h-40 overflow-y-auto text-xs text-muted-foreground space-y-1">
                    {results.errors.map((e, i) => <p key={i}>{e}</p>)}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm font-medium mb-2">CSV Template</p>
            <code className="text-xs text-muted-foreground block whitespace-pre-wrap">name,slug,description,price,original_price,stock,discount,is_active,images{'\n'}Example Product,example-product,A great product,29.99,39.99,100,25,true,https://img1.jpg|https://img2.jpg</code>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminBulkImport;
