import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { 
  Party, 
  PollPoint, 
  PolicyPopularityItem, 
  LeaderRating, 
  BestPrimeMinisterPoll,
  PollsterLeaderSet,
  PartyId 
} from '../types/politics';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Vote, 
  Check, 
  X, 
  HelpCircle,
  Award,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Search,
  Scale,
  Layers,
  Info,
  SlidersHorizontal,
  CheckCircle2
} from 'lucide-react';
import { SectionRefreshButton } from './SectionRefreshButton';

interface PollTrackerProps {
  parties: Party[];
  timeSeries: PollPoint[];
  policyPopularity: PolicyPopularityItem[];
  leaderRatings?: LeaderRating[];
  leaderRatingsByPollster?: PollsterLeaderSet[];
  bestPrimeMinister?: BestPrimeMinisterPoll;
  lastUpdated: string;
  onRefreshPolls?: () => Promise<void> | void;
  initialSubTab?: 'voting' | 'leaders' | 'bestpm' | 'policies';
  initialTargetLeader?: PartyId;
}

export const PollTracker: React.FC<PollTrackerProps> = ({
  parties,
  timeSeries,
  policyPopularity,
  leaderRatings = [],
  leaderRatingsByPollster = [],
  bestPrimeMinister,
  lastUpdated,
  onRefreshPolls,
  initialSubTab,
  initialTargetLeader,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'voting' | 'leaders' | 'policies' | 'bestpm'>(
    initialSubTab || 'voting'
  );
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Head to head leaders
  const [compareLeaderA, setCompareLeaderA] = useState<PartyId>(initialTargetLeader || 'labour');
  const [compareLeaderB, setCompareLeaderB] = useState<PartyId>('conservative');

  // Selected Pollster for Leader Ratings
  const [selectedLeaderPollsterId, setSelectedLeaderPollsterId] = useState<string>('poll-of-polls');
  // Selected Poll for Voting Intention
  const [selectedVotingPollIndex, setSelectedVotingPollIndex] = useState<number>(timeSeries.length - 1);

  // Sync when user navigates directly to a leader (e.g. from Andy Burnham's card)
  React.useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  React.useEffect(() => {
    if (initialTargetLeader) {
      setCompareLeaderA(initialTargetLeader);
    }
  }, [initialTargetLeader]);

  // Resolve active leader ratings set based on selected pollster
  const activePollsterSet = leaderRatingsByPollster.find(
    (p) => p.pollsterId === selectedLeaderPollsterId
  );
  const currentLeaderRatings: LeaderRating[] = 
    (activePollsterSet && activePollsterSet.ratings.length > 0)
      ? activePollsterSet.ratings
      : leaderRatings;

  const currentVotingPoll = timeSeries[selectedVotingPollIndex] || timeSeries[timeSeries.length - 1];

  const filteredPolicies = policyPopularity.filter((item) => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    const matchesSearch = 
      searchQuery.trim() === '' ||
      item.policy.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.pollster.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const latestPoll = timeSeries[timeSeries.length - 1];

  const getTrendIcon = (trend: string) => {
    if (trend.startsWith('+')) return <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600 inline" />;
    if (trend.startsWith('-')) return <ArrowDownRight className="w-3.5 h-3.5 text-rose-600 inline" />;
    return <Minus className="w-3.5 h-3.5 text-slate-400 inline" />;
  };

  const leaderA = currentLeaderRatings.find((l) => l.partyId === compareLeaderA) || leaderRatings.find((l) => l.partyId === compareLeaderA);
  const leaderB = currentLeaderRatings.find((l) => l.partyId === compareLeaderB) || leaderRatings.find((l) => l.partyId === compareLeaderB);
  const partyA = parties.find((p) => p.id === compareLeaderA);
  const partyB = parties.find((p) => p.id === compareLeaderB);

  const getPollsterRating = (pollsterId: string, partyId: PartyId) => {
    const set = leaderRatingsByPollster.find((p) => p.pollsterId === pollsterId);
    return set?.ratings.find((r) => r.partyId === partyId);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <BarChart3 className="w-4 h-4" />
            <span>Public Sentiment & Live Trackers</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Opinion Polling, Leader Approval & Policy Popularity
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Real-time aggregate tracking of UK national voting intention, political leader approval ratings, head-to-head comparisons, and independent public opinion on key policy proposals.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <SectionRefreshButton
            sectionName="Polls & Ratings"
            defaultDate={`Synced: ${lastUpdated}`}
            onRefresh={onRefreshPolls}
          />
          <div className="text-left md:text-right bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Pollster Benchmark</span>
            <span className="text-xs font-bold text-slate-800 block">YouGov • Ipsos • Savanta • Opinium • Redfield</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'voting', label: 'Party Voting Intention (Vote Share %)', icon: TrendingUp },
          { id: 'leaders', label: 'Leader Personal Approval (Ratings)', icon: Users },
          { id: 'bestpm', label: 'Best Prime Minister Tracker', icon: Award },
          { id: 'policies', label: `Policy Public Support (${policyPopularity.length} Polls)`, icon: Vote },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Distinction Banner: Party Voting Intention vs Leader Personal Approval */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white rounded-2xl p-4 sm:p-5 border border-slate-700 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start space-x-3.5">
          <div className="p-2.5 rounded-xl bg-white/10 shrink-0 mt-0.5">
            <Scale className="w-5 h-5 text-rose-400" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2 font-bold mb-1">
              <span className="text-rose-400 uppercase tracking-wider text-[10px] bg-rose-500/20 px-2 py-0.5 rounded font-black">
                Methodology Distinction
              </span>
              <span className="text-slate-200 text-xs sm:text-sm">
                Party Approval (Vote Share) vs Leader Approval (Personal Ratings)
              </span>
            </div>
            <p className="text-slate-300 text-xs leading-relaxed max-w-3xl">
              <strong className="text-white font-semibold">1. Party Voting Intention (%):</strong> "If a General Election were held tomorrow, which party would you vote for?" (e.g. Labour 31%, Conservative 24%, Reform 20%). Measures party brand and national electoral strength.<br />
              <strong className="text-white font-semibold">2. Leader Personal Approval (Net):</strong> "Do you approve or disapprove of Andy Burnham / Kemi Badenoch / Nigel Farage as leader?" (e.g. Andy Burnham +8 Net, Kemi Badenoch -19 Net, Nigel Farage -25 Net). Individual leaders routinely outpoll or underpoll their party baseline.
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
          <button
            onClick={() => setActiveSubTab('voting')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'voting'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            Party Polls
          </button>
          <button
            onClick={() => setActiveSubTab('leaders')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeSubTab === 'leaders'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-white/10 text-slate-300 hover:bg-white/20'
            }`}
          >
            Leader Approval
          </button>
        </div>
      </div>

      {/* ---------------- 1. VOTING INTENTION TAB ---------------- */}
      {activeSubTab === 'voting' && (
        <div className="space-y-6">
          {/* Poll Selection Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-bold text-slate-700">Displaying Vote Share From:</span>
              <span className="text-xs font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                {currentVotingPoll.pollster} ({currentVotingPoll.date})
              </span>
              <span className="text-xs text-rose-600 font-bold">
                Lead: {currentVotingPoll.leadParty.toUpperCase()} (+{currentVotingPoll.leadMargin} pts)
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-xs font-semibold text-slate-500 whitespace-nowrap">Change Poll:</label>
              <select
                value={selectedVotingPollIndex}
                onChange={(e) => setSelectedVotingPollIndex(Number(e.target.value))}
                className="bg-slate-50 text-slate-900 text-xs font-bold px-3 py-1.5 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                {timeSeries.map((poll, idx) => (
                  <option key={idx} value={idx}>
                    {poll.pollster} ({poll.date}) {poll.sampleSize ? `• ${poll.sampleSize.toLocaleString()} sample` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Voting Headline Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { partyId: 'labour', name: 'Labour', pct: currentVotingPoll.labour, color: '#E4003B' },
              { partyId: 'conservative', name: 'Conservative', pct: currentVotingPoll.conservative, color: '#0087DC' },
              { partyId: 'reform', name: 'Reform UK', pct: currentVotingPoll.reform, color: '#12B6CF' },
              { partyId: 'libdem', name: 'Lib Dem', pct: currentVotingPoll.libdem, color: '#FAA61A' },
              { partyId: 'green', name: 'Green', pct: currentVotingPoll.green, color: '#528D22' },
              { partyId: 'snp', name: 'SNP', pct: currentVotingPoll.snp, color: '#D99B00' },
            ].map((item) => (
              <div
                key={item.partyId}
                className="bg-white rounded-xl p-4 border border-slate-200 shadow-xs relative overflow-hidden flex flex-col justify-between"
              >
                <div 
                  className="absolute top-0 left-0 right-0 h-1" 
                  style={{ backgroundColor: item.color }} 
                />
                <div>
                  <span className="text-xs font-bold text-slate-500 block">{item.name}</span>
                  <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                    {item.pct}%
                  </span>
                </div>
                <span className="text-[10px] text-slate-400 mt-2 block">
                  {currentVotingPoll.pollster}
                </span>
              </div>
            ))}
          </div>

          {/* Voting Intention Recharts Line Chart */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                  <span>National Voting Intention Trend Line</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Aggregated polling trajectory from the 2024 General Election through late 2026
                </p>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                Source: British Polling Council members
              </span>
            </div>

            <div className="h-72 sm:h-84 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timeSeries} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis 
                    dataKey="date" 
                    tick={{ fontSize: 10, fill: '#64748b' }} 
                    tickFormatter={(dateStr: string) => {
                      try {
                        const parts = dateStr.split('-');
                        if (parts.length >= 2) {
                          const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                          const mIdx = parseInt(parts[1], 10) - 1;
                          return `${monthNames[mIdx] || parts[1]} '${parts[0].slice(2)}`;
                        }
                        return dateStr;
                      } catch {
                        return dateStr;
                      }
                    }}
                    interval="preserveStartEnd"
                    minTickGap={25}
                  />
                  <YAxis domain={[0, 40]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip 
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload;
                      if (item) {
                        return `${item.pollster} • ${item.date} (${item.leadParty?.toUpperCase()} +${item.leadMargin}%)`;
                      }
                      return label;
                    }}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="labour" name="Labour" stroke="#E4003B" strokeWidth={3} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="conservative" name="Conservative" stroke="#0087DC" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="reform" name="Reform UK" stroke="#12B6CF" strokeWidth={2.5} dot={{ r: 2 }} activeDot={{ r: 5 }} />
                  <Line type="monotone" dataKey="libdem" name="Lib Dem" stroke="#FAA61A" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                  <Line type="monotone" dataKey="green" name="Green" stroke="#528D22" strokeWidth={2} dot={{ r: 2 }} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. LEADER APPROVAL RATINGS TAB ---------------- */}
      {activeSubTab === 'leaders' && (
        <div className="space-y-6">
          {/* Pollster Selection & Metadata Header */}
          <div className="bg-white rounded-2xl p-4 sm:p-5 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-600 shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                  Active Leader Pollster Selection
                </span>
                <h4 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <span>{activePollsterSet?.pollsterName || 'Aggregated Poll of Polls'}</span>
                  <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                    {activePollsterSet?.date || lastUpdated}
                  </span>
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {activePollsterSet ? `${activePollsterSet.methodology} • Sample: ${activePollsterSet.sampleSize?.toLocaleString()} voters` : 'Comprehensive weighted average of British Polling Council members'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2 shrink-0">
              <label className="text-xs font-bold text-slate-700 whitespace-nowrap">Select Pollster:</label>
              <select
                value={selectedLeaderPollsterId}
                onChange={(e) => setSelectedLeaderPollsterId(e.target.value)}
                className="bg-slate-50 text-slate-900 text-xs font-bold px-3 py-2 rounded-xl border border-slate-300 focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
              >
                {leaderRatingsByPollster.map((ps) => (
                  <option key={ps.pollsterId} value={ps.pollsterId}>
                    {ps.pollsterName} ({ps.date})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Head-to-Head Comparison Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <Scale className="w-4 h-4" />
                <span>Interactive Leader Head-to-Head</span>
              </div>
              <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">
                Poll: {activePollsterSet?.pollsterName || 'Aggregated Poll of Polls'}
              </span>
            </div>
            <h3 className="text-xl sm:text-2xl font-black mb-4">
              Compare Any Two Leaders
            </h3>

            {/* Selectors */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Select Leader A:</label>
                <select
                  value={compareLeaderA}
                  onChange={(e) => setCompareLeaderA(e.target.value as PartyId)}
                  className="w-full bg-slate-800 text-white text-sm font-semibold rounded-xl px-3 py-2 border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.leader} ({p.shortName})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1 font-semibold">Select Leader B:</label>
                <select
                  value={compareLeaderB}
                  onChange={(e) => setCompareLeaderB(e.target.value as PartyId)}
                  className="w-full bg-slate-800 text-white text-sm font-semibold rounded-xl px-3 py-2 border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500 cursor-pointer"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.leader} ({p.shortName})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Side-by-side comparison stats */}
            {leaderA && leaderB && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Leader A Card */}
                <div className={`bg-slate-800/80 rounded-2xl p-5 border space-y-3 ${compareLeaderA === 'labour' ? 'border-rose-500/60 ring-1 ring-rose-500/40' : 'border-slate-700'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: partyA?.color }} />
                        <span>{partyA?.name}</span>
                      </span>
                      <h4 className="text-lg font-bold text-white mt-0.5">{leaderA.leaderName}</h4>
                      <p className="text-xs text-slate-300">{leaderA.role}</p>
                    </div>
                    <span 
                      className={`text-xl font-black px-3 py-1 rounded-xl ${
                        leaderA.netRating >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {leaderA.netRating >= 0 ? `+${leaderA.netRating}` : leaderA.netRating} Net
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-400 font-semibold">Approve: {leaderA.approvePct}%</span>
                      <span className="text-rose-400 font-semibold">Disapprove: {leaderA.disapprovePct}%</span>
                      <span className="text-slate-400">Don't Know: {leaderA.dontKnowPct}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-700 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${leaderA.approvePct}%` }} />
                      <div className="bg-rose-500 h-full" style={{ width: `${leaderA.disapprovePct}%` }} />
                      <div className="bg-slate-500 h-full" style={{ width: `${leaderA.dontKnowPct}%` }} />
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Recent 30-day Trend: {getTrendIcon(leaderA.trend)} {leaderA.trend} pts</span>
                    <span>{leaderA.pollster}</span>
                  </div>
                </div>

                {/* Leader B Card */}
                <div className={`bg-slate-800/80 rounded-2xl p-5 border space-y-3 ${compareLeaderB === 'conservative' ? 'border-blue-500/60 ring-1 ring-blue-500/40' : 'border-slate-700'}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400 flex items-center space-x-1.5">
                        <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: partyB?.color }} />
                        <span>{partyB?.name}</span>
                      </span>
                      <h4 className="text-lg font-bold text-white mt-0.5">{leaderB.leaderName}</h4>
                      <p className="text-xs text-slate-300">{leaderB.role}</p>
                    </div>
                    <span 
                      className={`text-xl font-black px-3 py-1 rounded-xl ${
                        leaderB.netRating >= 0 ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                      }`}
                    >
                      {leaderB.netRating >= 0 ? `+${leaderB.netRating}` : leaderB.netRating} Net
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <div className="flex justify-between text-xs">
                      <span className="text-emerald-400 font-semibold">Approve: {leaderB.approvePct}%</span>
                      <span className="text-rose-400 font-semibold">Disapprove: {leaderB.disapprovePct}%</span>
                      <span className="text-slate-400">Don't Know: {leaderB.dontKnowPct}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-700 rounded-full overflow-hidden flex">
                      <div className="bg-emerald-500 h-full" style={{ width: `${leaderB.approvePct}%` }} />
                      <div className="bg-rose-500 h-full" style={{ width: `${leaderB.disapprovePct}%` }} />
                      <div className="bg-slate-500 h-full" style={{ width: `${leaderB.dontKnowPct}%` }} />
                    </div>
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
                    <span>Recent 30-day Trend: {getTrendIcon(leaderB.trend)} {leaderB.trend} pts</span>
                    <span>{leaderB.pollster}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Multi-Pollster Comparison Matrix Table */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-0.5">
                  <Layers className="w-4 h-4" />
                  <span>Selection of Different Pollings</span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900">
                  Cross-Pollster Comparison Matrix
                </h3>
                <p className="text-xs text-slate-500">
                  Side-by-side comparison of party leaders across YouGov, Ipsos, Savanta, and Redfield & Wilton
                </p>
              </div>
              <span className="text-[11px] text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                Click any leader row to select in head-to-head comparison
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 uppercase font-bold text-[11px]">
                    <th className="py-3 px-3">Party Leader</th>
                    <th className="py-3 px-3 text-center">YouGov Tracker</th>
                    <th className="py-3 px-3 text-center">Ipsos Political</th>
                    <th className="py-3 px-3 text-center">Savanta UK</th>
                    <th className="py-3 px-3 text-center">Redfield & Wilton</th>
                    <th className="py-3 px-3 text-center bg-slate-100 font-black">Poll of Polls Avg</th>
                    <th className="py-3 px-3 text-right">Select</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {parties.map((p) => {
                    const mainRating = leaderRatings.find((l) => l.partyId === p.id);
                    if (!mainRating) return null;
                    const yg = getPollsterRating('yougov', p.id);
                    const ip = getPollsterRating('ipsos', p.id);
                    const sa = getPollsterRating('savanta', p.id);
                    const rw = getPollsterRating('redfield', p.id);
                    const pop = getPollsterRating('poll-of-polls', p.id) || mainRating;
                    const isSelected = compareLeaderA === p.id;

                    return (
                      <tr 
                        key={p.id}
                        onClick={() => setCompareLeaderA(p.id)}
                        className={`hover:bg-slate-50/80 transition-colors cursor-pointer ${
                          isSelected ? 'bg-rose-50/50' : ''
                        }`}
                      >
                        <td className="py-3 px-3">
                          <div className="flex items-center space-x-2.5">
                            <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                            <div>
                              <div className="font-bold text-slate-900 flex items-center space-x-1.5">
                                <span>{mainRating.leaderName}</span>
                                {isSelected && (
                                  <span className="text-[9px] bg-rose-600 text-white font-bold px-1.5 py-0.2 rounded">
                                    Selected A
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-500">{p.shortName} • {mainRating.role}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-center">
                          {yg ? (
                            <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${yg.netRating >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {yg.netRating >= 0 ? `+${yg.netRating}` : yg.netRating}
                              <span className="text-[10px] font-normal text-slate-500 block">({yg.approvePct}% App)</span>
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {ip ? (
                            <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${ip.netRating >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {ip.netRating >= 0 ? `+${ip.netRating}` : ip.netRating}
                              <span className="text-[10px] font-normal text-slate-500 block">({ip.approvePct}% App)</span>
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {sa ? (
                            <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${sa.netRating >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {sa.netRating >= 0 ? `+${sa.netRating}` : sa.netRating}
                              <span className="text-[10px] font-normal text-slate-500 block">({sa.approvePct}% App)</span>
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-3 text-center">
                          {rw ? (
                            <span className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${rw.netRating >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                              {rw.netRating >= 0 ? `+${rw.netRating}` : rw.netRating}
                              <span className="text-[10px] font-normal text-slate-500 block">({rw.approvePct}% App)</span>
                            </span>
                          ) : <span className="text-slate-300">—</span>}
                        </td>
                        <td className="py-3 px-3 text-center bg-slate-50/50">
                          <span className={`inline-block px-2.5 py-1 rounded-lg font-black text-xs ${pop.netRating >= 0 ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-rose-100 text-rose-900 border border-rose-300'}`}>
                            {pop.netRating >= 0 ? `+${pop.netRating}` : pop.netRating} Net
                            <span className="text-[10px] font-medium text-slate-500 block">({pop.approvePct}% / {pop.disapprovePct}%)</span>
                          </span>
                        </td>
                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCompareLeaderA(p.id);
                            }}
                            className="text-[11px] font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors border border-rose-200 cursor-pointer"
                          >
                            Compare
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Grid of All Leaders */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  National Leader Approval Rankings ({activePollsterSet?.pollsterName || 'Aggregated Poll of Polls'})
                </h3>
                <p className="text-xs text-slate-500">
                  Net approval score (% approve minus % disapprove) across UK party leaders
                </p>
              </div>
              <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                Showing {currentLeaderRatings.length} leaders
              </span>
            </div>

            <div className="space-y-3">
              {currentLeaderRatings
                .sort((a, b) => b.netRating - a.netRating)
                .map((leader) => {
                  const party = parties.find((p) => p.id === leader.partyId);
                  const isSelected = compareLeaderA === leader.partyId;

                  return (
                    <div
                      key={leader.partyId}
                      onClick={() => setCompareLeaderA(leader.partyId)}
                      className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                        isSelected
                          ? 'border-rose-400 bg-rose-50/40 ring-1 ring-rose-400 shadow-xs'
                          : 'border-slate-100 bg-slate-50/60 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span 
                          className="w-3.5 h-3.5 rounded-full shrink-0" 
                          style={{ backgroundColor: party?.color || '#94a3b8' }} 
                        />
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="font-bold text-sm text-slate-900">{leader.leaderName}</span>
                            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-slate-200 text-slate-700">
                              {party?.shortName}
                            </span>
                            {isSelected && (
                              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded bg-rose-600 text-white flex items-center space-x-0.5">
                                <CheckCircle2 className="w-2.5 h-2.5" />
                                <span>Leader A</span>
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-slate-500">{leader.role}</span>
                        </div>
                      </div>

                      {/* Approval meter */}
                      <div className="flex items-center space-x-4">
                        <div className="w-32 sm:w-44 space-y-1">
                          <div className="flex justify-between text-[11px] text-slate-600 font-medium">
                            <span className="text-emerald-700 font-bold">{leader.approvePct}% App</span>
                            <span className="text-rose-700 font-bold">{leader.disapprovePct}% Dis</span>
                          </div>
                          <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${leader.approvePct}%` }} />
                            <div className="bg-rose-500 h-full" style={{ width: `${leader.disapprovePct}%` }} />
                            <div className="bg-slate-400 h-full" style={{ width: `${leader.dontKnowPct}%` }} />
                          </div>
                        </div>

                        {/* Net score badge */}
                        <div className="w-20 text-right">
                          <span 
                            className={`inline-block px-2.5 py-1 rounded-lg text-xs font-black ${
                              leader.netRating >= 0
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {leader.netRating >= 0 ? `+${leader.netRating}` : leader.netRating}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {getTrendIcon(leader.trend)} {leader.trend}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 3. BEST PRIME MINISTER TAB ---------------- */}
      {activeSubTab === 'bestpm' && bestPrimeMinister && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>"Who Would Make the Best Prime Minister?" Tracker</span>
              </h3>
              <p className="text-xs text-slate-500">
                Direct head-to-head voter preference question tested weekly by YouGov
              </p>
            </div>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
              {bestPrimeMinister.pollster} ({bestPrimeMinister.date})
            </span>
          </div>

          {/* Grid of contenders */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { name: 'Andy Burnham', party: 'Labour', pct: bestPrimeMinister.burnham ?? bestPrimeMinister.starmer, color: '#E4003B' },
              { name: 'Kemi Badenoch', party: 'Conservative', pct: bestPrimeMinister.badenoch, color: '#0087DC' },
              { name: 'Nigel Farage', party: 'Reform UK', pct: bestPrimeMinister.farage, color: '#12B6CF' },
              { name: 'Sir Ed Davey', party: 'Lib Dem', pct: bestPrimeMinister.davey, color: '#FAA61A' },
              { name: 'Neither / Not Sure', party: 'Undecided', pct: bestPrimeMinister.neitherUnsure, color: '#64748b' },
            ].map((candidate, idx) => (
              <div 
                key={idx}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col justify-between text-center relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: candidate.color }} />
                <div>
                  <span className="text-xs font-bold text-slate-400 block">{candidate.party}</span>
                  <h4 className="text-sm font-bold text-slate-900 mt-0.5">{candidate.name}</h4>
                </div>
                <div className="my-3">
                  <span className="text-3xl font-black text-slate-900">{candidate.pct}%</span>
                </div>
                <span className="text-[10px] text-slate-400">Public Choice</span>
              </div>
            ))}
          </div>

          {/* Stacked comparison bar */}
          <div className="space-y-1.5">
            <span className="text-xs font-bold text-slate-500">Distribution:</span>
            <div className="h-4 w-full rounded-full overflow-hidden flex shadow-xs">
              <div style={{ width: `${bestPrimeMinister.starmer}%`, backgroundColor: '#E4003B' }} title={`Starmer: ${bestPrimeMinister.starmer}%`} />
              <div style={{ width: `${bestPrimeMinister.badenoch}%`, backgroundColor: '#0087DC' }} title={`Badenoch: ${bestPrimeMinister.badenoch}%`} />
              <div style={{ width: `${bestPrimeMinister.farage}%`, backgroundColor: '#12B6CF' }} title={`Farage: ${bestPrimeMinister.farage}%`} />
              <div style={{ width: `${bestPrimeMinister.davey}%`, backgroundColor: '#FAA61A' }} title={`Davey: ${bestPrimeMinister.davey}%`} />
              <div style={{ width: `${bestPrimeMinister.neitherUnsure}%`, backgroundColor: '#94a3b8' }} title={`Neither/Unsure: ${bestPrimeMinister.neitherUnsure}%`} />
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 4. POLICY POPULARITY TAB ---------------- */}
      {activeSubTab === 'policies' && (
        <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Vote className="w-4 h-4 text-rose-600" />
                <span>Extensive Policy Opinion Tracker ({filteredPolicies.length} Tested Policies)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Representative British polling testing individual manifesto policies directly with voters
              </p>
            </div>

            {/* Category filter */}
            <div className="flex items-center space-x-1 overflow-x-auto pb-1">
              {['all', 'nhs', 'economy', 'defence', 'welfare', 'energy', 'housing', 'education'].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                    selectedCategory === cat
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Search within polls */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search specific policies (e.g. VAT, water, smoking, assisted dying, winter fuel)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>

          {/* List of Policy Bars */}
          <div className="space-y-4">
            {filteredPolicies.map((item, index) => (
              <div 
                key={index}
                className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-200 text-slate-700">
                      {item.category}
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {item.policy}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-medium">
                    {item.pollster} ({item.date})
                  </span>
                </div>

                {/* Progress split bar */}
                <div className="space-y-1 mb-3">
                  <div className="h-3 w-full bg-slate-200 rounded-full overflow-hidden flex">
                    <div 
                      className="bg-emerald-500 h-full" 
                      style={{ width: `${item.supportPct}%` }}
                      title={`Support: ${item.supportPct}%`}
                    />
                    <div 
                      className="bg-rose-500 h-full" 
                      style={{ width: `${item.opposePct}%` }}
                      title={`Oppose: ${item.opposePct}%`}
                    />
                    <div 
                      className="bg-slate-400 h-full" 
                      style={{ width: `${item.unsurePct}%` }}
                      title={`Unsure: ${item.unsurePct}%`}
                    />
                  </div>

                  <div className="flex justify-between text-[11px] font-semibold">
                    <span className="text-emerald-700">✓ {item.supportPct}% Support</span>
                    <span className="text-rose-700">✕ {item.opposePct}% Oppose</span>
                    <span className="text-slate-500">? {item.unsurePct}% Don't Know</span>
                  </div>
                </div>

                {/* Parties backing this policy */}
                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/60 text-xs">
                  <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">
                    Backed in Manifesto by:
                  </span>
                  {item.partiesSupporting.map((partyId) => {
                    if (partyId === ('free_vote' as any)) {
                      return (
                        <span key="free_vote" className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-100 text-purple-800">
                          Free Vote in Parliament
                        </span>
                      );
                    }
                    const p = parties.find((part) => part.id === partyId);
                    if (!p) return null;
                    return (
                      <span
                        key={partyId}
                        className="px-2 py-0.5 rounded-md text-[11px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: p.color }}
                      >
                        {p.shortName}
                      </span>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
