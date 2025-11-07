import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Settings as SettingsIcon, Mail, Bell, Shield, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Settings() {
  const { toast } = useToast();
  const [settings, setSettings] = useState({
    platformName: "SkillSync AI",
    supportEmail: "support@skillsync.ai",
    adminEmail: "admin@skillsync.ai",
    allowSignups: true,
    requireEmailVerification: true,
    enableNotifications: true,
    maintenanceMode: false,
  });

  const handleSave = () => {
    toast({
      title: "Settings Saved",
      description: "Platform settings have been updated successfully.",
    });
  };

  return (
    <div className="flex-1 overflow-auto">
      <DashboardHeader
        title="Platform Settings"
        subtitle="Configure global platform settings and preferences"
      />

      <div className="p-6 max-w-4xl">
        <div className="space-y-6">
          <Card data-testid="card-general">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SettingsIcon className="w-5 h-5" />
                General Settings
              </CardTitle>
              <CardDescription>
                Basic platform configuration and branding
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="platform-name">Platform Name</Label>
                <Input
                  id="platform-name"
                  value={settings.platformName}
                  onChange={(e) => setSettings(prev => ({ ...prev, platformName: e.target.value }))}
                  data-testid="input-platform-name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="support-email">Support Email</Label>
                <Input
                  id="support-email"
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, supportEmail: e.target.value }))}
                  data-testid="input-support-email"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="admin-email">Admin Email</Label>
                <Input
                  id="admin-email"
                  type="email"
                  value={settings.adminEmail}
                  onChange={(e) => setSettings(prev => ({ ...prev, adminEmail: e.target.value }))}
                  data-testid="input-admin-email"
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-security">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Security & Access
              </CardTitle>
              <CardDescription>
                Control user access and authentication settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="allow-signups">Allow New Signups</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable new users to create accounts
                  </p>
                </div>
                <Switch
                  id="allow-signups"
                  checked={settings.allowSignups}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, allowSignups: checked }))}
                  data-testid="switch-signups"
                />
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-verification">Email Verification</Label>
                  <p className="text-sm text-muted-foreground">
                    Require email verification for new accounts
                  </p>
                </div>
                <Switch
                  id="email-verification"
                  checked={settings.requireEmailVerification}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, requireEmailVerification: checked }))}
                  data-testid="switch-email-verification"
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-notifications">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Notifications
              </CardTitle>
              <CardDescription>
                Configure system-wide notification settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="enable-notifications">Enable Notifications</Label>
                  <p className="text-sm text-muted-foreground">
                    Send email notifications to users
                  </p>
                </div>
                <Switch
                  id="enable-notifications"
                  checked={settings.enableNotifications}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableNotifications: checked }))}
                  data-testid="switch-notifications"
                />
              </div>
            </CardContent>
          </Card>

          <Card data-testid="card-maintenance">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="w-5 h-5" />
                Maintenance Mode
              </CardTitle>
              <CardDescription>
                Temporarily disable platform access for maintenance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Display maintenance message to all users
                  </p>
                </div>
                <Switch
                  id="maintenance-mode"
                  checked={settings.maintenanceMode}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, maintenanceMode: checked }))}
                  data-testid="switch-maintenance"
                />
              </div>

              {settings.maintenanceMode && (
                <div className="space-y-2 pt-2">
                  <Label htmlFor="maintenance-message">Maintenance Message</Label>
                  <Textarea
                    id="maintenance-message"
                    placeholder="Enter message to display to users..."
                    rows={3}
                    data-testid="textarea-maintenance-message"
                  />
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-end gap-2">
            <Button variant="outline" data-testid="button-cancel">
              Cancel
            </Button>
            <Button onClick={handleSave} data-testid="button-save">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Save Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
