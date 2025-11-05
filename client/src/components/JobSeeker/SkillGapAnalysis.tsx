import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, CheckCircle, XCircle, TrendingUp } from "lucide-react";

export default function SkillGapAnalysis() {
  const [targetRole, setTargetRole] = useState("");
  const [analysis, setAnalysis] = useState<any>(null);
  const { toast } = useToast();

  const analyzeMutation = useMutation({
    mutationFn: async (role: string) => {
      const res = await apiRequest('POST', '/api/job-seeker/skill-gap-analysis', { targetRole: role });
      return res.json();
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast({
        title: "Analysis complete",
        description: "Skill gap analysis generated successfully",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to analyze skill gaps",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Skill Gap Analysis</CardTitle>
          <CardDescription>
            Identify skills you need to develop for your target role
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Enter target role (e.g., Senior Full Stack Developer)"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              data-testid="input-target-role"
            />
            <Button
              onClick={() => targetRole && analyzeMutation.mutate(targetRole)}
              disabled={!targetRole || analyzeMutation.isPending}
              data-testid="button-analyze-skills"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {analyzeMutation.isPending ? "Analyzing..." : "Analyze"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {analysis && (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <CheckCircle className="w-5 h-5 mr-2 text-green-600" />
                Skills You Have
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.matchingSkills.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <XCircle className="w-5 h-5 mr-2 text-orange-600" />
                Skills to Develop
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {analysis.gapSkills.map((skill: string, idx: number) => (
                  <Badge key={idx} variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400">
                    {skill}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {analysis.recommendations.map((rec: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    <span className="text-sm">{rec}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
