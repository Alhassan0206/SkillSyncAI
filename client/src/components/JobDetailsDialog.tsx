import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { MapPin, DollarSign, Briefcase, Clock, Send } from "lucide-react";

interface JobDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: any;
  showApplyButton?: boolean;
  matchScore?: number;
  matchExplanation?: string;
  matchingSkills?: string[];
  gapSkills?: string[];
}

export default function JobDetailsDialog({
  open,
  onOpenChange,
  job,
  showApplyButton = true,
  matchScore,
  matchExplanation,
  matchingSkills,
  gapSkills,
}: JobDetailsDialogProps) {
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [coverLetter, setCoverLetter] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const applyMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', `/api/jobs/${job.id}/apply`, { coverLetter });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-seeker/applications'] });
      toast({
        title: "Application submitted",
        description: "Your application has been sent successfully",
      });
      setShowApplyForm(false);
      setCoverLetter("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit application",
        variant: "destructive",
      });
    },
  });

  const handleApply = () => {
    if (!coverLetter.trim()) {
      toast({
        title: "Cover letter required",
        description: "Please write a cover letter to apply",
        variant: "destructive",
      });
      return;
    }
    applyMutation.mutate();
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{job.title}</DialogTitle>
          <DialogDescription>
            <div className="flex flex-wrap items-center gap-4 text-sm mt-2">
              <span className="flex items-center">
                <MapPin className="w-4 h-4 mr-1" />
                {job.location}
              </span>
              {job.remote && <Badge variant="secondary">Remote</Badge>}
              {job.salaryMin && job.salaryMax && (
                <span className="flex items-center">
                  <DollarSign className="w-4 h-4 mr-1" />
                  {job.salaryCurrency || 'USD'} {(job.salaryMin / 1000).toFixed(0)}k - {(job.salaryMax / 1000).toFixed(0)}k
                </span>
              )}
              <span className="flex items-center">
                <Briefcase className="w-4 h-4 mr-1" />
                {job.employmentType || "Full-time"}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {job.experienceLevel || "Mid-level"}
              </span>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {matchScore !== undefined && (
            <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold">AI Match Score</h3>
                <span className="text-2xl font-bold text-primary" data-testid="text-job-detail-match-score">
                  {matchScore}%
                </span>
              </div>
              {matchExplanation && (
                <p className="text-sm text-muted-foreground">{matchExplanation}</p>
              )}
            </div>
          )}

          {matchingSkills && matchingSkills.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Your Matching Skills</h3>
              <div className="flex flex-wrap gap-2">
                {matchingSkills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary" className="bg-success/10 text-success border-success/20">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {gapSkills && gapSkills.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Skills to Develop</h3>
              <div className="flex flex-wrap gap-2">
                {gapSkills.map((skill, idx) => (
                  <Badge key={idx} variant="outline">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Separator />

          <div>
            <h3 className="font-semibold mb-2">Job Description</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap">{job.description}</p>
          </div>

          {job.requiredSkills && Array.isArray(job.requiredSkills) && job.requiredSkills.length > 0 && (
            <div>
              <h3 className="font-semibold mb-2">Required Skills</h3>
              <div className="flex flex-wrap gap-2">
                {job.requiredSkills.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {showApplyButton && !showApplyForm && (
            <Button 
              onClick={() => setShowApplyForm(true)} 
              className="w-full"
              data-testid="button-job-detail-apply"
            >
              Apply for this Position
            </Button>
          )}

          {showApplyForm && (
            <div className="space-y-4 p-4 border rounded-lg">
              <div>
                <h3 className="font-semibold mb-2">Cover Letter</h3>
                <Textarea
                  placeholder="Tell us why you're a great fit for this role..."
                  value={coverLetter}
                  onChange={(e) => setCoverLetter(e.target.value)}
                  className="min-h-[150px]"
                  data-testid="textarea-cover-letter"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleApply}
                  disabled={applyMutation.isPending}
                  className="flex-1"
                  data-testid="button-submit-application"
                >
                  {applyMutation.isPending ? (
                    "Submitting..."
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Application
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowApplyForm(false)}
                  data-testid="button-cancel-application"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
