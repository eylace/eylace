import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import type { SettingsState } from '@/pages/AdminSettingsPage';

interface Props { settings: SettingsState; update: (key: string, value: any) => void; }

export const SocialMediaLoginsTab = ({ settings, update }: Props) => (
  <div className="space-y-4 mt-4">
    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
          Facebook Login
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">Enable Facebook Login</p>
            <p className="text-xs text-muted-foreground">Allow users to sign in with Facebook</p>
          </div>
          <Switch checked={settings.facebookEnabled} onCheckedChange={v => update('facebookEnabled', v)} />
        </div>
        {settings.facebookEnabled && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2"><Label>App ID</Label><Input value={settings.facebookAppId} onChange={e => update('facebookAppId', e.target.value)} placeholder="Enter Facebook App ID" /></div>
            <div className="space-y-2"><Label>App Secret</Label><Input type="password" value={settings.facebookAppSecret} onChange={e => update('facebookAppSecret', e.target.value)} placeholder="Enter Facebook App Secret" /></div>
          </div>
        )}
        <div className="p-3 bg-muted/50 rounded-lg">
          <p className="text-xs text-muted-foreground">
            <strong>Setup:</strong> Go to Facebook Developer Portal → Create App → Add Facebook Login product → Set redirect URI to your domain callback URL.
          </p>
        </div>
      </CardContent>
    </Card>

    <Card className="border border-border">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" /><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
          Google Login
          <Badge variant="secondary" className="text-[10px]">Managed by Lovable Cloud</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between p-3 border border-border rounded-lg">
          <div>
            <p className="text-sm font-medium text-foreground">Enable Google Login</p>
            <p className="text-xs text-muted-foreground">Allow users to sign in with Google</p>
          </div>
          <Switch checked={settings.googleEnabled} onCheckedChange={v => update('googleEnabled', v)} />
        </div>
        {settings.googleEnabled && (
          <div className="space-y-4">
            <div className="p-3 bg-accent/10 border border-accent/20 rounded-lg">
              <p className="text-xs text-accent font-medium">✓ Google Login is automatically managed by Lovable Cloud. No additional configuration needed.</p>
            </div>
            <details className="text-sm">
              <summary className="cursor-pointer text-muted-foreground hover:text-foreground">Use custom credentials (optional)</summary>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
                <div className="space-y-2"><Label>Client ID</Label><Input value={settings.googleClientId} onChange={e => update('googleClientId', e.target.value)} placeholder="Optional: Custom Client ID" /></div>
                <div className="space-y-2"><Label>Client Secret</Label><Input type="password" value={settings.googleClientSecret} onChange={e => update('googleClientSecret', e.target.value)} placeholder="Optional: Custom Client Secret" /></div>
              </div>
            </details>
          </div>
        )}
      </CardContent>
    </Card>
  </div>
);
