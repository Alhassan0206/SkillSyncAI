import { useAuth } from "@/hooks/useAuth";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Plus, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function EmployerTeam() {
  const { user } = useAuth() as any;

  return (
    <div className="flex flex-col flex-1">
      <DashboardHeader 
        userName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || "User"} 
        userRole="Employer" 
        notificationCount={0} 
      />
      
      <main className="flex-1 overflow-auto p-6">
        <div className="max-w-screen-2xl mx-auto space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">Team Management</h2>
              <p className="text-muted-foreground">Manage your hiring team and permissions</p>
            </div>
            <Button data-testid="button-add-team-member">
              <Plus className="w-4 h-4 mr-2" />
              Add Team Member
            </Button>
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                <CardTitle>Team Collaboration</CardTitle>
              </div>
              <CardDescription>
                Invite team members to collaborate on hiring
              </CardDescription>
            </CardHeader>
            <CardContent className="py-12">
              <div className="text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">Coming Soon</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Team collaboration features are under development. Soon you'll be able to invite hiring managers, 
                  recruiters, and collaborate on candidate evaluation.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
