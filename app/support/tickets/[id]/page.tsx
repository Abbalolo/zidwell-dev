// app/support/tickets/[id]/page.tsx
"use client";


import { useParams, useRouter } from "next/navigation";
import useSWR from "swr";
import { useState } from "react";
import Swal from "sweetalert2";
import { Button } from "@/app/components/ui/button";
import { Textarea } from "@/app/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useUserContextData } from "@/app/context/userData";
import Loader from "@/app/components/Loader";

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function TicketDetailPage() {
  const {user} = useUserContextData()
  const params = useParams();
  const router = useRouter();
  const ticketId = params.id as string;
  
  const [newMessage, setNewMessage] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: ticket, error, isLoading, mutate } = useSWR(
    user ? `/api/support/tickets/${ticketId}` : null,
    fetcher,
    { refreshInterval: 30000 } // Refresh every 30 seconds
  );

  const handleSendMessage = async () => {
    if (!newMessage.trim()) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('ticket_id', ticketId);
      formData.append('message', newMessage);
      formData.append('sender_type', 'user');
      
      attachments.forEach(file => {
        formData.append('attachments', file);
      });

      await fetch("/api/support/tickets/messages", {
        method: "POST",
        body: formData,
      });

      setNewMessage("");
      setAttachments([]);
      mutate(); // Refresh the ticket data
      
      Swal.fire({
        icon: "success",
        title: "Message Sent",
        text: "Your message has been sent to support",
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (err) {
      Swal.fire("Error", "Failed to send message", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments(Array.from(files));
    }
  };

  const renderStatusBadge = (status: string) => {
    const statusConfig: any = {
      open: { color: "bg-blue-100 text-blue-800", text: "Open" },
      in_progress: { color: "bg-yellow-100 text-yellow-800", text: "In Progress" },
      awaiting_response: { color: "bg-orange-100 text-orange-800", text: "Awaiting Response" },
      resolved: { color: "bg-green-100 text-green-800", text: "Resolved" },
      closed: { color: "bg-gray-100 text-gray-800", text: "Closed" }
    };
    const config = statusConfig[status] || { color: "bg-gray-100 text-gray-800", text: status };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  if (!user) {
    return <div>Please sign in to view this ticket.</div>;
  }

  if (isLoading) return <div className=" flex justify-center items-center">
    <Loader/>
  </div>;
  if (error) return <div>Error loading ticket</div>;
  if (!ticket) return <div>Ticket not found</div>;

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Ticket #{ticket.ticket_id}</h1>
            <p className="text-gray-600">{ticket.subject}</p>
          </div>
          <Button variant="outline" onClick={() => router.push('/support/tickets')}>
            ← Back to Tickets
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Ticket Details */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <span className="font-medium">Status:</span>
                  <div className="mt-1">{renderStatusBadge(ticket.status)}</div>
                </div>
                <div>
                  <span className="font-medium">Category:</span>
                  <div className="mt-1">{ticket.category}</div>
                </div>
                <div>
                  <span className="font-medium">Priority:</span>
                  <div className="mt-1">
                    <Badge className={
                      ticket.priority === 'high' ? 'bg-red-100 text-red-800' :
                      ticket.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-green-100 text-green-800'
                    }>
                      {ticket.priority}
                    </Badge>
                  </div>
                </div>
                <div>
                  <span className="font-medium">Created:</span>
                  <div className="mt-1">{new Date(ticket.created_at).toLocaleString()}</div>
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span>
                  <div className="mt-1">{new Date(ticket.updated_at).toLocaleString()}</div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Chat Section */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Conversation</CardTitle>
                <CardDescription>
                  Chat with our support team about your issue
                </CardDescription>
              </CardHeader>
              <CardContent>
                {/* Messages */}
                <div className="space-y-4 max-h-96 overflow-y-auto mb-6">
                  {ticket.messages?.map((message: any) => (
                    <div
                      key={message.id}
                      className={`flex ${message.sender_type === 'admin' ? 'justify-start' : 'justify-end'}`}
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
                          {message.sender_type === 'admin' && ' • Support Team'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Message Input */}
                {ticket.status !== 'closed' && ticket.status !== 'resolved' && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Type your message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      rows={3}
                    />
                    <div className="flex justify-between items-center">
                      <div>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="text-sm"
                          accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
                        />
                        {attachments.length > 0 && (
                          <div className="text-xs text-gray-500 mt-1">
                            {attachments.length} file(s) attached
                          </div>
                        )}
                      </div>
                      <Button 
                        onClick={handleSendMessage} 
                        disabled={!newMessage.trim() || isSubmitting}
                      >
                        {isSubmitting ? "Sending..." : "Send Message"}
                      </Button>
                    </div>
                  </div>
                )}

                {(ticket.status === 'closed' || ticket.status === 'resolved') && (
                  <div className="text-center py-4 text-gray-500">
                    This ticket is {ticket.status}. You can no longer send messages.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}