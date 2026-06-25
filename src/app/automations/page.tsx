'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { AutomationRule } from '@/types';
import { Cpu, Plus } from 'lucide-react';

export default function AutomationsPage() {
  const { activeCreator } = useGlobalStore();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (activeCreator) {
      loadRules();
    }
  }, [activeCreator]);

  async function loadRules() {
    setLoading(true);
    try {
      const res = await fetch(`/api/automations?creatorId=${activeCreator!.id}`);
      if (res.ok) {
        const data = await res.json();
        setRules(data || []);
      }
    } catch (err) {
      console.error('Error loading rules:', err);
    } finally {
      setLoading(false);
    }
  }

  // Derived statistics metrics
  const activeRulesCount = rules.filter((r) => r.isActive).length;
  const triggerStats = {
    newSub: rules.filter((r) => r.triggerType === 'new_subscriber').length,
    keyword: rules.filter((r) => r.triggerType === 'keyword_match').length,
  };

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
      {/* Welcome & Dashboard Shell Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Cpu className="h-7 w-7 text-indigo-500" />
            Creator Automations
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Build triggers, autoresponders, and follow-up templates for <strong className="text-zinc-300">@{activeCreator.username}</strong>
          </p>
        </div>
        <button
          className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-indigo-600/10 flex items-center justify-center gap-1.5 self-start md:self-auto hover:scale-[1.02] active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" />
          Create New Rule
        </button>
      </div>

      {/* Stats Cards Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Rules */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Total Rules</p>
          <h3 className="text-2xl font-black text-zinc-100 mt-2">{rules.length}</h3>
          <p className="text-[9px] text-zinc-400 mt-1">Registered templates</p>
        </div>
        
        {/* Active Rules */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Triggers</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">{activeRulesCount}</h3>
          <p className="text-[9px] text-zinc-400 mt-1">Live auto-responders</p>
        </div>

        {/* Welcome triggers stats */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Welcome Triggers</p>
          <h3 className="text-2xl font-black text-indigo-400 mt-2">{triggerStats.newSub}</h3>
          <p className="text-[9px] text-zinc-400 mt-1">New subscriber filters</p>
        </div>

        {/* Keyword responders stats */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Keyword Matches</p>
          <h3 className="text-2xl font-black text-blue-400 mt-2">{triggerStats.keyword}</h3>
          <p className="text-[9px] text-zinc-400 mt-1">Auto-replies in chat</p>
        </div>
      </div>
    </div>
  );
}
