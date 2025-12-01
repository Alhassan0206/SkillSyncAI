import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Plus, Trash2, RotateCcw, Copy, Eye, EyeOff, AlertTriangle, TrendingUp, Clock, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ApiKey {
  id: string;
  name: string;
  keyPrefix: string;
  lastFour: string;
  scopes: string[];
  environment: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface Subscription {
  subscription: { tier: string; status: string };
  tierConfig: { name: string; features: { maxApiKeys: number }; rateLimits: { requestsPerMinute: number; requestsPerHour: number; requestsPerDay: number } };
  rateLimits: { perMinute: number; perHour: number; perDay: number };
}

interface UsageStats {
  totalRequests: number;
  totalSuccess: number;
  totalErrors: number;
  avgResponseTime: number;
  dailyUsage: Array<{ date: string; requests: number }>;
}

interface TiersConfig {
  tiers: Record<string, { name: string; monthlyPrice: number; features: any; rateLimits: any }>;
  scopes: Record<string, { name: string; description: string }>;
}

export default function ApiManagement() {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("keys");
  const [keyDialogOpen, setKeyDialogOpen] = useState(false);
  const [newKeyResult, setNewKeyResult] = useState<{ key: string; id: string } | null>(null);
  const [showKey, setShowKey] = useState(false);
  
  // Form state
  const [keyName, setKeyName] = useState("");
  const [keyEnvironment, setKeyEnvironment] = useState("live");
  const [selectedScopes, setSelectedScopes] = useState<string[]>([]);
  const [expiresInDays, setExpiresInDays] = useState<string>("");

  // Fetch subscription tiers config
  const { data: tiersConfig } = useQuery<TiersConfig>({
    queryKey: ['/api/subscription/tiers'],
  });

  // Fetch current subscription
  const { data: subscription, isLoading: subLoading } = useQuery<Subscription>({
    queryKey: ['/api/subscription'],
  });

  // Fetch API keys
  const { data: apiKeys = [], isLoading: keysLoading } = useQuery<ApiKey[]>({
    queryKey: ['/api/keys'],
  });

  // Fetch usage stats
  const { data: usageStats, isLoading: statsLoading } = useQuery<UsageStats>({
    queryKey: ['/api/usage/stats'],
  });

  // Create API key mutation
  const createKeyMutation = useMutation({
    mutationFn: async (data: { name: string; environment: string; scopes: string[]; expiresInDays?: number }) => {
      const res = await apiRequest('POST', '/api/keys', data);
      return res.json();
    },
    onSuccess: (data) => {
      setNewKeyResult({ key: data.key, id: data.id });
      toast({ title: "API key created successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/keys'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Revoke API key mutation
  const revokeKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await apiRequest('DELETE', `/api/keys/${keyId}`, { reason: 'User revoked' });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "API key revoked" });
      queryClient.invalidateQueries({ queryKey: ['/api/keys'] });
    },
  });

  // Rotate API key mutation
  const rotateKeyMutation = useMutation({
    mutationFn: async (keyId: string) => {
      const res = await apiRequest('POST', `/api/keys/${keyId}/rotate`);
      return res.json();
    },
    onSuccess: (data) => {
      setNewKeyResult({ key: data.key, id: data.id });
      toast({ title: "API key rotated successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/keys'] });
    },
  });

  const resetForm = () => {
    setKeyName("");
    setKeyEnvironment("live");
    setSelectedScopes([]);
    setExpiresInDays("");
    setKeyDialogOpen(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied to clipboard" });
  };

  const toggleScope = (scope: string) => {
    setSelectedScopes(prev => 
      prev.includes(scope) ? prev.filter(s => s !== scope) : [...prev, scope]
    );
  };

  const activeKeys = apiKeys.filter(k => k.isActive);
  const maxKeys = subscription?.tierConfig?.features?.maxApiKeys || 1;
  const keyUsagePercent = (activeKeys.length / maxKeys) * 100;

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
              <h2 className="text-3xl font-bold mb-2">API Management</h2>
              <p className="text-muted-foreground">Manage API keys and monitor usage</p>
            </div>
          </div>

          {/* Usage Overview Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Total Requests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats?.totalRequests?.toLocaleString() || 0}</div>
                <p className="text-xs text-muted-foreground">Last 30 days</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" /> Avg Response Time
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{usageStats?.avgResponseTime || 0}ms</div>
                <p className="text-xs text-muted-foreground">Average latency</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" /> Rate Limit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscription?.rateLimits?.perMinute || 60}/min</div>
                <p className="text-xs text-muted-foreground">{subscription?.tierConfig?.name || 'Free'} tier</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Key className="w-4 h-4" /> API Keys
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{activeKeys.length} / {maxKeys}</div>
                <Progress value={keyUsagePercent} className="mt-2" />
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 lg:w-[300px]">
              <TabsTrigger value="keys" className="flex items-center gap-2">
                <Key className="w-4 h-4" /> API Keys
              </TabsTrigger>
              <TabsTrigger value="usage" className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4" /> Usage
              </TabsTrigger>
            </TabsList>

            {/* API Keys Tab */}
            <TabsContent value="keys" className="space-y-4">
              {newKeyResult && (
                <Alert className="border-yellow-500 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertTitle className="text-yellow-800">Save Your API Key</AlertTitle>
                  <AlertDescription className="text-yellow-700">
                    <p className="mb-2">This is the only time you'll see this key. Copy it now!</p>
                    <div className="flex items-center gap-2 bg-white p-2 rounded border">
                      <code className="flex-1 font-mono text-sm">
                        {showKey ? newKeyResult.key : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <Button size="icon" variant="ghost" onClick={() => setShowKey(!showKey)}>
                        {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                      <Button size="icon" variant="ghost" onClick={() => copyToClipboard(newKeyResult.key)}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setNewKeyResult(null)}>
                      I've saved my key
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end">
                <Dialog open={keyDialogOpen} onOpenChange={(open) => { if (!open) resetForm(); else setKeyDialogOpen(true); }}>
                  <DialogTrigger asChild>
                    <Button disabled={activeKeys.length >= maxKeys}>
                      <Plus className="w-4 h-4 mr-2" /> Create API Key
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Create API Key</DialogTitle>
                      <DialogDescription>Generate a new API key for external integrations</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="keyName">Key Name</Label>
                        <Input id="keyName" value={keyName} onChange={(e) => setKeyName(e.target.value)} placeholder="e.g., Production Integration" />
                      </div>
                      <div className="space-y-2">
                        <Label>Environment</Label>
                        <Select value={keyEnvironment} onValueChange={setKeyEnvironment}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="live">Live</SelectItem>
                            <SelectItem value="test">Test</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Scopes (Permissions)</Label>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded">
                          {tiersConfig?.scopes && Object.entries(tiersConfig.scopes).map(([scope, info]) => (
                            <div key={scope} className="flex items-center space-x-2">
                              <Checkbox id={scope} checked={selectedScopes.includes(scope)} onCheckedChange={() => toggleScope(scope)} />
                              <label htmlFor={scope} className="text-sm cursor-pointer">{info.name}</label>
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="expires">Expires In (days, optional)</Label>
                        <Input id="expires" type="number" value={expiresInDays} onChange={(e) => setExpiresInDays(e.target.value)} placeholder="Leave empty for no expiration" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={resetForm}>Cancel</Button>
                      <Button onClick={() => {
                        createKeyMutation.mutate({
                          name: keyName,
                          environment: keyEnvironment,
                          scopes: selectedScopes,
                          expiresInDays: expiresInDays ? parseInt(expiresInDays) : undefined,
                        });
                        resetForm();
                      }} disabled={!keyName || createKeyMutation.isPending}>
                        {createKeyMutation.isPending ? 'Creating...' : 'Create Key'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {keysLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading API keys...</div>
                ) : apiKeys.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <Key className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No API keys yet. Create one to get started.</p>
                    </CardContent>
                  </Card>
                ) : apiKeys.map((key) => (
                  <Card key={key.id} className={!key.isActive ? 'opacity-60' : ''}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{key.name}</CardTitle>
                          <Badge variant={key.environment === 'live' ? 'default' : 'secondary'}>{key.environment}</Badge>
                          {!key.isActive && <Badge variant="destructive">Revoked</Badge>}
                        </div>
                        {key.isActive && (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => rotateKeyMutation.mutate(key.id)} title="Rotate key">
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                            <Button size="icon" variant="ghost" onClick={() => revokeKeyMutation.mutate(key.id)} title="Revoke key">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="font-mono">{key.keyPrefix}...{key.lastFour}</span>
                        <span>Created: {new Date(key.createdAt).toLocaleDateString()}</span>
                        {key.lastUsedAt && <span>Last used: {new Date(key.lastUsedAt).toLocaleDateString()}</span>}
                        {key.expiresAt && <span>Expires: {new Date(key.expiresAt).toLocaleDateString()}</span>}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {key.scopes.map((scope) => (
                          <Badge key={scope} variant="outline" className="text-xs">{scope}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Usage Tab */}
            <TabsContent value="usage" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>API Usage (Last 30 Days)</CardTitle>
                  <CardDescription>Request statistics and performance metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  {statsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading usage data...</div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                          <div className="text-2xl font-bold text-green-600">{usageStats?.totalSuccess?.toLocaleString() || 0}</div>
                          <div className="text-sm text-green-700">Successful Requests</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                          <div className="text-2xl font-bold text-red-600">{usageStats?.totalErrors?.toLocaleString() || 0}</div>
                          <div className="text-sm text-red-700">Errors</div>
                        </div>
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{usageStats?.avgResponseTime || 0}ms</div>
                          <div className="text-sm text-blue-700">Avg Response Time</div>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Daily Requests</h4>
                        <div className="h-40 flex items-end gap-1">
                          {usageStats?.dailyUsage?.slice(-30).map((day, i) => {
                            const maxReqs = Math.max(...(usageStats.dailyUsage?.map(d => d.requests) || [1]));
                            const height = maxReqs > 0 ? (day.requests / maxReqs) * 100 : 0;
                            return (
                              <div
                                key={i}
                                className="flex-1 bg-primary rounded-t"
                                style={{ height: `${Math.max(height, 2)}%` }}
                                title={`${day.date}: ${day.requests} requests`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

