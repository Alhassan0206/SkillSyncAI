import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/DashboardHeader";
import MatchesPanel from "@/components/JobSeeker/MatchesPanel";

export default function JobSeekerMatches() {
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
            <h2 className="text-3xl font-bold mb-2">Job Matches</h2>
            <p className="text-muted-foreground">AI-powered job recommendations based on your profile</p>
          </div>

          <MatchesPanel />
        </div>
      </main>
    </div>
  );
}
