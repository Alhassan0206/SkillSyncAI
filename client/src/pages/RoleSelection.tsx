import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Briefcase, User } from "lucide-react";
import { useLocation } from "wouter";

export default function RoleSelection() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'job_seeker' | 'employer' | null>(null);

  const setRoleMutation = useMutation({
    mutationFn: async (role: string) => {
      const response = await apiRequest('POST', '/api/profile/role', { role });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      toast({
        title: "Role set successfully",
        description: "Redirecting to your dashboard...",
      });
      setTimeout(() => {
        if (selectedRole === 'employer') {
          setLocation('/employer');
        } else {
          setLocation('/dashboard');
        }
      }, 500);
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleRoleSelect = (role: 'job_seeker' | 'employer') => {
    setSelectedRole(role);
    setRoleMutation.mutate(role);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="w-full max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Welcome to SkillSync AI</h1>
          <p className="text-xl text-muted-foreground">
            How would you like to use the platform?
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-8 hover-elevate active-elevate-2 cursor-pointer" onClick={() => handleRoleSelect('job_seeker')}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">I'm a Job Seeker</h2>
              <p className="text-muted-foreground mb-6">
                Find your dream job with AI-powered matching and personalized recommendations
              </p>
              <Button 
                className="w-full" 
                disabled={setRoleMutation.isPending}
                data-testid="button-role-jobseeker"
              >
                {setRoleMutation.isPending && selectedRole === 'job_seeker' ? 'Setting up...' : 'Continue as Job Seeker'}
              </Button>
            </div>
          </Card>

          <Card className="p-8 hover-elevate active-elevate-2 cursor-pointer" onClick={() => handleRoleSelect('employer')}>
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mb-4">I'm an Employer</h2>
              <p className="text-muted-foreground mb-6">
                Find top talent quickly with intelligent candidate matching and screening
              </p>
              <Button 
                className="w-full" 
                disabled={setRoleMutation.isPending}
                data-testid="button-role-employer"
              >
                {setRoleMutation.isPending && selectedRole === 'employer' ? 'Setting up...' : 'Continue as Employer'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
