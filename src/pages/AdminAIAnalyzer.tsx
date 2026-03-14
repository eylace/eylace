import { useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, Loader2, RefreshCw, TrendingUp, AlertTriangle, Package } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

const AdminAIAnalyzer = () => {
  const [analysis, setAnalysis] = useState('');
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    setLoading(true);
    setAnalysis('');
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-analyzer');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalysis(data.analysis);
      setSummary(data.summary);
      toast.success('AI বিশ্লেষণ সম্পন্ন!');
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
    }
    setLoading(false);
  };

  return (
    <AdminLayout titleKey="AI Product Analyzer" descriptionKey="AI-powered sales analysis">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="h-8 w-8 text-primary" />
            <div>
              <h2 className="text-xl font-bold">AI Product Analyzer</h2>
              <p className="text-sm text-muted-foreground">সেলস ডেটা বিশ্লেষণ ও সুপারিশ</p>
            </div>
          </div>
          <Button onClick={runAnalysis} disabled={loading} className="gap-2">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {loading ? 'বিশ্লেষণ চলছে...' : 'AI বিশ্লেষণ চালান'}
          </Button>
        </div>

        {summary && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <Package className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-2xl font-bold">{summary.totalProducts}</p>
                  <p className="text-xs text-muted-foreground">মোট প্রোডাক্ট</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-[hsl(var(--success))]" />
                <div>
                  <p className="text-2xl font-bold">{summary.totalOrders}</p>
                  <p className="text-xs text-muted-foreground">মোট অর্ডার</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 flex items-center gap-3">
                <AlertTriangle className="h-8 w-8 text-destructive" />
                <div>
                  <p className="text-2xl font-bold">{summary.lowStockProducts?.length || 0}</p>
                  <p className="text-xs text-muted-foreground">লো স্টক প্রোডাক্ট</p>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {analysis ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Brain className="h-5 w-5" /> AI বিশ্লেষণ রিপোর্ট
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <ReactMarkdown>{analysis}</ReactMarkdown>
              </div>
            </CardContent>
          </Card>
        ) : !loading ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Brain className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
              <h3 className="font-semibold text-lg mb-2">AI Product Analyzer</h3>
              <p className="text-muted-foreground text-sm mb-4">
                "AI বিশ্লেষণ চালান" বাটনে ক্লিক করুন। AI আপনার সেলস ডেটা বিশ্লেষণ করে রিপোর্ট তৈরি করবে।
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-16 text-center">
              <Loader2 className="h-12 w-12 mx-auto animate-spin text-primary mb-4" />
              <p className="text-muted-foreground">AI আপনার ডেটা বিশ্লেষণ করছে...</p>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
};

export default AdminAIAnalyzer;
