import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, Search, Plus } from "lucide-react";
import { useState } from "react";

export default function Tenants() {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: tenants, isLoading } = useQuery<any[]>({
    queryKey: ['/api/admin/tenants'],
  });

  const filteredTenants = tenants?.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge variant="secondary" className="bg-success/10 text-success">Active</Badge>;
      case "trial":
        return <Badge variant="secondary" className="bg-warning/10 text-warning">Trial</Badge>;
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPlanBadge = (plan: string) => {
    const colors = {
      free: "bg-gray-100 text-gray-800",
      starter: "bg-blue-100 text-blue-800",
      professional: "bg-purple-100 text-purple-800",
      enterprise: "bg-orange-100 text-orange-800",
    };
    return <Badge variant="secondary" className={colors[plan as keyof typeof colors] || colors.free}>{plan}</Badge>;
  };

  return (
    <div className="flex-1 overflow-auto">
      <DashboardHeader
        title="Tenant Management"
        subtitle="Manage all organizations using SkillSync AI"
        action={
          <Button size="sm" data-testid="button-create-tenant">
            <Plus className="w-4 h-4 mr-2" />
            New Tenant
          </Button>
        }
      />

      <div className="p-6">
        <Card data-testid="card-tenants">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                All Tenants ({filteredTenants.length})
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-testid="input-search"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading tenants...</div>
            ) : filteredTenants.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No tenants found</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Plan</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTenants.map((tenant) => (
                    <TableRow key={tenant.id} data-testid={`row-tenant-${tenant.id}`}>
                      <TableCell className="font-medium">{tenant.name}</TableCell>
                      <TableCell>{getPlanBadge(tenant.plan)}</TableCell>
                      <TableCell>{getStatusBadge(tenant.status)}</TableCell>
                      <TableCell>{new Date(tenant.createdAt).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" data-testid={`button-view-${tenant.id}`}>
                          View Details
                        </Button>
                      </TableCell>
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
