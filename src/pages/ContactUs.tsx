import { useState } from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react';
import { toast } from 'sonner';

const contactInfo = [
  { icon: Mail, title: 'Email Us', value: 'support@eylace.com', sub: 'We reply within 24 hours' },
  { icon: Phone, title: 'Call Us', value: '+880 1700-000000', sub: 'Sat–Thu, 9AM–10PM' },
  { icon: MapPin, title: 'Visit Us', value: 'Gulshan-2, Dhaka 1212', sub: 'Bangladesh' },
  { icon: Clock, title: 'Working Hours', value: 'Sat–Thu: 9AM–10PM', sub: 'Friday: 2PM–10PM' },
];

const ContactUs = () => {
  const [sending, setSending] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setTimeout(() => {
      setSending(false);
      toast.success('Message sent! We will get back to you soon.');
      (e.target as HTMLFormElement).reset();
    }, 1200);
  };

  return (
    <Layout>
      <section className="bg-primary text-primary-foreground py-16">
        <div className="container-main text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-lg text-primary-foreground/80 max-w-xl mx-auto">Have a question or need help? We'd love to hear from you.</p>
        </div>
      </section>

      <section className="container-main py-12">
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {contactInfo.map(({ icon: Icon, title, value, sub }) => (
            <Card key={title}>
              <CardContent className="pt-6 flex gap-4 items-start">
                <div className="p-3 bg-accent/10 rounded-lg"><Icon className="h-5 w-5 text-accent" /></div>
                <div>
                  <p className="font-semibold text-foreground">{title}</p>
                  <p className="text-sm text-foreground">{value}</p>
                  <p className="text-xs text-muted-foreground">{sub}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-accent" /> Send Us a Message</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Full Name</Label><Input required placeholder="Your name" /></div>
                <div><Label>Email</Label><Input required type="email" placeholder="you@email.com" /></div>
              </div>
              <div><Label>Subject</Label><Input required placeholder="How can we help?" /></div>
              <div><Label>Message</Label><Textarea required rows={5} placeholder="Write your message…" /></div>
              <Button type="submit" className="w-full" disabled={sending}>{sending ? 'Sending…' : 'Send Message'}</Button>
            </form>
          </CardContent>
        </Card>
      </section>
    </Layout>
  );
};

export default ContactUs;
