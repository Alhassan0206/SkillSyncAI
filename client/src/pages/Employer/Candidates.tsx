import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Search, Star, Mail, Phone, MapPin, Briefcase } from "lucide-react";
import { useState } from "react";

export default function EmployerCandidates() {
  const { user } = useAuth() as any;
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: applications } = useQuery<any[]>({
    queryKey: ['/api/employer/applications'],
  });

  const { data: jobs } = useQuery<any[]>({
    queryKey: ['/api/jobs'],
  });

  const getJobTitle = (jobId: string) => {
    return jobs?.find(job => job.id === jobId)?.title || "Unknown Job";
  };

  const filteredApplications = applications?.filter(app => {
    if (!searchQuery) return true;
    const job = jobs?.find(j => j.id === app.jobId);
    const query = searchQuery.toLowerCase();
    return job?.title?.toLowerCase().includes(query);
  });

  const pendingApps = filteredApplications?.filter(app => app.status === 'applied') || [];
  const interviewApps = filteredApplications?.filter(app => app.status === 'interview') || [];
  const allApps = filteredApplications || [];

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader 
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || "User"} 
        userRole="Employer" 
        notificationCount={pendingApps.length} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Candidates</h2>
              <p className="text-muted-foreground">Review and manage candidate applications</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by job title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
                data-testid="input-search-candidates"
              />
            </div>
          </div>

          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all" data-testid="tab-all-candidates">
                All ({allApps.length})
              </TabsTrigger>
              <TabsTrigger value="pending" data-testid="tab-pending-candidates">
                Pending ({pendingApps.length})
              </TabsTrigger>
              <TabsTrigger value="interview" data-testid="tab-interview-candidates">
                Interview ({interviewApps.length})
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="all" className="space-y-4">
              <CandidateList applications={allApps} getJobTitle={getJobTitle} />
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              <CandidateList applications={pendingApps} getJobTitle={getJobTitle} />
            </TabsContent>
            
            <TabsContent value="interview" className="space-y-4">
              <CandidateList applications={interviewApps} getJobTitle={getJobTitle} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function CandidateList({ applications, getJobTitle }: { applications: any[]; getJobTitle: (id: string) => string }) {
  if (!applications || applications.length === 0) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="text-center">
            <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No candidates yet</h3>
            <p className="text-muted-foreground">
              Candidates will appear here when they apply to your jobs
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {applications.map((app) => (
        <Card key={app.id} className="hover:border-primary/50 transition-colors" data-testid={`card-candidate-${app.id}`}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Briefcase className="w-4 h-4" />
                  {getJobTitle(app.jobId)}
                </CardTitle>
                <CardDescription className="mt-1">
                  Applied {new Date(app.createdAt).toLocaleDateString()}
                </CardDescription>
              </div>
              <Badge variant={app.status === 'applied' ? 'secondary' : 'default'} className="capitalize">
                {app.status}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {app.coverLetter && (
              <div>
                <h4 className="text-sm font-medium mb-2">Cover Letter</h4>
                <p className="text-sm text-muted-foreground line-clamp-3">{app.coverLetter}</p>
              </div>
            )}
            
            {app.timeline && app.timeline.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Application Timeline</h4>
                <div className="space-y-2">
                  {app.timeline.slice(-3).map((event: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <Badge variant="outline" className="text-xs">
                        {event.stage}
                      </Badge>
                      {event.date && (
                        <span className="text-muted-foreground">
                          {new Date(event.date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <Button size="sm" data-testid={`button-view-candidate-${app.id}`}>
                View Full Profile
              </Button>
              <Button size="sm" variant="outline" data-testid={`button-contact-candidate-${app.id}`}>
                <Mail className="w-4 h-4 mr-2" />
                Contact
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
