import { SidebarProvider } from "@/components/ui/sidebar";
import JobSeekerSidebar from "@/components/JobSeekerSidebar";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCard from "@/components/StatsCard";
import ProfileCompletionCard from "@/components/ProfileCompletionCard";
import JobMatchCard from "@/components/JobMatchCard";
import ApplicationTimelineCard from "@/components/ApplicationTimelineCard";
import { Target, Briefcase, CheckCircle, TrendingUp } from "lucide-react";

export default function JobSeekerDashboard() {
  // todo: remove mock functionality
  const mockStats = [
    { title: "Job Matches", value: "24", change: "+8 this week", changeType: "positive" as const, icon: Target },
    { title: "Applications", value: "12", change: "3 pending", changeType: "neutral" as const, icon: Briefcase },
    { title: "Profile Views", value: "156", change: "+23%", changeType: "positive" as const, icon: TrendingUp },
    { title: "Interviews", value: "5", change: "2 scheduled", changeType: "positive" as const, icon: CheckCircle },
  ];

  const mockProfileCompletion = {
    percentage: 60,
    items: [
      { label: "Upload resume", completed: true, action: "Upload" },
      { label: "Add skills", completed: true, action: "Add" },
      { label: "Complete work experience", completed: false, action: "Complete" },
      { label: "Add portfolio projects", completed: false, action: "Add" },
      { label: "Set profile visibility", completed: true, action: "Update" },
    ],
  };

  const mockMatches = [
    {
      id: "1",
      companyName: "TechCorp Inc",
      jobTitle: "Senior Frontend Developer",
      location: "San Francisco, CA",
      remote: true,
      salaryRange: "$120k - $160k",
      matchScore: 92,
      matchingSkills: ["React", "TypeScript", "Node.js"],
      gapSkills: ["GraphQL", "AWS"],
      matchExplanation: "Your 5+ years of React experience and TypeScript expertise align perfectly with this role.",
    },
    {
      id: "2",
      companyName: "InnovateLabs",
      jobTitle: "Full Stack Engineer",
      location: "New York, NY",
      remote: true,
      salaryRange: "$100k - $140k",
      matchScore: 85,
      matchingSkills: ["JavaScript", "React", "PostgreSQL"],
      gapSkills: ["Docker", "Kubernetes"],
      matchExplanation: "Your full-stack experience matches well. Consider learning container orchestration for a perfect fit.",
    },
  ];

  const mockApplication = {
    jobTitle: "Senior React Developer",
    companyName: "TechCorp Inc",
    events: [
      { stage: "Applied", status: "completed" as const, date: "Jan 15, 2024" },
      { stage: "Resume Reviewed", status: "completed" as const, date: "Jan 16, 2024" },
      { stage: "Phone Screen", status: "current" as const, date: "Jan 20, 2024", note: "Scheduled for tomorrow" },
      { stage: "Technical Interview", status: "pending" as const },
      { stage: "Final Interview", status: "pending" as const },
    ],
  };

  const style = {
    "--sidebar-width": "16rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <JobSeekerSidebar />
        <div className="flex flex-col flex-1">
          <DashboardHeader userName="John Doe" userRole="Job Seeker" notificationCount={3} />
          
          <main className="flex-1 overflow-auto p-6">
            <div className="max-w-screen-2xl mx-auto space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">Welcome back, John!</h2>
                <p className="text-muted-foreground">Here's what's happening with your job search</p>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {mockStats.map((stat, index) => (
                  <StatsCard key={index} {...stat} />
                ))}
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <div>
                    <h3 className="text-xl font-semibold mb-4">Top Job Matches</h3>
                    <div className="space-y-4">
                      {mockMatches.map((match) => (
                        <JobMatchCard key={match.id} {...match} />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <ProfileCompletionCard {...mockProfileCompletion} />
                  <ApplicationTimelineCard {...mockApplication} />
                </div>
              </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
