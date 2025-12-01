import { useQuery } from "@tanstack/react-query";
import { useRoute } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Shield, CheckCircle, Award, Users, ExternalLink, Clock, AlertCircle } from "lucide-react";

interface SkillData {
  skill: string;
  verificationLevel: 'none' | 'basic' | 'advanced' | 'expert';
  tests: Array<{ score: number; testType: string; completedAt: string; percentile?: number }>;
  evidence: Array<{ type: string; title: string; url?: string; verified: boolean }>;
  endorsements: Array<{ relationship: string; rating: number; verified: boolean }>;
}

interface VerificationResponse {
  jobSeekerId: string;
  name: string;
  skills: SkillData[];
  verifiedAt: string;
}

export default function VerifySkills() {
  const [, params] = useRoute("/verify/skills/:jobSeekerId");
  const jobSeekerId = params?.jobSeekerId;

  const { data, isLoading, error } = useQuery<VerificationResponse>({
    queryKey: [`/api/verify/skills/${jobSeekerId}`],
    enabled: !!jobSeekerId,
  });

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'expert': return <Badge className="bg-yellow-500 text-white">Expert Verified</Badge>;
      case 'advanced': return <Badge className="bg-purple-500 text-white">Advanced</Badge>;
      case 'basic': return <Badge className="bg-blue-500 text-white">Basic</Badge>;
      default: return <Badge variant="outline">Unverified</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Verifying skills...</p>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-muted-foreground">This skill profile is not available or is set to private.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30 py-12 px-6">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 mb-4">
            <Shield className="w-5 h-5" />
            <span className="font-medium">Verified Skill Profile</span>
          </div>
          <h1 className="text-3xl font-bold mb-2">{data.name}</h1>
          <p className="text-muted-foreground">
            Verified on {new Date(data.verifiedAt).toLocaleDateString()}
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="pt-6 text-center">
              <Award className="w-8 h-8 mx-auto mb-2 text-primary" />
              <p className="text-2xl font-bold">{data.skills.length}</p>
              <p className="text-sm text-muted-foreground">Verified Skills</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
              <p className="text-2xl font-bold">{data.skills.reduce((sum, s) => sum + s.tests.length, 0)}</p>
              <p className="text-sm text-muted-foreground">Tests Passed</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <Users className="w-8 h-8 mx-auto mb-2 text-blue-500" />
              <p className="text-2xl font-bold">{data.skills.reduce((sum, s) => sum + s.endorsements.length, 0)}</p>
              <p className="text-sm text-muted-foreground">Endorsements</p>
            </CardContent>
          </Card>
        </div>

        {/* Skills */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Skill Verification Details</h2>
          {data.skills.map((skill) => (
            <Card key={skill.skill}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{skill.skill}</CardTitle>
                  {getVerificationBadge(skill.verificationLevel)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Test Results */}
                {skill.tests.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" /> Test Results
                    </p>
                    {skill.tests.map((test, i) => (
                      <div key={i} className="flex items-center justify-between text-sm py-1">
                        <span className="capitalize">{test.testType}</span>
                        <div className="flex items-center gap-2">
                          <Progress value={test.score} className="w-24 h-2" />
                          <span className="font-medium">{test.score}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                {/* Evidence */}
                {skill.evidence.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" /> Evidence ({skill.evidence.length})
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {skill.evidence.map((ev, i) => (
                        <Badge key={i} variant={ev.verified ? "default" : "outline"}>
                          {ev.title} {ev.verified && <CheckCircle className="w-3 h-3 ml-1" />}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {/* Endorsements */}
                {skill.endorsements.length > 0 && (
                  <div>
                    <p className="text-sm font-medium mb-2 flex items-center gap-2">
                      <Users className="w-4 h-4" /> {skill.endorsements.length} Endorsement(s)
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

