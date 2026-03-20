import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Truck, Zap, Clock, MapPin, Package, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const shippingOptions = [
  { type: "Standard Delivery", time: "3-5 Business Days", cost: "৳60", free: "Free over ৳999", icon: Truck },
  { type: "Express Delivery", time: "1-2 Business Days", cost: "৳120", free: "Free over ৳2,999", icon: Zap },
  { type: "Same Day Delivery", time: "Within 24 Hours", cost: "৳200", free: "Dhaka city only", icon: Clock },
];

const coverageAreas = [
  { region: "Dhaka Division", standard: "2-3 days", express: "Next day", sameDay: "✓" },
  { region: "Chittagong Division", standard: "3-4 days", express: "1-2 days", sameDay: "✗" },
  { region: "Sylhet Division", standard: "4-5 days", express: "2-3 days", sameDay: "✗" },
  { region: "Rajshahi Division", standard: "4-5 days", express: "2-3 days", sameDay: "✗" },
  { region: "Khulna Division", standard: "4-5 days", express: "2-3 days", sameDay: "✗" },
  { region: "Other Divisions", standard: "5-7 days", express: "3-4 days", sameDay: "✗" },
];

const features = [
  { icon: MapPin, title: "Real-time Tracking", desc: "Track your package at every step from dispatch to delivery" },
  { icon: Package, title: "Safe Packaging", desc: "All items are carefully packed to prevent damage during transit" },
  { icon: ShieldCheck, title: "Delivery Guarantee", desc: "If your package is lost or damaged, we'll replace or refund it" },
];

const faqs = [
  { q: "How do I track my shipment?", a: "Once your order is shipped, you'll receive a tracking number via email and SMS. Use it on our Track Order page to see live updates." },
  { q: "What if I'm not home during delivery?", a: "Our delivery partner will attempt delivery twice. You can also reschedule via the tracking link or contact support." },
  { q: "Do you deliver to all areas in Bangladesh?", a: "Yes, we deliver nationwide. Delivery times vary by location. Same-day delivery is currently available in Dhaka city only." },
  { q: "Can I change my delivery address after ordering?", a: "You can update the address within 2 hours of placing the order via My Orders. After that, contact support for assistance." },
  { q: "Is Cash on Delivery available?", a: "Yes, COD is available for most areas. A small COD fee of ৳20 may apply. Prepaid orders enjoy free shipping benefits sooner." },
];

const ShippingInfo = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <Truck className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Shipping Information</h1>
            <p className="text-primary-foreground/80 max-w-xl mx-auto">Fast, reliable delivery across Bangladesh with real-time tracking</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 space-y-16">
          {/* Shipping Options */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Shipping Options</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {shippingOptions.map((opt) => (
                <Card key={opt.type} className="relative overflow-hidden">
                  <CardContent className="p-6 text-center space-y-4">
                    <div className="w-14 h-14 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                      <opt.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-lg font-bold text-foreground">{opt.type}</h3>
                    <p className="text-2xl font-bold text-accent">{opt.cost}</p>
                    <p className="text-sm text-muted-foreground">{opt.time}</p>
                    <p className="text-xs font-medium text-primary">{opt.free}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Coverage Table */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Delivery Coverage</h2>
            <Card>
              <CardContent className="p-0 overflow-x-auto">
                <table className="w-full min-w-[500px]">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold text-foreground">Region</th>
                      <th className="text-left p-4 font-semibold text-foreground">Standard</th>
                      <th className="text-left p-4 font-semibold text-foreground">Express</th>
                      <th className="text-center p-4 font-semibold text-foreground">Same Day</th>
                    </tr>
                  </thead>
                  <tbody>
                    {coverageAreas.map((area, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-4 font-medium text-foreground">{area.region}</td>
                        <td className="p-4 text-muted-foreground">{area.standard}</td>
                        <td className="p-4 text-muted-foreground">{area.express}</td>
                        <td className="p-4 text-center text-muted-foreground">{area.sameDay}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          {/* Features */}
          <section>
            <div className="grid md:grid-cols-3 gap-6">
              {features.map((f) => (
                <Card key={f.title}>
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 mx-auto flex items-center justify-center">
                      <f.icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Shipping FAQ</h2>
            <Card>
              <CardContent className="p-6">
                <Accordion type="single" collapsible>
                  {faqs.map((f, i) => (
                    <AccordionItem key={i} value={`faq-${i}`}>
                      <AccordionTrigger>{f.q}</AccordionTrigger>
                      <AccordionContent>{f.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </section>

          {/* CTA */}
          <div className="text-center bg-muted rounded-2xl p-8">
            <h3 className="text-xl font-bold text-foreground mb-2">Want to track your order?</h3>
            <p className="text-muted-foreground mb-4">Enter your order number to see real-time updates</p>
            <Link to="/track-order"><Button className="bg-accent text-accent-foreground hover:bg-accent/90">Track Order</Button></Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ShippingInfo;
