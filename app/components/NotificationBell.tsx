// components/NotificationBell.tsx
"use client";

import Link from "next/link";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/app/components/ui/dropdown-menu";
import { useUserContextData } from "../context/userData";
import { useEffect, useState } from "react";

export default function NotificationBell() {
  const {
    userData,
    notifications,
    unreadCount,
    notificationsLoading,
    markAsRead,
    fetchNotifications,
    fetchUnreadCount,
  } = useUserContextData();

  const [isOpen, setIsOpen] = useState(false);
  const handleNotificationClick = async (notificationId: string) => {
    if (!notificationId) {
      console.error('Notification ID is required');
      return;
    }

    try {
      await markAsRead(notificationId);
      // Refresh unread count after marking as read
      await fetchUnreadCount();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const handleDropdownOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && userData?.id) {
      // Refresh notifications when dropdown opens
      fetchNotifications('all', 10).catch(error => {
        console.error('Failed to fetch notifications:', error);
      });
    }
  };

  // Auto-refresh notifications when dropdown is open
  useEffect(() => {
    if (!isOpen || !userData?.id) return;

    const interval = setInterval(() => {
      fetchNotifications('all', 10).catch(error => {
        console.error('Failed to refresh notifications:', error);
      });
    }, 30000); // Refresh every 30 seconds when open

    return () => clearInterval(interval);
  }, [isOpen, userData?.id, fetchNotifications]);

  if (!userData) return null;

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'contract': return '📝';
      case 'wallet': return '💰';
      case 'transaction': return '💸';
      case 'security': return '🔒';
      case 'info': return 'ℹ️';
      default: return '🔔';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return `${Math.floor(diffInHours * 60)}m ago`;
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <DropdownMenu onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className="relative p-2"
          aria-label={`Notifications ${unreadCount > 0 ? `(${unreadCount} unread)` : ''}`}
        >
          <div className="text-xl">🔔</div>
          {unreadCount > 0 && (
            <Badge 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white"
              aria-live="polite"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-3 border-b">
          <span className="font-semibold text-base">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {unreadCount} unread
            </Badge>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          {notificationsLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#C29307]  mx-auto mb-2"></div>
              <p className="text-sm">Loading notifications...</p>
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-6 text-center text-gray-500">
              <div className="text-3xl mb-2">🔔</div>
              <p className="text-sm">No notifications yet</p>
              <p className="text-xs mt-1">We'll notify you when something arrives</p>
            </div>
          ) : (
            notifications.slice(0, 10).map((notification) => (
              <DropdownMenuItem 
                key={notification.id} 
                className={`p-3 cursor-pointer border-b last:border-b-0 ${
                  !notification.read_at ? 'bg-blue-50 border-l-2 border-l-[#C29307]' : ''
                } hover:bg-gray-50 transition-colors`}
                onClick={() => handleNotificationClick(notification.id)}
              >
                <div className="flex flex-col space-y-1 w-full">
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start space-x-2 flex-1">
                      <span className="text-sm mt-0.5 flex-shrink-0">
                        {getNotificationIcon(notification.type)}
                      </span>
                      <div className="flex-1 min-w-0">
                        <span className="font-medium text-sm line-clamp-1 break-words">
                          {notification.title}
                        </span>
                      </div>
                    </div>
                    {!notification.read_at && (
                      <div 
                        className="w-2 h-2 bg-[#C29307] rounded-full flex-shrink-0 mt-1.5"
                        aria-label="Unread notification"
                      />
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2 break-words ml-5">
                    {notification.message}
                  </p>
                  <div className="flex justify-between items-center text-xs text-gray-500 ml-5">
                    <span className="capitalize">{notification.type}</span>
                    <span>{formatTime(notification.created_at)}</span>
                  </div>
                </div>
              </DropdownMenuItem>
            ))
          )}
        </div>

        {notifications.length > 0 && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild className="p-0">
              <Link 
                href="/dashboard/notifications" 
                className="cursor-pointer text-center justify-center py-2 text-[#C29307] hover:text-[#C29307] text-sm font-medium"
              >
                View All Notifications
              </Link>
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}