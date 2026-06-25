'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { AutomationRule } from '@/types';
import { Cpu, Plus, Clock, MessageSquare, RefreshCw, Trash2 } from 'lucide-react';

export default function AutomationsPage() {
  const { activeCreator } = useGlobalStore();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
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
      }
    } catch (err) {
      console.error('Error toggling rule:', err);
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
      }
    } catch (err) {
      console.error('Error deleting rule:', err);
    } finally {
      setDeletingId(null);
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

  async function handleCreateRule(e: React.FormEvent) {
    e.preventDefault();
    if (!newRuleName.trim()) return;

    setSaving(true);

    const conditions: Record<string, any> = {};
    if (newTriggerType === 'new_subscriber') {
      conditions.delayMinutes = Number(delayMinutes);
    } else if (newTriggerType === 'keyword_match') {
      conditions.keywords = keywordsString.split(',').map((k) => k.trim().toLowerCase()).filter(Boolean);
    } else if (newTriggerType === 'idle_fan') {
      conditions.idleHours = Number(idleHours);
    }

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
      }
    } catch (err) {
      console.error('Error creating rule:', err);
    } finally {
      setSaving(false);
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
      {/* Main Grid: Info Banner & Rules Cards */}
      <div className="grid grid-cols-1 gap-6">
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
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                }
              } catch (e) {
                actionPreview = 'Action payload';
              }

              return (
                <div
                  key={rule.id}
                  className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 hover:border-zinc-700/60 transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-zinc-100 flex items-center gap-1.5">
                        {rule.name}
                      </h4>
                      <div className="flex items-center gap-1.5 pt-0.5">
                        <span className="text-[9px] uppercase tracking-wide font-extrabold px-2 py-0.5 rounded-md border bg-indigo-500/10 text-indigo-400 border-indigo-500/20">
                          Trigger: {rule.triggerType}
                        </span>
                        <span className="text-[9px] uppercase tracking-wide font-extrabold px-2 py-0.5 rounded-md border bg-purple-500/10 text-purple-400 border-purple-500/20">
                          Action: {rule.actionType}
                        </span>
                      </div>
                    </div>

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

                  <div className="bg-zinc-950/30 border border-zinc-800/40 p-3 rounded-xl space-y-2 text-xs">
                    <div className="flex items-center gap-1.5 text-zinc-400">
                      <Clock className="h-3.5 w-3.5 text-indigo-400" />
                      <span className="font-semibold text-zinc-300">Condition:</span>
                      <span className="truncate">{conditionDetails}</span>
                    </div>
                    <div className="flex items-start gap-1.5 text-zinc-400">
                      <MessageSquare className="h-3.5 w-3.5 text-purple-400 mt-0.5" />
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <span className="font-semibold text-zinc-300 block">Payload:</span>
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
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Creation Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-xl p-6 relative shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-zinc-200"
            >
              ✕
            </button>
            <h3 className="text-lg font-extrabold text-zinc-100 mb-4">
              Configure Auto-Responder Rule
            </h3>
            <form onSubmit={handleCreateRule} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={newRuleName}
                  onChange={(e) => setNewRuleName(e.target.value)}
                  placeholder="e.g. Welcome Discount Prompt"
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Trigger Event</label>
                  <select
                    value={newTriggerType}
                    onChange={(e) => setNewTriggerType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                  >
                    <option value="new_subscriber">New Subscriber</option>
                    <option value="keyword_match">Keyword Match</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Action Type</label>
                  <select
                    value={newActionType}
                    onChange={(e) => setNewActionType(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-indigo-500 text-white"
                  >
                    <option value="send_message">Send Message</option>
                    <option value="add_tag">Add Tag</option>
                  </select>
                </div>
              </div>
              
              {newTriggerType === 'new_subscriber' && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Delay (Minutes)</label>
                  <input
                    type="number"
                    value={delayMinutes}
                    onChange={(e) => setDelayMinutes(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
              )}

              {newTriggerType === 'keyword_match' && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Keywords (comma separated)</label>
                  <input
                    type="text"
                    value={keywordsString}
                    onChange={(e) => setKeywordsString(e.target.value)}
                    placeholder="e.g. video, photo"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
              )}

              {newActionType === 'send_message' && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Message Text</label>
                  <textarea
                    required
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
              )}

              {newActionType === 'add_tag' && (
                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Tag Name</label>
                  <input
                    type="text"
                    required
                    value={tagName}
                    onChange={(e) => setTagName(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2 text-xs text-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="bg-zinc-800 hover:bg-zinc-750 text-zinc-400 text-xs py-2 px-4 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs py-2 px-4 rounded-xl"
                >
                  Save Rule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
