import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Plus, MapPin, DollarSign, Briefcase, MoreVertical, Sparkles, Copy, Archive, Eye, Edit, FileUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const draftJobs = employerJobs.filter(job => job.status === 'draft');
  const activeJobs = employerJobs.filter(job => job.status === 'active');
  const archivedJobs = employerJobs.filter(job => job.status === 'archived');

  const createJobMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/employer/jobs', data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({
        title: "Job created successfully",
        description: "You can now edit and publish your job",
      });
      setIsDialogOpen(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create job",
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
      status: 'draft',
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
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-3xl font-bold mb-2">Job Postings</h2>
              <p className="text-muted-foreground">Manage your open positions</p>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-create-job">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Job
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
                    {createJobMutation.isPending ? "Creating..." : "Create Draft"}
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
          ) : employerJobs.length === 0 ? (
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
          ) : (
            <Tabs defaultValue="all">
              <TabsList>
                <TabsTrigger value="all" data-testid="tab-all-jobs">
                  All ({employerJobs.length})
                </TabsTrigger>
                <TabsTrigger value="draft" data-testid="tab-draft-jobs">
                  Draft ({draftJobs.length})
                </TabsTrigger>
                <TabsTrigger value="active" data-testid="tab-active-jobs">
                  Active ({activeJobs.length})
                </TabsTrigger>
                <TabsTrigger value="archived" data-testid="tab-archived-jobs">
                  Archived ({archivedJobs.length})
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="space-y-4 mt-6">
                <JobList jobs={employerJobs} />
              </TabsContent>

              <TabsContent value="draft" className="space-y-4 mt-6">
                <JobList jobs={draftJobs} />
              </TabsContent>

              <TabsContent value="active" className="space-y-4 mt-6">
                <JobList jobs={activeJobs} />
              </TabsContent>

              <TabsContent value="archived" className="space-y-4 mt-6">
                <JobList jobs={archivedJobs} />
              </TabsContent>
            </Tabs>
          )}
        </div>
      </main>
    </div>
  );
}

function JobList({ jobs }: { jobs: any[] }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const publishJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiRequest('POST', `/api/employer/jobs/${jobId}/publish`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({ title: "Job published successfully" });
    },
    onError: () => {
      toast({ title: "Failed to publish job", variant: "destructive" });
    },
  });

  const archiveJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiRequest('POST', `/api/employer/jobs/${jobId}/archive`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({ title: "Job archived successfully" });
    },
    onError: () => {
      toast({ title: "Failed to archive job", variant: "destructive" });
    },
  });

  const reopenJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiRequest('POST', `/api/employer/jobs/${jobId}/reopen`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({ title: "Job reopened successfully" });
    },
    onError: () => {
      toast({ title: "Failed to reopen job", variant: "destructive" });
    },
  });

  const duplicateJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiRequest('POST', `/api/employer/jobs/${jobId}/duplicate`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({ title: "Job duplicated successfully", description: "Edit the new draft to customize it" });
    },
    onError: () => {
      toast({ title: "Failed to duplicate job", variant: "destructive" });
    },
  });

  const parseJobMutation = useMutation({
    mutationFn: async (jobId: string) => {
      const res = await apiRequest('POST', `/api/employer/jobs/${jobId}/parse`, {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/jobs'] });
      toast({ 
        title: "AI parsing complete", 
        description: "Skills and details have been extracted from the job description" 
      });
    },
    onError: () => {
      toast({ title: "Failed to parse job description", variant: "destructive" });
    },
  });

  if (jobs.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Briefcase className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <p className="text-muted-foreground">No jobs in this category</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {jobs.map((job) => (
        <Card key={job.id} data-testid={`card-job-${job.id}`}>
          <CardHeader>
            <div className="flex justify-between items-start flex-wrap gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle>{job.title}</CardTitle>
                  {job.aiProcessed && (
                    <Badge variant="outline" className="gap-1">
                      <Sparkles className="w-3 h-3" />
                      AI Enhanced
                    </Badge>
                  )}
                </div>
                <CardDescription className="mt-2">
                  <div className="flex items-center gap-4 text-sm flex-wrap">
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
              <div className="flex items-center gap-2">
                <Badge variant={
                  job.status === 'active' ? 'default' : 
                  job.status === 'draft' ? 'secondary' : 
                  'outline'
                } className="capitalize">
                  {job.status}
                </Badge>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-job-menu-${job.id}`}>
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem data-testid={`button-view-job-${job.id}`}>
                      <Eye className="w-4 h-4 mr-2" />
                      View Details
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid={`button-edit-job-${job.id}`}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {!job.aiProcessed && (
                      <DropdownMenuItem 
                        onClick={() => parseJobMutation.mutate(job.id)}
                        disabled={parseJobMutation.isPending}
                        data-testid={`button-parse-job-${job.id}`}
                      >
                        <Sparkles className="w-4 h-4 mr-2" />
                        AI Parse Description
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem 
                      onClick={() => duplicateJobMutation.mutate(job.id)}
                      disabled={duplicateJobMutation.isPending}
                      data-testid={`button-duplicate-job-${job.id}`}
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {job.status === 'draft' && (
                      <DropdownMenuItem 
                        onClick={() => publishJobMutation.mutate(job.id)}
                        disabled={publishJobMutation.isPending}
                        data-testid={`button-publish-job-${job.id}`}
                      >
                        <FileUp className="w-4 h-4 mr-2" />
                        Publish
                      </DropdownMenuItem>
                    )}
                    {job.status === 'active' && (
                      <DropdownMenuItem 
                        onClick={() => archiveJobMutation.mutate(job.id)}
                        disabled={archiveJobMutation.isPending}
                        data-testid={`button-archive-job-${job.id}`}
                      >
                        <Archive className="w-4 h-4 mr-2" />
                        Archive
                      </DropdownMenuItem>
                    )}
                    {job.status === 'archived' && (
                      <DropdownMenuItem 
                        onClick={() => reopenJobMutation.mutate(job.id)}
                        disabled={reopenJobMutation.isPending}
                        data-testid={`button-reopen-job-${job.id}`}
                      >
                        <FileUp className="w-4 h-4 mr-2" />
                        Reopen
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
            {job.status === 'draft' && (
              <div className="mt-4 p-3 bg-secondary/50 rounded-md">
                <p className="text-sm text-muted-foreground">
                  This job is in draft mode. Publish it to make it visible to candidates.
                </p>
              </div>
            )}
            {job.publishedAt && (
              <div className="mt-4 text-xs text-muted-foreground">
                Published {new Date(job.publishedAt).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
