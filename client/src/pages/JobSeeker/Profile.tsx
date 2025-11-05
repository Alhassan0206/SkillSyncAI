import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/DashboardHeader";
import ProfileSetupForm from "@/components/JobSeeker/ProfileSetupForm";
import JobSearchPanel from "@/components/JobSeeker/JobSearchPanel";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function JobSeekerProfile() {
  const { user } = useAuth() as any;
  
  const { data: profile } = useQuery<any>({
    queryKey: ['/api/job-seeker/profile'],
  });

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
            <h2 className="text-3xl font-bold mb-2">Profile</h2>
            <p className="text-muted-foreground">Manage your profile and search for jobs</p>
          </div>

          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList>
              <TabsTrigger value="profile" data-testid="tab-profile">My Profile</TabsTrigger>
              <TabsTrigger value="search" data-testid="tab-job-search">Job Search</TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile" className="space-y-6">
              <ProfileSetupForm initialData={profile} />
            </TabsContent>
            
            <TabsContent value="search" className="space-y-6">
              <JobSearchPanel />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
