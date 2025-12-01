import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Filter, RefreshCw, Loader2 } from "lucide-react";

interface AuditLog {
  id: string;
  userId?: string;
  tenantId?: string;
  action: string;
  resource: string;
  resourceId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAction, setFilterAction] = useState("all");
  const [filterResource, setFilterResource] = useState("all");

  const { data: auditLogs, isLoading, refetch, isFetching } = useQuery<AuditLog[]>({
    queryKey: ['/api/admin/audit-logs', { limit: 100 }],
  });

  const getActionBadge = (action: string) => {
    const actionColors: Record<string, string> = {
      'user.login': "bg-green-100 text-green-800",
      'user.logout': "bg-gray-100 text-gray-800",
      'user.created': "bg-green-100 text-green-800",
      'user.updated': "bg-blue-100 text-blue-800",
      'user.deleted': "bg-red-100 text-red-800",
      'job.created': "bg-blue-100 text-blue-800",
      'job.updated': "bg-purple-100 text-purple-800",
      'job.deleted': "bg-red-100 text-red-800",
      'tenant.created': "bg-green-100 text-green-800",
      'tenant.suspended': "bg-red-100 text-red-800",
      'tenant.deleted': "bg-red-100 text-red-800",
      'application.submitted': "bg-blue-100 text-blue-800",
      'application.updated': "bg-purple-100 text-purple-800",
    };
    return <Badge variant="secondary" className={actionColors[action] || "bg-gray-100 text-gray-800"}>
      {action.replace(/\./g, ' ').toUpperCase()}
    </Badge>;
  };

  const getResourceBadge = (resource: string) => {
    const resourceColors: Record<string, string> = {
      'user': "bg-blue-100 text-blue-800",
      'job': "bg-purple-100 text-purple-800",
      'tenant': "bg-orange-100 text-orange-800",
      'application': "bg-green-100 text-green-800",
    };
    return <Badge variant="outline" className={resourceColors[resource] || ""}>
      {resource}
    </Badge>;
  };

  // Get unique actions and resources for filters
  const uniqueActions = Array.from(new Set((auditLogs || []).map(log => log.action)));
  const uniqueResources = Array.from(new Set((auditLogs || []).map(log => log.resource)));

  const filteredLogs = (auditLogs || []).filter(log => {
    const detailsStr = log.details ? JSON.stringify(log.details).toLowerCase() : '';
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.resource.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.resourceId?.toLowerCase().includes(searchQuery.toLowerCase())) ||
      detailsStr.includes(searchQuery.toLowerCase());
    const matchesAction = filterAction === "all" || log.action === filterAction;
    const matchesResource = filterResource === "all" || log.resource === filterResource;
    return matchesSearch && matchesAction && matchesResource;
  });

  return (
    <div className="flex-1 overflow-auto">
      <DashboardHeader
        title="Audit Logs"
        subtitle="Track all system activities and user actions"
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="p-6">
        <Card data-testid="card-audit-logs">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Activity Log ({filteredLogs.length})
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search logs..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                    data-testid="input-search"
                  />
                </div>
                <Select value={filterAction} onValueChange={setFilterAction}>
                  <SelectTrigger className="w-40" data-testid="select-action-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Action" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    {uniqueActions.map(action => (
                      <SelectItem key={action} value={action}>{action}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={filterResource} onValueChange={setFilterResource}>
                  <SelectTrigger className="w-36" data-testid="select-resource-filter">
                    <SelectValue placeholder="Resource" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Resources</SelectItem>
                    {uniqueResources.map(resource => (
                      <SelectItem key={resource} value={resource}>{resource}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {(auditLogs || []).length === 0 ? "No audit logs recorded yet" : "No logs match your filters"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(log.createdAt).toLocaleString()}
                      </TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getResourceBadge(log.resource)}
                          {log.resourceId && (
                            <span className="text-xs text-muted-foreground font-mono">{log.resourceId.slice(0, 8)}...</span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        {log.details ? (
                          <span className="text-sm text-muted-foreground truncate block">
                            {JSON.stringify(log.details).slice(0, 50)}...
                          </span>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.ipAddress || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
