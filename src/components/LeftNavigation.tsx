'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useGlobalStore } from '@/lib/store/global-store';
import { Creator } from '@/types';
import {
  LayoutDashboard,
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
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LeftNavigation() {
  const pathname = usePathname();
  const { activeCreator, setActiveCreator, isShiftActive, activeShiftId, startShift, endShift } = useGlobalStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [creators, setCreators] = useState<Creator[]>([]);
  const [notificationsCount, setNotificationsCount] = useState<number>(3);

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

  // Main navigation items
  const menuItems = [
    { name: 'Dashboard', path: '/', icon: LayoutDashboard },
    { name: 'Inbox Chat', path: '/messages', icon: MessageSquare, badge: notificationsCount },
    { name: 'Feed Posts', path: '/content', icon: FileText },
    { name: 'Automations', path: '/automations', icon: Zap },
    { name: 'CRM Fans', path: '/fans', icon: Users },
    { name: 'Earnings', path: '/earnings', icon: DollarSign },
    { name: 'Analytics', path: '/analytics', icon: BarChart3 },
    { name: 'Stories & PPV', path: '/messages/ppv-builder', icon: Compass },
    { name: 'Settings', path: '/settings', icon: Settings }
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

  return (
    <motion.div
      animate={{ width: isCollapsed ? 76 : 240 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full bg-[#13161D] border-r border-[#252A35] flex flex-col flex-shrink-0 select-none text-zinc-300 overflow-hidden"
    >
      {/* Workspace Branding Logo header */}
      <div className="p-4 border-b border-[#252A35] flex items-center justify-between h-16">
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
      <div className="p-3 border-b border-[#252A35] bg-[#0F1117]/20">
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
      <div className="p-3 border-b border-[#252A35]">
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

      {/* Navigation Directory list */}
      <div className="flex-1 py-4 overflow-y-auto space-y-1 px-2.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path;
          return (
            <Link key={item.name} href={item.path} passHref>
              <span
                className={`flex items-center rounded-[8px] py-2.5 transition-all cursor-pointer ${
                  isCollapsed ? 'justify-center px-0' : 'px-3 gap-3'
                } ${
                  isActive
                    ? 'bg-[#7C5CFC] text-white font-extrabold shadow-sm'
                    : 'hover:bg-[#181B23]/60 hover:text-white text-[#94A3B8] font-medium'
                }`}
                title={item.name}
              >
                <Icon className="h-4.5 w-4.5 flex-shrink-0" />
                {!isCollapsed && <span className="text-xs">{item.name}</span>}
                {!isCollapsed && item.badge && (
                  <span className="ml-auto bg-[#FF5B5B] text-white text-[10px] font-black rounded-full h-4 min-w-4 px-1.5 flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </span>
            </Link>
          );
        })}
      </div>

      {/* Footer Operator Info */}
      <div className="p-4 border-t border-[#252A35] bg-[#0F1117]/20 flex items-center">
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
