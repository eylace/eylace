import { Layout } from "@/components/layout/Layout";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HelpCircle, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Link } from "react-router-dom";
import { SeoHead } from "@/components/seo/SeoHead";

type FAQItem = { q: string; a: string; cat: string };

const allFaqs: FAQItem[] = [
  // Orders
  { q: "How do I place an order?", a: "Browse products, add to cart, proceed to checkout, enter shipping details, choose payment method, and confirm your order.", cat: "orders" },
  { q: "Can I cancel my order?", a: "You can cancel within 24 hours of placing the order from My Orders page. After processing begins, cancellation may not be possible.", cat: "orders" },
  { q: "How do I track my order?", a: "Go to the Track Order page and enter your order number. You can also check My Orders in your account for real-time updates.", cat: "orders" },
  { q: "Can I modify my order after placing it?", a: "Order modifications (address, quantity) are possible within 2 hours of placing the order. Contact support for assistance.", cat: "orders" },
  // Payment
  { q: "What payment methods do you accept?", a: "We accept bKash, Nagad, Rocket, credit/debit cards (Visa, Mastercard), and Cash on Delivery (COD).", cat: "payment" },
  { q: "Is Cash on Delivery available?", a: "Yes, COD is available for most areas in Bangladesh. A COD fee of ৳20 may apply.", cat: "payment" },
  { q: "Is my payment information secure?", a: "Absolutely. All payments are processed through secure, encrypted gateways. We never store your card details.", cat: "payment" },
  // Shipping
  { q: "How long does delivery take?", a: "Standard delivery: 3-5 business days. Express: 1-2 days. Same-day delivery is available in Dhaka city.", cat: "shipping" },
  { q: "Do you deliver outside Dhaka?", a: "Yes, we deliver nationwide across Bangladesh. Delivery times vary by location.", cat: "shipping" },
  { q: "How much does shipping cost?", a: "Standard shipping is ৳60 (free over ৳999). Express is ৳120 (free over ৳2,999). Same-day is ৳200.", cat: "shipping" },
  // Returns
  { q: "What is your return policy?", a: "We offer a 7-day return policy. Items must be unused, in original packaging, and with all tags/accessories.", cat: "returns" },
  { q: "How do I return an item?", a: "Go to My Orders → select the order → click 'Return'. Pack the item and schedule a pickup or drop it off.", cat: "returns" },
  { q: "How long do refunds take?", a: "Refunds are processed within 1-2 days for mobile wallets, 5-7 days for cards, and instant for store credit.", cat: "returns" },
  // Account
  { q: "How do I create an account?", a: "Click Sign Up, enter your email and password, verify your email, and you're all set!", cat: "account" },
  { q: "I forgot my password. What do I do?", a: "Click 'Forgot Password' on the login page. Enter your email and follow the reset link sent to your inbox.", cat: "account" },
  { q: "How do I update my profile?", a: "Go to Account → Settings to update your name, email, phone, and delivery address.", cat: "account" },
];

const categories = [
  { value: "all", label: "All" },
  { value: "orders", label: "Orders" },
  { value: "payment", label: "Payment" },
  { value: "shipping", label: "Shipping" },
  { value: "returns", label: "Returns" },
  { value: "account", label: "Account" },
];

const FAQ = () => {
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("all");

  const filtered = allFaqs.filter((f) => {
    const matchesTab = activeTab === "all" || f.cat === activeTab;
    const matchesSearch = f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <Layout>
      <SeoHead
        title="FAQ — Orders, Payment, Shipping & Returns | Eylace"
        description="Answers to common questions about ordering, payment methods, delivery, returns and your Eylace account in Bangladesh."
        path="/faq"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: allFaqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }}
      />
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <HelpCircle className="h-12 w-12 mx-auto mb-4" />
            <h1 className="text-3xl md:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-primary-foreground/80 mb-8">Find quick answers to common questions</p>
            <div className="relative max-w-lg mx-auto">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search questions..."
                className="pl-12 h-12 bg-card text-card-foreground border-0"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 max-w-3xl space-y-8">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="flex flex-wrap h-auto gap-1">
              {categories.map((cat) => (
                <TabsTrigger key={cat.value} value={cat.value}>{cat.label}</TabsTrigger>
              ))}
            </TabsList>

            <TabsContent value={activeTab} className="mt-6">
              <Card>
                <CardContent className="p-6">
                  {filtered.length > 0 ? (
                    <Accordion type="single" collapsible>
                      {filtered.map((f, i) => (
                        <AccordionItem key={i} value={`faq-${i}`}>
                          <AccordionTrigger>{f.q}</AccordionTrigger>
                          <AccordionContent>{f.a}</AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No questions found. Try a different search or category.</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* CTA */}
          <div className="text-center bg-muted rounded-2xl p-8">
            <h3 className="text-xl font-bold text-foreground mb-2">Didn't find your answer?</h3>
            <p className="text-muted-foreground mb-4">Our support team is here to help you</p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link to="/help"><Button className="bg-accent text-accent-foreground hover:bg-accent/90">Help Center</Button></Link>
              <Link to="/seller-support"><Button variant="outline">Contact Support</Button></Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default FAQ;
