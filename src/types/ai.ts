// AI Module Type Definitions

export type AITone = 'flirty' | 'professional' | 'casual' | 'aggressive-sales';

export type AISuggestionCategory = 'openers' | 'ppv' | 'gratitude' | 'reEngage';

export interface AIToneProfile {
  id: AITone;
  label: string;
  description: string;
  icon: string;
  color: string;
  borderColor: string;
  bgColor: string;
}

export const AI_TONE_PROFILES: AIToneProfile[] = [
  {
    id: 'flirty',
    label: 'Flirty',
    description: 'Playful, teasing, and emotionally engaging messages',
    icon: '💋',
    color: 'text-pink-400',
    borderColor: 'border-pink-500/20',
    bgColor: 'bg-pink-500/10',
  },
  {
    id: 'professional',
    label: 'Professional',
    description: 'Polished, respectful, and value-driven communication',
    icon: '💼',
    color: 'text-blue-400',
    borderColor: 'border-blue-500/20',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'casual',
    label: 'Casual',
    description: 'Relaxed, friendly, and approachable tone',
    icon: '✌️',
    color: 'text-emerald-400',
    borderColor: 'border-emerald-500/20',
    bgColor: 'bg-emerald-500/10',
  },
  {
    id: 'aggressive-sales',
    label: 'Aggressive Sales',
    description: 'Urgency-driven, deal-focused, and high-conversion messaging',
    icon: '🚀',
    color: 'text-amber-400',
    borderColor: 'border-amber-500/20',
    bgColor: 'bg-amber-500/10',
  },
];

export interface AISuggestion {
  id: string;
  label: string;
  text: string;
  tone: AITone;
  category: AISuggestionCategory;
  confidence: number;
}

export interface AISuggestionContext {
  fanName: string;
  totalSpent: number;
  spendingTier: string;
  activeTone: AITone;
  messageHistoryLength: number;
}

export interface AISuggestionResponse {
  suggestions: AISuggestion[];
  context: AISuggestionContext;
}

export interface AIPromptTemplate {
  id: string;
  name: string;
  tone: AITone;
  category: AISuggestionCategory;
  promptText: string;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AIConversationAnalysis {
  fanIntent: string;
  mood: string;
  spendingSignals: string[];
  recommendedCategory: AISuggestionCategory;
  recommendedTone: AITone;
  engagementScore: number;
  summary: string;
}

export interface AIUsageStats {
  totalSuggestionsGenerated: number;
  totalSuggestionsUsed: number;
  usageRate: number;
  topTone: AITone;
  topCategory: AISuggestionCategory;
  dailyUsage: { date: string; generated: number; used: number }[];
}

export interface AISettingsPayload {
  defaultTone: AITone;
  autoSuggestEnabled: boolean;
  maxSuggestionsPerRequest: number;
  customTemplates: AIPromptTemplate[];
}
