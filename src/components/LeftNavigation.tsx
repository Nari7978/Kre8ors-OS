'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGlobalStore } from '@/lib/store/global-store';
import { Creator } from '@/types';
import {
  MessageSquare,
  FileText,
  Zap,
  Settings,
  BarChart3,
  Users,
  Compass,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Clock,
  Gift,
  Wallet,
  Bell,
  Sparkles,
  ChevronDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SidebarSubItem {
  name: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
}

interface SidebarGroup {
  id: string;
  name: string;
  icon: any;
  items: SidebarSubItem[];
}

export default function LeftNavigation() {
  const pathname = usePathname();
  const { activeCreator, setActiveCreator, isShiftActive, activeShiftId, startShift, endShift } = useGlobalStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
    messages: true,
    posts: true,
    banking: false,
    users: false,
    settings: false
  });

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

  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId]
    }));
  };

  // OnlyFans API documentation categories mapping
  const apiGroups: SidebarGroup[] = [
    {
      id: 'messages',
      name: 'Messages',
      icon: MessageSquare,
      items: [
        { name: 'List Chats', method: 'GET', path: '/messages' },
        { name: 'List Chat Media (Gallery)', method: 'GET', path: '/messages' },
        { name: 'Mute Chat Notifications', method: 'POST', path: '/messages' },
        { name: 'Start Typing Indicator', method: 'POST', path: '/messages' },
        { name: 'Send Message', method: 'POST', path: '/messages' },
        { name: 'Delete Message', method: 'DELETE', path: '/messages' },
        { name: 'Get Message Settings', method: 'GET', path: '/messages' }
      ]
    },
    {
      id: 'posts',
      name: 'Posts',
      icon: FileText,
      items: [
        { name: 'List Posts', method: 'GET', path: '/content' },
        { name: 'Get Post', method: 'GET', path: '/content' },
        { name: 'Send Post', method: 'POST', path: '/content' },
        { name: 'Show Post Statistics', method: 'GET', path: '/analytics' },
        { name: 'Archive Post', method: 'POST', path: '/content' },
        { name: 'Publish Queue Item', method: 'PUT', path: '/content' }
      ]
    },
    {
      id: 'promotions',
      name: 'Promotions & Bundles',
      icon: Gift,
      items: [
        { name: 'Promotions List', method: 'GET', path: '/messages/ppv-builder' },
        { name: 'Subscription Bundles', method: 'GET', path: '/messages/ppv-builder' }
      ]
    },
    {
      id: 'banking',
      name: 'Banking & Payouts',
      icon: Wallet,
      items: [
        { name: 'Transactions', method: 'GET', path: '/earnings' },
        { name: 'Payouts Statistics', method: 'GET', path: '/earnings' },
        { name: 'Request Payouts', method: 'POST', path: '/earnings' }
      ]
    },
    {
      id: 'users',
      name: 'Users & CRM Fans',
      icon: Users,
      items: [
        { name: 'List Users', method: 'GET', path: '/fans' },
        { name: 'Public Profiles', method: 'GET', path: '/fans' }
      ]
    },
    {
      id: 'settings',
      name: 'OnlyFans Settings',
      icon: Settings,
      items: [
        { name: 'Get Settings', method: 'GET', path: '/settings' },
        { name: 'Update Profile', method: 'POST', path: '/settings' },
        { name: 'Automatic Messaging', method: 'PATCH', path: '/automations' }
      ]
    }
  ];

  const handleCreatorChange = (creatorId: string) => {
    const found = creators.find((c) => c.id === creatorId);
    if (found) {
      setActiveCreator(found);
    }
  };

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

  const getMethodColor = (method?: string) => {
    switch (method) {
      case 'GET':
        return 'text-[#16C784]';
      case 'POST':
        return 'text-[#7C5CFC]';
      case 'DELETE':
        return 'text-[#FF5B5B]';
      case 'PUT':
        return 'text-[#FFC857]';
      case 'PATCH':
        return 'text-[#f97316]';
      default:
        return 'text-zinc-500';
    }
  };

  return (
    <motion.div
      animate={{ width: isCollapsed ? 76 : 260 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full bg-[#13161D] border-r border-[#252A35] flex flex-col flex-shrink-0 select-none text-zinc-300 overflow-hidden"
    >
      {/* Workspace Branding Logo header */}
      <div className="p-4 border-b border-[#252A35] flex items-center justify-between h-16 flex-shrink-0">
        {!isCollapsed && (
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-[#7C5CFC] flex items-center justify-center font-black text-white text-sm shadow-md shadow-[#7C5CFC]/20">
              K
            </div>
            <span className="font-extrabold text-white text-sm tracking-wide">Kre8ors OS</span>
            <span className="text-[9px] bg-[#7C5CFC]/10 border border-[#7C5CFC]/25 text-[#7C5CFC] font-black rounded-full px-2 py-0.5 uppercase tracking-wide">Pro</span>
          </div>
        )}

        {/* Collapsible toggle buttons */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className={`p-1.5 hover:bg-[#181B23] border border-[#252A35]/30 rounded-[8px] text-[#94A3B8] hover:text-white transition-colors ${
            isCollapsed ? 'mx-auto' : ''
          }`}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Creator Context Dropdown Selector */}
      <div className="p-3 border-b border-[#252A35] bg-[#0F1117]/20 flex-shrink-0">
        {isCollapsed ? (
          <div className="h-9 w-9 mx-auto rounded-full bg-[#181B23] border border-[#252A35] flex items-center justify-center font-black text-white text-xs" title={activeCreator?.displayName}>
            {activeCreator?.displayName?.charAt(0) || '@'}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            <span className="text-[9px] uppercase font-bold text-[#94A3B8] tracking-wider block">Active Creator</span>
            <select
              value={activeCreator?.id || ''}
              onChange={(e) => handleCreatorChange(e.target.value)}
              className="w-full bg-[#181B23] border border-[#252A35] rounded-[8px] px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#7C5CFC] font-bold cursor-pointer"
            >
              {creators.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#181B23]">
                  @{c.username}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Shift logging clock button */}
      <div className="p-3 border-b border-[#252A35] flex-shrink-0">
        {isCollapsed ? (
          <button
            onClick={handleShiftClock}
            className={`p-2 rounded-full mx-auto block transition-colors ${
              isShiftActive ? 'bg-[#16C784]/10 text-[#16C784]' : 'bg-[#FF5B5B]/10 text-[#FF5B5B]'
            }`}
            title={isShiftActive ? 'Shift Active (Clock Out)' : 'Shift Inactive (Clock In)'}
          >
            <Clock className="h-4.5 w-4.5" />
          </button>
        ) : (
          <button
            onClick={handleShiftClock}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-[8px] text-xs font-bold transition-all ${
              isShiftActive
                ? 'bg-[#16C784]/15 border border-[#16C784]/20 text-[#16C784]'
                : 'bg-[#FF5B5B]/15 border border-[#FF5B5B]/20 text-[#FF5B5B]'
            }`}
          >
            <span className="flex items-center gap-2">
              <Clock className={`h-4 w-4 ${isShiftActive ? 'animate-pulse' : ''}`} />
              {isShiftActive ? 'Shift Logged' : 'Clocked Out'}
            </span>
            <span className="text-[9px] font-black uppercase tracking-wider">
              {isShiftActive ? 'Active' : 'Clock In'}
            </span>
          </button>
        )}
      </div>

      {/* API Reference Directory list */}
      <div className="flex-1 py-4 overflow-y-auto space-y-4 px-3 scrollbar-thin">
        {apiGroups.map((group) => {
          const Icon = group.icon;
          const isExpanded = expandedGroups[group.id];

          return (
            <div key={group.id} className="space-y-1.5">
              {/* Category Header */}
              {isCollapsed ? (
                <div className="flex justify-center py-1 text-[#7C5CFC]" title={group.name}>
                  <Icon className="h-5 w-5" />
                </div>
              ) : (
                <button
                  onClick={() => toggleGroup(group.id)}
                  className="w-full flex items-center justify-between text-xs font-bold text-[#7C5CFC] hover:text-[#8d71fd] transition-colors px-1"
                >
                  <span className="flex items-center gap-2 uppercase tracking-wider text-[10px]">
                    <Icon className="h-3.5 w-3.5" />
                    {group.name}
                  </span>
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </button>
              )}

              {/* Sub items */}
              {!isCollapsed && isExpanded && (
                <div className="space-y-1 pl-5 border-l border-[#252A35]/50 ml-1.5">
                  {group.items.map((item) => {
                    const isActive = pathname === item.path;
                    return (
                      <Link key={item.name} href={item.path} passHref>
                        <span
                          className={`flex items-center justify-between py-1 text-[11px] font-semibold cursor-pointer transition-colors ${
                            isActive ? 'text-white' : 'text-[#94A3B8] hover:text-white'
                          }`}
                        >
                          <span className="truncate pr-2">{item.name}</span>
                          {item.method && (
                            <span className={`text-[9px] font-extrabold uppercase shrink-0 ${getMethodColor(item.method)}`}>
                              {item.method}
                            </span>
                          )}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Operator Info */}
      <div className="p-4 border-t border-[#252A35] bg-[#0F1117]/20 flex items-center flex-shrink-0">
        {isCollapsed ? (
          <div className="h-8 w-8 mx-auto rounded-full bg-[#181B23] border border-[#252A35] flex items-center justify-center font-bold text-white text-xs">
            OP
          </div>
        ) : (
          <div className="flex items-center justify-between w-full">
            <div>
              <span className="text-xs font-bold text-white block">Operator Shift</span>
              <span className="text-[10px] text-[#94A3B8] mt-0.5 block">Level 1 Chatter</span>
            </div>
            <button
              onClick={() => alert('Log out simulated successfully')}
              className="p-1.5 hover:bg-[#FF5B5B]/10 hover:text-[#FF5B5B] rounded-[8px] text-[#94A3B8] transition-colors"
              title="Logout session"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
