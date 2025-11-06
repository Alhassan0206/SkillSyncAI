import { Route, Switch } from "wouter";
import { SidebarProvider } from "@/components/ui/sidebar";
import JobSeekerSidebar from "@/components/JobSeekerSidebar";
import JobSeekerOverview from "./JobSeeker/Overview";
import JobSeekerProfile from "./JobSeeker/Profile";
import JobSeekerMatches from "./JobSeeker/Matches";
import JobSeekerApplications from "./JobSeeker/Applications";
import JobSeekerLearning from "./JobSeeker/Learning";

export default function JobSeekerDashboard() {
  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <JobSeekerSidebar />
        <Switch>
          <Route path="/" component={JobSeekerOverview} />
          <Route path="/dashboard" component={JobSeekerOverview} />
          <Route path="/dashboard/profile" component={JobSeekerProfile} />
          <Route path="/dashboard/matches" component={JobSeekerMatches} />
          <Route path="/dashboard/applications" component={JobSeekerApplications} />
          <Route path="/dashboard/learning" component={JobSeekerLearning} />
          <Route component={JobSeekerOverview} />
        </Switch>
      </div>
    </SidebarProvider>
  );
}
