import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCard from "@/components/StatsCard";
import { Briefcase, Users, Clock, TrendingUp, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";

export default function EmployerOverview() {
  const { user } = useAuth() as any;
  const [, navigate] = useLocation();
  
  const { data: profile } = useQuery<any>({
    queryKey: ['/api/employer/profile'],
  });

  const { data: jobs } = useQuery<any[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: applications } = useQuery<any[]>({
    queryKey: ['/api/employer/applications'],
  });

  const employerJobs = jobs?.filter(job => job.employerId === profile?.id) || [];
  
  const stats = [
    { 
      title: "Open Positions", 
      value: employerJobs.filter(j => j.status === 'active').length, 
      change: `${employerJobs.length} total`, 
      changeType: "neutral" as const, 
      icon: Briefcase 
    },
    { 
      title: "Applications", 
      value: applications?.length || 0, 
      change: `${applications?.filter(a => a.status === 'applied').length || 0} pending`, 
      changeType: "neutral" as const, 
      icon: Users 
    },
    { 
      title: "Active Jobs", 
      value: employerJobs.filter(j => j.status === 'active').length, 
      change: "Recruiting", 
      changeType: "positive" as const, 
      icon: TrendingUp 
    },
    { 
      title: "Interviews", 
      value: applications?.filter(a => a.status === 'interview').length || 0, 
      change: "Scheduled", 
      changeType: "neutral" as const, 
      icon: Clock 
    },
  ];

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader 
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || "User"} 
        userRole="Employer" 
        notificationCount={applications?.filter(a => a.status === 'applied').length || 0} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Dashboard</h2>
              <p className="text-muted-foreground">Manage your hiring pipeline and candidates</p>
            </div>
            <Button onClick={() => navigate('/employer/jobs')} data-testid="button-create-job">
              <Plus className="w-4 h-4 mr-2" />
              Post New Job
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <StatsCard key={index} {...stat} />
            ))}
          </div>

          <div className="grid gap-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Active Job Postings</h3>
              {employerJobs.length > 0 ? (
                <div className="space-y-4">
                  {employerJobs.slice(0, 5).map((job) => (
                    <div key={job.id} className="p-4 border rounded-md hover:border-blue-500 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{job.title}</h4>
                        <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{job.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{job.location}</span>
                        {job.remote && <Badge variant="outline" className="text-xs">Remote</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground">
                  <p>No job postings yet. Create your first job to start finding candidates!</p>
                  <Button className="mt-4" onClick={() => navigate('/employer/jobs')}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Job Posting
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
