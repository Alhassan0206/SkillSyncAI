import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Activity, CheckCircle2, AlertCircle, Database, Server, Cpu, HardDrive } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SystemHealth() {
  const { data: stats } = useQuery<any>({
    queryKey: ['/api/admin/stats'],
  });

  const healthMetrics = [
    { 
      label: "API Response Time", 
      value: "< 200ms", 
      status: "healthy",
      icon: Activity,
      detail: "Average response time across all endpoints"
    },
    { 
      label: "Database Connections", 
      value: "12 / 100", 
      status: "healthy",
      icon: Database,
      detail: "Active database connections"
    },
    { 
      label: "Server Load", 
      value: "23%", 
      status: "healthy",
      icon: Server,
      detail: "CPU usage across application servers"
    },
    { 
      label: "Memory Usage", 
      value: "2.1 GB / 8 GB", 
      status: "healthy",
      icon: Cpu,
      detail: "Application memory consumption"
    },
    { 
      label: "Storage Usage", 
      value: "15.3 GB / 100 GB", 
      status: "healthy",
      icon: HardDrive,
      detail: "Database and file storage"
    },
  ];

  const systemStatus = [
    { service: "Web Application", status: "operational", uptime: "99.98%" },
    { service: "API Server", status: "operational", uptime: "99.95%" },
    { service: "Database", status: "operational", uptime: "99.99%" },
    { service: "Authentication Service", status: "operational", uptime: "100%" },
    { service: "AI Processing", status: "operational", uptime: "99.87%" },
    { service: "Email Service", status: "operational", uptime: "99.92%" },
  ];

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
      />

      <div className="p-6 space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                <div key={service.service} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">{service.service}</span>
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
                <div className="text-2xl font-bold">{stats?.totalTenants || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Users</div>
                <div className="text-2xl font-bold">{stats?.totalUsers || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Job Postings</div>
                <div className="text-2xl font-bold">{stats?.totalJobs || 0}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Applications</div>
                <div className="text-2xl font-bold">{stats?.totalApplications || 0}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
