import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useState } from 'react';
import { toast } from 'sonner';
import { Save } from 'lucide-react';

export default function AdminAffiliateRegistration() {
  const [form, setForm] = useState({
    enabled: true,
    title: 'Join Our Affiliate Program',
    description: '<p>Earn commissions by promoting our products. Sign up today!</p>',
    requireApproval: true,
    termsText: 'By registering, you agree to our affiliate terms and conditions.',
    welcomeEmail: true,
    customFields: true,
    showPaymentFields: true,
  });

  const handleSave = () => toast.success('Affiliate registration form settings saved');

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Affiliate Registration Form</h1>

        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle>Form Settings</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><Label>Enable Registration</Label><Switch checked={form.enabled} onCheckedChange={v => setForm(p => ({ ...p, enabled: v }))} /></div>
              <div><Label>Form Title</Label><Input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))} /></div>
              <div><Label>Description</Label><RichTextEditor value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} /></div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Options</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between"><Label>Require Admin Approval</Label><Switch checked={form.requireApproval} onCheckedChange={v => setForm(p => ({ ...p, requireApproval: v }))} /></div>
              <div className="flex items-center justify-between"><Label>Send Welcome Email</Label><Switch checked={form.welcomeEmail} onCheckedChange={v => setForm(p => ({ ...p, welcomeEmail: v }))} /></div>
              <div className="flex items-center justify-between"><Label>Show Custom Fields</Label><Switch checked={form.customFields} onCheckedChange={v => setForm(p => ({ ...p, customFields: v }))} /></div>
              <div className="flex items-center justify-between"><Label>Show Payment Details</Label><Switch checked={form.showPaymentFields} onCheckedChange={v => setForm(p => ({ ...p, showPaymentFields: v }))} /></div>
              <div><Label>Terms & Conditions Text</Label><Textarea value={form.termsText} onChange={e => setForm(p => ({ ...p, termsText: e.target.value }))} rows={3} /></div>
            </CardContent>
          </Card>
        </div>

        <Button onClick={handleSave} size="lg"><Save className="h-4 w-4 mr-2" />Save Settings</Button>
      </div>
    </AdminLayout>
  );
}
