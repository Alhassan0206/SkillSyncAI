import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Mail, Plus, Trash2, UserCheck, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTeamInvitationSchema } from "@shared/schema";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useState } from "react";
import { Badge } from "@/components/ui/badge";

const inviteFormSchema = insertTeamInvitationSchema.pick({ email: true, role: true }).extend({
  email: z.string().email("Please enter a valid email address"),
});

export default function EmployerTeam() {
  const { user } = useAuth() as any;
  const { toast } = useToast();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  const { data: members = [], isLoading: membersLoading } = useQuery<any[]>({
    queryKey: ['/api/employer/team/members'],
  });

  const { data: invitations = [], isLoading: invitationsLoading } = useQuery<any[]>({
    queryKey: ['/api/employer/team/invitations'],
  });

  const form = useForm<z.infer<typeof inviteFormSchema>>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: "",
      role: "employer",
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async (data: z.infer<typeof inviteFormSchema>) => {
      const res = await apiRequest('POST', '/api/employer/team/invite', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation sent!",
        description: "Team member invitation has been sent successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/team/invitations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/team/members'] });
      setInviteDialogOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to send invitation",
        variant: "destructive",
      });
    },
  });

  const revokeMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const res = await apiRequest('DELETE', `/api/employer/team/invitation/${invitationId}`);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Invitation revoked",
        description: "The invitation has been revoked successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/team/invitations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/employer/team/members'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to revoke invitation",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: z.infer<typeof inviteFormSchema>) => {
    inviteMutation.mutate(data);
  };

  const pendingInvitations = invitations.filter((inv) => inv.status === "pending");

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
              <h2 className="text-3xl font-bold mb-2">Team Management</h2>
              <p className="text-muted-foreground">Manage your hiring team and permissions</p>
            </div>
            <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
              <DialogTrigger asChild>
                <Button data-testid="button-add-team-member">
                  <Plus className="w-4 h-4 mr-2" />
                  Invite Team Member
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Invite Team Member</DialogTitle>
                  <DialogDescription>
                    Send an invitation to join your hiring team
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email" 
                              placeholder="colleague@company.com" 
                              {...field} 
                              data-testid="input-invite-email"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger data-testid="select-invite-role">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="employer">Employer</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setInviteDialogOpen(false)}
                        data-testid="button-cancel-invite"
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={inviteMutation.isPending}
                        data-testid="button-send-invite"
                      >
                        {inviteMutation.isPending ? "Sending..." : "Send Invitation"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  <CardTitle>Team Members</CardTitle>
                </div>
                <CardDescription>Current members of your team</CardDescription>
              </CardHeader>
              <CardContent>
                {membersLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading...</div>
                ) : members.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <UserCheck className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No team members yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {members.map((member: any) => (
                      <div 
                        key={member.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`member-${member.id}`}
                      >
                        <div>
                          <p className="font-medium">
                            {member.firstName} {member.lastName}
                          </p>
                          <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        <Badge variant="secondary">{member.role}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  <CardTitle>Pending Invitations</CardTitle>
                </div>
                <CardDescription>Invitations waiting to be accepted</CardDescription>
              </CardHeader>
              <CardContent>
                {invitationsLoading ? (
                  <div className="py-8 text-center text-muted-foreground">Loading...</div>
                ) : pendingInvitations.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No pending invitations</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingInvitations.map((invitation: any) => (
                      <div 
                        key={invitation.id} 
                        className="flex items-center justify-between p-3 border rounded-lg"
                        data-testid={`invitation-${invitation.id}`}
                      >
                        <div>
                          <p className="font-medium">{invitation.email}</p>
                          <p className="text-sm text-muted-foreground">
                            Expires: {new Date(invitation.expiresAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{invitation.role}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => revokeMutation.mutate(invitation.id)}
                            disabled={revokeMutation.isPending}
                            data-testid={`button-revoke-${invitation.id}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
