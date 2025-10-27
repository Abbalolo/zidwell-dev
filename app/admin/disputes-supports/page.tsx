// app/admin/disputes-support/page.tsx
"use client";

import useSWR from "swr";
import { useState, useEffect, useMemo } from "react";
import Swal from "sweetalert2";
import "sweetalert2/dist/sweetalert2.min.css";
import AdminLayout from "@/app/components/admin-components/layout";
import Loader from "@/app/components/Loader";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/app/components/ui/pagination";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select";
import { Badge } from "@/app/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function DisputesSupportPage() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [dateRange, setDateRange] = useState("total");
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const itemsPerPage = 10;

  // Build API URL with all filters for server-side filtering
  const apiUrl = useMemo(() => {
    const params = new URLSearchParams({
      page: currentPage.toString(),
      limit: itemsPerPage.toString(),
      range: dateRange,
    });

    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (priorityFilter !== 'all') params.append('priority', priorityFilter);
    if (categoryFilter !== 'all') params.append('category', categoryFilter);

    return `/api/admin-apis/disputes?${params.toString()}`;
  }, [currentPage, dateRange, searchTerm, statusFilter, priorityFilter, categoryFilter, itemsPerPage]);

  const { data, error, isLoading, mutate } = useSWR(apiUrl, fetcher);

  // Separate hook for stats
  const statsApiUrl = useMemo(() => {
    const params = new URLSearchParams({
      range: dateRange,
      limit: '10000',
    });

    if (searchTerm) params.append('search', searchTerm);
    if (statusFilter !== 'all') params.append('status', statusFilter);
    if (priorityFilter !== 'all') params.append('priority', priorityFilter);
    if (categoryFilter !== 'all') params.append('category', categoryFilter);

    return `/api/admin-apis/disputes?${params.toString()}`;
  }, [dateRange, searchTerm, statusFilter, priorityFilter, categoryFilter]);

  const { data: statsData } = useSWR(statsApiUrl, fetcher);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, categoryFilter, dateRange]);

  // Memoize calculations
  const tickets = useMemo(() => data?.tickets || [], [data]);
  const totalTickets = useMemo(() => data?.total || 0, [data]);
  const totalPages = useMemo(() => Math.ceil(totalTickets / itemsPerPage), [totalTickets, itemsPerPage]);

  // Use statsData for calculations
  const allFilteredTickets = useMemo(() => statsData?.tickets || [], [statsData]);

  // Calculate stats
  const openTickets = useMemo(() => 
    allFilteredTickets.filter((t: any) => 
      ["open", "in_progress", "awaiting_response"].includes(t.status)
    ), 
    [allFilteredTickets]
  );

  const highPriorityTickets = useMemo(() => 
    allFilteredTickets.filter((t: any) => t.priority === "high"), 
    [allFilteredTickets]
  );

  const resolvedTickets = useMemo(() => 
    allFilteredTickets.filter((t: any) => t.status === "resolved"), 
    [allFilteredTickets]
  );

  const closedTickets = useMemo(() => 
    allFilteredTickets.filter((t: any) => t.status === "closed"), 
    [allFilteredTickets]
  );

  const recentTickets = useMemo(() => 
    allFilteredTickets.filter((t: any) => {
      const ticketDate = new Date(t.created_at);
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      return ticketDate > sevenDaysAgo;
    }), 
    [allFilteredTickets]
  );

  // View ticket details
  const handleViewTicket = async (ticket: any) => {
    setSelectedTicket(ticket);
  };

  // Send message in chat
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket) return;

    try {
      const formData = new FormData();
      formData.append('ticket_id', selectedTicket.id);
      formData.append('message', newMessage);
      formData.append('sender_type', 'admin');
      
      attachments.forEach((file, index) => {
        formData.append(`attachments`, file);
      });

      await fetch("/api/admin-apis/disputes/messages", {
        method: "POST",
        body: formData,
      });

      setNewMessage("");
      setAttachments([]);
      mutate();
      
      // Refresh the selected ticket data
      const ticketResponse = await fetch(`/api/admin-apis/disputes/${selectedTicket.id}`);
      const ticketData = await ticketResponse.json();
      setSelectedTicket(ticketData);
      
      Swal.fire({
        icon: "success",
        title: "Message Sent",
        text: "Your response has been sent to the user",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("Error", "Failed to send message", "error");
    }
  };

  // Update ticket status
  const handleUpdateStatus = async (ticketId: string, newStatus: string) => {
    try {
      await fetch("/api/admin-apis/disputes", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: ticketId, status: newStatus }),
      });
      
      mutate();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket({ ...selectedTicket, status: newStatus });
      }
      
      Swal.fire({
        icon: "success",
        title: "Status Updated",
        text: `Ticket status updated to ${newStatus}`,
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("Error", "Failed to update ticket status", "error");
    }
  };

  // Handle file attachment
  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments(Array.from(files));
    }
  };

  // Custom renderers
  const renderStatusBadge = (status: string) => {
    const statusConfig: any = {
      open: { color: "bg-blue-100 text-blue-800", text: "🔓 Open" },
      in_progress: { color: "bg-yellow-100 text-yellow-800", text: "🔄 In Progress" },
      awaiting_response: { color: "bg-orange-100 text-orange-800", text: "⏳ Awaiting Response" },
      resolved: { color: "bg-green-100 text-green-800", text: "✅ Resolved" },
      closed: { color: "bg-gray-100 text-gray-800", text: "🔒 Closed" }
    };

    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", text: status };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const renderPriorityBadge = (priority: string) => {
    const priorityConfig: any = {
      low: { color: "bg-green-100 text-green-800", text: "📉 Low" },
      medium: { color: "bg-yellow-100 text-yellow-800", text: "📊 Medium" },
      high: { color: "bg-orange-100 text-orange-800", text: "📈 High" },
      urgent: { color: "bg-red-100 text-red-800", text: "🚨 Urgent" }
    };

    const config = priorityConfig[priority] || { color: "bg-gray-100 text-gray-800", text: priority };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  console.log("selectedTicket", selectedTicket)

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center items-center h-64">
          <Loader />
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout>
        <div className="text-center text-red-500 mt-10">Failed to load disputes and support tickets.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">🛡️ Disputes & Support</h2>
            <p className="text-gray-600">Manage customer complaints and support tickets</p>
          </div>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={() => mutate()}>
              🔄 Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Open Tickets</h3>
            <p className="text-2xl font-semibold text-blue-600">{openTickets.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">High Priority</h3>
            <p className="text-2xl font-semibold text-red-600">{highPriorityTickets.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Resolved</h3>
            <p className="text-2xl font-semibold text-green-600">{resolvedTickets.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Closed</h3>
            <p className="text-2xl font-semibold text-gray-600">{closedTickets.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border shadow-sm">
            <h3 className="text-sm font-medium text-gray-500">Last 7 Days</h3>
            <p className="text-2xl font-semibold text-orange-600">{recentTickets.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Tickets List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Filters */}
            <Card>
              <CardContent className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Search by ticket ID, subject, user..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="billing">Billing</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="transaction">Transaction</SelectItem>
                        <SelectItem value="account">Account</SelectItem>
                        <SelectItem value="general">General</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-500">
                    Showing {tickets.length} of {totalTickets} tickets
                    {` - Page ${currentPage} of ${totalPages}`}
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => {
                      setSearchTerm("");
                      setStatusFilter("all");
                      setPriorityFilter("all");
                      setCategoryFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Tickets List */}
            <Card>
              <CardHeader>
                <CardTitle>Support Tickets</CardTitle>
                <CardDescription>Recent customer complaints and support requests</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {tickets.map((ticket: any) => (
                    <div
                      key={ticket.id}
                      className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 ${
                        selectedTicket?.id === ticket.id ? 'bg-blue-50 border-blue-200' : ''
                      }`}
                      onClick={() => handleViewTicket(ticket)}
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-semibold">#{ticket.ticket_id}</span>
                            {renderStatusBadge(ticket.status)}
                            {renderPriorityBadge(ticket.priority)}
                          </div>
                          <h4 className="font-medium text-lg">{ticket.subject}</h4>
                          <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                            {ticket.description}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                            <span>By: {ticket.user_email}</span>
                            <span>Category: {ticket.category}</span>
                            <span>Created: {new Date(ticket.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm text-gray-500">
                            {ticket.message_count || 0} messages
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex justify-center mt-6">
                    <Pagination>
                      <PaginationContent>
                        <PaginationItem>
                          <PaginationPrevious
                            href="#"
                            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                            className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>

                        {Array.from({ length: Math.min(totalPages, 7) }).map((_, i) => {
                          let pageNum;
                          if (totalPages <= 7) {
                            pageNum = i + 1;
                          } else if (currentPage <= 4) {
                            pageNum = i + 1;
                          } else if (currentPage >= totalPages - 3) {
                            pageNum = totalPages - 6 + i;
                          } else {
                            pageNum = currentPage - 3 + i;
                          }

                          return (
                            <PaginationItem key={pageNum}>
                              <PaginationLink
                                href="#"
                                isActive={pageNum === currentPage}
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </PaginationLink>
                            </PaginationItem>
                          );
                        })}

                        <PaginationItem>
                          <PaginationNext
                            href="#"
                            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                            className={currentPage >= totalPages ? "pointer-events-none opacity-50" : ""}
                          />
                        </PaginationItem>
                      </PaginationContent>
                    </Pagination>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Ticket Details & Chat */}
          <div className="space-y-4 ">
            {selectedTicket ? (
              <>
                {/* Ticket Details */}
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-sm">Ticket #{selectedTicket.ticket_id}</CardTitle>
                        <CardDescription>{selectedTicket.subject}</CardDescription>
                      </div>
                      <Select
                        value={selectedTicket.status}
                        onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                      >
                        <SelectTrigger className="w-40">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="open">Open</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="awaiting_response">Awaiting Response</SelectItem>
                          <SelectItem value="resolved">Resolved</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid gap-4 text-sm">
                      <div>
                        <span className="font-medium">User:</span> {selectedTicket.user_email}
                      </div>
                      <div>
                        <span className="font-medium">Category:</span> {selectedTicket.category}
                      </div>
                      <div>
                        <span className="font-medium">Priority:</span> {renderPriorityBadge(selectedTicket.priority)}
                      </div>
                      <div>
                        <span className="font-medium">Created:</span> {new Date(selectedTicket.created_at).toLocaleString()}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Description</h4>
                      <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">
                        {selectedTicket.description}
                      </p>
                    </div>

                    {/* Attachments */}
                    {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                      <div>
                        <h4 className="font-medium mb-2">Attachments</h4>
                        <div className="space-y-2">
                          {selectedTicket.attachments.map((attachment: any, index: number) => (
                            <div key={index} className="flex items-center space-x-2 text-sm">
                              <span>📎</span>
                              <a 
                                href={attachment.url} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                              >
                                {attachment.name}
                              </a>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Chat Section */}
                <Card>
                  <CardHeader>
                    <CardTitle>Chat with User</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {selectedTicket.messages?.map((message: any) => (
                        <div
                          key={message.id}
                          className={`flex ${message.sender_type === 'admin' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-xs lg:max-w-md p-3 rounded-lg ${
                              message.sender_type === 'admin'
                                ? 'bg-blue-100 text-blue-900'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p className="text-sm">{message.message}</p>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(message.created_at).toLocaleString()}
                            </div>
                            {/* Message attachments */}
                            {message.attachments && message.attachments.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {message.attachments.map((attachment: any, index: number) => (
                                  <div key={index} className="flex items-center space-x-1">
                                    <span>📎</span>
                                    <a 
                                      href={attachment.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="text-xs text-blue-600 hover:underline"
                                    >
                                      {attachment.name}
                                    </a>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Message Input */}
                    <div className="mt-4 space-y-2">
                      <Textarea
                        placeholder="Type your response..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        rows={3}
                      />
                      <div className="flex flex-col gap-3">
                        <div>
                          <input
                            type="file"
                            multiple
                            onChange={handleFileAttach}
                            className="text-sm border p-2"
                          />
                          {attachments.length > 0 && (
                            <div className="text-xs text-gray-500 mt-1">
                              {attachments.length} file(s) attached
                            </div>
                          )}
                        </div>
                        <Button onClick={handleSendMessage} disabled={!newMessage.trim()}>
                          Send Message
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400 text-lg">
                    👆 Select a ticket to view details and chat
                  </div>
                  <p className="text-gray-500 text-sm mt-2">
                    Click on any ticket from the list to start a conversation
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}