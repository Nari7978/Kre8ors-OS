'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, User, DollarSign, Image, Video, Paperclip, 
  Send, X, Plus, Edit2, Check, RefreshCw, Lock, Unlock, ShieldAlert, Folder
} from 'lucide-react';
import { useGlobalStore } from '@/lib/store/global-store';
import { Creator, Fan, Message } from '@/types';

interface MediaItem {
  id: string;
  name: string;
  url: string;
  thumbnail: string | null;
  fileType: string;
  folderName: string;
}

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

interface SearchHeaderProps {
  selectedCreatorId: string;
  setSelectedCreatorId: (id: string) => void;
  creators: Creator[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

const SidebarSearchHeader: React.FC<SearchHeaderProps> = ({
  selectedCreatorId,
  setSelectedCreatorId,
  creators,
  searchQuery,
  setSearchQuery
}) => {
  return (
    <div className="p-4 border-b border-zinc-800 flex flex-col gap-3 bg-zinc-950/20">
      <h2 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-500 bg-clip-text text-transparent">
        Agency Chat Workspace
      </h2>
      <div>
        <select
          value={selectedCreatorId}
          onChange={(e) => setSelectedCreatorId(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
        >
          <option value="">Select Creator...</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id}>
              @{c.username} ({c.displayName})
            </option>
          ))}
        </select>
      </div>
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
        <input
          type="text"
          placeholder="Search subscribers..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-blue-500 placeholder-zinc-650"
        />
      </div>
    </div>
  );
};

interface FanListProps {
  fans: Fan[];
  selectedFan: Fan | null;
  setSelectedFan: (fan: Fan) => void;
  loadingFans: boolean;
}

const SidebarFanList: React.FC<FanListProps> = ({
  fans,
  selectedFan,
  setSelectedFan,
  loadingFans
}) => {
  return (
    <div className="flex-1 overflow-y-auto divide-y divide-zinc-900">
      {loadingFans ? (
        <div className="p-4 text-center text-sm text-zinc-500 flex items-center justify-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
          Loading fans...
        </div>
      ) : fans.length === 0 ? (
        <div className="p-4 text-center text-sm text-zinc-500">
          No fans found for this creator
        </div>
      ) : (
        fans.map((fan) => (
          <button
            key={fan.id}
            onClick={() => setSelectedFan(fan)}
            className={`w-full p-4 text-left flex items-start gap-3 transition-all duration-200 border-b border-zinc-900/50 ${
              selectedFan?.id === fan.id 
                ? 'bg-gradient-to-r from-blue-500/10 to-indigo-500/5 border-l-4 border-blue-500 shadow-[inset_1px_0_0_0_rgba(59,130,246,0.2)] bg-zinc-900/80 text-white' 
                : 'hover:bg-zinc-900/30 text-zinc-300 border-l-4 border-transparent'
            }`}
          >
            {/* Fan Avatar */}
            <div className="h-10 w-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden flex-shrink-0">
              {fan.avatarUrl ? (
                <img src={fan.avatarUrl} alt={fan.displayName} className="object-cover h-full w-full" />
              ) : (
                <User className="h-5 w-5 text-zinc-500" />
              )}
            </div>

            {/* Chat details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm truncate text-zinc-200">
                  {fan.displayName}
                </span>
                <span className="text-xs font-bold text-zinc-400 bg-zinc-800/80 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-zinc-700/30">
                  <DollarSign className="h-3 w-3 text-emerald-500" />
                  {Number(fan.totalSpent).toFixed(2)}
                </span>
              </div>
              <p className="text-xs text-zinc-500 truncate mt-1">
                @{fan.username}
              </p>
              
              {/* Subscriber Tag */}
              <div className="flex items-center gap-1.5 mt-2">
                <span className={`inline-block h-2 w-2 rounded-full ${
                  fan.isSubscriber 
                    ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse' 
                    : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]'
                }`} />
                <span className="text-[10px] uppercase font-bold text-zinc-400">
                  {fan.isSubscriber ? 'Subscribed' : 'Expired'}
                </span>
              </div>
            </div>
          </button>
        ))
      )}
    </div>
  );
};

