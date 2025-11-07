import { Route, Switch } from "wouter";
import { SidebarProvider } from "@/components/ui/sidebar";
import AdminSidebar from "@/components/AdminSidebar";
import AdminOverview from "./Admin/Overview";
import AdminTenants from "./Admin/Tenants";
import AdminUsers from "./Admin/Users";
import AdminSystemHealth from "./Admin/SystemHealth";
import AdminFinance from "./Admin/Finance";
import AdminAuditLogs from "./Admin/AuditLogs";
import AdminFeatureFlags from "./Admin/FeatureFlags";
import AdminSettings from "./Admin/Settings";

export default function AdminDashboard() {
  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AdminSidebar />
        <Switch>
          <Route path="/admin" component={AdminOverview} />
          <Route path="/admin/tenants" component={AdminTenants} />
          <Route path="/admin/users" component={AdminUsers} />
          <Route path="/admin/health" component={AdminSystemHealth} />
          <Route path="/admin/finance" component={AdminFinance} />
          <Route path="/admin/logs" component={AdminAuditLogs} />
          <Route path="/admin/flags" component={AdminFeatureFlags} />
          <Route path="/admin/settings" component={AdminSettings} />
          <Route component={AdminOverview} />
        </Switch>
      </div>
    </SidebarProvider>
  );
}
