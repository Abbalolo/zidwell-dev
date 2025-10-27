// app/support/tickets/page.tsx
"use client";

import useSWR from "swr";
import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { useUserContextData } from "@/app/context/userData";
import Loader from "@/app/components/Loader";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function UserTicketsPage() {
  const { user } = useUserContextData();
  console.log(user)
  const {
    data: tickets,
    error,
    isLoading,
  } = useSWR(
    user ? `/api/support/tickets?user_id=${user?.id}` : null,
    fetcher
  );

  const renderStatusBadge = (status: string) => {
    const statusConfig: any = {
      open: { color: "bg-blue-100 text-blue-800", text: "Open" },
      in_progress: {
        color: "bg-yellow-100 text-yellow-800",
        text: "In Progress",
      },
      awaiting_response: {
        color: "bg-orange-100 text-orange-800",
        text: "Awaiting Response",
      },
      resolved: { color: "bg-green-100 text-green-800", text: "Resolved" },
      closed: { color: "bg-gray-100 text-gray-800", text: "Closed" },
    };
    const config = statusConfig[status] || {
      color: "bg-gray-100 text-gray-800",
      text: status,
    };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  const renderPriorityBadge = (priority: string) => {
    const priorityConfig: any = {
      low: { color: "bg-green-100 text-green-800", text: "Low" },
      medium: { color: "bg-yellow-100 text-yellow-800", text: "Medium" },
      high: { color: "bg-orange-100 text-orange-800", text: "High" },
      urgent: { color: "bg-red-100 text-red-800", text: "Urgent" },
    };
    const config = priorityConfig[priority] || {
      color: "bg-gray-100 text-gray-800",
      text: priority,
    };
    return <Badge className={config.color}>{config.text}</Badge>;
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <p className="text-center">Please sign in to view your tickets.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading)
    return (
      <div className="min-h-screen flex items-center justify-center">
      <Loader/>
      </div>
    );
  if (error)
    return (
      <div className="min-h-screen flex items-center justify-center">
        Error loading tickets
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">My Support Tickets</h1>
            <p className="text-gray-600">
              View and manage your support requests
            </p>
          </div>
          <Link href="/support/create-ticket">
            <Button className="bg-[#C29307]">+ New Ticket</Button>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Your Tickets</CardTitle>
            <CardDescription>
              {tickets?.length || 0} ticket(s) found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {tickets?.map((ticket: any) => (
                <Link key={ticket.id} href={`/support/tickets/${ticket.id}`}>
                  <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold">
                            #{ticket.ticket_id}
                          </span>
                          {renderStatusBadge(ticket.status)}
                          {renderPriorityBadge(ticket.priority)}
                        </div>
                        <h3 className="font-medium text-lg">
                          {ticket.subject}
                        </h3>
                        <p className="text-gray-600 text-sm mt-1 line-clamp-2">
                          {ticket.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                          <span>Category: {ticket.category}</span>
                          <span>
                            Created:{" "}
                            {new Date(ticket.created_at).toLocaleDateString()}
                          </span>
                          <span>
                            Last update:{" "}
                            {new Date(ticket.updated_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-gray-500">
                          {ticket.message_count || 0} messages
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {(!tickets || tickets.length === 0) && (
                <div className="text-center py-8">
                  <p className="text-gray-500">No tickets found.</p>
                  <Link href="/support/create-ticket">
                    <Button className="mt-4 bg-[#C29307]">Create Your First Ticket</Button>
                  </Link>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
