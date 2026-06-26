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

  // Active fan detail drawer modal state
  const [selectedFan, setSelectedFan] = useState<Fan | null>(null);

  useEffect(() => {
    if (!activeCreator) return;

    const timer = setTimeout(() => {
      loadFans();
    }, 300);

    return () => clearTimeout(timer);
  }, [activeCreator, search, statusFilter, minSpent, tagFilter]);

  async function loadFans() {
    if (!activeCreator) return;
    setLoading(true);
    try {
      let url = `/api/fans?creatorId=${activeCreator.id}`;
      if (search.trim()) {
        url += `&search=${encodeURIComponent(search.trim())}`;
      }
      if (statusFilter !== 'all') {
        url += `&isSubscriber=${statusFilter === 'active'}`;
      }
      if (minSpent.trim()) {
        url += `&minSpent=${minSpent.trim()}`;
      }
      if (tagFilter.trim()) {
        url += `&tags=${encodeURIComponent(tagFilter.trim())}`;
      }

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

  // Calculate metrics (always on un-filtered stats or filtered stats? Let's keep it on filtered stats for real-time segmented visibility)
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

      {/* Filters Board Dashboard */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
          Directory Segmentation Filters
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Search by name or username..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Status filter selector */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="all">Subscription: All</option>
              <option value="active">Active Subscribers</option>
              <option value="expired">Expired Subscribers</option>
            </select>
          </div>

          {/* Spent filter selector */}
          <div>
            <select
              value={minSpent}
              onChange={(e) => setMinSpent(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="">LTV Spend: All</option>
              <option value="50">Spent &gt;= $50.00</option>
              <option value="100">Spent &gt;= $100.00</option>
              <option value="500">Spent &gt;= $500.00</option>
              <option value="1000">Spent &gt;= $1000.00 (Whales)</option>
            </select>
          </div>

          {/* Tag search filter */}
          <div className="relative">
            <Tag className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
            <input
              type="text"
              placeholder="Filter by custom tag (e.g. vip)..."
              value={tagFilter}
              onChange={(e) => setTagFilter(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 pl-9 pr-4 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
        </div>
      </div>

      {/* Directory Table View */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="py-20 text-center text-zinc-500 text-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
            <span>Loading subscriber records...</span>
          </div>
        ) : fans.length === 0 ? (
          <div className="py-24 text-center text-zinc-500 flex flex-col items-center justify-center space-y-4">
            <p className="text-sm font-semibold">No subscribers match the current filters</p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setMinSpent('');
                setTagFilter('');
              }}
              className="text-xs text-indigo-400 font-bold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/20 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4">Fan Account Details</th>
                  <th className="p-4">Subscription Status</th>
                  <th className="p-4">Registration Dates</th>
                  <th className="p-4">Total LTV Spend</th>
                  <th className="p-4">CRM Tags</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {fans.map((fan) => (
                  <tr key={fan.id} className="hover:bg-zinc-900/20 transition-colors">
                    {/* Account Details */}
                    <td className="p-4 flex items-center gap-3 min-w-[200px]">
                      <div className="h-9 w-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {fan.avatarUrl ? (
                          <img src={fan.avatarUrl} alt={fan.displayName} className="object-cover h-full w-full" />
                        ) : (
                          <Users className="h-4.5 w-4.5 text-zinc-600" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <span className="font-bold text-zinc-200 block truncate">{fan.displayName}</span>
                        <span className="text-zinc-500 font-semibold block text-[10px] mt-0.5">@{fan.username}</span>
                      </div>
                    </td>

                    {/* Sub Status */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                        fan.isSubscriber 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${fan.isSubscriber ? 'bg-green-400' : 'bg-red-400'}`} />
                        {fan.isSubscriber ? 'Active' : 'Expired'}
                      </span>
                    </td>

                    {/* Dates */}
                    <td className="p-4 text-zinc-400 font-medium">
                      <div>Subbed: {new Date(fan.subscribedAt).toLocaleDateString()}</div>
                      {fan.expiresAt && (
                        <div className="text-[10px] text-zinc-500 mt-0.5">
                          Expires: {new Date(fan.expiresAt).toLocaleDateString()}
                        </div>
                      )}
                    </td>

                    {/* Spend */}
                    <td className="p-4">
                      <span className="font-extrabold text-zinc-100 bg-zinc-950 border border-zinc-850 px-2.5 py-1 rounded-lg flex items-center gap-1 w-max text-xs">
                        <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                        {Number(fan.totalSpent).toFixed(2)}
                      </span>
                    </td>

                    {/* Tags */}
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1 max-w-[220px]">
                        {Array.isArray(fan.customTags) && fan.customTags.length > 0 ? (
                          fan.customTags.map((tag) => (
                            <span key={tag} className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] px-2 py-0.5 rounded-md font-bold">
                              #{tag}
                            </span>
                          ))
                        ) : (
                          <span className="text-zinc-600 text-[10px] italic">No tags</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedFan(fan)}
                        className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 p-2 rounded-xl transition-all inline-flex items-center justify-center gap-1.5 font-semibold text-[10px] tracking-wide"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Manage Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
