import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Flag, Users, Zap, Shield, Plus, RefreshCw, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface FeatureFlag {
  id: string;
  key: string;
  name: string;
  description?: string;
  enabled: boolean;
  category: string;
  tenantOverrides?: Record<string, boolean>;
  createdAt: string;
  updatedAt: string;
}

const categoryIcons: Record<string, any> = {
  general: Flag,
  ai: Zap,
  billing: Flag,
  security: Shield,
  experimental: Users,
};

const categoryDescriptions: Record<string, string> = {
  general: "General platform features",
  ai: "AI-powered capabilities",
  billing: "Billing and subscription features",
  security: "Security and authentication features",
  experimental: "Experimental features for testing",
};

export default function FeatureFlags() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({
    key: "",
    name: "",
    description: "",
    category: "general",
    enabled: false,
  });

  const { data: flags, isLoading, refetch, isFetching } = useQuery<FeatureFlag[]>({
    queryKey: ['/api/admin/feature-flags'],
  });

  const createFlagMutation = useMutation({
    mutationFn: async (data: typeof createForm) => {
      return apiRequest('POST', '/api/admin/feature-flags', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
      toast({ title: "Feature flag created", description: "New feature flag has been created." });
      setIsCreateOpen(false);
      setCreateForm({ key: "", name: "", description: "", category: "general", enabled: false });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create feature flag.", variant: "destructive" });
    },
  });

  const updateFlagMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      return apiRequest('PATCH', `/api/admin/feature-flags/${id}`, { enabled });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/feature-flags'] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update feature flag.", variant: "destructive" });
    },
  });

  const handleToggle = (flag: FeatureFlag) => {
    updateFlagMutation.mutate({ id: flag.id, enabled: !flag.enabled });
    toast({
      title: "Feature Flag Updated",
      description: `${flag.name} has been ${!flag.enabled ? 'enabled' : 'disabled'}.`,
    });
  };

  const handleCreateFlag = () => {
    if (createForm.key.trim() && createForm.name.trim()) {
      createFlagMutation.mutate(createForm);
    }
  };

  // Group flags by category
  const groupedFlags = (flags || []).reduce((acc, flag) => {
    const category = flag.category || 'general';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(flag);
    return acc;
  }, {} as Record<string, FeatureFlag[]>);

  return (
    <div className="flex-1 overflow-auto">
      <DashboardHeader
        title="Feature Flags"
        subtitle="Control platform features and experimental functionality"
        action={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
              <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Flag
            </Button>
          </div>
        }
      />

      <div className="p-6 max-w-4xl">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          </div>
        ) : Object.keys(groupedFlags).length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Flag className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Feature Flags</h3>
              <p className="text-muted-foreground mb-4">Create your first feature flag to control platform functionality.</p>
              <Button onClick={() => setIsCreateOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Feature Flag
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {Object.entries(groupedFlags).map(([category, categoryFlags]) => {
              const IconComponent = categoryIcons[category] || Flag;
              return (
                <Card key={category} data-testid={`card-${category}`}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 capitalize">
                      <IconComponent className="w-5 h-5" />
                      {category}
                    </CardTitle>
                    <CardDescription>
                      {categoryDescriptions[category] || `${category} features`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {categoryFlags.map((flag, index) => (
                      <div key={flag.id}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="flex items-center justify-between">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <Label htmlFor={flag.key} className="font-medium cursor-pointer">
                                  {flag.name}
                                </Label>
                                <Badge variant="outline" className="text-xs font-mono">{flag.key}</Badge>
                                {flag.enabled && (
                                  <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">
                                {flag.description || "No description provided"}
                              </p>
                            </div>
                          </div>
                          <Switch
                            id={flag.key}
                            checked={flag.enabled}
                            onCheckedChange={() => handleToggle(flag)}
                            disabled={updateFlagMutation.isPending}
                            data-testid={`switch-${flag.key}`}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Feature Flag Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Feature Flag</DialogTitle>
            <DialogDescription>
              Add a new feature flag to control platform functionality.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="key">Key</Label>
              <Input
                id="key"
                value={createForm.key}
                onChange={(e) => setCreateForm({ ...createForm, key: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="e.g., ai_matching"
              />
              <p className="text-xs text-muted-foreground">Unique identifier for the flag (lowercase, underscores)</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="e.g., AI-Powered Matching"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={createForm.description}
                onChange={(e) => setCreateForm({ ...createForm, description: e.target.value })}
                placeholder="Describe what this feature flag controls..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={createForm.category} onValueChange={(value) => setCreateForm({ ...createForm, category: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="ai">AI Features</SelectItem>
                  <SelectItem value="billing">Billing</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="experimental">Experimental</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="enabled"
                checked={createForm.enabled}
                onCheckedChange={(checked) => setCreateForm({ ...createForm, enabled: checked })}
              />
              <Label htmlFor="enabled">Enable immediately</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateFlag} disabled={createFlagMutation.isPending || !createForm.key.trim() || !createForm.name.trim()}>
              {createFlagMutation.isPending ? "Creating..." : "Create Flag"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
