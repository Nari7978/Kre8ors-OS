import React from 'react';
import { Pin, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface PinnedMessagesProps {
  pinnedMessage: { text?: string; id: string } | null;
  onClear: () => void;
  onNavigate: () => void;
}

export default function PinnedMessages({ pinnedMessage, onClear, onNavigate }: PinnedMessagesProps) {
  return (
    <AnimatePresence>
      {pinnedMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.15 }}
          className="flex items-center justify-between bg-[#181B23] border-b border-[#252A35] px-4 py-2 text-xs backdrop-blur-md sticky top-0 z-10 cursor-pointer"
          onClick={onNavigate}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Pin className="h-3.5 w-3.5 text-[#7C5CFC] shrink-0" />
            <div className="min-w-0">
              <span className="text-[#7C5CFC] font-extrabold block">Pinned Message</span>
              <p className="text-[#94A3B8] truncate mt-0.5">{pinnedMessage.text || 'Shared Attachment'}</p>
            </div>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            className="p-1 hover:bg-[#252A35] text-[#94A3B8] hover:text-white rounded transition-colors"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
