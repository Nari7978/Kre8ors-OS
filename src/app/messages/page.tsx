'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, User, DollarSign, Image, Video, Paperclip, 
  Send, X, Plus, Edit2, Check, RefreshCw, Lock, Unlock, ShieldAlert
} from 'lucide-react';
import { useGlobalStore } from '@/lib/store';
import { Creator, Fan, Message, MediaItem } from '@/types';

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
  const [vaultOpen, setVaultOpen] = useState(false);
  const [lockPrice, setLockPrice] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<string[]>([]);
  const [newTag, setNewTag] = useState('');
  const [notesText, setNotesText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unlockingMessageId, setUnlockingMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

// Mock Vault Items corresponding to database seeds
const vaultItemsList: MediaItem[] = [
  {
    id: 'vault_1',
    name: 'morning_outfit_01.jpg',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=100',
    fileType: 'image',
    folderName: 'Outfits',
  },
  {
    id: 'vault_2',
    name: 'beach_vlog_01.mp4',
    url: 'https://www.w3schools.com/html/mov_bbb.mp4',
    thumbnail: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&q=80&w=100',
    fileType: 'video',
    folderName: 'Vlogs',
  },
  {
    id: 'vault_3',
    name: 'backstage_pic.jpg',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400',
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100',
    fileType: 'image',
    folderName: 'Casual',
  },
];

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
      setSelectedCreatorId(activeCreator.id);
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

  // Scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="flex h-screen w-full bg-zinc-950 text-white overflow-hidden font-sans">
      {/* Left Panel */}
      <div className="w-80 border-r border-zinc-800 flex flex-col h-full bg-zinc-900/40">
        <div className="p-4 border-b border-zinc-800 flex flex-col gap-3">
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
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-2 pl-9 pr-4 text-sm text-zinc-300 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>
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
                className={`w-full p-4 text-left flex items-start gap-3 transition-colors ${
                  selectedFan?.id === fan.id ? 'bg-zinc-800/80 border-l-2 border-blue-500' : 'hover:bg-zinc-900/50'
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
                    <span className="text-xs font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <DollarSign className="h-3 w-3 text-emerald-500" />
                      {Number(fan.totalSpent).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-500 truncate mt-1">
                    @{fan.username}
                  </p>
                  
                  {/* Subscriber Tag */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className={`inline-block h-2 w-2 rounded-full ${fan.isSubscriber ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="text-[10px] uppercase font-bold text-zinc-400">
                      {fan.isSubscriber ? 'Subscribed' : 'Expired'}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
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
                                  const isLocked = !msg.isPurchased && Number(msg.tipAmount) > 0;
                                  const price = Number(msg.tipAmount);
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
            <div className="p-4 border-t border-zinc-800 bg-zinc-900/20 relative">
              <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-2 text-center text-sm text-zinc-500">
                Composer input panel placeholder
              </div>

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
                  <div className="grid grid-cols-3 gap-2">
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
      <div className="w-80 border-l border-zinc-800 flex flex-col h-full bg-zinc-900/40">
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
          Fan CRM details placeholder
        </div>
      </div>
    </div>
  );
}
