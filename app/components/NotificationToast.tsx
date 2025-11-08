// components/NotificationToast.tsx
"use client";

import { useEffect, useState } from "react";
import { useUserContextData } from "../context/userData";
import { X } from "lucide-react";
import { Card, CardContent } from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";

interface ToastNotification {
  id: string;
  title: string;
  message: string;
  type: string;
  created_at: string;
  read_at: string | null;
}

export default function NotificationToast() {
  const { 
    userData, 
    notifications, 
    markAsRead,
    fetchNotifications 
  } = useUserContextData();
  const [toastNotifications, setToastNotifications] = useState<ToastNotification[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  // Show only unread notifications that haven't been shown yet
  useEffect(() => {
    if (!userData || notifications.length === 0) return;

    const newUnreadNotifications = notifications.filter(
      notification => 
        !notification.read_at && 
        !processedIds.has(notification.id)
    );

    if (newUnreadNotifications.length > 0) {
      setToastNotifications(prev => [
        ...newUnreadNotifications,
        ...prev
      ].slice(0, 5)); // Keep only 5 most recent

      // Mark these as processed
      setProcessedIds(prev => {
        const newSet = new Set(prev);
        newUnreadNotifications.forEach(n => newSet.add(n.id));
        return newSet;
      });
    }
  }, [notifications, userData, processedIds]);

  const removeNotification = async (id: string) => {
    // Mark as read in backend and context
    await markAsRead(id);
    
    // Remove from toast
    setToastNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Auto-remove notifications after 5 seconds
  useEffect(() => {
    if (toastNotifications.length === 0) return;

    const timer = setTimeout(() => {
      const oldestNotification = toastNotifications[toastNotifications.length - 1];
      if (oldestNotification) {
        removeNotification(oldestNotification.id);
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [toastNotifications]);

  if (toastNotifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      {toastNotifications.map((notification) => (
        <Card 
          key={notification.id} 
          className="shadow-lg border-l-4 border-l-blue-500 animate-in slide-in-from-right duration-300"
        >
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
                className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 transition-colors"
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