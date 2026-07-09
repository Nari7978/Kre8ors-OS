import React, { useState } from 'react';
import { 
  User, 
  DollarSign, 
  X, 
  Plus, 
  Calendar, 
  Video, 
  VolumeX, 
  Pin, 
  Tag, 
  Ban, 
  BellOff, 
  MapPin, 
  Hash, 
  HelpCircle,
  Check
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Fan } from '@/types';
import { getTagStyles } from '@/app/messages/page';

interface CustomerProfileProps {
  selectedFan: Fan | null;
  newTag: string;
  setNewTag: (s: string) => void;
  handleAddTag: () => void;
  handleRemoveTag: (tag: string) => void;
  notesText: string;
  setNotesText: (s: string) => void;
  handleSaveNotes: () => void;
  saving: boolean;
  messages?: any[];
}

export default function CustomerProfile({
  selectedFan,
  newTag,
  setNewTag,
  handleAddTag,
  handleRemoveTag,
  notesText,
  setNotesText,
  handleSaveNotes,
  saving,
  messages = [],
}: CustomerProfileProps) {
  const [activeTab, setActiveTab] = useState<'crm' | 'media' | 'history'>('crm');
  const [isMuted, setIsMuted] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showTagInput, setShowTagInput] = useState(false);
  const [autoReply, setAutoReply] = useState(true);

  if (!selectedFan) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#94A3B8] text-sm bg-[#13161D] h-full">
        <User className="h-8 w-8 text-[#252A35]" />
        <span>Select a subscriber to view CRM profile</span>
      </div>
    );
  }

  // Filter messages for media gallery
  const mediaMessages = messages.filter((m) => m.mediaUrls && m.mediaUrls.length > 0);
  const mediaUrls = mediaMessages.flatMap((m) => m.mediaUrls);

  // Parse custom tags safely
  let parsedTags: string[] = [];
  if (Array.isArray(selectedFan.customTags)) {
    parsedTags = selectedFan.customTags;
  } else {
    try {
      parsedTags = JSON.parse((selectedFan.customTags as any) || '[]');
    } catch {
      parsedTags = [];
    }
  }

  // Helper to calculate duration since subscription
  const getSubscribedDuration = (dateStr: string | Date) => {
    const subDate = new Date(dateStr);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - subDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 30) {
      return `${diffDays} Days Ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} Month${months > 1 ? 's' : ''} Ago`;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col h-full bg-[#13161D] border-l border-[#252A35] select-none"
    >
      {/* Tab Selectors */}
      <div className="flex border-b border-[#252A35] px-2 bg-[#13161D] h-14 items-end">
        {(['crm', 'media', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 pb-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
              activeTab === tab
                ? 'border-[#7C5CFC] text-white'
                : 'border-transparent text-[#94A3B8] hover:text-white'
            }`}
          >
            {tab === 'crm' ? 'CRM Info' : tab === 'media' ? 'Media' : 'Purchases'}
          </button>
        ))}
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {activeTab === 'crm' && (
          <>
            {/* About Profile Summary */}
            <div className="text-center">
              <div className="relative h-20 w-20 rounded-full bg-[#181B23] border border-[#252A35] flex items-center justify-center overflow-hidden mx-auto mb-3 shadow-lg">
                {selectedFan.avatarUrl ? (
                  <img src={selectedFan.avatarUrl} alt={selectedFan.displayName} className="object-cover h-full w-full" />
                ) : (
                  <User className="h-10 w-10 text-[#94A3B8]" />
                )}
                {selectedFan.isSubscriber && (
                  <div className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-[#16C784] border-2 border-[#13161D]" />
                )}
              </div>
              <div className="flex items-center justify-center gap-1.5">
                <h3 className="font-bold text-white text-base tracking-tight">{selectedFan.displayName}</h3>
                {selectedFan.isSubscriber && (
                  <span className="text-[9px] font-black text-[#7C5CFC] bg-[#7C5CFC]/10 border border-[#7C5CFC]/25 px-1.5 py-0.5 rounded-[4px] uppercase tracking-wide">VIP</span>
                )}
              </div>
              <p className="text-xs text-[#94A3B8]/80 mt-0.5">@{selectedFan.username}</p>
              <span className="inline-flex items-center gap-1 text-[10px] text-[#16C784] font-semibold mt-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[#16C784]" /> Online
              </span>
            </div>

            {/* CRM Stats Grid Table */}
            <div className="bg-[#181B23]/40 border border-[#252A35]/60 rounded-[12px] p-4 space-y-3.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#94A3B8] font-medium">User ID</span>
                <span className="font-bold text-zinc-300">#12{selectedFan.id.substring(0, 4)}</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#252A35]/30 pt-2.5">
                <span className="text-[#94A3B8] font-medium">Total Spent</span>
                <span className="font-extrabold text-[#16C784] flex items-center">
                  ${Number(selectedFan.totalSpent || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between items-center border-t border-[#252A35]/30 pt-2.5">
                <span className="text-[#94A3B8] font-medium">Location</span>
                <span className="font-semibold text-zinc-300">United States</span>
              </div>
              <div className="flex justify-between items-center border-t border-[#252A35]/30 pt-2.5">
                <span className="text-[#94A3B8] font-medium">Subscribed</span>
                <span className="font-semibold text-zinc-300">{getSubscribedDuration(selectedFan.subscribedAt)}</span>
              </div>
            </div>

            {/* Grid of Chat Actions */}
            <div className="space-y-2.5">
              <span className="text-[11px] font-black uppercase tracking-wider text-[#94A3B8]">Chat Actions</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] border text-xs font-bold transition-all ${
                    isMuted 
                      ? 'bg-[#FF5B5B]/10 border-[#FF5B5B]/20 text-[#FF5B5B]' 
                      : 'bg-[#181B23] border-[#252A35] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <BellOff className="h-3.5 w-3.5" />
                  {isMuted ? 'Muted' : 'Mute Chat'}
                </button>
                <button 
                  onClick={() => setIsPinned(!isPinned)}
                  className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] border text-xs font-bold transition-all ${
                    isPinned 
                      ? 'bg-[#7C5CFC]/10 border-[#7C5CFC]/20 text-[#7C5CFC]' 
                      : 'bg-[#181B23] border-[#252A35] text-[#94A3B8] hover:text-white'
                  }`}
                >
                  <Pin className="h-3.5 w-3.5" />
                  {isPinned ? 'Pinned' : 'Pin Chat'}
                </button>
                <button 
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] bg-[#181B23] border border-[#252A35] text-xs font-bold text-[#94A3B8] hover:text-white transition-all"
                >
                  <Tag className="h-3.5 w-3.5" />
                  Add Tag
                </button>
                <button 
                  onClick={() => alert('Block user action simulated successfully')}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-[8px] bg-[#181B23] border border-[#252A35] text-xs font-bold text-[#FF5B5B] hover:bg-[#FF5B5B]/5 transition-all"
                >
                  <Ban className="h-3.5 w-3.5" />
                  Block User
                </button>
              </div>
            </div>

            {/* Custom tags */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#94A3B8]">Tags</span>
                <button 
                  onClick={() => setShowTagInput(!showTagInput)}
                  className="text-[#7C5CFC] hover:text-[#8d71fd] p-0.5"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              
              <div className="flex flex-wrap gap-1.5">
                {parsedTags.length === 0 ? (
                  <span className="text-xs text-[#94A3B8]/60 italic">No tags added yet</span>
                ) : (
                  parsedTags.map((tag) => {
                    const styles = getTagStyles(tag);
                    return (
                      <span
                        key={tag}
                        className={`text-[10px] font-bold border pl-2 pr-1.5 py-0.5 rounded-[4px] flex items-center gap-1 ${styles.bg}`}
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-[#94A3B8] hover:text-white rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>

              {/* Tag Add input toggle container */}
              {showTagInput && (
                <div className="flex items-center gap-2 mt-2">
                  <input
                    type="text"
                    placeholder="Enter custom tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                    className="flex-1 bg-[#181B23] border border-[#252A35] rounded-[8px] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#7C5CFC] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => { handleAddTag(); setShowTagInput(false); }}
                    className="bg-[#7C5CFC] hover:bg-[#6c4ee2] text-white p-2 rounded-[8px] transition-colors flex items-center justify-center h-8 w-8"
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>

            {/* Operator Notes */}
            <div className="space-y-2.5 flex flex-col">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#94A3B8]">Notes</span>
                <button className="text-[#7C5CFC] hover:text-[#8d71fd] p-0.5">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <textarea
                placeholder="Record preferences, locks purchased, or special chatter requests..."
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full h-24 bg-[#181B23] border border-[#252A35] rounded-[10px] p-3 text-xs text-white placeholder-[#94A3B8]/40 focus:outline-none focus:border-[#7C5CFC] resize-none transition-colors"
              />
              <button
                type="button"
                onClick={handleSaveNotes}
                disabled={saving}
                className="w-full bg-[#7C5CFC] hover:bg-[#6c4ee2] disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold py-2.5 rounded-[8px] text-xs transition-colors"
              >
                {saving ? 'Saving...' : 'Save Notes & Tags'}
              </button>
            </div>

            {/* Automation toggle panel */}
            <div className="space-y-2.5 border-t border-[#252A35] pt-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-black uppercase tracking-wider text-[#94A3B8]">Automation</span>
                <button className="text-[#7C5CFC] hover:text-[#8d71fd] p-0.5">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <div className="bg-[#181B23]/40 border border-[#252A35]/60 rounded-[12px] p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-zinc-300 font-bold">Auto Reply</span>
                  <button 
                    onClick={() => setAutoReply(!autoReply)}
                    className={`h-5 w-9 rounded-full transition-colors flex items-center px-0.5 cursor-pointer ${
                      autoReply ? 'bg-[#7C5CFC]' : 'bg-zinc-700'
                    }`}
                  >
                    <motion.div 
                      layout
                      className="h-4 w-4 rounded-full bg-white shadow-sm"
                      animate={{ x: autoReply ? 16 : 0 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    />
                  </button>
                </div>
                <div className="flex flex-col text-xs border-t border-[#252A35]/30 pt-3.5">
                  <span className="text-[#94A3B8] font-medium">Current Campaign</span>
                  <span className="font-black text-[#7C5CFC] hover:underline cursor-pointer mt-0.5">VIP Drip Campaign</span>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'media' && (
          <div className="space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">Shared Gallery ({mediaUrls.length})</span>
            {mediaUrls.length === 0 ? (
              <div className="text-center py-8 text-[#94A3B8] text-xs italic">No media shared in this chat</div>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {mediaUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="aspect-square bg-[#181B23] border border-[#252A35] rounded-[8px] overflow-hidden hover:opacity-85 transition-opacity"
                  >
                    {url.match(/\.(mp4|webm|mov|avi)/i) ? (
                      <div className="h-full w-full flex items-center justify-center relative">
                        <Video className="h-5 w-5 text-[#94A3B8]" />
                      </div>
                    ) : (
                      <img src={url} alt="shared" className="h-full w-full object-cover" />
                    )}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">Purchase Records</span>
            {messages.filter((m) => m.isTip || (m.price && m.price > 0)).length === 0 ? (
              <div className="text-center py-8 text-[#94A3B8] text-xs italic">No transactions recorded for this fan</div>
            ) : (
              <div className="space-y-2">
                {messages
                  .filter((m) => m.isTip || (m.price && m.price > 0))
                  .map((m) => (
                    <div key={m.id} className="bg-[#181B23] border border-[#252A35] p-3 rounded-[10px] flex items-center justify-between text-xs">
                      <div>
                        <span className="font-bold block text-white">{m.isTip ? 'Tip Unlock' : 'PPV Message Unlock'}</span>
                        <span className="text-[10px] text-[#94A3B8] block mt-0.5">{new Date(m.sentAt).toLocaleDateString()}</span>
                      </div>
                      <span className="text-sm font-extrabold text-[#16C784]">
                        +${Number(m.tipAmount > 0 ? m.tipAmount : m.price || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
