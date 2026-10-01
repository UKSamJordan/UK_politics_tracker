import React, { useState } from 'react';
import { Party, PartyId, PolicyTopic, PolicyCategory } from '../types/politics';
import { 
  Shield, 
  TrendingUp, 
  HeartPulse, 
  Plane, 
  Zap, 
  Home, 
  Heart,
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle,
  Info, 
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Sparkles,
  RefreshCw,
  GraduationCap
} from 'lucide-react';
import { SectionRefreshButton } from './SectionRefreshButton';
import { PolicyChangeReport } from '../services/liveUpdater';
import { verifyPledgeRecency, PledgeVerificationResult } from '../services/policyTrackerQuery';

interface PolicyMatrixProps {
  parties: Party[];
  selectedParties: PartyId[];
  policies: PolicyTopic[];
  onRefreshPolicies?: () => Promise<PolicyChangeReport | void> | void;
}

export const PolicyMatrix: React.FC<PolicyMatrixProps> = ({
  parties,
  selectedParties,
  policies,
  onRefreshPolicies,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);
  const [lastChangeReport, setLastChangeReport] = useState<PolicyChangeReport | null>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);

  // AI Pledge Recency Verification State
  const PLEDGE_VERIF_STORAGE_KEY = 'uk_politics_pledge_verifications_v2';
  const [pledgeVerifications, setPledgeVerifications] = useState<Record<string, PledgeVerificationResult>>(() => {
    try {
      const saved = localStorage.getItem(PLEDGE_VERIF_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
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
        pledge.summary
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
    { id: 'defence', label: 'Defence & Military', icon: Shield },
    { id: 'economy', label: 'Economy & Tax', icon: TrendingUp },
    { id: 'welfare', label: 'Pensions & Social Care', icon: Heart },
    { id: 'nhs', label: 'NHS & Healthcare', icon: HeartPulse },
    { id: 'immigration', label: 'Immigration & Borders', icon: Plane },
    { id: 'education', label: 'Education & Universities', icon: GraduationCap },
    { id: 'energy', label: 'Energy & Net Zero', icon: Zap },
    { id: 'housing', label: 'Housing & Planning', icon: Home },
  ];

  // Filter policies based on category and search query
  const filteredPolicies = policies.filter((topic) => {
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
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>Fact Check: Grounded</span>
          </span>
        );
      case 'disputed':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            <span>Fact Check: Disputed</span>
          </span>
        );
      case 'unfunded':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-rose-100 text-rose-800">
            <AlertTriangle className="w-3 h-3 text-rose-600" />
            <span>IFS: Fiscal Shortfall</span>
          </span>
        );
      case 'clarified':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800">
            <Info className="w-3 h-3 text-blue-600" />
            <span>Context Attached</span>
          </span>
        );
      default:
        return null;
    }
  };

  const handleRefreshWithDiff = async () => {
    if (onRefreshPolicies) {
      const report = await onRefreshPolicies();
      if (report && typeof report === 'object' && 'hasChanges' in report) {
        setLastChangeReport(report as PolicyChangeReport);
        setShowReportDetails(true);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Category Pills & Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4 transition-colors">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
              Policy Comparison Matrix
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Side-by-side analysis of key manifesto pledges, cost estimates, timelines, and independent fact checks across all 8 parties.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <SectionRefreshButton
              sectionName="Policy Matrix"
              defaultDate="September 2026 • Verified Public Record"
              onRefresh={handleRefreshWithDiff}
            />

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search pledges (e.g. 3%, triple lock, NHS)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-64 pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-hidden focus:ring-2 focus:ring-slate-900 dark:focus:ring-slate-400 focus:bg-white dark:focus:bg-slate-800 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Change Detection Report Banner */}
        {lastChangeReport && (
          <div className={`p-4 rounded-xl border transition-all animate-fade-in ${
            lastChangeReport.hasChanges
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/80 text-amber-950 dark:text-amber-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/80 text-emerald-950 dark:text-emerald-200'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2">
                {lastChangeReport.hasChanges ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
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
              <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800/80 space-y-1.5 text-xs">
                {lastChangeReport.changes.map((c, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                    <strong>{c.partyId.toUpperCase()}</strong> ({c.topicTitle}): <span>{c.details}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category Filter Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none pt-2 border-t border-slate-100 dark:border-slate-800 max-w-full min-w-0">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected parties warning if none or only 1 */}
      {activeParties.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-800">
          <p className="font-bold">No political parties currently selected for comparison.</p>
          <p className="text-xs mt-1">Please select at least one party using the selector above.</p>
        </div>
      )}

      {/* Policy Topics Stack */}
      <div className="space-y-4">
        {filteredPolicies.map((topic) => {
          const isExpanded = expandedTopic === null || expandedTopic === topic.id;

          return (
            <div
              key={topic.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden transition-all max-w-full min-w-0"
            >
              {/* Topic Header Card */}
              <div
                onClick={() => setExpandedTopic(expandedTopic === topic.id ? 'collapsed' : topic.id)}
                className="p-4 sm:p-5 flex items-start sm:items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-b border-slate-100 dark:border-slate-800"
              >
                <div>
                  <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider mb-1">
                    <span>{topic.category.toUpperCase()}</span>
                    <span>•</span>
                    <span>Official Policy Issue</span>
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                    {topic.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1 sm:line-clamp-none">
                    {topic.description}
                  </p>
                </div>

                <div className="flex items-center space-x-3 shrink-0 ml-4">
                  {topic.officialFigureBenchmark && (
                    <div className="hidden md:flex flex-col text-right pr-3 border-r border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 font-semibold uppercase tracking-wider">
                        {topic.officialFigureBenchmark.label}
                      </span>
                      <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                        {topic.officialFigureBenchmark.value}
                      </span>
                    </div>
                  )}

                  <button className="text-slate-400 hover:text-slate-600 dark:text-slate-400 dark:hover:text-slate-200 p-1 cursor-pointer">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Official Benchmark for Mobile */}
              {topic.officialFigureBenchmark && (
                <div className="md:hidden px-4 py-2 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">{topic.officialFigureBenchmark.label}:</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">{topic.officialFigureBenchmark.value}</span>
                </div>
              )}

              {/* Public Opinion Bar */}
              {topic.publicOpinionQuestion && (
                <div className="px-4 sm:px-5 py-2.5 bg-sky-50/70 dark:bg-sky-950/40 border-b border-sky-100 dark:border-sky-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2 text-sky-950 dark:text-sky-200 font-medium">
                    <HelpCircle className="w-4 h-4 text-sky-600 dark:text-sky-400 shrink-0" />
                    <span>Public Opinion: <i>"{topic.publicOpinionQuestion}"</i></span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="w-24 sm:w-32 bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-sky-600 dark:bg-sky-500 h-2 rounded-full" 
                        style={{ width: `${topic.publicOpinionSupportOverall || 50}%` }}
                      />
                    </div>
                    <span className="font-bold text-sky-900 dark:text-sky-300">
                      {topic.publicOpinionSupportOverall}% Support
                    </span>
                  </div>
                </div>
              )}

              {/* Side-by-Side Columns */}
              {isExpanded && (
                <div className={`grid grid-cols-1 ${
                  activeParties.length === 1 ? 'md:grid-cols-1' :
                  activeParties.length === 2 ? 'md:grid-cols-2' :
                  activeParties.length === 3 ? 'md:grid-cols-3' :
                  'md:grid-cols-2 lg:grid-cols-4'
                } divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800`}>
                  {activeParties.map((party) => {
                    const pledge = topic.pledges[party.id];
                    if (!pledge) return null;

                    return (
                      <div key={party.id} className="p-4 sm:p-5 flex flex-col justify-between space-y-4 bg-white dark:bg-slate-900">
                        <div>
                          {/* Party Badge & Leader */}
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <div className="flex items-center space-x-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: party.color }}
                              />
                              <span className="font-bold text-sm text-slate-900 dark:text-white">
                                {party.shortName}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                              {party.leader}
                            </span>
                          </div>

                          {/* Headline */}
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white mb-2 leading-snug">
                            {pledge.headline}
                          </h4>

                          {/* Summary */}
                          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                            {pledge.summary}
                          </p>

                          {/* Key Points Bullet List */}
                          <div className="space-y-1.5 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                              Core Manifesto Pledges:
                            </span>
                            <ul className="space-y-1">
                              {pledge.keyPoints.map((point, i) => (
                                <li key={i} className="text-xs text-slate-700 dark:text-slate-300 flex items-start space-x-1.5">
                                  <span 
                                    className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" 
                                    style={{ backgroundColor: party.color }}
                                  />
                                  <span>{point}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        </div>

                        {/* Bottom Metadata: Cost, Timeline, Fact Check, and Official Source */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
                          {pledge.costEstimate && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 dark:text-slate-500 font-medium">Estimated Cost:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200 text-right">{pledge.costEstimate}</span>
                            </div>
                          )}

                          {pledge.targetTimeline && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 dark:text-slate-500 font-medium">Timeline:</span>
                              <span className="font-semibold text-slate-700 dark:text-slate-200">{pledge.targetTimeline}</span>
                            </div>
                          )}

                          {/* Fact Check Callout */}
                          {pledge.factCheckSnippet && (
                            <div className="bg-slate-50 dark:bg-slate-800/60 rounded-lg p-2.5 border border-slate-200 dark:border-slate-700 mt-2 space-y-1.5">
                              <div className="flex items-center justify-between">
                                {getVerdictBadge(pledge.factCheckVerdict)}
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">{pledge.factCheckSource}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 dark:text-slate-300 italic">
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
                              <div className="pt-2">
                                <button
                                  onClick={() => handleVerifyPledge(topic, party, pledge)}
                                  disabled={loadingPledgeKey === pledgeKey}
                                  className={`w-full py-1.5 px-2.5 rounded-xl text-[11px] font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer shadow-2xs ${
                                    isExpandedDossier
                                      ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100'
                                      : verification
                                      ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-900 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                                      : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-rose-50 hover:from-indigo-100 hover:to-rose-100 text-slate-800 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-rose-950/40 dark:hover:from-indigo-900/50 dark:hover:to-rose-900/50 dark:text-slate-200 border border-indigo-200/80 dark:border-indigo-800/60'
                                  }`}
                                  title={`Verify when ${party.name}'s pledge on "${topic.title}" was last affirmed in Parliament or official speeches`}
                                >
                                  {loadingPledgeKey === pledgeKey ? (
                                    <>
                                      <RefreshCw className="w-3 h-3 animate-spin text-indigo-600 dark:text-indigo-400" />
                                      <span>Verifying with Hansard...</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3 h-3 text-indigo-600 dark:text-indigo-400" />
                                      <span>
                                        {verification
                                          ? (isExpandedDossier ? 'Hide AI Verification' : '⚡ View AI Verification & Recency')
                                          : '⚡ Verify with AI: When was this last said?'}
                                      </span>
                                    </>
                                  )}
                                </button>

                                {/* Verification Dossier Drawer */}
                                {isExpandedDossier && verification && (
                                  <div className="mt-2 p-3 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 text-xs space-y-2.5 border border-slate-800 animate-in fade-in duration-200 shadow-md">
                                    <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                                      <span className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                        verification.verdictTone === 'emerald' ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                                        verification.verdictTone === 'amber' ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                                        verification.verdictTone === 'rose' ? 'bg-rose-950 text-rose-300 border border-rose-800' :
                                        'bg-blue-950 text-blue-300 border border-blue-800'
                                      }`}>
                                        <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                                        <span>Verdict: {verification.verdict}</span>
                                      </span>
                                      <button
                                        onClick={() => handleVerifyPledge(topic, party, pledge, true)}
                                        className="p-1 text-slate-400 hover:text-white cursor-pointer"
                                        title="Scan for most recent updates"
                                      >
                                        <RefreshCw className="w-3 h-3" />
                                      </button>
                                    </div>

                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300 block">
                                        Last Officially Affirmed:
                                      </span>
                                      <p className="text-[11px] text-slate-300 leading-relaxed">
                                        {verification.lastAffirmedSummary}
                                      </p>
                                    </div>

                                    {verification.latestQuote && (
                                      <div className="space-y-1 bg-white/5 p-2 rounded-lg border border-slate-800">
                                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-300 block">
                                          Latest Ministerial / Spokesperson Quote:
                                        </span>
                                        <blockquote className="text-[11px] text-slate-200 italic">
                                          "{verification.latestQuote}"
                                        </blockquote>
                                      </div>
                                    )}

                                    <div className="space-y-1">
                                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                        Status & Conditionality Analysis:
                                      </span>
                                      <p className="text-[11px] text-slate-300 leading-relaxed whitespace-pre-line">
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

                          {/* Official Source & Verification Timestamp */}
                          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-500 dark:text-slate-400">
                            <span className="flex items-center space-x-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                              <span>{verificationBadges[`${topic.id}-${party.id}`] || `Verified ${pledge.lastVerifiedDate || 'September 2026'}`}</span>
                            </span>
                            {pledge.officialSourceUrl && (
                              <a
                                href={pledge.officialSourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 hover:underline flex items-center space-x-0.5"
                                title={`View official document: ${pledge.officialSourceTitle || 'Official Platform'}`}
                              >
                                <span>{pledge.officialSourceTitle || 'Official Source'}</span>
                                <ExternalLink className="w-2.5 h-2.5" />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
