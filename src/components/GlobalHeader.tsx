'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGlobalStore } from '@/lib/store/global-store';
import { Creator } from '@/types';
import { LayoutDashboard, MessageSquare, User, RefreshCw, LogOut, Play, Folder, Calendar, Tv, DollarSign, Users, Settings, Cpu, UserCheck, TrendingUp, Sparkles } from 'lucide-react';

export default function GlobalHeader() {
  const pathname = usePathname();
  const { activeCreator, setActiveCreator, isShiftActive, activeShiftId, endShift } = useGlobalStore();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCreators() {
      setLoading(true);
      try {
        const res = await fetch('/api/creators');
        if (res.ok) {
          const data = await res.json();
          setCreators(data);
          // If no active creator is selected yet, select the first active one by default
          if (data.length > 0 && !activeCreator) {
            const firstActive = data.find((c: Creator) => c.status === 'ACTIVE') || data[0];
            setActiveCreator(firstActive);
          }
        }
      } catch (err) {
        console.error('Error loading creators in header:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchCreators();
  }, [activeCreator, setActiveCreator]);

  const handleCreatorChange = (creatorId: string) => {
    const selected = creators.find((c) => c.id === creatorId) || null;
    setActiveCreator(selected);
  };

  return (
    <header className="sticky top-0 z-50 h-16 w-full border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 flex items-center justify-between">
      {/* Brand Logo & Name */}
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2">
          <span className="h-8 w-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            K
          </span>
          <span className="font-extrabold text-lg bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent tracking-tight">
            Kre8ors OS
          </span>
        </Link>

        {/* Desktop Nav Links */}
        <nav className="flex items-center gap-1.5">
          <Link
            href="/"
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              pathname === '/'
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <LayoutDashboard className="h-3.5 w-3.5" />
            Dashboard
          </Link>
          <Link
            href="/messages"
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              pathname.startsWith('/messages')
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Messages
          </Link>
          <Link
            href="/vault"
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              pathname.startsWith('/vault')
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Folder className="h-3.5 w-3.5" />
            Media Vault
          </Link>
          <Link
            href="/content"
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              pathname.startsWith('/content')
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Calendar className="h-3.5 w-3.5" />
            Content Queue
          </Link>
          <Link
            href="/stories"
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              pathname.startsWith('/stories')
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Tv className="h-3.5 w-3.5" />
            Stories Queue
          </Link>
          <Link
            href="/automations"
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              pathname.startsWith('/automations')
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Cpu className="h-3.5 w-3.5" />
            Automations
          </Link>
          <Link
            href="/ai"
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              pathname.startsWith('/ai')
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5 text-purple-400" />
            AI Assistant
          </Link>
          <Link
            href="/earnings"
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              pathname.startsWith('/earnings')
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <DollarSign className="h-3.5 w-3.5" />
            Earnings
          </Link>
          <Link
            href="/team"
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              pathname.startsWith('/team')
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Users className="h-3.5 w-3.5" />
            Team
          </Link>
          <Link
            href="/fans"
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              pathname.startsWith('/fans')
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5 text-blue-400" />
            Fans CRM
          </Link>
          <Link
            href="/analytics"
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              pathname.startsWith('/analytics')
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <TrendingUp className="h-3.5 w-3.5 text-indigo-400" />
            Analytics
          </Link>
          <Link
            href="/settings"
            className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-1.5 ${
              pathname.startsWith('/settings')
                ? 'bg-zinc-800 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900/60'
            }`}
          >
            <Settings className="h-3.5 w-3.5" />
            Settings
          </Link>
        </nav>
      </div>

      {/* Header Context / Actions */}
      <div className="flex items-center gap-4">
        {/* Shift log indicator inside header */}
        {isShiftActive && (
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Shift Active
          </div>
        )}

        {/* Creator Context Selector */}
        <div className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-1.5 min-w-[220px]">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Creator:</span>
          {loading ? (
            <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500 ml-auto" />
          ) : (
            <select
              value={activeCreator?.id || ''}
              onChange={(e) => handleCreatorChange(e.target.value)}
              className="flex-1 bg-transparent border-none text-xs text-zinc-200 font-semibold focus:outline-none cursor-pointer pr-1"
            >
              {creators.map((c) => (
                <option key={c.id} value={c.id} className="bg-zinc-950 text-zinc-300">
                  {c.displayName} (@{c.username})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>
    </header>
  );
}
