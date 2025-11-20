import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, Target, CheckCircle, XCircle, MapPin, DollarSign, Loader2, Eye } from "lucide-react";
import JobDetailsDialog from "../JobDetailsDialog";

export default function MatchesPanel() {
  const [isFinding, setIsFinding] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [selectedMatch, setSelectedMatch] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: matches, isLoading } = useQuery<any[]>({
    queryKey: ['/api/job-seeker/matches'],
  });

  const findMatchesMutation = useMutation({
    mutationFn: async () => {
      setIsFinding(true);
      const res = await apiRequest('POST', '/api/job-seeker/find-matches');
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-seeker/matches'] });
      toast({
        title: "Matches found",
        description: `Found ${data.length} job matches for your profile`,
      });
      setIsFinding(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to find matches",
        variant: "destructive",
      });
      setIsFinding(false);
    },
  });

  const { data: jobs } = useQuery<any[]>({
    queryKey: ['/api/jobs'],
  });

  const getJobDetails = (jobId: string) => {
    return jobs?.find(job => job.id === jobId);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p>Loading matches...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>AI-Powered Job Matches</CardTitle>
              <CardDescription>
                Jobs that AI thinks are perfect for your skills and experience
              </CardDescription>
            </div>
            <Button 
              onClick={() => findMatchesMutation.mutate()}
              disabled={isFinding}
              data-testid="button-find-matches"
            >
              {isFinding ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Finding...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Find Matches
                </>
              )}
            </Button>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-4">
        {matches && matches.length > 0 ? (
          matches
            .sort((a, b) => b.matchScore - a.matchScore)
            .map((match) => {
              const job = getJobDetails(match.jobId);
              return (
                <Card key={match.id} className="hover:border-blue-500 transition-colors" data-testid={`card-match-${match.id}`}>
                  <CardHeader>
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{job?.title || "Job Title"}</CardTitle>
                          <Badge variant={match.matchScore >= 80 ? "default" : match.matchScore >= 60 ? "secondary" : "outline"}>
                            {match.matchScore >= 80 ? "Excellent Match" : match.matchScore >= 60 ? "Good Match" : "Fair Match"}
                          </Badge>
                        </div>
                        {job && (
                          <CardDescription className="flex items-center gap-4 text-sm">
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {job.location}
                            </span>
                            {job.remote && <Badge variant="secondary" className="text-xs">Remote</Badge>}
                            {job.salaryMin && job.salaryMax && (
                              <span className="flex items-center">
                                <DollarSign className="w-4 h-4 mr-1" />
                                {job.salaryCurrency} {(job.salaryMin / 1000).toFixed(0)}k - {(job.salaryMax / 1000).toFixed(0)}k
                              </span>
                            )}
                          </CardDescription>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400" data-testid={`text-match-score-${match.id}`}>
                          {match.matchScore}%
                        </div>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Match Score</p>
                      </div>
                    </div>
                    <Progress value={match.matchScore} className="h-2" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
                        {match.explanation}
                      </p>
                    </div>

                    {match.matchingSkills && match.matchingSkills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center">
                          <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                          Your Matching Skills
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {match.matchingSkills.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 border-green-200 dark:border-green-800">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {match.gapSkills && match.gapSkills.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2 flex items-center">
                          <XCircle className="w-4 h-4 mr-2 text-orange-600" />
                          Skills to Develop
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {match.gapSkills.map((skill: string, idx: number) => (
                            <Badge key={idx} variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800">
                              {skill}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2 pt-4">
                      <Button 
                        variant="outline"
                        onClick={() => {
                          if (job) {
                            setSelectedJob(job);
                            setSelectedMatch(match);
                          } else {
                            toast({
                              title: "Job not found",
                              description: "This job is no longer available",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={!job}
                        data-testid={`button-view-job-${match.id}`}
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        View Details
                      </Button>
                      <Button 
                        className="flex-1"
                        onClick={() => {
                          if (job) {
                            setSelectedJob(job);
                            setSelectedMatch(match);
                          } else {
                            toast({
                              title: "Job not found",
                              description: "This job is no longer available",
                              variant: "destructive",
                            });
                          }
                        }}
                        disabled={!job}
                        data-testid={`button-apply-match-${match.id}`}
                      >
                        Apply Now
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="w-16 h-16 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold mb-2">No matches yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Click "Find Matches" to let AI analyze available jobs and find the best matches for your profile
              </p>
              <Button 
                onClick={() => findMatchesMutation.mutate()}
                disabled={isFinding}
                data-testid="button-find-matches-empty"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                {isFinding ? "Finding Matches..." : "Find My Matches"}
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {selectedJob && selectedMatch && (
        <JobDetailsDialog
          open={!!selectedJob}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedJob(null);
              setSelectedMatch(null);
            }
          }}
          job={selectedJob}
          matchScore={selectedMatch.matchScore}
          matchExplanation={selectedMatch.explanation}
          matchingSkills={selectedMatch.matchingSkills}
          gapSkills={selectedMatch.gapSkills}
        />
      )}
    </div>
  );
}
