'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { AutomationRule } from '@/types';
import {
  Cpu,
  ToggleLeft,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Tag,
  Image,
  Clock,
  Sparkles,
  Info,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AutomationsPage() {
  const { activeCreator } = useGlobalStore();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form Modal drawer state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRuleName, setNewRuleName] = useState('');
  const [newTriggerType, setNewTriggerType] = useState<'new_subscriber' | 'keyword_match' | 'idle_fan'>('new_subscriber');
  const [newActionType, setNewActionType] = useState<'send_message' | 'add_tag' | 'send_media'>('send_message');

  // Trigger conditions state
  const [delayMinutes, setDelayMinutes] = useState<number>(5);
  const [keywordsString, setKeywordsString] = useState<string>('');
  const [idleHours, setIdleHours] = useState<number>(24);

  // Action data state
  const [messageText, setMessageText] = useState<string>('');
  const [tagName, setTagName] = useState<string>('');
  const [mediaUrl, setMediaUrl] = useState<string>('');

  useEffect(() => {
    if (activeCreator) {
      loadRules();
    }
  }, [activeCreator]);

  async function loadRules() {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`/api/automations?creatorId=${activeCreator!.id}`);
      if (res.ok) {
        const data = await res.json();
        setRules(data || []);
      } else {
        setErrorMessage('Failed to load automation rules.');
      }
    } catch (err) {
      console.error('Error loading rules:', err);
      setErrorMessage('Network error loading rules.');
    } finally {
      setLoading(false);
    }
  }

  async function handleToggleRule(ruleId: string, currentStatus: boolean) {
    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId, isActive: !currentStatus }),
      });
      if (res.ok) {
        setRules((prev) =>
          prev.map((r) => (r.id === ruleId ? { ...r, isActive: !currentStatus } : r))
        );
        showSuccess('Rule status updated!');
      } else {
        setErrorMessage('Failed to update status.');
      }
    } catch (err) {
      console.error('Error toggling rule:', err);
      setErrorMessage('Error communicating with backend.');
    }
  }

  async function handleDeleteRule(ruleId: string) {
    setDeletingId(ruleId);
    try {
      const res = await fetch(`/api/automations?ruleId=${ruleId}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setRules((prev) => prev.filter((r) => r.id !== ruleId));
        showSuccess('Rule deleted successfully.');
      } else {
        setErrorMessage('Failed to delete rule.');
      }
    } catch (err) {
      console.error('Error deleting rule:', err);
      setErrorMessage('Error communicating with backend.');
    } finally {
      setDeletingId(null);
    }
  }

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!newRuleName.trim()) {
      setErrorMessage('Rule name is required.');
      return;
    }

    setSaving(true);
    setErrorMessage(null);

    // Format conditions
    const conditions: Record<string, any> = {};
    if (newTriggerType === 'new_subscriber') {
      conditions.delayMinutes = Number(delayMinutes);
    } else if (newTriggerType === 'keyword_match') {
      conditions.keywords = keywordsString.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
    } else if (newTriggerType === 'idle_fan') {
      conditions.idleHours = Number(idleHours);
    }

    // Format actionData
    const actionData: Record<string, any> = {};
    if (newActionType === 'send_message') {
      actionData.text = messageText;
    } else if (newActionType === 'add_tag') {
      actionData.tag = tagName;
    } else if (newActionType === 'send_media') {
      actionData.text = messageText;
      actionData.mediaUrl = mediaUrl;
    }

    try {
      const res = await fetch('/api/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator!.id,
          name: newRuleName,
          triggerType: newTriggerType,
          conditions,
          actionType: newActionType,
          actionData,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRules((prev) => [data.rule, ...prev]);
        setIsModalOpen(false);
        resetForm();
        showSuccess('Automation rule created successfully!');
      } else {
        const errorData = await res.json();
        setErrorMessage(errorData.error || 'Failed to create automation rule.');
      }
    } catch (err) {
      console.error('Error creating rule:', err);
      setErrorMessage('Failed to connect to automations API.');
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setNewRuleName('');
    setNewTriggerType('new_subscriber');
    setNewActionType('send_message');
    setDelayMinutes(5);
    setKeywordsString('');
    setIdleHours(24);
    setMessageText('');
    setTagName('');
    setMediaUrl('');
  }

  function showSuccess(msg: string) {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  }

  // Derived statistics metrics
  const activeRulesCount = rules.filter((r) => r.isActive).length;
  const triggerStats = {
    newSub: rules.filter((r) => r.triggerType === 'new_subscriber').length,
    keyword: rules.filter((r) => r.triggerType === 'keyword_match').length,
    idle: rules.filter((r) => r.triggerType === 'idle_fan').length,
  };

  if (!activeCreator) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm font-semibold">Loading Agency Context...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      
      {/* Notifications Alert Toast */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-md"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span className="font-semibold">{successMessage}</span>
          </motion.div>
        )}
        {errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-400 text-xs px-4 py-2.5 rounded-xl shadow-lg backdrop-blur-md"
          >
            <AlertTriangle className="h-4 w-4" />
            <span className="font-semibold">{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="ml-2 hover:text-red-300">
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

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
          onClick={() => setIsModalOpen(true)}
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
          <p className="text-[9px] text-zinc-400 mt-1 flex items-center gap-1">
            Registered templates
          </p>
        </div>
        
        {/* Active Rules */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active Triggers</p>
          <h3 className="text-2xl font-black text-emerald-400 mt-2">{activeRulesCount}</h3>
          <p className="text-[9px] text-zinc-400 mt-1 flex items-center gap-1">
            Live auto-responders
          </p>
        </div>

        {/* Welcome triggers stats */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Welcome Triggers</p>
          <h3 className="text-2xl font-black text-indigo-400 mt-2">{triggerStats.newSub}</h3>
          <p className="text-[9px] text-zinc-400 mt-1">
            New subscriber filters
          </p>
        </div>

        {/* Keyword responders stats */}
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm hover:border-zinc-700/50 transition-all">
          <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Keyword Matches</p>
          <h3 className="text-2xl font-black text-blue-400 mt-2">{triggerStats.keyword}</h3>
          <p className="text-[9px] text-zinc-400 mt-1">
            Auto-replies in chat
          </p>
        </div>
      </div>

      {/* Main Grid: Info Banner & Rules Cards */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Rules Explorer Header / Actions */}
        <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-4 flex items-start gap-3 text-zinc-400 text-xs">
          <Info className="h-5 w-5 text-indigo-400 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-zinc-300">How Automations Work:</span>
            <p>
              Auto-responders monitor messaging streams and onboarding events via third-party webhooks. 
              Once trigger conditions match, target actions execute automatically (e.g. sending a lock message or applying fans tags). 
              Keep keys/words localized to avoid collision with manual operators.
            </p>
          </div>
        </div>

        {/* Rules Cards Container */}
        {loading ? (
          <div className="py-20 text-center text-zinc-500 text-sm flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
            <span>Loading configured creator rules...</span>
          </div>
        ) : rules.length === 0 ? (
          <div className="py-24 border border-dashed border-zinc-800 rounded-2xl text-center flex flex-col items-center justify-center space-y-4">
            <div className="h-12 w-12 rounded-2xl bg-zinc-900/60 border border-zinc-800 flex items-center justify-center text-zinc-600">
              <Cpu className="h-6 w-6" />
            </div>
            <div className="space-y-1 max-w-sm">
              <h3 className="text-sm font-semibold text-zinc-300">No automation rules configured</h3>
              <p className="text-xs text-zinc-500">
                You haven't setup any autoresponders, welcome triggers, or filters for @{activeCreator.username} yet.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-zinc-900 hover:bg-zinc-850 border border-zinc-850 text-zinc-300 text-xs font-semibold py-2 px-4 rounded-xl transition-all"
            >
              Configure First Rule
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {rules.map((rule) => {
                let conditionDetails = '';
                try {
                  const cond = typeof rule.conditions === 'string' ? JSON.parse(rule.conditions) : rule.conditions;
                  if (rule.triggerType === 'new_subscriber') {
                    conditionDetails = cond.delayMinutes 
                      ? `Fires ${cond.delayMinutes} minutes after subscribe` 
                      : 'Fires instantly on subscribe';
                  } else if (rule.triggerType === 'keyword_match') {
                    conditionDetails = cond.keywords 
                      ? `Matches keywords: ${cond.keywords.map((k: string) => `"${k}"`).join(', ')}` 
                      : 'Matches keywords';
                  } else if (rule.triggerType === 'idle_fan') {
                    conditionDetails = cond.idleHours 
                      ? `Fires when fan is inactive for ${cond.idleHours} hours` 
                      : 'Fires when fan is idle';
                  }
                } catch (e) {
                  conditionDetails = 'Conditions defined';
                }

                let actionPreview = '';
                try {
                  const act = typeof rule.actionData === 'string' ? JSON.parse(rule.actionData) : rule.actionData;
                  if (rule.actionType === 'send_message') {
                    actionPreview = act.text || 'Send custom text';
                  } else if (rule.actionType === 'add_tag') {
                    actionPreview = `Apply custom badge tag: "${act.tag}"`;
                  } else if (rule.actionType === 'send_media') {
                    actionPreview = act.text ? `"${act.text}" + media item` : 'Send media file attachment';
                  }
                } catch (e) {
                  actionPreview = 'Action payload';
                }

                return (
                  <motion.div
                    key={rule.id}
                    layout
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700/60 transition-all flex flex-col justify-between space-y-4"
                  >
                    {/* Top: Header & Toggle Switch */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                          {rule.name}
                        </h4>
                        <div className="flex items-center gap-1.5 pt-0.5">
                          {/* Trigger badge */}
                          <span className={`text-[9px] uppercase tracking-wide font-extrabold px-2 py-0.5 rounded-md border ${
                            rule.triggerType === 'new_subscriber'
                              ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
                              : rule.triggerType === 'keyword_match'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          }`}>
                            Trigger: {rule.triggerType.replace('_', ' ')}
                          </span>

                          {/* Action badge */}
                          <span className={`text-[9px] uppercase tracking-wide font-extrabold px-2 py-0.5 rounded-md border ${
                            rule.actionType === 'send_message'
                              ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                              : rule.actionType === 'add_tag'
                              ? 'bg-pink-500/10 text-pink-400 border-pink-500/20'
                              : 'bg-teal-500/10 text-teal-400 border-teal-500/20'
                          }`}>
                            Action: {rule.actionType.replace('_', ' ')}
                          </span>
                        </div>
                      </div>

                      {/* Toggle status control */}
                      <button
                        type="button"
                        onClick={() => handleToggleRule(rule.id, rule.isActive)}
                        className={`w-9 h-5 rounded-full relative transition-colors duration-200 flex-shrink-0 flex items-center ${
                          rule.isActive ? 'bg-indigo-600' : 'bg-zinc-800 border border-zinc-700'
                        }`}
                      >
                        <span className={`block w-3.5 h-3.5 rounded-full bg-white absolute transition-all duration-200 ${
                          rule.isActive ? 'translate-x-4.5' : 'translate-x-0.5'
                        }`} />
                      </button>
                    </div>

                    {/* Middle: Triggers conditions summary */}
                    <div className="bg-zinc-950/30 border border-zinc-800/40 p-3 rounded-xl space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 text-zinc-400">
                        <Clock className="h-3.5 w-3.5 text-indigo-400" />
                        <span className="font-semibold text-zinc-300">Condition:</span>
                        <span className="truncate">{conditionDetails}</span>
                      </div>
                      <div className="flex items-start gap-1.5 text-zinc-400">
                        {rule.actionType === 'send_message' ? (
                          <MessageSquare className="h-3.5 w-3.5 text-purple-400 mt-0.5" />
                        ) : rule.actionType === 'add_tag' ? (
                          <Tag className="h-3.5 w-3.5 text-pink-400 mt-0.5" />
                        ) : (
                          <Image className="h-3.5 w-3.5 text-teal-400 mt-0.5" />
                        )}
                        <div className="space-y-0.5 flex-1 min-w-0">
                          <span className="font-semibold text-zinc-300 block">Payload Template:</span>
                          <p className="text-zinc-400 italic line-clamp-2 leading-relaxed">
                            {actionPreview}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Bottom: Action buttons (Delete) */}
                    <div className="flex items-center justify-between border-t border-zinc-800/60 pt-3">
                      <span className="text-[10px] text-zinc-500">
                        Created on {new Date(rule.createdAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleDeleteRule(rule.id)}
                        disabled={deletingId === rule.id}
                        className="text-zinc-500 hover:text-red-400 hover:bg-red-500/10 p-1.5 rounded-lg transition-colors flex items-center gap-1 disabled:opacity-50"
                      >
                        {deletingId === rule.id ? (
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Trash2 className="h-3.5 w-3.5" />
                        )}
                        <span className="text-[10px] font-bold">Remove</span>
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Drawer Overlay Modal to Create Rule */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Modal backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Content container */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl p-6 md:p-8 relative shadow-2xl z-10 max-h-[90vh] overflow-y-auto"
            >
              {/* Close Button */}
              <button
                onClick={() => setIsModalOpen(false)}
                className="absolute top-4 right-4 p-2 text-zinc-500 hover:text-zinc-200 transition-colors rounded-lg"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Form Title */}
              <div className="space-y-1 mb-6">
                <h3 className="text-lg md:text-xl font-extrabold text-zinc-100 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-400" />
                  Configure Auto-Responder Rule
                </h3>
                <p className="text-xs text-zinc-400">
                  Set trigger thresholds, filters, and template responses for @{activeCreator.username}.
                </p>
              </div>

              {/* Creation Form */}
              <form onSubmit={handleCreateRule} className="space-y-5">
                
                {/* Rule Name */}
                <div className="space-y-1.5">
                  <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                    Rule Name
                  </label>
                  <input
                    type="text"
                    required
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    placeholder="e.g. Welcome Discount Prompt"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>

                {/* Grid Inputs: Trigger Type & Action Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Select Trigger Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                      Event Trigger
                    </label>
                    <select
                      value={newTriggerType}
                      onChange={(e) => setNewTriggerType(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="new_subscriber">New Subscriber Event</option>
                      <option value="keyword_match">Keyword Match in Chat</option>
                      <option value="idle_fan">Idle Fan Time threshold</option>
                    </select>
                  </div>

                  {/* Select Action Type */}
                  <div className="space-y-1.5">
                    <label className="text-xs text-zinc-400 font-bold uppercase tracking-wider">
                      Execution Action
                    </label>
                    <select
                      value={newActionType}
                      onChange={(e) => setNewActionType(e.target.value as any)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="send_message">Send Text Message</option>
                      <option value="add_tag">Add CRM Custom Tag</option>
                      <option value="send_media">Send PPV Media Attachment</option>
                    </select>
                  </div>
                </div>

                {/* Conditional Fields based on Trigger Selection */}
                <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl space-y-4">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                    Trigger Conditions Configure
                  </span>

                  {newTriggerType === 'new_subscriber' && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400 font-medium">
                        Delay Interval (Minutes)
                      </label>
                      <input
                        type="number"
                        min={0}
                        required
                        value={delayMinutes}
                        onChange={(e) => setDelayMinutes(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <span className="text-[10px] text-zinc-500 italic block mt-1">
                        Use 0 for instant responder, or enter delay (e.g. 5 minutes) to feel more authentic.
                      </span>
                    </div>
                  )}

                  {newTriggerType === 'keyword_match' && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400 font-medium">
                        Trigger Keywords (Comma separated)
                      </label>
                      <input
                        type="text"
                        required
                        value={keywordsString}
                        onChange={(e) => setKeywordsString(e.target.value)}
                        placeholder="e.g. tip, sent, unlocked, video"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <span className="text-[10px] text-zinc-500 italic block mt-1">
                        Case-insensitive. Commas split multiple keyword triggers.
                      </span>
                    </div>
                  )}

                  {newTriggerType === 'idle_fan' && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400 font-medium">
                        Idle Duration Threshold (Hours)
                      </label>
                      <input
                        type="number"
                        min={1}
                        required
                        value={idleHours}
                        onChange={(e) => setIdleHours(Number(e.target.value))}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                      <span className="text-[10px] text-zinc-500 italic block mt-1">
                        Fires to re-engage fans when they haven't messaged back for this many hours.
                      </span>
                    </div>
                  )}
                </div>

                {/* Conditional Fields based on Action Selection */}
                <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-2xl space-y-4">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider block">
                    Action Output Configure
                  </span>

                  {(newActionType === 'send_message' || newActionType === 'send_media') && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400 font-medium">
                        Text Message Template
                      </label>
                      <textarea
                        required
                        rows={3}
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        placeholder="Hey babe! Thank you so much for subscribing... ❤️"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  )}

                  {newActionType === 'add_tag' && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400 font-medium">
                        Tag Badge Label to apply
                      </label>
                      <input
                        type="text"
                        required
                        value={tagName}
                        onChange={(e) => setTagName(e.target.value)}
                        placeholder="e.g. vip-whale"
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  )}

                  {newActionType === 'send_media' && (
                    <div className="space-y-1.5">
                      <label className="text-xs text-zinc-400 font-medium">
                        Media Asset URL (Direct attachment)
                      </label>
                      <input
                        type="url"
                        required
                        value={mediaUrl}
                        onChange={(e) => setMediaUrl(e.target.value)}
                        placeholder="https://images.unsplash.com/photo-..."
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                      />
                    </div>
                  )}
                </div>

                {/* Form Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800/60">
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      resetForm();
                    }}
                    className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-xs font-bold py-2.5 px-5 rounded-xl transition-all"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-5 rounded-xl transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                    Save Automation Rule
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}

// Verified: Day 28 automations features stability compile build complete.
