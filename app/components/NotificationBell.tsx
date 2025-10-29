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

export default function NotificationBell() {
  const {
    userData,
    notifications,
    unreadCount,
    notificationsLoading,
    markAsRead,
    fetchNotifications,
  } = useUserContextData();

  const handleNotificationClick = async (notificationId: string) => {
    await markAsRead(notificationId);
  };

  const handleDropdownOpen = (open: boolean) => {
    if (open && userData) {
      // Only fetch when dropdown opens and we have user data
      fetchNotifications();
    }
  };

  if (!userData) return null;

  return (
    <DropdownMenu onOpenChange={handleDropdownOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative p-2">
          <div className="text-xl">🔔</div>
          {unreadCount > 0 && (
            <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 text-white">
              {unreadCount > 9 ? '9+' : unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-80 max-h-96 overflow-y-auto">
        <div className="flex items-center justify-between p-2 border-b">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} unread</Badge>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          {notificationsLoading ? (
            <div className="p-4 text-center text-gray-500">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-sm mt-2">Loading notifications...</p>
            </div>
          ) : (
            <>
              {notifications.slice(0, 5).map((notification) => (
                <DropdownMenuItem 
                  key={notification.id} 
                  className={`p-3 cursor-pointer ${!notification.read_at ? 'bg-blue-50' : ''}`}
                  onClick={() => handleNotificationClick(notification.id)}
                >
                  <div className="flex flex-col space-y-1 w-full">
                    <div className="flex justify-between items-start">
                      <span className="font-medium text-sm line-clamp-1">
                        {notification.title}
                      </span>
                      {!notification.read_at && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-gray-600 line-clamp-2">
                      {notification.message}
                    </p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>
                        {notification.type === 'contract' && '📝 '}
                        {notification.type === 'wallet' && '💰 '}
                        {notification.type === 'transaction' && '💸 '}
                        {notification.type}
                      </span>
                      <span>{new Date(notification.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}

              {notifications.length === 0 && (
                <div className="p-4 text-center text-gray-500">
                  <div className="text-2xl mb-2">🔔</div>
                  <p className="text-sm">No notifications</p>
                </div>
              )}
            </>
          )}
        </div>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild>
          <Link href="/notifications" className="cursor-pointer text-center justify-center">
            View All Notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}