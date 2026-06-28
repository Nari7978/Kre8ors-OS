'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { Fan } from '@/types';
import { Users, UserCheck, UserMinus, DollarSign, Search, RefreshCw, Filter, SlidersHorizontal, Tag, Eye, X, Plus, Send, Edit2, Trash2 } from 'lucide-react';

export const getTagStyles = (tag: string) => {
  const hash = tag.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = [
    { bg: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400', label: 'Indigo' },
    { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', label: 'Emerald' },
    { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', label: 'Amber' },
    { bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400', label: 'Rose' },
    { bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400', label: 'Cyan' },
    { bg: 'bg-purple-500/10 border-purple-500/20 text-purple-400', label: 'Purple' },
    { bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400', label: 'Orange' },
  ];
  return colors[hash % colors.length];
};

export default function FansCRMPage() {
  const { activeCreator } = useGlobalStore();
  const [fans, setFans] = useState<Fan[]>([]);
  const [loading, setLoading] = useState(false);

  // Filter States
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'expired'>('all');
  const [minSpent, setMinSpent] = useState('');
  const [tagFilter, setTagFilter] = useState('');

  // Sorting & Layout States
  const [sortBy, setSortBy] = useState<'totalSpent' | 'subscribedAt' | 'expiresAt' | 'displayName'>('totalSpent');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  // Pagination States
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [summary, setSummary] = useState({
    totalFans: 0,
    activeSubscribers: 0,
    expiredSubscribers: 0,
    totalLTV: 0,
  });

  // Advanced Filters States
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [maxSpent, setMaxSpent] = useState('');
  const [joinedAfter, setJoinedAfter] = useState('');
  const [joinedBefore, setJoinedBefore] = useState('');
  const [expiresAfter, setExpiresAfter] = useState('');
  const [expiresBefore, setExpiresBefore] = useState('');

  // Active fan detail drawer modal state
  const [selectedFan, setSelectedFan] = useState<Fan | null>(null);
  const [notesText, setNotesText] = useState('');
  const [newTag, setNewTag] = useState('');
  const [saving, setSaving] = useState(false);

  // Autocomplete tags state
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [isTagInputFocused, setIsTagInputFocused] = useState(false);
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(0);

  // Quick tag editing states
  const [activeCardTagInput, setActiveCardTagInput] = useState<string | null>(null);
  const [quickTagText, setQuickTagText] = useState('');

  // Bulk selection state
  const [selectedFanIds, setSelectedFanIds] = useState<string[]>([]);

  // Bulk tagging states
  const [bulkTagAction, setBulkTagAction] = useState<'add' | 'remove' | null>(null);
  const [bulkTagText, setBulkTagText] = useState('');
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Bulk messaging states
  const [bulkMessageModalOpen, setBulkMessageModalOpen] = useState(false);
  const [bulkMessageText, setBulkMessageText] = useState('');
  const [sendingBulkMessage, setSendingBulkMessage] = useState(false);

  // Tag Manager State
  const [tagManagerOpen, setTagManagerOpen] = useState(false);
  const [renamingTag, setRenamingTag] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');

  // Toggle selection for a single fan
  const handleToggleSelectFan = (fanId: string) => {
    setSelectedFanIds((prev) =>
      prev.includes(fanId) ? prev.filter((id) => id !== fanId) : [...prev, fanId]
    );
  };

  // Toggle select all fans in the current page view
  const handleToggleSelectAll = () => {
    if (selectedFanIds.length === fans.length && fans.length > 0) {
      setSelectedFanIds([]);
    } else {
      setSelectedFanIds(fans.map((f) => f.id));
    }
  };

  // Reset selection on filter change
  useEffect(() => {
    setSelectedFanIds([]);
  }, [activeCreator, search, statusFilter, minSpent, maxSpent, tagFilter, joinedAfter, joinedBefore, expiresAfter, expiresBefore, sortBy, sortOrder]);

  // Load all unique active creator tags for autocomplete options
  const loadAvailableTags = async () => {
    if (!activeCreator) return;
    try {
      const res = await fetch(`/api/fans?creatorId=${activeCreator.id}&tagsOnly=true`);
      if (res.ok) {
        const list = await res.json();
        setAvailableTags(list || []);
      }
    } catch (err) {
      console.error('Error loading available tags:', err);
    }
  };

  useEffect(() => {
    loadAvailableTags();
  }, [activeCreator]);

  useEffect(() => {
    if (selectedFan) {
      setNotesText(selectedFan.notes || '');
      setNewTag('');
    }
  }, [selectedFan]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, statusFilter, minSpent, maxSpent, tagFilter, joinedAfter, joinedBefore, expiresAfter, expiresBefore, sortBy, sortOrder]);

  useEffect(() => {
    if (!activeCreator) return;

    const timer = setTimeout(() => {
      loadFans();
    }, 300);

    return () => clearTimeout(timer);
  }, [
    activeCreator, search, statusFilter, minSpent, maxSpent, tagFilter, 
    joinedAfter, joinedBefore, expiresAfter, expiresBefore, sortBy, sortOrder, page, limit
  ]);

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
      if (maxSpent.trim()) {
        url += `&maxSpent=${maxSpent.trim()}`;
      }
      if (joinedAfter.trim()) {
        url += `&joinedAfter=${joinedAfter.trim()}`;
      }
      if (joinedBefore.trim()) {
        url += `&joinedBefore=${joinedBefore.trim()}`;
      }
      if (expiresAfter.trim()) {
        url += `&expiresAfter=${expiresAfter.trim()}`;
      }
      if (expiresBefore.trim()) {
        url += `&expiresBefore=${expiresBefore.trim()}`;
      }
      if (tagFilter.trim()) {
        url += `&tags=${encodeURIComponent(tagFilter.trim())}`;
      }
      // Add sorting query params
      url += `&sortBy=${sortBy}&sortOrder=${sortOrder}`;
      // Add pagination query params
      url += `&page=${page}&limit=${limit}`;

      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data === 'object' && 'fans' in data) {
          setFans(data.fans || []);
          setTotalPages(data.totalPages || 1);
          setTotalCount(data.totalCount || 0);
          if (data.summary) {
            setSummary(data.summary);
          }
        } else {
          setFans(Array.isArray(data) ? data : []);
        }
      }
    } catch (err) {
      console.error('Error loading fans:', err);
    } finally {
      setLoading(false);
    }
  }

  const handleAddTag = () => {
    if (!selectedFan || !newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    if (selectedFan.customTags.includes(tag)) return;
    const updatedTags = [...selectedFan.customTags, tag];
    setSelectedFan({ ...selectedFan, customTags: updatedTags });
    setNewTag('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedFan) return;
    const updatedTags = selectedFan.customTags.filter((t) => t !== tagToRemove);
    setSelectedFan({ ...selectedFan, customTags: updatedTags });
  };

  const handleQuickAddTag = async (fan: Fan) => {
    if (!quickTagText.trim()) return;
    const tag = quickTagText.trim().toLowerCase();
    if (fan.customTags.includes(tag)) {
      setActiveCardTagInput(null);
      setQuickTagText('');
      return;
    }
    const updatedTags = [...fan.customTags, tag];
    setActiveCardTagInput(null);
    setQuickTagText('');

    try {
      const res = await fetch('/api/fans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fanId: fan.id,
          customTags: updatedTags,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      }
    } catch (err) {
      console.error('Error adding quick tag:', err);
    }
  };

  const handleQuickRemoveTag = async (fan: Fan, tagToRemove: string) => {
    const updatedTags = fan.customTags.filter((t) => t !== tagToRemove);
    try {
      const res = await fetch('/api/fans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fanId: fan.id,
          customTags: updatedTags,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      }
    } catch (err) {
      console.error('Error removing quick tag:', err);
    }
  };

  const handleBulkTagSubmit = async () => {
    if (!bulkTagAction || !bulkTagText.trim() || selectedFanIds.length === 0) return;
    setBulkProcessing(true);
    try {
      const res = await fetch('/api/fans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fanIds: selectedFanIds,
          bulkAction: bulkTagAction,
          tag: bulkTagText.trim(),
        }),
      });
      if (res.ok) {
        // Reload fans to get fresh details
        await loadFans();
        // Clear bulk state
        setSelectedFanIds([]);
        setBulkTagAction(null);
        setBulkTagText('');
      } else {
        console.error('Failed to update bulk tags');
      }
    } catch (err) {
      console.error('Error updating bulk tags:', err);
    } finally {
      setBulkProcessing(false);
    }
  };

  const handleSendBulkMessage = async () => {
    if (!bulkMessageText.trim() || selectedFanIds.length === 0 || !activeCreator) return;
    setSendingBulkMessage(true);
    try {
      const res = await fetch('/api/fans/bulk-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          fanIds: selectedFanIds,
          text: bulkMessageText.trim(),
        }),
      });
      if (res.ok) {
        setBulkMessageModalOpen(false);
        setBulkMessageText('');
        setSelectedFanIds([]);
        alert(`Successfully queued messages for ${selectedFanIds.length} subscribers!`);
      } else {
        console.error('Failed to send bulk messages');
      }
    } catch (err) {
      console.error('Error sending bulk messages:', err);
    } finally {
      setSendingBulkMessage(false);
    }
  };

  const handleRenameTagConfirm = async (oldTag: string) => {
    if (!renameText.trim() || !activeCreator) return;
    const newTagVal = renameText.trim().toLowerCase();
    if (newTagVal === oldTag) {
      setRenamingTag(null);
      return;
    }
    
    try {
      const res = await fetch('/api/fans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          globalAction: 'rename',
          oldTag,
          newTag: newTagVal,
        }),
      });

      if (res.ok) {
        await loadFans();
        await loadAvailableTags();
        setRenamingTag(null);
        setRenameText('');
      } else {
        console.error('Failed to rename tag globally');
      }
    } catch (err) {
      console.error('Error renaming tag globally:', err);
    }
  };

  const handleDeleteTagConfirm = async (tagToDelete: string) => {
    if (!activeCreator) return;
    const confirmDelete = window.confirm(`Are you sure you want to delete the tag #${tagToDelete} globally? This will remove it from all subscribers.`);
    if (!confirmDelete) return;

    try {
      const res = await fetch('/api/fans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          globalAction: 'delete',
          tag: tagToDelete,
        }),
      });

      if (res.ok) {
        if (tagFilter === tagToDelete) {
          setTagFilter('');
        }
        await loadFans();
        await loadAvailableTags();
      } else {
        console.error('Failed to delete tag globally');
      }
    } catch (err) {
      console.error('Error deleting tag globally:', err);
    }
  };

  const handleSaveDetails = async () => {
    if (!selectedFan) return;
    setSaving(true);
    try {
      const res = await fetch('/api/fans', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fanId: selectedFan.id,
          notes: notesText,
          customTags: selectedFan.customTags,
        }),
      });

      if (res.ok) {
        const updated = await res.json();
        // Update fan in list state
        setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
        // Close modal
        setSelectedFan(null);
      } else {
        console.error('Failed to save fan details');
      }
    } catch (err) {
      console.error('Error saving fan details:', err);
    } finally {
      setSaving(false);
    }
  };

  // Read metrics from summary state populated by API
  const { totalFans, activeSubscribers, expiredSubscribers, totalLTV } = summary;

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
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-indigo-400" />
            Directory Segmentation Filters
          </h3>
          <button
            onClick={() => setAdvancedOpen(!advancedOpen)}
            className={`text-xs px-3 py-1.5 rounded-xl border transition-all font-bold flex items-center gap-1.5 ${
              advancedOpen 
                ? 'bg-indigo-600/10 border-indigo-500/35 text-indigo-400 hover:bg-indigo-600/20' 
                : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700'
            }`}
          >
            <Filter className="h-3.5 w-3.5" />
            {advancedOpen ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
          </button>
        </div>
        
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

        {/* Advanced Filters Expandable Box */}
        {advancedOpen && (
          <div className="pt-4 border-t border-zinc-800/60 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Max Spent Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Max Spent ($)</label>
              <input
                type="number"
                placeholder="Upper LTV limit..."
                value={maxSpent}
                onChange={(e) => setMaxSpent(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Joined After Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Joined After</label>
              <input
                type="date"
                value={joinedAfter}
                onChange={(e) => setJoinedAfter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Joined Before Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Joined Before</label>
              <input
                type="date"
                value={joinedBefore}
                onChange={(e) => setJoinedBefore(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Expires After Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Expires After</label>
              <input
                type="date"
                value={expiresAfter}
                onChange={(e) => setExpiresAfter(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Expires Before Date Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Expires Before</label>
              <input
                type="date"
                value={expiresBefore}
                onChange={(e) => setExpiresBefore(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl py-2 px-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        )}

        {/* Sorting & Layout control bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-zinc-800/60 text-xs">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-zinc-950 border border-zinc-800 rounded-xl py-1.5 px-3 text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
            >
              <option value="totalSpent">LTV Spend</option>
              <option value="subscribedAt">Join Date</option>
              <option value="expiresAt">Expiry Date</option>
              <option value="displayName">Name</option>
            </select>
            
            <button
              onClick={() => setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 px-3 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1 font-semibold"
              title={`Sort ${sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
            >
              <span className="text-[10px] uppercase font-bold text-zinc-400">Order: {sortOrder.toUpperCase()}</span>
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <span className="text-zinc-500 font-bold uppercase tracking-wider text-[10px]">Layout:</span>
            <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-0.5 flex">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                  viewMode === 'table' ? 'bg-zinc-850 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${
                  viewMode === 'grid' ? 'bg-zinc-850 text-white shadow-sm' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Grid
              </button>
            </div>

            <button
              onClick={() => setTagManagerOpen(true)}
              className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white px-3.5 py-1.5 rounded-xl transition-all flex items-center justify-center gap-1.5 font-bold ml-2 text-[10px] uppercase tracking-wider"
            >
              <Tag className="h-3.5 w-3.5 text-indigo-400" />
              Manage Tags
            </button>
          </div>
        </div>
      </div>

      {/* Directory Table/Grid View */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {loading ? (
          <div className="py-24 text-center text-zinc-500 text-sm flex flex-col items-center justify-center gap-4">
            <div className="relative flex items-center justify-center">
              <div className="h-10 w-10 rounded-full border-4 border-zinc-800 border-t-indigo-500 animate-spin" />
              <div className="absolute h-6 w-6 rounded-full border-4 border-dashed border-indigo-500/30 animate-pulse" />
            </div>
            <span className="font-semibold text-zinc-400 tracking-wide animate-pulse">Filtering CRM Registry...</span>
          </div>
        ) : fans.length === 0 ? (
          <div className="py-24 text-center text-zinc-500 flex flex-col items-center justify-center space-y-4">
            <p className="text-sm font-semibold">No subscribers match the current filters</p>
            <button
              onClick={() => {
                setSearch('');
                setStatusFilter('all');
                setMinSpent('');
                setMaxSpent('');
                setTagFilter('');
                setJoinedAfter('');
                setJoinedBefore('');
                setExpiresAfter('');
                setExpiresBefore('');
              }}
              className="text-xs text-indigo-400 font-bold hover:underline"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-800/80 bg-zinc-900/20 text-zinc-400 font-bold uppercase tracking-wider text-[10px]">
                  <th className="p-4 w-10">
                    <input
                      type="checkbox"
                      checked={selectedFanIds.length === fans.length && fans.length > 0}
                      onChange={handleToggleSelectAll}
                      className="rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                    />
                  </th>
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
                  <tr 
                    key={fan.id} 
                    className={`hover:bg-zinc-900/20 transition-colors ${
                      selectedFanIds.includes(fan.id) ? 'bg-indigo-600/5' : ''
                    }`}
                  >
                    <td className="p-4">
                      <input
                        type="checkbox"
                        checked={selectedFanIds.includes(fan.id)}
                        onChange={() => handleToggleSelectFan(fan.id)}
                        className="rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5"
                      />
                    </td>
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
                      <div className="flex flex-wrap gap-1 items-center max-w-[220px]">
                        {Array.isArray(fan.customTags) && fan.customTags.map((tag) => (
                          <span key={tag} className={`group/tag inline-flex items-center gap-1 border text-[10px] pl-2 pr-1.5 py-0.5 rounded-md font-bold ${getTagStyles(tag).bg}`}>
                            #{tag}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickRemoveTag(fan, tag);
                              }}
                              className="opacity-0 group-hover/tag:opacity-100 text-zinc-500 hover:text-white rounded-full transition-opacity"
                            >
                              <X className="h-2.5 w-2.5" />
                            </button>
                          </span>
                        ))}
                        {activeCardTagInput === fan.id ? (
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="tag..."
                              autoFocus
                              value={quickTagText}
                              onChange={(e) => {
                                setQuickTagText(e.target.value);
                                setActiveSuggestionIndex(0);
                              }}
                              onBlur={() => {
                                // Small delay to allow clicking suggestions
                                setTimeout(() => {
                                  setActiveCardTagInput(null);
                                  setQuickTagText('');
                                }, 200);
                              }}
                              onKeyDown={(e) => {
                                const suggestionsList = availableTags.filter(
                                  (t) => !fan.customTags.includes(t) && t.toLowerCase().includes(quickTagText.toLowerCase())
                                );
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setActiveSuggestionIndex((prev) => Math.min(prev + 1, suggestionsList.length - 1));
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
                                } else if (e.key === 'Enter' || e.key === 'Tab') {
                                  e.preventDefault();
                                  if (quickTagText.trim() && suggestionsList.length > 0 && activeSuggestionIndex < suggestionsList.length) {
                                    const selected = suggestionsList[activeSuggestionIndex];
                                    const updatedTags = [...fan.customTags, selected];
                                    (async () => {
                                      try {
                                        const res = await fetch('/api/fans', {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            fanId: fan.id,
                                            customTags: updatedTags,
                                          }),
                                        });
                                        if (res.ok) {
                                          const updated = await res.json();
                                          setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
                                        }
                                      } catch (err) {
                                        console.error('Error adding quick tag:', err);
                                      }
                                    })();
                                    setActiveCardTagInput(null);
                                    setQuickTagText('');
                                  } else {
                                    handleQuickAddTag(fan);
                                  }
                                } else if (e.key === 'Escape') {
                                  setActiveCardTagInput(null);
                                  setQuickTagText('');
                                }
                              }}
                              className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[9px] w-16 focus:outline-none focus:border-indigo-500 text-zinc-200"
                            />
                            
                            {/* Suggestions List */}
                            {quickTagText.trim() && (
                              (() => {
                                const suggestionsList = availableTags.filter(
                                  (t) => !fan.customTags.includes(t) && t.toLowerCase().includes(quickTagText.toLowerCase())
                                );
                                if (suggestionsList.length === 0) return null;
                                return (
                                  <div className="absolute left-0 mt-1 bg-zinc-950 border border-zinc-800 rounded shadow-xl max-h-32 overflow-y-auto z-20 w-32 divide-y divide-zinc-900">
                                    {suggestionsList.map((suggestion, index) => (
                                      <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                          const updatedTags = [...fan.customTags, suggestion];
                                          (async () => {
                                            try {
                                              const res = await fetch('/api/fans', {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  fanId: fan.id,
                                                  customTags: updatedTags,
                                                }),
                                              });
                                              if (res.ok) {
                                                const updated = await res.json();
                                                setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
                                              }
                                            } catch (err) {
                                              console.error('Error adding quick tag:', err);
                                            }
                                          })();
                                          setActiveCardTagInput(null);
                                          setQuickTagText('');
                                        }}
                                        className={`w-full text-left px-2 py-1 text-[9px] transition-colors flex items-center justify-between ${
                                          index === activeSuggestionIndex
                                            ? 'bg-indigo-600 text-white font-bold'
                                            : 'text-zinc-350 hover:text-white hover:bg-zinc-900'
                                        }`}
                                      >
                                        <span>#{suggestion}</span>
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCardTagInput(fan.id);
                              setQuickTagText('');
                            }}
                            className="bg-zinc-950 border border-zinc-850 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300 text-[10px] px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5 transition-colors"
                          >
                            <Plus className="h-2.5 w-2.5" />
                            Add
                          </button>
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
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 p-6">
            {fans.map((fan) => {
              const joinedDate = new Date(fan.subscribedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              return (
                <div 
                  key={fan.id} 
                  className={`group relative border rounded-2xl p-5 backdrop-blur-sm transition-all duration-300 flex flex-col justify-between hover:shadow-xl hover:-translate-y-1 hover:shadow-indigo-500/10 ${
                    selectedFanIds.includes(fan.id)
                      ? 'bg-indigo-600/5 border-indigo-500/60 shadow-md shadow-indigo-500/5'
                      : 'bg-zinc-900/30 border-zinc-800/85 hover:border-indigo-500/40'
                  }`}
                >
                  {/* Subtle top-right gradient glow */}
                  <div className="absolute top-0 right-0 h-24 w-24 bg-gradient-to-br from-indigo-500/5 to-transparent rounded-tr-2xl pointer-events-none group-hover:from-indigo-500/10 transition-colors duration-300" />

                  <div className="space-y-4 relative z-10">
                    {/* Top avatar and status row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <input
                          type="checkbox"
                          checked={selectedFanIds.includes(fan.id)}
                          onChange={() => handleToggleSelectFan(fan.id)}
                          className="rounded border-zinc-800 bg-zinc-950 text-indigo-600 focus:ring-indigo-500 cursor-pointer h-3.5 w-3.5 flex-shrink-0 mt-1"
                        />
                        <div className="h-12 w-12 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0 group-hover:border-indigo-500/30 transition-colors">
                          {fan.avatarUrl ? (
                            <img src={fan.avatarUrl} alt={fan.displayName} className="object-cover h-full w-full" />
                          ) : (
                            <Users className="h-5 w-5 text-zinc-600" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <span className="font-extrabold text-sm text-zinc-100 block truncate group-hover:text-white transition-colors">{fan.displayName}</span>
                          <span className="text-zinc-500 font-semibold block text-[10px] mt-0.5">@{fan.username}</span>
                        </div>
                      </div>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-wide ${
                        fan.isSubscriber 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${fan.isSubscriber ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                        {fan.isSubscriber ? 'Active' : 'Expired'}
                      </span>
                    </div>

                    {/* Spend & Join dates badges */}
                    <div className="grid grid-cols-2 gap-2 bg-zinc-950/40 border border-zinc-850 p-3 rounded-xl">
                      <div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">LTV Spend</span>
                        <span className="font-black text-zinc-200 mt-1 flex items-center text-xs">
                          <DollarSign className="h-3 w-3 text-emerald-500 mr-0.5" />
                          {Number(fan.totalSpent).toFixed(2)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Subscribed</span>
                        <span className="font-semibold text-zinc-300 mt-1 text-[11px] block">{joinedDate}</span>
                      </div>
                    </div>

                    {/* CRM Tags badges */}
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider block">Tags</span>
                      <div className="flex flex-wrap gap-1 min-h-[22px] items-center">
                        {Array.isArray(fan.customTags) && fan.customTags.map((tag) => (
                          <span key={tag} className={`group/tag inline-flex items-center gap-1 border text-[9px] pl-2 pr-1.5 py-0.5 rounded-md font-bold ${getTagStyles(tag).bg}`}>
                            #{tag}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleQuickRemoveTag(fan, tag);
                              }}
                              className="opacity-0 group-hover/tag:opacity-100 text-zinc-500 hover:text-white rounded-full transition-opacity"
                            >
                              <X className="h-2 w-2" />
                            </button>
                          </span>
                        ))}
                        {activeCardTagInput === fan.id ? (
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="tag..."
                              autoFocus
                              value={quickTagText}
                              onChange={(e) => {
                                setQuickTagText(e.target.value);
                                setActiveSuggestionIndex(0);
                              }}
                              onBlur={() => {
                                // Small delay to allow clicking suggestions
                                setTimeout(() => {
                                  setActiveCardTagInput(null);
                                  setQuickTagText('');
                                }, 200);
                              }}
                              onKeyDown={(e) => {
                                const suggestionsList = availableTags.filter(
                                  (t) => !fan.customTags.includes(t) && t.toLowerCase().includes(quickTagText.toLowerCase())
                                );
                                if (e.key === 'ArrowDown') {
                                  e.preventDefault();
                                  setActiveSuggestionIndex((prev) => Math.min(prev + 1, suggestionsList.length - 1));
                                } else if (e.key === 'ArrowUp') {
                                  e.preventDefault();
                                  setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
                                } else if (e.key === 'Enter' || e.key === 'Tab') {
                                  e.preventDefault();
                                  if (quickTagText.trim() && suggestionsList.length > 0 && activeSuggestionIndex < suggestionsList.length) {
                                    const selected = suggestionsList[activeSuggestionIndex];
                                    const updatedTags = [...fan.customTags, selected];
                                    (async () => {
                                      try {
                                        const res = await fetch('/api/fans', {
                                          method: 'PATCH',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            fanId: fan.id,
                                            customTags: updatedTags,
                                          }),
                                        });
                                        if (res.ok) {
                                          const updated = await res.json();
                                          setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
                                        }
                                      } catch (err) {
                                        console.error('Error adding quick tag:', err);
                                      }
                                    })();
                                    setActiveCardTagInput(null);
                                    setQuickTagText('');
                                  } else {
                                    handleQuickAddTag(fan);
                                  }
                                } else if (e.key === 'Escape') {
                                  setActiveCardTagInput(null);
                                  setQuickTagText('');
                                }
                              }}
                              className="bg-zinc-950 border border-zinc-800 rounded px-1.5 py-0.5 text-[9px] w-16 focus:outline-none focus:border-indigo-500 text-zinc-200"
                            />
                            
                            {/* Suggestions List */}
                            {quickTagText.trim() && (
                              (() => {
                                const suggestionsList = availableTags.filter(
                                  (t) => !fan.customTags.includes(t) && t.toLowerCase().includes(quickTagText.toLowerCase())
                                );
                                if (suggestionsList.length === 0) return null;
                                return (
                                  <div className="absolute left-0 mt-1 bg-zinc-950 border border-zinc-800 rounded shadow-xl max-h-32 overflow-y-auto z-20 w-32 divide-y divide-zinc-900">
                                    {suggestionsList.map((suggestion, index) => (
                                      <button
                                        key={suggestion}
                                        type="button"
                                        onClick={() => {
                                          const updatedTags = [...fan.customTags, suggestion];
                                          (async () => {
                                            try {
                                              const res = await fetch('/api/fans', {
                                                method: 'PATCH',
                                                headers: { 'Content-Type': 'application/json' },
                                                body: JSON.stringify({
                                                  fanId: fan.id,
                                                  customTags: updatedTags,
                                                }),
                                              });
                                              if (res.ok) {
                                                const updated = await res.json();
                                                setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
                                              }
                                            } catch (err) {
                                              console.error('Error adding quick tag:', err);
                                            }
                                          })();
                                          setActiveCardTagInput(null);
                                          setQuickTagText('');
                                        }}
                                        className={`w-full text-left px-2 py-1 text-[9px] transition-colors flex items-center justify-between ${
                                          index === activeSuggestionIndex
                                            ? 'bg-indigo-600 text-white font-bold'
                                            : 'text-zinc-350 hover:text-white hover:bg-zinc-900'
                                        }`}
                                      >
                                        <span>#{suggestion}</span>
                                      </button>
                                    ))}
                                  </div>
                                );
                              })()
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveCardTagInput(fan.id);
                              setQuickTagText('');
                            }}
                            className="bg-zinc-950 border border-zinc-850 hover:border-zinc-800 text-zinc-500 hover:text-zinc-300 text-[9px] px-2 py-0.5 rounded-md font-bold flex items-center gap-0.5 transition-colors"
                          >
                            <Plus className="h-2.5 w-2.5" />
                            Add
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Actions footer row */}
                  <div className="mt-5 pt-4 border-t border-zinc-800/60 flex items-center justify-between">
                    <span className="text-[10px] text-zinc-500 font-medium">
                      {fan.expiresAt ? `Expires: ${new Date(fan.expiresAt).toLocaleDateString()}` : 'No expiry'}
                    </span>
                    <button
                      onClick={() => setSelectedFan(fan)}
                      className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1.5 font-bold text-[10px] tracking-wide"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Manage Profile
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination Controls Footer */}
        {fans.length > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 border-t border-zinc-800/60 bg-zinc-950/20 text-xs">
            <div className="text-zinc-500 font-semibold">
              Showing <span className="text-zinc-300 font-bold">{totalCount === 0 ? 0 : (page - 1) * limit + 1}</span> to{' '}
              <span className="text-zinc-300 font-bold">{Math.min(page * limit, totalCount)}</span> of{' '}
              <span className="text-zinc-300 font-bold">{totalCount}</span> entries
            </div>

            <div className="flex items-center gap-4">
              {/* Entries count size selector */}
              <div className="flex items-center gap-2">
                <span className="text-zinc-500">Show:</span>
                <select
                  value={limit}
                  onChange={(e) => {
                    setLimit(Number(e.target.value));
                    setPage(1);
                  }}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl py-1 px-2.5 text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer text-xs font-semibold"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
              </div>

              {/* Navigation button toggles */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-950 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl transition-all font-bold disabled:cursor-not-allowed"
                >
                  Prev
                </button>
                <span className="text-zinc-400 font-semibold px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="bg-zinc-950 hover:bg-zinc-900 border border-zinc-850 hover:border-zinc-800 disabled:opacity-30 disabled:hover:bg-zinc-950 text-zinc-300 hover:text-white px-3 py-1.5 rounded-xl transition-all font-bold disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      {/* Detail Slide-out Drawer Modal */}
      {selectedFan && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-md h-full bg-zinc-900 border-l border-zinc-800 p-6 shadow-2xl flex flex-col justify-between overflow-y-auto">
            <div className="space-y-6">
              {/* Drawer Header */}
              <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                <h2 className="text-md font-bold text-zinc-100 flex items-center gap-2">
                  <Tag className="h-4 w-4 text-indigo-400" />
                  Subscriber Profile Detail
                </h2>
                <button
                  onClick={() => setSelectedFan(null)}
                  className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Fan Details Avatar Card */}
              <div className="flex flex-col items-center text-center p-4 bg-zinc-950/30 border border-zinc-800/60 rounded-2xl">
                <div className="h-16 w-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden mb-3">
                  {selectedFan.avatarUrl ? (
                    <img src={selectedFan.avatarUrl} alt={selectedFan.displayName} className="object-cover h-full w-full" />
                  ) : (
                    <Users className="h-8 w-8 text-zinc-500" />
                  )}
                </div>
                <h3 className="font-bold text-sm text-zinc-200">{selectedFan.displayName}</h3>
                <p className="text-xs text-zinc-500">@{selectedFan.username}</p>
                <div className="flex items-center gap-1.5 mt-2 bg-zinc-900 px-3 py-1 rounded-full border border-zinc-800">
                  <DollarSign className="h-3.5 w-3.5 text-emerald-500" />
                  <span className="text-xs font-black text-zinc-300">LTV Spent: ${Number(selectedFan.totalSpent).toFixed(2)}</span>
                </div>
              </div>

              {/* Sub Details Info */}
              <div className="bg-zinc-950/20 border border-zinc-850 p-4 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-zinc-400">
                  <span>OnlyFans UID:</span>
                  <span className="font-semibold text-zinc-300">{selectedFan.ofId}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Subscription State:</span>
                  <span className={`font-bold ${selectedFan.isSubscriber ? 'text-green-400' : 'text-red-400'}`}>
                    {selectedFan.isSubscriber ? 'Active' : 'Expired'}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Subscribed Date:</span>
                  <span className="font-semibold text-zinc-300">
                    {new Date(selectedFan.subscribedAt).toLocaleDateString()}
                  </span>
                </div>
                {selectedFan.expiresAt && (
                  <div className="flex justify-between text-zinc-400">
                    <span>Expiration Date:</span>
                    <span className="font-semibold text-zinc-300">
                      {new Date(selectedFan.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>

              {/* CRM Tags section layout placeholder */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Custom CRM Badging Tags</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedFan.customTags.map((tag) => (
                    <span key={tag} className={`text-xs border pl-2.5 pr-1.5 py-1 rounded-full flex items-center gap-1 font-semibold ${getTagStyles(tag).bg}`}>
                      #{tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="text-zinc-500 hover:text-white rounded-full p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
                <div className="relative">
                  <div className="flex items-center gap-2 mt-2">
                    <input
                      type="text"
                      placeholder="New tag..."
                      value={newTag}
                      onChange={(e) => {
                        setNewTag(e.target.value);
                        setActiveSuggestionIndex(0);
                      }}
                      onFocus={() => setIsTagInputFocused(true)}
                      onBlur={() => {
                        // Small delay to allow clicking options
                        setTimeout(() => setIsTagInputFocused(false), 200);
                      }}
                      onKeyDown={(e) => {
                        const suggestionsList = availableTags.filter(
                          (t) => !selectedFan.customTags.includes(t) && t.toLowerCase().includes(newTag.toLowerCase())
                        );
                        if (e.key === 'ArrowDown') {
                          e.preventDefault();
                          setActiveSuggestionIndex((prev) => Math.min(prev + 1, suggestionsList.length - 1));
                        } else if (e.key === 'ArrowUp') {
                          e.preventDefault();
                          setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0));
                        } else if (e.key === 'Enter' || e.key === 'Tab') {
                          e.preventDefault();
                          if (newTag.trim() && suggestionsList.length > 0 && activeSuggestionIndex < suggestionsList.length) {
                            const selected = suggestionsList[activeSuggestionIndex];
                            const updatedTags = [...selectedFan.customTags, selected];
                            setSelectedFan({ ...selectedFan, customTags: updatedTags });
                            setNewTag('');
                          } else {
                            handleAddTag();
                          }
                        } else if (e.key === 'Escape') {
                          setIsTagInputFocused(false);
                        }
                      }}
                      className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs focus:outline-none focus:border-indigo-500 text-zinc-200"
                    />
                    <button
                      onClick={handleAddTag}
                      className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 p-2 rounded-xl border border-zinc-800 text-xs font-semibold"
                    >
                      Add
                    </button>
                  </div>

                  {/* Autocomplete Suggestions Box */}
                  {isTagInputFocused && newTag.trim() && (
                    (() => {
                      const suggestionsList = availableTags.filter(
                        (t) => !selectedFan.customTags.includes(t) && t.toLowerCase().includes(newTag.toLowerCase())
                      );
                      if (suggestionsList.length === 0) return null;
                      return (
                        <div className="absolute left-0 right-0 mt-1 bg-zinc-950 border border-zinc-800 rounded-xl shadow-xl max-h-40 overflow-y-auto z-20 divide-y divide-zinc-900">
                          {suggestionsList.map((suggestion, index) => (
                            <button
                              key={suggestion}
                              type="button"
                              onClick={() => {
                                const updatedTags = [...selectedFan.customTags, suggestion];
                                setSelectedFan({ ...selectedFan, customTags: updatedTags });
                                setNewTag('');
                              }}
                              className={`w-full text-left px-3 py-2 text-xs transition-colors flex items-center justify-between ${
                                index === activeSuggestionIndex
                                  ? 'bg-indigo-600 text-white font-bold'
                                  : 'text-zinc-350 hover:text-white hover:bg-zinc-900'
                              }`}
                            >
                              <span>#{suggestion}</span>
                              <span className={`text-[9px] font-bold uppercase tracking-wider ${
                                index === activeSuggestionIndex ? 'text-indigo-200' : 'text-zinc-600'
                              }`}>
                                existing
                              </span>
                            </button>
                          ))}
                        </div>
                      );
                    })()
                  )}
                </div>
              </div>

              {/* CRM Notes Textarea layout placeholder */}
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Operator Profile Notes</span>
                <textarea
                  placeholder="Enter details like fan characteristics, PPV conversion conversions records..."
                  value={notesText}
                  onChange={(e) => setNotesText(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 h-28 resize-none font-sans"
                />
              </div>
            </div>

            {/* Save notes button */}
            <div className="pt-4 border-t border-zinc-800 mt-6 flex justify-end gap-3">
              <button
                onClick={() => setSelectedFan(null)}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs py-2 px-4 rounded-xl border border-zinc-800 font-semibold"
              >
                Close Profile
              </button>
              <button
                onClick={handleSaveDetails}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? 'Saving...' : 'Save Notes & Tags'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Action Dock */}
      {selectedFanIds.length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-zinc-900/90 border border-zinc-800 hover:border-zinc-700 px-6 py-4 rounded-2xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-8 z-40 text-xs text-white backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300 max-w-xl w-11/12">
          {bulkTagAction ? (
            <div className="flex items-center gap-3 w-full justify-between">
              <span className="font-extrabold text-zinc-350">
                {bulkTagAction === 'add' ? 'Add tag to' : 'Remove tag from'} {selectedFanIds.length} subscribers:
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="tag name..."
                  value={bulkTagText}
                  onChange={(e) => setBulkTagText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleBulkTagSubmit();
                  }}
                  className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 w-32 font-bold"
                />
                <button
                  onClick={handleBulkTagSubmit}
                  disabled={bulkProcessing || !bulkTagText.trim()}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3 py-1.5 rounded-xl disabled:opacity-55"
                >
                  {bulkProcessing ? 'Applying...' : 'Confirm'}
                </button>
                <button
                  onClick={() => {
                    setBulkTagAction(null);
                    setBulkTagText('');
                  }}
                  className="text-zinc-500 hover:text-zinc-300 font-semibold px-2 py-1.5"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="font-extrabold text-zinc-200">{selectedFanIds.length} subscribers selected</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setBulkTagAction('add')}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-3.5 py-2 rounded-xl transition-all"
                >
                  Add Tag
                </button>
                <button
                  onClick={() => setBulkTagAction('remove')}
                  className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 px-3.5 py-2 rounded-xl transition-all font-bold"
                >
                  Remove Tag
                </button>
                <button
                  onClick={() => setBulkMessageModalOpen(true)}
                  className="bg-zinc-850 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 hover:border-zinc-700 px-3.5 py-2 rounded-xl transition-all font-bold"
                >
                  Send Message
                </button>
                
                <div className="w-[1px] h-6 bg-zinc-800 mx-1" />

                <button
                  onClick={() => setSelectedFanIds([])}
                  className="text-zinc-500 hover:text-zinc-300 font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* Bulk Message Modal */}
      {bulkMessageModalOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-sm text-zinc-150 flex items-center gap-2">
                <Send className="h-4 w-4 text-indigo-400" />
                Bulk Message Outreach ({selectedFanIds.length} selected)
              </h3>
              <button
                onClick={() => setBulkMessageModalOpen(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">Message Template</span>
              <textarea
                placeholder="Type your message here. Use {name} to personalize each recipient's name (e.g. Hey {name}!)..."
                value={bulkMessageText}
                onChange={(e) => setBulkMessageText(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 h-32 resize-none font-sans"
              />
              <p className="text-[10px] text-zinc-500 italic font-medium">
                * Dynamic tags supported: <strong className="text-zinc-300">{`{name}`}</strong> will be replaced by the subscriber's display first name.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-zinc-800">
              <button
                onClick={() => setBulkMessageModalOpen(false)}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs py-2 px-4 rounded-xl border border-zinc-800 font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleSendBulkMessage}
                disabled={sendingBulkMessage || !bulkMessageText.trim()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 px-4 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingBulkMessage ? 'Sending...' : 'Dispatch Message'}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Global Tag Manager Modal */}
      {tagManagerOpen && (
        <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="font-extrabold text-sm text-zinc-150 flex items-center gap-2">
                <Tag className="h-4 w-4 text-indigo-400" />
                CRM Tags Library
              </h3>
              <button
                onClick={() => {
                  setTagManagerOpen(false);
                  setRenamingTag(null);
                }}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* List of active tags */}
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {availableTags.length === 0 ? (
                <p className="text-zinc-500 text-xs italic text-center py-8">No custom tags created yet.</p>
              ) : (
                <div className="space-y-2">
                  {availableTags.map((tag) => {
                    const count = fans.filter(f => Array.isArray(f.customTags) && f.customTags.includes(tag)).length;
                    return (
                      <div key={tag} className="flex items-center justify-between bg-zinc-950/40 border border-zinc-800/60 p-2.5 rounded-xl text-xs">
                        {renamingTag === tag ? (
                          <div className="flex items-center gap-2 flex-1 mr-2">
                            <input
                              type="text"
                              value={renameText}
                              onChange={(e) => setRenameText(e.target.value)}
                              className="flex-1 bg-zinc-950 border border-zinc-850 rounded px-2 py-1 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500 font-bold"
                            />
                            <button
                              onClick={() => handleRenameTagConfirm(tag)}
                              className="text-indigo-400 hover:text-indigo-300 font-bold px-2 py-1"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => setRenamingTag(null)}
                              className="text-zinc-550 hover:text-zinc-350 font-semibold px-2 py-1"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="flex items-center gap-2.5">
                              <span className={`px-2.5 py-0.5 rounded border text-[10px] font-bold ${getTagStyles(tag).bg}`}>
                                #{tag}
                              </span>
                              <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider">
                                {count} active in list
                              </span>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => {
                                  setRenamingTag(tag);
                                  setRenameText(tag);
                                }}
                                className="text-zinc-500 hover:text-white p-1"
                                title="Rename tag globally"
                              >
                                <Edit2 className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteTagConfirm(tag)}
                                className="text-zinc-500 hover:text-red-400 p-1"
                                title="Delete tag globally"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-zinc-800">
              <button
                onClick={() => {
                  setTagManagerOpen(false);
                  setRenamingTag(null);
                }}
                className="bg-zinc-850 hover:bg-zinc-800 text-zinc-400 hover:text-white text-xs py-2 px-4 rounded-xl border border-zinc-800 font-semibold"
              >
                Close Library
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
