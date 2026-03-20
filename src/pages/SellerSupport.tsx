import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Mail, Phone, MessageCircle, BookOpen, FileText, HelpCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const faqs = [
  { q: 'কিভাবে সেলার অ্যাকাউন্ট খুলবো?', a: '"Start Selling" পেজে গিয়ে ফর্ম পূরণ করুন। অ্যাডমিন অনুমোদনের পর আপনার সেলার ড্যাশবোর্ড অ্যাক্টিভ হবে।' },
  { q: 'পেমেন্ট কত দিনে পাবো?', a: 'প্রতি সপ্তাহে পেআউট প্রক্রিয়া করা হয়। bKash, Nagad বা ব্যাংক ট্রান্সফারে পেমেন্ট পাবেন।' },
  { q: 'কমিশন রেট কত?', a: 'ক্যাটাগরি অনুযায়ী ৩-১৫%। বিস্তারিত জানতে সেলার পলিসি পেজ দেখুন।' },
  { q: 'প্রোডাক্ট আপলোডে সমস্যা হচ্ছে?', a: 'ছবি ৫MB-এর নিচে ও JPG/PNG ফরম্যাটে হতে হবে। সমস্যা চলতে থাকলে ক্যাশ ক্লিয়ার করে আবার চেষ্টা করুন।' },
  { q: 'রিটার্ন রিকোয়েস্ট কিভাবে হ্যান্ডেল করবো?', a: 'সেলার ড্যাশবোর্ডের অর্ডার সেকশনে রিটার্ন রিকোয়েস্ট দেখা যাবে। ৪৮ ঘণ্টার মধ্যে রেসপন্ড করুন।' },
  { q: 'একাধিক শপ খোলা যাবে?', a: 'বর্তমানে একটি অ্যাকাউন্টে একটি শপ সমর্থিত। ভবিষ্যতে মাল্টি-শপ ফিচার আসতে পারে।' },
];

const channels = [
  { icon: Mail, title: 'ইমেইল সাপোর্ট', desc: 'seller@eylace.com', sub: 'রেসপন্স টাইম: ২৪ ঘণ্টা' },
  { icon: Phone, title: 'ফোন সাপোর্ট', desc: '+880 1234-567890', sub: 'সকাল ৯টা - রাত ৯টা' },
  { icon: MessageCircle, title: 'লাইভ চ্যাট', desc: 'ড্যাশবোর্ড থেকে চ্যাট করুন', sub: 'তাৎক্ষণিক সাপোর্ট' },
];

const resources = [
  { icon: BookOpen, title: 'সেলার গাইড', desc: 'ধাপে ধাপে বিক্রি শুরু করুন', to: '/seller-center' },
  { icon: FileText, title: 'সেলার পলিসি', desc: 'নিয়ম ও শর্তাবলী জানুন', to: '/seller-policies' },
  { icon: HelpCircle, title: 'সেলার রেজিস্ট্রেশন', desc: 'এখনই আবেদন করুন', to: '/sell' },
];

const SellerSupport = () => {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'বার্তা পাঠানো হয়েছে', description: 'আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো।' });
    setForm({ name: '', email: '', subject: '', message: '' });
  };

  return (
    <Layout>
      <div className="container-main py-12">
        <h1 className="text-3xl font-bold text-foreground mb-2">সেলার সাপোর্ট</h1>
        <p className="text-muted-foreground mb-10">যেকোনো প্রশ্ন বা সমস্যায় আমরা আপনার পাশে আছি।</p>

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
            <h2 className="text-xl font-bold text-foreground mb-6">সাধারণ প্রশ্নোত্তর (FAQ)</h2>
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
            <h2 className="text-xl font-bold text-foreground mb-6">যোগাযোগ করুন</h2>
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Input placeholder="আপনার নাম" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                    <Input type="email" placeholder="ইমেইল" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                  </div>
                  <Input placeholder="বিষয়" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
                  <Textarea placeholder="আপনার বার্তা লিখুন..." rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
                  <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">বার্তা পাঠান</Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resources */}
        <div className="mt-12">
          <h2 className="text-xl font-bold text-foreground mb-6">সহায়ক রিসোর্স</h2>
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
