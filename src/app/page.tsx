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
  const { activeCreator, setActiveCreator } = useGlobalStore();
  const [loading, setLoading] = useState(false);
  const [earnings, setEarnings] = useState<{ summary: EarningsSummary; dailyTimeline: TimelineItem[] } | null>(null);
  
  // Connection status board state
  const [connectionChecklist, setConnectionChecklist] = useState<any>(null);
  const [checkingConnection, setCheckingConnection] = useState(false);
  const [updatingConnection, setUpdatingConnection] = useState(false);

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

  // Load connection status
  useEffect(() => {
    if (!activeCreator) return;
    loadConnectionStatus();
  }, [activeCreator]);

  async function loadConnectionStatus() {
    setCheckingConnection(true);
    try {
      const res = await fetch(`/api/creators/${activeCreator!.id}/status`);
      if (res.ok) {
        const data = await res.json();
        setConnectionChecklist(data);
      }
    } catch (err) {
      console.error('Error checking connection status:', err);
    } finally {
      setCheckingConnection(false);
    }
  }

  async function handleConnectionToggle(action: 'connect' | 'disconnect') {
    setUpdatingConnection(true);
    try {
      const res = await fetch(`/api/creators/${activeCreator!.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: action === 'connect' ? 'reconnect' : 'disconnect' }),
      });
      if (res.ok) {
        const data = await res.json();
        // Update global store status
        setActiveCreator({
          ...activeCreator!,
          status: data.creator.status,
        });
        loadConnectionStatus();
      }
    } catch (err) {
      console.error('Error toggling connection status:', err);
    } finally {
      setUpdatingConnection(false);
    }
  }


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
          {/* Creator Connection Status Checker Board */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Settings className="h-4 w-4 text-blue-500" />
                Integration Status
              </h3>
              {connectionChecklist && (
                <span className={`text-[10px] uppercase font-extrabold px-2 py-0.5 rounded-full border ${
                  activeCreator.status === 'ACTIVE' 
                    ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                    : activeCreator.status === 'PENDING'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {activeCreator.status}
                </span>
              )}
            </div>

            {connectionChecklist ? (
              <div className="space-y-3.5">
                {/* Connection Checklist Items */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span>OnlyFans API key</span>
                    <span className="text-green-400 flex items-center gap-1 font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Valid
                    </span>
                  </div>

                  {[
                    { label: 'Session Cookie Loaded', val: connectionChecklist.checklist.sessionCookieLoaded },
                    { label: 'User Agent Configured', val: connectionChecklist.checklist.userAgentMatch },
                    { label: 'X-BC Header Verified', val: connectionChecklist.checklist.xbcHeaderConfigured },
                    { label: 'Auth ID Verification', val: connectionChecklist.checklist.authIdVerified },
                  ].map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-zinc-400">
                      <span>{item.label}</span>
                      {item.val ? (
                        <span className="text-green-400 flex items-center gap-1 font-semibold">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Synced
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1 font-semibold">
                          <AlertTriangle className="h-3.5 w-3.5" /> Missing
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                {/* Disconnect or Reconnect Button */}
                <div className="pt-2 border-t border-zinc-800/60">
                  {activeCreator.status === 'ACTIVE' ? (
                    <button
                      type="button"
                      disabled={updatingConnection}
                      onClick={() => handleConnectionToggle('disconnect')}
                      className="w-full bg-red-950/40 border border-red-500/20 hover:bg-red-950/60 text-red-400 text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {updatingConnection ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <ShieldAlert className="h-3.5 w-3.5" />
                      )}
                      Simulate Disconnect API
                    </button>
                  ) : (
                    <button
                      type="button"
                      disabled={updatingConnection}
                      onClick={() => handleConnectionToggle('connect')}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {updatingConnection ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <RefreshCw className="h-3.5 w-3.5" />
                      )}
                      Simulate Reconnect Credentials
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
                Querying API integration...
              </div>
            )}
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
