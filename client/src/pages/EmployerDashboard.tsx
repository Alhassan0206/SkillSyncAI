import { Route, Switch } from "wouter";
import { SidebarProvider } from "@/components/ui/sidebar";
import EmployerSidebar from "@/components/EmployerSidebar";
import EmployerOverview from "./Employer/Overview";
import EmployerJobs from "./Employer/Jobs";
import EmployerCandidates from "./Employer/Candidates";
import EmployerAnalytics from "./Employer/Analytics";
import EmployerTeam from "./Employer/Team";
import EmployerTeamPermissions from "./Employer/TeamPermissions";
import EmployerApiManagement from "./Employer/ApiManagement";
import EmployerBilling from "./Employer/Billing";
import EmployerSettings from "./Employer/Settings";
import EmployerWebhooks from "./Employer/Webhooks";

export default function EmployerDashboard() {
  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <EmployerSidebar />
        <Switch>
          <Route path="/employer" component={EmployerOverview} />
          <Route path="/employer/jobs" component={EmployerJobs} />
          <Route path="/employer/candidates" component={EmployerCandidates} />
          <Route path="/employer/team" component={EmployerTeam} />
          <Route path="/employer/team/permissions" component={EmployerTeamPermissions} />
          <Route path="/employer/analytics" component={EmployerAnalytics} />
          <Route path="/employer/webhooks" component={EmployerWebhooks} />
          <Route path="/employer/api" component={EmployerApiManagement} />
          <Route path="/employer/billing" component={EmployerBilling} />
          <Route path="/employer/settings" component={EmployerSettings} />
          <Route component={EmployerOverview} />
        </Switch>
      </div>
    </SidebarProvider>
  );
}
