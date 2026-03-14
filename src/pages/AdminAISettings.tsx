import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Brain, Search, MessageCircle, FileText, BarChart3, Loader2, Save, Bot,
  Sparkles, Globe, Facebook, Settings, CheckCircle2, XCircle, RefreshCw,
  TrendingUp, AlertTriangle, Package,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';

interface AISettings {
  ai_search_enabled: boolean;
  ai_search_model: string;
  ai_chat_enabled: boolean;
  ai_chat_greeting: string;
  ai_chat_model: string;
  ai_description_enabled: boolean;
  ai_description_model: string;
  ai_analyzer_enabled: boolean;
  ai_analyzer_model: string;
  fb_messenger_enabled: boolean;
  fb_page_id: string;
  fb_webhook_url: string;
}

const defaultSettings: AISettings = {
  ai_search_enabled: true,
  ai_search_model: 'google/gemini-3-flash-preview',
  ai_chat_enabled: true,
  ai_chat_greeting: 'আসসালামু আলাইকুম! 👋 Grand Mall Emporium-এ স্বাগতম। আমি আপনার AI শপিং সহকারী। কিভাবে সাহায্য করতে পারি?',
  ai_chat_model: 'google/gemini-3-flash-preview',
  ai_description_enabled: true,
  ai_description_model: 'google/gemini-3-flash-preview',
  ai_analyzer_enabled: true,
  ai_analyzer_model: 'google/gemini-3-flash-preview',
  fb_messenger_enabled: false,
  fb_page_id: '',
  fb_webhook_url: '',
};

const modelOptions = [
  { value: 'google/gemini-3-flash-preview', label: 'Gemini 3 Flash (Fast)', desc: 'দ্রুত ও সাশ্রয়ী' },
  { value: 'google/gemini-2.5-flash', label: 'Gemini 2.5 Flash', desc: 'ব্যালেন্সড পারফরম্যান্স' },
  { value: 'google/gemini-2.5-pro', label: 'Gemini 2.5 Pro', desc: 'সবচেয়ে শক্তিশালী' },
  { value: 'openai/gpt-5-mini', label: 'GPT-5 Mini', desc: 'স্মার্ট ও সাশ্রয়ী' },
  { value: 'openai/gpt-5', label: 'GPT-5', desc: 'সর্বোচ্চ মানের' },
];

