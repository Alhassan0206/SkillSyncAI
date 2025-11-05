import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCard from "@/components/StatsCard";
import ProfileCompletionCard from "@/components/ProfileCompletionCard";
import JobMatchCard from "@/components/JobMatchCard";
import { Target, Briefcase, CheckCircle, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";

export default function JobSeekerOverview() {
  const { user } = useAuth() as any;
  const [, navigate] = useLocation();
  
  const { data: profile } = useQuery<any>({
    queryKey: ['/api/job-seeker/profile'],
  });

  const { data: matches } = useQuery<any[]>({
    queryKey: ['/api/job-seeker/matches'],
  });

  const { data: applications } = useQuery<any[]>({
    queryKey: ['/api/job-seeker/applications'],
  });

  const { data: jobs } = useQuery<any[]>({
    queryKey: ['/api/jobs'],
  });

  const getJobDetails = (jobId: string) => {
    return jobs?.find(job => job.id === jobId);
  };

  const calculateProfileCompletion = () => {
    if (!profile) return { percentage: 0, items: [] };
    
    const items = [
      { label: "Add current role", completed: !!profile.currentRole, action: "Complete" },
      { label: "Add skills", completed: profile.skills?.length > 0, action: "Add" },
      { label: "Add location", completed: !!profile.location, action: "Add" },
      { label: "Add bio", completed: !!profile.bio, action: "Write" },
      { label: "Add resume", completed: !!profile.resumeText || !!profile.resumeUrl, action: "Upload" },
    ];
    
    const completed = items.filter(item => item.completed).length;
    const percentage = Math.round((completed / items.length) * 100);
    
    return { percentage, items };
  };

  const profileCompletion = calculateProfileCompletion();
  
  const stats = [
    { 
      title: "Job Matches", 
      value: matches?.length || 0, 
      change: `${matches?.length || 0} available`, 
      changeType: "neutral" as const, 
      icon: Target 
    },
    { 
      title: "Applications", 
      value: applications?.length || 0, 
      change: `${applications?.filter(a => a.status === 'applied').length || 0} pending`, 
      changeType: "neutral" as const, 
      icon: Briefcase 
    },
    { 
      title: "Profile Completion", 
      value: `${profileCompletion.percentage}%`, 
      change: profileCompletion.percentage === 100 ? "Complete" : "In progress", 
      changeType: profileCompletion.percentage === 100 ? "positive" as const : "neutral" as const, 
      icon: TrendingUp 
    },
    { 
      title: "Interviews", 
      value: applications?.filter(a => a.status === 'interview').length || 0, 
      change: "Upcoming", 
      changeType: "neutral" as const, 
      icon: CheckCircle 
    },
  ];

  const topMatches = matches?.sort((a, b) => b.matchScore - a.matchScore).slice(0, 3) || [];

  const userName = user?.firstName || user?.email?.split('@')[0] || "there";

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader 
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || "User"} 
        userRole="Job Seeker" 
        notificationCount={matches?.length || 0} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Welcome back, {userName}!</h2>
            <p className="text-muted-foreground">Here's what's happening with your job search</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-semibold">Top Job Matches</h3>
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/dashboard/matches')}
                    data-testid="button-view-all-matches"
                  >
                    View All
                  </Button>
                </div>
                {topMatches.length > 0 ? (
                  <div className="space-y-4">
                    {topMatches.map((match) => {
                      const job = getJobDetails(match.jobId);
                      return (
                        <JobMatchCard 
                          key={match.id} 
                          id={match.id}
                          jobTitle={job?.title || "Job Title"}
                          companyName="Company"
                          location={job?.location || "Location"}
                          remote={job?.remote}
                          salaryRange={job?.salaryMin && job?.salaryMax ? 
                            `$${(job.salaryMin / 1000).toFixed(0)}k - $${(job.salaryMax / 1000).toFixed(0)}k` : 
                            undefined}
                          matchScore={match.matchScore}
                          matchingSkills={match.matchingSkills || []}
                          gapSkills={match.gapSkills || []}
                          matchExplanation={match.explanation || ""}
                        />
                      );
                    })}
                  </div>
                ) : (
                  <div className="border rounded-lg p-8 text-center text-muted-foreground">
                    <p>No matches yet. Complete your profile to get AI-powered job matches!</p>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-6">
              <ProfileCompletionCard {...profileCompletion} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
