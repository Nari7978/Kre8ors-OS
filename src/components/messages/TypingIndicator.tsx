import React from 'react';

export default function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 bg-[#181B23] border border-[#252A35] rounded-[14px] px-3.5 py-2.5 w-fit max-w-[70%]">
      <span className="text-xs text-[#94A3B8] font-medium mr-1 select-none">Typing</span>
      <div className="flex gap-1 items-center">
        <div className="h-1.5 w-1.5 bg-[#7C5CFC] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <div className="h-1.5 w-1.5 bg-[#7C5CFC] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <div className="h-1.5 w-1.5 bg-[#7C5CFC] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}