const AdminAISettings = () => {
  const [settings, setSettings] = useState<AISettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [analyzerResult, setAnalyzerResult] = useState('');
  const [analyzerSummary, setAnalyzerSummary] = useState<any>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [testingChat, setTestingChat] = useState(false);
  const [testChatResponse, setTestChatResponse] = useState('');

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', 'ai_settings')
        .maybeSingle();
      if (data?.value) {
        setSettings({ ...defaultSettings, ...(data.value as any) });
      }
    } catch (e) {
      console.error('Failed to load AI settings', e);
    }
    setLoading(false);
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from('system_settings')
        .select('id')
        .eq('key', 'ai_settings')
        .maybeSingle();

      if (existing) {
        await supabase
          .from('system_settings')
          .update({ value: settings as any })
          .eq('key', 'ai_settings');
      } else {
        await supabase
          .from('system_settings')
          .insert({ key: 'ai_settings', value: settings as any });
      }
      toast.success('AI সেটিংস সেভ হয়েছে! ✅');
    } catch (e: any) {
      toast.error(e.message || 'সেটিংস সেভ করতে ব্যর্থ');
    }
    setSaving(false);
  };

  const updateSetting = <K extends keyof AISettings>(key: K, value: AISettings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const runAnalysis = async () => {
    setAnalyzing(true);
    setAnalyzerResult('');
    setAnalyzerSummary(null);
    try {
      const { data, error } = await supabase.functions.invoke('ai-product-analyzer');
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setAnalyzerResult(data.analysis);
      setAnalyzerSummary(data.summary);
      toast.success('AI বিশ্লেষণ সম্পন্ন!');
    } catch (e: any) {
      toast.error(e.message || 'Analysis failed');
    }
    setAnalyzing(false);
  };

  const testChat = async () => {
    setTestingChat(true);
    setTestChatResponse('');
    try {
      const { data, error } = await supabase.functions.invoke('ai-chat', {
        body: { messages: [{ role: 'user', content: 'হ্যালো, আপনার স্টোরে কি কি পণ্য আছে?' }] },
      });
      if (error) throw error;
      // For streaming response, just show a simple check
      setTestChatResponse('✅ AI Chat সার্ভিস সফলভাবে কাজ করছে!');
      toast.success('AI Chat টেস্ট সফল!');
    } catch (e: any) {
      setTestChatResponse(`❌ ত্রুটি: ${e.message}`);
      toast.error('AI Chat টেস্ট ব্যর্থ');
    }
    setTestingChat(false);
  };

  if (loading) {
    return (
      <AdminLayout titleKey="admin.title.products" descriptionKey="admin.desc.products">
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout titleKey="admin.title.products" descriptionKey="admin.desc.products">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-bold">AI Automation Center</h2>
              <p className="text-sm text-muted-foreground">সব AI ফিচার এখান থেকে কন্ট্রোল করুন</p>
            </div>
          </div>
          <Button onClick={saveSettings} disabled={saving} className="gap-2">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            {saving ? 'সেভ হচ্ছে...' : 'সেটিংস সেভ করুন'}
          </Button>
        </div>

        {/* Status Overview */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[
            { label: 'AI Search', enabled: settings.ai_search_enabled, icon: Search },
            { label: 'AI Chat', enabled: settings.ai_chat_enabled, icon: MessageCircle },
            { label: 'AI Description', enabled: settings.ai_description_enabled, icon: FileText },
            { label: 'AI Analyzer', enabled: settings.ai_analyzer_enabled, icon: BarChart3 },
            { label: 'FB Messenger', enabled: settings.fb_messenger_enabled, icon: Facebook },
          ].map((item) => (
            <Card key={item.label} className={`border ${item.enabled ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
              <CardContent className="p-3 flex items-center gap-2">
                <item.icon className={`h-4 w-4 ${item.enabled ? 'text-primary' : 'text-muted-foreground'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium truncate">{item.label}</p>
                </div>
                {item.enabled ? (
                  <CheckCircle2 className="h-4 w-4 text-[hsl(var(--success))] shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-muted-foreground shrink-0" />
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="search" className="space-y-4">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="search" className="gap-1 text-xs sm:text-sm">
              <Search className="h-3.5 w-3.5" /> সার্চ
            </TabsTrigger>
            <TabsTrigger value="chat" className="gap-1 text-xs sm:text-sm">
              <MessageCircle className="h-3.5 w-3.5" /> চ্যাট
            </TabsTrigger>
            <TabsTrigger value="description" className="gap-1 text-xs sm:text-sm">
              <FileText className="h-3.5 w-3.5" /> ডেসক্রিপশন
            </TabsTrigger>
            <TabsTrigger value="analyzer" className="gap-1 text-xs sm:text-sm">
              <BarChart3 className="h-3.5 w-3.5" /> অ্যানালাইজার
            </TabsTrigger>
            <TabsTrigger value="messenger" className="gap-1 text-xs sm:text-sm">
              <Facebook className="h-3.5 w-3.5" /> মেসেঞ্জার
            </TabsTrigger>
          </TabsList>

          {/* AI Search Tab */}
          <TabsContent value="search">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Search className="h-5 w-5" /> AI Product Search
                    </CardTitle>
                    <CardDescription>কাস্টমার ন্যাচারাল ল্যাঙ্গুয়েজে প্রোডাক্ট সার্চ করতে পারবে</CardDescription>
                  </div>
                  <Switch
                    checked={settings.ai_search_enabled}
                    onCheckedChange={(v) => updateSetting('ai_search_enabled', v)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>AI Model</Label>
                  <select
                    value={settings.ai_search_model}
                    onChange={(e) => updateSetting('ai_search_model', e.target.value)}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {modelOptions.map(m => (
                      <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                  <p className="font-medium">🔍 কিভাবে কাজ করে:</p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>কাস্টমার সার্চবারে "সস্তা ফোন" বা "gaming laptop" লিখলে AI বুঝে প্রোডাক্ট দেখায়</li>
                    <li>বাংলা ও ইংলিশ দুই ভাষায় কাজ করে</li>
                    <li>AI Toggle সার্চবারে দেখা যায়</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Chat Tab */}
          <TabsContent value="chat">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Bot className="h-5 w-5" /> AI Live Chat Widget
                    </CardTitle>
                    <CardDescription>ওয়েবসাইটে ভাসমান চ্যাট উইজেট — AI কাস্টমারদের সাহায্য করে</CardDescription>
                  </div>
                  <Switch
                    checked={settings.ai_chat_enabled}
                    onCheckedChange={(v) => updateSetting('ai_chat_enabled', v)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>গ্রিটিং মেসেজ</Label>
                  <Textarea
                    value={settings.ai_chat_greeting}
                    onChange={(e) => updateSetting('ai_chat_greeting', e.target.value)}
                    rows={3}
                    className="mt-1"
                    placeholder="AI চ্যাট খুললে প্রথম যে মেসেজটি দেখাবে..."
                  />
                </div>
                <div>
                  <Label>AI Model</Label>
                  <select
                    value={settings.ai_chat_model}
                    onChange={(e) => updateSetting('ai_chat_model', e.target.value)}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {modelOptions.map(m => (
                      <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>
                    ))}
                  </select>
                </div>
                <Separator />
                <div className="flex items-center gap-3">
                  <Button variant="outline" onClick={testChat} disabled={testingChat} className="gap-2">
                    {testingChat ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    AI Chat টেস্ট করুন
                  </Button>
                  {testChatResponse && (
                    <span className="text-sm">{testChatResponse}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Description Tab */}
          <TabsContent value="description">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" /> AI Description Writer
                    </CardTitle>
                    <CardDescription>প্রোডাক্ট অ্যাড করার সময় AI বাংলা+ইংলিশ ডেসক্রিপশন লিখে দেয়</CardDescription>
                  </div>
                  <Switch
                    checked={settings.ai_description_enabled}
                    onCheckedChange={(v) => updateSetting('ai_description_enabled', v)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>AI Model</Label>
                  <select
                    value={settings.ai_description_model}
                    onChange={(e) => updateSetting('ai_description_model', e.target.value)}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {modelOptions.map(m => (
                      <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>
                    ))}
                  </select>
                </div>
                <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                  <p className="font-medium">✍️ কিভাবে ব্যবহার করবেন:</p>
                  <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                    <li>Admin → Products → Add New Product এ যান</li>
                    <li>প্রোডাক্টের নাম, ক্যাটাগরি ও প্রাইস দিন</li>
                    <li>"✨ AI Generate" বাটনে ক্লিক করুন</li>
                    <li>AI বাংলা+ইংলিশ SEO-friendly ডেসক্রিপশন তৈরি করবে</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Analyzer Tab */}
          <TabsContent value="analyzer">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" /> AI Product Analyzer
                    </CardTitle>
                    <CardDescription>সেলস ডেটা বিশ্লেষণ করে রিপোর্ট ও সুপারিশ দেয়</CardDescription>
                  </div>
                  <Switch
                    checked={settings.ai_analyzer_enabled}
                    onCheckedChange={(v) => updateSetting('ai_analyzer_enabled', v)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>AI Model</Label>
                  <select
                    value={settings.ai_analyzer_model}
                    onChange={(e) => updateSetting('ai_analyzer_model', e.target.value)}
                    className="w-full mt-1 rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    {modelOptions.map(m => (
                      <option key={m.value} value={m.value}>{m.label} — {m.desc}</option>
                    ))}
                  </select>
                </div>

                <Separator />

                <Button onClick={runAnalysis} disabled={analyzing} className="gap-2">
                  {analyzing ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                  {analyzing ? 'বিশ্লেষণ চলছে...' : 'AI বিশ্লেষণ চালান'}
                </Button>

                {analyzerSummary && (
                  <div className="grid grid-cols-3 gap-3">
                    <Card>
                      <CardContent className="pt-4 flex items-center gap-3">
                        <Package className="h-6 w-6 text-primary" />
                        <div>
                          <p className="text-xl font-bold">{analyzerSummary.totalProducts}</p>
                          <p className="text-xs text-muted-foreground">মোট প্রোডাক্ট</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 flex items-center gap-3">
                        <TrendingUp className="h-6 w-6 text-[hsl(var(--success))]" />
                        <div>
                          <p className="text-xl font-bold">{analyzerSummary.totalOrders}</p>
                          <p className="text-xs text-muted-foreground">মোট অর্ডার</p>
                        </div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-4 flex items-center gap-3">
                        <AlertTriangle className="h-6 w-6 text-destructive" />
                        <div>
                          <p className="text-xl font-bold">{analyzerSummary.lowStockProducts?.length || 0}</p>
                          <p className="text-xs text-muted-foreground">লো স্টক</p>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}

                {analyzerResult && (
                  <div className="prose prose-sm dark:prose-invert max-w-none border rounded-lg p-4">
                    <ReactMarkdown>{analyzerResult}</ReactMarkdown>
                  </div>
                )}

                {!analyzerResult && !analyzing && (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    <Brain className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    "AI বিশ্লেষণ চালান" বাটনে ক্লিক করুন
                  </div>
                )}

                {analyzing && (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 mx-auto animate-spin text-primary mb-3" />
                    <p className="text-sm text-muted-foreground">AI ডেটা বিশ্লেষণ করছে...</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Facebook Messenger Tab */}
          <TabsContent value="messenger">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Facebook className="h-5 w-5" /> Facebook Messenger AI
                    </CardTitle>
                    <CardDescription>Facebook পেজের মেসেঞ্জারে AI অটো রিপ্লাই</CardDescription>
                  </div>
                  <Switch
                    checked={settings.fb_messenger_enabled}
                    onCheckedChange={(v) => updateSetting('fb_messenger_enabled', v)}
                  />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Facebook Page ID</Label>
                  <Input
                    value={settings.fb_page_id}
                    onChange={(e) => updateSetting('fb_page_id', e.target.value)}
                    placeholder="আপনার Facebook Page ID দিন"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label>Webhook URL</Label>
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-messenger-webhook`}
                      readOnly
                      className="font-mono text-xs"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/facebook-messenger-webhook`);
                        toast.success('Webhook URL কপি হয়েছে!');
                      }}
                    >
                      কপি
                    </Button>
                  </div>
                </div>

                <Separator />

                <div className="bg-muted/50 p-4 rounded-lg text-sm space-y-2">
                  <p className="font-medium">📋 Facebook Messenger সেটআপ গাইড:</p>
                  <ol className="list-decimal pl-5 space-y-1 text-muted-foreground">
                    <li><a href="https://developers.facebook.com/" target="_blank" className="text-primary underline">Facebook Developers</a> এ যান → App তৈরি করুন</li>
                    <li>Messenger প্রোডাক্ট অ্যাড করুন</li>
                    <li>আপনার Page সিলেক্ট করে Page Access Token জেনারেট করুন</li>
                    <li>উপরের Webhook URL কপি করে Facebook-এ পেস্ট করুন</li>
                    <li>Verify Token হিসেবে যেকোনো সিক্রেট টোকেন দিন</li>
                    <li>Subscription: <code>messages</code> সিলেক্ট করুন</li>
                  </ol>
                </div>

                <div className="flex items-center gap-2 p-3 rounded-lg border border-primary/20 bg-primary/5">
                  <Settings className="h-4 w-4 text-primary" />
                  <span className="text-sm">
                    Facebook Page Access Token এবং Verify Token সেটআপ করতে অ্যাডমিনকে Lovable সাপোর্টে যোগাযোগ করতে হবে।
                  </span>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminAISettings;
