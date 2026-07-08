import React, { useState } from 'react';
import { Search, Plus, Filter, MessageSquare, AlertCircle, Heart, Star, Archive, EyeOff, Save, Pin, Film } from 'lucide-react';
import { Creator } from '@/types';

interface ChatSidebarProps {
  selectedCreatorId: string;
  setSelectedCreatorId: (id: string) => void;
  creators: Creator[];
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  onNewChat?: () => void;
}

export default function ChatSidebar({
  selectedCreatorId,
  setSelectedCreatorId,
  creators,
  searchQuery,
  setSearchQuery,
  onNewChat,
}: ChatSidebarProps) {
  const [activeFilter, setActiveFilter] = useState('all');

  const filterTabs = [
    { id: 'all', label: 'All Chats', icon: MessageSquare },
    { id: 'unread', label: 'Unread', icon: AlertCircle },
    { id: 'vip', label: 'VIP / High Spend', icon: Star },
    { id: 'muted', label: 'Muted', icon: EyeOff },
    { id: 'archived', label: 'Archived', icon: Archive },
    { id: 'saved', label: 'Saved Replies', icon: Save },
    { id: 'pinned', label: 'Pinned', icon: Pin },
    { id: 'media', label: 'Media shared', icon: Film },
  ];

  return (
    <div className="w-80 border-r border-[#252A35] bg-[#13161D] flex flex-col h-full select-none flex-shrink-0">
      {/* Creator Context Selector */}
      <div className="p-4 border-b border-[#252A35] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <span className="text-xs uppercase tracking-wider font-extrabold text-[#94A3B8]">Active Workspace</span>
          <button
            onClick={onNewChat}
            className="p-1 hover:bg-[#252A35] text-[#7C5CFC] hover:text-white rounded transition-colors flex items-center gap-1 text-[11px] font-bold"
          >
            <Plus className="h-3.5 w-3.5" /> New Chat
          </button>
        </div>

        <select
          value={selectedCreatorId}
          onChange={(e) => setSelectedCreatorId(e.target.value)}
          className="w-full bg-[#181B23] border border-[#252A35] rounded-[8px] px-3 py-2 text-xs text-white focus:outline-none focus:border-[#7C5CFC] cursor-pointer font-semibold transition-colors"
        >
          <option value="" className="bg-[#181B23]">Select Creator Workspace...</option>
          {creators.map((c) => (
            <option key={c.id} value={c.id} className="bg-[#181B23]">
              @{c.username} ({c.displayName})
            </option>
          ))}
        </select>

        {/* Search Subscribers */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]/60" />
          <input
            type="text"
            placeholder="Search fans, notes, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#181B23] border border-[#252A35] rounded-[8px] py-2 pl-9 pr-4 text-xs text-white placeholder-[#94A3B8]/30 focus:outline-none focus:border-[#7C5CFC] transition-colors"
          />
        </div>
      </div>

      {/* Slack/Discord-inspired Chat Filters checklist */}
      <div className="p-2 border-b border-[#252A35] max-h-[160px] overflow-y-auto">
        <span className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8] px-2 block mb-1.5">Filters</span>
        <div className="grid grid-cols-2 gap-1">
          {filterTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveFilter(tab.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-[6px] text-[11px] font-bold transition-all text-left ${
                  isActive
                    ? 'bg-[#7C5CFC] text-white'
                    : 'text-[#94A3B8] hover:bg-[#181B23] hover:text-white'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
