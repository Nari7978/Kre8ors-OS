'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { Creator } from '@/types';
import { 
  TrendingUp, DollarSign, Users, Award, ShieldAlert,
  Clock, Play, Square, Settings, RefreshCw, CheckCircle2, AlertTriangle, ToggleLeft
} from 'lucide-react';

interface EarningsSummary {
  totalRevenue: number;
  totalNet: number;
  bySource: {
    subscription: number;
    tip: number;
    ppv_chat: number;
    ppv_post: number;
  };
}

interface TimelineItem {
  date: string;
  subscription: number;
  tip: number;
  ppv_chat: number;
  ppv_post: number;
  total: number;
}

export default function DashboardPage() {
  const { activeCreator } = useGlobalStore();
  const [loading, setLoading] = useState(false);
  const [earnings, setEarnings] = useState<{ summary: EarningsSummary; dailyTimeline: TimelineItem[] } | null>(null);

  // Load active creator earnings metrics
  useEffect(() => {
    if (!activeCreator) return;

    async function loadEarnings() {
      setLoading(true);
      try {
        const res = await fetch(`/api/earnings?creatorId=${activeCreator.id}`);
        if (res.ok) {
          const data = await res.json();
          setEarnings(data);
        }
      } catch (err) {
        console.error('Error loading earnings:', err);
      } finally {
        setLoading(false);
      }
    }
    loadEarnings();
  }, [activeCreator]);

  if (!activeCreator) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-semibold">Initializing Agency Context...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      {/* Welcome & Dashboard Shell Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100">
            Welcome back, <span className="bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">Operator Workspace</span>
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Overview and controls for <strong className="text-zinc-300">@{activeCreator.username}</strong> ({activeCreator.displayName})
          </p>
        </div>
        <div className="text-xs bg-zinc-900 border border-zinc-800 px-3.5 py-1.5 rounded-lg text-zinc-400 flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          Live Agent Synced
        </div>
      </div>

      {/* Grid Layout Shell */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Creator Analytics Cards (Placeholder for Commit 6) */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm min-h-[250px] flex items-center justify-center">
            <div className="text-center text-zinc-500 space-y-2">
              <TrendingUp className="h-8 w-8 mx-auto text-blue-500/60" />
              <p className="text-sm font-semibold">Loading Creator Financial Analytics...</p>
            </div>
          </div>
        </div>

        {/* Right Column: Connection Status & Shift Tracker & Automations (Placeholder for Commits 7, 8, 9) */}
        <div className="space-y-6">
          {/* Creator Status Board Card */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-center min-h-[180px]">
            <p className="text-zinc-500 text-sm">Connection Status Loading...</p>
          </div>

          {/* Shifts tracker Card */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-center min-h-[180px]">
            <p className="text-zinc-500 text-sm">Shifts Tracker Loading...</p>
          </div>

          {/* Automations Card */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm flex items-center justify-center min-h-[180px]">
            <p className="text-zinc-500 text-sm">Automation Rules Loading...</p>
          </div>
        </div>
      </div>
    </div>
  );
}
