import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Upload, Download, FileText, Loader2, CheckCircle, AlertCircle, FileSpreadsheet } from 'lucide-react';
import { toast } from 'sonner';
import { importProducts, exportProducts, downloadTemplate, type ImportResult } from '@/lib/productImportExport';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported?: () => void;
}

export const ProductImportExportModal = ({ open, onOpenChange, onImported }: Props) => {
  const [tab, setTab] = useState<'import' | 'export'>('import');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    setFile(f);
    setResult(null);
    setProgress(0);
  };

  const handleImport = async () => {
    if (!file) return;
    setImporting(true);
    setResult(null);
    setProgress(0);
    try {
      const res = await importProducts(file, (pct, cur, total) => {
        setProgress(pct);
        setProgressText(`${cur} / ${total}`);
      });
      setResult(res);
      if (res.success > 0) toast.success(`${res.success} products imported successfully`);
      if (res.failed > 0) toast.error(`${res.failed} rows failed`);
      onImported?.();
    } catch (e: any) {
      toast.error('Import failed: ' + (e?.message || 'Unknown error'));
    }
    setImporting(false);
  };

  const handleExport = async (format: 'csv' | 'xlsx') => {
    setExporting(true);
    try {
      const count = await exportProducts(format);
      toast.success(`${count} products exported as ${format.toUpperCase()}`);
    } catch (e: any) {
      toast.error('Export failed: ' + (e?.message || 'Unknown error'));
    }
    setExporting(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import / Export Products</DialogTitle>
          <DialogDescription>Bulk manage products with CSV or Excel files</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import"><Upload className="h-4 w-4 mr-1.5" />Import</TabsTrigger>
            <TabsTrigger value="export"><Download className="h-4 w-4 mr-1.5" />Export</TabsTrigger>
          </TabsList>

          {/* IMPORT */}
          <TabsContent value="import" className="space-y-4 mt-4">
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-3">
                Upload a CSV or Excel file (.csv, .xlsx, .xls)
              </p>
              <input
                ref={fileRef}
                type="file"
                accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] || null)}
              />
              <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={importing}>
                {file ? file.name : 'Choose File'}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 text-xs">
              <Button variant="ghost" size="sm" onClick={() => downloadTemplate('csv')} className="h-8">
                <Download className="h-3 w-3 mr-1" />CSV Template
              </Button>
              <Button variant="ghost" size="sm" onClick={() => downloadTemplate('xlsx')} className="h-8">
                <Download className="h-3 w-3 mr-1" />Excel Template
              </Button>
            </div>

            {file && (
              <Button onClick={handleImport} disabled={importing} className="w-full gap-2">
                {importing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {importing ? `Importing ${progressText}... ${progress}%` : 'Start Import'}
              </Button>
            )}

            {importing && <Progress value={progress} className="h-2" />}

            {result && (
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 p-2 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400">
                  <CheckCircle className="h-4 w-4" />
                  <span>{result.success} of {result.total} imported</span>
                </div>
                {result.failed > 0 && (
                  <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                      <AlertCircle className="h-4 w-4" />
                      {result.failed} failed
                    </div>
                    <div className="max-h-40 overflow-y-auto text-xs space-y-1">
                      {result.errors.slice(0, 50).map((e, i) => (
                        <p key={i} className="text-muted-foreground">Row {e.row}: {e.message}</p>
                      ))}
                      {result.errors.length > 50 && (
                        <p className="text-muted-foreground italic">…and {result.errors.length - 50} more</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="rounded-lg bg-muted/40 p-3 text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Supported columns:</p>
              <p>name*, slug, description, price*, original_price, discount, stock, category, brand, seller, is_active, is_digital, is_flash_sale, is_free_shipping, is_prime, images (pipe-separated URLs)</p>
              <p className="mt-1">* required. Existing products are matched by slug and updated.</p>
            </div>
          </TabsContent>

          {/* EXPORT */}
          <TabsContent value="export" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handleExport('csv')}
                disabled={exporting}
                className="border-2 border-border rounded-lg p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                <FileText className="h-10 w-10 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">CSV Format</p>
                <p className="text-xs text-muted-foreground mt-1">Universal, lightweight</p>
              </button>
              <button
                onClick={() => handleExport('xlsx')}
                disabled={exporting}
                className="border-2 border-border rounded-lg p-6 text-center hover:border-primary hover:bg-primary/5 transition-colors disabled:opacity-50"
              >
                <FileSpreadsheet className="h-10 w-10 text-primary mx-auto mb-2" />
                <p className="font-medium text-sm">Excel Format</p>
                <p className="text-xs text-muted-foreground mt-1">.xlsx with formatting</p>
              </button>
            </div>
            {exporting && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Exporting...
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Exports include all product fields: name, slug, pricing, stock, category, brand, seller, status flags, and image URLs.
            </p>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};
