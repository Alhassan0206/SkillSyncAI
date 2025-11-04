import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/AdminSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCard from "@/components/StatsCard";
import { Building2, Users, DollarSign, Activity } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function AdminDashboard() {
  // todo: remove mock functionality
  const mockStats = [
    { title: "Total Tenants", value: "248", change: "+12 this month", changeType: "positive" as const, icon: Building2 },
    { title: "Active Users", value: "12.5K", change: "+1.2K", changeType: "positive" as const, icon: Users },
    { title: "MRR", value: "$124K", change: "+8.5%", changeType: "positive" as const, icon: DollarSign },
    { title: "System Health", value: "99.8%", change: "All systems operational", changeType: "positive" as const, icon: Activity },
  ];

  const mockTenants = [
    { id: "1", name: "TechCorp Inc", plan: "Growth", mrr: "$299", users: 45, status: "active" },
    { id: "2", name: "InnovateLabs", plan: "Enterprise", mrr: "$999", users: 120, status: "active" },
    { id: "3", name: "StartupHub", plan: "Starter", mrr: "$99", users: 12, status: "trial" },
    { id: "4", name: "GlobalHire", plan: "Growth", mrr: "$299", users: 38, status: "active" },
  ];

  const mockSystemMetrics = [
    { label: "API Response Time", value: "145ms", status: "healthy" },
    { label: "Match Processing", value: "2.3s", status: "healthy" },
    { label: "Database Load", value: "45%", status: "healthy" },
    { label: "Queue Depth", value: "12", status: "healthy" },
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
          <DashboardHeader userName="Admin User" userRole="Platform Administrator" notificationCount={2} />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Platform Overview</h2>
                <p className="text-muted-foreground">Monitor system health, tenants, and revenue</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mockStats.map((stat, index) => (
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
                      {mockTenants.map((tenant) => (
                        <div key={tenant.id} className="flex items-center justify-between p-4 border rounded-md hover-elevate">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                              <Building2 className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <h4 className="font-medium">{tenant.name}</h4>
                              <p className="text-sm text-muted-foreground">{tenant.plan} • {tenant.users} users</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <span className="font-semibold">{tenant.mrr}</span>
                            {getStatusBadge(tenant.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">System Metrics</h3>
                    <div className="space-y-4">
                      {mockSystemMetrics.map((metric, index) => (
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
