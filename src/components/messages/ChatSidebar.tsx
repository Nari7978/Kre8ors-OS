import React, { useState } from 'react';
import { Search, Plus, SlidersHorizontal, Filter } from 'lucide-react';
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

  const filters = [
    { id: 'all', label: 'All', count: 128 },
    { id: 'unread', label: 'Unread', count: 18 },
    { id: 'vip', label: 'VIP', count: 16 },
  ];

  return (
    <div className="flex flex-col flex-shrink-0">
      {/* Header */}
      <div className="h-14 px-4 flex items-center justify-between border-b border-[#1A1D25] flex-shrink-0">
        <span className="text-[14px] font-bold text-white">List Chats</span>
        <button className="p-1.5 hover:bg-[#14171E] rounded-[6px] text-[#5A6070] hover:text-[#94A3B8] transition-colors">
          <SlidersHorizontal className="h-4 w-4" />
        </button>
      </div>

      {/* Search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#5A6070]" />
          <input
            type="text"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#14171E] border border-[#1E222B] rounded-[8px] py-2 pl-8 pr-3 text-[12px] text-white placeholder-[#5A6070] focus:outline-none focus:border-[#7C5CFC]/50 transition-colors"
          />
        </div>

        {/* Filter pills */}
        <div className="flex items-center gap-1.5 mt-3 mb-2 select-none">
          {filters.map((f) => {
            const isActive = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className={`flex items-center gap-1 px-2 py-1 rounded-full text-[11px] font-semibold transition-all ${
                  isActive
                    ? 'bg-[#7C5CFC]/15 text-[#7C5CFC] border border-[#7C5CFC]/25'
                    : 'text-[#5A6070] border border-[#1E222B] hover:text-[#94A3B8] hover:border-[#252A35]'
                }`}
              >
                {f.label}
                <span className={`text-[10px] font-bold px-1 py-0 rounded-full ${
                  isActive ? 'bg-[#7C5CFC] text-white' : 'bg-[#1E222B] text-[#5A6070]'
                }`}>
                  {f.count}
                </span>
              </button>
            );
          })}
          <button className="h-6 w-6 rounded-full border border-[#1E222B] text-[#5A6070] hover:text-[#94A3B8] hover:border-[#252A35] flex items-center justify-center transition-colors flex-shrink-0">
            <Plus className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
