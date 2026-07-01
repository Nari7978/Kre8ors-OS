'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Bell, Check, CheckSquare, Trash2, X, DollarSign, 
  UserPlus, MessageSquare, AlertTriangle, Sparkles, HelpCircle 
} from 'lucide-react';
import { useGlobalStore } from '@/lib/store/global-store';
import { motion, AnimatePresence } from 'framer-motion';

export default function NotificationBell() {
  const { activeCreator } = useGlobalStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  useEffect(() => {
    if (!activeCreator) return;
    loadNotifications();

    // Auto-polling interval: 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, [activeCreator]);

  // Handle outside clicks to close the dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function loadNotifications() {
    if (!activeCreator) return;
    try {
      const res = await fetch(`/api/notifications?creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    }
  }

  async function handleMarkAsRead(id: string) {
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id }),
      });
      if (res.ok) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
        );
      }
    } catch (err) {
      console.error('Error marking read:', err);
    }
  }

  async function handleMarkAllRead() {
    if (!activeCreator) return;
    try {
      const res = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: activeCreator.id, markAll: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      }
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  }

  async function handleClearAll() {
    if (!activeCreator) return;
    try {
      const res = await fetch(`/api/notifications?creatorId=${activeCreator.id}&clearAll=true`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setNotifications([]);
      }
    } catch (err) {
      console.error('Error clearing notifications:', err);
    }
  }

  async function handleSimulateEvent() {
    if (!activeCreator) return;
    try {
      const res = await fetch('/api/notifications/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: activeCreator.id }),
      });
      if (res.ok) {
        loadNotifications();
      }
    } catch (err) {
      console.error('Error simulating event:', err);
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_SUBSCRIBER':
        return <UserPlus className="h-4 w-4 text-blue-400" />;
      case 'TIP':
        return <DollarSign className="h-4 w-4 text-emerald-400" />;
      case 'PPV_UNLOCK':
        return <Sparkles className="h-4 w-4 text-amber-400" />;
      case 'CHAT_MESSAGE':
        return <MessageSquare className="h-4 w-4 text-purple-400" />;
      case 'SYSTEM_ALERT':
        return <AlertTriangle className="h-4 w-4 text-red-400" />;
      default:
        return <HelpCircle className="h-4 w-4 text-zinc-400" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer flex items-center justify-center"
      >
        <Bell className="h-4.5 w-4.5" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-600 border-2 border-zinc-950 rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col max-h-[480px]"
          >
            {/* Header */}
            <div className="p-4 border-b border-zinc-850 bg-zinc-900/30 flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Alerts & Events</h4>
                <p className="text-[10px] text-zinc-500 mt-0.5">{unreadCount} unread events</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSimulateEvent}
                  className="px-2 py-1 rounded bg-purple-600/10 border border-purple-500/20 text-purple-400 text-[9px] font-bold hover:bg-purple-600/20 transition-all"
                  title="Simulate event"
                >
                  Simulate
                </button>
                {notifications.length > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="p-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all"
                    title="Mark all read"
                  >
                    <CheckSquare className="h-3.5 w-3.5" />
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="p-1 rounded bg-red-950/20 border border-red-900/20 text-red-400 hover:text-red-300 transition-all"
                    title="Clear all"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto divide-y divide-zinc-900/60 scrollbar-thin">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-zinc-600 flex flex-col items-center justify-center gap-2">
                  <Bell className="h-8 w-8 opacity-20 text-zinc-400" />
                  <span className="text-xs">No active notifications</span>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 flex items-start gap-3 transition-colors ${
                      n.isRead ? 'opacity-65 hover:opacity-100 bg-zinc-950/20' : 'bg-zinc-900/20 border-l-2 border-blue-500'
                    }`}
                  >
                    <div className="h-7 w-7 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-xs font-bold text-zinc-300 truncate">{n.title}</span>
                        {!n.isRead && (
                          <button
                            onClick={() => handleMarkAsRead(n.id)}
                            className="p-0.5 rounded bg-blue-500/10 hover:bg-blue-500 text-blue-400 hover:text-white transition-all flex-shrink-0"
                            title="Mark as read"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-zinc-500 mt-1 leading-normal break-words">{n.message}</p>
                      <span className="text-[8px] text-zinc-600 block mt-1.5">
                        {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer link */}
            <div className="p-2.5 border-t border-zinc-850 bg-zinc-900/30 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  window.location.href = '/activity';
                }}
                className="text-[10px] font-bold text-blue-400 hover:text-blue-300 transition-all uppercase tracking-wider block w-full py-1"
              >
                View Full Activity Feed →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
