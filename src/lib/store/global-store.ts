import { create } from 'zustand';
import { Creator } from '@/types';

interface GlobalState {
  // Active Creator Context
  activeCreator: Creator | null;
  setActiveCreator: (creator: Creator | null) => void;
  
  // UI states
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setSidebarOpen: (isOpen: boolean) => void;
  
  // Active shift tracking (For Chatters)
  isShiftActive: boolean;
  activeShiftId: string | null;
  startShift: (shiftId: string) => void;
  endShift: () => void;

  // Paginated chat viewport cache (For Day 17 message caching)
  chatCache: Record<string, { messages: any[]; hasMore: boolean; nextCursor: string | null }>;
  setChatCache: (key: string, cache: { messages: any[]; hasMore: boolean; nextCursor: string | null }) => void;
  clearChatCache: (key: string) => void;
}

export const useGlobalStore = create<GlobalState>((set) => ({
  activeCreator: null,
  setActiveCreator: (creator) => set({ activeCreator: creator }),
  
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setSidebarOpen: (isOpen) => set({ isSidebarOpen: isOpen }),
  
  isShiftActive: false,
  activeShiftId: null,
  startShift: (shiftId) => set({ isShiftActive: true, activeShiftId: shiftId }),
  endShift: () => set({ isShiftActive: false, activeShiftId: null }),

  chatCache: {},
  setChatCache: (key, cache) => set((state) => ({
    chatCache: {
      ...state.chatCache,
      [key]: cache
    }
  })),
  clearChatCache: (key) => set((state) => {
    const updated = { ...state.chatCache };
    delete updated[key];
    return { chatCache: updated };
  }),
}));