export default function MessagesPage() {
  const { activeCreator } = useGlobalStore();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [fans, setFans] = useState<Fan[]>([]);
  const [selectedFan, setSelectedFan] = useState<Fan | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFans, setLoadingFans] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('');

  // Interactive UI State Variables
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [lockPrice, setLockPrice] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [notesText, setNotesText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unlockingMessageId, setUnlockingMessageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // AI suggestions states
  const [aiSuggestions, setAiSuggestions] = useState<{ id: string; label: string; text: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [vaultItemsList, setVaultItemsList] = useState<MediaItem[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);

// Toggle media attachment
const toggleAttachMedia = (url: string) => {
  if (attachedMedia.includes(url)) {
    setAttachedMedia((prev) => prev.filter((item) => item !== url));
  } else {
    setAttachedMedia((prev) => [...prev, url]);
  }
};

  // Fetch all creators on mount
  useEffect(() => {
    async function fetchCreators() {
      try {
        const res = await fetch('/api/creators');
        const data = await res.json();
        setCreators(data);
        if (data.length > 0 && !activeCreator) {
          setSelectedCreatorId(data[0].id);
        }
      } catch (err) {
        console.error('Error fetching creators:', err);
      }
    }
    fetchCreators();
  }, [activeCreator]);

  // Sync selected creator ID with global store context
  useEffect(() => {
    if (activeCreator) {
      Promise.resolve().then(() => {
        setSelectedCreatorId(activeCreator.id);
      });
    }
  }, [activeCreator]);

  // Fetch fans when selected creator changes or search query triggers
  useEffect(() => {
    if (!selectedCreatorId) return;

    async function fetchFans() {
      setLoadingFans(true);
      try {
        let url = `/api/fans?creatorId=${selectedCreatorId}`;
        if (searchQuery) {
          url += `&search=${encodeURIComponent(searchQuery)}`;
        }
        const res = await fetch(url);
        const data = await res.json();
        setFans(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error('Error fetching fans:', err);
      } finally {
        setLoadingFans(false);
      }
    }

    const timer = setTimeout(() => {
      fetchFans();
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedCreatorId, searchQuery]);

  // Fetch messages when active fan is selected
  useEffect(() => {
    if (!selectedCreatorId || !selectedFan) return;

    const fanId = selectedFan.id;
    const fanNotes = selectedFan.notes;

    async function fetchMessages() {
      setLoadingMessages(true);
      try {
        const res = await fetch(`/api/messages?creatorId=${selectedCreatorId}&fanId=${fanId}`);
        const data = await res.json();
        setMessages(Array.isArray(data) ? data : []);
        setNotesText(fanNotes || '');
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    }
    fetchMessages();
  }, [selectedCreatorId, selectedFan]);

  // Fetch AI response suggestions when fan changes
  useEffect(() => {
    if (!selectedCreatorId || !selectedFan) {
      setAiSuggestions([]);
      return;
    }

    const fanId = selectedFan.id;

    async function fetchSuggestions() {
      setLoadingSuggestions(true);
      try {
        const res = await fetch(`/api/ai/suggest?creatorId=${selectedCreatorId}&fanId=${fanId}`);
        if (res.ok) {
          const data = await res.json();
          setAiSuggestions(data);
        }
      } catch (err) {
        console.error('Error fetching AI suggestions:', err);
      } finally {
        setLoadingSuggestions(false);
      }
    }
    fetchSuggestions();
  }, [selectedCreatorId, selectedFan]);

  // Scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load media vault items dynamically for selected creator
  useEffect(() => {
    let active = true;

    const fetchVault = async () => {
      if (!selectedCreatorId) {
        setVaultItemsList([]);
        return;
      }
      setLoadingVault(true);
      try {
        const res = await fetch(`/api/media?creatorId=${selectedCreatorId}`);
        if (res.ok && active) {
          const data = await res.json();
          setVaultItemsList(data);
        }
      } catch (err) {
        console.error('Error fetching vault items:', err);
      } finally {
        if (active) setLoadingVault(false);
      }
    };

    Promise.resolve().then(() => {
      fetchVault();
    });

    return () => {
      active = false;
    };
  }, [selectedCreatorId]);

  // Handle Send Message & Compose PPV
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCreatorId || !selectedFan) return;
    if (!messageText.trim() && attachedMedia.length === 0) return;

    setSendingMessage(true);
    try {
      const price = parseFloat(lockPrice) || 0;
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creatorId: selectedCreatorId,
          fanId: selectedFan.id,
          text: messageText,
          mediaUrls: attachedMedia,
          price,
        }),
      });

      if (res.ok) {
        const newMessage = await res.json();
        setMessages((prev) => [...prev, newMessage]);
        setMessageText('');
        setAttachedMedia([]);
        setLockPrice('');
        setVaultOpen(false);
      }
    } catch (err) {
      console.error('Error sending message:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Handle PPV Unlocking Simulator
  const handleUnlockMessage = async (messageId: string) => {
    setUnlockingMessageId(messageId);
    try {
      const res = await fetch('/api/messages/unlock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId }),
      });

      if (res.ok) {
        const result = await res.json();
        // Update message local state
        setMessages((prev) =>
          prev.map((msg) =>
            msg.id === messageId ? { ...msg, isPurchased: true } : msg
          )
        );
        // Sync the fan state and list record totalSpent
        const updatedTotal = Number(result.data.fanSpent);
        setSelectedFan((prev) => (prev ? { ...prev, totalSpent: updatedTotal } : null));
        setFans((prev) =>
          prev.map((f) => (f.id === selectedFan?.id ? { ...f, totalSpent: updatedTotal } : f))
        );
      }
    } catch (err) {
      console.error('Error unlocking message:', err);
    } finally {
      setUnlockingMessageId(null);
    }
  };

  // Save notes and tags to database
  const handleSaveNotes = async () => {
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
        setSelectedFan(updated);
        setFans((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
      } else {
        console.error('Failed to save notes & tags');
      }
    } catch (err) {
      console.error('Error saving notes & tags:', err);
    } finally {
      setSaving(false);
    }
  };

  // Add search profile tag
  const handleAddTag = () => {
    if (!selectedFan || !newTag.trim()) return;
    const tag = newTag.trim().toLowerCase();
    if (selectedFan.customTags.includes(tag)) return;

    const updatedTags = [...selectedFan.customTags, tag];
    const updatedFan = { ...selectedFan, customTags: updatedTags };
    setSelectedFan(updatedFan);
    setFans((prev) => prev.map((f) => (f.id === selectedFan.id ? updatedFan : f)));
    setNewTag('');
  };

  // Remove search profile tag
  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedFan) return;
    const updatedTags = selectedFan.customTags.filter((t) => t !== tagToRemove);
    const updatedFan = { ...selectedFan, customTags: updatedTags };
    setSelectedFan(updatedFan);
    setFans((prev) => prev.map((f) => (f.id === selectedFan.id ? updatedFan : f)));
  };

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden font-sans">
      {/* Left Panel */}
      <div className={`border-r border-zinc-800 flex flex-col h-full bg-zinc-900/40 transition-all duration-300 ease-in-out ${
        leftSidebarCollapsed ? 'w-0 overflow-hidden opacity-0 pointer-events-none' : 'w-80'
      }`}>
        <SidebarSearchHeader
          selectedCreatorId={selectedCreatorId}
          setSelectedCreatorId={setSelectedCreatorId}
          creators={creators}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
        />
        <SidebarFanList
          fans={fans}
          selectedFan={selectedFan}
          setSelectedFan={setSelectedFan}
          loadingFans={loadingFans}
        />
      </div>

      {/* Center Panel */}
      <div className="flex-1 flex flex-col h-full bg-zinc-950">
        {selectedFan ? (
          <>
            {/* Thread Header */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-900/10 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-zinc-100">{selectedFan.displayName}</h3>
                <p className="text-xs text-zinc-500">@{selectedFan.username}</p>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-zinc-400 bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full flex items-center gap-1">
                  <DollarSign className="h-4 w-4 text-emerald-500" />
                  Spent: <strong className="text-zinc-200">${Number(selectedFan.totalSpent).toFixed(2)}</strong>
                </span>
              </div>
            </div>

            {/* Messages Viewport */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center text-zinc-500 text-sm gap-2">
                  <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
                  Loading messages...
                </div>
              ) : messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-sm gap-2">
                  <span className="p-3 bg-zinc-900/60 rounded-full border border-zinc-800">💬</span>
                  No messages yet. Send a message to start the conversation!
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isOut = msg.direction === 'out';
                    const isLocked = !msg.isPurchased && Number(msg.tipAmount) > 0;
                    const price = Number(msg.tipAmount);
                    return (
                      <div key={msg.id} className="space-y-1">
                        {/* Tip Indicator */}
                        {msg.isTip && (
                          <div className="flex justify-start">
                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 my-1">
                              <DollarSign className="h-3.5 w-3.5" />
                              Tip received: ${Number(msg.tipAmount).toFixed(2)}
                            </div>
                          </div>
                        )}

                        {/* Bubble row */}
                        <div className={`flex ${isOut ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[70%] rounded-2xl px-4 py-2.5 text-sm ${
                              isOut 
                                ? 'bg-blue-600 text-white rounded-br-none' 
                                : 'bg-zinc-800 text-zinc-100 rounded-bl-none'
                            }`}
                          >
                            {/* Media Vault Attachments */}
                            {msg.mediaUrls && msg.mediaUrls.length > 0 && (
                              <div className="mb-2 rounded-lg overflow-hidden relative border border-zinc-950/20">
                                {msg.mediaUrls.map((url, index) => {
                                  const isVideo = url.endsWith('.mp4');
                                  return (
                                    <div key={index} className="relative">
                                      {isLocked ? (
                                        <div className="relative h-48 w-full bg-zinc-950/80 flex flex-col items-center justify-center text-center p-4">
                                          {isVideo ? (
                                            <img src="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=100" alt="locked video" className="absolute inset-0 h-full w-full object-cover blur-xl opacity-30" />
                                          ) : (
                                            <img src={url} alt="locked content" className="absolute inset-0 h-full w-full object-cover blur-xl opacity-30" />
                                          )}
                                          <Lock className="h-8 w-8 text-amber-500 mb-2" />
                                          <span className="text-xs font-bold text-amber-400">Locked Pay-to-Unlock Content</span>
                                          <span className="text-[10px] text-zinc-400 mt-1">Unlock for ${price.toFixed(2)}</span>
                                        </div>
                                      ) : isVideo ? (
                                        <video controls className="w-full max-h-64 object-cover">
                                          <source src={url} type="video/mp4" />
                                        </video>
                                      ) : (
                                        <img src={url} alt="attachment" className="w-full max-h-64 object-cover" />
                                      )}
                                    </div>
                                  );
                                })}
                              </div>
                            )}

                            {/* Text */}
                            {msg.text && <p className="leading-relaxed">{msg.text}</p>}
                            
                            {/* Time stamp */}
                            <div className="flex justify-end items-center gap-1 mt-1 text-[10px] text-zinc-300 opacity-60">
                              <span>
                                {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>

                            {/* Locked PPV Purchase Simulator Trigger (Task 13) */}
                            {isLocked && (
                              <div className="mt-3 pt-3 border-t border-white/10 flex flex-col gap-2">
                                <div className="flex items-center justify-between text-xs text-amber-200">
                                  <span className="flex items-center gap-1 font-semibold">
                                    <Lock className="h-3.5 w-3.5" />
                                    Locked: ${price.toFixed(2)}
                                  </span>
                                  <span className="text-[10px] bg-amber-500/20 px-2 py-0.5 rounded text-amber-300 uppercase font-bold">PPV</span>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleUnlockMessage(msg.id)}
                                  disabled={unlockingMessageId === msg.id}
                                  className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-1.5 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                                >
                                  {unlockingMessageId === msg.id ? (
                                    <RefreshCw className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Unlock className="h-3.5 w-3.5" />
                                  )}
                                  Simulate Unlock (Buy)
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Composer Placeholder */}
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/20 relative space-y-3">
              {/* Media Selection Previews (Task 11) */}
              {attachedMedia.length > 0 && (
                <div className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 p-2 rounded-lg">
                  <span className="text-xs text-zinc-400 flex-1">Attached Media Vault file ready to send:</span>
                  {attachedMedia.map((url, i) => (
                    <div key={i} className="relative h-10 w-10 border border-zinc-700 rounded overflow-hidden flex-shrink-0">
                      <img src={url} className="object-cover h-full w-full" alt="preview" />
                      <button
                        type="button"
                        onClick={() => setAttachedMedia([])}
                        className="absolute top-0 right-0 bg-red-600 text-white rounded-bl p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* AI response suggestions bar */}
              {selectedFan && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse" />
                    AI Suggestions:
                  </span>
                  {loadingSuggestions ? (
                    <span className="text-[10px] text-zinc-500 italic">Generating replies...</span>
                  ) : aiSuggestions.length === 0 ? (
                    <span className="text-[10px] text-zinc-500 italic">No suggestions</span>
                  ) : (
                    <div className="flex items-center gap-2">
                      {aiSuggestions.map((sug) => (
                        <button
                          type="button"
                          key={sug.id}
                          onClick={() => setMessageText(sug.text)}
                          className="bg-zinc-950 border border-zinc-800 hover:border-zinc-700/80 px-2.5 py-1 rounded-full text-[10px] text-zinc-300 font-semibold transition-all max-w-[200px] truncate hover:text-white cursor-pointer"
                          title={sug.text}
                        >
                          <strong className="text-blue-400 mr-1 font-bold">{sug.label}:</strong>
                          {sug.text}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Composer Input Row */}
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                {/* Vault Media Toggle */}
                <button
                  type="button"
                  onClick={() => setVaultOpen(!vaultOpen)}
                  className={`p-2.5 rounded-lg border transition-colors flex-shrink-0 ${
                    vaultOpen ? 'bg-blue-600 border-blue-500 text-white' : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                  title="Attach from Vault"
                >
                  <Paperclip className="h-5 w-5" />
                </button>

                {/* Main Text Input */}
                <input
                  type="text"
                  placeholder={attachedMedia.length > 0 ? "Add message description to locked media..." : "Type a message..."}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg py-2.5 px-4 text-sm focus:outline-none focus:border-blue-500 placeholder-zinc-500"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={sendingMessage || (!messageText.trim() && attachedMedia.length === 0)}
                  className="bg-blue-600 hover:bg-blue-500 text-white p-2.5 rounded-lg transition-colors flex-shrink-0 disabled:opacity-50"
                >
                  {sendingMessage ? (
                    <RefreshCw className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </form>

              {/* Vault Picker (Task 10) */}
              {vaultOpen && (
                <div className="absolute bottom-20 left-4 right-4 bg-zinc-900 border border-zinc-800 rounded-xl p-4 shadow-2xl z-55 space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                    <span className="text-sm font-bold flex items-center gap-1 text-zinc-300">
                      <Folder className="h-4 w-4 text-blue-400" />
                      Select Creator Vault Media
                    </span>
                    <button type="button" onClick={() => setVaultOpen(false)} className="text-zinc-500 hover:text-white">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Vault grid */}
                  {loadingVault ? (
                    <div className="py-6 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin text-blue-500" />
                      Loading vault...
                    </div>
                  ) : vaultItemsList.length === 0 ? (
                    <div className="py-6 text-center text-xs text-zinc-500">
                      No vault media items found. Go to the Media Vault tab to upload assets.
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 max-h-[220px] overflow-y-auto pr-1">
                      {vaultItemsList.map((item) => {
                        const isSelected = attachedMedia.includes(item.url);
                        return (
                          <button
                            type="button"
                            key={item.id}
                            onClick={() => toggleAttachMedia(item.url)}
                            className={`relative rounded-lg overflow-hidden border p-1 text-left flex flex-col gap-1 transition-all ${
                              isSelected ? 'border-blue-500 bg-blue-500/10' : 'border-zinc-800 hover:border-zinc-700 bg-zinc-950'
                            }`}
                          >
                            <img src={item.thumbnail || item.url} alt={item.name} className="h-16 w-full object-cover rounded" />
                            <span className="text-[10px] text-zinc-400 truncate w-full px-1">{item.name}</span>
                            <span className="text-[9px] bg-zinc-800 px-1 py-0.2 rounded w-max text-zinc-300 uppercase self-end font-semibold">{item.folderName}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* PPV Pricing control */}
                  <div className="pt-2 border-t border-zinc-800 flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 flex items-center gap-0.5">
                      <Lock className="h-3.5 w-3.5" />
                      PPV Price Lock:
                    </span>
                    <div className="relative flex-1 max-w-[120px]">
                      <span className="absolute left-2.5 top-1.5 text-xs text-zinc-500">$</span>
                      <input
                        type="number"
                        placeholder="0.00"
                        value={lockPrice}
                        onChange={(e) => setLockPrice(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded px-2 pl-6 py-1 text-xs focus:outline-none focus:border-blue-500 text-amber-300 font-semibold"
                      />
                    </div>
                    <span className="text-[10px] text-zinc-500">
                      (Leave empty or 0 to send as free/unlocked media)
                    </span>
                  </div>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm gap-3">
            <span className="text-4xl">💬</span>
            Select a subscriber from the sidebar to start live chatting
          </div>
        )}
      </div>

      {/* Right Panel */}
      <div className={`border-l border-zinc-800 flex flex-col h-full bg-zinc-900/40 overflow-y-auto p-4 transition-all duration-300 ease-in-out ${
        rightSidebarCollapsed ? 'w-0 overflow-hidden opacity-0 pointer-events-none p-0 border-l-0' : 'w-80'
      }`}>
        {selectedFan ? (
          <div className="flex flex-col h-full space-y-5">
            {/* Fan Bio Card */}
            <div className="text-center pb-4 border-b border-zinc-800">
              <div className="h-16 w-16 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center overflow-hidden mx-auto mb-3 shadow-lg">
                {selectedFan.avatarUrl ? (
                  <img src={selectedFan.avatarUrl} alt={selectedFan.displayName} className="object-cover h-full w-full" />
                ) : (
                  <User className="h-8 w-8 text-zinc-500" />
                )}
              </div>
              <h3 className="font-bold text-zinc-200">{selectedFan.displayName}</h3>
              <p className="text-xs text-zinc-500">@{selectedFan.username}</p>
              <div className="mt-2 flex items-center justify-center gap-2">
                <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${selectedFan.isSubscriber ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {selectedFan.isSubscriber ? 'Subscriber' : 'Expired'}
                </span>
                <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded border border-zinc-700">
                  UID: {selectedFan.ofId}
                </span>
              </div>
            </div>

            {/* CRM Custom Tagging */}
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Subscriber Custom Tags</span>
              
              {/* Tags grid */}
              <div className="flex flex-wrap gap-1">
                {selectedFan.customTags.map((tag) => (
                  <span
                    key={tag}
                    className={`text-xs border pl-2.5 pr-1.5 py-1 rounded-full flex items-center gap-1 font-semibold ${getTagStyles(tag).bg}`}
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="text-zinc-500 hover:text-white rounded-full p-0.5 hover:bg-zinc-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>

              {/* Tag Add Composer */}
              <div className="flex items-center gap-1.5 mt-2">
                <input
                  type="text"
                  placeholder="new-tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded px-2.5 py-1.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-zinc-800 border border-zinc-700 hover:bg-zinc-700 p-1.5 rounded transition-colors text-xs flex items-center justify-center font-bold"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* CRM Notes */}
            <div className="space-y-2 flex-1 flex flex-col">
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-400">Operator Chat Notes</span>
              <textarea
                placeholder="Write specific fan characteristics, content preferences, rules or transaction history records..."
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-xs text-zinc-300 focus:outline-none focus:border-blue-500 resize-none font-sans min-h-[140px]"
              />
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={saving}
                className="w-full bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold py-2 rounded-lg text-xs transition-colors text-white"
              >
                {saving ? 'Saving...' : 'Save Notes & Tags'}
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-zinc-500 text-sm gap-2">
            <User className="h-8 w-8 text-zinc-700" />
            <span>Select a subscriber to view details</span>
          </div>
        )}
      </div>
    </div>
  );
}
