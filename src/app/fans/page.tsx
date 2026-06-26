'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { Fan } from '@/types';
import { Users, UserCheck, UserMinus, DollarSign, Search, RefreshCw, Filter, SlidersHorizontal, Tag, Eye } from 'lucide-react';

export default function FansCRMPage() {
  const { activeCreator } = useGlobalStore();
  const [fans, setFans] = useState<Fan[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [minSpent, setMinSpent] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  useEffect(() => {
    if (activeCreator) {
      loadFans();
    }
  }, [activeCreator]);

  async function loadFans() {
    if (!activeCreator) return;
    setLoading(true);
    try {
      let url = `/api/fans?creatorId=${activeCreator.id}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setFans(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error loading fans:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate metrics
  const totalFans = fans.length;
  const activeSubscribers = fans.filter((f) => f.isSubscriber).length;
  const expiredSubscribers = totalFans - activeSubscribers;
  const totalLTV = fans.reduce((acc, cur) => acc + Number(cur.totalSpent || 0), 0);

  if (!activeCreator) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-8">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin mb-4" />
        <p className="text-sm font-semibold">Loading Agency Context...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Users className="h-7 w-7 text-blue-500" />
            Fans CRM Directory
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Segment, filter, and manage subscriber tags and profiles for <strong className="text-zinc-300">@{activeCreator.username}</strong>
          </p>
        </div>
        <button
          onClick={loadFans}
          disabled={loading}
          className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center justify-center gap-1.5 self-start md:self-auto"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sync Directory
        </button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Fans */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center justify-center flex-shrink-0">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Fans</p>
            <h3 className="text-xl font-black text-zinc-100 mt-0.5">{totalFans}</h3>
          </div>
        </div>

        {/* Active Subscribers */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-green-500/10 text-green-400 border border-green-500/20 flex items-center justify-center flex-shrink-0">
            <UserCheck className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Subscribers</p>
            <h3 className="text-xl font-black text-green-400 mt-0.5">{activeSubscribers}</h3>
          </div>
        </div>

        {/* Expired Subscribers */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 flex items-center justify-center flex-shrink-0">
            <UserMinus className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Expired Subscribers</p>
            <h3 className="text-xl font-black text-red-400 mt-0.5">{expiredSubscribers}</h3>
          </div>
        </div>

        {/* Total LTV */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all flex items-center gap-4">
          <div className="h-10 w-10 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="h-5 w-5" />
          </div>
          <div>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total LTV Spend</p>
            <h3 className="text-xl font-black text-emerald-400 mt-0.5">${totalLTV.toFixed(2)}</h3>
          </div>
        </div>
      </div>
    </div>
  );
}
