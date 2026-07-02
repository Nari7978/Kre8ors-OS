'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { PpvTemplate, PpvPricingRule, MediaItem } from '@/types';
import {
  Sparkles,
  Lock,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  MessageSquare,
  Tag,
  Image as ImageIcon,
  Clock,
  Info,
  X,
  Play,
  HelpCircle,
  Eye,
  Settings,
  DollarSign,
  Layers,
  Video,
  ChevronRight,
  ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

export default function PpvBuilderPage() {
  const { activeCreator } = useGlobalStore();
  const [templates, setTemplates] = useState<PpvTemplate[]>([]);
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  
  // Notification Toast state
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State for Active Template
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('20.00');
  const [lockType, setLockType] = useState<'single' | 'bundle' | 'preview'>('single');
  const [previewSeconds, setPreviewSeconds] = useState(5);
  const [messageText, setMessageText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<string[]>([]);
  const [pricingRules, setPricingRules] = useState<PpvPricingRule[]>([]);

  // Simulation State for Live Preview
  const [simulatedFanSpend, setSimulatedFanSpend] = useState<number>(150);
  const [simulatedFanTags, setSimulatedFanTags] = useState<string>('vip, active');

  // Input ref to support variables insertion at cursor
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (activeCreator) {
      loadTemplates();
      loadMedia();
      resetForm();
    }
  }, [activeCreator]);

  const showSuccess = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setTimeout(() => setErrorMessage(null), 4000);
  };

  const loadTemplates = async () => {
    if (!activeCreator) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/messages/ppv-templates?creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        setTemplates(data || []);
      } else {
        showError('Failed to load PPV templates.');
      }
    } catch (err) {
      console.error(err);
      showError('Network error loading templates.');
    } finally {
      setLoading(false);
    }
  };

  const loadMedia = async () => {
    if (!activeCreator) return;
    setLoadingMedia(true);
    try {
      const res = await fetch(`/api/media?creatorId=${activeCreator.id}`);
      if (res.ok) {
        const data = await res.json();
        setMediaItems(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingMedia(false);
    }
  };

  const resetForm = () => {
    setSelectedTemplateId(null);
    setName('');
    setDescription('');
    setPrice('20.00');
    setLockType('single');
    setPreviewSeconds(5);
    setMessageText('');
    setAttachedMedia([]);
    setPricingRules([]);
  };

  const handleSelectTemplate = (tpl: PpvTemplate) => {
    setSelectedTemplateId(tpl.id);
    setName(tpl.name);
    setDescription(tpl.description || '');
    setPrice(Number(tpl.price).toFixed(2));
    setLockType(tpl.lockType);
    setPreviewSeconds(tpl.previewSeconds || 5);
    setMessageText(tpl.messageText);
    
    // Parse JSON lists safely
    try {
      const media = typeof tpl.mediaUrls === 'string' ? JSON.parse(tpl.mediaUrls) : tpl.mediaUrls;
      setAttachedMedia(media || []);
    } catch (e) {
      setAttachedMedia([]);
    }
    
    try {
      const rules = typeof tpl.pricingRules === 'string' ? JSON.parse(tpl.pricingRules) : tpl.pricingRules;
      setPricingRules(rules || []);
    } catch (e) {
      setPricingRules([]);
    }
  };

  const handleInsertVariable = (variable: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const startPos = textarea.selectionStart;
    const endPos = textarea.selectionEnd;
    const beforeText = messageText.substring(0, startPos);
    const afterText = messageText.substring(endPos, messageText.length);
    
    const newText = beforeText + variable + afterText;
    setMessageText(newText);
    
    // Reset focus and cursor position after render
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = startPos + variable.length;
      textarea.selectionEnd = startPos + variable.length;
    }, 10);
  };

  const handleToggleMedia = (url: string) => {
    setAttachedMedia((prev) =>
      prev.includes(url) ? prev.filter((item) => item !== url) : [...prev, url]
    );
  };

  const handleAddPricingRule = (type: 'spend_tier' | 'tag_discount') => {
    const newRule: PpvPricingRule =
      type === 'spend_tier'
        ? { ruleType: 'spend_tier', minSpend: 100, priceOverride: 15.00 }
        : { ruleType: 'tag_discount', tag: 'vip', discountPercent: 20 };
    setPricingRules((prev) => [...prev, newRule]);
  };

  const handleRemovePricingRule = (index: number) => {
    setPricingRules((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateRule = (index: number, fields: Partial<PpvPricingRule>) => {
    setPricingRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, ...fields } : r))
    );
  };

  // Save (Create or Update) handler
  const handleSaveTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCreator) return;
    if (!name.trim()) {
      showError('Template Name is required.');
      return;
    }

    setSaving(true);
    try {
      const res = await fetch('/api/messages/ppv-templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId: selectedTemplateId || undefined,
          creatorId: activeCreator.id,
          name,
          description,
          price: parseFloat(price) || 0,
          lockType,
          previewSeconds: Number(previewSeconds) || 0,
          messageText,
          mediaUrls: attachedMedia,
          pricingRules,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        showSuccess(selectedTemplateId ? 'Template updated successfully!' : 'Template created successfully!');
        resetForm();
        loadTemplates();
      } else {
        const errData = await res.json();
        showError(errData.error || 'Failed to save template.');
      }
    } catch (err) {
      console.error(err);
      showError('Error connecting to backend.');
    } finally {
      setSaving(false);
    }
  };

  // Delete handler
  const handleDeleteTemplate = async (id: string) => {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/messages/ppv-templates?templateId=${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showSuccess('Template deleted successfully.');
        if (selectedTemplateId === id) {
          resetForm();
        }
        loadTemplates();
      } else {
        showError('Failed to delete template.');
      }
    } catch (err) {
      console.error(err);
      showError('Error connecting to backend.');
    } finally {
      setDeletingId(null);
    }
  };

  // Helper: Calculate final price based on rules and simulated subscriber state
  const calculateFinalPrice = () => {
    const baseVal = parseFloat(price) || 0;
    let finalVal = baseVal;
    
    // Find tags
    const tagsList = simulatedFanTags
      .split(',')
      .map((t) => t.trim().toLowerCase())
      .filter(Boolean);

    pricingRules.forEach((rule) => {
      if (rule.ruleType === 'spend_tier' && rule.minSpend !== undefined && rule.priceOverride !== undefined) {
        if (simulatedFanSpend >= rule.minSpend) {
          // Spend overrides are applied if it results in a lower price
          finalVal = Math.min(finalVal, rule.priceOverride);
        }
      }
      if (rule.ruleType === 'tag_discount' && rule.tag && rule.discountPercent !== undefined) {
        if (tagsList.includes(rule.tag.toLowerCase())) {
          finalVal = finalVal * (1 - rule.discountPercent / 100);
        }
      }
    });

    return Math.max(0, finalVal);
  };

  // Helper: Format message variables for display in preview bubble
  const getRenderedPreviewText = () => {
    if (!messageText) return 'No message text composed.';
    return messageText
      .replace(/\{\{fanName\}\}/g, 'John Rich')
      .replace(/\{\{creatorName\}\}/g, activeCreator?.displayName || 'Sophia Sweet')
      .replace(/\{\{price\}\}/g, `$${calculateFinalPrice().toFixed(2)}`);
  };

  if (!activeCreator) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-zinc-950 text-zinc-400 p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-500 mb-4" />
        <p className="text-sm font-semibold">Loading Agency Context...</p>
      </div>
    );
  }

  const finalCalculatedPrice = calculateFinalPrice();

  return (
    <div className="flex-1 overflow-y-auto bg-zinc-950 p-6 md:p-8 text-white space-y-8 max-w-7xl mx-auto w-full">
      {/* Toast System Alert */}
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

      {/* Header and Back Link */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800/60 pb-6">
        <div>
          <Link href="/messages" className="text-zinc-500 hover:text-zinc-300 text-xs font-semibold flex items-center gap-1 mb-2">
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Chats
          </Link>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
            <Lock className="h-7 w-7 text-amber-500 animate-pulse" />
            PPV Lock Config Form Builder
          </h1>
          <p className="text-zinc-500 text-sm mt-1">
            Build, optimize, and rule-configure locked PPV campaigns for <strong className="text-zinc-300">@{activeCreator.username}</strong>
          </p>
        </div>
        <button
          onClick={resetForm}
          className="bg-zinc-900 border border-zinc-850 hover:border-zinc-700 text-zinc-300 hover:text-white text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md flex items-center justify-center gap-1.5 self-start md:self-auto"
        >
          <Plus className="h-4 w-4" />
          Create New Preset
        </button>
      </div>

      {/* Main workspace layout: Templates left, Builder middle, Preview right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column: Preset list templates */}
        <div className="lg:col-span-3 space-y-4">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-4 backdrop-blur-sm space-y-3">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-400" />
              Saved presets
            </h3>
            
            {loading ? (
              <div className="py-8 text-center text-zinc-500 text-xs flex items-center justify-center gap-2">
                <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                Syncing templates...
              </div>
            ) : templates.length === 0 ? (
              <p className="text-xs text-zinc-650 italic py-4 text-center">No presets saved yet.</p>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                {templates.map((tpl) => (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl)}
                    className={`group w-full text-left p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start justify-between gap-2 ${
                      selectedTemplateId === tpl.id
                        ? 'border-indigo-500 bg-indigo-500/10'
                        : 'border-zinc-850 hover:border-zinc-800 bg-zinc-950/40 hover:bg-zinc-950/80'
                    }`}
                  >
                    <div className="space-y-1 truncate flex-1">
                      <h4 className="font-bold text-zinc-250 group-hover:text-white truncate flex items-center gap-1">
                        {tpl.name}
                        <span className="text-[10px] text-amber-400 font-mono">${Number(tpl.price).toFixed(2)}</span>
                      </h4>
                      {tpl.description && (
                        <p className="text-[10px] text-zinc-500 truncate leading-normal">{tpl.description}</p>
                      )}
                    </div>
                    
                    <button
                      type="button"
                      disabled={deletingId === tpl.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteTemplate(tpl.id);
                      }}
                      className="text-zinc-600 hover:text-red-400 p-1 rounded hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {deletingId === tpl.id ? (
                        <RefreshCw className="h-3 w-3 animate-spin" />
                      ) : (
                        <Trash2 className="h-3 w-3" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Middle Column: Form Configuration Builder */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleSaveTemplate} className="space-y-6 bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <h3 className="text-xs font-bold text-zinc-350 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
              <Settings className="h-4 w-4 text-indigo-400" />
              Configuration Parameters
            </h3>

            {/* Template Name & Description */}
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Preset Campaign Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. VIP Bathroom Shower Clip"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Internal Description / Memo</label>
                <input
                  type="text"
                  placeholder="e.g. Only send to fans with high LTV who tip regularly"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>
            </div>

            {/* Pricing and Lock Types */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Base Lock Price ($)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-xs text-zinc-500 font-semibold">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    placeholder="20.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-850 rounded-xl py-2.5 pl-7 pr-4 text-xs text-amber-300 font-bold focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">PPV Lock Structure</label>
                <select
                  value={lockType}
                  onChange={(e) => setLockType(e.target.value as any)}
                  className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-zinc-200 font-semibold focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="single">Single Unlock Lock</option>
                  <option value="bundle">Multi-Asset Bundle Deal</option>
                  <option value="preview">Timed Video Preview Lock</option>
                </select>
              </div>
            </div>

            {/* Timed Preview Option */}
            {lockType === 'preview' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-1.5 bg-zinc-950/40 p-4 border border-zinc-850 rounded-xl"
              >
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Free Preview Duration (Seconds)</label>
                <div className="flex items-center gap-3">
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={previewSeconds}
                    onChange={(e) => setPreviewSeconds(Number(e.target.value))}
                    className="w-24 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 font-bold text-center"
                  />
                  <span className="text-[10px] text-zinc-500">Allows fans to watch first {previewSeconds}s before padlock triggers.</span>
                </div>
              </motion.div>
            )}

            {/* Attach Media Vault Files */}
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span>Select Media Vault Assets ({attachedMedia.length} attached)</span>
                <span className="text-[9px] text-zinc-500 font-normal normal-case">Referencing from creator media bank</span>
              </label>

              {loadingMedia ? (
                <div className="py-6 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-indigo-500" />
                  Loading Media Vault...
                </div>
              ) : mediaItems.length === 0 ? (
                <div className="p-4 border border-dashed border-zinc-800 text-center text-xs text-zinc-650 rounded-xl">
                  Vault is empty. Upload items in the Media Vault tab first.
                </div>
              ) : (
                <div className="grid grid-cols-4 gap-2 max-h-[140px] overflow-y-auto border border-zinc-850 p-2 rounded-xl bg-zinc-950/30">
                  {mediaItems.map((item) => {
                    const isSelected = attachedMedia.includes(item.url);
                    return (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => handleToggleMedia(item.url)}
                        className={`relative rounded-lg overflow-hidden border p-0.5 text-left flex flex-col transition-all aspect-square ${
                          isSelected
                            ? 'border-indigo-500 ring-1 ring-indigo-500'
                            : 'border-zinc-800 hover:border-zinc-700 bg-zinc-900'
                        }`}
                      >
                        {item.fileType === 'video' ? (
                          <div className="relative h-full w-full bg-zinc-950 flex items-center justify-center">
                            <img src={item.thumbnail || ''} alt="" className="absolute inset-0 h-full w-full object-cover opacity-60" />
                            <Video className="h-4 w-4 text-zinc-300 absolute z-10" />
                          </div>
                        ) : (
                          <img src={item.url} alt="" className="h-full w-full object-cover" />
                        )}
                        
                        {isSelected && (
                          <div className="absolute top-1 right-1 h-3.5 w-3.5 bg-indigo-500 text-[9px] font-black text-white rounded-full flex items-center justify-center shadow">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Message Body Composer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">Locked Message Text Copy</label>
                
                {/* Insertion shortcuts */}
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleInsertVariable('{{fanName}}')}
                    className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-350 hover:text-white border border-zinc-750 transition-colors"
                  >
                    + Fan Name
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertVariable('{{creatorName}}')}
                    className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-350 hover:text-white border border-zinc-750 transition-colors"
                  >
                    + Creator Name
                  </button>
                  <button
                    type="button"
                    onClick={() => handleInsertVariable('{{price}}')}
                    className="text-[9px] font-extrabold uppercase px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-350 hover:text-white border border-zinc-750 transition-colors"
                  >
                    + Price
                  </button>
                </div>
              </div>

              <textarea
                ref={textareaRef}
                required
                rows={4}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                placeholder="Compose the teaser message copy bby... Use variables like {{fanName}} to personalize the message locks. ❤️"
                className="w-full bg-zinc-950 border border-zinc-850 rounded-xl px-3.5 py-2.5 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
              />
            </div>

            {/* Dynamic Custom Rules Engine */}
            <div className="space-y-3.5 border-t border-zinc-800/60 pt-4">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5 text-amber-500" />
                  Dynamic Conditional Pricing Splits
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => handleAddPricingRule('spend_tier')}
                    className="text-[9px] font-bold bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 py-1 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    + Spend Rule
                  </button>
                  <button
                    type="button"
                    onClick={() => handleAddPricingRule('tag_discount')}
                    className="text-[9px] font-bold bg-zinc-950 border border-zinc-800 hover:border-zinc-700 text-zinc-300 py-1 px-2.5 rounded-lg flex items-center gap-1 cursor-pointer"
                  >
                    + Tag Discount
                  </button>
                </div>
              </div>

              {pricingRules.length === 0 ? (
                <p className="text-[10px] text-zinc-550 italic bg-zinc-950/20 p-3.5 rounded-xl border border-zinc-850/60">
                  No dynamic pricing rules configured. Locked message will sell at the base lock price flat.
                </p>
              ) : (
                <div className="space-y-2">
                  {pricingRules.map((rule, idx) => (
                    <div
                      key={idx}
                      className="bg-zinc-950/50 border border-zinc-850 p-3 rounded-xl flex items-center justify-between gap-3 text-xs"
                    >
                      {rule.ruleType === 'spend_tier' ? (
                        <div className="flex items-center flex-wrap gap-2 text-zinc-300">
                          <span>If Fan Spend &ge;</span>
                          <div className="relative w-16">
                            <span className="absolute left-1.5 top-1 text-[10px] text-zinc-500">$</span>
                            <input
                              type="number"
                              value={rule.minSpend || 0}
                              onChange={(e) => handleUpdateRule(idx, { minSpend: Number(e.target.value) })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-1 pl-4 py-0.5 text-center text-xs font-bold text-zinc-100"
                            />
                          </div>
                          <span>override price to</span>
                          <div className="relative w-16">
                            <span className="absolute left-1.5 top-1 text-[10px] text-zinc-500">$</span>
                            <input
                              type="number"
                              value={rule.priceOverride || 0}
                              onChange={(e) => handleUpdateRule(idx, { priceOverride: Number(e.target.value) })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-1 pl-4 py-0.5 text-center text-xs font-bold text-amber-400"
                            />
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center flex-wrap gap-2 text-zinc-300">
                          <span>If Fan has CRM Tag</span>
                          <input
                            type="text"
                            placeholder="e.g. vip"
                            value={rule.tag || ''}
                            onChange={(e) => handleUpdateRule(idx, { tag: e.target.value })}
                            className="w-20 bg-zinc-900 border border-zinc-800 rounded px-2 py-0.5 text-xs text-zinc-100 font-bold"
                          />
                          <span>apply discount of</span>
                          <div className="relative w-14">
                            <input
                              type="number"
                              min="0"
                              max="100"
                              value={rule.discountPercent || 0}
                              onChange={(e) => handleUpdateRule(idx, { discountPercent: Number(e.target.value) })}
                              className="w-full bg-zinc-900 border border-zinc-800 rounded px-1 pr-4 py-0.5 text-center text-xs font-bold text-indigo-400"
                            />
                            <span className="absolute right-1.5 top-1 text-[10px] text-zinc-500">%</span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemovePricingRule(idx)}
                        className="text-zinc-500 hover:text-red-400 p-1.5 rounded-lg hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Form actions */}
            <div className="flex items-center justify-end gap-3 border-t border-zinc-800/60 pt-4">
              {selectedTemplateId && (
                <button
                  type="button"
                  onClick={resetForm}
                  className="bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 text-xs font-bold py-2.5 px-5 rounded-xl transition-all"
                >
                  Cancel Edit
                </button>
              )}
              <button
                type="submit"
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold py-2.5 px-6 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-md shadow-indigo-600/10 cursor-pointer"
              >
                {saving && <RefreshCw className="h-3.5 w-3.5 animate-spin" />}
                {selectedTemplateId ? 'Update Preset Configuration' : 'Save Config Preset'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Live Chat Lock Simulator */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-zinc-900/40 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm space-y-5">
            <h3 className="text-xs font-bold text-zinc-350 uppercase tracking-wider flex items-center gap-2 border-b border-zinc-800/60 pb-3">
              <Eye className="h-4 w-4 text-emerald-400" />
              Live Lock Simulator
            </h3>

            {/* Sandbox inputs */}
            <div className="bg-zinc-950/40 border border-zinc-850 p-4 rounded-xl space-y-3.5">
              <span className="text-[10px] text-zinc-550 font-bold uppercase tracking-wider block border-b border-zinc-800/50 pb-1.5">Simulation Sandbox variables</span>
              
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">Fan Spend ($)</label>
                  <input
                    type="number"
                    value={simulatedFanSpend}
                    onChange={(e) => setSimulatedFanSpend(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 font-bold focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-zinc-500 uppercase">CRM Tags</label>
                  <input
                    type="text"
                    value={simulatedFanTags}
                    onChange={(e) => setSimulatedFanTags(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded px-2.5 py-1 text-zinc-200 font-bold focus:outline-none focus:border-indigo-500"
                    placeholder="comma separated"
                  />
                </div>
              </div>
            </div>

            {/* Chat Device Simulator */}
            <div className="border border-zinc-800/80 rounded-2xl bg-zinc-950 overflow-hidden shadow-2xl relative">
              {/* Header */}
              <div className="bg-zinc-900 border-b border-zinc-800/80 p-3.5 flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs shadow-inner">
                  S
                </div>
                <div>
                  <h4 className="text-xs font-bold text-zinc-200">{activeCreator.displayName}</h4>
                  <p className="text-[9px] text-emerald-450 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    online
                  </p>
                </div>
              </div>

              {/* Chat Timeline body */}
              <div className="p-4 space-y-4 min-h-[280px] bg-zinc-950/80 flex flex-col justify-end">
                <div className="space-y-2 max-w-[85%] self-end">
                  {/* Bubble wrapper */}
                  <div className="bg-zinc-900 border border-zinc-850 p-3.5 rounded-2xl rounded-tr-none text-xs text-zinc-200 space-y-3 shadow-md">
                    {/* Text copy */}
                    <p className="whitespace-pre-wrap leading-relaxed">{getRenderedPreviewText()}</p>
                    
                    {/* Media locks components visual */}
                    {attachedMedia.length > 0 && (
                      <div className="relative rounded-xl overflow-hidden border border-zinc-800 shadow bg-zinc-950">
                        {/* Timed preview banner */}
                        {lockType === 'preview' && (
                          <div className="bg-amber-500/10 border-b border-amber-500/20 text-amber-400 text-[9px] font-black uppercase tracking-wider py-1 px-2.5 flex items-center gap-1 justify-center">
                            <Clock className="h-3 w-3" />
                            {previewSeconds}s Free Preview Available
                          </div>
                        )}
                        
                        {/* Video / image blur overlay */}
                        <div className="relative aspect-video flex items-center justify-center">
                          {/* Background blurred mockup image */}
                          <img
                            src={attachedMedia[0]}
                            alt=""
                            className="h-full w-full object-cover blur-[8px] opacity-40 scale-105"
                          />
                          
                          {/* Locked Shield padlock center */}
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-1.5">
                            <div className="h-10 w-10 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-center text-amber-400 shadow shadow-amber-500/10">
                              <Lock className="h-5 w-5" />
                            </div>
                            {lockType === 'bundle' && (
                              <span className="text-[9px] bg-zinc-800 px-2 py-0.5 rounded-full border border-zinc-700 text-zinc-400 font-bold uppercase tracking-wider">
                                {attachedMedia.length} Media Bundle
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Lock overlay Unlock CTA button */}
                        <div className="p-3 bg-zinc-900 border-t border-zinc-850 flex flex-col gap-2">
                          <button
                            type="button"
                            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-black py-2 rounded-xl transition-all shadow shadow-emerald-500/10 uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" />
                            Unlock for ${finalCalculatedPrice.toFixed(2)}
                          </button>
                          
                          {/* Rules applied status disclaimer */}
                          {pricingRules.length > 0 && finalCalculatedPrice !== parseFloat(price) && (
                            <div className="text-[9px] text-emerald-400 font-semibold text-center flex items-center gap-1 justify-center">
                              <Sparkles className="h-3 w-3" />
                              Dynamic pricing rules applied (-${(parseFloat(price) - finalCalculatedPrice).toFixed(2)})
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <span className="text-[9px] text-zinc-600 block text-right">Just now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
