'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell } from 'lucide-react';
import api from '@/lib/api';
import Link from 'next/link';
import useSWR from 'swr';
import toast from 'react-hot-toast';

interface Notification {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  action_url?: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // useSWR automatically handles caching, revalidation, and deduplication
  const { data: notifications = [], mutate } = useSWR<Notification[]>('/notifications/', {
    refreshInterval: 60000, // Poll every minute only when window is focused
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  useEffect(() => {
    function handleInteraction(event: MouseEvent | KeyboardEvent) {
      if (event.type === 'mousedown') {
        if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
          setIsOpen(false);
        }
      } else if (event.type === 'keydown') {
        if ((event as KeyboardEvent).key === 'Escape') {
          setIsOpen(false);
        }
      }
    }
    document.addEventListener('mousedown', handleInteraction);
    document.addEventListener('keydown', handleInteraction);
    return () => {
      document.removeEventListener('mousedown', handleInteraction);
      document.removeEventListener('keydown', handleInteraction);
    };
  }, []);

  const markAsRead = async (id: number) => {
    // Optimistic update
    const previousNotifications = [...notifications];
    mutate(
      notifications.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
      false
    );

    try {
      await api.post(`/notifications/${id}/mark_read/`);
      mutate(); // Revalidate from server
    } catch (error) {
      console.error('Failed to mark notification as read', error);
      toast.error("Failed to mark as read");
      mutate(previousNotifications, false); // Rollback
    }
  };

  return (
    <div className="relative mr-4" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label="Notifications"
        className="relative p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500/50"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white border-2 border-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-[-48px] sm:right-0 top-12 w-[calc(100vw-24px)] sm:w-80 max-w-sm bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-200 py-2 animate-in fade-in slide-in-from-top-2 z-[110]">
          <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center bg-gradient-to-br from-slate-50 to-transparent">
            <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button
                onClick={async () => {
                  try {
                    await api.post('/notifications/mark_all_read/');
                    mutate();
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="text-xs text-orange-600 hover:text-orange-700 font-medium"
              >
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-slate-500 text-sm">
                No notifications yet.
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  onClick={() => {
                    if (!notification.is_read) markAsRead(notification.id);
                  }}
                  className={`px-4 py-3 border-b border-slate-50 cursor-pointer transition-colors hover:bg-slate-50 ${
                    !notification.is_read ? 'bg-orange-50/30' : ''
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <h4 className={`text-sm ${!notification.is_read ? 'font-semibold text-slate-800' : 'font-medium text-slate-600'}`}>
                      {notification.title}
                    </h4>
                    {!notification.is_read && (
                      <span className="h-2 w-2 bg-orange-500 rounded-full mt-1.5 flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-slate-500 line-clamp-2">{notification.message}</p>
                  
                  {notification.action_url && (
                    <Link
                      href={notification.action_url}
                      className="text-xs text-orange-600 mt-2 inline-block font-medium hover:underline"
                    >
                      View Details
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
