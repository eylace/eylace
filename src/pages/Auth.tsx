import { useState, useEffect } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, ArrowRight, ShoppingBag, Phone, Shield, User, ChevronLeft, Store, Link2 } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { lovable } from '@/integrations/lovable/index';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type LoginFormData = z.infer<typeof loginSchema>;
type SignupFormData = z.infer<typeof signupSchema>;

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const rawNext = searchParams.get('next') || '';
  // Only accept same-origin relative paths starting with a single '/'.
  const nextPath = /^\/(?!\/)/.test(rawNext) ? rawNext : '/';
  const { user, signIn, signUp, loading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeView, setActiveView] = useState<'login' | 'signup' | 'phone' | 'forgot'>('login');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [signupRole, setSignupRole] = useState<'customer' | 'seller' | 'affiliate'>('customer');
  const { t } = useLanguage();

  const loginForm = useForm<LoginFormData>({ resolver: zodResolver(loginSchema), defaultValues: { email: '', password: '' } });
  const signupForm = useForm<SignupFormData>({ resolver: zodResolver(signupSchema), defaultValues: { fullName: '', email: '', password: '', confirmPassword: '' } });

  const [resetEmail, setResetEmail] = useState('');

  useEffect(() => { if (user && !loading) navigate(nextPath); }, [user, loading, navigate, nextPath]);

  const handleLogin = async (data: LoginFormData) => {
    setIsSubmitting(true);
    const { error } = await signIn(data.email, data.password);
    setIsSubmitting(false);
    if (error) {
      if (error.message.includes('Invalid login credentials')) toast.error('Invalid email or password');
      else if (error.message.includes('Email not confirmed')) toast.error('Please verify your email before signing in');
      else toast.error(error.message);
      return;
    }
    toast.success('Welcome back!');
    navigate(nextPath);
  };

  const handleSignup = async (data: SignupFormData) => {
    setIsSubmitting(true);
    const { error } = await signUp(data.email, data.password);
    setIsSubmitting(false);
    if (error) {
      if (error.message.includes('already registered')) toast.error('This email is already registered');
      else toast.error(error.message);
      return;
    }
    // Remember role so post-verification we route the user correctly
    try { localStorage.setItem('signup_intent_role', signupRole); } catch {}
    if (signupRole === 'seller') {
      toast.success('Account created! Complete your seller registration.');
      navigate('/sell');
    } else if (signupRole === 'affiliate') {
      toast.success('Account created! Complete your affiliate application.');
      navigate('/affiliate');
    } else {
      toast.success('Account created! Please check your email to verify your account.');
      setActiveView('login');
    }
  };

  const handleGoogleSignIn = async () => {
    setIsSubmitting(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error('Google sign in failed. Please try again.');
    }
  };

  const handlePhoneOTP = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await supabase.functions.invoke('send-otp', {
        body: { phone: phoneNumber },
      });
      if (res.error || res.data?.error) {
        toast.error(res.data?.error || res.error?.message || 'Failed to send OTP');
        setIsSubmitting(false);
        return;
      }
      setOtpSent(true);
      toast.success('OTP sent to your phone!');
    } catch (e: any) {
      toast.error(e.message || 'Failed to send OTP');
    }
    setIsSubmitting(false);
  };

  const handleVerifyOTP = async () => {
    if (!otpCode || otpCode.length < 4) {
      toast.error('Please enter a valid OTP');
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await supabase.functions.invoke('verify-otp', {
        body: { phone: phoneNumber, code: otpCode },
      });
      if (res.error || res.data?.error) {
        toast.error(res.data?.error || res.error?.message || 'Invalid OTP');
        setIsSubmitting(false);
        return;
      }
      // Set the session from the response
      if (res.data?.session) {
        await supabase.auth.setSession({
          access_token: res.data.session.access_token,
          refresh_token: res.data.session.refresh_token,
        });
        toast.success('Phone verified successfully!');
        navigate('/');
      } else {
        toast.error('Authentication failed. Please try again.');
      }
    } catch (e: any) {
      toast.error(e.message || 'Verification failed');
    }
    setIsSubmitting(false);
  };

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error('Please enter your email');
      return;
    }
    setIsSubmitting(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    setIsSubmitting(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success('Reset link sent! Check your email.');
  };

  if (loading) {
    return (
      <Layout>
        <div className="container-main py-12 flex items-center justify-center min-h-[60vh]">
          <div className="h-8 w-8 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container-main py-8 md:py-12">
        <div className="max-w-lg mx-auto">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-accent to-accent/70 rounded-2xl flex items-center justify-center mb-5 shadow-lg">
              <ShoppingBag className="h-10 w-10 text-accent-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t('auth.welcomeTitle')}</h1>
            <p className="text-muted-foreground mt-2 text-base">{t('auth.welcomeDesc')}</p>
          </div>

          <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
            {/* Social Login Buttons */}
            <div className="p-6 pb-0 space-y-3">
              <Button
                variant="outline"
                size="lg"
                className="w-full gap-3 h-12 text-base font-medium hover:bg-secondary/80 transition-all"
                onClick={handleGoogleSignIn}
                disabled={isSubmitting}
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t('auth.googleSignIn')}
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="w-full gap-3 h-12 text-base font-medium hover:bg-secondary/80 transition-all"
                onClick={() => { setActiveView('phone'); setOtpSent(false); setPhoneNumber(''); setOtpCode(''); }}
                disabled={isSubmitting}
              >
                <Phone className="h-5 w-5 text-accent" />
                {t('auth.phoneSignIn')}
              </Button>
            </div>

            {/* Divider */}
            <div className="px-6 py-4">
              <div className="relative">
                <Separator />
                <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-card px-4 text-sm text-muted-foreground">
                  {t('auth.orContinueWith')}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 pt-0">
              {activeView === 'phone' ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setActiveView('login')}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('auth.backToEmail')}
                  </button>

                  {!otpSent ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="phone">{t('auth.phoneNumber')}</Label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="phone"
                            type="tel"
                            placeholder="+880 1XXX-XXXXXX"
                            className="pl-10 h-12"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                          />
                        </div>
                      </div>
                      <Button
                        variant="accent"
                        size="lg"
                        className="w-full h-12"
                        onClick={handlePhoneOTP}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        ) : null}
                        {t('auth.sendOTP')}
                      </Button>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground text-center">{t('auth.enterOTP')}</p>
                      <div className="space-y-2">
                        <Input
                          type="text"
                          placeholder="000000"
                          maxLength={6}
                          className="h-14 text-center text-2xl tracking-[0.5em] font-mono"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                        />
                      </div>
                      <Button
                        variant="accent"
                        size="lg"
                        className="w-full h-12"
                        onClick={handleVerifyOTP}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />
                        ) : null}
                        {t('auth.verifyOTP')}
                      </Button>
                      <button
                        onClick={() => { setOtpSent(false); setOtpCode(''); }}
                        className="w-full text-center text-sm text-accent hover:underline"
                      >
                        {t('auth.resendOTP')}
                      </button>
                    </>
                  )}
                </div>
              ) : activeView === 'forgot' ? (
                <div className="space-y-4">
                  <button
                    onClick={() => setActiveView('login')}
                    className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-2"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('auth.backToSignIn')}
                  </button>
                  <div className="text-center mb-2">
                    <h2 className="text-xl font-semibold">{t('auth.resetPassword')}</h2>
                    <p className="text-sm text-muted-foreground mt-1">{t('auth.resetDesc')}</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email">{t('auth.email')}</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="reset-email"
                        type="email"
                        placeholder="you@example.com"
                        className="pl-10 h-12"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button
                    variant="accent"
                    size="lg"
                    className="w-full h-12"
                    onClick={handleForgotPassword}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <div className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />
                    ) : null}
                    {t('auth.sendResetLink')}
                  </Button>
                </div>
              ) : activeView === 'login' ? (
                <div className="space-y-4">
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">{t('auth.email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="login-email" type="email" placeholder="you@example.com" className="pl-10 h-12" {...loginForm.register('email')} />
                      </div>
                      {loginForm.formState.errors.email && <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label htmlFor="login-password">{t('auth.password')}</Label>
                        <button
                          type="button"
                          onClick={() => setActiveView('forgot')}
                          className="text-xs text-accent hover:underline"
                        >
                          {t('auth.forgotPassword')}
                        </button>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 h-12" {...loginForm.register('password')} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {loginForm.formState.errors.password && <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>}
                    </div>
                    <Button type="submit" variant="accent" size="lg" className="w-full h-12 text-base" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><div className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />{t('auth.signingIn')}</>
                      ) : (
                        <>{t('auth.signIn')}<ArrowRight className="h-4 w-4 ml-2" /></>
                      )}
                    </Button>
                  </form>
                  <p className="text-center text-sm text-muted-foreground">
                    {t('auth.dontHaveAccount')}{' '}
                    <button onClick={() => setActiveView('signup')} className="text-accent font-medium hover:underline">
                      {t('auth.signUp')}
                    </button>
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Role selector */}
                  <div>
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      I want to sign up as
                    </Label>
                    <div className="mt-2 grid grid-cols-3 gap-2">
                      {([
                        { id: 'customer', label: 'Customer', Icon: User },
                        { id: 'seller', label: 'Seller', Icon: Store },
                        { id: 'affiliate', label: 'Affiliate', Icon: Link2 },
                      ] as const).map(({ id, label, Icon }) => {
                        const active = signupRole === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => setSignupRole(id)}
                            className={cn(
                              'flex flex-col items-center gap-1 rounded-lg border p-3 text-xs font-medium transition-all',
                              active
                                ? 'border-accent bg-accent/10 text-accent shadow-sm'
                                : 'border-border text-muted-foreground hover:border-accent/50 hover:text-foreground',
                            )}
                            aria-pressed={active}
                          >
                            <Icon className="h-5 w-5" />
                            {label}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-2 text-[11px] text-muted-foreground">
                      {signupRole === 'seller' && 'Sell your products on Eylace. You will complete a seller profile after signup.'}
                      {signupRole === 'affiliate' && 'Earn commission by promoting products. Application requires admin approval.'}
                      {signupRole === 'customer' && 'Shop, track orders, save your wishlist.'}
                    </p>
                  </div>
                  <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">{t('auth.fullName')}</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="signup-name" type="text" placeholder="John Doe" className="pl-10 h-12" {...signupForm.register('fullName')} />
                      </div>
                      {signupForm.formState.errors.fullName && <p className="text-sm text-destructive">{signupForm.formState.errors.fullName.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">{t('auth.email')}</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="signup-email" type="email" placeholder="you@example.com" className="pl-10 h-12" {...signupForm.register('email')} />
                      </div>
                      {signupForm.formState.errors.email && <p className="text-sm text-destructive">{signupForm.formState.errors.email.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">{t('auth.password')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="signup-password" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 pr-10 h-12" {...signupForm.register('password')} />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                      {signupForm.formState.errors.password && <p className="text-sm text-destructive">{signupForm.formState.errors.password.message}</p>}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm">{t('auth.confirmPassword')}</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="signup-confirm" type={showPassword ? 'text' : 'password'} placeholder="••••••••" className="pl-10 h-12" {...signupForm.register('confirmPassword')} />
                      </div>
                      {signupForm.formState.errors.confirmPassword && <p className="text-sm text-destructive">{signupForm.formState.errors.confirmPassword.message}</p>}
                    </div>
                    <Button type="submit" variant="accent" size="lg" className="w-full h-12 text-base" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <><div className="h-4 w-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin mr-2" />{t('auth.creatingAccount')}</>
                      ) : (
                        <>{t('auth.createAccount')}<ArrowRight className="h-4 w-4 ml-2" /></>
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-center text-muted-foreground">
                    {t('auth.termsAgree')}{' '}
                    <Link to="/terms" className="text-accent hover:underline">{t('auth.termsOfService')}</Link>
                    {' '}{t('auth.and')}{' '}
                    <Link to="/privacy" className="text-accent hover:underline">{t('auth.privacyPolicy')}</Link>
                  </p>
                  <p className="text-center text-sm text-muted-foreground">
                    {t('auth.alreadyHaveAccount')}{' '}
                    <button onClick={() => setActiveView('login')} className="text-accent font-medium hover:underline">
                      {t('auth.signIn')}
                    </button>
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Security Badge */}
          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="h-3.5 w-3.5" />
            <span>{t('auth.secureLogin')}</span>
          </div>

          <div className="mt-3 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-accent transition-colors">{t('auth.continueGuest')}</Link>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
