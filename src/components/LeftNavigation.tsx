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
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  badge?: number;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

// Define section menus for each top-level icon matching OnlyFans API endpoints list
const sectionMenus: Record<string, { title: string; sections: NavSection[] }> = {
  messages: {
    title: 'OnlyFans API',
    sections: [
      {
        title: 'Accounts',
        items: [
          { name: 'Connect OnlyFans Account', icon: User, path: '/creators/onboard', method: 'POST' },
          { name: 'Account', icon: User, path: '/creators' },
        ]
      },
      {
        title: 'Messages',
        items: [
          { name: 'Chats', icon: MessageSquare, path: '/messages', method: 'GET' },
          { name: 'Chat Messages', icon: MessageSquare, path: '/messages', method: 'GET' },
          { name: 'Mass Messaging', icon: Send, path: '/automations', method: 'POST' },
          { name: 'Saved For Later', icon: Bookmark, path: '/messages', method: 'GET' },
        ]
      },
      {
        title: 'Automation',
        items: [
          { name: 'Auto Reply', icon: Bot, path: '/automations' },
        ]
      }
    ]
  },
  content: {
    title: 'Content & Posts',
    sections: [
      {
        title: 'Posts',
        items: [
          { name: 'Posts', icon: FileText, path: '/content', method: 'GET' },
          { name: 'Post Labels', icon: FileText, path: '/content', method: 'GET' },
          { name: 'Post Comments', icon: FileText, path: '/content', method: 'POST' },
        ]
      },
      {
        title: 'Queue',
        items: [
          { name: 'Count Queue Items', icon: Clock, path: '/content', method: 'GET' },
          { name: 'List Queue Items', icon: Clock, path: '/content', method: 'GET' },
          { name: 'Publish Queue Item', icon: Clock, path: '/content', method: 'PUT' },
        ]
      },
      {
        title: 'Stories',
        items: [
          { name: 'Stories', icon: Sparkles, path: '/stories', method: 'GET' },
          { name: 'Story Highlights', icon: Sparkles, path: '/stories', method: 'GET' },
        ]
      }
    ]
  },
  vault: {
    title: 'Media & Vault',
    sections: [
      {
        title: 'Media',
        items: [
          { name: 'Media Vault', icon: Compass, path: '/vault', method: 'GET' },
          { name: 'Media Vault Lists', icon: Compass, path: '/vault', method: 'GET' },
          { name: 'Upload media to CDN', icon: Compass, path: '/vault', method: 'POST' },
          { name: 'Download Media from CDN', icon: Compass, path: '/vault', method: 'GET' },
        ]
      }
    ]
  },
  fans: {
    title: 'Fans & CRM',
    sections: [
      {
        title: 'Statistics / Engagement',
        items: [
          { name: 'Engagement / Messages', icon: Sparkles, path: '/fans' },
        ]
      },
      {
        title: 'Release Forms',
        items: [
          { name: 'Release Forms', icon: FileText, path: '/fans' },
        ]
      },
      {
        title: 'Users',
        items: [
          { name: 'Users', icon: Users, path: '/fans' },
          { name: 'Blocked / Restricted Users', icon: Users, path: '/fans' },
          { name: 'Public Profiles', icon: Users, path: '/fans' },
        ]
      },
      {
        title: 'Notifications',
        items: [
          { name: 'Get Notification Counts', icon: MessageSquare, path: '/fans', method: 'GET' },
          { name: 'Get Notification Tabs Order', icon: MessageSquare, path: '/fans', method: 'GET' },
          { name: 'List Notifications', icon: MessageSquare, path: '/fans', method: 'GET' },
          { name: 'Mark All Notifications As Read', icon: MessageSquare, path: '/fans', method: 'POST' },
          { name: 'Search Users In Notifications', icon: MessageSquare, path: '/fans', method: 'GET' },
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
          { name: 'Engagement / Messages', icon: Sparkles, path: '/analytics' },
          { name: 'Earning Statistics', icon: BarChart3, path: '/analytics', method: 'GET' },
        ]
      }
    ]
  },
  earnings: {
    title: 'Payouts & Earnings',
    sections: [
      {
        title: 'Banking & Payouts',
        items: [
          { name: 'Transactions', icon: BarChart3, path: '/earnings', method: 'GET' },
          { name: 'Payouts', icon: BarChart3, path: '/earnings', method: 'GET' },
          { name: 'Chargebacks', icon: BarChart3, path: '/earnings', method: 'GET' },
          { name: 'Banking', icon: BarChart3, path: '/earnings', method: 'GET' },
        ]
      }
    ]
  },
  settings: {
    title: 'OnlyFans Settings',
    sections: [
      {
        title: 'OnlyFans Settings',
        items: [
          { name: 'Get Settings', icon: Settings, path: '/settings', method: 'GET' },
          { name: 'Update Profile', icon: Settings, path: '/settings', method: 'POST' },
          { name: 'Check Username Availability', icon: Settings, path: '/settings', method: 'POST' },
          { name: 'Update Subscription Price', icon: Settings, path: '/settings', method: 'PATCH' },
          { name: 'Get Blocked Countries', icon: Settings, path: '/settings', method: 'GET' },
          { name: 'Update Blocked Countries', icon: Settings, path: '/settings', method: 'PUT' },
        ]
      },
      {
        title: 'Welcome Message',
        items: [
          { name: 'Enable/Disable Welcome Message', icon: Settings, path: '/settings', method: 'PATCH' },
          { name: 'Get Welcome Message', icon: Settings, path: '/settings', method: 'GET' },
          { name: 'Update Welcome Message', icon: Settings, path: '/settings', method: 'POST' },
        ]
      },
      {
        title: 'Social Media Buttons',
        items: [
          { name: 'List Social Media Buttons', icon: Settings, path: '/settings', method: 'GET' },
          { name: 'Add Social Media Button', icon: Settings, path: '/settings', method: 'POST' },
          { name: 'Update Social Media Button', icon: Settings, path: '/settings', method: 'PUT' },
          { name: 'Delete Social Media Button', icon: Settings, path: '/settings', method: 'DELETE' },
          { name: 'Reorder Social Media Buttons', icon: Settings, path: '/settings', method: 'POST' },
        ]
      },
      {
        title: 'DRM Protection',
        items: [
          { name: 'Get DRM Status', icon: Settings, path: '/settings', method: 'GET' },
          { name: 'Enable/Disable DRM', icon: Settings, path: '/settings', method: 'PATCH' },
        ]
      },
      {
        title: 'Data Exports',
        items: [
          { name: 'List Data Exports', icon: Settings, path: '/settings', method: 'GET' },
          { name: 'Create Data Export', icon: Settings, path: '/settings', method: 'POST' },
          { name: 'Start Data Export', icon: Settings, path: '/settings', method: 'POST' },
          { name: 'Get Data Export Status', icon: Settings, path: '/settings', method: 'GET' },
          { name: 'Cancel Data Export', icon: Settings, path: '/settings', method: 'DELETE' },
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

/** Main sidebar left navigation component */
export default function LeftNavigation() {
  const pathname = usePathname();
  const {
    activeCreator,
    setActiveCreator,
    isShiftActive,
    activeShiftId,
    startShift,
    endShift,
    activeSubMenu,
    setActiveSubMenu,
    activeCreatorFans,
  } = useGlobalStore();
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
    if (pathname.startsWith('/settings')) return 'settings';
    if (pathname.startsWith('/automations')) return 'messages';
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
      const res = await fetch('/api/shifts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isShiftActive ? 'end' : 'start',
          
        })
      });
      if (res.ok) {
        const data = await res.json();
        if (isShiftActive) {
          endShift();
        } else {
          startShift(data.shift?.id || 'dummy');
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

          {/* Creator Selector Dropdown */}
          <div className="px-3 pb-3 border-b border-[#1A1D25]">
            <div className="flex flex-col gap-1 bg-[#13161D] border border-[#252A35] rounded-xl px-2 py-1.5 hover:border-[#7C5CFC]/40 transition-colors">
              <span className="text-[8px] text-[#5A6070] font-bold uppercase tracking-wider">Active Creator</span>
              <select
                value={activeCreator?.id || ''}
                onChange={(e) => {
                  const selected = creators.find(c => c.id === e.target.value);
                  if (selected) setActiveCreator(selected);
                }}
                className="bg-transparent border-none text-[11px] text-[#A3AED0] font-bold focus:outline-none cursor-pointer w-full"
              >
                {creators.map((c) => (
                  <option key={c.id} value={c.id} className="bg-[#0F1117] text-zinc-300">
                    {c.displayName}
                  </option>
                ))}
              </select>
            </div>
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
                    const isActive = activeSubMenu === item.name;
                    let displayBadge = item.badge;
                    if (item.name === 'Chat Requests') {
                      displayBadge = activeCreatorFans.filter((_, idx) => idx % 3 === 0).length;
                    } else if (item.name === 'Pending Messages') {
                      displayBadge = activeCreatorFans.filter((_, idx) => idx % 2 === 1).length;
                    }
                    return (
                       <Link key={item.name} href={item.path} passHref>
                        <span
                          onClick={() => setActiveSubMenu(item.name)}
                          className={`flex items-center gap-2 px-2 py-[6.5px] rounded-[7px] text-[11px] font-medium cursor-pointer transition-all ${
                            isActive
                              ? 'bg-[#7C5CFC] text-white font-semibold'
                              : 'text-[#94A3B8] hover:bg-[#14171E] hover:text-white'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 flex-shrink-0 opacity-60" />
                          <span className="truncate flex-1">{item.name}</span>
                          
                          {item.method && (
                            <span className={`text-[7px] font-extrabold px-1 py-0.5 rounded-md flex-shrink-0 font-mono tracking-wider border ${
                              item.method === 'GET' ? 'bg-[#16C784]/10 text-[#16C784] border-[#16C784]/20' :
                              item.method === 'POST' ? 'bg-[#7C5CFC]/10 text-[#7C5CFC] border-[#7C5CFC]/20' :
                              item.method === 'PUT' ? 'bg-[#FFC857]/10 text-[#FFC857] border-[#FFC857]/20' :
                              'bg-[#FF5B5B]/10 text-[#FF5B5B] border-[#FF5B5B]/20'
                            }`}>
                              {item.method}
                            </span>
                          )}

                          {displayBadge !== undefined && displayBadge > 0 && (
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                              isActive
                                ? 'bg-white/20 text-white'
                                : 'bg-[#7C5CFC]/15 text-[#7C5CFC]'
                            }`}>
                              {displayBadge}
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
