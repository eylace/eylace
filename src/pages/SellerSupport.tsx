import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, Phone, MessageCircle, BookOpen, FileText, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const faqs = [
  { q: 'How do I create a seller account?', a: 'Go to the "Start Selling" page and fill out the form. Your seller dashboard will be activated after admin approval.' },
  { q: 'How long does it take to receive payment?', a: 'Payouts are processed weekly. You will receive payment via bKash, Nagad, or bank transfer.' },
  { q: 'What is the commission rate?', a: '3-15% depending on the category. See the Seller Policies page for details.' },
  { q: 'Having trouble uploading products?', a: 'Images must be under 5MB and in JPG/PNG format. If the issue persists, clear your cache and try again.' },
  { q: 'How do I handle return requests?', a: 'Return requests can be found in the orders section of your seller dashboard. Respond within 48 hours.' },
  { q: 'Can I open multiple shops?', a: 'Currently, one shop per account is supported. Multi-shop features may be available in the future.' },
];

const channels = [
  { icon: Mail, title: 'Email Support', desc: 'seller@eylace.com', sub: 'Response Time: 24 hours' },
  { icon: Phone, title: 'Phone Support', desc: '+880 1234-567890', sub: '9 AM - 9 PM' },
  { icon: MessageCircle, title: 'Live Chat', desc: 'Chat from your dashboard', sub: 'Instant Support' },
];

const resources = [
  { icon: BookOpen, title: 'Seller Guide', desc: 'Step-by-step guide to start selling', to: '/seller-center' },
  { icon: FileText, title: 'Seller Policies', desc: 'Know the terms & conditions', to: '/seller-policies' },
  { icon: HelpCircle, title: 'Seller Registration', desc: 'Apply now to become a seller', to: '/sell' },
];

const SellerSupport = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Message Sent', description: 'We will get back to you shortly.' });
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <Layout>
      <div className="container-main py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">Seller Support</h1>
        <p className="text-muted-foreground mb-10">We're here to help you with any questions or issues.</p>

        {/* Support Channels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {channels.map((c) => (
            <Card key={c.title} className="text-center hover:shadow-md transition-shadow">
              <CardContent className="pt-8 pb-6">
                <div className="mx-auto mb-4 w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
                  <c.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{c.title}</h3>
                <p className="text-sm font-medium text-accent">{c.desc}</p>
                <p className="text-xs text-muted-foreground mt-1">{c.sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* FAQ */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="space-y-2">
              {faqs.map((f, i) => (
                <AccordionItem key={i} value={`faq-${i}`} className="border rounded-lg px-4">
                  <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {/* Contact Form */}
          <div>
            <h2 className="text-xl font-bold text-foreground mb-6">Contact Us</h2>
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input placeholder="Your Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <Input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <Input placeholder="Subject" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                  <Textarea placeholder="Write your message..." rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">Send Message</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resources */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-foreground mb-6">Helpful Resources</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {resources.map((r) => (
              <Link key={r.to} to={r.to}>
                <Card className="hover:shadow-md transition-shadow hover:border-accent/50">
                  <CardContent className="pt-6 pb-4 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                      <r.icon className="h-5 w-5 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground text-sm">{r.title}</h3>
                      <p className="text-xs text-muted-foreground">{r.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SellerSupport;
