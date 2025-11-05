import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/DashboardHeader";
import LearningPlanPanel from "@/components/JobSeeker/LearningPlanPanel";
import SkillGapAnalysis from "@/components/JobSeeker/SkillGapAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function JobSeekerLearning() {
  const { user } = useAuth() as any;

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader 
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || "User"} 
        userRole="Job Seeker" 
        notificationCount={0} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <div>
            <h2 className="text-3xl font-bold mb-2">Learning & Development</h2>
            <p className="text-muted-foreground">AI-powered learning paths to advance your career</p>
          </div>

          <Tabs defaultValue="learning-plan" className="space-y-6">
            <TabsList>
              <TabsTrigger value="learning-plan" data-testid="tab-learning-plan">Learning Plan</TabsTrigger>
              <TabsTrigger value="skill-gap" data-testid="tab-skill-gap">Skill Gap Analysis</TabsTrigger>
            </TabsList>
            
            <TabsContent value="learning-plan" className="space-y-6">
              <LearningPlanPanel />
            </TabsContent>
            
            <TabsContent value="skill-gap" className="space-y-6">
              <SkillGapAnalysis />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}
