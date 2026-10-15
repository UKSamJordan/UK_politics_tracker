import React, { useState } from 'react';
import { Party, PartyId, PolicyTopic } from '../types/politics';
import { 
  Shield, 
  TrendingUp, 
  HeartPulse, 
  Plane, 
  Zap, 
  Home, 
  Heart,
  Globe,
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Info, 
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  RefreshCw,
  GraduationCap,
  Quote,
  Trash2,
  BookOpen
} from 'lucide-react';
import { SectionRefreshButton } from './SectionRefreshButton';
import { PolicyChangeReport } from '../services/liveUpdater';
import {
  verifyPledgeRecency,
  PledgeVerificationResult,
  isQuoteStaleOrInvalid,
  generateCustomPolicyComparison
} from '../services/policyTrackerQuery';

interface PolicyMatrixProps {
  parties: Party[];
  selectedParties: PartyId[];
  policies: PolicyTopic[];
  onRefreshPolicies?: (category?: string) => Promise<PolicyChangeReport | void> | void;
}

const CUSTOM_POLICIES_STORAGE_KEY = 'uk_politics_custom_policy_topics_v1';

const SUGGESTED_CUSTOM_TOPICS = [
  'Transport, Rail & HS2',
  'Crime, Policing & Prisons',
  'Water Companies & Sewage',
  'Farming & Inheritance Tax',
  'Childcare & Early Years',
  'AI & Tech Regulation',
];

interface CategoryTheme {
  icon: any;
  badgeBg: string;
  badgeText: string;
  borderAccent: string;
  headerTint: string;
  label: string;
}

const CATEGORY_THEMES: Record<string, CategoryTheme> = {
  defence: {
    icon: Shield,
    badgeBg: 'bg-indigo-500/20 border-indigo-400/40',
    badgeText: 'text-indigo-300',
    borderAccent: 'border-l-4 border-l-indigo-500',
    headerTint: 'from-indigo-950/60 via-slate-900 to-slate-900',
    label: 'Defence & Armed Forces',
  },
  economy: {
    icon: TrendingUp,
    badgeBg: 'bg-emerald-500/20 border-emerald-400/40',
    badgeText: 'text-emerald-300',
    borderAccent: 'border-l-4 border-l-emerald-500',
    headerTint: 'from-emerald-950/60 via-slate-900 to-slate-900',
    label: 'Economy, Tax & Growth',
  },
  welfare: {
    icon: Heart,
    badgeBg: 'bg-pink-500/20 border-pink-400/40',
    badgeText: 'text-pink-300',
    borderAccent: 'border-l-4 border-l-pink-500',
    headerTint: 'from-pink-950/60 via-slate-900 to-slate-900',
    label: 'Pensions & Welfare',
  },
  nhs: {
    icon: HeartPulse,
    badgeBg: 'bg-sky-500/20 border-sky-400/40',
    badgeText: 'text-sky-300',
    borderAccent: 'border-l-4 border-l-sky-500',
    headerTint: 'from-sky-950/60 via-slate-900 to-slate-900',
    label: 'NHS & Healthcare',
  },
  immigration: {
    icon: Plane,
    badgeBg: 'bg-rose-500/20 border-rose-400/40',
    badgeText: 'text-rose-300',
    borderAccent: 'border-l-4 border-l-rose-500',
    headerTint: 'from-rose-950/60 via-slate-900 to-slate-900',
    label: 'Immigration & Borders',
  },
  eu: {
    icon: Globe,
    badgeBg: 'bg-blue-500/20 border-blue-400/40',
    badgeText: 'text-blue-300',
    borderAccent: 'border-l-4 border-l-blue-500',
    headerTint: 'from-blue-950/60 via-slate-900 to-slate-900',
    label: 'EU & Trade Relations',
  },
  education: {
    icon: GraduationCap,
    badgeBg: 'bg-teal-500/20 border-teal-400/40',
    badgeText: 'text-teal-300',
    borderAccent: 'border-l-4 border-l-teal-500',
    headerTint: 'from-teal-950/60 via-slate-900 to-slate-900',
    label: 'Education & Universities',
  },
  energy: {
    icon: Zap,
    badgeBg: 'bg-amber-500/20 border-amber-400/40',
    badgeText: 'text-amber-300',
    borderAccent: 'border-l-4 border-l-amber-500',
    headerTint: 'from-amber-950/60 via-slate-900 to-slate-900',
    label: 'Energy & Net Zero',
  },
  housing: {
    icon: Home,
    badgeBg: 'bg-violet-500/20 border-violet-400/40',
    badgeText: 'text-violet-300',
    borderAccent: 'border-l-4 border-l-violet-500',
    headerTint: 'from-violet-950/60 via-slate-900 to-slate-900',
    label: 'Housing & Planning',
  },
  custom: {
    icon: Sparkles,
    badgeBg: 'bg-fuchsia-500/20 border-fuchsia-400/40',
    badgeText: 'text-fuchsia-300',
    borderAccent: 'border-l-4 border-l-fuchsia-500',
    headerTint: 'from-fuchsia-950/60 via-slate-900 to-slate-900',
    label: 'Live Custom Comparison',
  },
};

