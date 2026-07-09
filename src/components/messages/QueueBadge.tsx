import React from 'react';
import { Check, CheckCheck, Clock, AlertCircle } from 'lucide-react';

interface QueueBadgeProps {
  status: 'seen' | 'delivered' | 'queued' | 'scheduled' | 'failed';
}

export default function QueueBadge({ status }: QueueBadgeProps) {
  switch (status) {
    case 'seen':
      return <CheckCheck className="h-3.5 w-3.5 text-purple-300" />;
    case 'delivered':
      return <CheckCheck className="h-3.5 w-3.5 text-zinc-400" />;
    case 'queued':
      return <Clock className="h-3 w-3 animate-spin text-[#FFC857]" />;
    case 'scheduled':
      return <Clock className="h-3.5 w-3.5 text-[#7C5CFC]" />;
    case 'failed':
      return <AlertCircle className="h-3.5 w-3.5 text-[#FF5B5B]" />;
    default:
      return null;
  }
}
