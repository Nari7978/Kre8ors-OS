import React from 'react';
import { CornerUpLeft, Forward, Pin, Heart, Trash2, Edit3, Tag, MoreHorizontal } from 'lucide-react';
import { motion } from 'framer-motion';

interface MessageActionsProps {
  onReply?: () => void;
  onForward?: () => void;
  onPin?: () => void;
  onLike?: () => void;
  onDelete?: () => void;
  onEdit?: () => void;
  onTag?: () => void;
  isOwn?: boolean;
}

export default function MessageActions({
  onReply,
  onForward,
  onPin,
  onLike,
  onDelete,
  onEdit,
  onTag,
  isOwn,
}: MessageActionsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="flex items-center gap-1.5 bg-[#181B23] border border-[#252A35] rounded-[10px] p-1 shadow-lg backdrop-blur-md"
    >
      <button
        onClick={onReply}
        title="Reply"
        className="p-1.5 hover:bg-[#252A35] text-[#94A3B8] hover:text-[#FFFFFF] rounded-md transition-all duration-150"
      >
        <CornerUpLeft className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={onForward}
        title="Forward"
        className="p-1.5 hover:bg-[#252A35] text-[#94A3B8] hover:text-[#FFFFFF] rounded-md transition-all duration-150"
      >
        <Forward className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={onPin}
        title="Pin"
        className="p-1.5 hover:bg-[#252A35] text-[#94A3B8] hover:text-[#FFFFFF] rounded-md transition-all duration-150"
      >
        <Pin className="h-3.5 w-3.5" />
      </button>

      <button
        onClick={onLike}
        title="Like"
        className="p-1.5 hover:bg-[#252A35] text-[#FF5B5B]/30 hover:text-[#FF5B5B] rounded-md transition-all duration-150"
      >
        <Heart className="h-3.5 w-3.5" />
      </button>

      {isOwn && (
        <button
          onClick={onEdit}
          title="Edit"
          className="p-1.5 hover:bg-[#252A35] text-[#94A3B8] hover:text-[#FFFFFF] rounded-md transition-all duration-150"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </button>
      )}

      <button
        onClick={onTag}
        title="Tag Message"
        className="p-1.5 hover:bg-[#252A35] text-[#94A3B8] hover:text-[#FFFFFF] rounded-md transition-all duration-150"
      >
        <Tag className="h-3.5 w-3.5" />
      </button>

      {isOwn && (
        <button
          onClick={onDelete}
          title="Delete"
          className="p-1.5 hover:bg-[#FF5B5B]/10 text-[#FF5B5B] hover:bg-[#FF5B5B]/20 rounded-md transition-all duration-150"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </motion.div>
  );
}
