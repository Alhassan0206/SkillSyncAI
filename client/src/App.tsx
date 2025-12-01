import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/Landing";
import Login from "@/pages/Login";
import Features from "@/pages/Features";
import Pricing from "@/pages/Pricing";
import About from "@/pages/About";
import Contact from "@/pages/Contact";
import Resources from "@/pages/Resources";
import FAQ from "@/pages/FAQ";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import RoleSelection from "@/pages/RoleSelection";
import JobSeekerDashboard from "@/pages/JobSeekerDashboard";
import EmployerDashboard from "@/pages/EmployerDashboard";
import AdminDashboard from "@/pages/AdminDashboard";
import VerifySkills from "@/pages/VerifySkills";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth() as { 
    isAuthenticated: boolean; 
    isLoading: boolean; 
    user: any;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={Landing} />
        <Route path="/login" component={Login} />
        <Route path="/features" component={Features} />
        <Route path="/pricing" component={Pricing} />
        <Route path="/about" component={About} />
        <Route path="/contact" component={Contact} />
        <Route path="/resources" component={Resources} />
        <Route path="/faq" component={FAQ} />
        <Route path="/terms" component={Terms} />
        <Route path="/privacy" component={Privacy} />
        <Route path="/verify/skills/:jobSeekerId" component={VerifySkills} />
        <Route component={Landing} />
      </Switch>
    );
  }

  if (!user?.role || (user.role === 'job_seeker' && !user.jobSeeker) || (user.role === 'employer' && !user.employer)) {
    return <RoleSelection />;
  }

  if (user.role === 'admin') {
    return (
      <Switch>
        <Route path="/" component={AdminDashboard} />
        <Route path="/admin" component={AdminDashboard} />
        <Route path="/admin/:rest*" component={AdminDashboard} />
        <Route path="/verify/skills/:jobSeekerId" component={VerifySkills} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  if (user.role === 'employer') {
    return (
      <Switch>
        <Route path="/" component={EmployerDashboard} />
        <Route path="/employer" component={EmployerDashboard} />
        <Route path="/employer/:rest*" component={EmployerDashboard} />
        <Route path="/verify/skills/:jobSeekerId" component={VerifySkills} />
        <Route component={NotFound} />
      </Switch>
    );
  }

  return (
    <Switch>
      <Route path="/" component={JobSeekerDashboard} />
      <Route path="/dashboard" component={JobSeekerDashboard} />
      <Route path="/dashboard/:rest*" component={JobSeekerDashboard} />
      <Route path="/verify/skills/:jobSeekerId" component={VerifySkills} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
