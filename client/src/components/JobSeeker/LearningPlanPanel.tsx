import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Sparkles, BookOpen, ExternalLink, Clock } from "lucide-react";

export default function LearningPlanPanel() {
  const [targetRole, setTargetRole] = useState("");
  const [targetSkills, setTargetSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: learningPlan } = useQuery<any>({
    queryKey: ['/api/job-seeker/learning-plan'],
  });

  const generatePlanMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/job-seeker/learning-plan', { targetRole, targetSkills });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-seeker/learning-plan'] });
      toast({
        title: "Learning plan generated",
        description: "Your personalized learning roadmap is ready",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate learning plan",
        variant: "destructive",
      });
    },
  });

  const handleAddSkill = () => {
    if (skillInput.trim() && !targetSkills.includes(skillInput.trim())) {
      setTargetSkills([...targetSkills, skillInput.trim()]);
      setSkillInput("");
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Learning Plan Generator</CardTitle>
          <CardDescription>
            Create a personalized learning roadmap with AI
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium">Target Role</label>
            <Input
              placeholder="e.g., Senior Full Stack Developer"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value)}
              className="mt-2"
              data-testid="input-learning-target-role"
            />
          </div>
          <div>
            <label className="text-sm font-medium">Target Skills</label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder="Add a skill to learn..."
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                data-testid="input-target-skill"
              />
              <Button type="button" onClick={handleAddSkill} data-testid="button-add-target-skill">
                Add
              </Button>
            </div>
            {targetSkills.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {targetSkills.map((skill, idx) => (
                  <Badge key={idx} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            )}
          </div>
          <Button
            className="w-full"
            onClick={() => generatePlanMutation.mutate()}
            disabled={!targetRole || targetSkills.length === 0 || generatePlanMutation.isPending}
            data-testid="button-generate-plan"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {generatePlanMutation.isPending ? "Generating..." : "Generate Learning Plan"}
          </Button>
        </CardContent>
      </Card>

      {learningPlan && learningPlan.roadmap && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>Your Learning Roadmap</CardTitle>
                <CardDescription>
                  Target Role: {learningPlan.targetRole}
                </CardDescription>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">{learningPlan.progress || 0}%</div>
                <p className="text-xs text-gray-600 dark:text-gray-400">Complete</p>
              </div>
            </div>
            <Progress value={learningPlan.progress || 0} className="mt-4" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {learningPlan.roadmap.map((item: any, idx: number) => (
                <Card key={idx} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{item.skill}</CardTitle>
                        <div className="flex gap-2 mt-2">
                          <Badge variant={getPriorityColor(item.priority)} className="capitalize">
                            {item.priority} Priority
                          </Badge>
                          <Badge variant="outline" className="flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.estimatedTime}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {item.resources && item.resources.length > 0 && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">Learning Resources:</p>
                        {item.resources.map((resource: any, ridx: number) => (
                          <div key={ridx} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                              <span className="text-sm">{resource.title}</span>
                              <Badge variant="outline" className="text-xs">{resource.type}</Badge>
                            </div>
                            {resource.url !== "Search: " + resource.title && (
                              <Button variant="ghost" size="sm" asChild>
                                <a href={resource.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
