import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Flag, Users, Zap, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function FeatureFlags() {
  const { toast } = useToast();
  const [flags, setFlags] = useState({
    aiMatching: true,
    learningPlans: true,
    videoInterviews: false,
    advancedAnalytics: true,
    multiTenancy: true,
    bulkInvitations: false,
    skillAssessments: false,
    candidateRanking: true,
  });

  const handleToggle = (flag: keyof typeof flags) => {
    setFlags(prev => ({ ...prev, [flag]: !prev[flag] }));
    toast({
      title: "Feature Flag Updated",
      description: `${flag} has been ${!flags[flag] ? 'enabled' : 'disabled'}.`,
    });
  };

  const features = [
    {
      key: "aiMatching" as keyof typeof flags,
      name: "AI-Powered Matching",
      description: "Enable AI-driven job-candidate matching algorithm",
      icon: Zap,
      category: "Core Features",
    },
    {
      key: "learningPlans" as keyof typeof flags,
      name: "Learning Plans",
      description: "Generate personalized learning roadmaps for job seekers",
      icon: Flag,
      category: "Core Features",
    },
    {
      key: "advancedAnalytics" as keyof typeof flags,
      name: "Advanced Analytics",
      description: "Detailed hiring metrics and performance dashboards",
      icon: Flag,
      category: "Core Features",
    },
    {
      key: "videoInterviews" as keyof typeof flags,
      name: "Video Interviews",
      description: "Integrated video interview scheduling and recording",
      icon: Flag,
      category: "Beta Features",
    },
    {
      key: "skillAssessments" as keyof typeof flags,
      name: "Skill Assessments",
      description: "Technical skill testing and validation platform",
      icon: Shield,
      category: "Beta Features",
    },
    {
      key: "candidateRanking" as keyof typeof flags,
      name: "Candidate Ranking",
      description: "Automatic candidate ranking based on fit score",
      icon: Users,
      category: "Experimental",
    },
    {
      key: "multiTenancy" as keyof typeof flags,
      name: "Multi-Tenancy",
      description: "Support for multiple organizations on the platform",
      icon: Users,
      category: "Infrastructure",
    },
    {
      key: "bulkInvitations" as keyof typeof flags,
      name: "Bulk Invitations",
      description: "Send team invitations in bulk via CSV import",
      icon: Users,
      category: "Team Management",
    },
  ];

  const groupedFeatures = features.reduce((acc, feature) => {
    if (!acc[feature.category]) {
      acc[feature.category] = [];
    }
    acc[feature.category].push(feature);
    return acc;
  }, {} as Record<string, typeof features>);

  return (
    <div className="flex-1 overflow-auto">
      <DashboardHeader
        title="Feature Flags"
        subtitle="Control platform features and experimental functionality"
      />

      <div className="p-6 max-w-4xl">
        <div className="space-y-6">
          {Object.entries(groupedFeatures).map(([category, categoryFeatures]) => (
            <Card key={category} data-testid={`card-${category.toLowerCase().replace(/\s+/g, '-')}`}>
              <CardHeader>
                <CardTitle>{category}</CardTitle>
                <CardDescription>
                  {category === "Beta Features" && "Features in beta testing"}
                  {category === "Core Features" && "Essential platform capabilities"}
                  {category === "Experimental" && "Experimental features for testing"}
                  {category === "Infrastructure" && "System-level configuration"}
                  {category === "Team Management" && "Team collaboration features"}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {categoryFeatures.map((feature, index) => (
                  <div key={feature.key}>
                    {index > 0 && <Separator className="my-4" />}
                    <div className="flex items-center justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <feature.icon className="w-5 h-5 mt-1 text-muted-foreground" />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={feature.key} className="font-medium cursor-pointer">
                              {feature.name}
                            </Label>
                            {flags[feature.key] && (
                              <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            {feature.description}
                          </p>
                        </div>
                      </div>
                      <Switch
                        id={feature.key}
                        checked={flags[feature.key]}
                        onCheckedChange={() => handleToggle(feature.key)}
                        data-testid={`switch-${feature.key}`}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
