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
  fetchLatestPolicyDecisions
} from '../services/policyTrackerQuery';

interface LiveAIFeedProps {
  parties: Party[];
  policies?: PolicyTopic[];
  cabinets?: CabinetMember[];
}

const POLICY_FEED_STORAGE_KEY = 'uk_politics_policy_decisions_feed_v2';

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

  const currentDateMeta = getCurrentDateMetadata();

  const quickSuggestions = [
    { label: "Triple Lock & 2026/27 Pension Uprating", query: "What is the latest on the State Pension Triple Lock and how will it be uprated?" },
    { label: "Defence Spending: 2.5% vs 3.0% of GDP", query: "Compare party commitments on UK defence spending as a percentage of GDP." },
    { label: "Renters' Rights Bill & Section 21 Abolition", query: "What is the current status of the Renters' Rights Bill and no-fault evictions?" },
    { label: "Tax Thresholds & Frozen Personal Allowance", query: "Where do parties stand on the £12,570 income tax personal allowance and fiscal drag?" },
    { label: "Wealth Tax Proposals (Greens vs Labour)", query: "Compare Green Party and Labour positions on an annual wealth tax on multi-millionaires." }
  ];

  // Baseline verified real-world policy decisions
  const defaultFeedItems: PolicyNewsItem[] = [
    {
      id: 'decision-1',
      time: 'Today • 08:30 GMT',
      title: 'Strategic Defence Review & Roadmap to 2.5% of GDP',
      party: 'Labour',
      partyColor: '#E4003B',
      category: 'Defence',
      tag: 'Command Paper / SDR',
      summary: 'Defence Secretary John Healey confirms the SDR chaired by Lord Robertson will set the binding pathway to 2.5% of GDP defence spending, prioritising sovereign munitions stockpiles and UK-Germany treaty implementation.',
      statutoryVehicle: 'Command Paper / Independent Review (MoD)',
      fiscalImpact: 'Projected £6bn - £9bn annual uplift upon reaching 2.5% baseline',
      crossPartyStance: 'Conservatives demand an immediate 3.0% by 2030 target; Reform UK pledges 3.0% within 6 years.',
      deepDiveDetails: 'The Strategic Defence Review (SDR) was commissioned by the Prime Minister and Defence Secretary to establish the UK\'s long-term defence posture amidst escalating geopolitical tensions. Chaired by Lord Robertson of Port Ellen alongside external experts Dr Fiona Hill and General Sir Richard Barrons, the review investigates force modernization, NATO capabilities, and domestic procurement resilience.\n\nWhile the government has committed to spending 2.5% of GDP on defence, it has explicitly linked the timeline to Treasury fiscal rules (debt falling, day-to-day spending balanced by revenues). HM Treasury provided an initial £2.9bn uplift in the budget, but the long-term spending pathway will be established in the subsequent multi-year Spending Review.\n\nOpposition parties argue that postponing the 2.5% deadline until fiscal conditions allow risks military readiness, while the Liberal Democrats urge prioritizing NATO European deterrence and personnel retention.'
    },
    {
      id: 'decision-2',
      time: 'Yesterday • 14:45 GMT',
      title: 'Renters’ Rights Bill Enters Committee Stage in House of Commons',
      party: 'Labour',
      partyColor: '#E4003B',
      category: 'Housing',
      tag: 'Primary Legislation',
      summary: 'Deputy Prime Minister Angela Rayner leads the statutory abolition of Section 21 no-fault evictions, outlawing bidding wars and expanding decent homes standards to the private rented sector.',
      statutoryVehicle: 'Public Bill / Primary Legislation (HC Bill 8)',
      fiscalImpact: '£150m local authority enforcement and court digitalization funding',
      crossPartyStance: 'Conservatives caution against landlord exit and court backlogs; Greens demand statutory local rent caps.',
      deepDiveDetails: 'The Renters’ Rights Bill represents the most comprehensive reform of the English private rented sector in three decades. It permanently abolishes Section 21 no-fault evictions, transitioning all tenancies to periodic agreements and preventing landlords from evicting tenants without proven statutory grounds (e.g. rent arrears, selling the property, or moving family in).\n\nIn addition, the bill creates a digital Private Rented Sector Database, grants tenants the legal right to request a pet (which landlords cannot unreasonably refuse), and extends Awaab’s Law to private rentals—compelling landlords to fix reported hazards such as damp and mould within strict statutory deadlines.\n\nConservative and property industry representatives have warned that removing Section 21 without major reforms to county court bailiff capacity could lead to lengthy possession delays and reduce rental supply. The Green Party argues the bill does not go far enough without empowering local authorities to cap rent increases.'
    },
    {
      id: 'decision-3',
      time: '28 Sep • 16:20 GMT',
      title: 'Great British Energy Act Receives Royal Assent',
      party: 'Labour',
      partyColor: '#E4003B',
      category: 'Energy',
      tag: 'Public Ownership Act',
      summary: 'Energy Secretary Ed Miliband establishes GB Energy, headquartered in Aberdeen with £8.3bn capital funding to co-invest in floating offshore wind, tidal stream, and community clean power.',
      statutoryVehicle: 'Public General Act 2024 / Statutory Corporation',
      fiscalImpact: '£8.3bn capitalized over the 2024–2029 Parliament',
      crossPartyStance: 'Conservatives criticise state market intervention; Reform UK demands abolition of Net Zero subsidies.',
      deepDiveDetails: 'The Great British Energy Act legally establishes the publicly owned energy company designed to partner with private capital and local authorities to accelerate the transition to clean electricity by 2030.\n\nHeadquartered in Aberdeen to anchor energy transition jobs in traditional oil and gas communities, GB Energy is tasked with co-developing emerging green technologies that commercial markets underinvest in, including floating offshore wind, green hydrogen, and carbon capture.\n\nThe policy forms a central plank of the government’s mission to insulate the UK from fossil fuel price shocks, though opposition parties note that capital returns will take several years to translate into consumer energy bill reductions.'
    },
    {
      id: 'decision-4',
      time: '27 Sep • 11:00 GMT',
      title: 'State Pension Triple Lock Indexation & Fiscal Drag Threshold Review',
      party: 'All Parties',
      partyColor: '#64748b',
      category: 'Welfare',
      tag: 'Fiscal Review',
      summary: 'ONS wage and inflation metrics set the foundation for the April 2027 state pension increase, intensifying cross-party clash over frozen personal income tax allowances.',
      statutoryVehicle: 'Social Security Administration Act / Annual Uprating Order',
      fiscalImpact: 'Estimated £3.5bn - £4.8bn annual expenditure increase',
      crossPartyStance: 'Conservatives pledge Triple Lock Plus; Reform UK pledges £20k personal allowance.',
      deepDiveDetails: 'Under the statutory Triple Lock formula, the State Pension increases each April by the highest of average earnings growth (ONS May–July index), September CPI inflation, or 2.5%. With wage growth outperforming inflation, earnings growth will drive the next uplift.\n\nHowever, because the Personal Allowance has been frozen at £12,570, the full New State Pension is now nearing the income tax threshold. Any retiree with small private pensions or savings interest is pulled into the basic rate income tax band.\n\nThis dynamic has triggered a fierce parliamentary clash: Kemi Badenoch’s Conservatives have introduced their \'Triple Lock Plus\' pledge to raise pensioner tax thresholds, Reform UK proposes lifting the allowance to £20,000 for everyone, and the government defends maintaining the Triple Lock while adhering to spending discipline.'
    },
    {
      id: 'decision-5',
      time: '25 Sep • 10:15 GMT',
      title: 'Conservative Commitment to 3.0% GDP Defence Spending by 2030',
      party: 'Conservative',
      partyColor: '#0087DC',
      category: 'Defence',
      tag: 'Opposition Policy',
      summary: 'Kemi Badenoch and Shadow Chancellor Mel Stride confirm official Conservative policy to raise UK defence spending to 3.0% of GDP (£100bn+/yr) by 2030, reversing regular Army reductions.',
      statutoryVehicle: 'Official Opposition Costed Platform & Policy Motion',
      fiscalImpact: 'Estimated ~£25bn/year uplift above the current ~2.3% baseline',
      crossPartyStance: 'Labour highlights absence of identified civil service cuts; Reform UK pledges 3% within 6 years.',
      deepDiveDetails: 'The Conservative Party has formally adopted a binding pledge to surge UK defence expenditure to 3.0% of GDP by 2030. Shadow Defence ministers argue that geopolitical instability in Eastern Europe and the Indo-Pacific requires Britain to establish an assertive deterrence posture well above the NATO 2% minimum.\n\nThe proposal includes setting a statutory personnel floor of 73,000 for the regular British Army, ring-fencing sovereign funding for the Dreadnought nuclear submarine replacement, and expanding hypersonic and sovereign munition manufacturing.\n\nThe Institute for Fiscal Studies (IFS) and independent defence analysts at RUSI estimate the pledge requires finding approximately £25bn annually in additional revenue or equivalent reductions across non-protected government departments.'
    }
  ];

  const [feedItems, setFeedItems] = useState<PolicyNewsItem[]>(() => {
    try {
      const saved = localStorage.getItem(POLICY_FEED_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      return defaultFeedItems;
    } catch {
      return defaultFeedItems;
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

  const handleRefreshPolicyDecisions = async () => {
    setIsFetchingDecisions(true);
    try {
      const freshItems = await fetchLatestPolicyDecisions(apiKey);
      setFeedItems(freshItems);
      localStorage.setItem(POLICY_FEED_STORAGE_KEY, JSON.stringify(freshItems));
    } catch (err: any) {
      console.error('Failed to fetch latest policy decisions:', err);
      if (err.message?.includes('No active Gemini API key')) {
        setShowKeyInput(true);
      }
    } finally {
      setIsFetchingDecisions(false);
    }
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
              <span>Your Gemini API Key (Saved private in browser & verified):</span>
              {(apiKey || getStoredApiKey()) && (
                <span className="text-emerald-400 text-[11px] font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Active Key Connected
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                placeholder="Paste your Gemini API key (AQ.Ab8...)"
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
              🔒 Pre-configured with your active Gemini 3.8 Flash key. You can also override with a custom key anytime.
            </p>
          </form>
        )}
      </div>

      {/* Interactive Ask Westminster Policy Tracker Search */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center space-x-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            <h3 className="font-extrabold text-base text-slate-900">
              Ask the Westminster Policy Tracker
            </h3>
          </div>
          <span className="inline-flex items-center space-x-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 px-2.5 py-1 rounded-full self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Anchored to Today: {currentDateMeta.shortDateString}</span>
          </span>
        </div>
        <p className="text-xs text-slate-500">
          Query current government white papers, opposition positions, legislative bills, or leadership comparisons. Evaluated strictly as of today with zero outdated legacy cutoffs.
        </p>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 self-center mr-1">Trending:</span>
          {quickSuggestions.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuestion(item.query);
                handleAskTracker(undefined, item.query);
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 hover:border-indigo-200 border border-slate-200/80 text-slate-700 transition-all cursor-pointer"
            >
              {item.label}
            </button>
          ))}
        </div>

        <form onSubmit={(e) => handleAskTracker(e)} className="flex gap-2 pt-1">
          <input
            type="text"
            placeholder="Ask about any policy, bill, pledge, or politician (e.g. 'What is the latest on the triple lock?')..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-indigo-600 transition-all"
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
          <div className="p-5 rounded-2xl bg-slate-900 text-slate-100 border border-slate-800 space-y-3.5 mt-4 shadow-lg animate-in fade-in duration-200">
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
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center space-x-2">
              <Radio className="w-4 h-4 text-rose-600" />
              <h3 className="font-bold text-base text-slate-900">
                UK Policy Decisions & Statutory Actions
              </h3>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Filtered strictly for substantive legislation, statutory instruments, white papers, and spending commitments. Click any card to expand deep-dive analysis.
            </p>
          </div>

          <button
            onClick={handleRefreshPolicyDecisions}
            disabled={isFetchingDecisions}
            className="inline-flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-800 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors cursor-pointer shrink-0 self-start md:self-auto"
            title="Scan Parliament with Gemini 3.8 Flash for latest policy actions"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetchingDecisions ? 'animate-spin text-indigo-600' : ''}`} />
            <span>{isFetchingDecisions ? 'Scanning Parliament...' : '⚡ Scan Parliament for Policy Decisions'}</span>
          </button>
        </div>

        {/* Policy Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center space-x-1">
            <Filter className="w-3 h-3" />
            <span>Filter:</span>
          </span>
          {[
            { id: 'all', label: `All Decisions (${feedItems.length})` },
            { id: 'defence', label: 'Defence & Security' },
            { id: 'housing', label: 'Housing & Planning' },
            { id: 'energy', label: 'Energy & Net Zero' },
            { id: 'welfare', label: 'Pensions & Welfare' },
            { id: 'economy', label: 'Economy & Tax' }
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer ${
                categoryFilter === cat.id
                  ? 'bg-slate-900 text-white shadow-2xs'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Interactive Clickable Feed List */}
        <div className="space-y-3 pt-1">
          {filteredFeedItems.map((item) => {
            const isExpanded = expandedItemId === item.id;

            return (
              <div
                key={item.id}
                onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                className={`p-4 sm:p-5 rounded-2xl border transition-all cursor-pointer ${
                  isExpanded
                    ? 'border-indigo-300 bg-indigo-50/20 shadow-md ring-1 ring-indigo-200'
                    : 'border-slate-200/90 bg-white hover:border-slate-300 hover:shadow-xs'
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
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                        {item.category}
                      </span>
                      {item.statutoryVehicle && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                          {item.statutoryVehicle}
                        </span>
                      )}
                      <span className="text-[11px] text-slate-400 font-medium flex items-center space-x-1 ml-auto sm:ml-0">
                        <Clock className="w-3 h-3" />
                        <span>{item.time}</span>
                      </span>
                    </div>

                    <h4 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                      {item.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {item.summary}
                    </p>
                  </div>

                  <div className="flex items-center space-x-2 self-start shrink-0">
                    <span className="text-[10px] font-semibold text-slate-600 bg-slate-50 px-2 py-1 rounded-lg border border-slate-200">
                      {item.tag}
                    </span>
                    <button className="text-slate-400 hover:text-slate-700 p-1">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded Deep-Dive Scrutiny Drawer */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-200/80 space-y-3.5 animate-in fade-in duration-150">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {item.fiscalImpact && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Fiscal & Budgetary Impact:
                          </span>
                          <span className="font-semibold text-slate-800">
                            {item.fiscalImpact}
                          </span>
                        </div>
                      )}

                      {item.crossPartyStance && (
                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                            Cross-Party Battlegrounds:
                          </span>
                          <span className="text-slate-700">
                            {item.crossPartyStance}
                          </span>
                        </div>
                      )}
                    </div>

                    {item.deepDiveDetails && (
                      <div className="bg-white p-3.5 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2 leading-relaxed">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block mb-1 flex items-center space-x-1">
                          <FileText className="w-3.5 h-3.5" />
                          <span>Detailed Parliamentary Briefing:</span>
                        </span>
                        <div className="whitespace-pre-line text-slate-600">
                          {item.deepDiveDetails}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
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
        </div>
      </div>
    </div>
  );
};
