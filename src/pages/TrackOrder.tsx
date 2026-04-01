import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Package, Search, Truck, CheckCircle, Clock, MapPin, RotateCcw, Copy, Printer } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ReturnReceipt } from "@/components/orders/ReturnReceipt";

const trackingSteps = [
  { icon: CheckCircle, label: "Order Confirmed", desc: "Your order has been placed", time: "Jan 15, 10:30 AM", done: true },
  { icon: Package, label: "Processing", desc: "Order is being prepared", time: "Jan 15, 2:00 PM", done: true },
  { icon: Truck, label: "Shipped", desc: "On the way to delivery hub", time: "Jan 16, 9:00 AM", done: true },
  { icon: MapPin, label: "Out for Delivery", desc: "Arriving today", time: "Jan 17, 8:00 AM", done: false },
  { icon: CheckCircle, label: "Delivered", desc: "Package delivered", time: "", done: false },
];

const returnStepDefs = [
  { key: 'pending', label: 'Requested', icon: RotateCcw },
  { key: 'approved', label: 'Approved', icon: CheckCircle },
  { key: 'refunded', label: 'Refunded', icon: CheckCircle },
];

const returnStepDefsRejected = [
  { key: 'pending', label: 'Requested', icon: RotateCcw },
  { key: 'approved', label: 'Under Review', icon: Clock },
  { key: 'rejected', label: 'Rejected', icon: Package },
];

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning',
  approved: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  refunded: 'bg-primary/10 text-primary',
};

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [searched, setSearched] = useState(false);
  const [returnTrackingNumber, setReturnTrackingNumber] = useState("");
  const [returnSearched, setReturnSearched] = useState(false);
  const [returnData, setReturnData] = useState<any>(null);
  const [returnLoading, setReturnLoading] = useState(false);
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) setSearched(true);
  };

  const handleReturnSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnTrackingNumber.trim()) return;
    setReturnLoading(true);
    setReturnSearched(false);
    setReturnData(null);

    const { data, error } = await supabase.rpc('lookup_return_by_tracking', {
      tracking_number: returnTrackingNumber.trim()
    });

    setReturnLoading(false);
    if (error || !data || (Array.isArray(data) && data.length === 0)) {
      setReturnSearched(true);
      toast.error('No return found with that tracking number');
      return;
    }

    const result = Array.isArray(data) ? data[0] : data;
    setReturnData(result);
    setReturnSearched(true);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <Truck className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Track Your Order or Return</h1>
            <p className="text-primary-foreground/80">Enter your order or return tracking number to see real-time updates</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
          <Tabs defaultValue="order" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="order" className="gap-2"><Package className="h-4 w-4" /> Track Order</TabsTrigger>
              <TabsTrigger value="return" className="gap-2"><RotateCcw className="h-4 w-4" /> Track Return</TabsTrigger>
            </TabsList>

            {/* Track Order Tab */}
            <TabsContent value="order" className="space-y-6 mt-6">
              <form onSubmit={handleSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="e.g. ORD-2024-XXXXX"
                    className="pl-12 h-12"
                    value={orderNumber}
                    onChange={(e) => { setOrderNumber(e.target.value); setSearched(false); }}
                  />
                </div>
                <Button type="submit" className="h-12 px-8">Track</Button>
              </form>

              {searched && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      Order #{orderNumber}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Estimated delivery: January 17, 2025</p>
                  </CardHeader>
                  <CardContent>
                    <div className="relative ml-4">
                      {trackingSteps.map((step, i) => (
                        <div key={i} className="flex gap-4 pb-8 last:pb-0 relative">
                          {i < trackingSteps.length - 1 && (
                            <div className={`absolute left-[15px] top-8 w-0.5 h-full ${step.done ? "bg-primary" : "bg-border"}`} />
                          )}
                          <div className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${step.done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                            <step.icon className="h-4 w-4" />
                          </div>
                          <div>
                            <p className={`font-medium ${step.done ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                            <p className="text-sm text-muted-foreground">{step.desc}</p>
                            {step.time && <p className="text-xs text-muted-foreground mt-1">{step.time}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {!searched && (
                <div className="text-center space-y-6">
                  <Card>
                    <CardContent className="p-8 space-y-4">
                      <Clock className="h-16 w-16 text-muted-foreground/30 mx-auto" />
                      <h3 className="text-lg font-semibold text-foreground">Enter your order number above</h3>
                      <p className="text-muted-foreground">You can find your order number in the confirmation email or in your account's order history.</p>
                      {user ? (
                        <Link to="/orders">
                          <Button variant="outline" className="mt-2">View My Orders</Button>
                        </Link>
                      ) : (
                        <Link to="/auth">
                          <Button variant="outline" className="mt-2">Sign in to view orders</Button>
                        </Link>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            {/* Track Return Tab */}
            <TabsContent value="return" className="space-y-6 mt-6">
              <form onSubmit={handleReturnSearch} className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    placeholder="e.g. RTN-20260401-XXXXXX"
                    className="pl-12 h-12"
                    value={returnTrackingNumber}
                    onChange={(e) => { setReturnTrackingNumber(e.target.value); setReturnSearched(false); setReturnData(null); }}
                  />
                </div>
                <Button type="submit" className="h-12 px-8" disabled={returnLoading}>
                  {returnLoading ? 'Searching...' : 'Track'}
                </Button>
              </form>

              {returnSearched && returnData && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        <RotateCcw className="h-5 w-5 text-accent" />
                        Return {returnData.return_tracking_number}
                      </CardTitle>
                      <Badge variant="outline" className={cn('capitalize text-xs', statusColors[returnData.status] || '')}>
                        {returnData.status}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Return Status Timeline */}
                    {(() => {
                      const isRejected = returnData.status === 'rejected';
                      const steps = isRejected ? returnStepDefsRejected : returnStepDefs;
                      const stepKeys = steps.map(s => s.key);
                      const currentIdx = stepKeys.indexOf(returnData.status);
                      return (
                        <div className="relative ml-4">
                          {steps.map((step, i) => {
                            const isActive = i <= currentIdx;
                            const StepIcon = step.icon;
                            return (
                              <div key={step.key} className="flex gap-4 pb-8 last:pb-0 relative">
                                {i < steps.length - 1 && (
                                  <div className={cn('absolute left-[15px] top-8 w-0.5 h-full', isActive && i < currentIdx ? 'bg-accent' : 'bg-border')} />
                                )}
                                <div className={cn(
                                  'relative z-10 w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                                  isRejected && step.key === 'rejected' ? 'bg-destructive text-destructive-foreground' :
                                  isActive ? 'bg-accent text-accent-foreground' : 'bg-muted text-muted-foreground'
                                )}>
                                  <StepIcon className="h-4 w-4" />
                                </div>
                                <div>
                                  <p className={cn('font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>{step.label}</p>
                                  {step.key === 'pending' && returnData.created_at && (
                                    <p className="text-xs text-muted-foreground">{format(new Date(returnData.created_at), 'MMM d, yyyy h:mm a')}</p>
                                  )}
                                  {step.key === returnData.status && returnData.updated_at && step.key !== 'pending' && (
                                    <p className="text-xs text-muted-foreground">{format(new Date(returnData.updated_at), 'MMM d, yyyy h:mm a')}</p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })()}

                    {/* Return Details */}
                    <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Reason</span>
                        <span className="font-medium">{returnData.reason}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Refund Method</span>
                        <span className="font-medium capitalize">{returnData.refund_method || 'Original Payment'}</span>
                      </div>
                      {returnData.refund_amount > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Refund Amount</span>
                          <span className="font-bold text-success">৳{Number(returnData.refund_amount).toFixed(2)}</span>
                        </div>
                      )}
                      {returnData.resolved_at && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Resolved</span>
                          <span className="font-medium">{format(new Date(returnData.resolved_at), 'MMM d, yyyy')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={() => { navigator.clipboard.writeText(returnData.return_tracking_number); toast.success('Copied!'); }}>
                        <Copy className="h-3.5 w-3.5" /> Copy RTN
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}

              {returnSearched && !returnData && (
                <Card>
                  <CardContent className="p-8 text-center space-y-4">
                    <RotateCcw className="h-16 w-16 text-muted-foreground/30 mx-auto" />
                    <h3 className="text-lg font-semibold text-foreground">No return found</h3>
                    <p className="text-muted-foreground">Please check your return tracking number and try again.</p>
                  </CardContent>
                </Card>
              )}

              {!returnSearched && (
                <Card>
                  <CardContent className="p-8 text-center space-y-4">
                    <RotateCcw className="h-16 w-16 text-muted-foreground/30 mx-auto" />
                    <h3 className="text-lg font-semibold text-foreground">Enter your return tracking number</h3>
                    <p className="text-muted-foreground">You can find your Return Tracking Number (RTN) in your account dashboard under Returns & Cancellations, or on your Return Acknowledgement Receipt.</p>
                    {user ? (
                      <Link to="/account?tab=returns">
                        <Button variant="outline" className="mt-2">View My Returns</Button>
                      </Link>
                    ) : (
                      <Link to="/auth">
                        <Button variant="outline" className="mt-2">Sign in to view returns</Button>
                      </Link>
                    )}
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
};

export default TrackOrder;
