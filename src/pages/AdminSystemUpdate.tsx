import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { toast } from '@/hooks/use-toast';
import { RefreshCw, CheckCircle, Download, Info } from 'lucide-react';

const AdminSystemUpdate = () => {
  const [checking, setChecking] = useState(false);
  const [updating, setUpdating] = useState(false);

  const currentVersion = '2.5.3';
  const latestVersion = '2.5.3';
  const isUpToDate = currentVersion === latestVersion;

  const changelog = [
    { version: '2.5.3', date: '2026-03-08', changes: ['OTP System module added', 'Bug fixes for preorder module', 'Performance improvements'] },
    { version: '2.5.2', date: '2026-03-01', changes: ['Marketing bulk SMS feature', 'Seller verification fields', 'Dashboard analytics improvements'] },
    { version: '2.5.1', date: '2026-02-20', changes: ['Preorder system launch', 'Coupon usage tracking', 'Courier management updates'] },
  ];

  const handleCheckUpdate = async () => {
    setChecking(true);
    await new Promise(r => setTimeout(r, 2000));
    setChecking(false);
    toast({ title: isUpToDate ? 'System is up to date' : 'Update available!', description: isUpToDate ? `You are running the latest version (${currentVersion})` : `Version ${latestVersion} is available` });
  };

  const handleUpdate = async () => {
    setUpdating(true);
    await new Promise(r => setTimeout(r, 3000));
    setUpdating(false);
    toast({ title: 'Update Complete', description: 'System has been updated successfully.' });
  };

  return (
    <AdminLayout titleKey="admin.system.update">
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              System Update
            </CardTitle>
            <CardDescription>Check for and install system updates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted">
              <div>
                <p className="font-medium">Current Version</p>
                <p className="text-2xl font-bold">{currentVersion}</p>
              </div>
              <Badge variant={isUpToDate ? 'default' : 'destructive'} className="text-sm">
                {isUpToDate ? (
                  <span className="flex items-center gap-1"><CheckCircle className="h-3 w-3" /> Up to date</span>
                ) : 'Update Available'}
              </Badge>
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCheckUpdate} disabled={checking} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${checking ? 'animate-spin' : ''}`} />
                {checking ? 'Checking...' : 'Check for Updates'}
              </Button>
              {!isUpToDate && (
                <Button onClick={handleUpdate} disabled={updating}>
                  <Download className="h-4 w-4 mr-2" />
                  {updating ? 'Updating...' : `Update to ${latestVersion}`}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Changelog</CardTitle>
            <CardDescription>Recent version history</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {changelog.map((entry) => (
                <div key={entry.version} className="border-l-2 border-primary pl-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline">v{entry.version}</Badge>
                    <span className="text-sm text-muted-foreground">{entry.date}</span>
                  </div>
                  <ul className="space-y-1">
                    {entry.changes.map((change, i) => (
                      <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                        <Info className="h-3 w-3 mt-1 shrink-0" />
                        {change}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSystemUpdate;
