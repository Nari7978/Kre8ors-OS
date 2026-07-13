'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useGlobalStore } from '@/lib/store/global-store';
import { Creator, Fan, Message, PpvTemplate } from '@/types';
import ChatSidebar from '@/components/messages/ChatSidebar';
import ChatList from '@/components/messages/ChatList';
import Conversation from '@/components/messages/Conversation';
import MessageInput from '@/components/messages/MessageInput';
import CustomerProfile from '@/components/messages/CustomerProfile';
import { Bookmark, Search, MessageSquare, Clock, Trash2, Plus, AlertCircle, Play, Send, CheckCircle2 } from 'lucide-react';

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
    { bg: 'bg-[#7C5CFC]/10 border-[#7C5CFC]/20 text-[#7C5CFC]', label: 'Purple' },
    { bg: 'bg-[#16C784]/10 border-[#16C784]/20 text-[#16C784]', label: 'Emerald' },
    { bg: 'bg-[#FFC857]/10 border-[#FFC857]/20 text-[#FFC857]', label: 'Amber' },
    { bg: 'bg-[#FF5B5B]/10 border-[#FF5B5B]/20 text-[#FF5B5B]', label: 'Rose' },
    { bg: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400', label: 'Cyan' },
    { bg: 'bg-orange-500/10 border-orange-500/20 text-orange-400', label: 'Orange' },
  ];
  return colors[hash % colors.length];
};

