import { SidebarProvider } from "@/components/ui/sidebar";
import EmployerSidebar from "@/components/EmployerSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCard from "@/components/StatsCard";
import CandidateMatchCard from "@/components/CandidateMatchCard";
import { Briefcase, Users, Clock, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";

export default function EmployerDashboard() {
  // todo: remove mock functionality
  const mockStats = [
    { title: "Open Positions", value: "8", change: "+2 this month", changeType: "positive" as const, icon: Briefcase },
    { title: "Candidates", value: "142", change: "+34 new", changeType: "positive" as const, icon: Users },
    { title: "Avg. Time to Hire", value: "18d", change: "-5 days", changeType: "positive" as const, icon: Clock },
    { title: "Match Rate", value: "78%", change: "+12%", changeType: "positive" as const, icon: TrendingUp },
  ];

  const mockCandidates = [
    {
      id: "1",
      name: "Sarah Johnson",
      currentRole: "Full Stack Developer",
      location: "New York, NY",
      matchScore: 94,
      skills: ["React", "Node.js", "TypeScript", "PostgreSQL"],
      experience: "5+ years",
      githubUrl: "https://github.com/sarahjohnson",
      matchExplanation: "Strong technical background with expertise in React and Node.js. Active open-source contributor.",
    },
    {
      id: "2",
      name: "Michael Chen",
      currentRole: "Senior Frontend Engineer",
      location: "San Francisco, CA",
      matchScore: 89,
      skills: ["React", "Vue.js", "TypeScript", "CSS"],
      experience: "7+ years",
      matchExplanation: "Extensive frontend experience with a strong portfolio of scalable applications.",
    },
  ];

  const mockJobs = [
    { id: "1", title: "Senior Frontend Developer", applicants: 23, matches: 12, status: "active" },
    { id: "2", title: "Full Stack Engineer", applicants: 18, matches: 8, status: "active" },
    { id: "3", title: "DevOps Engineer", applicants: 15, matches: 6, status: "active" },
  ];

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <EmployerSidebar />
        <div className="flex flex-col flex-1">
          <DashboardHeader userName="Jane Smith" userRole="Recruiter at TechCorp" notificationCount={5} />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
                  <p className="text-muted-foreground">Manage your hiring pipeline and candidates</p>
                </div>
                <Button data-testid="button-create-job">
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Job
                </Button>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mockStats.map((stat, index) => (
                  <StatsCard key={index} {...stat} />
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Top Candidate Matches</h3>
                    <div className="space-y-4">
                      {mockCandidates.map((candidate) => (
                        <CandidateMatchCard key={candidate.id} {...candidate} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Active Job Postings</h3>
                    <div className="space-y-4">
                      {mockJobs.map((job) => (
                        <div key={job.id} className="p-4 border rounded-md hover-elevate">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium">{job.title}</h4>
                            <Badge variant="secondary" className="bg-success/10 text-success">
                              {job.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>{job.applicants} applicants</span>
                            <span>{job.matches} matches</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full mt-4" data-testid="button-view-all-jobs">
                      View All Jobs
                    </Button>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
                    <div className="space-y-2">
                      <Button variant="outline" className="w-full justify-start" data-testid="button-schedule-interview">
                        Schedule Interviews
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="button-invite-team">
                        Invite Team Members
                      </Button>
                      <Button variant="outline" className="w-full justify-start" data-testid="button-view-analytics">
                        View Analytics
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
