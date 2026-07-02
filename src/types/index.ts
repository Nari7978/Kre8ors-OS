export type UserRole = 'AGENCY_OWNER' | 'MANAGER' | 'CHATTER' | 'CREATOR';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  agencyId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export type CreatorStatus = 'ACTIVE' | 'DISCONNECTED' | 'PENDING';

export interface Creator {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  status: CreatorStatus;
  authId: string;
  sessCookie: string;
  userAgent: string;
  xBcHeader: string | null;
  agencyId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface Fan {
  id: string;
  ofId: string;
  creatorId: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  isSubscriber: boolean;
  totalSpent: number;
  notes: string | null;
  customTags: string[];
  subscribedAt: Date | string;
  expiresAt: Date | string | null;
}

export interface FanProfileUpdatePayload {
  fanId: string;
  displayName?: string;
  notes?: string;
  customTags?: string[];
  isSubscriber?: boolean;
  expiresAt?: string | null;
}

export interface Message {
  id: string;
  ofMessageId: string;
  creatorId: string;
  fanId: string;
  direction: 'in' | 'out';
  text: string | null;
  mediaUrls: string[];
  isTip: boolean;
  tipAmount: number;
  isPurchased: boolean;
  sentAt: Date | string;
}

export interface MediaItem {
  id: string;
  creatorId: string;
  name: string;
  url: string;
  thumbnail: string | null;
  fileType: 'image' | 'video' | 'audio';
  fileSize: number;
  folderName: string;
  createdAt: Date | string;
}

export type PostStatus = 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

export interface Post {
  id: string;
  creatorId: string;
  text: string;
  mediaUrls: string[];
  scheduledFor: Date | string | null;
  status: PostStatus;
  price: number;
  ofPostId: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface EarningRecord {
  id: string;
  creatorId: string;
  source: 'subscription' | 'tip' | 'ppv_chat' | 'ppv_post';
  amount: number;
  netAmount: number; // net of 20% OF fee
  fanOfId: string | null;
  loggedAt: Date | string;
}

export interface ShiftLog {
  id: string;
  userId: string;
  startTime: Date | string;
  endTime: Date | string | null;
  revenue: number;
}

export interface AutomationRule {
  id: string;
  creatorId: string;
  name: string;
  triggerType: 'new_subscriber' | 'keyword_match' | 'idle_fan';
  conditions: Record<string, any>;
  actionType: 'send_message' | 'add_tag' | 'send_media';
  actionData: Record<string, any>;
  isActive: boolean;
  createdAt: Date | string;
}

export interface Story {
  id: string;
  creatorId: string;
  mediaUrl: string;
  scheduledFor: Date | string;
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface PpvPricingRule {
  id?: string;
  ruleType: 'spend_tier' | 'tag_discount';
  minSpend?: number;
  priceOverride?: number;
  tag?: string;
  discountPercent?: number;
}

export interface PpvTemplate {
  id: string;
  creatorId: string;
  name: string;
  description: string | null;
  price: number; // base price
  pricingRules: PpvPricingRule[];
  messageText: string;
  mediaUrls: string[];
  lockType: 'single' | 'bundle' | 'preview';
  previewSeconds: number;
  createdAt: Date | string;
  updatedAt: Date | string;
}

