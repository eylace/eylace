import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Package, Search, Truck, CheckCircle, Clock, MapPin } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const trackingSteps = [
  { icon: CheckCircle, label: "Order Confirmed", desc: "Your order has been placed", time: "Jan 15, 10:30 AM", done: true },
  { icon: Package, label: "Processing", desc: "Order is being prepared", time: "Jan 15, 2:00 PM", done: true },
  { icon: Truck, label: "Shipped", desc: "On the way to delivery hub", time: "Jan 16, 9:00 AM", done: true },
  { icon: MapPin, label: "Out for Delivery", desc: "Arriving today", time: "Jan 17, 8:00 AM", done: false },
  { icon: CheckCircle, label: "Delivered", desc: "Package delivered", time: "", done: false },
];

const TrackOrder = () => {
  const [orderNumber, setOrderNumber] = useState("");
  const [searched, setSearched] = useState(false);
  const { user } = useAuth();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (orderNumber.trim()) setSearched(true);
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <Truck className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Track Your Order</h1>
            <p className="text-primary-foreground/80 mb-8">Enter your order number to see real-time delivery updates</p>
            <form onSubmit={handleSearch} className="flex gap-3 max-w-lg mx-auto">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="e.g. ORD-2024-XXXXX"
                  className="pl-12 h-12 bg-card text-card-foreground border-0"
                  value={orderNumber}
                  onChange={(e) => { setOrderNumber(e.target.value); setSearched(false); }}
                />
              </div>
              <Button type="submit" className="h-12 px-8 bg-accent text-accent-foreground hover:bg-accent/90">Track</Button>
            </form>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
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

              <div className="grid md:grid-cols-3 gap-4">
                {[
                  { title: "Order Confirmation", desc: "Check your email for the order number sent right after purchase." },
                  { title: "Account History", desc: "Sign in and go to My Orders to see all your past and current orders." },
                  { title: "Need Help?", desc: "Contact our support team if you can't find your order details." },
                ].map((tip) => (
                  <Card key={tip.title}>
                    <CardContent className="p-6 text-center">
                      <h4 className="font-semibold text-foreground mb-2">{tip.title}</h4>
                      <p className="text-sm text-muted-foreground">{tip.desc}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default TrackOrder;
