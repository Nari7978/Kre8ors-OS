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
                <div>
                  <span className="font-semibold text-sm truncate text-zinc-200">
                    {fan.displayName}
                  </span>
                  <p className="text-xs text-zinc-500 truncate mt-1">
                    @{fan.username}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Center Panel */}
      <div className="flex-1 flex flex-col h-full bg-zinc-950">
        <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm">
          Conversation viewport placeholder
        </div>
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
