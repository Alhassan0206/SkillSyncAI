import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { MapPin, DollarSign, Briefcase, ChevronDown, ChevronUp, ThumbsUp, ThumbsDown, Sparkles, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface MatchBreakdown {
  semanticSimilarity: number;
  keywordMatches: string[];
  experienceMatch: boolean;
  totalScore: number;
  weightedScores: {
    semantic: number;
    keyword: number;
    experience: number;
  };
}

interface Match {
  id: string;
  jobId: string;
  score: number;
  aiMetadata?: MatchBreakdown;
  job?: {
    title: string;
    company: string;
    location?: string;
    salary?: string;
    description: string;
    requiredSkills: string[];
    experienceLevel?: string;
  };
}

interface EnhancedMatchCardProps {
  match: Match;
}

export default function EnhancedMatchCard({ match }: EnhancedMatchCardProps) {
  const { toast } = useToast();
  const [showDetails, setShowDetails] = useState(false);
  const [showBreakdown, setShowBreakdown] = useState(false);

  const feedbackMutation = useMutation({
    mutationFn: (feedbackData: { feedbackType: string; factors?: string[] }) =>
      apiRequest(`/api/matches/${match.id}/feedback`, "POST", feedbackData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches"] });
      toast({ title: "Thank you for your feedback!" });
    },
  });

  const handleFeedback = (feedbackType: "accept" | "reject") => {
    feedbackMutation.mutate({ feedbackType });
  };

  if (!match.job) return null;

  const hasEnhancedData = match.aiMetadata && typeof match.aiMetadata === 'object';
  const breakdown = hasEnhancedData ? match.aiMetadata : null;
  const matchPercentage = Math.round(match.score * 100);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-100 dark:bg-green-950";
    if (score >= 60) return "bg-yellow-100 dark:bg-yellow-950";
    return "bg-red-100 dark:bg-red-950";
  };

  return (
    <Card className="hover-elevate" data-testid={`card-match-${match.id}`}>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <CardTitle className="text-xl flex items-center gap-2">
              {match.job.title}
              {hasEnhancedData && (
                <Badge variant="secondary" className="gap-1">
                  <Sparkles className="w-3 h-3" />
                  AI Enhanced
                </Badge>
              )}
            </CardTitle>
            <CardDescription className="text-base mt-1">
              {match.job.company}
            </CardDescription>
          </div>
          <div className={`text-center px-4 py-2 rounded-md ${getScoreBgColor(matchPercentage)}`}>
            <div className={`text-2xl font-bold ${getScoreColor(matchPercentage)}`}>
              {matchPercentage}%
            </div>
            <p className="text-xs text-muted-foreground">Match</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-3">
          {match.job.location && (
            <Badge variant="outline" className="gap-1">
              <MapPin className="w-3 h-3" />
              {match.job.location}
            </Badge>
          )}
          {match.job.salary && (
            <Badge variant="outline" className="gap-1">
              <DollarSign className="w-3 h-3" />
              {match.job.salary}
            </Badge>
          )}
          {match.job.experienceLevel && (
            <Badge variant="outline" className="gap-1">
              <Briefcase className="w-3 h-3" />
              {match.job.experienceLevel}
            </Badge>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {hasEnhancedData && breakdown && (
          <div className="space-y-3">
            <Collapsible open={showBreakdown} onOpenChange={setShowBreakdown}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="w-full justify-between" data-testid="button-toggle-breakdown">
                  <span className="text-sm font-medium">Match Breakdown</span>
                  {showBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-3 mt-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Semantic Similarity</span>
                    <span className="font-medium">{Math.round(breakdown.semanticSimilarity * 100)}%</span>
                  </div>
                  <Progress value={breakdown.semanticSimilarity * 100} className="h-2" />
                  <p className="text-xs text-muted-foreground">
                    How well your skills align with job requirements (AI-powered)
                  </p>
                </div>

                {breakdown.keywordMatches && breakdown.keywordMatches.length > 0 && (
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Skill Matches</div>
                    <div className="flex flex-wrap gap-1">
                      {breakdown.keywordMatches.map((skill, idx) => (
                        <Badge key={idx} variant="secondary" className="gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {breakdown.experienceMatch !== undefined && (
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Experience Level:</span>
                    <Badge variant={breakdown.experienceMatch ? "default" : "secondary"}>
                      {breakdown.experienceMatch ? "Perfect Match" : "Close Match"}
                    </Badge>
                  </div>
                )}

                <Separator />

                <div className="space-y-2">
                  <div className="text-sm font-medium">Scoring Weights</div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center p-2 bg-muted rounded-md">
                      <div className="font-medium">{breakdown.weightedScores?.semantic || 0}%</div>
                      <div className="text-muted-foreground">Semantic</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-md">
                      <div className="font-medium">{breakdown.weightedScores?.keyword || 0}%</div>
                      <div className="text-muted-foreground">Keywords</div>
                    </div>
                    <div className="text-center p-2 bg-muted rounded-md">
                      <div className="font-medium">{breakdown.weightedScores?.experience || 0}%</div>
                      <div className="text-muted-foreground">Experience</div>
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        )}

        <div>
          <h4 className="font-medium mb-2">Required Skills</h4>
          <div className="flex flex-wrap gap-2">
            {match.job.requiredSkills.slice(0, 5).map((skill, idx) => (
              <Badge key={idx} variant="outline">
                {skill}
              </Badge>
            ))}
            {match.job.requiredSkills.length > 5 && (
              <Badge variant="secondary">+{match.job.requiredSkills.length - 5} more</Badge>
            )}
          </div>
        </div>

        <Collapsible open={showDetails} onOpenChange={setShowDetails}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full justify-between" data-testid="button-toggle-details">
              <span>Job Description</span>
              {showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {match.job.description}
            </p>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>

      <CardFooter className="flex gap-2">
        <Dialog>
          <DialogTrigger asChild>
            <Button className="flex-1" data-testid="button-apply">
              Apply Now
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Apply to {match.job.title}</DialogTitle>
              <DialogDescription>
                Ready to submit your application to {match.job.company}?
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm">
                Your profile and skill passport will be shared with the employer.
              </p>
              <Button 
                className="w-full"
                onClick={() => {
                  handleFeedback("accept");
                  toast({ title: "Application submitted!" });
                }}
                data-testid="button-confirm-apply"
              >
                Confirm Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleFeedback("accept")}
          disabled={feedbackMutation.isPending}
          data-testid="button-thumbs-up"
        >
          <ThumbsUp className="w-4 h-4" />
        </Button>
        
        <Button
          variant="outline"
          size="icon"
          onClick={() => handleFeedback("reject")}
          disabled={feedbackMutation.isPending}
          data-testid="button-thumbs-down"
        >
          <ThumbsDown className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
