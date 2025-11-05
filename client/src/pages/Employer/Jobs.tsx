import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, MapPin, DollarSign, Briefcase } from "lucide-react";

export default function EmployerJobs() {
  const { user } = useAuth() as any;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery<any>({
    queryKey: ['/api/employer/profile'],
  });

  const { data: jobs, isLoading } = useQuery<any[]>({
    queryKey: ['/api/jobs'],
  });

  const employerJobs = jobs?.filter(job => job.employerId === profile?.id) || [];

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/employer/jobs', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job posted successfully",
        description: "Your job posting is now live",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create job posting",
        variant: "destructive",
      });
    },
  });

  const handleCreateJob = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      location: formData.get('location'),
      remote: formData.get('remote') === 'on',
      salaryMin: parseInt(formData.get('salaryMin') as string) || undefined,
      salaryMax: parseInt(formData.get('salaryMax') as string) || undefined,
      salaryCurrency: 'USD',
      requiredSkills: (formData.get('requiredSkills') as string)?.split(',').map(s => s.trim()).filter(Boolean),
      experienceLevel: formData.get('experienceLevel'),
      employmentType: formData.get('employmentType'),
      status: 'active',
    };

    createJobMutation.mutate(data);
  };

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader 
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || "User"} 
        userRole="Employer" 
        notificationCount={0} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Job Postings</h2>
              <p className="text-muted-foreground">Manage your open positions</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-job">
                  <Plus className="w-4 h-4 mr-2" />
                  Post New Job
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Job Posting</DialogTitle>
                  <DialogDescription>
                    Fill in the details for your new job posting
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleCreateJob} className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="title">Job Title</Label>
                    <Input id="title" name="title" required data-testid="input-job-title" />
                  </div>
                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea id="description" name="description" required className="min-h-[100px]" data-testid="textarea-job-description" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" required data-testid="input-job-location" />
                    </div>
                    <div className="flex items-center gap-2 pt-8">
                      <input type="checkbox" id="remote" name="remote" className="rounded" data-testid="checkbox-remote" />
                      <Label htmlFor="remote" className="cursor-pointer">Remote</Label>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="salaryMin">Min Salary</Label>
                      <Input id="salaryMin" name="salaryMin" type="number" placeholder="80000" data-testid="input-salary-min" />
                    </div>
                    <div>
                      <Label htmlFor="salaryMax">Max Salary</Label>
                      <Input id="salaryMax" name="salaryMax" type="number" placeholder="120000" data-testid="input-salary-max" />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="requiredSkills">Required Skills (comma separated)</Label>
                    <Input id="requiredSkills" name="requiredSkills" placeholder="React, TypeScript, Node.js" data-testid="input-required-skills" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="experienceLevel">Experience Level</Label>
                      <Input id="experienceLevel" name="experienceLevel" placeholder="Senior" data-testid="input-experience-level" />
                    </div>
                    <div>
                      <Label htmlFor="employmentType">Employment Type</Label>
                      <Input id="employmentType" name="employmentType" placeholder="Full-time" data-testid="input-employment-type" />
                    </div>
                  </div>
                  <Button type="submit" className="w-full" disabled={createJobMutation.isPending} data-testid="button-submit-job">
                    {createJobMutation.isPending ? "Creating..." : "Create Job Posting"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {isLoading ? (
            <Card>
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p>Loading jobs...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {employerJobs.length > 0 ? (
                employerJobs.map((job) => (
                  <Card key={job.id} data-testid={`card-job-${job.id}`}>
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle>{job.title}</CardTitle>
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
                                  ${(job.salaryMin / 1000).toFixed(0)}k - ${(job.salaryMax / 1000).toFixed(0)}k
                                </span>
                              )}
                            </div>
                          </CardDescription>
                        </div>
                        <Badge variant={job.status === 'active' ? 'default' : 'secondary'}>
                          {job.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{job.description}</p>
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
                    <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No job postings yet</h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      Create your first job posting to start finding candidates
                    </p>
                    <Button onClick={() => setIsDialogOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create Job Posting
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
