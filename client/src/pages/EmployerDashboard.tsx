import { Route, Switch } from "wouter";
import { SidebarProvider } from "@/components/ui/sidebar";
import EmployerSidebar from "@/components/EmployerSidebar";
import EmployerOverview from "./Employer/Overview";
import EmployerJobs from "./Employer/Jobs";

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
          <Route path="/employer/candidates" component={EmployerOverview} />
          <Route component={EmployerOverview} />
        </Switch>
      </div>
    </SidebarProvider>
  );
}
