'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, UserPlus, BarChart3, Search, RefreshCw, 
  Settings, CheckCircle2, AlertTriangle, ArrowRight, ShieldCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function CreatorsDirectoryPage() {
  const [creators, setCreators] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadCreators();
  }, []);

  async function loadCreators() {
    setLoading(true);
    try {
      const res = await fetch('/api/creators');
      if (res.ok) {
        const data = await res.json();
        setCreators(data || []);
      }
    } catch (err) {
      console.error('Error fetching creators:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredCreators = creators.filter((c) =>
    c.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
            <Users className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100">
              Creator Directory
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Manage credentials, proxy assignments, and session connectivity states.
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.location.href = '/creators/compare'}
            className="px-3.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs font-bold hover:bg-zinc-850 hover:text-white transition-all flex items-center gap-1.5"
          >
            <BarChart3 className="h-3.5 w-3.5 text-indigo-400" />
            Compare Creators
          </button>
          <button
            onClick={() => window.location.href = '/creators/onboard'}
            className="px-3.5 py-1.5 rounded-lg bg-blue-650 hover:bg-blue-600 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-blue-650/15"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Onboard Creator
          </button>
        </div>
      </div>

      {/* Stats Quick Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700/80 transition-all">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Creators</p>
          <h3 className="text-2xl font-bold text-zinc-100 mt-2">{creators.length}</h3>
          <p className="text-[10px] text-zinc-450 mt-1">Integrated profiles</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700/80 transition-all">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Active Handshakes</p>
          <h3 className="text-2xl font-bold text-green-400 mt-2">
            {creators.filter((c) => c.status === 'ACTIVE').length}
          </h3>
          <p className="text-[10px] text-zinc-450 mt-1">Credentials verified</p>
        </div>
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700/80 transition-all">
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Needs Attention</p>
          <h3 className="text-2xl font-bold text-amber-450 mt-2">
            {creators.filter((c) => c.status !== 'ACTIVE').length}
          </h3>
          <p className="text-[10px] text-zinc-450 mt-1">Session expired alerts</p>
        </div>
      </div>

      {/* Filters & Listing */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-zinc-550" />
          <input
            type="text"
            placeholder="Search creator database by username or name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900/60 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-zinc-350 focus:outline-none focus:border-blue-500 font-semibold"
          />
        </div>

        {loading ? (
          <div className="py-12 text-center text-zinc-500 text-sm flex items-center justify-center gap-2 bg-zinc-900/20 border border-zinc-850 rounded-2xl">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-500" />
            Loading creator details...
          </div>
        ) : filteredCreators.length === 0 ? (
          <div className="py-16 text-center text-zinc-500 bg-zinc-900/20 border border-zinc-850 rounded-2xl flex flex-col items-center justify-center gap-2">
            <Users className="h-10 w-10 opacity-20 text-zinc-400" />
            <p className="text-sm font-semibold">No creators found matching criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredCreators.map((c) => (
                <motion.div
                  key={c.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm space-y-4 flex flex-col justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-zinc-850 border border-zinc-700 overflow-hidden flex-shrink-0">
                      {c.avatarUrl ? (
                        <img src={c.avatarUrl} alt={c.displayName} className="object-cover h-full w-full" />
                      ) : (
                        <div className="h-full w-full bg-zinc-800 flex items-center justify-center font-bold text-xs text-zinc-400">
                          {c.displayName[0]}
                        </div>
                      )}
                    </div>
                    <div>
                      <h4 className="text-sm font-extrabold text-zinc-200">{c.displayName}</h4>
                      <span className="text-[10px] text-zinc-500 font-mono">@{c.username}</span>
                    </div>
                    <span className={`ml-auto text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                      c.status === 'ACTIVE'
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                      {c.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-xs border-t border-zinc-900 pt-3">
                    <div className="flex items-center justify-between text-zinc-500">
                      <span>Auth ID:</span>
                      <span className="font-mono text-zinc-400">{c.authId}</span>
                    </div>
                    <div className="flex items-center justify-between text-zinc-500">
                      <span>Verification Check:</span>
                      <span className="text-green-400 flex items-center gap-1 font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Checked
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 border-t border-zinc-900 pt-3">
                    <button
                      onClick={() => window.location.href = `/settings?creatorId=${c.id}`}
                      className="flex-1 bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-350 hover:text-white text-[10px] font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      <Settings className="h-3 w-3" />
                      Settings
                    </button>
                    <button
                      onClick={() => window.location.href = `/messages?creatorId=${c.id}`}
                      className="flex-1 bg-blue-600/10 border border-blue-500/25 hover:bg-blue-600/20 text-blue-400 text-[10px] font-bold py-1.5 rounded-lg transition-all flex items-center justify-center gap-1"
                    >
                      Open Inbox
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}
