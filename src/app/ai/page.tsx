'use client';

import React, { useState, useEffect } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { useAIStore } from '@/lib/store/ai-store';
import { AI_TONE_PROFILES, AITone, AISuggestionCategory } from '@/types/ai';
import {
  Sparkles, RefreshCw, Zap, BarChart3, Settings,
  Copy, Check, Trash2, Plus, Save, Edit2, Brain, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES: { id: AISuggestionCategory; label: string; icon: string }[] = [
  { id: 'openers', label: 'Chat Openers', icon: '👋' },
  { id: 'ppv', label: 'PPV Pitches', icon: '💎' },
  { id: 'gratitude', label: 'Gratitude Hooks', icon: '🙏' },
  { id: 'reEngage', label: 'Re-Engagement', icon: '🔄' },
];

export default function AIAssistantPage() {
  const { activeCreator } = useGlobalStore();
  const {
    activeTone,
    setActiveTone,
    activeCategory,
    setActiveCategory,
    autoSuggestEnabled,
    toggleAutoSuggest,
    sessionSuggestionsGenerated,
    sessionSuggestionsUsed,
  } = useAIStore();

  // Custom prompt editor state
  const [customPrompt, setCustomPrompt] = useState('');
  const [promptName, setPromptName] = useState('');
  const [savedPrompts, setSavedPrompts] = useState<{ id: string; name: string; tone: string; prompt: string }[]>([]);
  const [showPromptEditor, setShowPromptEditor] = useState(false);
  const [savingPrompt, setSavingPrompt] = useState(false);

  // Preview state
  const [previewSuggestions, setPreviewSuggestions] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Usage stats (simulated)
  const [usageStats, setUsageStats] = useState({
    totalGenerated: 1247,
    totalUsed: 893,
    usageRate: 71.6,
    topTone: 'flirty' as AITone,
    topCategory: 'openers' as AISuggestionCategory,
    dailyUsage: [
      { date: '2026-06-25', generated: 180, used: 132 },
      { date: '2026-06-26', generated: 195, used: 141 },
      { date: '2026-06-27', generated: 167, used: 119 },
      { date: '2026-06-28', generated: 210, used: 158 },
      { date: '2026-06-29', generated: 203, used: 148 },
      { date: '2026-06-30', generated: 189, used: 135 },
      { date: '2026-07-01', generated: 103 + sessionSuggestionsGenerated, used: 60 + sessionSuggestionsUsed },
    ],
  });

  // Load saved prompts
  useEffect(() => {
    async function loadTemplates() {
      try {
        const res = await fetch('/api/ai/templates');
        if (res.ok) {
          const data = await res.json();
          setSavedPrompts(data.templates || []);
        }
      } catch (err) {
        console.error('Error loading templates:', err);
      }
    }
    loadTemplates();
  }, []);

  async function handlePreviewGeneration() {
    if (!activeCreator) return;
    setLoadingPreview(true);
    try {
      const res = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: activeCreator.id,
          fanId: 'preview-demo',
          tone: activeTone,
          category: activeCategory,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPreviewSuggestions(data.suggestions || []);
      }
    } catch (err) {
      console.error('Error generating preview:', err);
    } finally {
      setLoadingPreview(false);
    }
  }

  async function handleSavePrompt() {
    if (!promptName.trim() || !customPrompt.trim()) return;
    setSavingPrompt(true);
    try {
      const res = await fetch('/api/ai/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: promptName,
          tone: activeTone,
          category: activeCategory,
          promptText: customPrompt,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSavedPrompts((prev) => [...prev, data.template]);
        setPromptName('');
        setCustomPrompt('');
        setShowPromptEditor(false);
      }
    } catch (err) {
      console.error('Error saving prompt:', err);
    } finally {
      setSavingPrompt(false);
    }
  }

  async function handleDeletePrompt(id: string) {
    try {
      const res = await fetch(`/api/ai/templates?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSavedPrompts((prev) => prev.filter((p) => p.id !== id));
      }
    } catch (err) {
      console.error('Error deleting prompt:', err);
    }
  }

  if (!activeCreator) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-purple-500 mb-4" />
        <p className="text-sm font-semibold">Initializing AI Assistant...</p>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100">
              AI <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Assistant</span>
            </h1>
            <p className="text-zinc-500 text-sm mt-0.5">
              Smart reply engine for <strong className="text-zinc-300">@{activeCreator.username}</strong>
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleAutoSuggest}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              autoSuggestEnabled
                ? 'bg-purple-600/20 border border-purple-500/20 text-purple-400'
                : 'bg-zinc-800 border border-zinc-700 text-zinc-400'
            }`}
          >
            <Zap className="h-3.5 w-3.5" />
            Auto-Suggest: {autoSuggestEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700/80 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-15 transition-opacity">
            <Sparkles className="h-16 w-16 text-purple-500" />
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Total Generated</p>
          <h3 className="text-2xl font-bold text-zinc-100 mt-2">{usageStats.totalGenerated.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 mt-1">AI suggestions created</p>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700/80 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-15 transition-opacity">
            <Target className="h-16 w-16 text-blue-500" />
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Suggestions Used</p>
          <h3 className="text-2xl font-bold text-zinc-100 mt-2">{usageStats.totalUsed.toLocaleString()}</h3>
          <p className="text-[10px] text-zinc-400 mt-1">Inserted into chats</p>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700/80 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-15 transition-opacity">
            <BarChart3 className="h-16 w-16 text-emerald-500" />
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Usage Rate</p>
          <h3 className="text-2xl font-bold text-emerald-400 mt-2">{usageStats.usageRate}%</h3>
          <p className="text-[10px] text-zinc-400 mt-1">Suggestions accepted</p>
        </div>

        <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-5 backdrop-blur-sm relative overflow-hidden group hover:border-zinc-700/80 transition-all">
          <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-15 transition-opacity">
            <Brain className="h-16 w-16 text-amber-500" />
          </div>
          <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Session Stats</p>
          <h3 className="text-2xl font-bold text-zinc-100 mt-2">{sessionSuggestionsGenerated}</h3>
          <p className="text-[10px] text-zinc-400 mt-1">{sessionSuggestionsUsed} used this session</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Tone & Category Config + Preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tone Configuration */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Settings className="h-4 w-4 text-purple-500" />
              Tone Profiles
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {AI_TONE_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => setActiveTone(profile.id)}
                  className={`p-4 rounded-xl border transition-all text-left ${
                    activeTone === profile.id
                      ? `${profile.bgColor} ${profile.borderColor} ring-1 ring-offset-1 ring-offset-zinc-950 ring-${profile.id === 'flirty' ? 'pink' : profile.id === 'professional' ? 'blue' : profile.id === 'casual' ? 'emerald' : 'amber'}-500/30`
                      : 'border-zinc-800/60 hover:border-zinc-700/60 bg-zinc-950/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-lg">{profile.icon}</span>
                    <span className={`text-sm font-bold ${activeTone === profile.id ? profile.color : 'text-zinc-300'}`}>
                      {profile.label}
                    </span>
                    {activeTone === profile.id && (
                      <Check className="h-3.5 w-3.5 text-emerald-400 ml-auto" />
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-500">{profile.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Category Selection */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-sm font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Message Categories
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`p-3 rounded-xl border transition-all text-center ${
                    activeCategory === cat.id
                      ? 'bg-blue-600/10 border-blue-500/20 text-blue-400'
                      : 'border-zinc-800/60 text-zinc-400 hover:border-zinc-700/60'
                  }`}
                >
                  <span className="text-xl block mb-1">{cat.icon}</span>
                  <span className="text-xs font-bold">{cat.label}</span>
                </button>
              ))}
            </div>

            {/* Preview Generator */}
            <div className="pt-4 border-t border-zinc-800/60 space-y-3">
              <button
                type="button"
                onClick={handlePreviewGeneration}
                disabled={loadingPreview}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50"
              >
                {loadingPreview ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Generating Preview...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    Preview Suggestions
                  </>
                )}
              </button>

              <AnimatePresence mode="wait">
                {previewSuggestions.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-2"
                  >
                    {previewSuggestions.map((s: any, i: number) => (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="p-3 bg-zinc-950/60 border border-zinc-800/60 rounded-xl"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-xs text-zinc-300 leading-relaxed">{s.text}</p>
                          <span className="text-[9px] text-zinc-600 font-mono whitespace-nowrap">{s.confidence}%</span>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Right: Saved Templates & Daily Usage */}
        <div className="space-y-6">
          {/* Daily Usage Chart */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-emerald-500" />
              Daily Usage (7 Days)
            </h3>
            <div className="space-y-2">
              {usageStats.dailyUsage.map((day) => {
                const maxGen = Math.max(...usageStats.dailyUsage.map((d) => d.generated));
                const pct = (day.generated / maxGen) * 100;
                return (
                  <div key={day.date} className="space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-500 font-medium">
                        {new Date(day.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </span>
                      <span className="text-zinc-400">
                        {day.generated} gen / {day.used} used
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Saved Templates */}
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-2">
                <Edit2 className="h-4 w-4 text-amber-500" />
                Saved Templates
              </h3>
              <button
                type="button"
                onClick={() => setShowPromptEditor(!showPromptEditor)}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-bold hover:bg-zinc-700 transition-colors"
              >
                <Plus className="h-3 w-3" />
                New
              </button>
            </div>

            {/* New Template Editor */}
            <AnimatePresence>
              {showPromptEditor && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-3 border border-zinc-800/60 rounded-xl p-3 bg-zinc-950/40"
                >
                  <input
                    type="text"
                    value={promptName}
                    onChange={(e) => setPromptName(e.target.value)}
                    placeholder="Template name..."
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50"
                  />
                  <textarea
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    placeholder="Write your custom prompt template... Use {name} for fan name placeholder."
                    rows={3}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-purple-500/50 resize-none"
                  />
                  <button
                    type="button"
                    onClick={handleSavePrompt}
                    disabled={savingPrompt || !promptName.trim() || !customPrompt.trim()}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 text-white text-xs font-bold hover:bg-purple-500 transition-colors disabled:opacity-50"
                  >
                    {savingPrompt ? (
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Save className="h-3.5 w-3.5" />
                    )}
                    Save Template
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Template List */}
            {savedPrompts.length === 0 ? (
              <p className="text-xs text-zinc-500 italic py-4 text-center">
                No saved templates yet. Create your first custom prompt above.
              </p>
            ) : (
              <div className="space-y-2 max-h-[300px] overflow-y-auto">
                {savedPrompts.map((prompt) => (
                  <div
                    key={prompt.id}
                    className="p-3 bg-zinc-950/40 border border-zinc-800/60 rounded-xl space-y-1.5 hover:border-zinc-700/60 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-200">{prompt.name}</span>
                      <button
                        type="button"
                        onClick={() => handleDeletePrompt(prompt.id)}
                        className="text-zinc-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 line-clamp-2">{prompt.prompt}</p>
                    <span className="text-[9px] text-zinc-600 uppercase font-bold">{prompt.tone}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
