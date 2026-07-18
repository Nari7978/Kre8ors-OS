import React from 'react';
import { User, DollarSign, Pin, VolumeX, RefreshCw } from 'lucide-react';
import { Fan } from '@/types';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatListProps {
  fans: Fan[];
  selectedFan: Fan | null;
  setSelectedFan: (fan: Fan) => void;
  loadingFans: boolean;
}

export default function ChatList({ fans, selectedFan, setSelectedFan, loadingFans }: ChatListProps) {
  const [readChatIds, setReadChatIds] = React.useState(new Set());

  React.useEffect(() => {
    if (selectedFan) {
      setReadChatIds((prev) => {
        const next = new Set(prev);
        next.add(selectedFan.id);
        return next;
      });
    }
  }, [selectedFan]);
  return (
    <div className="flex-1 overflow-y-auto bg-[#13161D]">
      {loadingFans ? (
        <div className="p-6 text-center text-xs text-[#94A3B8] flex items-center justify-center gap-2 select-none">
          <RefreshCw className="h-4 w-4 animate-spin text-[#7C5CFC]" /> Loading subscriber list...
        </div>
      ) : fans.length === 0 ? (
        <div className="p-6 text-center text-xs text-[#94A3B8] select-none italic">No subscribers matches found</div>
      ) : (
        <div className="divide-y divide-[#252A35]/30">
          <AnimatePresence mode="popLayout">
            {fans.map((fan, index) => {
              const isSelected = selectedFan?.id === fan.id;
              // Mock states for demo indicators
              const isPinned = index === 0 || index === 2;
              const isMuted = index === 1;
              const hasBeenRead = readChatIds.has(fan.id) || isSelected;
              const unreadCount = hasBeenRead ? null : (index === 0 ? '4+' : index === 2 ? '2' : null);

              return (
                <motion.div
                  key={fan.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.15, delay: Math.min(index * 0.02, 0.2) }}
                >
                  <button
                    onClick={() => setSelectedFan(fan)}
                    className={`w-full p-4 text-left flex items-start gap-3.5 transition-all relative border-l-4 ${
                      isSelected
                        ? 'bg-[#181B23] border-[#7C5CFC] shadow-sm'
                        : 'hover:bg-[#181B23]/40 border-transparent text-[#94A3B8] hover:text-white'
                    }`}
                  >
                    {/* Avatar with status indicator */}
                    <div className="h-10 w-10 rounded-full bg-[#0F1117] border border-[#252A35] flex items-center justify-center overflow-hidden flex-shrink-0 relative">
                      {fan.avatarUrl ? (
                        <img src={fan.avatarUrl} alt={fan.displayName} className="object-cover h-full w-full" />
                      ) : (
                        <User className="h-5 w-5 text-[#94A3B8]" />
                      )}
                      {fan.isSubscriber && (
                        <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#16C784] border-2 border-[#13161D]" />
                      )}
                    </div>

                    {/* Meta info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-sm text-white truncate max-w-[120px] tracking-tight">
                          {fan.displayName}
                        </span>
                        <span className="text-[10px] font-black text-[#16C784] bg-[#16C784]/10 px-2 py-0.5 rounded-full flex items-center gap-0.5 border border-[#16C784]/15 flex-shrink-0">
                          <DollarSign className="h-3 w-3" />
                          {Number(fan.totalSpent || 0).toFixed(0)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between mt-1">
                        <p className="text-[11px] text-[#94A3B8] truncate">@{fan.username}</p>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[9px] text-[#94A3B8] font-semibold">10:30 AM</span>
                          {unreadCount && (
                            <span className="bg-[#7C5CFC] text-white text-[9px] font-black rounded-full h-4.5 min-w-4.5 px-1.5 flex items-center justify-center shadow-sm animate-pulse">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Snippet summary info */}
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {isPinned && (
                          <span className="text-[9px] font-bold text-[#7C5CFC] bg-[#7C5CFC]/15 px-1.5 py-0.5 rounded-[4px] flex items-center gap-0.5">
                            <Pin className="h-2.5 w-2.5" /> Pinned
                          </span>
                        )}
                        {isMuted && (
                          <span className="text-[9px] font-bold text-[#FF5B5B] bg-[#FF5B5B]/15 px-1.5 py-0.5 rounded-[4px] flex items-center gap-0.5">
                            <VolumeX className="h-2.5 w-2.5" /> Muted
                          </span>
                        )}
                        <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-[4px] uppercase ${
                          fan.isSubscriber ? 'text-[#16C784] bg-[#16C784]/10' : 'text-[#FF5B5B] bg-[#FF5B5B]/10'
                        }`}>
                          {fan.isSubscriber ? 'Active' : 'Expired'}
                        </span>
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
