import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Globe } from 'lucide-react';
import type { SettingsState } from '@/pages/AdminSettingsPage';

interface Props { settings: SettingsState; update: (key: string, value: any) => void; }

const allLanguages = [
  { code: 'en', name: 'English', native: 'English', flag: '🇺🇸' },
  { code: 'bn', name: 'Bangla', native: 'বাংলা', flag: '🇧🇩' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी', flag: '🇮🇳' },
  { code: 'ar', name: 'Arabic', native: 'العربية', flag: '🇸🇦' },
  { code: 'fr', name: 'French', native: 'Français', flag: '🇫🇷' },
];

export const LanguagesTab = ({ settings, update }: Props) => {
  const toggleLang = (code: string) => {
    const current = settings.enabledLanguages || [];
    const next = current.includes(code) ? current.filter(c => c !== code) : [...current, code];
    update('enabledLanguages', next);
  };

  return (
    <div className="space-y-4 mt-4">
      <Card className="border border-border">
        <CardHeader><CardTitle className="text-base flex items-center gap-2"><Globe className="h-5 w-5" /> Language Settings</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Default Language</Label>
            <Select value={settings.defaultLanguage} onValueChange={v => update('defaultLanguage', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {allLanguages.map(l => <SelectItem key={l.code} value={l.code}>{l.flag} {l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-3">
            <Label>Enabled Languages</Label>
            {allLanguages.map(l => (
              <div key={l.code} className="flex items-center justify-between p-3 border border-border rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-xl">{l.flag}</span>
                  <div>
                    <p className="text-sm font-medium text-foreground">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.native}</p>
                  </div>
                </div>
                <Switch checked={(settings.enabledLanguages || []).includes(l.code)} onCheckedChange={() => toggleLang(l.code)} />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
