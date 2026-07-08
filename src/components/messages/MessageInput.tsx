import React, { useState } from 'react';
import { Paperclip, Smile, Send, RefreshCw, X, Folder, Lock, Sparkles, ChevronRight, Mic, Calendar, Heart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface MessageInputProps {
  messageText: string;
  setMessageText: (text: string) => void;
  attachedMedia: string[];
  setAttachedMedia: (media: string[]) => void;
  vaultOpen: boolean;
  setVaultOpen: (open: boolean) => void;
  vaultItemsList: any[];
  loadingVault: boolean;
  lockPrice: string;
  setLockPrice: (price: string) => void;
  showPpvPresets: boolean;
  setShowPpvPresets: (show: boolean) => void;
  ppvTemplates: any[];
  applyPpvTemplate: (tpl: any) => void;
  showAIPanel: boolean;
  setShowAIPanel: (show: boolean) => void;
  aiSuggestions: any[];
  loadingSuggestions: boolean;
  selectedFan: any;
  selectedCreatorId: string;
  sendingMessage: boolean;
  handleSendMessage: (e: React.FormEvent) => void;
  toggleAttachMedia: (url: string) => void;
}

export default function MessageInput({
  messageText,
  setMessageText,
  attachedMedia,
  setAttachedMedia,
  vaultOpen,
  setVaultOpen,
  vaultItemsList,
  loadingVault,
  lockPrice,
  setLockPrice,
  showPpvPresets,
  setShowPpvPresets,
  ppvTemplates,
  applyPpvTemplate,
  showAIPanel,
  setShowAIPanel,
  aiSuggestions,
  loadingSuggestions,
  selectedFan,
  selectedCreatorId,
  sendingMessage,
  handleSendMessage,
  toggleAttachMedia,
}: MessageInputProps) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const emojis = ['❤️', '🔥', '😘', '😈', '🥰', '✨', '📸', '💬', '🎉', '🎁'];

  return (
    <div className="p-4 border-t border-[#252A35] bg-[#13161D] relative space-y-3">
      {/* Attached Media Vault preview indicator */}
      {attachedMedia.length > 0 && (
        <div className="flex items-center gap-2.5 bg-[#181B23] border border-[#252A35] p-2 rounded-[10px]">
          <span className="text-xs text-[#94A3B8] flex-1 font-medium">Vault media file attached:</span>
          {attachedMedia.map((url, i) => (
            <div key={i} className="relative h-11 w-11 border border-[#252A35] rounded-[8px] overflow-hidden flex-shrink-0">
              <img src={url} className="object-cover h-full w-full" alt="preview" />
              <button
                type="button"
                onClick={() => setAttachedMedia([])}
                className="absolute top-0 right-0 bg-[#FF5B5B] text-white rounded-bl p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Quick AI & PPV suggestions line */}
      {selectedFan && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none select-none">
          <button
            type="button"
            onClick={() => setShowAIPanel(!showAIPanel)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[10px] font-bold transition-all whitespace-nowrap flex-shrink-0 border ${
              showAIPanel
                ? 'bg-[#7C5CFC]/20 border-[#7C5CFC]/30 text-[#7C5CFC]'
                : 'bg-[#181B23] border-[#252A35] text-[#94A3B8] hover:text-[#7C5CFC] hover:border-[#7C5CFC]/30'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            AI Assistant
          </button>
          <button
            type="button"
            onClick={() => setShowPpvPresets(!showPpvPresets)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-[10px] font-bold transition-all whitespace-nowrap flex-shrink-0 border ${
              showPpvPresets
                ? 'bg-[#FFC857]/20 border-[#FFC857]/30 text-[#FFC857]'
                : 'bg-[#181B23] border-[#252A35] text-[#94A3B8] hover:text-[#FFC857] hover:border-[#FFC857]/30'
            }`}
          >
            <Lock className="h-3.5 w-3.5" />
            PPV Templates
          </button>

          <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider whitespace-nowrap flex items-center gap-1.5 ml-2">
            <span className="h-1.5 w-1.5 rounded-full bg-[#7C5CFC] animate-pulse" />
            Smart Replies:
          </span>

          {loadingSuggestions ? (
            <span className="text-[10px] text-[#94A3B8] italic">Thinking...</span>
          ) : aiSuggestions.length === 0 ? (
            <span className="text-[10px] text-[#94A3B8] italic">No replies generated</span>
          ) : (
            <div className="flex items-center gap-1.5">
              {aiSuggestions.map((sug) => (
                <button
                  type="button"
                  key={sug.id}
                  onClick={() => setMessageText(sug.text)}
                  className="bg-[#181B23] border border-[#252A35] hover:border-[#7C5CFC] px-3 py-1 rounded-[12px] text-[10px] text-[#94A3B8] hover:text-white font-semibold transition-all max-w-[200px] truncate cursor-pointer"
                  title={sug.text}
                >
                  <strong className="text-[#7C5CFC] mr-1">{sug.label}:</strong>
                  {sug.text}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* PPV Templates container */}
      <AnimatePresence>
        {showPpvPresets && selectedFan && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.15 }}
            className="bg-[#181B23] border border-[#252A35] p-3.5 rounded-[12px] space-y-2.5 mt-2"
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-[#94A3B8] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Lock className="h-3.5 w-3.5 text-[#FFC857]" /> PPV Template Quick Loaders
              </span>
              <Link
                href="/messages/ppv-builder"
                className="text-[10px] font-bold text-[#7C5CFC] hover:underline flex items-center gap-0.5"
              >
                Template Builder <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
            {ppvTemplates.length === 0 ? (
              <p className="text-[11px] text-[#94A3B8] italic">No presets. Go to Template Builder to save rules.</p>
            ) : (
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {ppvTemplates.map((tpl) => (
                  <button
                    type="button"
                    key={tpl.id}
                    onClick={() => applyPpvTemplate(tpl)}
                    className="bg-[#0F1117] hover:bg-[#13161D] border border-[#252A35] p-2.5 rounded-[10px] text-left min-w-[140px] max-w-[180px] transition-all flex flex-col gap-1 cursor-pointer"
                  >
                    <span className="text-[10px] font-bold text-white truncate w-full">{tpl.name}</span>
                    <span className="text-[9px] text-[#16C784] font-extrabold">${Number(tpl.price).toFixed(2)}</span>
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Form Composer Input Bar */}
      <form onSubmit={handleSendMessage} className="flex items-center gap-2 relative">
        {/* Attachment menu button */}
        <button
          type="button"
          onClick={() => setVaultOpen(!vaultOpen)}
          className={`p-3 rounded-[10px] border transition-colors flex-shrink-0 ${
            vaultOpen ? 'bg-[#7C5CFC] border-[#7C5CFC]/20 text-white' : 'bg-[#181B23] border-[#252A35] text-[#94A3B8] hover:text-white'
          }`}
          title="Attach media from Vault"
        >
          <Paperclip className="h-4 w-4" />
        </button>

        {/* Emoji picker toggle button */}
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-3 rounded-[10px] bg-[#181B23] border border-[#252A35] text-[#94A3B8] hover:text-white flex-shrink-0 transition-colors"
        >
          <Smile className="h-4 w-4" />
        </button>

        {/* Floating Emoji Picker Popover */}
        {showEmojiPicker && (
          <div className="absolute bottom-14 left-14 bg-[#181B23] border border-[#252A35] rounded-[10px] p-2 shadow-xl z-20 flex gap-1.5">
            {emojis.map((emoji) => (
              <button
                type="button"
                key={emoji}
                onClick={() => {
                  setMessageText(messageText + emoji);
                  setShowEmojiPicker(false);
                }}
                className="hover:scale-125 transition-transform text-base"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Main Text Input */}
        <input
          type="text"
          placeholder={attachedMedia.length > 0 ? "Add post description to locked media..." : "Write message..."}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          className="flex-1 bg-[#181B23] border border-[#252A35] rounded-[10px] py-3 px-4 text-xs focus:outline-none focus:border-[#7C5CFC] placeholder-[#94A3B8]/40 transition-colors"
        />

        {/* Mock voice recorder simulation */}
        <button
          type="button"
          onClick={() => setMessageText(messageText + ' 🎙️ [Voice Message]')}
          className="p-3 rounded-[10px] bg-[#181B23] border border-[#252A35] text-[#94A3B8] hover:text-white flex-shrink-0 transition-colors"
          title="Record voice message"
        >
          <Mic className="h-4 w-4" />
        </button>

        {/* Send Button */}
        <button
          type="submit"
          disabled={sendingMessage || (!messageText.trim() && attachedMedia.length === 0)}
          className="bg-[#7C5CFC] hover:bg-[#6c4ee2] text-white p-3 rounded-[10px] transition-colors flex-shrink-0 disabled:opacity-50"
        >
          {sendingMessage ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </button>
      </form>

      {/* Media Vault selector popup panel */}
      <AnimatePresence>
        {vaultOpen && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="absolute bottom-16 left-0 right-0 bg-[#181B23] border border-[#252A35] rounded-[12px] p-4 shadow-2xl z-30 space-y-3.5"
          >
            <div className="flex items-center justify-between border-b border-[#252A35] pb-2">
              <span className="text-xs font-bold flex items-center gap-1.5 text-white">
                <Folder className="h-4 w-4 text-[#7C5CFC]" /> Select Vault Assets to Send
              </span>
              <button type="button" onClick={() => setVaultOpen(false)} className="text-[#94A3B8] hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            {loadingVault ? (
              <div className="py-6 text-center text-xs text-[#94A3B8] flex items-center justify-center gap-1.5">
                <RefreshCw className="h-4 w-4 animate-spin text-[#7C5CFC]" /> Loading files...
              </div>
            ) : vaultItemsList.length === 0 ? (
              <p className="py-6 text-center text-xs text-[#94A3B8] italic">No vault files. Visit Media Vault to upload.</p>
            ) : (
              <div className="grid grid-cols-4 gap-2.5 max-h-[160px] overflow-y-auto pr-1">
                {vaultItemsList.map((item) => {
                  const isSelected = attachedMedia.includes(item.url);
                  return (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => toggleAttachMedia(item.url)}
                      className={`relative rounded-[8px] overflow-hidden border p-1 text-left flex flex-col gap-1 transition-all ${
                        isSelected ? 'border-[#7C5CFC] bg-[#7C5CFC]/10' : 'border-[#252A35] hover:border-[#7C5CFC]/30 bg-[#0F1117]'
                      }`}
                    >
                      <img src={item.thumbnail || item.url} alt={item.name} className="h-12 w-full object-cover rounded" />
                      <span className="text-[9px] text-[#94A3B8] truncate w-full px-1">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* PPV price lock configurator */}
            <div className="pt-3 border-t border-[#252A35] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#FFC857] flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" /> Lock Price (PPV):
                </span>
                <div className="relative max-w-[100px]">
                  <span className="absolute left-2.5 top-1.5 text-xs text-[#94A3B8]">$</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={lockPrice}
                    onChange={(e) => setLockPrice(e.target.value)}
                    className="w-full bg-[#0F1117] border border-[#252A35] rounded-[6px] pl-5 pr-2 py-1 text-xs text-white focus:outline-none focus:border-[#7C5CFC]"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVaultOpen(false)}
                className="bg-[#7C5CFC] hover:bg-[#6c4ee2] text-white font-extrabold text-[10px] uppercase tracking-wider px-3.5 py-1.5 rounded-[6px]"
              >
                Confirm Attachment
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
