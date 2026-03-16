import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { LayoutDashboard, Loader2, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';
import { AdminLanguageSwitcher } from '@/components/admin/AdminLanguageSwitcher';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();
  const { t } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { error } = await signIn(email, password);
      if (error) { toast.error('Login failed', { description: error.message }); setLoading(false); return; }
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) { toast.error('Authentication failed'); setLoading(false); return; }
      const { data: roleData } = await supabase.from('user_roles').select('role').eq('user_id', authUser.id).in('role', ['admin', 'super_admin']).limit(1).maybeSingle();
      if (!roleData) { toast.error('Access Denied'); await supabase.auth.signOut(); setLoading(false); return; }
      toast.success('Welcome, Admin!');
      navigate('/admin');
    } catch { toast.error('Something went wrong'); }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="flex justify-end mb-4">
          <AdminLanguageSwitcher />
        </div>
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-accent flex items-center justify-center mx-auto mb-4 shadow-lg">
            <LayoutDashboard className="h-8 w-8 text-accent-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t('admin.loginTitle' as any)}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('admin.loginDesc' as any)}</p>
        </div>

        <Card className="border border-border shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-accent" />
              {t('admin.loginHeader' as any)}
            </CardTitle>
            <CardDescription>{t('admin.enterCredentials' as any)}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">{t('admin.email' as any)}</Label>
                <Input id="email" type="email" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">{t('auth.password' as any)}</Label>
                <div className="relative">
                  <Input id="password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required disabled={loading} />
                  <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7" onClick={() => setShowPassword(!showPassword)}>
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                {loading ? t('admin.signingIn' as any) : t('admin.signIn' as any)}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground mt-6">
          {t('admin.notAdmin' as any)} <a href="/" className="text-accent hover:underline">{t('admin.goToStore' as any)}</a>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;
