import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { RotateCcw, Clock, ShieldCheck, CreditCard, PackageOpen, Truck, CheckCircle, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const policyCards = [
  { icon: Clock, title: "7-Day Returns", desc: "Return eligible items within 7 days of delivery" },
  { icon: ShieldCheck, title: "Quality Guaranteed", desc: "Full refund for damaged or defective products" },
  { icon: CreditCard, title: "Fast Refunds", desc: "Refunds processed within 3-7 business days" },
  { icon: RotateCcw, title: "Easy Process", desc: "Simple 4-step return process from your account" },
];

const returnSteps = [
  { icon: FileText, title: "Submit Request", desc: "Go to My Orders, select the item and click 'Return'" },
  { icon: PackageOpen, title: "Pack the Item", desc: "Pack the product in its original packaging with all accessories" },
  { icon: Truck, title: "Ship or Drop-off", desc: "Schedule a pickup or drop off at the nearest collection point" },
  { icon: CheckCircle, title: "Get Refund", desc: "Refund is initiated once we receive and inspect the item" },
];

const refundTimeline = [
  { method: "bKash / Nagad / Rocket", time: "1-2 business days" },
  { method: "Credit / Debit Card", time: "5-7 business days" },
  { method: "Bank Transfer", time: "5-10 business days" },
  { method: "Store Credit", time: "Instant" },
];

const faqs = [
  { q: "Which items are non-returnable?", a: "Perishable goods, intimate apparel, customized products, digital downloads, and items marked as 'Final Sale' cannot be returned." },
  { q: "What if I received a damaged item?", a: "Contact us within 48 hours with photos. We'll arrange a free return pickup and issue a full refund or replacement." },
  { q: "Can I exchange instead of return?", a: "Yes, you can request an exchange for the same item in a different size or color, subject to availability." },
  { q: "Who pays for return shipping?", a: "For defective or wrong items, return shipping is free. For change-of-mind returns, a small shipping fee may apply." },
  { q: "How do I check my refund status?", a: "Go to My Orders → select the returned order → view refund status. You'll also receive email notifications." },
];

const ReturnsRefunds = () => {
  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center">
            <RotateCcw className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Returns & Refunds</h1>
            <p className="text-primary-foreground/80 max-w-xl mx-auto">Easy returns, fast refunds. Your satisfaction is our priority.</p>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 space-y-16">
          {/* Policy Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {policyCards.map((p) => (
              <Card key={p.title}>
                <CardContent className="p-6 text-center space-y-3">
                  <div className="w-12 h-12 rounded-full bg-primary/10 mx-auto flex items-center justify-center">
                    <p.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="font-semibold text-foreground">{p.title}</h3>
                  <p className="text-sm text-muted-foreground">{p.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Return Process */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6 text-center">How to Return an Item</h2>
            <div className="grid md:grid-cols-4 gap-6">
              {returnSteps.map((step, i) => (
                <div key={i} className="text-center space-y-3">
                  <div className="w-14 h-14 rounded-full bg-accent/10 mx-auto flex items-center justify-center relative">
                    <step.icon className="h-7 w-7 text-accent" />
                    <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-accent text-accent-foreground text-xs font-bold flex items-center justify-center">{i + 1}</span>
                  </div>
                  <h3 className="font-semibold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Refund Timeline */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Refund Timeline</h2>
            <Card>
              <CardContent className="p-0">
                <table className="w-full">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-4 font-semibold text-foreground">Payment Method</th>
                      <th className="text-left p-4 font-semibold text-foreground">Refund Time</th>
                    </tr>
                  </thead>
                  <tbody>
                    {refundTimeline.map((r, i) => (
                      <tr key={i} className="border-b last:border-0">
                        <td className="p-4 text-foreground">{r.method}</td>
                        <td className="p-4 text-muted-foreground">{r.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </section>

          {/* FAQ */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
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
            <h3 className="text-xl font-bold text-foreground mb-2">Need more help?</h3>
            <p className="text-muted-foreground mb-4">Our support team is ready to assist you</p>
            <Link to="/help"><Button className="bg-accent text-accent-foreground hover:bg-accent/90">Contact Support</Button></Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ReturnsRefunds;
