import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Bell, Lock, Eye, Mail, Trash2 } from "lucide-react";

export default function Settings() {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const [profileVisibility, setProfileVisibility] = useState("public");
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [jobAlerts, setJobAlerts] = useState(true);
  const [matchNotifications, setMatchNotifications] = useState(true);

  const { data: profile } = useQuery<any>({
    queryKey: ['/api/job-seeker/profile'],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/job-seeker/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-seeker/profile'] });
      toast({
        title: "Settings Updated",
        description: "Your preferences have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleVisibilityChange = (value: string) => {
    setProfileVisibility(value);
    updateProfileMutation.mutate({ profileVisibility: value });
  };

  return (
    <div className="flex-1 overflow-auto">
      <DashboardHeader
        title="Settings"
        subtitle="Manage your account preferences and privacy settings"
      />

      <div className="p-6 max-w-4xl">
        <div className="space-y-6">
          <Card data-testid="card-privacy">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                Privacy Settings
              </CardTitle>
              <CardDescription>
                Control who can see your profile and information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="visibility">Profile Visibility</Label>
                <Select value={profile?.profileVisibility || "public"} onValueChange={handleVisibilityChange}>
                  <SelectTrigger id="visibility" data-testid="select-visibility">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Public - Visible to all employers</SelectItem>
                    <SelectItem value="private">Private - Only visible to you</SelectItem>
                    <SelectItem value="contacts">Contacts - Only visible to employers you've interacted with</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  Control who can view your profile and skills
                </p>
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-notifications">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notification Preferences
              </CardTitle>
              <CardDescription>
                Choose what updates you want to receive
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-notifications">Email Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Receive email updates about your job search
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={setEmailNotifications}
                  data-testid="switch-email"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="job-alerts">Job Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Get notified about new job matches
                  </p>
                </div>
                <Switch
                  id="job-alerts"
                  checked={jobAlerts}
                  onCheckedChange={setJobAlerts}
                  data-testid="switch-job-alerts"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="match-notifications">Match Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Alerts when you match with new opportunities
                  </p>
                </div>
                <Switch
                  id="match-notifications"
                  checked={matchNotifications}
                  onCheckedChange={setMatchNotifications}
                  data-testid="switch-match-notifications"
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-account">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account and security
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Email Address</Label>
                <div className="flex gap-2">
                  <Input value={user?.email || ""} disabled data-testid="input-email" />
                  <Button variant="outline" size="sm" data-testid="button-change-email">
                    <Mail className="w-4 h-4 mr-2" />
                    Change
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  Your email is managed through Replit Auth
                </p>
              </div>

              <Separator />

              <div className="pt-4">
                <Button variant="destructive" size="sm" data-testid="button-delete-account">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Account
                </Button>
                <p className="text-sm text-muted-foreground mt-2">
                  Permanently delete your account and all associated data
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
