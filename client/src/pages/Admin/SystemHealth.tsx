import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Activity, CheckCircle2, AlertCircle, Database, Server, Cpu, HardDrive, RefreshCw } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface SystemHealthData {
  status: string;
  timestamp: string;
  metrics: {
    apiResponseTime: string;
    databaseStatus: string;
    memoryUsage: {
      used: string;
      total: string;
      percentage: number;
    };
    uptime: string;
    nodeVersion: string;
  };
  services: Array<{
    name: string;
    status: string;
    uptime: string;
    lastCheck?: string;
    responseTime?: string;
    connections?: string;
  }>;
  database: {
    totalTenants: number;
    totalUsers: number;
    totalJobs: number;
    totalApplications: number;
  };
}

export default function SystemHealth() {
  const { data: healthData, isLoading, refetch, isFetching } = useQuery<SystemHealthData>({
    queryKey: ['/api/admin/system-health'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: stats } = useQuery<any>({
    queryKey: ['/api/admin/stats'],
  });

  const healthMetrics = healthData ? [
    {
      label: "API Response Time",
      value: healthData.metrics.apiResponseTime,
      status: parseInt(healthData.metrics.apiResponseTime) < 500 ? "healthy" : "degraded",
      icon: Activity,
      detail: "Database query response time"
    },
    {
      label: "Database Connections",
      value: healthData.services.find(s => s.name === 'Database')?.connections || "N/A",
      status: healthData.metrics.databaseStatus,
      icon: Database,
      detail: "Active database connections"
    },
    {
      label: "Server Uptime",
      value: healthData.metrics.uptime,
      status: "healthy",
      icon: Server,
      detail: `Node.js ${healthData.metrics.nodeVersion}`
    },
    {
      label: "Memory Usage",
      value: `${healthData.metrics.memoryUsage.used} / ${healthData.metrics.memoryUsage.total}`,
      status: healthData.metrics.memoryUsage.percentage < 80 ? "healthy" : "degraded",
      icon: Cpu,
      detail: `${healthData.metrics.memoryUsage.percentage}% utilized`
    },
  ] : [];

  const systemStatus = healthData?.services || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "healthy":
      case "operational":
        return <Badge variant="secondary" className="bg-success/10 text-success flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" />
          Healthy
        </Badge>;
      case "degraded":
        return <Badge variant="secondary" className="bg-warning/10 text-warning flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Degraded
        </Badge>;
      case "down":
        return <Badge variant="destructive" className="flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          Down
        </Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="flex-1 overflow-auto">
      <DashboardHeader
        title="System Health"
        subtitle="Monitor platform performance and infrastructure"
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            data-testid="button-refresh"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="p-6 space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading system health data...</p>
            </div>
          </div>
        ) : (
          <>
        {healthData && (
          <Card className="border-green-200 bg-green-50/50 dark:bg-green-900/10 dark:border-green-800">
            <CardContent className="pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-400">All Systems Operational</span>
                </div>
                <span className="text-sm text-muted-foreground">
                  Last checked: {new Date(healthData.timestamp).toLocaleTimeString()}
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {healthMetrics.map((metric) => (
            <Card key={metric.label} data-testid={`card-${metric.label.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium flex items-center gap-2">
                    <metric.icon className="w-4 h-4 text-muted-foreground" />
                    {metric.label}
                  </CardTitle>
                  {getStatusBadge(metric.status)}
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{metric.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{metric.detail}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card data-testid="card-system-status">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              System Services
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {systemStatus.map((service) => (
                <div key={service.name} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{service.name}</span>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">Uptime: {service.uptime}</span>
                        {getStatusBadge(service.status)}
                      </div>
                    </div>
                    <Progress value={parseFloat(service.uptime)} className="h-2" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-database-stats">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Database Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <div className="text-sm text-muted-foreground">Total Tenants</div>
                <div className="text-2xl font-bold">{healthData?.database.totalTenants || stats?.totalTenants || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Users</div>
                <div className="text-2xl font-bold">{healthData?.database.totalUsers || stats?.totalUsers || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Job Postings</div>
                <div className="text-2xl font-bold">{healthData?.database.totalJobs || stats?.totalJobs || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Applications</div>
                <div className="text-2xl font-bold">{healthData?.database.totalApplications || stats?.totalApplications || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
          </>
        )}
      </div>
    </div>
  );
}
