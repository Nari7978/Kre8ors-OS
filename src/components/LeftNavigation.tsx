'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGlobalStore } from '@/lib/store/global-store';
import { Creator } from '@/types';
import {
  MessageSquare,
  FileText,
  Compass,
  Sparkles,
  BarChart3,
  Settings,
  Users,
  Zap,
  MoreHorizontal,
  User,
  Clock,
  LogOut,
  MessageCircle,
  Search,
  CalendarClock,
  Bookmark,
  Bot,
  Send,
  Target,
  Workflow,
  Mail,
  Archive,
  EyeOff,
  VolumeX,
  Heart,
  BellOff,
  Pin,
  Trash2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface NavItem {
  name: string;
  icon: any;
  path: string;
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Define section menus for each top-level icon
const sectionMenus: Record<string, { title: string; sections: NavSection[] }> = {
  messages: {
    title: 'Messages',
    sections: [
      {
        title: 'Chats',
        items: [
          { name: 'List Chats', icon: MessageSquare, path: '/messages' },
          { name: 'Chat Requests', icon: Mail, path: '/messages', badge: 12 },
          { name: 'Pending Messages', icon: Clock, path: '/messages', badge: 8 },
          { name: 'Archived Chats', icon: Archive, path: '/messages' },
          { name: 'Hidden Chats', icon: EyeOff, path: '/messages' },
          { name: 'Muted Chats', icon: VolumeX, path: '/messages' },
          { name: 'Favorites', icon: Heart, path: '/messages' },
          { name: 'Unread Chats', icon: BellOff, path: '/messages' },
          { name: 'Pinned Chats', icon: Pin, path: '/messages' },
          { name: 'Deleted Chats', icon: Trash2, path: '/messages' },
        ]
      },
      {
        title: 'Messages',
        items: [
          { name: 'List Messages', icon: MessageCircle, path: '/messages' },
          { name: 'Search Messages', icon: Search, path: '/messages' },
          { name: 'Scheduled Messages', icon: CalendarClock, path: '/messages' },
          { name: 'Saved For Later', icon: Bookmark, path: '/messages' },
        ]
      },
      {
        title: 'Automation',
        items: [
          { name: 'Auto Reply', icon: Bot, path: '/automations' },
          { name: 'Mass Messaging', icon: Send, path: '/automations' },
          { name: 'Campaigns', icon: Target, path: '/automations' },
          { name: 'Drip Sequences', icon: Workflow, path: '/automations' },
        ]
      }
    ]
  },
  content: {
    title: 'Content',
    sections: [
      {
        title: 'Posts',
        items: [
          { name: 'List Posts', icon: FileText, path: '/content' },
          { name: 'Create Post', icon: FileText, path: '/content' },
          { name: 'Queue Items', icon: CalendarClock, path: '/content' },
          { name: 'Archived Posts', icon: Archive, path: '/content' },
        ]
      },
      {
        title: 'Stories',
        items: [
          { name: 'Active Stories', icon: Sparkles, path: '/stories' },
          { name: 'Story Archive', icon: Archive, path: '/stories' },
        ]
      }
    ]
  },
  vault: {
    title: 'Media Vault',
    sections: [
      {
        title: 'Vault',
        items: [
          { name: 'Browse Vault', icon: Compass, path: '/vault' },
          { name: 'Upload Media', icon: Compass, path: '/vault' },
        ]
      }
    ]
  },
  fans: {
    title: 'Fans & CRM',
    sections: [
      {
        title: 'Subscribers',
        items: [
          { name: 'All Fans', icon: Users, path: '/fans' },
          { name: 'VIP Fans', icon: Heart, path: '/fans' },
        ]
      }
    ]
  },
  analytics: {
    title: 'Analytics',
    sections: [
      {
        title: 'Performance',
        items: [
          { name: 'Revenue', icon: BarChart3, path: '/analytics' },
          { name: 'Conversions', icon: Target, path: '/analytics' },
        ]
      }
    ]
  },
  earnings: {
    title: 'Earnings',
    sections: [
      {
        title: 'Banking',
        items: [
          { name: 'Transactions', icon: BarChart3, path: '/earnings' },
          { name: 'Payouts', icon: BarChart3, path: '/earnings' },
        ]
      }
    ]
  },
  settings: {
    title: 'Settings',
    sections: [
      {
        title: 'General',
        items: [
          { name: 'Profile Settings', icon: Settings, path: '/settings' },
          { name: 'API Keys', icon: Settings, path: '/settings' },
        ]
      }
    ]
  },
};

// Top-level icon items for the thin sidebar
const topLevelIcons = [
  { id: 'messages', icon: MessageSquare, label: 'Messages', path: '/messages' },
  { id: 'content', icon: FileText, label: 'Content', path: '/content' },
  { id: 'vault', icon: Compass, label: 'Vault', path: '/vault' },
  { id: 'fans', icon: Users, label: 'Fans', path: '/fans' },
  { id: 'analytics', icon: Sparkles, label: 'Analytics', path: '/analytics' },
  { id: 'earnings', icon: BarChart3, label: 'Earnings', path: '/earnings' },
  { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' },
];

export default function LeftNavigation() {
  const pathname = usePathname();
  const { activeCreator, setActiveCreator, isShiftActive, activeShiftId, startShift, endShift } = useGlobalStore();
  const [creators, setCreators] = useState<Creator[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Determine active section based on route
  const getActiveSection = () => {
    if (pathname.startsWith('/messages')) return 'messages';
    if (pathname.startsWith('/content') || pathname.startsWith('/stories')) return 'content';
    if (pathname.startsWith('/vault')) return 'vault';
    if (pathname.startsWith('/fans')) return 'fans';
    if (pathname.startsWith('/analytics')) return 'analytics';
    if (pathname.startsWith('/earnings')) return 'earnings';
    if (pathname.startsWith('/settings') || pathname.startsWith('/automations')) return 'messages';
    return 'messages';
  };

  const activeSection = getActiveSection();
  const activeMenu = sectionMenus[activeSection] || sectionMenus.messages;

  useEffect(() => {
    async function fetchCreators() {
      try {
        const res = await fetch('/api/creators');
        if (res.ok) {
          const data = await res.json();
          setCreators(data || []);
          if (data.length > 0 && !activeCreator) {
            setActiveCreator(data[0]);
          }
        }
      } catch (err) {
        console.error('Error loading sidebar creators:', err);
      }
    }
    fetchCreators();
  }, [activeCreator, setActiveCreator]);

  const handleShiftClock = async () => {
    try {
      const res = await fetch('/api/analytics/shift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isShiftActive ? 'clock_out' : 'clock_in',
          shiftId: activeShiftId || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (isShiftActive) {
          endShift();
        } else {
          startShift(data.shiftId || 'dummy');
        }
      }
    } catch (e) {
      console.error('Error clocking shift:', e);
    }
  };

  return (
    <div className="h-full flex flex-shrink-0 select-none text-zinc-300 overflow-hidden">
      {/* COLUMN 1: Thin Icon-Only Sidebar */}
      <div className="w-[52px] h-full bg-[#0B0D12] flex flex-col items-center py-3 justify-between border-r border-[#1A1D25] flex-shrink-0">
        <div className="flex flex-col items-center gap-1 w-full">
          {/* Logo */}
          <div className="h-8 w-8 rounded-[10px] bg-[#7C5CFC] flex items-center justify-center font-black text-white text-xs shadow-md shadow-[#7C5CFC]/20 mb-4">
            M
          </div>

          {/* Icon navigation */}
          {topLevelIcons.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <Link key={item.id} href={item.path} passHref className="w-full">
                <div
                  className={`h-9 w-9 mx-auto rounded-[8px] flex items-center justify-center cursor-pointer transition-all relative ${
                    isActive
                      ? 'bg-[#7C5CFC]/15 text-[#7C5CFC]'
                      : 'text-[#5A6070] hover:bg-[#14171E] hover:text-[#94A3B8]'
                  }`}
                  title={item.label}
                >
                  <Icon className="h-[18px] w-[18px]" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Bottom icons */}
        <div className="flex flex-col items-center gap-2 w-full">
          <button className="h-9 w-9 mx-auto rounded-[8px] flex items-center justify-center text-[#5A6070] hover:bg-[#14171E] hover:text-[#94A3B8] transition-colors">
            <MoreHorizontal className="h-[18px] w-[18px]" />
          </button>

          {/* Clock in/out */}
          <button
            onClick={handleShiftClock}
            className={`h-9 w-9 mx-auto rounded-[8px] flex items-center justify-center transition-colors ${
              isShiftActive ? 'text-[#16C784]' : 'text-[#5A6070] hover:text-[#94A3B8]'
            }`}
            title={isShiftActive ? 'Clock Out' : 'Clock In'}
          >
            <Clock className="h-[18px] w-[18px]" />
          </button>

          {/* Creator avatar */}
          <div className="h-8 w-8 rounded-full bg-[#181B23] border border-[#252A35] flex items-center justify-center overflow-hidden cursor-pointer hover:border-[#7C5CFC] transition-colors mt-1">
            {activeCreator?.avatarUrl ? (
              <img src={activeCreator.avatarUrl} alt="" className="object-cover h-full w-full" />
            ) : (
              <User className="h-4 w-4 text-[#5A6070]" />
            )}
          </div>
        </div>
      </div>

      {/* COLUMN 2: Section Text Navigation */}
      {!isCollapsed && (
        <div className="w-[180px] h-full bg-[#0F1117] flex flex-col border-r border-[#1A1D25] flex-shrink-0">
          {/* Section title */}
          <div className="h-14 px-4 flex items-center flex-shrink-0">
            <span className="font-bold text-white text-[15px] tracking-tight">{activeMenu.title}</span>
          </div>

          {/* Scrollable nav items */}
          <div className="flex-1 overflow-y-auto px-2 pb-4 space-y-5 scrollbar-thin">
            {activeMenu.sections.map((section, idx) => (
              <div key={idx}>
                <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-[#5A6070] px-2.5 block mb-1.5">
                  {section.title}
                </span>
                <div className="space-y-0.5">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.path && item.name === 'List Chats';
                    return (
                      <Link key={item.name} href={item.path} passHref>
                        <span
                          className={`flex items-center gap-2 px-2.5 py-[7px] rounded-[7px] text-[12px] font-medium cursor-pointer transition-all ${
                            isActive
                              ? 'bg-[#7C5CFC] text-white font-semibold'
                              : 'text-[#94A3B8] hover:bg-[#14171E] hover:text-white'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-70" />
                          <span className="truncate flex-1">{item.name}</span>
                          {item.badge !== undefined && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#7C5CFC]/15 text-[#7C5CFC]'
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
