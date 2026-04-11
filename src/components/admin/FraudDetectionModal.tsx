import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

import { Progress } from '@/components/ui/progress';
import {
  ShieldAlert, ShieldCheck, AlertTriangle, Loader2, Mail, Phone, User, TrendingUp, MapPin, Package,
  CheckCircle, XCircle, RefreshCw, Clock, Eye,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface FraudFlag { type: string; severity: string; description: string; }
interface FraudAnalysis {
  risk_score: number; risk_level: string; flags: FraudFlag[]; behavior_summary: string;
  recommendations: string[];
  order_pattern_analysis: { avg_order_value: number; order_frequency: string; common_categories: string[]; address_consistency: string; };
}

interface FraudDetectionModalProps { open: boolean; onOpenChange: (open: boolean) => void; order: any; }

export const FraudDetectionModal = ({ open, onOpenChange, order }: FraudDetectionModalProps) => {
  const [analysis, setAnalysis] = useState<FraudAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);

  const runAnalysis = async () => {
    if (!order) return;
    setLoading(true);
    setAnalysis(null);
    setStep(1);

    const steps = ['Gathering customer data...', 'Analyzing behavior patterns...', 'Cross-referencing databases...', 'Generating risk report...'];
    const interval = setInterval(() => setStep(s => Math.min(s + 1, steps.length)), 1200);

    try {
      const { data, error } = await supabase.functions.invoke('fraud-check', {
        body: {
          customerEmail: order.profile?.email,
          customerPhone: order.profile?.phone,
          customerName: `${order.profile?.first_name || ''} ${order.profile?.last_name || ''}`.trim(),
          orderHistory: [order],
        },
      });
      clearInterval(interval);
      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }
      setAnalysis(data.analysis);
    } catch (err: any) {
      clearInterval(interval);
      toast.error('Fraud analysis failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
      setStep(0);
    }
  };

  const getRiskGradient = (score: number) => {
    if (score > 70) return 'from-red-500 to-red-600';
    if (score > 40) return 'from-yellow-500 to-orange-500';
    return 'from-green-500 to-emerald-500';
  };

  const getSeverityStyles = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-l-4 border-l-red-500 bg-red-500/5';
      case 'medium': return 'border-l-4 border-l-yellow-500 bg-yellow-500/5';
      default: return 'border-l-4 border-l-blue-500 bg-blue-500/5';
    }
  };

  const analysisSteps = ['Gathering customer data...', 'Analyzing behavior patterns...', 'Cross-referencing databases...', 'Generating risk report...'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <ShieldAlert className="h-4 w-4 text-accent" />
                </div>
                <div>
                  <span className="text-base">Fraud Detection</span>
                  <span className="text-xs text-muted-foreground ml-2">#{order?.order_number}</span>
                </div>
              </div>
              {analysis && (
                <div className={cn('px-3 py-1 rounded-full text-xs font-bold text-white bg-gradient-to-r', getRiskGradient(analysis.risk_score))}>
                  Score: {analysis.risk_score}/100
                </div>
              )}
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 pb-6 space-y-5">
          {/* Customer Card */}
          <Card className="border border-border overflow-hidden">
            <CardContent className="p-0">
              <div className="bg-muted/30 p-4">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                    {(order?.profile?.first_name?.[0] || 'U').toUpperCase()}
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="font-medium">{order?.profile?.first_name} {order?.profile?.last_name || 'Unknown'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="truncate text-muted-foreground">{order?.profile?.email || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{order?.profile?.phone || order?.shipping_address?.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-muted-foreground">{order?.created_at ? format(new Date(order.created_at), 'PPp') : 'N/A'}</span>
                    </div>
                  </div>
                </div>
              </div>
              {/* Order quick info */}
              <div className="p-3 flex items-center justify-between text-sm border-t">
                <div className="flex items-center gap-4">
                  <span className="text-muted-foreground">Amount: <span className="font-bold text-foreground">${order?.total?.toFixed(2)}</span></span>
                  <span className="text-muted-foreground">Payment: <Badge variant="outline" className="text-[10px]">{order?.payment_method?.toUpperCase()}</Badge></span>
                </div>
                <span className="text-muted-foreground">Items: {order?.items?.length || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Before Analysis */}
          {!analysis && !loading && (
            <div className="text-center py-10">
              <div className="h-16 w-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
                <ShieldAlert className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">AI-Powered Fraud Analysis</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
                Analyze customer behavior patterns, order history, address consistency, and risk indicators using AI.
              </p>
              <Button onClick={runAnalysis} size="lg" className="gap-2 px-8">
                <ShieldAlert className="h-4 w-4" />
                Run Analysis
              </Button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="py-8 space-y-6">
              <div className="flex items-center justify-center gap-3">
                <Loader2 className="h-6 w-6 animate-spin text-accent" />
                <span className="text-sm font-medium text-foreground">Analyzing...</span>
              </div>
              <div className="space-y-3 max-w-sm mx-auto">
                {analysisSteps.map((s, i) => (
                  <div key={i} className={cn("flex items-center gap-3 text-sm transition-all duration-300", i < step ? "text-foreground" : "text-muted-foreground/40")}>
                    {i < step ? <CheckCircle className="h-4 w-4 text-green-500 shrink-0" /> : i === step ? <Loader2 className="h-4 w-4 animate-spin text-accent shrink-0" /> : <div className="h-4 w-4 rounded-full border border-muted-foreground/20 shrink-0" />}
                    <span>{s}</span>
                  </div>
                ))}
              </div>
              <Progress value={(step / analysisSteps.length) * 100} className="max-w-sm mx-auto" />
            </div>
          )}

          {/* Results */}
          {analysis && (
            <div className="space-y-4">
              {/* Risk Score Card */}
              <Card className="border-0 overflow-hidden">
                <div className={cn('p-5 text-white bg-gradient-to-r', getRiskGradient(analysis.risk_score))}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {analysis.risk_score > 70 ? <ShieldAlert className="h-8 w-8" /> :
                       analysis.risk_score > 40 ? <AlertTriangle className="h-8 w-8" /> :
                       <ShieldCheck className="h-8 w-8" />}
                      <div>
                        <h4 className="font-bold text-lg">Risk Level: {analysis.risk_level.toUpperCase()}</h4>
                        <p className="text-sm opacity-90">{analysis.behavior_summary}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-4xl font-black">{analysis.risk_score}</div>
                      <div className="text-xs opacity-75">/ 100</div>
                    </div>
                  </div>
                  <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-white/60 rounded-full transition-all duration-1000" style={{ width: `${analysis.risk_score}%` }} />
                  </div>
                </div>
              </Card>

              {/* Flags */}
              {analysis.flags.length > 0 && (
                <div>
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" /> Risk Flags ({analysis.flags.length})
                  </h4>
                  <div className="space-y-2">
                    {analysis.flags.map((flag, i) => (
                      <div key={i} className={cn('p-3 rounded-lg', getSeverityStyles(flag.severity))}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-semibold text-sm capitalize">{flag.type.replace(/_/g, ' ')}</span>
                          <Badge variant={flag.severity === 'high' ? 'destructive' : 'outline'} className="text-[10px]">{flag.severity}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{flag.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pattern Analysis */}
              <Card className="border border-border">
                <CardContent className="p-4">
                  <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><TrendingUp className="h-4 w-4" /> Order Pattern</h4>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { label: 'Avg Order', value: `৳${analysis.order_pattern_analysis.avg_order_value?.toFixed(2) || '0.00'}`, icon: TrendingUp },
                      { label: 'Frequency', value: analysis.order_pattern_analysis.order_frequency || 'N/A', icon: Clock },
                      { label: 'Address', value: analysis.order_pattern_analysis.address_consistency || 'N/A', icon: MapPin },
                      { label: 'Categories', value: analysis.order_pattern_analysis.common_categories?.join(', ') || 'N/A', icon: Package },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 bg-muted/30 rounded-lg">
                        <item.icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
                        <div>
                          <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{item.label}</p>
                          <p className="text-sm font-medium capitalize">{item.value}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations */}
              {analysis.recommendations?.length > 0 && (
                <Card className="border border-border">
                  <CardContent className="p-4">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2"><Eye className="h-4 w-4" /> Recommendations</h4>
                    <div className="space-y-2">
                      {analysis.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <CheckCircle className="h-3.5 w-3.5 text-accent mt-0.5 shrink-0" />
                          <span className="text-muted-foreground">{rec}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <Button onClick={runAnalysis} variant="outline" size="sm" className="gap-2 flex-1">
                  <RefreshCw className="h-3.5 w-3.5" /> Re-analyze
                </Button>
                <Button variant="outline" size="sm" className="gap-2 flex-1 text-green-600 hover:text-green-700" onClick={() => { toast.success('Order cleared'); onOpenChange(false); }}>
                  <CheckCircle className="h-3.5 w-3.5" /> Clear Order
                </Button>
                <Button variant="destructive" size="sm" className="gap-2 flex-1" onClick={() => { toast.success('Order flagged'); onOpenChange(false); }}>
                  <XCircle className="h-3.5 w-3.5" /> Block Order
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
