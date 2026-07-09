'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGlobalStore } from '@/lib/store/global-store';
import { Creator } from '@/types';
import {
  MessageSquare,
  FileText,
  Settings,
  BarChart3,
  Compass,
  Wallet,
  Clock,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  User
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SubMenuItem {
  name: string;
  badge?: string | number;
  path: string;
}

interface MenuSection {
  title: string;
  items: SubMenuItem[];
}

export default function LeftNavigation() {
  const pathname = usePathname();
  const { activeCreator, setActiveCreator, isShiftActive, activeShiftId, startShift, endShift } = useGlobalStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [showCreatorSelect, setShowCreatorSelect] = useState(false);

  // Load creators list
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

  // Determine active section based on route
  const getActiveSection = () => {
    if (pathname.startsWith('/messages')) return 'messages';
    if (pathname.startsWith('/content') || pathname.startsWith('/stories')) return 'content';
    if (pathname.startsWith('/vault')) return 'vault';
    if (pathname.startsWith('/earnings')) return 'earnings';
    if (pathname.startsWith('/analytics')) return 'analytics';
    if (pathname.startsWith('/settings')) return 'settings';
    return 'messages'; // fallback
  };

  const activeSection = getActiveSection();

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

  // Define secondary navigation menus for each top-level section
  const sectionMenus: Record<string, { title: string; sections: MenuSection[] }> = {
    messages: {
      title: 'Messages',
      sections: [
        {
          title: 'Chats',
          items: [
            { name: 'List Chats', path: '/messages' },
            { name: 'Chat Requests', badge: 12, path: '/messages' },
            { name: 'Pending Messages', badge: 8, path: '/messages' },
            { name: 'Archived Chats', path: '/messages' },
            { name: 'Hidden Chats', path: '/messages' },
            { name: 'Muted Chats', path: '/messages' },
            { name: 'Favorites', path: '/messages' },
            { name: 'Unread Chats', path: '/messages' },
            { name: 'Pinned Chats', path: '/messages' },
            { name: 'Deleted Chats', path: '/messages' }
          ]
        },
        {
          title: 'Messages',
          items: [
            { name: 'List Messages', path: '/messages' },
            { name: 'Search Messages', path: '/messages' },
            { name: 'Scheduled Messages', path: '/messages' },
            { name: 'Saved For Later', path: '/messages' }
          ]
        },
        {
          title: 'Automation',
          items: [
            { name: 'Auto Reply', path: '/automations' },
            { name: 'Mass Messaging', path: '/automations' },
            { name: 'Campaigns', path: '/automations' },
            { name: 'Drip Sequences', path: '/automations' }
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
            { name: 'List Posts', path: '/content' },
            { name: 'Create Post', path: '/content' },
            { name: 'Queue Items', path: '/content' },
            { name: 'Archived Posts', path: '/content' }
          ]
        },
        {
          title: 'Stories',
          items: [
            { name: 'List Active Stories', path: '/stories' },
            { name: 'List Story Archive', path: '/stories' },
            { name: 'Show Story', path: '/stories' },
            { name: 'Add to Story', path: '/stories' }
          ]
        }
      ]
    },
    vault: {
      title: 'Media Vault',
      sections: [
        {
          title: 'Vault Storage',
          items: [
            { name: 'List Vault Media', path: '/vault' },
            { name: 'Get Vault Media', path: '/vault' },
            { name: 'Upload Media to Vault', path: '/vault' },
            { name: 'Delete Vault Media', path: '/vault' }
          ]
        },
        {
          title: 'Vault Lists',
          items: [
            { name: 'Add Media To List', path: '/vault' },
            { name: 'Create Vault List', path: '/vault' }
          ]
        }
      ]
    },
    earnings: {
      title: 'Earnings',
      sections: [
        {
          title: 'Banking & Payouts',
          items: [
            { name: 'Transactions', path: '/earnings' },
            { name: 'Payouts Statistics', path: '/earnings' },
            { name: 'Request Payouts', path: '/earnings' }
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
            { name: 'Revenue Analytics', path: '/analytics' },
            { name: 'Chatter Conversions', path: '/analytics' },
            { name: 'Subscriber Retention', path: '/analytics' }
          ]
        },
        {
          title: 'Operators',
          items: [
            { name: 'Leaderboard', path: '/analytics' },
            { name: 'Shift Records', path: '/analytics' }
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
            { name: 'Get Settings', path: '/settings' },
            { name: 'Update Profile', path: '/settings' }
          ]
        },
        {
          title: 'OnlyFans API',
          items: [
            { name: 'Webhooks', path: '/settings' },
            { name: 'API Keys', path: '/settings' },
            { name: 'Client Sessions', path: '/settings' }
          ]
        }
      ]
    }
  };

  const activeMenu = sectionMenus[activeSection] || sectionMenus.messages;

  return (
    <motion.div
      animate={{ width: isCollapsed ? 64 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full flex bg-[#13161D] border-r border-[#252A35] flex-shrink-0 select-none text-zinc-300 overflow-hidden"
    >
      {/* COLUMN 1: Far Left Thin Icon-Only Sidebar */}
      <div className="w-16 h-full bg-[#0B0D12] flex flex-col items-center py-4 justify-between border-r border-[#252A35]/35 flex-shrink-0 relative">
        <div className="flex flex-col items-center gap-6 w-full">
          {/* Logo icon */}
          <div className="h-8 w-8 rounded-lg bg-[#7C5CFC] flex items-center justify-center font-black text-white text-sm shadow-md shadow-[#7C5CFC]/20">
            K
          </div>

          {/* Vertical Menu Icons list */}
          <div className="flex flex-col items-center gap-4 w-full px-2 mt-4">
            {[
              { id: 'messages', icon: MessageSquare, label: 'Messages', path: '/messages' },
              { id: 'content', icon: FileText, label: 'Content', path: '/content' },
              { id: 'vault', icon: Compass, label: 'Vault', path: '/vault' },
              { id: 'earnings', icon: Wallet, label: 'Earnings', path: '/earnings' },
              { id: 'analytics', icon: BarChart3, label: 'Analytics', path: '/analytics' },
              { id: 'settings', icon: Settings, label: 'Settings', path: '/settings' }
            ].map((iconItem) => {
              const Icon = iconItem.icon;
              const isActive = activeSection === iconItem.id;
              return (
                <Link key={iconItem.id} href={iconItem.path} passHref className="w-full">
                  <div
                    className={`h-10 w-10 mx-auto rounded-[10px] flex items-center justify-center cursor-pointer transition-all relative ${
                      isActive 
                        ? 'bg-[#7C5CFC]/15 text-[#7C5CFC]' 
                        : 'text-[#94A3B8] hover:bg-[#181B23] hover:text-white'
                    }`}
                    title={iconItem.label}
                  >
                    <Icon className="h-5 w-5" />
                    {isActive && (
                      <div className="absolute left-0 top-1/4 h-1/2 w-1 bg-[#7C5CFC] rounded-r-full" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Column 1 bottom controls */}
        <div className="flex flex-col items-center gap-4 w-full">
          {/* Clock-in shift triggers */}
          <button
            onClick={handleShiftClock}
            className={`p-2 rounded-full transition-colors ${
              isShiftActive ? 'bg-[#16C784]/15 text-[#16C784]' : 'bg-[#FF5B5B]/15 text-[#FF5B5B]'
            }`}
            title={isShiftActive ? 'Clock Out Shift' : 'Clock In Shift'}
          >
            <Clock className="h-4.5 w-4.5" />
          </button>

          {/* Workspace Avatar Selection */}
          <div className="relative">
            <button
              onClick={() => setShowCreatorSelect(!showCreatorSelect)}
              className="h-9 w-9 rounded-full bg-[#181B23] border border-[#252A35] flex items-center justify-center font-black text-white text-xs overflow-hidden hover:border-[#7C5CFC] transition-colors"
              title={activeCreator?.displayName}
            >
              {activeCreator?.avatarUrl ? (
                <img src={activeCreator.avatarUrl} alt={activeCreator.username} className="object-cover h-full w-full" />
              ) : (
                activeCreator?.displayName?.charAt(0) || '@'
              )}
            </button>

            {/* Creator Popover Workspace Dropdown selector */}
            <AnimatePresence>
              {showCreatorSelect && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute bottom-12 left-2 w-48 bg-[#13161D] border border-[#252A35] rounded-[10px] p-2 shadow-xl z-55 space-y-1"
                >
                  <span className="text-[9px] uppercase font-black tracking-wider text-[#94A3B8] px-2 block mb-1">Select Workspace</span>
                  {creators.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => {
                        setActiveCreator(c);
                        setShowCreatorSelect(false);
                      }}
                      className={`w-full text-left px-2.5 py-1.5 rounded-[6px] text-xs font-semibold flex items-center gap-2 transition-colors ${
                        activeCreator?.id === c.id
                          ? 'bg-[#7C5CFC] text-white'
                          : 'text-[#94A3B8] hover:bg-[#181B23] hover:text-white'
                      }`}
                    >
                      <div className="h-5 w-5 rounded-full overflow-hidden shrink-0 border border-white/5 bg-zinc-950 flex items-center justify-center">
                        {c.avatarUrl ? (
                          <img src={c.avatarUrl} alt={c.username} className="object-cover h-full w-full" />
                        ) : (
                          <User className="h-3 w-3" />
                        )}
                      </div>
                      <span className="truncate">@{c.username}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* COLUMN 2: Secondary Section Menus (List layout) */}
      <AnimatePresence mode="wait">
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            className="flex-1 flex flex-col h-full bg-[#13161D]"
          >
            {/* Header branding / Toggle button */}
            <div className="p-4 border-b border-[#252A35] flex items-center justify-between h-16 flex-shrink-0">
              <span className="font-extrabold text-white text-base tracking-tight select-none">
                {activeMenu.title}
              </span>
              <button
                onClick={() => setIsCollapsed(true)}
                className="p-1 hover:bg-[#181B23] border border-[#252A35]/30 rounded-[8px] text-[#94A3B8] hover:text-white transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            </div>

            {/* List scrollable content */}
            <div className="flex-1 overflow-y-auto py-3 space-y-4 px-2.5 scrollbar-thin">
              {activeMenu.sections.map((section, idx) => (
                <div key={idx} className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#94A3B8]/60 px-3 block mb-1">
                    {section.title}
                  </span>
                  
                  <div className="space-y-0.5">
                    {section.items.map((item) => {
                      const isActive = pathname === item.path && item.name === 'List Chats';
                      return (
                        <Link key={item.name} href={item.path} passHref>
                          <span
                            className={`flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-semibold cursor-pointer transition-all ${
                              isActive
                                ? 'bg-[#7C5CFC]/15 text-[#7C5CFC] font-extrabold'
                                : 'text-[#94A3B8] hover:bg-[#181B23] hover:text-white'
                            }`}
                          >
                            <span className="truncate">{item.name}</span>
                            {item.badge !== undefined && (
                              <span className="bg-[#7C5CFC] text-white text-[9px] font-black px-1.5 py-0.5 rounded-full shrink-0">
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

            {/* Column 2 Bottom session footer */}
            <div className="p-3 border-t border-[#252A35] bg-[#0F1117]/20 flex items-center justify-between flex-shrink-0 text-xs text-[#94A3B8]">
              <div>
                <span className="font-bold text-white block">Level 1 chatter</span>
                <span className="text-[10px] block mt-0.5">Active Session</span>
              </div>
              <button
                onClick={() => alert('Log out simulated successfully')}
                className="p-1 hover:bg-[#FF5B5B]/15 hover:text-[#FF5B5B] rounded-[6px] transition-colors"
                title="Logout session"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating expander button if collapsed */}
      {isCollapsed && (
        <button
          onClick={() => setIsCollapsed(false)}
          className="absolute left-14 top-5 p-1.5 bg-[#7C5CFC] hover:bg-[#6c4ee2] text-white rounded-full shadow-lg border border-white/10 z-50 transition-all active:scale-95"
          title="Expand sidebar"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      )}
    </motion.div>
  );
}