export const PolicyMatrix: React.FC<PolicyMatrixProps> = ({
  parties,
  selectedParties,
  policies,
  onRefreshPolicies,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  // Open only the first topic by default so users aren't overwhelmed by 9 open sections at once
  const [expandedTopics, setExpandedTopics] = useState<Record<string, boolean>>({
    'defence-spending-and-military': true,
  });
  // Track which individual party cards have their Layer-2 Deep Dive expanded
  const [expandedCardDetails, setExpandedCardDetails] = useState<Record<string, boolean>>({});
  const [showCustomDrawerMobile, setShowCustomDrawerMobile] = useState(false);

  const [lastChangeReport, setLastChangeReport] = useState<PolicyChangeReport | null>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);

  // Live Custom Policy Comparator State
  const [customTopics, setCustomTopics] = useState<PolicyTopic[]>(() => {
    try {
      const saved = localStorage.getItem(CUSTOM_POLICIES_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [customTopicInput, setCustomTopicInput] = useState('');
  const [isGeneratingCustom, setIsGeneratingCustom] = useState(false);
  const [customError, setCustomError] = useState<string | null>(null);

  const toggleTopicExpanded = (topicId: string) => {
    setExpandedTopics((prev) => ({
      ...prev,
      [topicId]: !prev[topicId],
    }));
  };

  const toggleCardDeepDive = (cardKey: string) => {
    setExpandedCardDetails((prev) => ({
      ...prev,
      [cardKey]: !prev[cardKey],
    }));
  };

  const scrollToPartyCard = (topicId: string, partyId: string) => {
    const el = document.getElementById(`policy-card-${topicId}-${partyId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
    }
  };

  const handleGenerateCustomTopic = async (queryOverride?: string) => {
    const queryToRun = (queryOverride ?? customTopicInput).trim();
    if (!queryToRun || isGeneratingCustom) return;

    setIsGeneratingCustom(true);
    setCustomError(null);
    try {
      const generatedTopic = await generateCustomPolicyComparison(queryToRun);
      const updated = [
        generatedTopic,
        ...customTopics.filter((t) => t.title.toLowerCase() !== generatedTopic.title.toLowerCase()),
      ];
      setCustomTopics(updated);
      localStorage.setItem(CUSTOM_POLICIES_STORAGE_KEY, JSON.stringify(updated));
      setCustomTopicInput('');
      setSearchQuery('');
      setSelectedCategory('all');
      setExpandedTopics((prev) => ({ ...prev, [generatedTopic.id]: true }));
      setShowCustomDrawerMobile(false);
    } catch (err: any) {
      console.error('Custom policy comparison failed:', err);
      setCustomError(err?.message || 'Failed to generate live 8-party comparison. Please try again.');
    } finally {
      setIsGeneratingCustom(false);
    }
  };

  const handleRemoveCustomTopic = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = customTopics.filter((t) => t.id !== id);
    setCustomTopics(updated);
    localStorage.setItem(CUSTOM_POLICIES_STORAGE_KEY, JSON.stringify(updated));
  };

  // AI Pledge Recency Verification State
  const PLEDGE_VERIF_STORAGE_KEY = 'uk_politics_pledge_verifications_v5';
  const [pledgeVerifications, setPledgeVerifications] = useState<Record<string, PledgeVerificationResult>>(() => {
    try {
      localStorage.removeItem('uk_politics_pledge_verifications_v4');
      const saved = localStorage.getItem(PLEDGE_VERIF_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const cleaned: Record<string, PledgeVerificationResult> = {};
        for (const [k, v] of Object.entries(parsed)) {
          const item = v as PledgeVerificationResult;
          if (
            item && 
            item.latestQuote !== 'Registered on official party platform and Hansard records.' &&
            item.quoteSpeaker &&
            !isQuoteStaleOrInvalid(item.quoteDate, item.quoteSpeaker, item.rawText, k.split('-').pop())
          ) {
            cleaned[k] = item;
          }
        }
        return cleaned;
      }
      return {};
    } catch {
      return {};
    }
  });
  const [loadingPledgeKey, setLoadingPledgeKey] = useState<string | null>(null);
  const [expandedPledgeKey, setExpandedPledgeKey] = useState<string | null>(null);
  const [verificationBadges, setVerificationBadges] = useState<Record<string, string>>(() => {
    try {
      const saved = localStorage.getItem('uk_politics_manual_verif_badges');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  const handleVerifyPledge = async (
    topic: PolicyTopic,
    party: Party,
    pledge: any,
    forceRefresh: boolean = false
  ) => {
    const key = `${topic.id}-${party.id}`;

    if (expandedPledgeKey === key && !forceRefresh) {
      setExpandedPledgeKey(null);
      return;
    }

    if (pledgeVerifications[key] && !forceRefresh) {
      setExpandedPledgeKey(key);
      return;
    }

    setLoadingPledgeKey(key);
    setExpandedPledgeKey(key);

    try {
      const result = await verifyPledgeRecency(
        party.name,
        topic.title,
        pledge.headline,
        pledge.summary,
        { topicId: topic.id, partyId: party.id }
      );

      const updated = {
        ...pledgeVerifications,
        [key]: result,
      };
      setPledgeVerifications(updated);
      localStorage.setItem(PLEDGE_VERIF_STORAGE_KEY, JSON.stringify(updated));
    } catch (err: any) {
      console.error('Failed to verify pledge:', err);
    } finally {
      setLoadingPledgeKey(null);
    }
  };

  const handleApplyVerificationBadge = (topicId: string, partyId: string) => {
    const key = `${topicId}-${partyId}`;
    const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const updated = {
      ...verificationBadges,
      [key]: `AI Scrutinised: ${today}`,
    };
    setVerificationBadges(updated);
    localStorage.setItem('uk_politics_manual_verif_badges', JSON.stringify(updated));
  };

  const categories = [
    { id: 'all', label: 'All Policy Areas', icon: null },
    ...(customTopics.length > 0
      ? [{ id: 'custom', label: `Custom (${customTopics.length})`, icon: Sparkles }]
      : []),
    { id: 'defence', label: 'Defence', icon: Shield },
    { id: 'economy', label: 'Economy & Tax', icon: TrendingUp },
    { id: 'welfare', label: 'Pensions & Welfare', icon: Heart },
    { id: 'nhs', label: 'NHS', icon: HeartPulse },
    { id: 'immigration', label: 'Immigration', icon: Plane },
    { id: 'eu', label: 'EU & Trade', icon: Globe },
    { id: 'education', label: 'Education', icon: GraduationCap },
    { id: 'energy', label: 'Energy', icon: Zap },
    { id: 'housing', label: 'Housing', icon: Home },
  ];

  // Combine custom-generated topics at the top with core policy topics
  const allPolicies = [...customTopics, ...policies];

  // Filter policies based on category and search query
  const filteredPolicies = allPolicies.filter((topic) => {
    const matchesCategory = selectedCategory === 'all' || topic.category === selectedCategory;
    const matchesSearch = 
      searchQuery.trim() === '' ||
      topic.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      Object.values(topic.pledges).some(
        (p) =>
          p.headline.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.keyPoints.some((k) => k.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    return matchesCategory && matchesSearch;
  });

  const activeParties = parties.filter((p) => selectedParties.includes(p.id));

  const getVerdictBadge = (verdict?: string) => {
    switch (verdict) {
      case 'verified':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            <span>Fact Check: Grounded</span>
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            <span>Fact Check: Disputed</span>
          </span>
        );
      case 'unfunded':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <AlertTriangle className="w-3 h-3 text-rose-400" />
            <span>IFS: Fiscal Shortfall</span>
          </span>
        );
      case 'clarified':
        return (
          <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-md text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30">
            <Info className="w-3 h-3 text-sky-400" />
            <span>Context Attached</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleRefreshWithDiff = async () => {
    if (onRefreshPolicies) {
      const report = await onRefreshPolicies(selectedCategory);
      if (report && typeof report === 'object' && 'hasChanges' in report) {
        setLastChangeReport(report as PolicyChangeReport);
        setShowReportDetails(true);
      }
    }
  };

  const handleExpandCollapseAll = (expand: boolean) => {
    const next: Record<string, boolean> = {};
    for (const t of filteredPolicies) {
      next[t.id] = expand;
    }
    setExpandedTopics(next);
  };

  return (
    <div className="space-y-5">
      {/* Top Control Card: Category Pills, Search & Custom Policy Comparator */}
      <div className="bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-700 shadow-md space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-2xl font-extrabold text-white">
              Policy Comparison Matrix
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-0.5">
              Tap any policy area below, then <strong className="text-indigo-300">tap a party tab or swipe sideways</strong> to compare stances.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            <SectionRefreshButton
              sectionName={selectedCategory === 'all' ? 'Policy Matrix' : `${categories.find((c) => c.id === selectedCategory)?.label || 'Policy'} Matrix`}
              defaultDate="October 2026 • Live Grounded"
              onRefresh={handleRefreshWithDiff}
            />

            {/* Filter Existing Pledges Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search keyword (e.g. Brexit, NHS)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && searchQuery.trim() && filteredPolicies.length === 0) {
                    handleGenerateCustomTopic(searchQuery);
                  }
                }}
                className="w-full sm:w-60 pl-9 pr-4 py-2 bg-slate-800 border border-slate-600 rounded-xl text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800">
          <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] max-w-full min-w-0">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => {
                    setSelectedCategory(cat.id);
                    if (cat.id !== 'all') {
                      const match = allPolicies.find((p) => p.category === cat.id);
                      if (match) {
                        setExpandedTopics((prev) => ({ ...prev, [match.id]: true }));
                      }
                    }
                  }}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                      : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white'
                  }`}
                >
                  {Icon && <Icon className="w-3.5 h-3.5" />}
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <div className="hidden md:flex items-center space-x-1.5 shrink-0">
            <button
              onClick={() => handleExpandCollapseAll(true)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold cursor-pointer"
            >
              Expand All
            </button>
            <button
              onClick={() => handleExpandCollapseAll(false)}
              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-[11px] font-bold cursor-pointer"
            >
              Collapse All
            </button>
          </div>
        </div>

        {/* Mobile Toggle Button for Custom Policy Topic Generator */}
        <div className="pt-1">
          <button
            type="button"
            onClick={() => setShowCustomDrawerMobile(!showCustomDrawerMobile)}
            className="lg:hidden w-full py-2 px-3.5 rounded-xl bg-indigo-950/70 hover:bg-indigo-900/70 border border-indigo-500/40 text-indigo-200 text-xs font-extrabold flex items-center justify-between cursor-pointer"
          >
            <span className="flex items-center space-x-2">
              <Sparkles className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>Compare Parties on Any Custom Policy (e.g. Transport, Crime)...</span>
            </span>
            {showCustomDrawerMobile ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {/* Custom Policy Comparator Drawer (Always visible on desktop lg+, toggleable on mobile) */}
          <div className={`${showCustomDrawerMobile ? 'block mt-2' : 'hidden lg:block'} p-3.5 sm:p-4 rounded-xl bg-slate-800/90 border border-indigo-500/30 space-y-2.5`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
              <div className="flex items-start sm:items-center space-x-2">
                <Sparkles className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5 sm:mt-0" />
                <div>
                  <span className="text-xs sm:text-sm font-extrabold text-white">
                    Compare Any Specific Policy Issue Across All 8 Parties
                  </span>
                  <span className="hidden sm:inline text-xs text-slate-300 ml-2">
                    Enter any topic (e.g. Transport & HS2, Crime, Water & Sewage) to generate a live 8-party comparison card.
                  </span>
                </div>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleGenerateCustomTopic();
                }}
                className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full lg:w-auto"
              >
                <input
                  type="text"
                  value={customTopicInput}
                  onChange={(e) => setCustomTopicInput(e.target.value)}
                  placeholder="Type any policy (e.g. Transport & Rail, Crime, Farming)..."
                  disabled={isGeneratingCustom}
                  className="w-full sm:w-72 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-600 text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={isGeneratingCustom || !customTopicInput.trim()}
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center space-x-1.5 transition-all cursor-pointer shrink-0 shadow-sm"
                >
                  {isGeneratingCustom ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Comparing 8 Parties...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Compare Policy</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Quick-Select Popular Policy Topics */}
            <div className="flex items-center flex-wrap gap-1.5 pt-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1">
                Quick compare:
              </span>
              {SUGGESTED_CUSTOM_TOPICS.map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  disabled={isGeneratingCustom}
                  onClick={() => handleGenerateCustomTopic(suggestion)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-indigo-600 text-slate-200 hover:text-white border border-slate-600 hover:border-indigo-400 text-[11px] font-bold transition-all cursor-pointer disabled:opacity-50"
                >
                  + {suggestion}
                </button>
              ))}
            </div>

            {customError && (
              <div className="text-xs text-rose-400 font-medium flex items-center space-x-1.5 pt-1">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{customError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Change Detection Report Banner */}
        {lastChangeReport && (
          <div className={`p-4 rounded-xl border transition-all ${
            lastChangeReport.hasChanges
              ? 'bg-amber-950/50 border-amber-700 text-amber-200'
              : 'bg-emerald-950/50 border-emerald-700 text-emerald-200'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2">
                {lastChangeReport.hasChanges ? (
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                )}
                <div>
                  <span className="font-bold text-xs uppercase tracking-wider block">
                    Policy Change Identification Engine ({lastChangeReport.timestamp})
                  </span>
                  <p className="text-xs mt-0.5">
                    {lastChangeReport.summary}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReportDetails(!showReportDetails)}
                className="text-xs font-semibold underline flex items-center space-x-1 shrink-0 cursor-pointer"
              >
                <span>{showReportDetails ? 'Hide details' : 'View report'}</span>
                {showReportDetails ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>
            </div>

            {showReportDetails && lastChangeReport.changes.length > 0 && (
              <div className="mt-3 pt-3 border-t border-amber-800/80 space-y-1.5 text-xs">
                {lastChangeReport.changes.map((c, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    <strong>{c.partyId.toUpperCase()}</strong> ({c.topicTitle}): <span>{c.details}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Selected parties warning if none */}
      {activeParties.length === 0 && (
        <div className="bg-amber-950/50 border border-amber-700 rounded-2xl p-6 text-center text-amber-200">
          <p className="font-bold">No political parties currently selected for comparison.</p>
          <p className="text-xs mt-1">Please select at least one party using the selector above.</p>
        </div>
      )}

      {/* Prompt to generate a live comparison if the user typed in the filter box */}
      {searchQuery.trim() !== '' && (
        <div className="bg-indigo-950/60 border border-indigo-500/50 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-2.5">
            <Sparkles className="w-5 h-5 text-indigo-400 shrink-0" />
            <div>
              <p className="text-xs sm:text-sm font-bold text-white">
                Want a dedicated 8-party comparison card specifically for "{searchQuery.trim()}"?
              </p>
              <p className="text-[11px] sm:text-xs text-slate-300">
                Our live AI research engine can search 2026 party manifestos, legislation, and Hansard to compare every party on this exact topic.
              </p>
            </div>
          </div>
          <button
            onClick={() => handleGenerateCustomTopic(searchQuery)}
            disabled={isGeneratingCustom}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center space-x-1.5 shrink-0 cursor-pointer shadow-sm"
          >
            {isGeneratingCustom ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Researching 8 Parties...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>Compare All 8 Parties on "{searchQuery.trim()}"</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* Policy Topics Stack */}
      <div className="space-y-4">
        {filteredPolicies.map((topic) => {
          const isExpanded = searchQuery.trim() !== '' || selectedCategory !== 'all' || !!expandedTopics[topic.id];
          const isCustomTopic = topic.category === 'custom';
          const theme = CATEGORY_THEMES[topic.category] || CATEGORY_THEMES.defence;
          const TopicIcon = theme.icon;

          return (
            <div
              key={topic.id}
              className={`bg-slate-900 rounded-2xl border border-slate-700 ${theme.borderAccent} shadow-md overflow-hidden transition-all max-w-full min-w-0`}
            >
              {/* Topic Header Card with Distinct Category Colour Theme */}
              <div
                onClick={() => toggleTopicExpanded(topic.id)}
                className={`p-4 sm:p-5 bg-gradient-to-r ${theme.headerTint} flex items-start sm:items-center justify-between cursor-pointer hover:brightness-110 transition-all ${
                  isExpanded ? 'border-b border-slate-700' : ''
                }`}
              >
                <div className="flex items-start space-x-3 min-w-0 pr-2">
                  <div className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl border ${theme.badgeBg} flex items-center justify-center shrink-0 mt-0.5`}>
                    <TopicIcon className={`w-5 h-5 ${theme.badgeText}`} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-md border text-[10px] font-extrabold uppercase tracking-wider ${theme.badgeBg} ${theme.badgeText}`}>
                        {theme.label}
                      </span>
                      {topic.officialFigureBenchmark && (
                        <span className="text-[11px] text-slate-300 font-medium hidden sm:inline">
                          • Benchmark: <strong className="text-white">{topic.officialFigureBenchmark.value}</strong>
                        </span>
                      )}
                    </div>
                    <h3 className="text-base sm:text-lg font-extrabold text-white leading-snug">
                      {topic.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-slate-300 mt-0.5 line-clamp-2 sm:line-clamp-none">
                      {topic.description}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2 shrink-0 ml-2">
                  {isCustomTopic && (
                    <button
                      onClick={(e) => handleRemoveCustomTopic(topic.id, e)}
                      className="text-slate-400 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-950/40 transition-colors cursor-pointer"
                      title="Remove this custom policy comparison"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}

                  <button
                    type="button"
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer border ${
                      isExpanded
                        ? 'bg-slate-800 text-slate-200 border-slate-600'
                        : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400 shadow-xs'
                    }`}
                  >
                    <span className="hidden sm:inline">{isExpanded ? 'Hide Cards' : `Compare ${activeParties.length} Parties`}</span>
                    <span className="sm:hidden">{isExpanded ? 'Hide' : 'Compare'}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Expanded Policy Comparison Body */}
              {isExpanded && (
                <div>
                  {/* Compact Benchmark & Public Opinion Strip */}
                  <div className="px-4 sm:px-5 py-2.5 bg-slate-800/70 border-b border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    {topic.officialFigureBenchmark && (
                      <div className="flex items-center space-x-1.5 text-slate-200">
                        <span className="text-slate-400 font-semibold">{topic.officialFigureBenchmark.label}:</span>
                        <span className="font-extrabold text-white">{topic.officialFigureBenchmark.value}</span>
                      </div>
                    )}
                    {topic.publicOpinionQuestion && (
                      <div className="flex items-center space-x-2 text-sky-300 font-semibold">
                        <HelpCircle className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate">Public Support: <strong>{topic.publicOpinionSupportOverall}%</strong></span>
                      </div>
                    )}
                  </div>

                  {/* CUE 1 (Mobile): Interactive Party Switcher Bar — Tap a party or swipe sideways */}
                  <div className="md:hidden px-3.5 py-2.5 bg-slate-950/90 border-b border-slate-700 space-y-2">
                    <div className="flex items-center justify-between text-[11px] font-extrabold uppercase tracking-wider text-indigo-300">
                      <span>👆 Tap a party or swipe cards sideways ↔</span>
                      <span className="text-slate-400">{activeParties.length} Parties</span>
                    </div>
                    <div className="flex items-center space-x-1.5 overflow-x-auto pb-0.5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                      {activeParties.map((party, idx) => (
                        <button
                          key={party.id}
                          type="button"
                          onClick={() => scrollToPartyCard(topic.id, party.id)}
                          style={{
                            backgroundColor: party.color,
                            color: party.textColor,
                          }}
                          className="px-2.5 py-1 rounded-lg text-xs font-extrabold whitespace-nowrap shrink-0 shadow-xs flex items-center space-x-1 cursor-pointer active:scale-95 transition-transform"
                        >
                          <span>{idx + 1}. {party.shortName}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* CUE 2: Side-by-Side Columns on Desktop / 86% Peek Cards on Mobile */}
                  <div className={`flex overflow-x-auto snap-x snap-mandatory gap-3.5 p-3.5 sm:p-4 md:p-0 md:gap-0 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] md:grid ${
                    activeParties.length === 1 ? 'md:grid-cols-1' :
                    activeParties.length === 2 ? 'md:grid-cols-2' :
                    activeParties.length === 3 ? 'md:grid-cols-3' :
                    activeParties.length === 4 ? 'md:grid-cols-2 lg:grid-cols-4' :
                    activeParties.length === 5 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5' :
                    activeParties.length === 6 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6' :
                    activeParties.length === 7 ? 'md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-7' :
                    'md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 2xl:grid-cols-8'
                  } md:divide-x divide-slate-700 bg-slate-950/50 md:bg-transparent`}>
                    {activeParties.map((party, partyIdx) => {
                      const pledge = topic.pledges[party.id];
                      if (!pledge) return null;

                      const cardKey = `${topic.id}-${party.id}`;
                      const isDeepDiveOpen = !!expandedCardDetails[cardKey];
                      const prevParty = partyIdx > 0 ? activeParties[partyIdx - 1] : null;
                      const nextParty = partyIdx < activeParties.length - 1 ? activeParties[partyIdx + 1] : null;

                      return (
                        <div
                          key={party.id}
                          id={`policy-card-${topic.id}-${party.id}`}
                          style={{ borderColor: party.color }}
                          className="w-[86%] sm:w-[88%] md:w-auto flex-none snap-start md:snap-align-none rounded-2xl md:rounded-none border-2 md:border-0 flex flex-col justify-between bg-slate-900 overflow-hidden shadow-lg md:shadow-none"
                        >
                          {/* Full-Width Party-Coloured Top Banner so every party is unmistakably distinct */}
                          <div>
                            <div
                              style={{
                                backgroundColor: party.color,
                                color: party.textColor,
                              }}
                              className="px-4 py-3 flex items-center justify-between"
                            >
                              <div>
                                <div className="font-black text-sm sm:text-base tracking-tight">
                                  {party.shortName}
                                </div>
                                <div className="text-[11px] font-bold opacity-90">
                                  Leader: {party.leader}
                                </div>
                              </div>
                              <span
                                style={{
                                  backgroundColor: 'rgba(0,0,0,0.22)',
                                  color: party.textColor,
                                }}
                                className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider"
                              >
                                {partyIdx + 1} of {activeParties.length}
                              </span>
                            </div>

                            {/* LAYER 1: Scannable Core Stance (Headline + Key Points) */}
                            <div className="p-4 sm:p-5 space-y-3.5">
                              {/* Headline */}
                              <h4 className="font-extrabold text-sm sm:text-base text-white leading-snug">
                                {pledge.headline}
                              </h4>

                              {/* Key Points Bullet List */}
                              <div className="space-y-1.5">
                                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                                  Key Pledges at a Glance:
                                </span>
                                <ul className="space-y-2">
                                  {pledge.keyPoints.map((point, i) => (
                                    <li key={i} className="text-xs sm:text-sm text-slate-200 flex items-start space-x-2 leading-relaxed">
                                      <span 
                                        className="w-2 h-2 rounded-full mt-1.5 shrink-0" 
                                        style={{ backgroundColor: party.color }}
                                      />
                                      <span>{point}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>

                              {/* Compact Fact-Check Pill */}
                              {pledge.factCheckVerdict && (
                                <div className="pt-1 flex items-center justify-between flex-wrap gap-1">
                                  {getVerdictBadge(pledge.factCheckVerdict)}
                                  {pledge.costEstimate && (
                                    <span className="text-[11px] text-slate-300 font-semibold truncate max-w-[180px]">
                                      💷 {pledge.costEstimate}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* LAYER 2: Progressive Disclosure Drawer (Full Summary, Costings, Fact Check Quote & Hansard AI) */}
                          <div className="px-4 sm:px-5 pb-4 pt-2 border-t border-slate-800 space-y-3">
                            <button
                              type="button"
                              onClick={() => toggleCardDeepDive(cardKey)}
                              className={`w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-between transition-all cursor-pointer border ${
                                isDeepDiveOpen
                                  ? 'bg-indigo-600 text-white border-indigo-400'
                                  : 'bg-slate-800 hover:bg-slate-700 text-indigo-200 border-slate-600'
                              }`}
                            >
                              <span className="flex items-center space-x-1.5">
                                <BookOpen className="w-3.5 h-3.5" />
                                <span>{isDeepDiveOpen ? 'Hide Full Details & Fact Check' : 'Read Summary, Costings & Fact Check'}</span>
                              </span>
                              {isDeepDiveOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            {isDeepDiveOpen && (
                              <div className="space-y-3 pt-2 animate-fade-in">
                                {/* Full Summary */}
                                <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
                                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-300 block">
                                    Full Policy Summary:
                                  </span>
                                  <p className="text-xs text-slate-200 leading-relaxed">
                                    {pledge.summary}
                                  </p>
                                </div>

                                {/* Cost & Timeline */}
                                <div className="grid grid-cols-1 gap-2 text-xs bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                                  {pledge.costEstimate && (
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Estimated Fiscal Cost:</span>
                                      <span className="font-bold text-white">{pledge.costEstimate}</span>
                                    </div>
                                  )}
                                  {pledge.targetTimeline && (
                                    <div>
                                      <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Timeline:</span>
                                      <span className="font-bold text-white">{pledge.targetTimeline}</span>
                                    </div>
                                  )}
                                </div>

                                {/* Independent Fact Check Quote */}
                                {pledge.factCheckSnippet && (
                                  <div className="bg-slate-800/90 rounded-xl p-3 border border-slate-700 space-y-1.5">
                                    <div className="flex items-center justify-between flex-wrap gap-1">
                                      {getVerdictBadge(pledge.factCheckVerdict)}
                                      <span className="text-[10px] font-semibold text-slate-300">{pledge.factCheckSource}</span>
                                    </div>
                                    <p className="text-xs text-slate-200 italic leading-relaxed">
                                      "{pledge.factCheckSnippet}"
                                    </p>
                                  </div>
                                )}

                                {/* AI Recency Verifier Button & Dossier */}
                                {(() => {
                                  const pledgeKey = `${topic.id}-${party.id}`;
                                  const verification = pledgeVerifications[pledgeKey];
                                  const isExpandedDossier = expandedPledgeKey === pledgeKey;

                                  return (
                                    <div>
                                      <button
                                        onClick={() => handleVerifyPledge(topic, party, pledge)}
                                        disabled={loadingPledgeKey === pledgeKey}
                                        className="w-full py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center space-x-1.5 transition-all cursor-pointer bg-indigo-950/80 hover:bg-indigo-900 text-indigo-200 border border-indigo-500/40"
                                      >
                                        {loadingPledgeKey === pledgeKey ? (
                                          <>
                                            <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                                            <span>Verifying with Hansard...</span>
                                          </>
                                        ) : (
                                          <>
                                            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                                            <span>
                                              {verification
                                                ? (isExpandedDossier ? 'Hide Hansard Quote' : '⚡ View Hansard Quote & Recency')
                                                : '⚡ Verify with AI: When was this last said?'}
                                            </span>
                                          </>
                                        )}
                                      </button>

                                      {isExpandedDossier && verification && (
                                        <div className="mt-2.5 p-3.5 rounded-xl bg-slate-950 text-slate-100 text-xs space-y-3 border border-slate-700 shadow-xl">
                                          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                                            <span className={`inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-md text-[10px] font-bold ${
                                              verification.verdictTone === "emerald" ? "bg-emerald-950 text-emerald-300 border border-emerald-800" :
                                              verification.verdictTone === "amber" ? "bg-amber-950 text-amber-300 border border-amber-800" :
                                              verification.verdictTone === "rose" ? "bg-rose-950 text-rose-300 border border-rose-800" :
                                              "bg-blue-950 text-blue-300 border border-blue-800"
                                            }`}>
                                              <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                              <span>Verdict: {verification.verdict}</span>
                                            </span>
                                            <button
                                              onClick={() => handleVerifyPledge(topic, party, pledge, true)}
                                              className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                              title="Scan for most recent updates"
                                            >
                                              <RefreshCw className="w-3.5 h-3.5" />
                                            </button>
                                          </div>

                                          <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                                              Last Officially Affirmed:
                                            </span>
                                            <p className="text-[11px] text-slate-200 leading-relaxed">
                                              {verification.lastAffirmedSummary}
                                            </p>
                                          </div>

                                          {(verification.quoteText || verification.latestQuote) && (
                                            <div className="space-y-2 bg-slate-900 p-3 rounded-xl border border-slate-700">
                                              <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 flex items-center space-x-1.5">
                                                  <Quote className="w-3.5 h-3.5 text-indigo-400" />
                                                  <span>Latest Statement (2024–2026):</span>
                                                </span>
                                                {verification.quoteDate && (
                                                  <span className="text-[10px] font-bold text-amber-300 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                                                    {verification.quoteDate}
                                                  </span>
                                                )}
                                              </div>

                                              <blockquote className="text-xs text-white italic border-l-2 border-indigo-500 pl-3 py-1 font-serif leading-relaxed">
                                                "{verification.quoteText || verification.latestQuote}"
                                              </blockquote>

                                              <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center justify-between gap-1 text-[11px]">
                                                <div>
                                                  <span className="text-slate-400">Speaker: </span>
                                                  <span className="font-bold text-white">{verification.quoteSpeaker || `${party.shortName} Frontbench`}</span>
                                                </div>
                                                {verification.quoteContext && (
                                                  <div>
                                                    <span className="text-slate-400">Forum: </span>
                                                    <span className="text-slate-200 font-medium">{verification.quoteContext}</span>
                                                  </div>
                                                )}
                                              </div>
                                            </div>
                                          )}

                                          <div className="space-y-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                              Status & Conditionality Analysis:
                                            </span>
                                            <p className="text-[11px] text-slate-200 leading-relaxed whitespace-pre-line">
                                              {verification.statusAnalysis}
                                            </p>
                                          </div>

                                          <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-400">
                                            <span>{verification.timestamp}</span>
                                            <button
                                              onClick={() => handleApplyVerificationBadge(topic.id, party.id)}
                                              className="text-emerald-400 hover:text-emerald-300 font-bold underline cursor-pointer"
                                            >
                                              Mark as Confirmed Active ✓
                                            </button>
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  );
                                })()}

                                {/* Official Source Link */}
                                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[11px] text-slate-300">
                                  <span className="flex items-center space-x-1.5">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                                    <span>{verificationBadges[`${topic.id}-${party.id}`] || `Verified ${pledge.lastVerifiedDate || 'October 2026'}`}</span>
                                  </span>
                                  {pledge.officialSourceUrl && (
                                    <a
                                      href={pledge.officialSourceUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="font-bold text-indigo-300 hover:text-indigo-200 hover:underline flex items-center space-x-1"
                                    >
                                      <span>{pledge.officialSourceTitle || 'Official Source'}</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* CUE 3 (Mobile): Explicit Tap-to-Advance Prev / Next Party Buttons */}
                            <div className="md:hidden pt-2 border-t border-slate-800 flex items-center justify-between gap-2">
                              {prevParty ? (
                                <button
                                  type="button"
                                  onClick={() => scrollToPartyCard(topic.id, prevParty.id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-bold flex items-center space-x-1 cursor-pointer"
                                >
                                  <ChevronLeft className="w-3.5 h-3.5" />
                                  <span>{prevParty.shortName}</span>
                                </button>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium">Swipe sideways ↔</span>
                              )}

                              {nextParty ? (
                                <button
                                  type="button"
                                  onClick={() => scrollToPartyCard(topic.id, nextParty.id)}
                                  style={{
                                    backgroundColor: nextParty.color,
                                    color: nextParty.textColor,
                                  }}
                                  className="px-3 py-1.5 rounded-lg text-[11px] font-extrabold flex items-center space-x-1 shadow-xs cursor-pointer ml-auto"
                                >
                                  <span>Next: {nextParty.shortName}</span>
                                  <ChevronRight className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => scrollToPartyCard(topic.id, activeParties[0].id)}
                                  className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-slate-200 border border-slate-700 text-[11px] font-bold cursor-pointer ml-auto"
                                >
                                  ↺ Back to {activeParties[0].shortName}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
