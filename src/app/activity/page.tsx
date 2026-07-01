'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { 
  Bell, Check, Trash2, UserPlus, DollarSign, Sparkles, 
  MessageSquare, AlertTriangle, HelpCircle, RefreshCw, Zap, SlidersHorizontal 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ActivityPage() {
  const { activeCreator } = useGlobalStore();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);

  useEffect(() => {
    if (!activeCreator) return;
    loadNotifications();
  }, [activeCreator]);

  async function loadNotifications() {
    if (!activeCreator) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications?creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        setNotifications(data || []);
      }
    } catch (err) {
      console.error('Error loading notifications:', err);
    } finally {
      setLoading(false);
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

  async function handleSimulateEvent(type?: string) {
    if (!activeCreator) return;
    setSimulating(true);
    try {
      const res = await fetch('/api/notifications/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creatorId: activeCreator.id, type }),
      });
      if (res.ok) {
        loadNotifications();
      }
    } catch (err) {
      console.error('Error simulating event:', err);
    } finally {
      setSimulating(false);
    }
  }

  async function handleSeedHistory() {
    if (!activeCreator) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/notifications/generate?creatorId=${activeCreator.id}`);
      if (res.ok) {
        loadNotifications();
      }
    } catch (err) {
      console.error('Error seeding history:', err);
    } finally {
      setLoading(false);
    }
  }

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'NEW_SUBSCRIBER':
        return <UserPlus className="h-5 w-5 text-blue-400" />;
      case 'TIP':
        return <DollarSign className="h-5 w-5 text-emerald-400" />;
      case 'PPV_UNLOCK':
        return <Sparkles className="h-5 w-5 text-amber-400" />;
      case 'CHAT_MESSAGE':
        return <MessageSquare className="h-5 w-5 text-purple-400" />;
      case 'SYSTEM_ALERT':
        return <AlertTriangle className="h-5 w-5 text-red-400" />;
      default:
        return <HelpCircle className="h-5 w-5 text-zinc-400" />;
    }
  };

  const getNotificationColorClass = (type: string) => {
    switch (type) {
      case 'NEW_SUBSCRIBER': return 'border-blue-500/20 bg-blue-500/5';
      case 'TIP': return 'border-emerald-500/20 bg-emerald-500/5';
      case 'PPV_UNLOCK': return 'border-amber-500/20 bg-amber-500/5';
      case 'CHAT_MESSAGE': return 'border-purple-500/20 bg-purple-500/5';
      case 'SYSTEM_ALERT': return 'border-red-500/20 bg-red-500/5';
      default: return 'border-zinc-800 bg-zinc-900/10';
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filter === 'ALL') return true;
    return n.type === filter;
  });

  const filterOptions = [
    { id: 'ALL', label: 'All Events' },
    { id: 'NEW_SUBSCRIBER', label: 'Subscribers' },
    { id: 'TIP', label: 'Tips' },
    { id: 'PPV_UNLOCK', label: 'PPV Unlocks' },
    { id: 'CHAT_MESSAGE', label: 'Chat Messages' },
    { id: 'SYSTEM_ALERT', label: 'System Alerts' },
  ];

  if (!activeCreator) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-semibold">Initializing Activity Context...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
            <Bell className="h-7 w-7 text-blue-500" />
            Activity & Event Feed
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Real-time subscriber events and billing transactions tracking for <strong className="text-zinc-300">@{activeCreator.username}</strong>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleSeedHistory}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-850 hover:text-white transition-all flex items-center gap-1.5"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Reset/Seed History
          </button>
          {notifications.length > 0 && (
            <>
              <button
                onClick={handleMarkAllRead}
                className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-850 hover:text-white transition-all flex items-center gap-1.5"
              >
                <Check className="h-3.5 w-3.5 text-green-500" />
                Mark All Read
              </button>
              <button
                onClick={handleClearAll}
                className="px-3.5 py-1.5 rounded-lg bg-red-950/40 border border-red-500/20 text-red-400 text-xs font-bold hover:bg-red-950/60 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Clear All
              </button>
            </>
          )}
        </div>
      </div>

      {/* Simulator Tools */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
          <Zap className="h-4 w-4 text-purple-500" />
          Event Simulation triggers
        </div>
        <div className="flex flex-wrap gap-2.5">
          <button
            onClick={() => handleSimulateEvent('NEW_SUBSCRIBER')}
            disabled={simulating}
            className="px-3.5 py-2 rounded-xl bg-blue-600/10 border border-blue-500/20 text-blue-400 hover:bg-blue-600/20 text-xs font-bold transition-all disabled:opacity-50"
          >
            + Sub Joined
          </button>
          <button
            onClick={() => handleSimulateEvent('TIP')}
            disabled={simulating}
            className="px-3.5 py-2 rounded-xl bg-emerald-600/10 border border-emerald-500/20 text-emerald-400 hover:bg-emerald-600/20 text-xs font-bold transition-all disabled:opacity-50"
          >
            + Tip Tipped
          </button>
          <button
            onClick={() => handleSimulateEvent('PPV_UNLOCK')}
            disabled={simulating}
            className="px-3.5 py-2 rounded-xl bg-amber-600/10 border border-amber-500/20 text-amber-400 hover:bg-amber-600/20 text-xs font-bold transition-all disabled:opacity-50"
          >
            + PPV Unlocked
          </button>
          <button
            onClick={() => handleSimulateEvent('CHAT_MESSAGE')}
            disabled={simulating}
            className="px-3.5 py-2 rounded-xl bg-purple-600/10 border border-purple-500/20 text-purple-400 hover:bg-purple-600/20 text-xs font-bold transition-all disabled:opacity-50"
          >
            + Chat Message
          </button>
          <button
            onClick={() => handleSimulateEvent('SYSTEM_ALERT')}
            disabled={simulating}
            className="px-3.5 py-2 rounded-xl bg-red-600/10 border border-red-500/20 text-red-400 hover:bg-red-600/20 text-xs font-bold transition-all disabled:opacity-50"
          >
            + System Warning
          </button>
        </div>
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        {/* Filters Sidebar */}
        <div className="lg:col-span-1 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4">
          <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-blue-500" />
            Filters
          </h3>
          <div className="flex flex-col gap-1.5">
            {filterOptions.map((opt) => {
              const isActive = filter === opt.id;
              const count = opt.id === 'ALL' 
                ? notifications.length 
                : notifications.filter((n) => n.type === opt.id).length;
              return (
                <button
                  key={opt.id}
                  onClick={() => setFilter(opt.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all text-left ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-zinc-400 hover:bg-zinc-850/60 hover:text-zinc-200'
                  }`}
                >
                  <span>{opt.label}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] ${isActive ? 'bg-white/20 text-white' : 'bg-zinc-900 text-zinc-500 border border-zinc-850'}`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeline Events List */}
        <div className="lg:col-span-3 space-y-4">
          {loading ? (
            <div className="py-12 text-center text-zinc-500 text-sm flex items-center justify-center gap-2 bg-zinc-900/20 border border-zinc-850 rounded-2xl">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
              Fetching recent events...
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 bg-zinc-900/20 border border-zinc-850 rounded-2xl flex flex-col items-center justify-center gap-2">
              <Bell className="h-10 w-10 opacity-20 text-zinc-400" />
              <p className="text-sm font-semibold">No events found matching current criteria</p>
              <button
                onClick={handleSeedHistory}
                className="mt-3 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl transition-all"
              >
                Seed Mock Events
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.map((n) => (
                  <motion.div
                    key={n.id}
                    layout
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`flex items-start gap-4 p-5 rounded-2xl border transition-all ${
                      n.isRead ? 'opacity-70 bg-zinc-900/20 border-zinc-800/60' : `border-l-4 border-l-blue-500 bg-zinc-900/40 border-zinc-800`
                    }`}
                  >
                    <div className={`h-10 w-10 rounded-xl border flex items-center justify-center flex-shrink-0 ${getNotificationColorClass(n.type)}`}>
                      {getNotificationIcon(n.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-bold text-zinc-200">{n.title}</span>
                        <div className="flex items-center gap-2.5">
                          <span className="text-[10px] text-zinc-500">
                            {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!n.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(n.id)}
                              className="p-1 rounded bg-blue-600/10 hover:bg-blue-600 border border-blue-500/20 text-blue-400 hover:text-white transition-all"
                              title="Mark read"
                            >
                              <Check className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                      <p className="text-xs text-zinc-400 mt-2 leading-relaxed break-words">{n.message}</p>
                      
                      {n.metadata && (
                        <div className="mt-3 p-3 rounded-xl bg-zinc-950/40 border border-zinc-850/60 text-[10px] font-mono text-zinc-500 flex flex-wrap gap-x-4 gap-y-1">
                          {Object.entries(JSON.parse(n.metadata)).map(([key, val]: any) => (
                            <span key={key}>
                              <strong className="text-zinc-400">{key}:</strong> {val}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
