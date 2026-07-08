import React, { useState } from 'react';
import { Lock, Unlock, Download, MoreVertical, Heart, AlertCircle } from 'lucide-react';
import { Message } from '@/types';
import QueueBadge from './QueueBadge';
import MessageActions from './MessageActions';

interface MessageBubbleProps {
  message: Message;
  onUnlock?: (id: string) => void;
  isUnlocking?: boolean;
  onActionsSelect?: (action: string, msg: Message) => void;
}

export default function MessageBubble({
  message,
  onUnlock,
  isUnlocking = false,
  onActionsSelect,
}: MessageBubbleProps) {
  const isOwn = message.direction === 'out';
  const isLocked = !message.isPurchased && Number(message.price || 0) > 0;
  const [showActions, setShowActions] = useState(false);

  // Parse media if it's a string from Database (sometimes database stores JSON strings)
  let media: string[] = [];
  if (Array.isArray(message.mediaUrls)) {
    media = message.mediaUrls;
  } else {
    try {
      media = JSON.parse((message.mediaUrls as any) || '[]');
    } catch {
      media = [];
    }
  }

  const formatTime = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`flex w-full ${isOwn ? 'justify-end' : 'justify-start'} mb-3.5 group relative`}>
      <div className="relative max-w-[70%]">
        {/* Message bubble card */}
        <div
          className={`rounded-[14px] px-4 py-3 shadow-md border relative transition-all ${
            isOwn
              ? 'bg-[#7C5CFC] border-[#7C5CFC]/20 text-white rounded-tr-none'
              : 'bg-[#181B23] border-[#252A35] text-zinc-100 rounded-tl-none'
          }`}
        >
          {/* Locked overlay for pay-per-view content */}
          {isLocked && (
            <div className="mb-3 bg-black/40 border border-[#252A35] rounded-[10px] p-4 flex flex-col items-center text-center">
              <div className="h-10 w-10 rounded-full bg-[#FFC857]/10 flex items-center justify-center mb-2">
                <Lock className="h-5 w-5 text-[#FFC857]" />
              </div>
              <span className="text-xs font-extrabold text-white block">Locked Pay-Per-View Content</span>
              <span className="text-sm font-black text-[#16C784] mt-1 block">
                Price: ${Number(message.price).toFixed(2)}
              </span>
              {!isOwn && onUnlock && (
                <button
                  onClick={() => onUnlock(message.id)}
                  disabled={isUnlocking}
                  className="mt-3 bg-[#16C784] hover:bg-[#12a16a] disabled:opacity-50 text-[#0F1117] font-black text-xs px-4 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                >
                  {isUnlocking ? (
                    <span className="animate-spin border-2 border-[#0F1117] border-t-transparent rounded-full h-3.5 w-3.5" />
                  ) : (
                    <Unlock className="h-3.5 w-3.5" />
                  )}
                  Unlock PPV Message
                </button>
              )}
            </div>
          )}

          {/* Media Attachments */}
          {!isLocked && media.length > 0 && (
            <div className={`grid gap-1.5 mb-2.5 ${media.length > 1 ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {media.map((url, idx) => {
                const isVideo = url.match(/\.(mp4|webm|mov|avi)/i);
                return (
                  <div key={idx} className="relative aspect-video rounded-[10px] overflow-hidden bg-black/20 border border-white/5">
                    {isVideo ? (
                      <video src={url} controls className="h-full w-full object-cover" />
                    ) : (
                      <img src={url} alt="attachment" className="h-full w-full object-cover" />
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Tip notification overlay */}
          {Number(message.tipAmount || 0) > 0 && (
            <div className="mb-2 bg-[#16C784]/10 border border-[#16C784]/20 rounded-[8px] px-3 py-1.5 flex items-center gap-2 text-xs text-[#16C784] font-bold">
              <span>🎉 Tip Attached: ${Number(message.tipAmount).toFixed(2)}</span>
            </div>
          )}

          {/* Text body */}
          {message.text && (
            <p className="text-sm font-medium leading-relaxed whitespace-pre-wrap select-text">{message.text}</p>
          )}

          {/* Footer containing timestamp and status */}
          <div className="flex items-center justify-end gap-1.5 mt-1.5 text-[10px] opacity-70 select-none">
            <span>{formatTime(message.sentAt)}</span>
            {isOwn && (
              <QueueBadge status={message.isPurchased ? 'seen' : 'delivered'} />
            )}
          </div>
        </div>

        {/* Hover actions menu */}
        <div className="absolute right-0 top-0 -mt-2 -mr-2 hidden group-hover:block z-10">
          <button
            onClick={() => setShowActions(!showActions)}
            className="p-1 bg-[#181B23] hover:bg-[#252A35] border border-[#252A35] text-[#94A3B8] hover:text-white rounded-full shadow-md transition-colors"
          >
            <MoreVertical className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Actions panel */}
        {showActions && (
          <div className="absolute right-0 top-6 z-25">
            <MessageActions
              isOwn={isOwn}
              onReply={() => { onActionsSelect?.('reply', message); setShowActions(false); }}
              onForward={() => { onActionsSelect?.('forward', message); setShowActions(false); }}
              onPin={() => { onActionsSelect?.('pin', message); setShowActions(false); }}
              onLike={() => { onActionsSelect?.('like', message); setShowActions(false); }}
              onDelete={() => { onActionsSelect?.('delete', message); setShowActions(false); }}
              onEdit={() => { onActionsSelect?.('edit', message); setShowActions(false); }}
              onTag={() => { onActionsSelect?.('tag', message); setShowActions(false); }}
            />
          </div>
        )}
      </div>
    </div>
  );
}
