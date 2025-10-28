// components/NotificationBell.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import useSWR from "swr";
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

const fetcher = (url: string) => fetch(url).then(r => r.json());

export default function NotificationBell() {
  const { userData } = useUserContextData();
  const [isOpen, setIsOpen] = useState(false);
  
  // Pass userData in the request body for the API
  const { data: notifications, mutate } = useSWR(
    userData ? ['/api/notifications', userData] : null,
    ([url, userData]) => fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userData, limit: 5 })
    }).then(r => r.json()),
    { 
      refreshInterval: 30000,
      // Prevent revalidation when dropdown is open
      revalidateOnFocus: false 
    }
  );

  const markAsRead = async (notificationId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    try {
      await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userData })
      });
      
      // Mutate without revalidating immediately to prevent dropdown close
      mutate(
        (currentData: any) => 
          currentData?.map((n: any) => 
            n.id === notificationId ? { ...n, read_at: new Date().toISOString() } : n
          ),
        { revalidate: false } // Don't trigger immediate re-fetch
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const unreadCount = notifications?.filter((n: any) => !n.read_at).length || 0;

  // Remove the useEffect that closes on outside clicks - Shadcn handles this
  // useEffect(() => {
  //   if (!isOpen) return;
    
  //   const handleClickOutside = () => setIsOpen(false);
  //   document.addEventListener('click', handleClickOutside);
    
  //   return () => document.removeEventListener('click', handleClickOutside);
  // }, [isOpen]);

  if (!userData) return null;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
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
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto"
        onInteractOutside={(e) => {
          // Allow Shadcn to handle outside clicks naturally
        }}
      >
        <div className="flex items-center justify-between p-2 border-b">
          <span className="font-semibold">Notifications</span>
          {unreadCount > 0 && (
            <Badge variant="secondary">{unreadCount} unread</Badge>
          )}
        </div>

        <div className="max-h-64 overflow-y-auto">
          {notifications?.slice(0, 5).map((notification: any) => (
            <DropdownMenuItem 
              key={notification.id} 
              className={`p-3 cursor-pointer ${!notification.read_at ? 'bg-blue-50' : ''}`}
              onClick={(e) => markAsRead(notification.id, e)}
              onSelect={(e) => e.preventDefault()} // Prevent default selection behavior
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

          {(!notifications || notifications.length === 0) && (
            <div className="p-4 text-center text-gray-500">
              <div className="text-2xl mb-2">🔔</div>
              <p className="text-sm">No notifications</p>
            </div>
          )}
        </div>

        <DropdownMenuSeparator />
        
        <DropdownMenuItem asChild onSelect={(e) => e.preventDefault()}>
          <Link 
            href="/notifications" 
            className="cursor-pointer text-center justify-center w-full"
            onClick={() => setIsOpen(false)} // Close dropdown when navigating
          >
            View All Notifications
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}