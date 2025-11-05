import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Briefcase, MapPin, DollarSign, Search, Send } from "lucide-react";

export default function JobSearchPanel() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [coverLetter, setCoverLetter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: jobs, isLoading } = useQuery<any[]>({
    queryKey: ['/api/jobs'],
  });

  const applyMutation = useMutation({
    mutationFn: async ({ jobId, coverLetter }: { jobId: string; coverLetter: string }) => {
      const res = await apiRequest('POST', `/api/jobs/${jobId}/apply`, { coverLetter });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-seeker/applications'] });
      toast({
        title: "Application submitted",
        description: "Your application has been sent successfully",
      });
      setSelectedJob(null);
      setCoverLetter("");
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const filteredJobs = jobs?.filter(job => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      job.title.toLowerCase().includes(query) ||
      job.description.toLowerCase().includes(query) ||
      job.location.toLowerCase().includes(query)
    );
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading jobs...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Search Jobs</CardTitle>
          <CardDescription>Find your next opportunity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by title, description, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-job-search"
            />
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4">
        {filteredJobs && filteredJobs.length > 0 ? (
          filteredJobs.map((job) => (
            <Card key={job.id} className="hover:border-blue-500 transition-colors" data-testid={`card-job-${job.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">{job.title}</CardTitle>
                    <CardDescription className="mt-2">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {job.location}
                        </span>
                        {job.remote && <Badge variant="secondary">Remote</Badge>}
                        {job.salaryMin && job.salaryMax && (
                          <span className="flex items-center">
                            <DollarSign className="w-4 h-4 mr-1" />
                            {job.salaryCurrency} {(job.salaryMin / 1000).toFixed(0)}k - {(job.salaryMax / 1000).toFixed(0)}k
                          </span>
                        )}
                      </div>
                    </CardDescription>
                  </div>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button onClick={() => setSelectedJob(job)} data-testid={`button-apply-${job.id}`}>
                        Apply
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Apply for {selectedJob?.title}</DialogTitle>
                        <DialogDescription>
                          Submit your application with a cover letter
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div>
                          <label className="text-sm font-medium">Cover Letter (Optional)</label>
                          <Textarea
                            placeholder="Tell the employer why you're a great fit..."
                            value={coverLetter}
                            onChange={(e) => setCoverLetter(e.target.value)}
                            className="mt-2 min-h-[150px]"
                            data-testid="textarea-cover-letter"
                          />
                        </div>
                        <Button
                          className="w-full"
                          onClick={() => selectedJob && applyMutation.mutate({ jobId: selectedJob.id, coverLetter })}
                          disabled={applyMutation.isPending}
                          data-testid="button-submit-application"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          {applyMutation.isPending ? "Submitting..." : "Submit Application"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">
                  {job.description}
                </p>
                {job.requiredSkills && job.requiredSkills.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2">Required Skills:</p>
                    <div className="flex flex-wrap gap-2">
                      {job.requiredSkills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline">{skill}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Briefcase className="w-12 h-12 mx-auto text-gray-400 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">
                {searchQuery ? "No jobs found matching your search" : "No jobs available yet"}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
