import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/AdminSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCard from "@/components/StatsCard";
import { Building2, Users, DollarSign, Activity, Briefcase } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  const { user } = useAuth() as any;

  const { data: stats } = useQuery<any>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: tenants } = useQuery<any[]>({
    queryKey: ['/api/admin/tenants'],
  });

  const { data: users } = useQuery<any[]>({
    queryKey: ['/api/admin/users'],
  });

  const statsCards = [
    { 
      title: "Total Tenants", 
      value: stats?.totalTenants?.toString() || "0", 
      change: `${stats?.activeTenants || 0} active`, 
      changeType: "positive" as const, 
      icon: Building2 
    },
    { 
      title: "Active Users", 
      value: stats?.activeUsers?.toString() || "0", 
      change: `${stats?.totalUsers || 0} total`, 
      changeType: "neutral" as const, 
      icon: Users 
    },
    { 
      title: "Job Postings", 
      value: stats?.totalJobs?.toString() || "0", 
      change: "Active listings", 
      changeType: "neutral" as const, 
      icon: Briefcase 
    },
    { 
      title: "Applications", 
      value: stats?.totalApplications?.toString() || "0", 
      change: "Total submitted", 
      changeType: "positive" as const, 
      icon: Activity 
    },
  ];

  const systemMetrics = [
    { label: "API Response Time", value: "< 200ms", status: "healthy" },
    { label: "Database Status", value: "Operational", status: "healthy" },
    { label: "Total Tenants", value: stats?.totalTenants?.toString() || "0", status: "healthy" },
    { label: "Total Jobs", value: stats?.totalJobs?.toString() || "0", status: "healthy" },
  ];

  const style = {
    "--sidebar-width": "16rem",
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>;
      case "trial":
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Trial</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <div className="flex flex-col flex-1">
          <DashboardHeader 
            userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || "Admin"} 
            userRole="Platform Administrator" 
            notificationCount={0} 
          />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Platform Overview</h2>
                <p className="text-muted-foreground">Monitor system health, tenants, and revenue</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsCards.map((stat, index) => (
                  <StatsCard key={index} {...stat} />
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-semibold">Recent Tenants</h3>
                      <Button variant="outline" size="sm" data-testid="button-view-all-tenants">
                        View All
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {tenants && tenants.length > 0 ? (
                        tenants.slice(0, 4).map((tenant) => (
                          <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-md hover-elevate">
                            <div className="flex items-center gap-4">
                              <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <h4 className="font-medium">{tenant.name}</h4>
                                <p className="text-sm text-muted-foreground">{tenant.plan}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              {getStatusBadge(tenant.status)}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="py-8 text-center text-muted-foreground">
                          <p className="text-sm">No tenants yet</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">System Metrics</h3>
                    <div className="space-y-4">
                      {systemMetrics.map((metric, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{metric.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-medium">{metric.value}</span>
                            <div className="w-2 h-2 rounded-full bg-success" />
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" data-testid="button-create-tenant">
                        Create Tenant
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="button-view-logs">
                        View Audit Logs
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="button-system-settings">
                        System Settings
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
