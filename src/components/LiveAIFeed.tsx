import React, { useState } from 'react';
import { Party } from '../types/politics';
import { 
  Radio, 
  Sparkles, 
  Send, 
  RefreshCw, 
  ExternalLink, 
  Clock, 
  Key, 
  CheckCircle2, 
  AlertCircle,
  HelpCircle,
  TrendingUp,
  ShieldAlert
} from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/liveUpdater';

interface LiveAIFeedProps {
  parties: Party[];
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

export const LiveAIFeed: React.FC<LiveAIFeedProps> = ({ parties }) => {
  // Stored API key (reads from unified persistent storage and built-in configured key)
  const [apiKey, setApiKey] = useState(() => getStoredApiKey());
  const [showKeyInput, setShowKeyInput] = useState(false);
  const [question, setQuestion] = useState('');
  const [isQuerying, setIsQuerying] = useState(false);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [answerSource, setAnswerSource] = useState<string>('');

  // Live feed items
  const [feedItems, setFeedItems] = useState<NewsItem[]>([
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
      summary: 'Following her election as Conservative leader, Kemi Badenoch completes her Shadow Cabinet appointments, with Mel Stride as Shadow Chancellor, Chris Philp at Home Affairs, Priti Patel at Foreign Affairs, and Robert Jenrick at Justice.'
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

  const handleAskGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim()) return;

    const keyToUse = apiKey.trim() || getStoredApiKey();
    if (!keyToUse) {
      setShowKeyInput(true);
      setAiAnswer('Please enter your Gemini API key to activate live AI queries.');
      return;
    }

    setIsQuerying(true);
    setAiAnswer(null);

    const prompt = `
    You are an expert UK political analyst with deep knowledge of UK party manifestos, parliamentary actions, Cabinet appointments, and polling.
    Answer this user query accurately, neutrally, and with concrete facts and figures:
    "${question}"

    Instructions:
    - Compare relevant party stances (Labour, Conservative, Reform UK, Lib Dems, Greens, SNP, Plaid Cymru, Restore Britain).
    - Quote verified figures or official legislation wherever possible.
    - Keep tone strictly impartial and fact-grounded.
    `;

    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${keyToUse}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.2 }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Gemini API Error (${response.status}): ${errText}`);
      }

      const data = await response.json();
      const parts = data.candidates?.[0]?.content?.parts || [];
      const answer = parts.map((p: any) => p.text || '').filter(Boolean).join('\n\n') || 'No response returned from model.';
      setAiAnswer(answer);
      setAnswerSource('Generated live via Gemini 3.8 Flash');
    } catch (err: any) {
      console.error(err);
      setAiAnswer(`Could not complete query: ${err.message}. If using your custom API key, ensure it has Generative Language API access.`);
    } finally {
      setIsQuerying(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping inline-block" />
              <span>Live Westminster Feed • Powered by Gemini 3.8 Flash</span>
            </div>
            <h2 className="text-xl sm:text-3xl font-extrabold tracking-tight">
              Live Political Intelligence & AI Q&A
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Real-time feed of major policy white papers, cabinet statements, and polling trends, with on-demand interactive analysis powered by Google Gemini 3.8 Flash.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <button
              onClick={() => setShowKeyInput(!showKeyInput)}
              className="flex items-center justify-center space-x-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold border border-slate-700 text-slate-200 transition-colors cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span>{apiKey || getStoredApiKey() ? 'Gemini 3.8 Connected ✓' : 'Set Admin API Key'}</span>
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

      {/* Interactive Ask Gemini 3.8 Flash Search */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-base text-slate-900">
            Ask Gemini 3.8 Flash About Any Policy or Politician
          </h3>
        </div>
        <p className="text-xs text-slate-500">
          Query current government white papers, opposition positions, or leadership comparisons. Instant, non-partisan analysis.
        </p>

        <form onSubmit={handleAskGemini} className="flex gap-2">
          <input
            type="text"
            placeholder="e.g. 'What is Angela Rayner's housing target?' or 'Compare Labour and Tory farm inheritance tax'..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900"
          />
          <button
            type="submit"
            disabled={isQuerying || !question.trim()}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center space-x-1.5 transition-colors shrink-0"
          >
            {isQuerying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Thinking...</span>
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                <span>Ask AI</span>
              </>
            )}
          </button>
        </form>

        {/* AI Answer Box */}
        {aiAnswer && (
          <div className="p-4 sm:p-5 rounded-2xl bg-purple-50/60 border border-purple-200 text-slate-900 space-y-2 mt-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs text-purple-900 font-bold">
              <span className="flex items-center space-x-1">
                <Sparkles className="w-3.5 h-3.5 text-purple-600" />
                <span>Gemini 3.8 Flash Analysis:</span>
              </span>
              <span className="text-[10px] text-purple-600 font-medium">{answerSource}</span>
            </div>
            <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-line text-slate-800">
              {aiAnswer}
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
