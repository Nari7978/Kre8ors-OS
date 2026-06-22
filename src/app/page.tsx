'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { Creator } from '@/types';
import { 
  TrendingUp, DollarSign, Users, Award, ShieldAlert,
  Clock, Play, Square, Settings, RefreshCw, CheckCircle2, AlertTriangle, ToggleLeft,
  Wallet
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
        {/* Left Column: Creator Analytics Cards */}
        <div className="lg:col-span-2 space-y-6">
          {/* Earnings Overview stats cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Total Revenue card */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700/80 transition-all">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-15 transition-opacity">
                <DollarSign className="h-20 w-20 text-blue-500" />
              </div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Gross Earnings</p>
              <h3 className="text-2xl font-bold text-zinc-100 mt-2">
                ${earnings ? earnings.summary.totalRevenue.toFixed(2) : '0.00'}
              </h3>
              <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                <span className="text-green-500 font-bold">↑ 12%</span> vs last month
              </p>
            </div>

            {/* Net Agency Commission card */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700/80 transition-all">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-15 transition-opacity">
                <Wallet className="h-20 w-20 text-indigo-500" />
              </div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Net (After OF 20% Cut)</p>
              <h3 className="text-2xl font-bold text-zinc-100 mt-2">
                ${earnings ? earnings.summary.totalNet.toFixed(2) : '0.00'}
              </h3>
              <p className="text-[10px] text-zinc-400 mt-1 flex items-center gap-1">
                OnlyFans 80% standard share
              </p>
            </div>

            {/* Performance Level */}
            <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700/80 transition-all">
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-15 transition-opacity">
                <Award className="h-20 w-20 text-amber-500" />
              </div>
              <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Performance tier</p>
              <h3 className="text-2xl font-bold text-amber-400 mt-2">Elite Creator</h3>
              <p className="text-[10px] text-zinc-400 mt-1">
                Top 0.5% of Agency portfolio
              </p>
            </div>
          </div>

          {/* Revenue Source Breakdown & Timeline */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-6">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-500" />
              Revenue Source Breakdown
            </h3>

            {earnings ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Source list progress */}
                <div className="space-y-4">
                  {[
                    { label: 'Subscriptions', key: 'subscription', color: 'bg-blue-500' },
                    { label: 'Tips & Donations', key: 'tip', color: 'bg-emerald-500' },
                    { label: 'PPV Chat Unlock Messages', key: 'ppv_chat', color: 'bg-amber-500' },
                    { label: 'PPV Scheduled Posts', key: 'ppv_post', color: 'bg-purple-500' },
                  ].map((src) => {
                    const amt = earnings.summary.bySource[src.key as keyof typeof earnings.summary.bySource] || 0;
                    const pct = earnings.summary.totalRevenue > 0 
                      ? (amt / earnings.summary.totalRevenue) * 100 
                      : 0;
                    return (
                      <div key={src.key} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs font-semibold">
                          <span className="text-zinc-400">{src.label}</span>
                          <span className="text-zinc-200">${amt.toFixed(2)} ({pct.toFixed(1)}%)</span>
                        </div>
                        <div className="h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${src.color} transition-all duration-500`} 
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Timeline recent entries table */}
                <div className="space-y-3">
                  <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider block">Recent Daily Earnings</span>
                  <div className="max-h-[160px] overflow-y-auto border border-zinc-800/80 rounded-xl divide-y divide-zinc-800/60 bg-zinc-950/20">
                    {earnings.dailyTimeline.slice(-5).reverse().map((day) => (
                      <div key={day.date} className="p-2.5 flex items-center justify-between text-xs hover:bg-zinc-900/30 transition-colors">
                        <span className="text-zinc-400 font-medium">
                          {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="font-semibold text-zinc-200">${day.total.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-12 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                Aggregating database logs...
              </div>
            )}
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
