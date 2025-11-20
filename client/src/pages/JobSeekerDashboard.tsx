import { Route, Switch } from "wouter";
import { SidebarProvider } from "@/components/ui/sidebar";
import JobSeekerSidebar from "@/components/JobSeekerSidebar";
import JobSeekerOverview from "./JobSeeker/Overview";
import JobSeekerProfile from "./JobSeeker/Profile";
import JobSeekerMatches from "./JobSeeker/Matches";
import JobSeekerApplications from "./JobSeeker/Applications";
import JobSeekerLearning from "./JobSeeker/Learning";
import JobSeekerSettings from "./JobSeeker/Settings";
import JobSeekerBilling from "./JobSeeker/Billing";
import SkillPassport from "./skill-passport";
import SkillTest from "./skill-test";

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
          <Route path="/dashboard/skill-passport" component={SkillPassport} />
          <Route path="/dashboard/skill-test" component={SkillTest} />
          <Route path="/dashboard/settings" component={JobSeekerSettings} />
          <Route path="/dashboard/billing" component={JobSeekerBilling} />
          <Route component={JobSeekerOverview} />
        </Switch>
      </div>
    </SidebarProvider>
  );
}