export default function MessagesPage() {
  const { activeCreator, chatCache, setChatCache, activeFilter, activeSubMenu, setActiveCreatorFans } = useGlobalStore();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [fans, setFans] = useState<Fan[]>([]);
  const [selectedFan, setSelectedFan] = useState<Fan | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingFans, setLoadingFans] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [selectedCreatorId, setSelectedCreatorId] = useState<string>('');

  // UI state variables
  const [leftSidebarCollapsed, setLeftSidebarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [vaultOpen, setVaultOpen] = useState(false);
  const [lockPrice, setLockPrice] = useState<string>('');
  const [messageText, setMessageText] = useState('');
  const [attachedMedia, setAttachedMedia] = useState<string[]>([]);
  const [ppvTemplates, setPpvTemplates] = useState<PpvTemplate[]>([]);
  const [showPpvPresets, setShowPpvPresets] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [notesText, setNotesText] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [unlockingMessageId, setUnlockingMessageId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // AI suggestions states
  const [aiSuggestions, setAiSuggestions] = useState<{ id: string; label: string; text: string }[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);

  const [vaultItemsList, setVaultItemsList] = useState<MediaItem[]>([]);
  const [loadingVault, setLoadingVault] = useState(false);

  // Saved for Later state
  const [savedSearch, setSavedSearch] = useState('');
  const [savedMessages, setSavedMessages] = useState([
    {
      id: 'saved_1',
      username: 'sophiasweet_new',
      displayName: 'Sophia Sweet',
      text: 'Can you send me the special photo compilation tomorrow morning?',
      dateSaved: '2026-07-12T10:15:30.000Z',
      notes: 'Send compilations package'
    },
    {
      id: 'saved_2',
      username: 'charlie_rose',
      displayName: 'Charlie Rose',
      text: 'Loved the welcome video! When is the next PPV release?',
      dateSaved: '2026-07-13T08:22:11.000Z',
      notes: 'Upsell next PPV package'
    },
    {
      id: 'saved_3',
      username: 'emma_fan',
      displayName: 'Emma Rose Fan',
      text: 'Please check your DM, I sent a tip of $50.',
      dateSaved: '2026-07-13T09:45:00.000Z',
      notes: 'High-tier spender, prioritize response'
    }
  ]);

  // Global message search state
  const [globalMessageSearch, setGlobalMessageSearch] = useState('');
  const [globalFilter, setGlobalFilter] = useState<'all' | 'sent' | 'received' | 'ppv'>('all');
  const [globalMessages, setGlobalMessages] = useState([
    {
      id: 'msg_1',
      sender: 'Sophia Sweet',
      username: 'sophiasweet_new',
      text: 'Thanks for subscribing! Check out my locked items below.',
      type: 'sent',
      timestamp: '2026-07-13T09:50:00.000Z',
      status: 'Read',
      price: 0
    },
    {
      id: 'msg_2',
      sender: 'Sophia Sweet',
      username: 'sophiasweet_new',
      text: 'Loved the welcome video! When is the next PPV release?',
      type: 'received',
      timestamp: '2026-07-13T08:22:11.000Z',
      status: 'Read',
      price: 0
    },
    {
      id: 'msg_3',
      sender: 'Emma Rose Fan',
      username: 'emma_fan',
      text: '[PPV Photo Album] Premium set for the week',
      type: 'sent',
      timestamp: '2026-07-13T07:15:00.000Z',
      status: 'Locked ($20.00)',
      price: 20
    },
    {
      id: 'msg_4',
      sender: 'Charlie Rose',
      username: 'charlie_rose',
      text: 'Can you customize a video for my birthday next Tuesday?',
      type: 'received',
      timestamp: '2026-07-13T06:10:00.000Z',
      status: 'Unread',
      price: 0
    }
  ]);

  const toggleAttachMedia = (url: string) => {
    if (attachedMedia.includes(url)) {
      setAttachedMedia((prev) => prev.filter((item) => item !== url));
    } else {
      setAttachedMedia((prev) => [...prev, url]);
    }
  };

  // Sync selector with activeCreator context
  useEffect(() => {
    if (activeCreator) {
      setSelectedCreatorId(activeCreator.id);
    }
  }, [activeCreator]);

  // Fetch creators on mount
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

  // Fetch PPV templates
  useEffect(() => {
    if (!selectedCreatorId) return;
    async function fetchPpvTemplates() {
      try {
        const res = await fetch(`/api/messages/ppv-templates?creatorId=${selectedCreatorId}`);
        if (res.ok) {
          const data = await res.json();
          setPpvTemplates(data || []);
        }
      } catch (err) {
        console.error('Error fetching PPV templates:', err);
      }
    }
    fetchPpvTemplates();
  }, [selectedCreatorId]);

  // Fetch fans
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
        const fansList = Array.isArray(data) ? data : [];
        setFans(fansList);
        setActiveCreatorFans(fansList);
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

  // Fetch messages when selectedFan changes
  useEffect(() => {
    if (!selectedCreatorId || !selectedFan) return;
    const fanId = selectedFan.id;
    const fanNotes = selectedFan.notes;
    const cacheKey = `${selectedCreatorId}-${fanId}`;

    async function fetchMessages() {
      const cached = chatCache[cacheKey];
      if (cached) {
        setMessages(cached.messages);
        setHasMore(cached.hasMore);
        setNextCursor(cached.nextCursor);
        setNotesText(fanNotes || '');
        return;
      }

      setLoadingMessages(true);
      setHasMore(true);
      setNextCursor(null);
      try {
        const res = await fetch(`/api/messages?creatorId=${selectedCreatorId}&fanId=${fanId}&limit=20`);
        const data = await res.json();
        if (data && Array.isArray(data.messages)) {
          setMessages(data.messages);
          setHasMore(data.hasMore);
          setNextCursor(data.nextCursor);
          setChatCache(cacheKey, {
            messages: data.messages,
            hasMore: data.hasMore,
            nextCursor: data.nextCursor,
          });
        } else {
          setMessages([]);
          setHasMore(false);
          setNextCursor(null);
        }
        setNotesText(fanNotes || '');
      } catch (err) {
        console.error('Error fetching messages:', err);
      } finally {
        setLoadingMessages(false);
      }
    }
    fetchMessages();
  }, [selectedCreatorId, selectedFan?.id]);

  // Load more scroll pagination
  const loadMoreMessages = async () => {
    if (loadingMore || !hasMore || !nextCursor || !selectedCreatorId || !selectedFan) return;
    const container = messagesContainerRef.current;
    const prevScrollHeight = container ? container.scrollHeight : 0;
    const prevScrollTop = container ? container.scrollTop : 0;

    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/messages?creatorId=${selectedCreatorId}&fanId=${selectedFan.id}&cursor=${nextCursor}&limit=20`
      );
      const data = await res.json();
      if (data && Array.isArray(data.messages)) {
        setMessages((prev) => {
          const nextMessages = [...data.messages, ...prev];
          const cacheKey = `${selectedCreatorId}-${selectedFan.id}`;
          setChatCache(cacheKey, {
            messages: nextMessages,
            hasMore: data.hasMore,
            nextCursor: data.nextCursor,
          });
          return nextMessages;
        });
        setHasMore(data.hasMore);
        setNextCursor(data.nextCursor);

        requestAnimationFrame(() => {
          if (container) {
            const newScrollHeight = container.scrollHeight;
            container.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
          }
        });
      }
    } catch (err) {
      console.error('Error loading more messages:', err);
    } finally {
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const container = messagesContainerRef.current;
    if (!container) return;

    const handleScroll = () => {
      if (container.scrollTop < 15) {
        loadMoreMessages();
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
    };
  }, [nextCursor, hasMore, loadingMore, selectedCreatorId, selectedFan]);

  // Fetch AI suggestions
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

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load vault media
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
    fetchVault();
    return () => {
      active = false;
    };
  }, [selectedCreatorId]);

  // Apply templates
  const applyPpvTemplate = (tpl: PpvTemplate) => {
    let finalPrice = Number(tpl.price) || 0;
    if (selectedFan) {
      const fanSpend = Number(selectedFan.totalSpent) || 0;
      const tags = Array.isArray(selectedFan.customTags)
        ? selectedFan.customTags
        : typeof selectedFan.customTags === 'string'
        ? JSON.parse(selectedFan.customTags)
        : [];
      const lowerTags = tags.map((t: string) => t.toLowerCase());

      try {
        const rules = typeof tpl.pricingRules === 'string' ? JSON.parse(tpl.pricingRules) : tpl.pricingRules;
        if (Array.isArray(rules)) {
          rules.forEach((rule: any) => {
            if (rule.ruleType === 'spend_tier' && rule.minSpend !== undefined && rule.priceOverride !== undefined) {
              if (fanSpend >= rule.minSpend) {
                finalPrice = Math.min(finalPrice, rule.priceOverride);
              }
            }
            if (rule.ruleType === 'tag_discount' && rule.tag && rule.discountPercent !== undefined) {
              if (lowerTags.includes(rule.tag.toLowerCase())) {
                finalPrice = finalPrice * (1 - rule.discountPercent / 100);
              }
            }
          });
        }
      } catch (e) {
        console.error(e);
      }
    }

    let processedText = tpl.messageText || '';
    if (selectedFan) {
      processedText = processedText
        .replace(/\{\{fanName\}\}/g, selectedFan.displayName || selectedFan.username)
        .replace(/\{\{creatorName\}\}/g, activeCreator?.displayName || 'Creator')
        .replace(/\{\{price\}\}/g, `$${finalPrice.toFixed(2)}`);
    }

    setMessageText(processedText);
    setLockPrice(finalPrice.toFixed(2));

    try {
      const media = typeof tpl.mediaUrls === 'string' ? JSON.parse(tpl.mediaUrls) : tpl.mediaUrls;
      if (Array.isArray(media)) {
        setAttachedMedia(media);
        if (media.length > 0) {
          setVaultOpen(true);
        }
      }
    } catch (e) {
      console.error(e);
    }
    setShowPpvPresets(false);
  };

  // Send Message
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
        setMessages((prev) => {
          const nextMessages = [...prev, newMessage];
          const cacheKey = `${selectedCreatorId}-${selectedFan.id}`;
          setChatCache(cacheKey, {
            messages: nextMessages,
            hasMore,
            nextCursor,
          });
          return nextMessages;
        });
        setMessageText('');
        setAttachedMedia([]);
        setLockPrice('');
        setVaultOpen(false);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSendingMessage(false);
    }
  };

  // Unlock simulation
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
        setMessages((prev) => {
          const nextMessages = prev.map((msg) =>
            msg.id === messageId ? { ...msg, isPurchased: true } : msg
          );
          if (selectedFan) {
            const cacheKey = `${selectedCreatorId}-${selectedFan.id}`;
            setChatCache(cacheKey, {
              messages: nextMessages,
              hasMore,
              nextCursor,
            });
          }
          return nextMessages;
        });
        const updatedTotal = Number(result.data.fanSpent);
        setSelectedFan((prev) => (prev ? { ...prev, totalSpent: updatedTotal } : null));
        setFans((prev) =>
          prev.map((f) => (f.id === selectedFan?.id ? { ...f, totalSpent: updatedTotal } : f))
        );
      }
    } catch (err) {
      console.error(err);
    } finally {
      setUnlockingMessageId(null);
    }
  };

  const handleActionsSelect = async (action: string, msg: Message) => {
    if (!activeCreator) return;
    const msgAny = msg as any;
    if (action === 'like') {
      try {
        const isCurrentlyLiked = msgAny.isLiked ?? false;
        const res = await fetch('/api/messages/like', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorId: activeCreator.id,
            messageId: msg.id,
            unlike: isCurrentlyLiked,
          }),
        });
        if (res.ok) {
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, isLiked: !isCurrentlyLiked } as any : m))
          );
        }
      } catch (err) {
        console.error('Error liking message:', err);
      }
    } else if (action === 'pin') {
      try {
        const isCurrentlyPinned = msgAny.isPinned ?? false;
        const res = await fetch('/api/messages/pin', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            creatorId: activeCreator.id,
            messageId: msg.id,
            unpin: isCurrentlyPinned,
          }),
        });
        if (res.ok) {
          setMessages((prev) =>
            prev.map((m) => (m.id === msg.id ? { ...m, isPinned: !isCurrentlyPinned } as any : m))
          );
        }
      } catch (err) {
        console.error('Error pinning message:', err);
      }
    }
  };

  // Save tags & notes
  const handleSaveNotes = async () => {
    if (!selectedFan) return;
    setSaving(true);
    try {
      const tagsString = JSON.stringify(selectedFan.customTags);
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
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

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

  const handleRemoveTag = (tagToRemove: string) => {
    if (!selectedFan) return;
    const updatedTags = selectedFan.customTags.filter((t) => t !== tagToRemove);
    const updatedFan = { ...selectedFan, customTags: updatedTags };
    setSelectedFan(updatedFan);
    setFans((prev) => prev.map((f) => (f.id === selectedFan.id ? updatedFan : f)));
  };
  const getFilteredFans = () => {
    let list = [...fans];
    
    // Apply activeSubMenu filters
    if (activeSubMenu === 'Chat Requests') {
      list = list.filter((_, idx) => idx % 3 === 0);
    } else if (activeSubMenu === 'Pending Messages') {
      list = list.filter((_, idx) => idx % 2 === 1);
    } else if (activeSubMenu === 'Archived Chats') {
      list = list.filter((_, idx) => idx === 4);
    } else if (activeSubMenu === 'Hidden Chats') {
      list = list.filter((_, idx) => idx === 5);
    } else if (activeSubMenu === 'Muted Chats') {
      list = list.filter((_, idx) => idx === 1);
    } else if (activeSubMenu === 'Favorites') {
      list = list.filter((_, idx) => idx === 0 || idx === 3);
    } else if (activeSubMenu === 'Unread Chats') {
      list = list.filter((_, idx) => idx === 0 || idx === 2);
    } else if (activeSubMenu === 'Pinned Chats') {
      list = list.filter((_, idx) => idx === 0 || idx === 2);
    } else if (activeSubMenu === 'Deleted Chats') {
      list = [];
    }

    // Apply activeFilter tab filters
    if (activeFilter === 'unread') {
      list = list.filter((_, idx) => idx === 0 || idx === 2);
    } else if (activeFilter === 'vip') {
      list = list.filter((f) => f.totalSpent > 500);
    }

    return list;
  };

  return (
    <div className="flex h-full w-full bg-[#0F1117] text-white overflow-hidden font-sans">
      {/* Column 1: Chat Sidebar & Chat List */}
      <div className="flex border-r border-[#252A35] bg-[#13161D] h-full flex-shrink-0 select-none">
        <div className="flex flex-col h-full w-80">
          <ChatSidebar
            selectedCreatorId={selectedCreatorId}
            setSelectedCreatorId={setSelectedCreatorId}
            creators={creators}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            fans={fans}
          />
          <ChatList
            fans={getFilteredFans()}
            selectedFan={selectedFan}
            setSelectedFan={setSelectedFan}
            loadingFans={loadingFans}
          />
        </div>
      </div>

      {/* Column 2: Conditional Views based on activeSubMenu */}
      {activeSubMenu === 'Saved For Later' ? (
        <div className="flex-1 flex flex-col h-full bg-[#0F1117] min-w-0 p-8 overflow-y-auto space-y-6">
          <div className="border-b border-[#252A35] pb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <Bookmark className="h-6 w-6 text-[#7C5CFC]" />
              Saved For Later
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Audit flagged messages, add creator follow-up notes, or jump straight back to live chats.
            </p>
            <span className="text-[10px] font-mono text-zinc-650 mt-1 block">GET /api/messages/saved</span>
          </div>

          <div className="flex gap-4">
            <div className="relative flex-1">
              <span className="absolute left-3.5 top-3 text-zinc-500 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search saved bookmarks..."
                value={savedSearch}
                onChange={(e) => setSavedSearch(e.target.value)}
                className="w-full bg-[#13161D] border border-[#252A35] rounded-xl py-2 pl-10 pr-4 text-xs text-zinc-350 focus:outline-none focus:border-[#7C5CFC] font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedMessages
              .filter(m => m.text.toLowerCase().includes(savedSearch.toLowerCase()) || m.displayName.toLowerCase().includes(savedSearch.toLowerCase()))
              .map((msg) => (
                <div key={msg.id} className="bg-[#13161D] border border-[#252A35] rounded-2xl p-5 space-y-4 flex flex-col justify-between hover:border-zinc-800/80 transition-colors">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#252A35]/60 pb-2">
                      <div>
                        <span className="text-xs font-black text-zinc-200 block">{msg.displayName}</span>
                        <span className="text-[10px] text-zinc-500 font-bold block">@{msg.username}</span>
                      </div>
                      <span className="text-[8px] bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/20 px-2 py-0.5 rounded-full font-black uppercase">
                        Bookmarked
                      </span>
                    </div>

                    <div className="bg-[#0F1117] border border-[#252A35]/65 p-3 rounded-xl">
                      <p className="text-xs text-zinc-300 font-medium leading-relaxed">"{msg.text}"</p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider block">Follow-up Notes</label>
                      <textarea
                        value={msg.notes}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSavedMessages(prev => prev.map(item => item.id === msg.id ? { ...item, notes: val } : item));
                        }}
                        placeholder="Add checklist details..."
                        className="w-full bg-[#0F1117] border border-[#252A35] rounded-xl p-2.5 text-xs text-zinc-350 focus:outline-none focus:border-[#7C5CFC] h-16 resize-none font-sans"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2 border-t border-[#252A35]/60 mt-2">
                    <button
                      onClick={() => {
                        // Switch active creator fan, then switch submenu to Chats
                        const foundFan = fans.find(f => f.username === msg.username);
                        if (foundFan) {
                          setSelectedFan(foundFan);
                        }
                        const { setActiveSubMenu } = useGlobalStore.getState();
                        setActiveSubMenu('Chats');
                      }}
                      className="flex-1 bg-[#7C5CFC]/10 hover:bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 text-[#7C5CFC] text-[10px] font-bold py-2 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Play className="h-3 w-3" />
                      Go to Conversation
                    </button>
                    <button
                      onClick={() => {
                        setSavedMessages(prev => prev.filter(item => item.id !== msg.id));
                      }}
                      className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-[10px] font-bold px-3 py-2 rounded-xl transition-all cursor-pointer"
                      title="Remove Bookmark"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
          </div>
        </div>
      ) : activeSubMenu === 'Chat Messages' ? (
        <div className="flex-1 flex flex-col h-full bg-[#0F1117] min-w-0 p-8 overflow-y-auto space-y-6">
          <div className="border-b border-[#252A35] pb-6">
            <h1 className="text-2xl font-extrabold tracking-tight text-zinc-100 flex items-center gap-2.5">
              <MessageSquare className="h-6 w-6 text-[#7C5CFC]" />
              Chat Messages Inspector
            </h1>
            <p className="text-zinc-500 text-sm mt-1">
              Global lookup of recent messages dispatched and received across all subscribers.
            </p>
            <span className="text-[10px] font-mono text-zinc-650 mt-1 block">GET /api/messages</span>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="relative flex-1 w-full">
              <span className="absolute left-3.5 top-3 text-zinc-500 text-xs">🔍</span>
              <input
                type="text"
                placeholder="Search across all message texts..."
                value={globalMessageSearch}
                onChange={(e) => setGlobalMessageSearch(e.target.value)}
                className="w-full bg-[#13161D] border border-[#252A35] rounded-xl py-2 pl-10 pr-4 text-xs text-zinc-350 focus:outline-none focus:border-[#7C5CFC] font-semibold"
              />
            </div>
            
            <div className="flex gap-2 shrink-0">
              {[
                { id: 'all', label: 'All Messages' },
                { id: 'sent', label: 'Sent' },
                { id: 'received', label: 'Received' },
                { id: 'ppv', label: 'PPV Outbox' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setGlobalFilter(tab.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    globalFilter === tab.id
                      ? 'bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/30 shadow-md shadow-[#7C5CFC]/10'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#13161D] border border-[#252A35] rounded-2xl overflow-hidden shadow-lg">
            <div className="grid grid-cols-12 gap-4 bg-[#1B1F2A]/60 px-6 py-3 border-b border-[#252A35] text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
              <div className="col-span-3">Contact</div>
              <div className="col-span-5">Message Text</div>
              <div className="col-span-2">Direction</div>
              <div className="col-span-2 text-right">Actions</div>
            </div>

            <div className="divide-y divide-[#252A35]/50">
              {globalMessages
                .filter(m => {
                  if (globalFilter === 'sent') return m.type === 'sent';
                  if (globalFilter === 'received') return m.type === 'received';
                  if (globalFilter === 'ppv') return m.price > 0;
                  return true;
                })
                .filter(m => m.text.toLowerCase().includes(globalMessageSearch.toLowerCase()) || m.sender.toLowerCase().includes(globalMessageSearch.toLowerCase()))
                .map((msg) => (
                  <div key={msg.id} className="grid grid-cols-12 gap-4 px-6 py-4 items-center text-xs hover:bg-[#181C25]/50 transition-colors">
                    <div className="col-span-3 min-w-0">
                      <span className="font-extrabold text-zinc-200 block truncate">{msg.sender}</span>
                      <span className="text-[10px] text-zinc-550 block truncate">@{msg.username}</span>
                    </div>

                    <div className="col-span-5 text-zinc-300 font-medium line-clamp-2 pr-4">
                      {msg.text}
                    </div>

                    <div className="col-span-2 flex items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase border ${
                        msg.type === 'sent'
                          ? 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20'
                          : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                      }`}>
                        {msg.type}
                      </span>
                      {msg.price > 0 && (
                        <span className="text-[9px] font-bold text-emerald-400">${Number(msg.price).toFixed(2)}</span>
                      )}
                    </div>

                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => {
                          const foundFan = fans.find(f => f.username === msg.username);
                          if (foundFan) {
                            setSelectedFan(foundFan);
                          }
                          const { setActiveSubMenu } = useGlobalStore.getState();
                          setActiveSubMenu('Chats');
                        }}
                        className="bg-[#7C5CFC]/10 hover:bg-[#7C5CFC]/20 border border-[#7C5CFC]/30 text-[#7C5CFC] font-extrabold px-3 py-1.5 rounded-lg text-[10px] cursor-pointer transition-colors"
                      >
                        Inspect Chat
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Column 2: Chat Conversation & Message Input */}
          <div className="flex-1 flex flex-col h-full bg-[#0F1117] min-w-0 relative">
            {/* Visual indicator of the view */}
            <div className="absolute top-4 left-4 z-10 pointer-events-none select-none">
              <span className="text-[8px] bg-zinc-900/60 border border-zinc-800 text-zinc-500 font-black uppercase px-2 py-0.5 rounded-md">
                Chats View [GET]
              </span>
            </div>

            <Conversation
              selectedFan={selectedFan}
              activeCreator={activeCreator}
              messages={messages}
              loadingMessages={loadingMessages}
              loadingMore={loadingMore}
              hasMore={hasMore}
              messagesContainerRef={messagesContainerRef}
              messagesEndRef={messagesEndRef}
              onUnlockMessage={handleUnlockMessage}
              unlockingMessageId={unlockingMessageId}
              onActionsSelect={handleActionsSelect}
            />
            {selectedFan && (
              <MessageInput
                messageText={messageText}
                setMessageText={setMessageText}
                attachedMedia={attachedMedia}
                setAttachedMedia={setAttachedMedia}
                vaultOpen={vaultOpen}
                setVaultOpen={setVaultOpen}
                vaultItemsList={vaultItemsList}
                loadingVault={loadingVault}
                lockPrice={lockPrice}
                setLockPrice={setLockPrice}
                showPpvPresets={showPpvPresets}
                setShowPpvPresets={setShowPpvPresets}
                ppvTemplates={ppvTemplates}
                applyPpvTemplate={applyPpvTemplate}
                showAIPanel={showAIPanel}
                setShowAIPanel={setShowAIPanel}
                aiSuggestions={aiSuggestions}
                loadingSuggestions={loadingSuggestions}
                selectedFan={selectedFan}
                selectedCreatorId={selectedCreatorId}
                sendingMessage={sendingMessage}
                handleSendMessage={handleSendMessage}
                toggleAttachMedia={toggleAttachMedia}
              />
            )}
          </div>

          {/* Column 3: Customer CRM Profile Sidebar */}
          {selectedFan && (
            <div className="w-80 h-full flex-shrink-0">
              <CustomerProfile
                selectedFan={selectedFan}
                newTag={newTag}
                setNewTag={setNewTag}
                handleAddTag={handleAddTag}
                handleRemoveTag={handleRemoveTag}
                notesText={notesText}
                setNotesText={setNotesText}
                handleSaveNotes={handleSaveNotes}
                saving={saving}
                messages={messages}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

// Verified: Day 31 inline ai panel compile build check complete.
