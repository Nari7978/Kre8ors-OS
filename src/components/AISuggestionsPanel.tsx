'use client';

import React, { useState } from 'react';
import { Sparkles, Copy, ArrowRight, RefreshCw, X, ChevronDown, Zap } from 'lucide-react';
import { useAIStore } from '@/lib/store/ai-store';
import { AI_TONE_PROFILES, AISuggestionCategory } from '@/types/ai';
import { motion, AnimatePresence } from 'framer-motion';

interface AISuggestionsPanelProps {
  creatorId: string;
  fanId: string;
  onInsertSuggestion: (text: string) => void;
}

const CATEGORIES: { id: AISuggestionCategory; label: string; icon: string }[] = [
  { id: 'openers', label: 'Openers', icon: '👋' },
  { id: 'ppv', label: 'PPV Pitch', icon: '💎' },
  { id: 'gratitude', label: 'Gratitude', icon: '🙏' },
  { id: 'reEngage', label: 'Re-Engage', icon: '🔄' },
];

export default function AISuggestionsPanel({ creatorId, fanId, onInsertSuggestion }: AISuggestionsPanelProps) {
  const {
    activeTone,
    setActiveTone,
    activeCategory,
    setActiveCategory,
    currentSuggestions,
    setCurrentSuggestions,
    isPanelOpen,
    togglePanel,
    isGenerating,
    setIsGenerating,
    incrementGenerated,
    incrementUsed,
  } = useAIStore();

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showToneSelector, setShowToneSelector] = useState(false);

  const activeToneProfile = AI_TONE_PROFILES.find((p) => p.id === activeTone) || AI_TONE_PROFILES[0];

  async function generateSuggestions() {
    setIsGenerating(true);
    try {
      const res = await fetch('/api/ai/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId,
          fanId,
          tone: activeTone,
          category: activeCategory,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCurrentSuggestions(data.suggestions);
        incrementGenerated();
      }
    } catch (err) {
      console.error('Error generating AI suggestions:', err);
    } finally {
      setIsGenerating(false);
    }
  }

  function handleInsert(text: string) {
    onInsertSuggestion(text);
    incrementUsed();
  }

  function handleCopy(id: string, text: string) {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  }

  if (!isPanelOpen) {
    return (
      <button
        type="button"
        onClick={togglePanel}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-600/20 to-blue-600/20 border border-purple-500/20 text-purple-400 text-xs font-bold hover:from-purple-600/30 hover:to-blue-600/30 transition-all"
      >
        <Sparkles className="h-3.5 w-3.5" />
        AI Assist
      </button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-zinc-900/95 border border-zinc-700/60 rounded-2xl p-4 space-y-3 backdrop-blur-xl shadow-2xl shadow-purple-500/5"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
            <Sparkles className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-xs font-bold text-zinc-200">AI Smart Reply</span>
        </div>
        <button
          type="button"
          onClick={togglePanel}
          className="text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Tone Selector */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowToneSelector(!showToneSelector)}
          className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border ${activeToneProfile.borderColor} ${activeToneProfile.bgColor} text-xs font-semibold transition-all`}
        >
          <span className="flex items-center gap-2">
            <span>{activeToneProfile.icon}</span>
            <span className={activeToneProfile.color}>{activeToneProfile.label} Tone</span>
          </span>
          <ChevronDown className={`h-3.5 w-3.5 text-zinc-400 transition-transform ${showToneSelector ? 'rotate-180' : ''}`} />
        </button>

        <AnimatePresence>
          {showToneSelector && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              className="absolute top-full left-0 right-0 mt-1 bg-zinc-900 border border-zinc-700/60 rounded-lg overflow-hidden z-10 shadow-xl"
            >
              {AI_TONE_PROFILES.map((profile) => (
                <button
                  key={profile.id}
                  type="button"
                  onClick={() => {
                    setActiveTone(profile.id);
                    setShowToneSelector(false);
                  }}
                  className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-medium hover:bg-zinc-800 transition-colors ${
                    activeTone === profile.id ? `${profile.bgColor} ${profile.color}` : 'text-zinc-400'
                  }`}
                >
                  <span>{profile.icon}</span>
                  <div className="text-left">
                    <span className="block font-semibold">{profile.label}</span>
                    <span className="block text-[10px] text-zinc-500">{profile.description}</span>
                  </div>
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
              activeCategory === cat.id
                ? 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
            }`}
          >
            <span>{cat.icon}</span>
            <span>{cat.label}</span>
          </button>
        ))}
      </div>

      {/* Generate Button */}
      <button
        type="button"
        onClick={generateSuggestions}
        disabled={isGenerating}
        className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-blue-600 text-white text-xs font-bold hover:from-purple-500 hover:to-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isGenerating ? (
          <>
            <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Zap className="h-3.5 w-3.5" />
            Generate Replies
          </>
        )}
      </button>

      {/* Suggestions List */}
      <AnimatePresence mode="wait">
        {currentSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-2"
          >
            {currentSuggestions.map((suggestion, index) => (
              <motion.div
                key={suggestion.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="group bg-zinc-950/60 border border-zinc-800/60 rounded-xl p-3 space-y-2 hover:border-zinc-700/60 transition-all"
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs text-zinc-300 leading-relaxed flex-1">{suggestion.text}</p>
                  <span className="text-[9px] text-zinc-600 font-mono whitespace-nowrap mt-0.5">
                    {suggestion.confidence}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleInsert(suggestion.text)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-blue-600/20 border border-blue-500/20 text-blue-400 text-[10px] font-bold hover:bg-blue-600/30 transition-colors"
                  >
                    <ArrowRight className="h-3 w-3" />
                    Insert
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(suggestion.id, suggestion.text)}
                    className="flex items-center gap-1 px-2 py-1 rounded bg-zinc-800 border border-zinc-700 text-zinc-400 text-[10px] font-bold hover:bg-zinc-700 transition-colors"
                  >
                    <Copy className="h-3 w-3" />
                    {copiedId === suggestion.id ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
