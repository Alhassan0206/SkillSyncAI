import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import DashboardHeader from "@/components/DashboardHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Ticket, Search, RefreshCw, Loader2, Mail, Eye, Archive, CheckCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface ContactSubmission {
  id: string;
  name: string;
  email: string;
  company?: string;
  subject: string;
  message: string;
  status: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  updatedAt: string;
}

export default function SupportTickets() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedTicket, setSelectedTicket] = useState<ContactSubmission | null>(null);

  const { data: tickets, isLoading, refetch, isFetching } = useQuery<ContactSubmission[]>({
    queryKey: ['/api/admin/contact-submissions'],
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      return apiRequest('PATCH', `/api/admin/contact-submissions/${id}`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/contact-submissions'] });
      toast({ title: "Status updated", description: "Ticket status has been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update ticket status.", variant: "destructive" });
    },
  });

  const getStatusBadge = (status: string) => {
    const statusColors: Record<string, string> = {
      new: "bg-blue-100 text-blue-800",
      read: "bg-yellow-100 text-yellow-800",
      replied: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800",
    };
    return <Badge variant="secondary" className={statusColors[status] || ""}>{status}</Badge>;
  };

  const filteredTickets = (tickets || []).filter(ticket => {
    const matchesSearch = 
      ticket.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || ticket.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleViewTicket = (ticket: ContactSubmission) => {
    setSelectedTicket(ticket);
    if (ticket.status === 'new') {
      updateStatusMutation.mutate({ id: ticket.id, status: 'read' });
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateStatusMutation.mutate({ id, status });
  };

  const newCount = (tickets || []).filter(t => t.status === 'new').length;

  return (
    <div className="flex-1 overflow-auto">
      <DashboardHeader
        title="Support Tickets"
        subtitle="Manage contact form submissions and support requests"
        action={
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        }
      />

      <div className="p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold">{(tickets || []).length}</div>
              <p className="text-sm text-muted-foreground">Total Tickets</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-blue-600">{newCount}</div>
              <p className="text-sm text-muted-foreground">New</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-yellow-600">
                {(tickets || []).filter(t => t.status === 'read').length}
              </div>
              <p className="text-sm text-muted-foreground">Pending Reply</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-2xl font-bold text-green-600">
                {(tickets || []).filter(t => t.status === 'replied').length}
              </div>
              <p className="text-sm text-muted-foreground">Replied</p>
            </CardContent>
          </Card>
        </div>

        <Card data-testid="card-support-tickets">
          <CardHeader>
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <CardTitle className="flex items-center gap-2">
                <Ticket className="w-5 h-5" />
                Tickets ({filteredTickets.length})
                {newCount > 0 && (
                  <Badge variant="destructive" className="ml-2">{newCount} new</Badge>
                )}
              </CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative w-64">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search tickets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="read">Read</SelectItem>
                    <SelectItem value="replied">Replied</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
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
            ) : filteredTickets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {(tickets || []).length === 0 ? "No support tickets yet" : "No tickets match your filters"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow key={ticket.id} className={ticket.status === 'new' ? 'bg-blue-50/50' : ''}>
                      <TableCell className="text-sm whitespace-nowrap">
                        {new Date(ticket.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">{ticket.name}</TableCell>
                      <TableCell>{ticket.email}</TableCell>
                      <TableCell className="max-w-xs truncate">{ticket.subject}</TableCell>
                      <TableCell>{getStatusBadge(ticket.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" onClick={() => handleViewTicket(ticket)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {ticket.status !== 'replied' && (
                            <Button variant="ghost" size="sm" onClick={() => handleStatusChange(ticket.id, 'replied')}>
                              <CheckCircle className="w-4 h-4 text-green-600" />
                            </Button>
                          )}
                          {ticket.status !== 'archived' && (
                            <Button variant="ghost" size="sm" onClick={() => handleStatusChange(ticket.id, 'archived')}>
                              <Archive className="w-4 h-4 text-gray-600" />
                            </Button>
                          )}
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

      {/* Ticket Detail Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              {selectedTicket?.subject}
            </DialogTitle>
            <DialogDescription>
              From {selectedTicket?.name} ({selectedTicket?.email})
              {selectedTicket?.company && ` - ${selectedTicket.company}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span>Received: {selectedTicket && new Date(selectedTicket.createdAt).toLocaleString()}</span>
              <span>Status: {selectedTicket && getStatusBadge(selectedTicket.status)}</span>
            </div>
            <div className="bg-muted/50 rounded-lg p-4">
              <p className="whitespace-pre-wrap">{selectedTicket?.message}</p>
            </div>
            {selectedTicket?.ipAddress && (
              <div className="text-xs text-muted-foreground">
                IP: {selectedTicket.ipAddress}
              </div>
            )}
            <div className="flex justify-end gap-2">
              {selectedTicket?.status !== 'replied' && (
                <Button onClick={() => { handleStatusChange(selectedTicket!.id, 'replied'); setSelectedTicket(null); }}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark as Replied
                </Button>
              )}
              {selectedTicket?.status !== 'archived' && (
                <Button variant="outline" onClick={() => { handleStatusChange(selectedTicket!.id, 'archived'); setSelectedTicket(null); }}>
                  <Archive className="w-4 h-4 mr-2" />
                  Archive
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

