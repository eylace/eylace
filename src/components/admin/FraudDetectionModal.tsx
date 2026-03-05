import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
  User,
  TrendingUp,
  MapPin,
  Package,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FraudFlag {
  type: string;
  severity: string;
  description: string;
}

interface FraudAnalysis {
  risk_score: number;
  risk_level: string;
  flags: FraudFlag[];
  behavior_summary: string;
  recommendations: string[];
  order_pattern_analysis: {
    avg_order_value: number;
    order_frequency: string;
    common_categories: string[];
    address_consistency: string;
  };
}

interface FraudDetectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: any;
}

export const FraudDetectionModal = ({ open, onOpenChange, order }: FraudDetectionModalProps) => {
  const [analysis, setAnalysis] = useState<FraudAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const runAnalysis = async () => {
    if (!order) return;
    setLoading(true);
    setAnalysis(null);

    try {
      const { data, error } = await supabase.functions.invoke('fraud-check', {
        body: {
          customerEmail: order.profile?.email,
          customerPhone: order.profile?.phone,
          customerName: `${order.profile?.first_name || ''} ${order.profile?.last_name || ''}`.trim(),
          orderHistory: [order], // Pass current order; in a real scenario, pass all orders
        },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }
      setAnalysis(data.analysis);
    } catch (err: any) {
      toast.error('Fraud analysis failed: ' + (err.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-destructive text-destructive-foreground';
      case 'high': return 'bg-destructive/80 text-destructive-foreground';
      case 'medium': return 'bg-[hsl(var(--warning))]/20 text-[hsl(var(--warning))]';
      default: return 'bg-[hsl(var(--success))]/20 text-[hsl(var(--success))]';
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case 'critical':
      case 'high': return <ShieldAlert className="h-5 w-5" />;
      case 'medium': return <AlertTriangle className="h-5 w-5" />;
      default: return <ShieldCheck className="h-5 w-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-destructive border-destructive/30 bg-destructive/10';
      case 'medium': return 'text-[hsl(var(--warning))] border-[hsl(var(--warning))]/30 bg-[hsl(var(--warning))]/10';
      default: return 'text-muted-foreground border-border bg-muted/50';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-accent" />
            Fraud Detection — Order #{order?.order_number}
          </DialogTitle>
        </DialogHeader>

        {/* Customer Info */}
        <Card className="border border-border">
          <CardContent className="p-4">
            <h4 className="font-semibold text-sm mb-3">Customer Information</h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span>{order?.profile?.first_name} {order?.profile?.last_name || 'Unknown'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <span className="truncate">{order?.profile?.email || 'N/A'}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <span>{order?.profile?.phone || 'N/A'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {!analysis && !loading && (
          <div className="text-center py-8">
            <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-4">
              AI-powered fraud analysis will check this customer's behavior patterns, order history, and risk indicators.
            </p>
            <Button onClick={runAnalysis} className="gap-2">
              <ShieldAlert className="h-4 w-4" />
              Run Fraud Analysis
            </Button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-accent mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Analyzing customer behavior with AI...</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-4">
            {/* Risk Score */}
            <Card className="border border-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getRiskIcon(analysis.risk_level)}
                    <div>
                      <h4 className="font-semibold">Risk Assessment</h4>
                      <p className="text-xs text-muted-foreground">{analysis.behavior_summary}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{analysis.risk_score}/100</div>
                    <Badge className={getRiskColor(analysis.risk_level)}>
                      {analysis.risk_level.toUpperCase()}
                    </Badge>
                  </div>
                </div>
                {/* Risk bar */}
                <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      analysis.risk_score > 70 ? 'bg-destructive' :
                      analysis.risk_score > 40 ? 'bg-[hsl(var(--warning))]' : 'bg-[hsl(var(--success))]'
                    }`}
                    style={{ width: `${analysis.risk_score}%` }}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Flags */}
            {analysis.flags.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Risk Flags ({analysis.flags.length})
                </h4>
                <div className="space-y-2">
                  {analysis.flags.map((flag, i) => (
                    <div key={i} className={`p-3 rounded-lg border ${getSeverityColor(flag.severity)}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm capitalize">{flag.type.replace(/_/g, ' ')}</span>
                        <Badge variant="outline" className="text-xs">{flag.severity}</Badge>
                      </div>
                      <p className="text-xs opacity-80">{flag.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Order Pattern */}
            <Card className="border border-border">
              <CardContent className="p-4">
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Order Pattern Analysis
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-muted-foreground">Avg Order Value:</span>
                    <span className="ml-2 font-medium">${analysis.order_pattern_analysis.avg_order_value?.toFixed(2) || '0.00'}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Frequency:</span>
                    <span className="ml-2 font-medium">{analysis.order_pattern_analysis.order_frequency}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Address:</span>
                    <span className="ml-1 font-medium capitalize">{analysis.order_pattern_analysis.address_consistency}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Package className="h-3 w-3 text-muted-foreground" />
                    <span className="text-muted-foreground">Categories:</span>
                    <span className="ml-1 font-medium">{analysis.order_pattern_analysis.common_categories?.join(', ') || 'N/A'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recommendations */}
            {analysis.recommendations?.length > 0 && (
              <div>
                <h4 className="font-semibold text-sm mb-2">Recommendations</h4>
                <ul className="space-y-1.5">
                  {analysis.recommendations.map((rec, i) => (
                    <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                      <span className="text-accent mt-0.5">•</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <Separator />
            <Button onClick={runAnalysis} variant="outline" size="sm" className="gap-2">
              <ShieldAlert className="h-3 w-3" />
              Re-analyze
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
