import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';
import { Server, HardDrive, Cpu, MemoryStick, Wifi, RefreshCw, Clock, Activity } from 'lucide-react';

interface ServiceStatus {
  name: string;
  status: 'operational' | 'degraded' | 'down';
  uptime: string;
  responseTime: string;
}

const AdminSystemServerStatus = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [lastChecked, setLastChecked] = useState(new Date());

  const services: ServiceStatus[] = [
    { name: 'Web Server', status: 'operational', uptime: '99.98%', responseTime: '45ms' },
    { name: 'Database', status: 'operational', uptime: '99.99%', responseTime: '12ms' },
    { name: 'Authentication', status: 'operational', uptime: '99.97%', responseTime: '38ms' },
    { name: 'File Storage', status: 'operational', uptime: '99.95%', responseTime: '67ms' },
    { name: 'Edge Functions', status: 'operational', uptime: '99.90%', responseTime: '120ms' },
    { name: 'Email Service', status: 'operational', uptime: '99.85%', responseTime: '210ms' },
  ];

  const serverMetrics = {
    cpuUsage: 23,
    memoryUsage: 58,
    diskUsage: 42,
    networkIn: '1.2 GB/h',
    networkOut: '3.8 GB/h',
    activeConnections: 142,
    requestsPerMin: 856,
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await new Promise(r => setTimeout(r, 1500));
    setLastChecked(new Date());
    setRefreshing(false);
    toast({ title: 'Status Refreshed', description: 'All services checked successfully.' });
  };

  const statusColor = (s: string) => s === 'operational' ? 'default' : s === 'degraded' ? 'secondary' : 'destructive';

  return (
    <AdminLayout titleKey="admin.system.serverStatus">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Last checked: {lastChecked.toLocaleTimeString()}
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing} variant="outline" size="sm">
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Resource Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Cpu className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">CPU Usage</span>
              </div>
              <p className="text-2xl font-bold mb-2">{serverMetrics.cpuUsage}%</p>
              <Progress value={serverMetrics.cpuUsage} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <MemoryStick className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Memory</span>
              </div>
              <p className="text-2xl font-bold mb-2">{serverMetrics.memoryUsage}%</p>
              <Progress value={serverMetrics.memoryUsage} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <HardDrive className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Disk</span>
              </div>
              <p className="text-2xl font-bold mb-2">{serverMetrics.diskUsage}%</p>
              <Progress value={serverMetrics.diskUsage} className="h-2" />
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Activity className="h-4 w-4 text-primary" />
                <span className="text-sm font-medium">Requests/min</span>
              </div>
              <p className="text-2xl font-bold">{serverMetrics.requestsPerMin}</p>
              <p className="text-xs text-muted-foreground">{serverMetrics.activeConnections} active connections</p>
            </CardContent>
          </Card>
        </div>

        {/* Network */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Wifi className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Network In</p>
                <p className="text-lg font-bold">{serverMetrics.networkIn}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Wifi className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm font-medium">Network Out</p>
                <p className="text-lg font-bold">{serverMetrics.networkOut}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Service Status
            </CardTitle>
            <CardDescription>Current status of all platform services</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {services.map((service) => (
                <div key={service.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className={`h-2.5 w-2.5 rounded-full ${service.status === 'operational' ? 'bg-green-500' : service.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'}`} />
                    <span className="font-medium text-sm">{service.name}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs text-muted-foreground">Uptime: {service.uptime}</span>
                    <span className="text-xs text-muted-foreground">Response: {service.responseTime}</span>
                    <Badge variant={statusColor(service.status)} className="text-xs capitalize">
                      {service.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSystemServerStatus;
