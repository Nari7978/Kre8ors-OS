import React, { useState } from 'react';
import { User, DollarSign, X, Plus, Calendar, FileText, Activity, ShieldAlert, Image, Video, Award } from 'lucide-react';
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

  if (!selectedFan) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-[#94A3B8] text-sm gap-2 bg-[#13161D] h-full">
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

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col h-full bg-[#13161D] border-l border-[#252A35]"
    >
      {/* Bio Header */}
      <div className="p-5 text-center border-b border-[#252A35] bg-[#0F1117]/20">
        <div className="relative h-20 w-20 rounded-full bg-[#181B23] border-2 border-[#7C5CFC] flex items-center justify-center overflow-hidden mx-auto mb-3 shadow-lg">
          {selectedFan.avatarUrl ? (
            <img src={selectedFan.avatarUrl} alt={selectedFan.displayName} className="object-cover h-full w-full" />
          ) : (
            <User className="h-10 w-10 text-[#94A3B8]" />
          )}
          {selectedFan.isSubscriber && (
            <div className="absolute bottom-0 right-0 h-4 w-4 rounded-full bg-[#16C784] border-2 border-[#13161D]" />
          )}
        </div>
        <h3 className="font-bold text-white text-base tracking-tight">{selectedFan.displayName}</h3>
        <p className="text-xs text-[#94A3B8] mt-0.5">@{selectedFan.username}</p>

        {/* Spend & Sub Info */}
        <div className="mt-4 grid grid-cols-2 gap-2 bg-[#181B23] border border-[#252A35] p-3 rounded-[12px]">
          <div className="text-left border-r border-[#252A35] pr-2">
            <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Lifetime Spent</span>
            <span className="text-sm font-extrabold text-[#16C784] flex items-center mt-0.5">
              <DollarSign className="h-3.5 w-3.5" />
              {Number(selectedFan.totalSpent || 0).toFixed(2)}
            </span>
          </div>
          <div className="text-left pl-2 flex flex-col justify-center">
            <span className="text-[10px] text-[#94A3B8] uppercase font-bold block">Status</span>
            <span className={`text-[11px] font-bold mt-0.5 ${selectedFan.isSubscriber ? 'text-[#16C784]' : 'text-[#FF5B5B]'}`}>
              {selectedFan.isSubscriber ? 'Active Sub' : 'Expired'}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-[#252A35] px-2 bg-[#13161D]">
        {(['crm', 'media', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-xs font-bold uppercase tracking-wider border-b-2 text-center transition-all ${
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
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {activeTab === 'crm' && (
          <>
            {/* Custom tags */}
            <div className="space-y-2.5">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">Subscriber Tags</span>
              <div className="flex flex-wrap gap-1.5">
                {parsedTags.length === 0 ? (
                  <span className="text-xs text-[#94A3B8] italic">No custom tags added</span>
                ) : (
                  parsedTags.map((tag) => {
                    const styles = getTagStyles(tag);
                    return (
                      <span
                        key={tag}
                        className={`text-[11px] font-bold border pl-2.5 pr-1.5 py-1 rounded-[8px] flex items-center gap-1.5 ${styles.bg}`}
                      >
                        #{tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="text-[#94A3B8] hover:text-white rounded-full p-0.5 transition-colors"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })
                )}
              </div>

              {/* Tag Add composer */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Add custom tag..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                  className="flex-1 bg-[#181B23] border border-[#252A35] rounded-[8px] px-3 py-1.5 text-xs text-white focus:outline-none focus:border-[#7C5CFC] transition-colors"
                />
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="bg-[#7C5CFC] hover:bg-[#6c4ee2] text-white p-2 rounded-[8px] transition-colors flex items-center justify-center"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Operator Notes */}
            <div className="space-y-2.5 flex flex-col">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">CRM Operator Notes</span>
              <textarea
                placeholder="Record preferences, locks purchased, or special chatter requests..."
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                className="w-full h-32 bg-[#181B23] border border-[#252A35] rounded-[10px] p-3 text-xs text-white placeholder-[#94A3B8]/50 focus:outline-none focus:border-[#7C5CFC] resize-none transition-colors"
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

            {/* Sub Info */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-[#94A3B8]">Details</span>
              <div className="space-y-2 bg-[#181B23] border border-[#252A35] rounded-[10px] p-3.5 text-xs text-zinc-300">
                <div className="flex justify-between items-center">
                  <span className="text-[#94A3B8] flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Subscribed</span>
                  <span className="font-semibold text-white">
                    {new Date(selectedFan.subscribedAt).toLocaleDateString()}
                  </span>
                </div>
                {selectedFan.expiresAt && (
                  <div className="flex justify-between items-center border-t border-[#252A35] pt-2 mt-2">
                    <span className="text-[#94A3B8] flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Renews/Expires</span>
                    <span className="font-semibold text-white">
                      {new Date(selectedFan.expiresAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
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
