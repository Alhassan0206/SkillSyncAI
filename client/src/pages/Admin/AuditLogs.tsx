import { useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Search, Filter } from "lucide-react";

export default function AuditLogs() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("all");

  const auditLogs = [
    {
      id: "1",
      timestamp: new Date().toISOString(),
      user: "admin@example.com",
      action: "USER_CREATED",
      resource: "User",
      resourceId: "user_123",
      details: "Created new job seeker account",
      ipAddress: "192.168.1.1",
    },
    {
      id: "2",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      user: "employer@company.com",
      action: "JOB_POSTED",
      resource: "Job",
      resourceId: "job_456",
      details: "Posted Senior Developer position",
      ipAddress: "10.0.0.1",
    },
    {
      id: "3",
      timestamp: new Date(Date.now() - 7200000).toISOString(),
      user: "admin@example.com",
      action: "TENANT_SUSPENDED",
      resource: "Tenant",
      resourceId: "tenant_789",
      details: "Suspended tenant for non-payment",
      ipAddress: "192.168.1.1",
    },
    {
      id: "4",
      timestamp: new Date(Date.now() - 10800000).toISOString(),
      user: "seeker@example.com",
      action: "PROFILE_UPDATED",
      resource: "JobSeeker",
      resourceId: "seeker_321",
      details: "Updated skills and experience",
      ipAddress: "203.0.113.1",
    },
  ];

  const getActionBadge = (action: string) => {
    const colors = {
      USER_CREATED: "bg-green-100 text-green-800",
      JOB_POSTED: "bg-blue-100 text-blue-800",
      TENANT_SUSPENDED: "bg-red-100 text-red-800",
      PROFILE_UPDATED: "bg-purple-100 text-purple-800",
    };
    return <Badge variant="secondary" className={colors[action as keyof typeof colors] || ""}>
      {action.replace(/_/g, ' ')}
    </Badge>;
  };

  const filteredLogs = auditLogs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === "all" || log.action === filterType;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="flex-1 overflow-auto">
      <DashboardHeader
        title="Audit Logs"
        subtitle="Track all system activities and user actions"
      />

      <div className="p-6">
        <Card data-testid="card-audit-logs">
          <CardHeader>
            <div className="flex items-center justify-between gap-4">
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Activity Log ({filteredLogs.length})
              </CardTitle>
              <div className="flex items-center gap-2">
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
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40" data-testid="select-filter">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Actions</SelectItem>
                    <SelectItem value="USER_CREATED">User Created</SelectItem>
                    <SelectItem value="JOB_POSTED">Job Posted</SelectItem>
                    <SelectItem value="TENANT_SUSPENDED">Tenant Suspended</SelectItem>
                    <SelectItem value="PROFILE_UPDATED">Profile Updated</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No audit logs found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Timestamp</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>IP Address</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id} data-testid={`row-log-${log.id}`}>
                      <TableCell className="text-sm">
                        {new Date(log.timestamp).toLocaleString()}
                      </TableCell>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>{getActionBadge(log.action)}</TableCell>
                      <TableCell className="max-w-xs truncate">{log.details}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{log.ipAddress}</TableCell>
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
