import React from 'react';
import { User, Phone, Search, MoreHorizontal, RefreshCw, Sparkles, MessageSquare } from 'lucide-react';
import { Fan, Creator, Message } from '@/types';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';

interface ConversationProps {
  selectedFan: Fan | null;
  activeCreator: Creator | null;
  messages: Message[];
  loadingMessages: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  isTyping?: boolean;
  messagesContainerRef: React.RefObject<HTMLDivElement | null>;
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
  onUnlockMessage?: (id: string) => void;
  unlockingMessageId?: string | null;
  onActionsSelect?: (action: string, msg: Message) => void;
}

const formatDateHeader = (dateStr: string | Date) => {
  const d = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (d.toDateString() === today.toDateString()) {
    return 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    return 'Yesterday';
  } else {
    return d.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  }
};

export default function Conversation({
  selectedFan,
  activeCreator,
  messages,
  loadingMessages,
  loadingMore,
  hasMore,
  isTyping = false,
  messagesContainerRef,
  messagesEndRef,
  onUnlockMessage,
  unlockingMessageId = null,
  onActionsSelect,
}: ConversationProps) {
  if (!selectedFan) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#94A3B8] text-sm bg-[#0F1117]">
        <div className="h-14 w-14 rounded-full bg-[#181B23] border border-[#252A35] flex items-center justify-center mb-3">
          <MessageSquare className="h-6 w-6 text-[#7C5CFC]" />
        </div>
        <span className="font-semibold text-white">No Chat Selected</span>
        <p className="text-xs text-[#94A3B8] mt-1">Choose a fan profile from the sidebar directory to load chat stream.</p>
      </div>
    );
  }

  // Group messages by date headers
  const groupedMessages: { [key: string]: Message[] } = {};
  messages.forEach((msg) => {
    const header = formatDateHeader(msg.sentAt);
    if (!groupedMessages[header]) {
      groupedMessages[header] = [];
    }
    groupedMessages[header].push(msg);
  });

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0F1117] min-w-0">
      {/* Active Conversation header */}
      <div className="h-16 border-b border-[#252A35] px-6 bg-[#13161D] flex items-center justify-between flex-shrink-0 select-none">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-[#181B23] border border-[#252A35] flex items-center justify-center overflow-hidden relative">
            {selectedFan.avatarUrl ? (
              <img src={selectedFan.avatarUrl} alt={selectedFan.displayName} className="object-cover h-full w-full" />
            ) : (
              <User className="h-5 w-5 text-[#94A3B8]" />
            )}
            {selectedFan.isSubscriber && (
              <div className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-[#16C784] border border-[#13161D]" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-sm text-white tracking-tight">{selectedFan.displayName}</span>
              {selectedFan.isSubscriber && (
                <span className="text-[9px] font-bold text-[#16C784] bg-[#16C784]/15 px-1.5 py-0.5 rounded-[4px] uppercase">VIP</span>
              )}
            </div>
            <p className="text-[10px] text-[#94A3B8] mt-0.5">
              {isTyping ? (
                <span className="text-[#7C5CFC] font-semibold animate-pulse">subscriber typing...</span>
              ) : selectedFan.isSubscriber ? (
                'Subscribed • Online'
              ) : (
                'Subscription Expired'
              )}
            </p>
          </div>
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-3 text-[#94A3B8]">
          <button className="p-1.5 hover:bg-[#252A35] hover:text-white rounded-[8px] transition-colors">
            <Search className="h-4.5 w-4.5" />
          </button>
          <button className="p-1.5 hover:bg-[#252A35] hover:text-white rounded-[8px] transition-colors">
            <MoreHorizontal className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Main chat log body */}
      <div
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto px-6 py-4 space-y-4"
      >
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full text-xs text-[#94A3B8] gap-2 select-none">
            <RefreshCw className="h-4 w-4 animate-spin text-[#7C5CFC]" /> Loading conversation logs...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center p-6 text-[#94A3B8] select-none">
            <Sparkles className="h-7 w-7 text-[#FFC857]/50 mb-2" />
            <span className="text-xs font-semibold text-zinc-300">No message history with {selectedFan.displayName}</span>
            <p className="text-[11px] text-[#94A3B8] mt-1 max-w-[280px]">Be the first to say hello, or generate a custom PPV offer templates below.</p>
          </div>
        ) : (
          <>
            {/* Infinite loading top spinner */}
            {loadingMore && (
              <div className="py-2 text-center text-[10px] text-[#94A3B8] flex items-center justify-center gap-1.5 select-none">
                <RefreshCw className="h-3.5 w-3.5 animate-spin text-[#7C5CFC]" /> Paginating history...
              </div>
            )}

            {Object.keys(groupedMessages).map((dateHeader) => (
              <div key={dateHeader} className="space-y-3.5">
                {/* Date separator line */}
                <div className="flex items-center justify-center my-4 select-none">
                  <div className="h-[1px] bg-[#252A35] flex-1" />
                  <span className="mx-3.5 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider bg-[#0F1117] px-2.5">
                    {dateHeader}
                  </span>
                  <div className="h-[1px] bg-[#252A35] flex-1" />
                </div>

                {groupedMessages[dateHeader].map((msg) => (
                  <MessageBubble
                    key={msg.id}
                    message={msg}
                    onUnlock={onUnlockMessage}
                    isUnlocking={unlockingMessageId === msg.id}
                    onActionsSelect={onActionsSelect}
                  />
                ))}
              </div>
            ))}

            {/* Bouncing dots typing simulator */}
            {isTyping && (
              <div className="flex justify-start pl-2 py-2">
                <TypingIndicator />
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>
    </div>
  );
}
