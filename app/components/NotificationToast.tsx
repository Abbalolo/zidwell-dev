// components/NotificationToast.tsx
"use client";

import { useEffect, useState } from "react";
import { useUserContextData } from "../context/userData";
import { X } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
}

export default function NotificationToast() {
  const { userData } = useUserContextData();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!userData) return;

    // Poll for new notifications instead of using EventSource
    const pollForNotifications = async () => {
      try {
        const response = await fetch('/api/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            userData, 
            filter: 'unread',
            limit: 5 
          })
        });
        
        if (response.ok) {
          const newNotifications = await response.json();
          
          // Check for truly new notifications (not already in state)
          setNotifications(prev => {
            const existingIds = new Set(prev.map(n => n.id));
            const trulyNew = newNotifications.filter((n: Notification) => !existingIds.has(n.id));
            return [...trulyNew, ...prev].slice(0, 5); // Keep only 5 most recent
          });
        }
      } catch (error) {
        console.error('Error polling notifications:', error);
      }
    };

    // Poll immediately
    pollForNotifications();

    // Then poll every 30 seconds
    const interval = setInterval(pollForNotifications, 30000);

    return () => clearInterval(interval);
  }, [userData]);

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map((notification) => (
        <Card key={notification.id} className="shadow-lg border-l-4 border-l-blue-500 animate-in slide-in-from-right">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <Badge variant="secondary" className="text-xs">
                    {notification.type}
                  </Badge>
                  <span className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleTimeString()}
                  </span>
                </div>
                <h4 className="font-semibold text-sm">{notification.title}</h4>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}