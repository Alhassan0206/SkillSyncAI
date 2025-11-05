import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, X } from "lucide-react";

const profileSchema = z.object({
  currentRole: z.string().min(1, "Current role is required"),
  location: z.string().min(1, "Location is required"),
  remote: z.boolean().default(true),
  experience: z.string().min(1, "Experience is required"),
  bio: z.string().min(50, "Bio must be at least 50 characters"),
  resumeText: z.string().optional(),
  githubUrl: z.string().url().optional().or(z.literal("")),
  linkedinUrl: z.string().url().optional().or(z.literal("")),
  portfolioUrl: z.string().url().optional().or(z.literal("")),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface ProfileSetupFormProps {
  initialData?: any;
}

export default function ProfileSetupForm({ initialData }: ProfileSetupFormProps) {
  const [skills, setSkills] = useState<string[]>(initialData?.skills || []);
  const [skillInput, setSkillInput] = useState("");
  const [isExtractingSkills, setIsExtractingSkills] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      currentRole: initialData?.currentRole || "",
      location: initialData?.location || "",
      remote: initialData?.remote ?? true,
      experience: initialData?.experience || "",
      bio: initialData?.bio || "",
      resumeText: initialData?.resumeText || "",
      githubUrl: initialData?.githubUrl || "",
      linkedinUrl: initialData?.linkedinUrl || "",
      portfolioUrl: initialData?.portfolioUrl || "",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest('POST', '/api/job-seeker/profile', {
        ...data,
        skills,
        profileComplete: true,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-seeker/profile'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    },
  });

  const extractSkillsMutation = useMutation({
    mutationFn: async (resumeText: string) => {
      setIsExtractingSkills(true);
      const res = await apiRequest('POST', '/api/job-seeker/extract-skills', { resumeText });
      return res.json();
    },
    onSuccess: (data: any) => {
      if (data.skills && data.skills.length > 0) {
        const uniqueSkills = Array.from(new Set([...skills, ...data.skills]));
        setSkills(uniqueSkills);
        toast({
          title: "Skills extracted",
          description: `Found ${data.skills.length} skills from your resume`,
        });
      }
      setIsExtractingSkills(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to extract skills",
        variant: "destructive",
      });
      setIsExtractingSkills(false);
    },
  });

  const handleExtractSkills = () => {
    const resumeText = form.getValues('resumeText');
    if (!resumeText) {
      toast({
        title: "No resume text",
        description: "Please paste your resume first",
        variant: "destructive",
      });
      return;
    }
    extractSkillsMutation.mutate(resumeText);
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skills.includes(skillInput.trim())) {
      setSkills([...skills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Complete Your Profile</CardTitle>
        <CardDescription>
          Build a comprehensive profile to help AI find the perfect job matches
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="currentRole"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Role</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Senior Frontend Developer" {...field} data-testid="input-current-role" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="experience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., 5 years" {...field} data-testid="input-experience" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Location</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., San Francisco, CA" {...field} data-testid="input-location" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="remote"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 pt-8">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="checkbox-remote"
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Open to remote work</FormLabel>
                    </div>
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="bio"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Professional Bio</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Tell us about yourself, your experience, and what you're looking for..." 
                      className="min-h-[100px]"
                      {...field}
                      data-testid="textarea-bio"
                    />
                  </FormControl>
                  <FormDescription>
                    At least 50 characters - this helps AI understand your background
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-4">
              <div>
                <FormLabel>Skills</FormLabel>
                <FormDescription>
                  Add your technical and professional skills
                </FormDescription>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a skill..."
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                  data-testid="input-skill"
                />
                <Button type="button" onClick={handleAddSkill} data-testid="button-add-skill">
                  Add
                </Button>
              </div>
              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, idx) => (
                    <Badge key={idx} variant="secondary" className="text-sm" data-testid={`badge-skill-${idx}`}>
                      {skill}
                      <button
                        type="button"
                        onClick={() => handleRemoveSkill(skill)}
                        className="ml-2 hover:text-destructive"
                        data-testid={`button-remove-skill-${idx}`}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="resumeText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Resume (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Paste your resume text here for AI skill extraction..." 
                      className="min-h-[150px] font-mono text-sm"
                      {...field}
                      data-testid="textarea-resume"
                    />
                  </FormControl>
                  <FormDescription>
                    Our AI can extract skills from your resume automatically
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="button"
              variant="outline"
              onClick={handleExtractSkills}
              disabled={isExtractingSkills}
              className="w-full"
              data-testid="button-extract-skills"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {isExtractingSkills ? "Extracting..." : "Extract Skills with AI"}
            </Button>

            <div className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="githubUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://github.com/username" {...field} data-testid="input-github" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="linkedinUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>LinkedIn URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://linkedin.com/in/username" {...field} data-testid="input-linkedin" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="portfolioUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Portfolio URL (Optional)</FormLabel>
                    <FormControl>
                      <Input placeholder="https://yourportfolio.com" {...field} data-testid="input-portfolio" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button 
              type="submit" 
              className="w-full" 
              disabled={updateProfileMutation.isPending}
              data-testid="button-save-profile"
            >
              {updateProfileMutation.isPending ? "Saving..." : "Save Profile"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
