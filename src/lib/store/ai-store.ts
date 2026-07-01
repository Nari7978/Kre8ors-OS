import { create } from 'zustand';
import { AITone, AISuggestionCategory, AIPromptTemplate, AISuggestion } from '@/types/ai';

interface AIState {
  // Active tone and category configuration
  activeTone: AITone;
  setActiveTone: (tone: AITone) => void;

  activeCategory: AISuggestionCategory;
  setActiveCategory: (category: AISuggestionCategory) => void;

  // Auto-suggest toggle
  autoSuggestEnabled: boolean;
  toggleAutoSuggest: () => void;
  setAutoSuggest: (enabled: boolean) => void;

  // Current suggestions cache
  currentSuggestions: AISuggestion[];
  setCurrentSuggestions: (suggestions: AISuggestion[]) => void;
  clearSuggestions: () => void;

  // Saved prompt templates
  savedTemplates: AIPromptTemplate[];
  setSavedTemplates: (templates: AIPromptTemplate[]) => void;
  addTemplate: (template: AIPromptTemplate) => void;
  removeTemplate: (templateId: string) => void;

  // AI Panel visibility
  isPanelOpen: boolean;
  togglePanel: () => void;
  setPanelOpen: (isOpen: boolean) => void;

  // Loading and generation state
  isGenerating: boolean;
  setIsGenerating: (generating: boolean) => void;

  // Usage tracking (local session)
  sessionSuggestionsGenerated: number;
  sessionSuggestionsUsed: number;
  incrementGenerated: () => void;
  incrementUsed: () => void;
  resetSessionStats: () => void;
}

export const useAIStore = create<AIState>((set) => ({
  // Default tone and category
  activeTone: 'flirty',
  setActiveTone: (tone) => set({ activeTone: tone }),

  activeCategory: 'openers',
  setActiveCategory: (category) => set({ activeCategory: category }),

  // Auto-suggest defaults to on
  autoSuggestEnabled: true,
  toggleAutoSuggest: () => set((state) => ({ autoSuggestEnabled: !state.autoSuggestEnabled })),
  setAutoSuggest: (enabled) => set({ autoSuggestEnabled: enabled }),

  // Suggestions cache
  currentSuggestions: [],
  setCurrentSuggestions: (suggestions) => set({ currentSuggestions: suggestions }),
  clearSuggestions: () => set({ currentSuggestions: [] }),

  // Saved templates
  savedTemplates: [],
  setSavedTemplates: (templates) => set({ savedTemplates: templates }),
  addTemplate: (template) => set((state) => ({
    savedTemplates: [...state.savedTemplates, template],
  })),
  removeTemplate: (templateId) => set((state) => ({
    savedTemplates: state.savedTemplates.filter((t) => t.id !== templateId),
  })),

  // Panel visibility
  isPanelOpen: false,
  togglePanel: () => set((state) => ({ isPanelOpen: !state.isPanelOpen })),
  setPanelOpen: (isOpen) => set({ isPanelOpen: isOpen }),

  // Generation state
  isGenerating: false,
  setIsGenerating: (generating) => set({ isGenerating: generating }),

  // Session usage tracking
  sessionSuggestionsGenerated: 0,
  sessionSuggestionsUsed: 0,
  incrementGenerated: () => set((state) => ({
    sessionSuggestionsGenerated: state.sessionSuggestionsGenerated + 1,
  })),
  incrementUsed: () => set((state) => ({
    sessionSuggestionsUsed: state.sessionSuggestionsUsed + 1,
  })),
  resetSessionStats: () => set({
    sessionSuggestionsGenerated: 0,
    sessionSuggestionsUsed: 0,
  }),
}));
