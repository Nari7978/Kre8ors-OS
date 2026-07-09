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
            <div className="relative mb-3 aspect-video rounded-[10px] overflow-hidden border border-[#252A35] bg-zinc-950 flex flex-col items-center justify-center group/ppv">
              {/* Blurred background image or gradient */}
              <div 
                className="absolute inset-0 bg-cover bg-center filter blur-xl opacity-40 scale-110"
                style={{
                  backgroundImage: media.length > 0 
                    ? `url(${media[0]})` 
                    : `url('https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&q=80&w=400')`
                }}
              />
              <div className="absolute inset-0 bg-black/30" />
              
              {/* Lock badge in the center */}
              <div className="relative z-10 flex flex-col items-center gap-2">
                <div className="h-11 w-11 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-white backdrop-blur-sm shadow-md group-hover/ppv:scale-105 transition-transform duration-200">
                  <Lock className="h-5 w-5" />
                </div>
                {!isOwn && onUnlock && (
                  <button
                    onClick={() => onUnlock(message.id)}
                    disabled={isUnlocking}
                    className="mt-2 bg-[#7C5CFC] hover:bg-[#6c4ee2] text-white font-extrabold text-[11px] px-3.5 py-1.5 rounded-full transition-all shadow-lg flex items-center gap-1.5 backdrop-blur-sm active:scale-95 animate-pulse"
                  >
                    {isUnlocking ? (
                      <span className="animate-spin border-2 border-white border-t-transparent rounded-full h-3 w-3" />
                    ) : (
                      <span>Unlock for ${Number(message.price).toFixed(2)}</span>
                    )}
                  </button>
                )}
                {isOwn && (
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 bg-black/50 px-2.5 py-1 rounded-full border border-white/5">
                    Locked Offer • ${Number(message.price).toFixed(2)}
                  </span>
                )}
              </div>
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
