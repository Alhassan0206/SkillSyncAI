import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

export default function ApplicationsPanel() {
  const { data: applications, isLoading } = useQuery<any[]>({
    queryKey: ['/api/job-seeker/applications'],
  });

  const { data: jobs } = useQuery<any[]>({
    queryKey: ['/api/jobs'],
  });

  const getJobDetails = (jobId: string) => {
    return jobs?.find(job => job.id === jobId);
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; icon: any }> = {
      applied: { variant: "secondary", icon: Clock },
      reviewing: { variant: "default", icon: AlertCircle },
      interview: { variant: "default", icon: CheckCircle },
      rejected: { variant: "destructive", icon: XCircle },
      accepted: { variant: "default", icon: CheckCircle },
    };
    const config = statusMap[status] || statusMap.applied;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="capitalize">
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading applications...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>My Applications</CardTitle>
          <CardDescription>
            Track the status of your job applications
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {applications && applications.length > 0 ? (
          applications.map((app) => {
            const job = getJobDetails(app.jobId);
            return (
              <Card key={app.id} data-testid={`card-application-${app.id}`}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{job?.title || "Job Title"}</CardTitle>
                      <CardDescription className="mt-1">
                        Applied on {new Date(app.createdAt).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    {getStatusBadge(app.status)}
                  </div>
                </CardHeader>
                <CardContent>
                  {app.timeline && app.timeline.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-medium">Application Timeline:</p>
                      <div className="space-y-2">
                        {app.timeline.map((event: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 text-sm">
                            <div className={`w-2 h-2 mt-2 rounded-full ${event.status === 'completed' ? 'bg-green-500' : 'bg-gray-300'}`} />
                            <div className="flex-1">
                              <p className="font-medium">{event.stage}</p>
                              {event.date && (
                                <p className="text-xs text-gray-600 dark:text-gray-400">{event.date}</p>
                              )}
                              {event.note && (
                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{event.note}</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Clock className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No applications yet</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Start applying to jobs to track your applications here
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
