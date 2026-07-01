'use client';

import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Users, DollarSign, MessageSquare, Award, 
  ArrowLeft, RefreshCw, BarChart3, Star, Wallet, Sparkles 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function CompareCreatorsPage() {
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCompareMetrics();
  }, []);

  async function loadCompareMetrics() {
    setLoading(true);
    try {
      const res = await fetch('/api/creators/compare');
      if (res.ok) {
        const data = await res.json();
        setMetrics(data || []);
      }
    } catch (err) {
      console.error('Error loading compare metrics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-500 mb-4" />
        <p className="text-sm font-semibold font-mono">Aggregating comparison metrics...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => window.location.href = '/creators'}
            className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
          >
            <ArrowLeft className="h-4.5 w-4.5" />
          </button>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2">
              <BarChart3 className="h-7 w-7 text-indigo-400" />
              Creator Comparisons
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Side-by-side performance indicators, revenue statistics, and chat KPIs.
            </p>
          </div>
        </div>
        <button
          onClick={loadCompareMetrics}
          className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-350 text-xs font-bold hover:bg-zinc-850 hover:text-white transition-all flex items-center gap-1.5"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Stats
        </button>
      </div>

      {metrics.length === 0 ? (
        <div className="py-16 text-center text-zinc-500 bg-zinc-900/20 border border-zinc-850 rounded-2xl flex flex-col items-center justify-center gap-2">
          <Star className="h-10 w-10 opacity-20 text-zinc-400 animate-pulse" />
          <p className="text-sm font-semibold">No active creators available for comparison</p>
          <button
            onClick={() => window.location.href = '/creators/onboard'}
            className="mt-3 text-xs bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl transition-all"
          >
            Onboard First Creator
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {metrics.map((c, idx) => (
            <motion.div
              key={c.id}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700/80 transition-all flex flex-col justify-between space-y-6"
            >
              {/* Header profile cards */}
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-zinc-850 border border-zinc-700 overflow-hidden flex-shrink-0">
                  {c.avatarUrl ? (
                    <img src={c.avatarUrl} alt={c.displayName} className="object-cover h-full w-full" />
                  ) : (
                    <div className="h-full w-full bg-zinc-800 flex items-center justify-center font-bold text-sm text-zinc-450">
                      {c.displayName[0]}
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-extrabold text-zinc-200">{c.displayName}</h3>
                  <span className="text-[10px] text-zinc-500 font-mono block">@{c.username}</span>
                </div>
                <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                  c.status === 'ACTIVE'
                    ? 'bg-green-500/10 text-green-400 border-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/20'
                }`}>
                  {c.status}
                </span>
              </div>

              {/* Earnings side-by-side columns */}
              <div className="grid grid-cols-2 gap-4 border-t border-b border-zinc-850 py-4">
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Gross Revenue</span>
                  <div className="text-lg font-extrabold text-zinc-200 flex items-center gap-0.5">
                    <DollarSign className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    {c.totalRevenue.toFixed(2)}
                  </div>
                </div>
                <div className="space-y-0.5">
                  <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block">Net Revenue</span>
                  <div className="text-lg font-extrabold text-blue-450 flex items-center gap-0.5">
                    <Wallet className="h-4 w-4 text-blue-500 flex-shrink-0" />
                    {c.totalNet.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* KPI Performance Bars */}
              <div className="space-y-4">
                {/* Active Subscribers */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-450 flex items-center gap-1">
                      <Users className="h-3.5 w-3.5 text-zinc-500" />
                      Subscribers
                    </span>
                    <span className="font-bold text-zinc-300">{c.subscribersCount} / {c.fanCount}</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-850 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-blue-500 rounded-full"
                      style={{ width: `${Math.min(100, (c.subscribersCount / Math.max(c.fanCount, 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* Message Volume */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-450 flex items-center gap-1">
                      <MessageSquare className="h-3.5 w-3.5 text-zinc-500" />
                      Message Volume
                    </span>
                    <span className="font-bold text-zinc-300">{c.totalMessages} (Tips: {c.tipsCount})</span>
                  </div>
                </div>

                {/* PPV Conversion Rate */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-zinc-450 flex items-center gap-1">
                      <Sparkles className="h-3.5 w-3.5 text-zinc-500" />
                      PPV Conversion
                    </span>
                    <span className="font-bold text-amber-400">{c.ppvConversionRate}%</span>
                  </div>
                  <div className="h-1.5 w-full bg-zinc-850 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-amber-500 rounded-full animate-pulse"
                      style={{ width: `${c.ppvConversionRate}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom tier label */}
              <div className="pt-2 border-t border-zinc-850/60 flex items-center gap-2 text-[10px] text-zinc-550 font-bold uppercase tracking-wider">
                <Award className="h-4.5 w-4.5 text-amber-500" />
                {c.totalRevenue > 2000 ? 'Tier: Mega Earner' : c.totalRevenue > 500 ? 'Tier: Rising Star' : 'Tier: Micro Creator'}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
