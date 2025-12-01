import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { RefreshCw, Play, Pause, Trash2, RotateCcw, AlertCircle, CheckCircle, Clock, Loader2 } from "lucide-react";
import { useState } from "react";
import { apiRequest } from "@/lib/queryClient";

interface QueueStatus {
  name: string;
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: boolean;
}

interface QueueJob {
  id: string;
  name: string;
  data: unknown;
  status: string;
  progress: number;
  attemptsMade: number;
  failedReason?: string;
  processedOn?: number;
  finishedOn?: number;
  timestamp: number;
}

export default function JobQueues() {
  const queryClient = useQueryClient();
  const [selectedQueue, setSelectedQueue] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<'failed' | 'completed' | 'active' | 'waiting' | 'delayed'>('failed');

  const { data: queueData, isLoading, refetch } = useQuery({
    queryKey: ['/api/admin/job-queues'],
    refetchInterval: 5000, // Auto-refresh every 5 seconds
  });

  const { data: jobsData, isLoading: jobsLoading } = useQuery({
    queryKey: ['/api/admin/job-queues', selectedQueue, 'jobs', jobStatus],
    queryFn: () => selectedQueue 
      ? fetch(`/api/admin/job-queues/${selectedQueue}/jobs?status=${jobStatus}`).then(r => r.json())
      : null,
    enabled: !!selectedQueue,
  });

  const pauseMutation = useMutation({
    mutationFn: (queueName: string) => apiRequest('POST', `/api/admin/job-queues/${queueName}/pause`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/job-queues'] }); },
  });

  const resumeMutation = useMutation({
    mutationFn: (queueName: string) => apiRequest('POST', `/api/admin/job-queues/${queueName}/resume`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/job-queues'] }); },
  });

  const retryMutation = useMutation({
    mutationFn: ({ queueName, jobId }: { queueName: string; jobId: string }) => 
      apiRequest('POST', `/api/admin/job-queues/${queueName}/jobs/${jobId}/retry`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/job-queues'] }); },
  });

  const removeMutation = useMutation({
    mutationFn: ({ queueName, jobId }: { queueName: string; jobId: string }) => 
      apiRequest('DELETE', `/api/admin/job-queues/${queueName}/jobs/${jobId}`),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['/api/admin/job-queues'] }); },
  });

  const typedQueueData = queueData as { available: boolean; queues: QueueStatus[] } | undefined;
  const typedJobsData = jobsData as { available: boolean; jobs: QueueJob[] } | undefined;
  const queues: QueueStatus[] = typedQueueData?.queues || [];
  const jobs: QueueJob[] = typedJobsData?.jobs || [];
  const isAvailable = typedQueueData?.available ?? false;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAvailable) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            Job Queue Unavailable
          </CardTitle>
          <CardDescription>
            Redis is not connected. Background job processing is disabled.
            Jobs will be processed synchronously or skipped.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To enable background job processing, configure the <code>REDIS_URL</code> environment variable.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getStatusBadge = (queue: QueueStatus) => {
    if (queue.paused) return <Badge variant="secondary">Paused</Badge>;
    if (queue.failed > 0) return <Badge variant="destructive">{queue.failed} Failed</Badge>;
    if (queue.active > 0) return <Badge variant="default">Processing</Badge>;
    return <Badge variant="outline">Idle</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Job Queues</h2>
          <p className="text-muted-foreground">Monitor and manage background job processing</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Queue Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {queues.map((queue) => (
          <Card
            key={queue.name}
            className={`cursor-pointer transition-colors hover:bg-muted/50 ${selectedQueue === queue.name ? 'ring-2 ring-primary' : ''}`}
            onClick={() => setSelectedQueue(queue.name)}
          >
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg capitalize">{queue.name}</CardTitle>
                {getStatusBadge(queue)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-2 text-center text-sm">
                <div>
                  <div className="font-semibold text-lg">{queue.waiting}</div>
                  <div className="text-muted-foreground">Waiting</div>
                </div>
                <div>
                  <div className="font-semibold text-lg text-blue-600">{queue.active}</div>
                  <div className="text-muted-foreground">Active</div>
                </div>
                <div>
                  <div className="font-semibold text-lg text-green-600">{queue.completed}</div>
                  <div className="text-muted-foreground">Done</div>
                </div>
              </div>
              <div className="flex gap-2 mt-4">
                {queue.paused ? (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); resumeMutation.mutate(queue.name); }}>
                    <Play className="h-3 w-3 mr-1" /> Resume
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); pauseMutation.mutate(queue.name); }}>
                    <Pause className="h-3 w-3 mr-1" /> Pause
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Selected Queue Details */}
      {selectedQueue && (
        <Card>
          <CardHeader>
            <CardTitle className="capitalize">{selectedQueue} Queue Jobs</CardTitle>
            <CardDescription>View and manage jobs in this queue</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={jobStatus} onValueChange={(v) => setJobStatus(v as typeof jobStatus)}>
              <TabsList>
                <TabsTrigger value="failed">Failed</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="waiting">Waiting</TabsTrigger>
                <TabsTrigger value="delayed">Delayed</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>

              <TabsContent value={jobStatus} className="mt-4">
                {jobsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin" />
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No {jobStatus} jobs in this queue
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Job ID</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Attempts</TableHead>
                        <TableHead>Created</TableHead>
                        {jobStatus === 'failed' && <TableHead>Error</TableHead>}
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {jobs.map((job) => (
                        <TableRow key={job.id}>
                          <TableCell className="font-mono text-xs">{job.id.slice(0, 8)}...</TableCell>
                          <TableCell>{job.name}</TableCell>
                          <TableCell>{job.attemptsMade}</TableCell>
                          <TableCell>{new Date(job.timestamp).toLocaleString()}</TableCell>
                          {jobStatus === 'failed' && (
                            <TableCell className="max-w-xs truncate text-red-600" title={job.failedReason}>
                              {job.failedReason || 'Unknown error'}
                            </TableCell>
                          )}
                          <TableCell>
                            <div className="flex gap-1">
                              {jobStatus === 'failed' && (
                                <Button size="sm" variant="ghost" onClick={() => retryMutation.mutate({ queueName: selectedQueue, jobId: job.id })}>
                                  <RotateCcw className="h-3 w-3" />
                                </Button>
                              )}
                              <Button size="sm" variant="ghost" className="text-red-600" onClick={() => removeMutation.mutate({ queueName: selectedQueue, jobId: job.id })}>
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

