import { useState, useEffect } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Bell, Lock, Eye, Mail, Trash2, Clock, MessageSquare, Loader2 } from "lucide-react";

interface NotificationPreference {
  id?: string;
  channel: string;
  enabled: boolean;
  digestEnabled: boolean;
  digestFrequency: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  categories: Record<string, boolean>;
}

const CATEGORY_LABELS: Record<string, string> = {
  application_updates: 'Application Updates',
  interview_reminders: 'Interview Reminders',
  job_matches: 'Job Matches',
  messages: 'Messages',
  system_alerts: 'System Alerts',
  marketing: 'Marketing & Tips',
};

export default function Settings() {
  const { user } = useAuth() as any;
  const { toast } = useToast();

  const { data: profile } = useQuery<any>({
    queryKey: ['/api/job-seeker/profile'],
  });

  const { data: notifPrefs, isLoading: prefsLoading } = useQuery<{
    preferences: NotificationPreference[];
    availableChannels: string[];
    availableCategories: string[];
  }>({
    queryKey: ['/api/notifications/preferences'],
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("POST", "/api/job-seeker/profile", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/job-seeker/profile'] });
      toast({ title: "Settings Updated", description: "Your preferences have been saved." });
    },
    onError: () => {
      toast({ title: "Update Failed", description: "Failed to update settings.", variant: "destructive" });
    },
  });

  const updateNotifPrefMutation = useMutation({
    mutationFn: async ({ channel, data }: { channel: string; data: Partial<NotificationPreference> }) => {
      return apiRequest("PATCH", `/api/notifications/preferences/${channel}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/notifications/preferences'] });
      toast({ title: "Notification preferences updated" });
    },
    onError: () => {
      toast({ title: "Update Failed", description: "Failed to update preferences.", variant: "destructive" });
    },
  });

  const handleVisibilityChange = (value: string) => {
    updateProfileMutation.mutate({ profileVisibility: value });
  };

  const handleChannelToggle = (channel: string, enabled: boolean) => {
    updateNotifPrefMutation.mutate({ channel, data: { enabled } });
  };

  const handleDigestToggle = (channel: string, digestEnabled: boolean) => {
    updateNotifPrefMutation.mutate({ channel, data: { digestEnabled } });
  };

  const handleDigestFrequency = (channel: string, digestFrequency: string) => {
    updateNotifPrefMutation.mutate({ channel, data: { digestFrequency } });
  };

  const handleCategoryToggle = (channel: string, category: string, enabled: boolean, currentCategories: Record<string, boolean>) => {
    const categories = { ...currentCategories, [category]: enabled };
    updateNotifPrefMutation.mutate({ channel, data: { categories } });
  };

  const handleQuietHours = (channel: string, start: string | null, end: string | null) => {
    updateNotifPrefMutation.mutate({ channel, data: { quietHoursStart: start, quietHoursEnd: end } });
  };

  const getChannelPref = (channel: string): NotificationPreference | undefined => {
    return notifPrefs?.preferences.find(p => p.channel === channel);
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
                Control how and when you receive notifications
              </CardDescription>
            </CardHeader>
            <CardContent>
              {prefsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <Tabs defaultValue="email" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="email">
                      <Mail className="w-4 h-4 mr-2" /> Email
                    </TabsTrigger>
                    <TabsTrigger value="in_app">
                      <Bell className="w-4 h-4 mr-2" /> In-App
                    </TabsTrigger>
                    <TabsTrigger value="slack">
                      <MessageSquare className="w-4 h-4 mr-2" /> Slack
                    </TabsTrigger>
                  </TabsList>

                  {['email', 'in_app', 'slack'].map((channel) => {
                    const pref = getChannelPref(channel);
                    const categories = pref?.categories || {};
                    return (
                      <TabsContent key={channel} value={channel} className="space-y-4 mt-4">
                        {/* Channel Enable/Disable */}
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                          <div>
                            <Label className="text-base">Enable {channel === 'in_app' ? 'In-App' : channel.charAt(0).toUpperCase() + channel.slice(1)} Notifications</Label>
                            <p className="text-sm text-muted-foreground">
                              {channel === 'email' && 'Receive notifications via email'}
                              {channel === 'in_app' && 'See notifications in the app'}
                              {channel === 'slack' && 'Get notifications in Slack (requires integration)'}
                            </p>
                          </div>
                          <Switch
                            checked={pref?.enabled ?? (channel !== 'slack')}
                            onCheckedChange={(checked) => handleChannelToggle(channel, checked)}
                          />
                        </div>

                        {/* Digest Settings */}
                        {channel === 'email' && (
                          <div className="p-4 border rounded-lg space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <Label className="text-base">Email Digest</Label>
                                <p className="text-sm text-muted-foreground">
                                  Bundle notifications into a single email
                                </p>
                              </div>
                              <Switch
                                checked={pref?.digestEnabled ?? false}
                                onCheckedChange={(checked) => handleDigestToggle(channel, checked)}
                              />
                            </div>
                            {pref?.digestEnabled && (
                              <div className="space-y-2">
                                <Label>Digest Frequency</Label>
                                <Select
                                  value={pref?.digestFrequency || 'daily'}
                                  onValueChange={(value) => handleDigestFrequency(channel, value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="realtime">Real-time (no digest)</SelectItem>
                                    <SelectItem value="daily">Daily digest</SelectItem>
                                    <SelectItem value="weekly">Weekly digest</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Quiet Hours */}
                        <div className="p-4 border rounded-lg space-y-4">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <Label className="text-base">Quiet Hours</Label>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Pause notifications during specific hours
                          </p>
                          <div className="flex items-center gap-4">
                            <div className="space-y-1">
                              <Label className="text-xs">Start</Label>
                              <Input
                                type="time"
                                value={pref?.quietHoursStart || ''}
                                onChange={(e) => handleQuietHours(channel, e.target.value || null, pref?.quietHoursEnd || null)}
                                className="w-32"
                              />
                            </div>
                            <span className="text-muted-foreground mt-5">to</span>
                            <div className="space-y-1">
                              <Label className="text-xs">End</Label>
                              <Input
                                type="time"
                                value={pref?.quietHoursEnd || ''}
                                onChange={(e) => handleQuietHours(channel, pref?.quietHoursStart || null, e.target.value || null)}
                                className="w-32"
                              />
                            </div>
                            {(pref?.quietHoursStart || pref?.quietHoursEnd) && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-5"
                                onClick={() => handleQuietHours(channel, null, null)}
                              >
                                Clear
                              </Button>
                            )}
                          </div>
                        </div>

                        {/* Category Preferences */}
                        <div className="p-4 border rounded-lg space-y-4">
                          <Label className="text-base">Notification Categories</Label>
                          <p className="text-sm text-muted-foreground mb-4">
                            Choose which types of notifications to receive
                          </p>
                          <div className="space-y-3">
                            {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                              <div key={key} className="flex items-center justify-between">
                                <Label className="font-normal">{label}</Label>
                                <Switch
                                  checked={categories[key] ?? true}
                                  onCheckedChange={(checked) => handleCategoryToggle(channel, key, checked, categories)}
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    );
                  })}
                </Tabs>
              )}
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
