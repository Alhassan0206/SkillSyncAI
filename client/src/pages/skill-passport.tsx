import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Award, FileText, Link as LinkIcon, Trash2, Shield, Star, CheckCircle2, Clock } from "lucide-react";
import type { SkillEvidence, SkillEndorsement, SkillTest, Achievement } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const evidenceSchema = z.object({
  skill: z.string().min(1, "Skill is required"),
  evidenceType: z.enum(["project", "certification", "work_experience", "education", "portfolio"]),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  url: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  fileUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  metadata: z.object({
    projectDuration: z.string().optional(),
    role: z.string().optional(),
    technologies: z.array(z.string()).optional(),
    metrics: z.string().optional(),
  }).optional(),
});

export default function SkillPassport() {
  const { toast } = useToast();
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [isAddingEvidence, setIsAddingEvidence] = useState(false);

  const { data: evidence = [], isLoading: evidenceLoading } = useQuery<SkillEvidence[]>({
    queryKey: ["/api/job-seeker/skill-evidence"],
  });

  const { data: endorsements = [] } = useQuery<SkillEndorsement[]>({
    queryKey: ["/api/job-seeker/endorsements"],
  });

  const { data: skillTests = [] } = useQuery<SkillTest[]>({
    queryKey: ["/api/job-seeker/skill-tests"],
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/job-seeker/achievements"],
  });

  const allSkills = Array.from(
    new Set([
      ...evidence.map(e => e.skill),
      ...endorsements.map(e => e.skill),
      ...skillTests.map(t => t.skill),
    ])
  );

  const form = useForm({
    resolver: zodResolver(evidenceSchema),
    defaultValues: {
      skill: "",
      evidenceType: "project" as const,
      title: "",
      description: "",
      url: "",
      fileUrl: "",
      metadata: {
        projectDuration: "",
        role: "",
        technologies: [] as string[],
        metrics: "",
      },
    },
  });

  const createEvidenceMutation = useMutation({
    mutationFn: (data: z.infer<typeof evidenceSchema>) =>
      apiRequest("/api/job-seeker/skill-evidence", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-seeker/skill-evidence"] });
      toast({ title: "Evidence added successfully" });
      setIsAddingEvidence(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "Failed to add evidence", variant: "destructive" });
    },
  });

  const deleteEvidenceMutation = useMutation({
    mutationFn: (id: string) =>
      apiRequest(`/api/job-seeker/skill-evidence/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/job-seeker/skill-evidence"] });
      toast({ title: "Evidence removed" });
    },
  });

  const onSubmit = (data: z.infer<typeof evidenceSchema>) => {
    createEvidenceMutation.mutate(data);
  };

  const getEvidenceIcon = (type: string) => {
    switch (type) {
      case "certification": return <Award className="w-4 h-4" />;
      case "project": return <FileText className="w-4 h-4" />;
      case "work_experience": return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getVerificationStatus = (status: string) => {
    switch (status) {
      case "verified": return <CheckCircle2 className="w-4 h-4 text-green-600" />;
      case "pending": return <Clock className="w-4 h-4 text-yellow-600" />;
      default: return null;
    }
  };

  const filteredEvidence = selectedSkill
    ? evidence.filter(e => e.skill === selectedSkill)
    : evidence;

  const filteredEndorsements = selectedSkill
    ? endorsements.filter(e => e.skill === selectedSkill)
    : endorsements;

  const filteredTests = selectedSkill
    ? skillTests.filter(t => t.skill === selectedSkill)
    : skillTests;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Skill Passport</h1>
          <p className="text-muted-foreground">
            Document your skills with evidence, endorsements, and verified tests
          </p>
        </div>
        <Dialog open={isAddingEvidence} onOpenChange={setIsAddingEvidence}>
          <DialogTrigger asChild>
            <Button data-testid="button-add-evidence">Add Evidence</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Skill Evidence</DialogTitle>
              <DialogDescription>
                Provide evidence for your skills through projects, certifications, or work experience
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="skill"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., React, Python, Project Management" {...field} data-testid="input-skill" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="evidenceType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Evidence Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="select-evidence-type">
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="project">Project</SelectItem>
                          <SelectItem value="certification">Certification</SelectItem>
                          <SelectItem value="work_experience">Work Experience</SelectItem>
                          <SelectItem value="education">Education</SelectItem>
                          <SelectItem value="portfolio">Portfolio</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., E-commerce Platform" {...field} data-testid="input-title" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Describe your contribution and impact..." 
                          {...field} 
                          data-testid="textarea-description"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Project URL (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="https://..." {...field} data-testid="input-url" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={createEvidenceMutation.isPending} data-testid="button-submit-evidence">
                    {createEvidenceMutation.isPending ? "Adding..." : "Add Evidence"}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setIsAddingEvidence(false)} data-testid="button-cancel">
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedSkill === null ? "default" : "outline"}
          size="sm"
          onClick={() => setSelectedSkill(null)}
          data-testid="button-all-skills"
        >
          All Skills
        </Button>
        {allSkills.map(skill => (
          <Button
            key={skill}
            variant={selectedSkill === skill ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedSkill(skill)}
            data-testid={`button-skill-${skill}`}
          >
            {skill}
          </Button>
        ))}
      </div>

      <Tabs defaultValue="evidence" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="evidence" data-testid="tab-evidence">
            Evidence ({filteredEvidence.length})
          </TabsTrigger>
          <TabsTrigger value="endorsements" data-testid="tab-endorsements">
            Endorsements ({filteredEndorsements.length})
          </TabsTrigger>
          <TabsTrigger value="tests" data-testid="tab-tests">
            Tests ({filteredTests.length})
          </TabsTrigger>
          <TabsTrigger value="achievements" data-testid="tab-achievements">
            Achievements ({achievements.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="evidence" className="space-y-4">
          {evidenceLoading ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">Loading evidence...</p>
              </CardContent>
            </Card>
          ) : filteredEvidence.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No evidence yet. Add evidence to showcase your skills.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEvidence.map(item => (
              <Card key={item.id} data-testid={`card-evidence-${item.id}`}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1">
                      {getEvidenceIcon(item.evidenceType)}
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {item.title}
                          {getVerificationStatus(item.verificationStatus || "pending")}
                        </CardTitle>
                        <CardDescription>
                          <Badge variant="secondary" className="mr-2">{item.skill}</Badge>
                          <Badge variant="outline">{item.evidenceType}</Badge>
                        </CardDescription>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteEvidenceMutation.mutate(item.id)}
                      data-testid={`button-delete-${item.id}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardHeader>
                {item.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                    {item.url && (
                      <a
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-primary flex items-center gap-1 mt-2 hover:underline"
                        data-testid={`link-evidence-${item.id}`}
                      >
                        <LinkIcon className="w-3 h-3" />
                        View Project
                      </a>
                    )}
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="endorsements" className="space-y-4">
          {filteredEndorsements.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No endorsements yet. Share your profile with colleagues to get endorsed.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredEndorsements.map(endorsement => (
              <Card key={endorsement.id} data-testid={`card-endorsement-${endorsement.id}`}>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <CardTitle className="text-base flex items-center gap-2">
                        Endorsed for {endorsement.skill}
                        {endorsement.verified && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2">
                        {endorsement.relationship}
                        <span className="flex items-center gap-1">
                          {Array.from({ length: endorsement.rating }).map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          ))}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                {endorsement.comment && (
                  <CardContent>
                    <p className="text-sm italic text-muted-foreground">"{endorsement.comment}"</p>
                  </CardContent>
                )}
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="tests" className="space-y-4">
          {filteredTests.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No skill tests completed yet. Take a test to verify your skills.
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredTests.map(test => (
              <Card key={test.id} data-testid={`card-test-${test.id}`}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-base">{test.skill} Assessment</CardTitle>
                      <CardDescription>{test.testType}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-primary">
                        {Math.round((test.score / test.maxScore) * 100)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {test.score}/{test.maxScore} correct
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>Completed {new Date(test.completedAt).toLocaleDateString()}</span>
                    {test.percentile && <span>Top {100 - test.percentile}%</span>}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="achievements" className="space-y-4">
          {achievements.length === 0 ? (
            <Card>
              <CardContent className="p-6">
                <p className="text-center text-muted-foreground">
                  No achievements unlocked yet. Keep building your skills!
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {achievements.map(achievement => (
                <Card key={achievement.id} className="text-center" data-testid={`card-achievement-${achievement.id}`}>
                  <CardHeader>
                    <div className="mx-auto mb-2">
                      <Award className="w-12 h-12 text-primary" />
                    </div>
                    <CardTitle className="text-lg">{achievement.title}</CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-muted-foreground">
                      Earned {new Date(achievement.awardedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
