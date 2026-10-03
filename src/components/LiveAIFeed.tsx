import React, { useState } from 'react';
import { Party, PolicyTopic, CabinetMember } from '../types/politics';
import { 
  Radio, 
  Sparkles, 
  Send, 
  RefreshCw, 
  Clock, 
  Key, 
  CheckCircle2, 
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Layers,
  ArrowRight,
  Filter
} from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/liveUpdater';
import { 
  queryWestminsterPolicyTracker, 
  getCurrentDateMetadata,
  PolicyNewsItem,
  fetchLatestPolicyDecisions,
  defaultPolicyDecisions
} from '../services/policyTrackerQuery';

interface LiveAIFeedProps {
  parties: Party[];
  policies?: PolicyTopic[];
  cabinets?: CabinetMember[];
}

const POLICY_FEED_STORAGE_KEY = 'uk_politics_policy_decisions_feed_v3';
const POLICY_FEED_LIMIT_KEY = 'uk_politics_policy_feed_limit';

export const LiveAIFeed: React.FC<LiveAIFeedProps> = ({ 
  parties, 
  policies = [], 
  cabinets = [] 
}) => {
  // Stored API key (reads from unified persistent storage and built-in configured key)
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [question, setQuestion] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [answerSource, setAnswerSource] = useState<string>('');
  const [verifiedDate, setVerifiedDate] = useState<string>('');
  const [matchedTopic, setMatchedTopic] = useState<string | undefined>(undefined);
  const [isCopied, setIsCopied] = useState(false);

  // Policy feed timeline state
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [isFetchingDecisions, setIsFetchingDecisions] = useState(false);
  const [displayLimit, setDisplayLimit] = useState<number | 'all'>(() => {
    try {
      const saved = localStorage.getItem(POLICY_FEED_LIMIT_KEY);
      if (saved === 'all') return 'all';
      if (saved) {
        const parsed = parseInt(saved, 10);
        if ([5, 10, 20].includes(parsed)) return parsed;
      }
      return 10;
    } catch {
      return 10;
    }
  });

  const currentDateMeta = getCurrentDateMetadata();

  const quickSuggestions = [
    { label: "Triple Lock & 2026/27 Pension Uprating", query: "What is the latest on the State Pension Triple Lock and how will it be uprated?" },
    { label: "Defence Spending: 2.5% vs 3.0% of GDP", query: "Compare party commitments on UK defence spending as a percentage of GDP." },
    { label: "Renters' Rights Bill & Section 21 Abolition", query: "What is the current status of the Renters' Rights Bill and no-fault evictions?" },
    { label: "Tax Thresholds & Frozen Personal Allowance", query: "Where do parties stand on the £12,570 income tax personal allowance and fiscal drag?" },
    { label: "Wealth Tax Proposals (Greens vs Labour)", query: "Compare Green Party and Labour positions on an annual wealth tax on multi-millionaires." }
  ];

  const [feedItems, setFeedItems] = useState<PolicyNewsItem[]>(() => {
    try {
      const saved = localStorage.getItem(POLICY_FEED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length >= 10) return parsed;
      }
      return defaultPolicyDecisions;
    } catch {
      return defaultPolicyDecisions;
    }
  });


  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredApiKey(apiKey.trim());
    setShowKeyInput(false);
  };

  const handleAskTracker = async (e?: React.FormEvent, customQuestion?: string) => {
    if (e) e.preventDefault();
    const queryToUse = customQuestion || question;
    if (!queryToUse.trim()) return;

    setIsQuerying(true);
    setAiAnswer(null);

    try {
      const result = await queryWestminsterPolicyTracker(queryToUse, {
        policies,
        cabinets,
        parties,
        customApiKey: apiKey,
      });

      setAiAnswer(result.answer);
      setAnswerSource(result.source);
      setVerifiedDate(result.verifiedDate);
      setMatchedTopic(result.matchedTopicTitle);
    } catch (err: any) {
      console.error(err);
      if (err.message?.includes('No active Gemini API key')) {
        setShowKeyInput(true);
      }
      setAiAnswer(`Could not complete query: ${err.message}. If using your custom API key, ensure it has Generative Language API access.`);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleCopyAnswer = () => {
    if (!aiAnswer) return;
    navigator.clipboard.writeText(aiAnswer);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const categoryFilters = [
    { id: 'all', label: 'All Decisions' },
    { id: 'defence', label: 'Defence & Security' },
    { id: 'nhs', label: 'NHS & Healthcare' },
    { id: 'economy', label: 'Economy & Tax' },
    { id: 'housing', label: 'Housing & Planning' },
    { id: 'energy', label: 'Energy & Net Zero' },
    { id: 'education', label: 'Education & Skills' },
    { id: 'welfare', label: 'Pensions & Welfare' },
    { id: 'immigration', label: 'Immigration & Borders' }
  ];

  const getCategoryCount = (catId: string) => {
    if (catId === 'all') return feedItems.length;
    return feedItems.filter(item => item.category.toLowerCase().includes(catId.toLowerCase())).length;
  };

  const handleRefreshPolicyDecisions = async () => {
    setIsFetchingDecisions(true);
    try {
      const freshItems = await fetchLatestPolicyDecisions(apiKey, {
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        limit: displayLimit === 'all' ? 30 : Math.max(displayLimit, 20)
      });
      // Merge with defaultPolicyDecisions to preserve breadth
      const freshTitles = new Set(freshItems.map(f => f.title.toLowerCase()));
      const merged = [...freshItems, ...defaultPolicyDecisions.filter(d => !freshTitles.has(d.title.toLowerCase()))];
      setFeedItems(merged);
      localStorage.setItem(POLICY_FEED_STORAGE_KEY, JSON.stringify(merged));
    } catch (err: any) {
      console.error('Failed to fetch latest policy decisions:', err);
      if (err.message?.includes('No active Gemini API key')) {
        setShowKeyInput(true);
      }
    } finally {
      setIsFetchingDecisions(false);
    }
  };

  const handleSetDisplayLimit = (limit: number | 'all') => {
    setDisplayLimit(limit);
    try {
      localStorage.setItem(POLICY_FEED_LIMIT_KEY, String(limit));
    } catch {}
  };

  const handleScrutinisePolicy = (item: PolicyNewsItem) => {
    const q = `Provide an in-depth parliamentary scrutiny on: "${item.title}". Detail statutory progress, fiscal implications, and cross-party stances.`;
    setQuestion(q);
    handleAskTracker(undefined, q);
    window.scrollTo({ top: 120, behavior: 'smooth' });
  };

  const filteredFeedItems = feedItems.filter((item) => {
    if (categoryFilter === 'all') return true;
    return item.category.toLowerCase().includes(categoryFilter.toLowerCase());
  });

  const visibleFeedItems = displayLimit === 'all'
    ? filteredFeedItems
    : filteredFeedItems.slice(0, displayLimit);

  const activeCategoryObj = categoryFilters.find(c => c.id === categoryFilter) || categoryFilters[0];


  const renderMarkdownBriefing = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-2" />;

      if (trimmed.startsWith('###')) {
        const title = trimmed.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '');
        return (
          <h4 key={idx} className="text-sm font-bold text-amber-300 mt-4 mb-1.5 flex items-center space-x-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
            <span>{title}</span>
          </h4>
        );
      }

      if (trimmed.startsWith('**') && trimmed.endsWith('**') && trimmed.length < 80) {
        return (
          <h5 key={idx} className="text-xs font-bold text-indigo-300 mt-3 mb-1">
            {trimmed.replace(/^\*\*|\*\*$/g, '')}
          </h5>
        );
      }

      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const bulletText = trimmed.replace(/^[\*\-•]\s*/, '');
        return (
          <div key={idx} className="flex items-start space-x-2 text-xs sm:text-[13px] text-slate-200 pl-1.5 my-1">
            <span className="text-rose-400 font-bold text-sm leading-none mt-0.5">•</span>
            <span className="flex-1 leading-relaxed">
              {renderInlineFormatting(bulletText)}
            </span>
          </div>
        );
      }

      if (trimmed.startsWith('>')) {
        return (
          <blockquote key={idx} className="border-l-2 border-indigo-400 pl-3 my-2 text-xs italic text-indigo-100 bg-white/5 py-1.5 rounded-r">
            {trimmed.replace(/^>\s*/, '')}
          </blockquote>
        );
      }

      return (
        <p key={idx} className="text-xs sm:text-[13px] text-slate-300 leading-relaxed my-1">
          {renderInlineFormatting(trimmed)}
        </p>
      );
    });
  };

  const renderInlineFormatting = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-white font-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span>Westminster Intelligence & Live Policy Wire</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              Westminster Live Intelligence
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time parliamentary scrutiny, legislative decisions, party policy shifts, and verified intelligence updated to today, {currentDateMeta.fullDateString}.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{apiKey || getStoredApiKey() ? 'API Key Active ✓' : 'Set Admin API Key'}</span>
            </button>
          </div>
        </div>

        {/* API Key Drawer (stores safely in user's browser only) */}
        {showKeyInput && (
          <form onSubmit={handleSaveKey} className="mt-4 pt-4 border-t border-slate-800 space-y-2 max-w-lg">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Live Intelligence API Key (Saved private in browser & verified):</span>
              {(apiKey || getStoredApiKey()) && (
                <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active Key Connected
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Enter Live Intelligence API key..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs bg-slate-800 border border-slate-700 rounded-xl text-white focus:outline-hidden focus:ring-2 focus:ring-rose-500"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl cursor-pointer"
              >
                Save
              </button>
            </div>
            <p className="text-[10px] text-slate-400">
              🔒 Pre-configured with active parliamentary intelligence service. You can also override with a custom key anytime.
            </p>
          </form>
        )}
      </div>

      {/* Interactive Ask Westminster Policy Tracker Search */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
              Ask the Westminster Policy Tracker
            </h3>
          </div>
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200/80 dark:border-emerald-800 px-2.5 py-1 rounded-full self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Anchored to Today: {currentDateMeta.shortDateString}</span>
          </span>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Query current government white papers, opposition positions, legislative bills, or leadership comparisons. Evaluated strictly as of today with zero outdated legacy cutoffs.
        </p>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 self-center mr-1">Trending:</span>
          {quickSuggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuestion(item.query);
                handleAskTracker(undefined, item.query);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-800 dark:hover:text-indigo-300 hover:border-indigo-200 dark:hover:border-indigo-800 border border-slate-200/80 dark:border-slate-700 text-slate-700 dark:text-slate-300 transition-all cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => handleAskTracker(e)} className="flex flex-col sm:flex-row gap-2 pt-1 w-full max-w-full">
          <input
            type="text"
            placeholder="Ask about any policy, bill, pledge, or politician (e.g. 'What is the latest on the triple lock?')..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-600 transition-all"
          />
          <button
            type="submit"
            disabled={isQuerying || !question.trim()}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-colors shrink-0 cursor-pointer shadow-xs hover:shadow-sm"
          >
            {isQuerying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Scrutinising...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Ask Policy Tracker</span>
              </>
            )}
          </button>
        </form>

        {/* AI Answer Box */}
        {aiAnswer && (
          <div className="p-5 rounded-2xl bg-slate-900 dark:bg-slate-950 text-slate-100 border border-slate-800 dark:border-slate-750 space-y-3.5 mt-4 shadow-lg animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span className="font-bold text-xs sm:text-sm text-slate-100">
                  Westminster Policy Tracker Intelligence
                </span>
                {matchedTopic && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {matchedTopic}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2 text-[11px]">
                <span className="inline-flex items-center space-x-1 text-emerald-400 bg-emerald-950/80 border border-emerald-800/80 px-2 py-0.5 rounded-md font-mono text-[10px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Verified: {verifiedDate || currentDateMeta.fullDateString}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCopyAnswer}
                  className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  title="Copy briefing to clipboard"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="text-xs sm:text-sm leading-relaxed text-slate-200 space-y-2 font-sans">
              {renderMarkdownBriefing(aiAnswer)}
            </div>

            <div className="pt-2.5 border-t border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-slate-400">
              <span>Grounded in UK Parliamentary & 2026 Party Manifesto Records</span>
              <span className="font-mono text-indigo-400">{answerSource}</span>
            </div>
          </div>
        )}
      </div>

      {/* Live Policy Decisions Timeline */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">
                UK Policy Decisions & Statutory Actions
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Filtered strictly for substantive legislation, statutory instruments, white papers, and spending commitments. Click any card to expand deep-dive analysis.
            </p>
          </div>

          <button
            onClick={handleRefreshPolicyDecisions}
            disabled={isFetchingDecisions}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 hover:text-indigo-800 dark:hover:text-indigo-300 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer shrink-0 self-start md:self-auto"
            title="Scan Parliament for latest policy actions and statutory decisions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDecisions ? 'animate-spin text-indigo-600 dark:text-indigo-400' : ''}`} />
            <span>{isFetchingDecisions ? 'Scanning Parliament...' : '⚡ Scan Parliament for Policy Decisions'}</span>
          </button>
        </div>

        {/* Category Filter Pills & Quantity Controls Toolbar */}
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-1.5 flex-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mr-1 flex items-center space-x-1">
                <Filter className="w-3 h-3" />
                <span>Sector:</span>
              </span>
              {categoryFilters.map((cat) => {
                const count = getCategoryCount(cat.id);
                const isActive = categoryFilter === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setCategoryFilter(cat.id)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-2xs font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    <span>{cat.label}</span>
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive
                        ? 'bg-white/20 dark:bg-slate-900/20 text-white dark:text-slate-900'
                        : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Display Quantity / Stories Selector */}
            <div className="flex items-center space-x-1.5 self-start sm:self-auto shrink-0 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 px-1.5 flex items-center space-x-1">
                <Layers className="w-3 h-3 text-indigo-500" />
                <span>Show:</span>
              </span>
              {([5, 10, 20, 'all'] as const).map((limitOption) => {
                const isSelected = displayLimit === limitOption;
                return (
                  <button
                    key={String(limitOption)}
                    onClick={() => handleSetDisplayLimit(limitOption)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-600 text-white shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-white/60 dark:hover:bg-slate-700/60'
                    }`}
                    title={`Display ${limitOption === 'all' ? 'all' : limitOption} announcements`}
                  >
                    {limitOption === 'all' ? 'All' : limitOption}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Active Display Range Summary */}
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1 pt-0.5">
            <span>
              Showing <strong className="text-slate-800 dark:text-slate-200">{visibleFeedItems.length}</strong> of <strong className="text-slate-800 dark:text-slate-200">{filteredFeedItems.length}</strong> statutory actions {categoryFilter === 'all' ? 'across all sectors' : `in ${activeCategoryObj.label}`}.
            </span>
            {displayLimit !== 'all' && filteredFeedItems.length > (typeof displayLimit === 'number' ? displayLimit : 0) && (
              <button
                onClick={() => handleSetDisplayLimit('all')}
                className="text-indigo-600 dark:text-indigo-400 font-bold hover:underline cursor-pointer flex items-center space-x-1 text-xs"
              >
                <span>View all {filteredFeedItems.length}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Interactive Clickable Feed List */}
        <div className="space-y-3 pt-1">
          {visibleFeedItems.map((item) => {

            const isExpanded = expandedItemId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  isExpanded
                    ? 'border-indigo-300 dark:border-indigo-700 bg-indigo-50/20 dark:bg-indigo-950/20 shadow-md ring-1 ring-indigo-200 dark:ring-indigo-800'
                    : 'border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: item.partyColor }}
                      >
                        {item.party}
                      </span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {item.category}
                      </span>
                      {item.statutoryVehicle && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                          {item.statutoryVehicle}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium flex items-center space-x-1 ml-auto sm:ml-0">
                        <Clock className="w-3 h-3" />
                        <span>{item.time}</span>
                      </span>
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-slate-900 dark:text-slate-100 leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 self-start shrink-0">
                    <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700">
                      {item.tag}
                    </span>
                    <button className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Deep-Dive Scrutiny Drawer */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-3.5 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {item.fiscalImpact && (
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                            Fiscal & Budgetary Impact:
                          </span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            {item.fiscalImpact}
                          </span>
                        </div>
                      )}

                      {item.crossPartyStance && (
                        <div className="bg-slate-50 dark:bg-slate-800/60 p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-0.5">
                            Cross-Party Battlegrounds:
                          </span>
                          <span className="text-slate-700 dark:text-slate-300">
                            {item.crossPartyStance}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.deepDiveDetails && (
                      <div className="bg-white dark:bg-slate-800/90 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 space-y-2 leading-relaxed">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block mb-1 flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Detailed Parliamentary Briefing:</span>
                        </span>
                        <div className="whitespace-pre-line text-slate-600 dark:text-slate-300">
                          {item.deepDiveDetails}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400 dark:text-slate-500">
                        Click again to collapse
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleScrutinisePolicy(item);
                        }}
                        className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Run Full Parliamentary Scrutiny on this Policy</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {visibleFeedItems.length < filteredFeedItems.length && (
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 mt-2">
              <div className="text-xs text-slate-600 dark:text-slate-300">
                Displaying <span className="font-bold text-slate-900 dark:text-slate-100">{visibleFeedItems.length}</span> of <span className="font-bold text-slate-900 dark:text-slate-100">{filteredFeedItems.length}</span> decisions in <span className="font-bold text-slate-900 dark:text-slate-100">{activeCategoryObj.label}</span>.
              </div>
              <div className="flex items-center space-x-2">
                {displayLimit !== 20 && filteredFeedItems.length > 10 && (
                  <button
                    onClick={() => handleSetDisplayLimit(20)}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                  >
                    Show 20 Stories
                  </button>
                )}
                <button
                  onClick={() => handleSetDisplayLimit('all')}
                  className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  Show All {filteredFeedItems.length} Stories
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};
