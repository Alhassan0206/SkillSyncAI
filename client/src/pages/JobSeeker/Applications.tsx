import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/DashboardHeader";
import ApplicationsPanel from "@/components/JobSeeker/ApplicationsPanel";

export default function JobSeekerApplications() {
  const { user } = useAuth() as any;

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader 
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || "User"} 
        userRole="Job Seeker" 
        notificationCount={0} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">My Applications</h2>
            <p className="text-muted-foreground">Track your job application status</p>
          </div>

          <ApplicationsPanel />
        </div>
      </main>
    </div>
  );
}
