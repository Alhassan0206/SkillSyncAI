import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Users, Building2, Plus, Pencil, Trash2, History, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface Permission {
  group: string;
  name: string;
  description: string;
}

interface TeamRole {
  id: string;
  name: string;
  description: string | null;
  permissions: string[];
  isSystemRole: boolean;
  systemRoleKey: string | null;
  createdAt: string;
}

interface Department {
  id: string;
  name: string;
  description: string | null;
  parentId: string | null;
  managerId: string | null;
  createdAt: string;
}

interface AuditLog {
  id: string;
  actorId: string;
  targetUserId: string | null;
  action: string;
  entityType: string;
  entityId: string;
  oldValue: Record<string, any> | null;
  newValue: Record<string, any> | null;
  createdAt: string;
}

export default function TeamPermissions() {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("roles");
  const [roleDialogOpen, setRoleDialogOpen] = useState(false);
  const [deptDialogOpen, setDeptDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<TeamRole | null>(null);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  
  // Form states
  const [roleName, setRoleName] = useState("");
  const [roleDescription, setRoleDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [deptName, setDeptName] = useState("");
  const [deptDescription, setDeptDescription] = useState("");

  // Fetch permissions config
  const { data: permissionsConfig } = useQuery<{
    permissions: Record<string, Permission>;
    groups: Record<string, string>;
    systemRoles: Array<{ key: string; name: string; description: string; permissions: string[] }>;
  }>({
    queryKey: ['/api/permissions'],
  });

  // Fetch team roles
  const { data: roles = [], isLoading: rolesLoading } = useQuery<TeamRole[]>({
    queryKey: ['/api/employer/team/roles'],
  });

  // Fetch departments  
  const { data: departments = [], isLoading: deptsLoading } = useQuery<Department[]>({
    queryKey: ['/api/employer/departments'],
  });

  // Fetch audit logs
  const { data: auditLogs = [], isLoading: logsLoading } = useQuery<AuditLog[]>({
    queryKey: ['/api/employer/team/audit-logs'],
  });

  // Initialize system roles
  const initRolesMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/employer/team/roles/initialize');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "System roles initialized" });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/team/roles'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Create/update role mutation
  const saveRoleMutation = useMutation({
    mutationFn: async (data: { name: string; description: string; permissions: string[] }) => {
      if (editingRole) {
        const res = await apiRequest('PATCH', `/api/employer/team/roles/${editingRole.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest('POST', '/api/employer/team/roles', data);
        return res.json();
      }
    },
    onSuccess: () => {
      toast({ title: editingRole ? "Role updated" : "Role created" });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/team/roles'] });
      resetRoleForm();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Delete role mutation
  const deleteRoleMutation = useMutation({
    mutationFn: async (roleId: string) => {
      const res = await apiRequest('DELETE', `/api/employer/team/roles/${roleId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Role deleted" });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/team/roles'] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Save department mutation  
  const saveDeptMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      if (editingDept) {
        const res = await apiRequest('PATCH', `/api/employer/departments/${editingDept.id}`, data);
        return res.json();
      } else {
        const res = await apiRequest('POST', '/api/employer/departments', data);
        return res.json();
      }
    },
    onSuccess: () => {
      toast({ title: editingDept ? "Department updated" : "Department created" });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/departments'] });
      resetDeptForm();
    },
  });

  const resetRoleForm = () => {
    setRoleName("");
    setRoleDescription("");
    setSelectedPermissions([]);
    setEditingRole(null);
    setRoleDialogOpen(false);
  };

  const resetDeptForm = () => {
    setDeptName("");
    setDeptDescription("");
    setEditingDept(null);
    setDeptDialogOpen(false);
  };

  const openEditRole = (role: TeamRole) => {
    setEditingRole(role);
    setRoleName(role.name);
    setRoleDescription(role.description || "");
    setSelectedPermissions(role.permissions);
    setRoleDialogOpen(true);
  };

  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptName(dept.name);
    setDeptDescription(dept.description || "");
    setDeptDialogOpen(true);
  };

  const togglePermission = (perm: string) => {
    setSelectedPermissions(prev =>
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    );
  };

  const groupedPermissions = permissionsConfig?.permissions
    ? Object.entries(permissionsConfig.permissions).reduce((acc, [key, value]) => {
        const group = value.group;
        if (!acc[group]) acc[group] = [];
        acc[group].push({ key, ...value });
        return acc;
      }, {} as Record<string, Array<{ key: string; name: string; description: string }>>)
    : {};

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
              <h2 className="text-3xl font-bold mb-2">Team Permissions</h2>
              <p className="text-muted-foreground">Manage roles, departments, and access controls</p>
            </div>
            {roles.length === 0 && (
              <Button onClick={() => initRolesMutation.mutate()} disabled={initRolesMutation.isPending}>
                Initialize System Roles
              </Button>
            )}
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
              <TabsTrigger value="roles" className="flex items-center gap-2">
                <Shield className="w-4 h-4" /> Roles
              </TabsTrigger>
              <TabsTrigger value="departments" className="flex items-center gap-2">
                <Building2 className="w-4 h-4" /> Departments
              </TabsTrigger>
              <TabsTrigger value="audit" className="flex items-center gap-2">
                <History className="w-4 h-4" /> Audit Log
              </TabsTrigger>
            </TabsList>

            {/* Roles Tab */}
            <TabsContent value="roles" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={roleDialogOpen} onOpenChange={(open) => { if (!open) resetRoleForm(); else setRoleDialogOpen(true); }}>
                  <DialogTrigger asChild>
                    <Button><Plus className="w-4 h-4 mr-2" /> Create Role</Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingRole ? 'Edit Role' : 'Create Custom Role'}</DialogTitle>
                      <DialogDescription>Define a custom role with specific permissions</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="roleName">Role Name</Label>
                        <Input id="roleName" value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="e.g., Senior Recruiter" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="roleDesc">Description</Label>
                        <Textarea id="roleDesc" value={roleDescription} onChange={(e) => setRoleDescription(e.target.value)} placeholder="Describe the role's responsibilities" />
                      </div>
                      <div className="space-y-2">
                        <Label>Permissions</Label>
                        <ScrollArea className="h-[300px] border rounded-md p-4">
                          {Object.entries(groupedPermissions).map(([group, perms]) => (
                            <div key={group} className="mb-4">
                              <h4 className="font-semibold capitalize mb-2">{group}</h4>
                              <div className="space-y-2">
                                {perms.map((perm) => (
                                  <div key={perm.key} className="flex items-center space-x-2">
                                    <Checkbox id={perm.key} checked={selectedPermissions.includes(perm.key)} onCheckedChange={() => togglePermission(perm.key)} />
                                    <label htmlFor={perm.key} className="text-sm cursor-pointer">
                                      <span className="font-medium">{perm.name}</span>
                                      <span className="text-muted-foreground ml-2">- {perm.description}</span>
                                    </label>
                                  </div>
                                ))}
                              </div>
                              <Separator className="mt-3" />
                            </div>
                          ))}
                        </ScrollArea>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={resetRoleForm}>Cancel</Button>
                      <Button onClick={() => saveRoleMutation.mutate({ name: roleName, description: roleDescription, permissions: selectedPermissions })} disabled={!roleName || saveRoleMutation.isPending}>
                        {saveRoleMutation.isPending ? 'Saving...' : (editingRole ? 'Update Role' : 'Create Role')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {rolesLoading ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">Loading roles...</div>
                ) : roles.map((role) => (
                  <Card key={role.id} className={role.isSystemRole ? 'border-primary/20' : ''}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          {role.name}
                          {role.isSystemRole && <Badge variant="secondary" className="text-xs">System</Badge>}
                        </CardTitle>
                        {!role.isSystemRole && (
                          <div className="flex gap-1">
                            <Button size="icon" variant="ghost" onClick={() => openEditRole(role)}><Pencil className="w-4 h-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={() => deleteRoleMutation.mutate(role.id)}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        )}
                      </div>
                      <CardDescription>{role.description || 'No description'}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-1">
                        {role.permissions.slice(0, 5).map((perm) => (
                          <Badge key={perm} variant="outline" className="text-xs">{perm}</Badge>
                        ))}
                        {role.permissions.length > 5 && (
                          <Badge variant="outline" className="text-xs">+{role.permissions.length - 5} more</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Departments Tab */}
            <TabsContent value="departments" className="space-y-4">
              <div className="flex justify-end">
                <Dialog open={deptDialogOpen} onOpenChange={(open) => { if (!open) resetDeptForm(); else setDeptDialogOpen(true); }}>
                  <DialogTrigger asChild>
                    <Button><Plus className="w-4 h-4 mr-2" /> Create Department</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingDept ? 'Edit Department' : 'Create Department'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="deptName">Department Name</Label>
                        <Input id="deptName" value={deptName} onChange={(e) => setDeptName(e.target.value)} placeholder="e.g., Engineering" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="deptDesc">Description</Label>
                        <Textarea id="deptDesc" value={deptDescription} onChange={(e) => setDeptDescription(e.target.value)} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={resetDeptForm}>Cancel</Button>
                      <Button onClick={() => saveDeptMutation.mutate({ name: deptName, description: deptDescription })} disabled={!deptName || saveDeptMutation.isPending}>
                        {saveDeptMutation.isPending ? 'Saving...' : (editingDept ? 'Update' : 'Create')}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {deptsLoading ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">Loading departments...</div>
                ) : departments.length === 0 ? (
                  <div className="col-span-full text-center py-8 text-muted-foreground">No departments yet. Create one to organize your team.</div>
                ) : departments.map((dept) => (
                  <Card key={dept.id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{dept.name}</CardTitle>
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEditDept(dept)}><Pencil className="w-4 h-4" /></Button>
                        </div>
                      </div>
                      <CardDescription>{dept.description || 'No description'}</CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Audit Log Tab */}
            <TabsContent value="audit" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Permission Change History</CardTitle>
                  <CardDescription>Track all changes to roles, permissions, and team assignments</CardDescription>
                </CardHeader>
                <CardContent>
                  {logsLoading ? (
                    <div className="text-center py-8 text-muted-foreground">Loading audit logs...</div>
                  ) : auditLogs.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No permission changes recorded yet.</div>
                  ) : (
                    <div className="space-y-4">
                      {auditLogs.map((log) => (
                        <div key={log.id} className="flex items-start gap-4 p-4 border rounded-lg">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <Badge variant="outline">{log.action}</Badge>
                              <span className="text-sm text-muted-foreground">{log.entityType}</span>
                            </div>
                            <p className="text-sm mt-1">
                              {log.newValue && <span className="text-muted-foreground">New: {JSON.stringify(log.newValue)}</span>}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              {new Date(log.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      ))}
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

