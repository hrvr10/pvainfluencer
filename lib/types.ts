export type Role = 'admin' | 'manager' | 'viewer';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: Role;
}

export type CampaignStatus = 'planning' | 'active' | 'completed';

export interface Campaign {
  id: string;
  brandName: string;
  campaignName: string;
  startDate: string;
  endDate?: string;
  status: CampaignStatus;
  notes?: string;
  createdByName: string;
}

export const INFLUENCER_STAGES = [
  'shortlisted',
  'contacted',
  'negotiating',
  'confirmed',
  'content_live',
  'paid',
] as const;

export type InfluencerStage = (typeof INFLUENCER_STAGES)[number];
export type InfluencerStatus = InfluencerStage | 'declined';

export const STAGE_LABELS: Record<InfluencerStatus, string> = {
  shortlisted: 'Shortlisted',
  contacted: 'Contacted',
  negotiating: 'Negotiating',
  confirmed: 'Confirmed',
  content_live: 'Content live',
  paid: 'Paid',
  declined: 'Declined',
};

export type Platform = 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'other';

export interface Influencer {
  id: string;
  name: string;
  handle: string;
  platform: Platform;
  followers?: number;
  email?: string;
  phone?: string;
  niche?: string;
  location?: string;
  rate?: string;
  status: InfluencerStatus;
  notes?: string;
  lastConversationSummary?: string;
  lastConversationDate?: string;
  lastConversationScreenshotUrl?: string;
  profileScreenshotUrl?: string;
}

export interface Conversation {
  id: string;
  date: string;
  summary: string;
  nextFollowUp?: string;
  loggedByName: string;
  /** @deprecated superseded by screenshotUrls; kept for conversations logged before multi-screenshot support */
  screenshotUrl?: string;
  screenshotUrls?: string[];
}
