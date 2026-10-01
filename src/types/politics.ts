export type PartyId = 
  | 'labour' 
  | 'conservative' 
  | 'reform' 
  | 'libdem' 
  | 'green' 
  | 'snp' 
  | 'plaid' 
  | 'restore';

export interface Party {
  id: PartyId;
  name: string;
  shortName: string;
  color: string;
  secondaryColor?: string;
  textColor: string;
  leader: string;
  leaderTitle: string;
  founded: number;
  orientation: string;
  seats: number;
  motto: string;
  description: string;
  avatarText: string;
  website: string;
  seatsLastVerified?: string;
  compass?: PartyCompass;
}

export interface PartyCompass {
  economicScore: number; // -10 (Left) to +10 (Right)
  socialScore: number;   // -10 (Libertarian) to +10 (Authoritarian)
  quadrant: 'Auth-Left' | 'Auth-Right' | 'Lib-Left' | 'Lib-Right' | 'Lib-Centre' | 'Centrist';
  summary: string;
  rationale: string;
}

export interface CompassCoordinates {
  economic: number; // -10 (Left) to +10 (Right)
  social: number;   // -10 (Libertarian) to +10 (Authoritarian)
  quadrant: string;
  summary: string;
  rationale?: string;
}

export interface CabinetMember {
  id: string;
  partyId: PartyId;
  name: string;
  role: string;
  isLeader?: boolean;
  constituency?: string;
  bio: string;
  keyStance: string;
  photoUrl?: string;
  appointedDate: string;
  portfolioStatus?: 'Active' | 'Reshuffled' | 'New Appointment';
}

export type PolicyCategory = 
  | 'defence'
  | 'economy'
  | 'nhs'
  | 'immigration'
  | 'housing'
  | 'energy'
  | 'crime'
  | 'education'
  | 'welfare';

export interface CategoryInfo {
  id: PolicyCategory;
  name: string;
  iconName: string;
  description: string;
  keyMetric: string;
}

export interface PolicyPledge {
  partyId: PartyId;
  headline: string;
  summary: string;
  keyPoints: string[];
  costEstimate?: string;
  targetTimeline?: string;
  factCheckSnippet?: string;
  factCheckVerdict?: 'verified' | 'disputed' | 'unfunded' | 'clarified';
  factCheckSource?: string;
  factCheckUrl?: string;
  publicSupport?: number; // e.g. 64% public support
  officialSourceUrl?: string;
  officialSourceTitle?: string;
  lastVerifiedDate?: string;
}

export interface PolicyTopic {
  id: string;
  category: PolicyCategory;
  title: string;
  description: string;
  officialFigureBenchmark?: {
    label: string;
    value: string;
    source: string;
  };
  publicOpinionQuestion?: string;
  publicOpinionSupportOverall?: number;
  pledges: Record<PartyId, PolicyPledge>;
  compass?: CompassCoordinates;
}

export interface PollPoint {
  date: string;
  pollster: string;
  sampleSize: number;
  labour: number;
  conservative: number;
  reform: number;
  libdem: number;
  green: number;
  snp: number;
  others: number;
  leadParty: PartyId;
  leadMargin: number;
}

export interface PolicyPopularityItem {
  policy: string;
  category: PolicyCategory;
  supportPct: number;
  opposePct: number;
  unsurePct: number;
  pollster: string;
  date: string;
  partiesSupporting: PartyId[];
}

export interface LeaderRating {
  partyId: PartyId;
  leaderName: string;
  role: string;
  approvePct: number;
  disapprovePct: number;
  netRating: number; // approve - disapprove
  dontKnowPct: number;
  pollster: string;
  date: string;
  trend: string;
}

export interface PollsterLeaderSet {
  pollsterId: string;
  pollsterName: string;
  date: string;
  sampleSize: number;
  methodology: string;
  ratings: LeaderRating[];
}

export interface BestPrimeMinisterPoll {
  date: string;
  pollster: string;
  burnham?: number;
  starmer?: number;
  badenoch: number;
  farage: number;
  davey: number;
  neitherUnsure: number;
}

export interface FactCheckItem {
  id: string;
  partyId: PartyId;
  speaker: string;
  date: string;
  claim: string;
  verdict: 'Accurate' | 'Misleading' | 'Unproven' | 'Needs Context' | 'False' | 'Disputed';
  explanation: string;
  source: string;
  sourceUrl: string;
  category: PolicyCategory;
}
