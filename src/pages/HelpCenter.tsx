import { Layout } from "@/components/layout/Layout";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, ShoppingBag, CreditCard, Truck, RotateCcw, User, Store, Mail, Phone, MessageCircle } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";

const categories = [
  { icon: ShoppingBag, title: "Orders", desc: "Track, cancel or return orders", link: "/track-order" },
  { icon: CreditCard, title: "Payments", desc: "Payment methods, refunds & billing", link: "/faq" },
  { icon: Truck, title: "Shipping", desc: "Delivery times, costs & tracking", link: "/shipping" },
  { icon: RotateCcw, title: "Returns", desc: "Return policy & refund process", link: "/returns" },
  { icon: User, title: "Account", desc: "Profile, password & preferences", link: "/settings" },
  { icon: Store, title: "Seller", desc: "Become a seller, policies & support", link: "/seller-center" },
];

const popularQuestions = [
  { q: "How do I track my order?", a: "Go to 'Track Order' page or visit My Orders in your account. Enter your order number to see real-time status updates." },
  { q: "What is the return policy?", a: "We offer a 7-day return policy for most items. Products must be unused and in original packaging. Visit our Returns & Refunds page for details." },
  { q: "How long does delivery take?", a: "Standard delivery takes 3-5 business days. Express delivery is available for 1-2 day shipping at an additional cost." },
  { q: "How do I cancel an order?", a: "You can cancel an order within 24 hours of placing it from your Orders page. After that, you may need to initiate a return." },
  { q: "What payment methods are accepted?", a: "We accept bKash, Nagad, Rocket, credit/debit cards, and cash on delivery." },
];

const contactChannels = [
  { icon: Mail, title: "Email Support", desc: "support@eylace.com", sub: "Response within 24 hours" },
  { icon: Phone, title: "Phone Support", desc: "+880 1XXX-XXXXXX", sub: "Sat-Thu, 9AM - 9PM" },
  { icon: MessageCircle, title: "Live Chat", desc: "Chat with our team", sub: "Available 24/7" },
];

const HelpCenter = () => {
  const [search, setSearch] = useState("");

  const filteredQuestions = popularQuestions.filter(
    (q) => q.q.toLowerCase().includes(search.toLowerCase()) || q.a.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        {/* Hero */}
        <div className="bg-primary text-primary-foreground py-16">
          <div className="container mx-auto px-4 text-center max-w-2xl">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">How can we help you?</h1>
            <p className="text-primary-foreground/80 mb-8">Search our help center or browse categories below</p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Search for help topics..."
                className="pl-12 h-12 bg-card text-card-foreground border-0 text-base"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-12 space-y-16">
          {/* Categories */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <Link key={cat.title} to={cat.link}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer h-full">
                    <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <cat.icon className="h-6 w-6 text-primary" />
                      </div>
                      <h3 className="font-semibold text-foreground">{cat.title}</h3>
                      <p className="text-sm text-muted-foreground">{cat.desc}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Popular Questions */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Popular Questions</h2>
            <Card>
              <CardContent className="p-6">
                <Accordion type="single" collapsible className="w-full">
                  {filteredQuestions.map((item, i) => (
                    <AccordionItem key={i} value={`q-${i}`}>
                      <AccordionTrigger>{item.q}</AccordionTrigger>
                      <AccordionContent>{item.a}</AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
                {filteredQuestions.length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No results found. Try a different search term.</p>
                )}
              </CardContent>
            </Card>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-foreground mb-6">Still need help?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {contactChannels.map((ch) => (
                <Card key={ch.title}>
                  <CardContent className="p-6 text-center space-y-3">
                    <div className="w-12 h-12 rounded-full bg-accent/10 mx-auto flex items-center justify-center">
                      <ch.icon className="h-6 w-6 text-accent" />
                    </div>
                    <h3 className="font-semibold text-foreground">{ch.title}</h3>
                    <p className="text-sm font-medium text-foreground">{ch.desc}</p>
                    <p className="text-xs text-muted-foreground">{ch.sub}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
};

export default HelpCenter;
