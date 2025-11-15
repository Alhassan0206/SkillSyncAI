import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, Star, Mail, Briefcase, Tag, FileText, X, Plus, Edit2, Trash2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function EmployerCandidates() {
  const { user } = useAuth() as any;
  const [searchQuery, setSearchQuery] = useState("");
  
  const { data: applications } = useQuery<any[]>({
    queryKey: ['/api/employer/applications'],
  });

  const { data: jobs } = useQuery<any[]>({
    queryKey: ['/api/jobs'],
  });

  const { data: jobSeekers } = useQuery<any[]>({
    queryKey: ['/api/job-seekers'],
  });

  const getJobTitle = (jobId: string) => {
    return jobs?.find(job => job.id === jobId)?.title || "Unknown Job";
  };

  const getJobSeeker = (jobSeekerId: string) => {
    return jobSeekers?.find(js => js.id === jobSeekerId);
  };

  const filteredApplications = applications?.filter(app => {
    if (!searchQuery) return true;
    const job = jobs?.find(j => j.id === app.jobId);
    const jobSeeker = getJobSeeker(app.jobSeekerId);
    const query = searchQuery.toLowerCase();
    return job?.title?.toLowerCase().includes(query) || 
           jobSeeker?.currentRole?.toLowerCase().includes(query) ||
           jobSeeker?.skills?.some((s: string) => s.toLowerCase().includes(query));
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
                placeholder="Search by job title, role, or skills..."
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
              <CandidateList applications={allApps} getJobTitle={getJobTitle} getJobSeeker={getJobSeeker} />
            </TabsContent>
            
            <TabsContent value="pending" className="space-y-4">
              <CandidateList applications={pendingApps} getJobTitle={getJobTitle} getJobSeeker={getJobSeeker} />
            </TabsContent>
            
            <TabsContent value="interview" className="space-y-4">
              <CandidateList applications={interviewApps} getJobTitle={getJobTitle} getJobSeeker={getJobSeeker} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

function CandidateList({ applications, getJobTitle, getJobSeeker }: { 
  applications: any[]; 
  getJobTitle: (id: string) => string;
  getJobSeeker: (id: string) => any;
}) {
  const [selectedApplication, setSelectedApplication] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
    <>
      <div className="grid gap-4">
        {applications.map((app) => {
          const jobSeeker = getJobSeeker(app.jobSeekerId);
          return (
            <Card key={app.id} className="hover:border-primary/50 transition-colors" data-testid={`card-candidate-${app.id}`}>
              <CardHeader>
                <div className="flex justify-between items-start flex-wrap gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      {getJobTitle(app.jobId)}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      Applied {new Date(app.createdAt).toLocaleDateString()}
                      {jobSeeker?.currentRole && ` • ${jobSeeker.currentRole}`}
                    </CardDescription>
                  </div>
                  <Badge variant={app.status === 'applied' ? 'secondary' : 'default'} className="capitalize">
                    {app.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {jobSeeker?.skills && jobSeeker.skills.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Skills</h4>
                    <div className="flex flex-wrap gap-2">
                      {jobSeeker.skills.slice(0, 5).map((skill: string, idx: number) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {skill}
                        </Badge>
                      ))}
                      {jobSeeker.skills.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{jobSeeker.skills.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}
                
                {app.coverLetter && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Cover Letter</h4>
                    <p className="text-sm text-muted-foreground line-clamp-3">{app.coverLetter}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Dialog open={isDialogOpen && selectedApplication?.id === app.id} onOpenChange={(open) => {
                    setIsDialogOpen(open);
                    if (!open) setSelectedApplication(null);
                  }}>
                    <DialogTrigger asChild>
                      <Button 
                        size="sm" 
                        onClick={() => {
                          setSelectedApplication(app);
                          setIsDialogOpen(true);
                        }}
                        data-testid={`button-view-candidate-${app.id}`}
                      >
                        View Full Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                      {selectedApplication && selectedApplication.id === app.id && jobSeeker && (
                        <CandidateDetails 
                          key={app.jobSeekerId}
                          application={app} 
                          jobSeeker={jobSeeker}
                          jobTitle={getJobTitle(app.jobId)}
                        />
                      )}
                    </DialogContent>
                  </Dialog>
                  <Button size="sm" variant="outline" data-testid={`button-contact-candidate-${app.id}`}>
                    <Mail className="w-4 h-4 mr-2" />
                    Contact
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}

function CandidateDetails({ application, jobSeeker, jobTitle }: { 
  application: any; 
  jobSeeker: any;
  jobTitle: string;
}) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("profile");

  const { data: tags = [], isLoading: tagsLoading } = useQuery<any[]>({
    queryKey: ['/api/employer/candidates', jobSeeker.id, 'tags'],
    queryFn: () => fetch(`/api/employer/candidates/${jobSeeker.id}/tags`).then(r => r.json()),
    enabled: !!jobSeeker?.id,
  });

  const { data: notes = [], isLoading: notesLoading } = useQuery<any[]>({
    queryKey: ['/api/employer/candidates', jobSeeker.id, 'notes'],
    queryFn: () => fetch(`/api/employer/candidates/${jobSeeker.id}/notes`).then(r => r.json()),
    enabled: !!jobSeeker?.id,
  });

  const { data: ratings = [], isLoading: ratingsLoading } = useQuery<any[]>({
    queryKey: ['/api/employer/candidates', jobSeeker.id, 'ratings'],
    queryFn: () => fetch(`/api/employer/candidates/${jobSeeker.id}/ratings`).then(r => r.json()),
    enabled: !!jobSeeker?.id,
  });

  return (
    <>
      <DialogHeader>
        <DialogTitle className="text-2xl">Candidate Profile</DialogTitle>
        <DialogDescription>
          Application for {jobTitle} • Applied {new Date(application.createdAt).toLocaleDateString()}
        </DialogDescription>
      </DialogHeader>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
        <TabsList>
          <TabsTrigger value="profile" data-testid="tab-profile">Profile</TabsTrigger>
          <TabsTrigger value="tags" data-testid="tab-tags">
            Tags {tags.length > 0 && `(${tags.length})`}
          </TabsTrigger>
          <TabsTrigger value="notes" data-testid="tab-notes">
            Notes {notes.length > 0 && `(${notes.length})`}
          </TabsTrigger>
          <TabsTrigger value="ratings" data-testid="tab-ratings">
            Ratings {ratings.length > 0 && `(${ratings.length})`}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4 mt-4">
          <CandidateProfileTab jobSeeker={jobSeeker} application={application} />
        </TabsContent>

        <TabsContent value="tags" className="space-y-4 mt-4">
          <CandidateTagsTab jobSeekerId={jobSeeker.id} tags={tags} isLoading={tagsLoading} />
        </TabsContent>

        <TabsContent value="notes" className="space-y-4 mt-4">
          <CandidateNotesTab jobSeekerId={jobSeeker.id} notes={notes} isLoading={notesLoading} />
        </TabsContent>

        <TabsContent value="ratings" className="space-y-4 mt-4">
          <CandidateRatingsTab jobSeekerId={jobSeeker.id} ratings={ratings} isLoading={ratingsLoading} />
        </TabsContent>
      </Tabs>
    </>
  );
}

function CandidateProfileTab({ jobSeeker, application }: { jobSeeker: any; application: any }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Current Role</h4>
          <p className="text-sm mt-1">{jobSeeker.currentRole || "Not specified"}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Experience</h4>
          <p className="text-sm mt-1">{jobSeeker.experience || "Not specified"}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Location</h4>
          <p className="text-sm mt-1">{jobSeeker.location || "Not specified"}</p>
        </div>
        <div>
          <h4 className="text-sm font-medium text-muted-foreground">Remote</h4>
          <p className="text-sm mt-1">{jobSeeker.remote ? "Yes" : "No"}</p>
        </div>
      </div>

      {jobSeeker.bio && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Bio</h4>
          <p className="text-sm">{jobSeeker.bio}</p>
        </div>
      )}

      {jobSeeker.skills && jobSeeker.skills.length > 0 && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Skills</h4>
          <div className="flex flex-wrap gap-2">
            {jobSeeker.skills.map((skill: string, idx: number) => (
              <Badge key={idx} variant="outline">
                {skill}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {application.coverLetter && (
        <div>
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Cover Letter</h4>
          <p className="text-sm whitespace-pre-wrap">{application.coverLetter}</p>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        {jobSeeker.linkedinUrl && (
          <Button size="sm" variant="outline" asChild>
            <a href={jobSeeker.linkedinUrl} target="_blank" rel="noopener noreferrer">
              LinkedIn
            </a>
          </Button>
        )}
        {jobSeeker.githubUrl && (
          <Button size="sm" variant="outline" asChild>
            <a href={jobSeeker.githubUrl} target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </Button>
        )}
        {jobSeeker.portfolioUrl && (
          <Button size="sm" variant="outline" asChild>
            <a href={jobSeeker.portfolioUrl} target="_blank" rel="noopener noreferrer">
              Portfolio
            </a>
          </Button>
        )}
        {jobSeeker.resumeUrl && (
          <Button size="sm" variant="outline" asChild>
            <a href={jobSeeker.resumeUrl} target="_blank" rel="noopener noreferrer">
              View Resume
            </a>
          </Button>
        )}
      </div>
    </div>
  );
}

function CandidateTagsTab({ jobSeekerId, tags, isLoading }: { jobSeekerId: string; tags: any[]; isLoading: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newTag, setNewTag] = useState("");

  const createTagMutation = useMutation({
    mutationFn: async (tag: string) => {
      const res = await apiRequest('POST', `/api/employer/candidates/${jobSeekerId}/tags`, { tag });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employer/candidates', jobSeekerId, 'tags'] });
      setNewTag("");
      toast({ title: "Tag added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add tag", variant: "destructive" });
    },
  });

  const deleteTagMutation = useMutation({
    mutationFn: async (tagId: string) => {
      await apiRequest('DELETE', `/api/employer/candidates/tags/${tagId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employer/candidates', jobSeekerId, 'tags'] });
      toast({ title: "Tag removed successfully" });
    },
    onError: () => {
      toast({ title: "Failed to remove tag", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Add a tag (e.g., 'Top Candidate', 'Follow Up')..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && newTag.trim()) {
              createTagMutation.mutate(newTag.trim());
            }
          }}
          data-testid="input-new-tag"
        />
        <Button 
          onClick={() => newTag.trim() && createTagMutation.mutate(newTag.trim())}
          disabled={!newTag.trim() || createTagMutation.isPending}
          data-testid="button-add-tag"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading tags...</div>
      ) : tags.length === 0 ? (
        <div className="text-center py-8">
          <Tag className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No tags yet. Add tags to organize candidates.</p>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <Badge key={tag.id} variant="secondary" className="gap-2" data-testid={`tag-${tag.id}`}>
              <Tag className="w-3 h-3" />
              {tag.tag}
              <button
                onClick={() => deleteTagMutation.mutate(tag.id)}
                className="hover:text-destructive"
                data-testid={`button-delete-tag-${tag.id}`}
              >
                <X className="w-3 h-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateNotesTab({ jobSeekerId, notes, isLoading }: { jobSeekerId: string; notes: any[]; isLoading: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newNote, setNewNote] = useState("");
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState("");

  const createNoteMutation = useMutation({
    mutationFn: async (note: string) => {
      const res = await apiRequest('POST', `/api/employer/candidates/${jobSeekerId}/notes`, { note });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employer/candidates', jobSeekerId, 'notes'] });
      setNewNote("");
      toast({ title: "Note added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add note", variant: "destructive" });
    },
  });

  const updateNoteMutation = useMutation({
    mutationFn: async ({ id, note }: { id: string; note: string }) => {
      const res = await apiRequest('PATCH', `/api/employer/candidates/notes/${id}`, { note });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employer/candidates', jobSeekerId, 'notes'] });
      setEditingNoteId(null);
      setEditingNoteText("");
      toast({ title: "Note updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update note", variant: "destructive" });
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await apiRequest('DELETE', `/api/employer/candidates/notes/${noteId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employer/candidates', jobSeekerId, 'notes'] });
      toast({ title: "Note deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete note", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Textarea
          placeholder="Add a private note about this candidate..."
          value={newNote}
          onChange={(e) => setNewNote(e.target.value)}
          className="min-h-[100px]"
          data-testid="textarea-new-note"
        />
        <Button 
          onClick={() => newNote.trim() && createNoteMutation.mutate(newNote.trim())}
          disabled={!newNote.trim() || createNoteMutation.isPending}
          data-testid="button-add-note"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Note
        </Button>
      </div>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading notes...</div>
      ) : notes.length === 0 ? (
        <div className="text-center py-8">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No notes yet. Add notes to track your thoughts.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notes.map((note) => (
            <Card key={note.id} data-testid={`note-${note.id}`}>
              <CardContent className="p-4">
                {editingNoteId === note.id ? (
                  <div className="space-y-2">
                    <Textarea
                      value={editingNoteText}
                      onChange={(e) => setEditingNoteText(e.target.value)}
                      className="min-h-[100px]"
                      data-testid={`textarea-edit-note-${note.id}`}
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateNoteMutation.mutate({ id: note.id, note: editingNoteText })}
                        disabled={!editingNoteText.trim() || updateNoteMutation.isPending}
                        data-testid={`button-save-note-${note.id}`}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditingNoteId(null);
                          setEditingNoteText("");
                        }}
                        data-testid={`button-cancel-edit-note-${note.id}`}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="text-sm whitespace-pre-wrap mb-2">{note.note}</p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{new Date(note.createdAt).toLocaleString()}</span>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingNoteId(note.id);
                            setEditingNoteText(note.note);
                          }}
                          className="hover:text-foreground"
                          data-testid={`button-edit-note-${note.id}`}
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteNoteMutation.mutate(note.id)}
                          className="hover:text-destructive"
                          data-testid={`button-delete-note-${note.id}`}
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function CandidateRatingsTab({ jobSeekerId, ratings, isLoading }: { jobSeekerId: string; ratings: any[]; isLoading: boolean }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [newRating, setNewRating] = useState({ rating: 5, category: "overall", feedback: "" });
  const [editingRatingId, setEditingRatingId] = useState<string | null>(null);
  const [editingRatingData, setEditingRatingData] = useState({ rating: 5, category: "overall", feedback: "" });

  const categories = [
    { value: "overall", label: "Overall" },
    { value: "technical", label: "Technical Skills" },
    { value: "communication", label: "Communication" },
    { value: "culture_fit", label: "Culture Fit" },
    { value: "experience", label: "Experience" },
  ];

  const createRatingMutation = useMutation({
    mutationFn: async (data: typeof newRating) => {
      const res = await apiRequest('POST', `/api/employer/candidates/${jobSeekerId}/ratings`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employer/candidates', jobSeekerId, 'ratings'] });
      setNewRating({ rating: 5, category: "overall", feedback: "" });
      toast({ title: "Rating added successfully" });
    },
    onError: () => {
      toast({ title: "Failed to add rating", variant: "destructive" });
    },
  });

  const updateRatingMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: typeof newRating }) => {
      const res = await apiRequest('PATCH', `/api/employer/candidates/ratings/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/employer/candidates', jobSeekerId, 'ratings'] });
      setEditingRatingId(null);
      toast({ title: "Rating updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update rating", variant: "destructive" });
    },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Add Rating</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Category</label>
              <Select
                value={newRating.category}
                onValueChange={(value) => setNewRating({ ...newRating, category: value })}
              >
                <SelectTrigger data-testid="select-rating-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Rating (1-5)</label>
              <Select
                value={String(newRating.rating)}
                onValueChange={(value) => setNewRating({ ...newRating, rating: parseInt(value) })}
              >
                <SelectTrigger data-testid="select-rating-value">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5].map((num) => (
                    <SelectItem key={num} value={String(num)}>
                      {num} {Array(num).fill('⭐').join('')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Feedback (optional)</label>
            <Textarea
              placeholder="Add feedback about this rating..."
              value={newRating.feedback}
              onChange={(e) => setNewRating({ ...newRating, feedback: e.target.value })}
              data-testid="textarea-rating-feedback"
            />
          </div>
          <Button 
            onClick={() => createRatingMutation.mutate(newRating)}
            disabled={createRatingMutation.isPending}
            data-testid="button-add-rating"
          >
            <Star className="w-4 h-4 mr-2" />
            Add Rating
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-sm text-muted-foreground">Loading ratings...</div>
      ) : ratings.length === 0 ? (
        <div className="text-center py-8">
          <Star className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">No ratings yet. Rate this candidate to track evaluations.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ratings.map((rating) => (
            <Card key={rating.id} data-testid={`rating-${rating.id}`}>
              <CardContent className="p-4">
                {editingRatingId === rating.id ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium mb-2 block">Category</label>
                        <Select
                          value={editingRatingData.category}
                          onValueChange={(value) => setEditingRatingData({ ...editingRatingData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categories.map((cat) => (
                              <SelectItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <label className="text-sm font-medium mb-2 block">Rating</label>
                        <Select
                          value={String(editingRatingData.rating)}
                          onValueChange={(value) => setEditingRatingData({ ...editingRatingData, rating: parseInt(value) })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((num) => (
                              <SelectItem key={num} value={String(num)}>
                                {num} {Array(num).fill('⭐').join('')}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <Textarea
                      value={editingRatingData.feedback}
                      onChange={(e) => setEditingRatingData({ ...editingRatingData, feedback: e.target.value })}
                      placeholder="Feedback..."
                    />
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => updateRatingMutation.mutate({ id: rating.id, data: editingRatingData })}
                        disabled={updateRatingMutation.isPending}
                        data-testid={`button-save-rating-${rating.id}`}
                      >
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setEditingRatingId(null)}
                        data-testid={`button-cancel-edit-rating-${rating.id}`}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{categories.find(c => c.value === rating.category)?.label || rating.category}</Badge>
                        <div className="flex items-center gap-1">
                          {Array(rating.rating).fill(null).map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                          ))}
                          {Array(5 - rating.rating).fill(null).map((_, i) => (
                            <Star key={`empty-${i}`} className="w-4 h-4 text-muted-foreground" />
                          ))}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setEditingRatingId(rating.id);
                          setEditingRatingData({
                            rating: rating.rating,
                            category: rating.category,
                            feedback: rating.feedback || "",
                          });
                        }}
                        className="hover:text-foreground text-muted-foreground"
                        data-testid={`button-edit-rating-${rating.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                    {rating.feedback && <p className="text-sm mb-2">{rating.feedback}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(rating.createdAt).toLocaleString()}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
