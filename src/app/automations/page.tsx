'use client';

import React, { useState } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { Cpu, Plus } from 'lucide-react';

export default function AutomationsPage() {
  const { activeCreator } = useGlobalStore();
  
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
    </div>
  );
}
