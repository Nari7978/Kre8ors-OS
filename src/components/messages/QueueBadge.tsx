import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface QueueBadgeProps {
  status: 'seen' | 'delivered' | 'queued' | 'scheduled' | 'failed';
}

export default function QueueBadge({ status }: QueueBadgeProps) {
  switch (status) {
    case 'seen':
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-[#16C784] uppercase tracking-wider">
          <CheckCheck className="h-3 w-3" /> Seen
        </span>
      );
    case 'delivered':
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
          <CheckCheck className="h-3 w-3" /> Delivered
        </span>
      );
    case 'queued':
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-[#FFC857] uppercase tracking-wider animate-pulse">
          <Clock className="h-3 w-3 animate-spin" /> Queued
        </span>
      );
    case 'scheduled':
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-[#7C5CFC] uppercase tracking-wider">
          <Clock className="h-3 w-3" /> Scheduled
        </span>
      );
    case 'failed':
      return (
        <span className="flex items-center gap-1 text-[10px] font-bold text-[#FF5B5B] uppercase tracking-wider">
          <AlertCircle className="h-3 w-3" /> Failed
        </span>
      );
    default:
      return null;
  }
}
