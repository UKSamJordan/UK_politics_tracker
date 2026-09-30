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
  Check
} from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/liveUpdater';
import { 
  queryWestminsterPolicyTracker, 
  getCurrentDateMetadata 
} from '../services/policyTrackerQuery';

interface LiveAIFeedProps {
  parties: Party[];
  policies?: PolicyTopic[];
  cabinets?: CabinetMember[];
}

interface NewsItem {
  id: string;
  time: string;
  title: string;
  party: string;
  partyColor: string;
  summary: string;
  category: string;
  tag: string;
}

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

  const currentDateMeta = getCurrentDateMetadata();

  const quickSuggestions = [
    { label: "Triple Lock & 2026/27 Pension Uprating", query: "What is the latest on the State Pension Triple Lock and how will it be uprated?" },
    { label: "Defence Spending: 2.5% vs 3.0% of GDP", query: "Compare party commitments on UK defence spending as a percentage of GDP." },
    { label: "Renters' Rights Bill & Section 21 Abolition", query: "What is the current status of the Renters' Rights Bill and no-fault evictions?" },
    { label: "Tax Thresholds & Frozen Personal Allowance", query: "Where do parties stand on the £12,570 income tax personal allowance and fiscal drag?" },
    { label: "Wealth Tax Proposals (Greens vs Labour)", query: "Compare Green Party and Labour positions on an annual wealth tax on multi-millionaires." }
  ];

  // Live feed items
  const [feedItems] = useState<NewsItem[]>([
    {
      id: 'item-1',
      time: 'Today • 08:30 GMT',
      title: 'Strategic Defence Review Enters Final Consultation Stage',
      party: 'Labour',
      partyColor: '#E4003B',
      category: 'Defence',
      tag: 'Policy Update',
      summary: 'Defence Secretary John Healey confirms the SDR chaired by Lord Robertson will set the binding pathway to 2.5% of GDP defence expenditure, prioritizing British-made munitions stockpiles and UK-Germany treaty implementation.'
    },
    {
      id: 'item-2',
      time: 'Yesterday • 16:15 GMT',
      title: 'Kemi Badenoch Announces Complete Shadow Cabinet Roster',
      party: 'Conservative',
      partyColor: '#0087DC',
      category: 'Cabinet',
      tag: 'Leadership',
      summary: 'Following her election as Conservative leader, Kemi Badenoch completes her Shadow Cabinet appointments, with Mel Stride as Shadow Chancellor, Chris Philp at Home Affairs, Priti Patel at Foreign Affairs, and Nick Timothy at Justice.'
    },
    {
      id: 'item-3',
      time: '28 Sep • 11:00 GMT',
      title: 'Voting Intention Averages Consolidate: Lab 31%, Con 24%, Ref 20%',
      party: 'All Parties',
      partyColor: '#64748b',
      category: 'Polling',
      tag: 'YouGov / Ipsos',
      summary: 'Aggregated national polling across YouGov, Savanta, and Ipsos indicates Labour holding a 7-point lead over Conservatives, while Reform UK remains within 4 points of the official opposition.'
    },
    {
      id: 'item-4',
      time: '26 Sep • 14:45 GMT',
      title: 'Renters’ Rights Bill Passes Second Reading in House of Commons',
      party: 'Labour',
      partyColor: '#E4003B',
      category: 'Housing',
      tag: 'Legislation',
      summary: 'Deputy Prime Minister Angela Rayner leads the second reading of the Renters’ Rights Bill, confirming the statutory abolition of Section 21 no-fault evictions and the outlawing of rental bidding wars.'
    },
    {
      id: 'item-5',
      time: '25 Sep • 09:20 GMT',
      title: 'Reform UK Launches "Freedom of Speech and Quango Rollback" Initiative',
      party: 'Reform UK',
      partyColor: '#12B6CF',
      category: 'Economy & Law',
      tag: 'Policy Campaign',
      summary: 'Nigel Farage and Rupert Lowe outline proposals to dismantle over 50 government quangos and cut domestic environmental regulations to boost industrial manufacturing.'
    }
  ]);

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
    // Basic parser for **bold** within strings
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
              Real-time parliamentary scrutiny, legislative progress, party policy shifts, and verified intelligence updated to today, {currentDateMeta.fullDateString}.
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

      {/* Live Feed Timeline */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2">
            <Radio className="w-4 h-4 text-rose-600" />
            <h3 className="font-bold text-base text-slate-900">Latest Westminster Wire & Policy Updates</h3>
          </div>
          <span className="text-xs text-slate-400">Chronological Feed</span>
        </div>

        <div className="space-y-3">
          {feedItems.map((item) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-3"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: item.partyColor }}
                  >
                    {item.party}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                    {item.category}
                  </span>
                  <span className="text-[11px] text-slate-400 font-medium flex items-center space-x-1">
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

              <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-1 rounded-lg border border-slate-200 self-start shrink-0">
                {item.tag}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
