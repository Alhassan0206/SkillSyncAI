import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/DashboardHeader";
import StatsCard from "@/components/StatsCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, Users, Eye, Target, Award, Download } from "lucide-react";
import { ApplicationFunnelChartComponent } from "@/components/charts/ApplicationFunnelChart";
import { JobPerformanceChart } from "@/components/charts/JobPerformanceChart";
import { MatchAcceptanceChart } from "@/components/charts/MatchAcceptanceChart";
import { exportToCSV } from "@/lib/csvExport";

export default function EmployerAnalytics() {
  const { user } = useAuth() as any;
  
  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ['/api/employer/profile'],
  });

  const { data: jobs, isLoading: jobsLoading } = useQuery<any[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: applications, isLoading: applicationsLoading } = useQuery<any[]>({
    queryKey: ['/api/employer/applications'],
  });

  const isLoading = profileLoading || jobsLoading || applicationsLoading;

  const employerJobs = jobs?.filter(job => job.employerId === profile?.id) || [];
  
  const totalApplications = applications?.length || 0;
  const avgApplicationsPerJob = employerJobs.length > 0 
    ? Math.round(totalApplications / employerJobs.length) 
    : 0;
  
  const interviewRate = totalApplications > 0
    ? Math.round((applications?.filter(a => a.status === 'interview').length || 0) / totalApplications * 100)
    : 0;
  
  const acceptanceRate = totalApplications > 0
    ? Math.round((applications?.filter(a => a.status === 'accepted').length || 0) / totalApplications * 100)
    : 0;

  const stats = [
    { 
      title: "Total Applications", 
      value: totalApplications, 
      change: `${avgApplicationsPerJob} avg per job`, 
      changeType: "neutral" as const, 
      icon: Users 
    },
    { 
      title: "Interview Rate", 
      value: `${interviewRate}%`, 
      change: `${applications?.filter(a => a.status === 'interview').length || 0} candidates`, 
      changeType: interviewRate >= 20 ? "positive" as const : "neutral" as const, 
      icon: Target 
    },
    { 
      title: "Active Jobs", 
      value: employerJobs.filter(j => j.status === 'active').length, 
      change: `${employerJobs.length} total`, 
      changeType: "neutral" as const, 
      icon: Eye 
    },
    { 
      title: "Acceptance Rate", 
      value: `${acceptanceRate}%`, 
      change: `${applications?.filter(a => a.status === 'accepted').length || 0} accepted`, 
      changeType: acceptanceRate >= 10 ? "positive" as const : "neutral" as const, 
      icon: Award 
    },
  ];

  const jobPerformance = employerJobs.map(job => {
    const jobApps = applications?.filter(a => a.jobId === job.id) || [];
    return {
      title: job.title,
      applications: jobApps.length,
      interviews: jobApps.filter(a => a.status === 'interview').length,
      accepted: jobApps.filter(a => a.status === 'accepted').length,
      status: job.status,
    };
  }).sort((a, b) => b.applications - a.applications);

  const funnelData = [
    { name: "Applied", value: applications?.filter(a => a.status === 'applied').length || 0, fill: "hsl(var(--primary))" },
    { name: "Reviewing", value: applications?.filter(a => a.status === 'reviewing').length || 0, fill: "hsl(var(--warning))" },
    { name: "Interview", value: applications?.filter(a => a.status === 'interview').length || 0, fill: "hsl(var(--chart-3))" },
    { name: "Accepted", value: applications?.filter(a => a.status === 'accepted').length || 0, fill: "hsl(var(--success))" },
  ];

  const acceptanceData = [
    { name: "Accepted", value: applications?.filter(a => a.status === 'accepted').length || 0 },
    { name: "Interview", value: applications?.filter(a => a.status === 'interview').length || 0 },
    { name: "Reviewing", value: applications?.filter(a => a.status === 'reviewing').length || 0 },
    { name: "Rejected", value: applications?.filter(a => a.status === 'rejected').length || 0 },
  ];

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader 
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || "User"} 
        userRole="Employer" 
        notificationCount={0} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Analytics & Insights</h2>
            <p className="text-muted-foreground">Track your hiring performance and metrics</p>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-muted-foreground">Loading analytics...</p>
              </div>
            </div>
          ) : (
            <>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <StatsCard key={index} {...stat} />
                ))}
              </div>

          <JobPerformanceChart data={jobPerformance} />

          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
              <div>
                <CardTitle>Job Performance Details</CardTitle>
                <CardDescription>
                  Application metrics across all your job postings
                </CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportToCSV(jobPerformance, 'job-performance-details')}
                data-testid="button-export-job-details"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </CardHeader>
            <CardContent>
              {jobPerformance.length > 0 ? (
                <div className="space-y-4">
                  {jobPerformance.map((job, idx) => (
                    <div key={idx} className="p-4 border rounded-lg" data-testid={`job-performance-${idx}`}>
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium">{job.title}</h4>
                          <Badge variant={job.status === 'active' ? 'default' : 'secondary'} className="mt-1">
                            {job.status}
                          </Badge>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground mb-1">Applications</div>
                          <div className="text-2xl font-semibold">{job.applications}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Interviews</div>
                          <div className="text-2xl font-semibold">{job.interviews}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground mb-1">Accepted</div>
                          <div className="text-2xl font-semibold text-green-600 dark:text-green-400">
                            {job.accepted}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No job data available. Create job postings to see analytics.</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            <ApplicationFunnelChartComponent data={funnelData} />
            <MatchAcceptanceChart data={acceptanceData} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Insights</CardTitle>
              <CardDescription>Key hiring metrics at a glance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Most Popular Job</span>
                <span className="text-sm font-medium">
                  {jobPerformance[0]?.title || "N/A"}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Candidates</span>
                <span className="text-sm font-medium">{totalApplications}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg. Applications/Job</span>
                <span className="text-sm font-medium">{avgApplicationsPerJob}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">
                  {acceptanceRate}%
                </span>
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
