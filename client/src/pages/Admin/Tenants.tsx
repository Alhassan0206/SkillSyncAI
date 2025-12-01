import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Building2, Search, Plus, Edit, Trash2, Ban, CheckCircle } from "lucide-react";
import { useState } from "react";

interface Tenant {
  id: string;
  name: string;
  plan: string;
  status: string;
  createdAt: string;
}

export default function Tenants() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [deletingTenant, setDeletingTenant] = useState<Tenant | null>(null);
  const [createForm, setCreateForm] = useState({ name: "", plan: "free", status: "trial" });
  const [editForm, setEditForm] = useState({ name: "", plan: "", status: "" });

  const { data: tenants, isLoading } = useQuery<Tenant[]>({
    queryKey: ['/api/admin/tenants'],
  });

  const createTenantMutation = useMutation({
    mutationFn: async (data: { name: string; plan: string; status: string }) => {
      return apiRequest('POST', '/api/admin/tenants', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      toast({ title: "Tenant created", description: "New tenant has been created successfully." });
      setIsCreateOpen(false);
      setCreateForm({ name: "", plan: "free", status: "trial" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create tenant.", variant: "destructive" });
    },
  });

  const updateTenantMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Tenant> }) => {
      return apiRequest('PATCH', `/api/admin/tenants/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      toast({ title: "Tenant updated", description: "Tenant has been updated successfully." });
      setEditingTenant(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update tenant.", variant: "destructive" });
    },
  });

  const deleteTenantMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest('DELETE', `/api/admin/tenants/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/tenants'] });
      toast({ title: "Tenant deleted", description: "Tenant has been deleted successfully." });
      setDeletingTenant(null);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to delete tenant.", variant: "destructive" });
    },
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
      case "canceled":
        return <Badge variant="outline">Canceled</Badge>;
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

  const openEditDialog = (tenant: Tenant) => {
    setEditForm({ name: tenant.name, plan: tenant.plan, status: tenant.status });
    setEditingTenant(tenant);
  };

  const handleCreateTenant = () => {
    if (createForm.name.trim()) {
      createTenantMutation.mutate(createForm);
    }
  };

  const handleUpdateTenant = () => {
    if (editingTenant) {
      updateTenantMutation.mutate({ id: editingTenant.id, data: editForm });
    }
  };

  const handleDeleteTenant = () => {
    if (deletingTenant) {
      deleteTenantMutation.mutate(deletingTenant.id);
    }
  };

  const handleSuspendTenant = (tenant: Tenant) => {
    const newStatus = tenant.status === 'suspended' ? 'active' : 'suspended';
    updateTenantMutation.mutate({ id: tenant.id, data: { status: newStatus } });
  };

  return (
    <div className="flex-1 overflow-auto">
      <DashboardHeader
        title="Tenant Management"
        subtitle="Manage all organizations using SkillSync AI"
        action={
          <Button size="sm" onClick={() => setIsCreateOpen(true)} data-testid="button-create-tenant">
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
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(tenant)}
                            data-testid={`button-edit-${tenant.id}`}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuspendTenant(tenant)}
                            className={tenant.status === 'suspended' ? "text-success hover:text-success" : "text-warning hover:text-warning"}
                            data-testid={`button-suspend-${tenant.id}`}
                          >
                            {tenant.status === 'suspended' ? <CheckCircle className="w-4 h-4" /> : <Ban className="w-4 h-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setDeletingTenant(tenant)}
                            className="text-destructive hover:text-destructive"
                            data-testid={`button-delete-${tenant.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Tenant Dialog */}
      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Tenant</DialogTitle>
            <DialogDescription>
              Add a new organization to the platform.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Organization Name</Label>
              <Input
                id="name"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                placeholder="Enter organization name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan">Plan</Label>
              <Select value={createForm.plan} onValueChange={(value) => setCreateForm({ ...createForm, plan: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={createForm.status} onValueChange={(value) => setCreateForm({ ...createForm, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTenant} disabled={createTenantMutation.isPending || !createForm.name.trim()}>
              {createTenantMutation.isPending ? "Creating..." : "Create Tenant"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Tenant Dialog */}
      <Dialog open={!!editingTenant} onOpenChange={() => setEditingTenant(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Tenant</DialogTitle>
            <DialogDescription>
              Update tenant information.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="editName">Organization Name</Label>
              <Input
                id="editName"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPlan">Plan</Label>
              <Select value={editForm.plan} onValueChange={(value) => setEditForm({ ...editForm, plan: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free</SelectItem>
                  <SelectItem value="starter">Starter</SelectItem>
                  <SelectItem value="professional">Professional</SelectItem>
                  <SelectItem value="enterprise">Enterprise</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editStatus">Status</Label>
              <Select value={editForm.status} onValueChange={(value) => setEditForm({ ...editForm, status: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="trial">Trial</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingTenant(null)}>Cancel</Button>
            <Button onClick={handleUpdateTenant} disabled={updateTenantMutation.isPending}>
              {updateTenantMutation.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Tenant Confirmation */}
      <AlertDialog open={!!deletingTenant} onOpenChange={() => setDeletingTenant(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Tenant</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingTenant?.name}"?
              This will remove all associated data and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteTenant}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteTenantMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
