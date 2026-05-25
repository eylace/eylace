import { useEffect, useMemo, useState } from 'react';
import { LogOut, Save } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { MediaInputField } from './MediaInputField';

export function AdminProfileMenu() {
  const { user, profile, updateProfile, signOut } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setFirstName(profile?.first_name ?? '');
    setLastName(profile?.last_name ?? '');
    setPhone(profile?.phone ?? '');
    setAvatarUrl(profile?.avatar_url ?? '');
  }, [profile]);

  const initials = useMemo(() => {
    const first = (firstName || profile?.first_name || user?.email || 'A').trim().charAt(0);
    const last = (lastName || profile?.last_name || '').trim().charAt(0);
    return `${first}${last}`.toUpperCase();
  }, [firstName, lastName, profile?.first_name, profile?.last_name, user?.email]);

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateProfile({
      first_name: firstName || null,
      last_name: lastName || null,
      phone: phone || null,
      avatar_url: avatarUrl || null,
    });

    if (error) {
      toast.error('Profile update failed');
    } else {
      toast.success('Profile updated');
    }
    setIsSaving(false);
  };

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Admin Profile"
          className="inline-flex items-center justify-center h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent/10 transition-colors"
        >
          <Avatar className="h-8 w-8 border border-border">
            <AvatarImage src={avatarUrl || profile?.avatar_url || undefined} alt="Admin profile" />
            <AvatarFallback className="text-xs font-semibold bg-accent/10 text-accent">{initials}</AvatarFallback>
          </Avatar>
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-80 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold text-foreground">Admin Profile</h3>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>

        <div className="grid gap-3">
          <div className="grid gap-1.5">
            <Label htmlFor="admin-first-name">First Name</Label>
            <Input id="admin-first-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="admin-last-name">Last Name</Label>
            <Input id="admin-last-name" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="admin-phone">Phone</Label>
            <Input id="admin-phone" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>

          <div className="grid gap-1.5">
            <Label htmlFor="admin-avatar-url">Logo / Avatar URL</Label>
            <MediaInputField
              inputId="admin-avatar-url"
              value={avatarUrl}
              onChange={setAvatarUrl}
              uploadFolder="profiles"
              previewClassName="h-14 w-14 rounded-full object-cover border border-border"
              maxSizeBytes={1 * 1024 * 1024}
              maxWidth={1024}
              maxHeight={1024}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleSave} disabled={isSaving} className="flex-1" variant="accent">
            <Save className="h-4 w-4" />
            Save
          </Button>
          <Button onClick={handleLogout} variant="outline" className="flex-1">
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
