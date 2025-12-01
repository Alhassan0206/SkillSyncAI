import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, TestTube2, RefreshCw, Eye, EyeOff, Copy, Check, Loader2, Webhook } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface WebhookSubscription {
  id: string;
  endpointUrl: string;
  secret: string;
  subscribedEvents: string[];
  description: string | null;
  isEnabled: boolean;
  lastSuccessAt: string | null;
  createdAt: string;
}

interface DeliveryAttempt {
  id: string;
  eventType: string;
  status: string;
  attempts: number;
  responseStatus: number | null;
  errorMessage: string | null;
  createdAt: string;
  deliveredAt: string | null;
}

export default function Webhooks() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedWebhook, setSelectedWebhook] = useState<string | null>(null);
  const [newWebhook, setNewWebhook] = useState({ endpointUrl: '', description: '', events: [] as string[] });
  const [showSecret, setShowSecret] = useState<Record<string, boolean>>({});
  const [copied, setCopied] = useState<string | null>(null);

  const { data, isLoading } = useQuery<{ subscriptions: WebhookSubscription[]; availableEvents: string[] }>({
    queryKey: ['/api/webhooks'],
  });

  const { data: logsData, isLoading: logsLoading } = useQuery<{ subscription: WebhookSubscription; attempts: DeliveryAttempt[] }>({
    queryKey: ['/api/webhooks', selectedWebhook],
    enabled: !!selectedWebhook,
  });

  const createMutation = useMutation({
    mutationFn: (data: { endpointUrl: string; subscribedEvents: string[]; description: string }) =>
      apiRequest('POST', '/api/webhooks', data),
    onSuccess: async (response) => {
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
      setCreateOpen(false);
      setNewWebhook({ endpointUrl: '', description: '', events: [] });
      toast({ title: 'Webhook created', description: `Secret: ${result.secret.slice(0, 20)}...` });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) =>
      apiRequest('PATCH', `/api/webhooks/${id}`, { isEnabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest('DELETE', `/api/webhooks/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks'] });
      if (selectedWebhook) setSelectedWebhook(null);
      toast({ title: 'Webhook deleted' });
    },
  });

  const testMutation = useMutation({
    mutationFn: (id: string) => apiRequest('POST', `/api/webhooks/${id}/test`),
    onSuccess: async (response) => {
      const result = await response.json();
      queryClient.invalidateQueries({ queryKey: ['/api/webhooks', selectedWebhook] });
      toast({
        title: result.success ? 'Test successful' : 'Test failed',
        description: result.success ? `Status: ${result.status}` : result.error || `Status: ${result.status}`,
        variant: result.success ? 'default' : 'destructive',
      });
    },
  });

  const copyToClipboard = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const subscriptions = data?.subscriptions || [];
  const availableEvents = data?.availableEvents || [];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <main className="flex-1 overflow-y-auto p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Webhooks</h1>
            <p className="text-muted-foreground">Receive real-time notifications when events occur</p>
          </div>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" /> Add Webhook</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>Create Webhook</DialogTitle>
                <DialogDescription>Configure a new webhook endpoint to receive event notifications</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Endpoint URL</Label>
                  <Input placeholder="https://your-server.com/webhook" value={newWebhook.endpointUrl}
                    onChange={(e) => setNewWebhook({ ...newWebhook, endpointUrl: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Description (optional)</Label>
                  <Input placeholder="Production webhook" value={newWebhook.description}
                    onChange={(e) => setNewWebhook({ ...newWebhook, description: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Events to subscribe</Label>
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded p-2">
                    {availableEvents.map((event) => (
                      <label key={event} className="flex items-center gap-2 text-sm">
                        <Checkbox checked={newWebhook.events.includes(event)}
                          onCheckedChange={(checked) => {
                            const events = checked
                              ? [...newWebhook.events, event]
                              : newWebhook.events.filter(e => e !== event);
                            setNewWebhook({ ...newWebhook, events });
                          }} />
                        {event}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button onClick={() => createMutation.mutate({
                  endpointUrl: newWebhook.endpointUrl,
                  subscribedEvents: newWebhook.events,
                  description: newWebhook.description
                })} disabled={!newWebhook.endpointUrl || newWebhook.events.length === 0}>
                  Create Webhook
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {subscriptions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No webhooks configured</h3>
              <p className="text-muted-foreground text-center mb-4">
                Create a webhook to receive real-time notifications when events occur
              </p>
              <Button onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Add Your First Webhook
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Webhook List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Webhooks</CardTitle>
                <CardDescription>Click on a webhook to view delivery logs</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {subscriptions.map((webhook) => (
                  <div key={webhook.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-muted/50 ${selectedWebhook === webhook.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedWebhook(webhook.id)}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm truncate">{webhook.endpointUrl}</span>
                          <Badge variant={webhook.isEnabled ? 'default' : 'secondary'}>
                            {webhook.isEnabled ? 'Active' : 'Disabled'}
                          </Badge>
                        </div>
                        {webhook.description && (
                          <p className="text-sm text-muted-foreground mt-1">{webhook.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                          <span>{webhook.subscribedEvents.length} events</span>
                          {webhook.lastSuccessAt && (
                            <span>• Last success: {new Date(webhook.lastSuccessAt).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <Switch checked={webhook.isEnabled}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: webhook.id, isEnabled: checked })}
                        onClick={(e) => e.stopPropagation()} />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Webhook Details */}
            {selectedWebhook && logsData ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Webhook Details</CardTitle>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => testMutation.mutate(selectedWebhook)}
                        disabled={testMutation.isPending}>
                        <TestTube2 className="h-4 w-4 mr-1" /> Test
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteMutation.mutate(selectedWebhook)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-xs text-muted-foreground">Endpoint</Label>
                    <p className="font-mono text-sm">{logsData.subscription.endpointUrl}</p>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Secret</Label>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 font-mono text-sm bg-muted px-2 py-1 rounded">
                        {showSecret[selectedWebhook] ? logsData.subscription.secret : '••••••••••••••••'}
                      </code>
                      <Button size="sm" variant="ghost" onClick={() => setShowSecret({ ...showSecret, [selectedWebhook]: !showSecret[selectedWebhook] })}>
                        {showSecret[selectedWebhook] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => copyToClipboard(logsData.subscription.secret, selectedWebhook)}>
                        {copied === selectedWebhook ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">Subscribed Events</Label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {logsData.subscription.subscribedEvents.map((event) => (
                        <Badge key={event} variant="outline">{event}</Badge>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t">
                    <Label className="text-xs text-muted-foreground">Recent Deliveries</Label>
                    {logsLoading ? (
                      <div className="py-4 text-center"><Loader2 className="h-4 w-4 animate-spin mx-auto" /></div>
                    ) : logsData.attempts.length === 0 ? (
                      <p className="text-sm text-muted-foreground py-2">No deliveries yet</p>
                    ) : (
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Event</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Time</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {logsData.attempts.slice(0, 10).map((attempt) => (
                            <TableRow key={attempt.id}>
                              <TableCell className="font-mono text-xs">{attempt.eventType}</TableCell>
                              <TableCell>
                                <Badge variant={attempt.status === 'success' ? 'default' : 'destructive'}>
                                  {attempt.status === 'success' ? `${attempt.responseStatus}` : attempt.status}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs">{new Date(attempt.createdAt).toLocaleString()}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-muted-foreground">Select a webhook to view details</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

