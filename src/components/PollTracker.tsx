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
  Scale
} from 'lucide-react';
import { SectionRefreshButton } from './SectionRefreshButton';

interface PollTrackerProps {
  parties: Party[];
  timeSeries: PollPoint[];
  policyPopularity: PolicyPopularityItem[];
  leaderRatings?: LeaderRating[];
  bestPrimeMinister?: BestPrimeMinisterPoll;
  lastUpdated: string;
  onRefreshPolls?: () => Promise<void> | void;
}

export const PollTracker: React.FC<PollTrackerProps> = ({
  parties,
  timeSeries,
  policyPopularity,
  leaderRatings = [],
  bestPrimeMinister,
  lastUpdated,
  onRefreshPolls,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'voting' | 'leaders' | 'policies' | 'bestpm'>('voting');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Head to head leaders
  const [compareLeaderA, setCompareLeaderA] = useState<PartyId>('labour');
  const [compareLeaderB, setCompareLeaderB] = useState<PartyId>('conservative');

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

  const leaderA = leaderRatings.find((l) => l.partyId === compareLeaderA);
  const leaderB = leaderRatings.find((l) => l.partyId === compareLeaderB);
  const partyA = parties.find((p) => p.id === compareLeaderA);
  const partyB = parties.find((p) => p.id === compareLeaderB);

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
            <span className="text-xs font-bold text-slate-800 block">YouGov • Ipsos • Savanta • Opinium</span>
          </div>
        </div>
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-none">
        {[
          { id: 'voting', label: 'Voting Intention', icon: TrendingUp },
          { id: 'leaders', label: 'Leader Approval Ratings & Comparison', icon: Users },
          { id: 'bestpm', label: 'Best Prime Minister Tracker', icon: Award },
          { id: 'policies', label: `Policy Popularity (${policyPopularity.length} Polls)`, icon: Vote },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all ${
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

      {/* ---------------- 1. VOTING INTENTION TAB ---------------- */}
      {activeSubTab === 'voting' && (
        <div className="space-y-6">
          {/* Latest Polling Headline Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { partyId: 'labour', name: 'Labour', pct: latestPoll.labour, color: '#E4003B' },
              { partyId: 'conservative', name: 'Conservative', pct: latestPoll.conservative, color: '#0087DC' },
              { partyId: 'reform', name: 'Reform UK', pct: latestPoll.reform, color: '#12B6CF' },
              { partyId: 'libdem', name: 'Lib Dem', pct: latestPoll.libdem, color: '#FAA61A' },
              { partyId: 'green', name: 'Green', pct: latestPoll.green, color: '#528D22' },
              { partyId: 'snp', name: 'SNP', pct: latestPoll.snp, color: '#D99B00' },
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
                  National Average
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
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                  <YAxis domain={[0, 40]} tick={{ fontSize: 11, fill: '#64748b' }} unit="%" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      borderRadius: '12px', 
                      border: '1px solid #e2e8f0', 
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                      fontSize: '12px'
                    }} 
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                  <Line type="monotone" dataKey="labour" name="Labour" stroke="#E4003B" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="conservative" name="Conservative" stroke="#0087DC" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="reform" name="Reform UK" stroke="#12B6CF" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="libdem" name="Lib Dem" stroke="#FAA61A" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="green" name="Green" stroke="#528D22" strokeWidth={2} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* ---------------- 2. LEADER APPROVAL RATINGS TAB ---------------- */}
      {activeSubTab === 'leaders' && (
        <div className="space-y-6">
          {/* Head-to-Head Comparison Card */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-xl">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider mb-2">
              <Scale className="w-4 h-4" />
              <span>Interactive Leader Head-to-Head</span>
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
                  className="w-full bg-slate-800 text-white text-sm font-semibold rounded-xl px-3 py-2 border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
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
                  className="w-full bg-slate-800 text-white text-sm font-semibold rounded-xl px-3 py-2 border border-slate-700 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
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
                <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400">{partyA?.name}</span>
                      <h4 className="text-lg font-bold text-white">{leaderA.leaderName}</h4>
                      <p className="text-xs text-slate-300">{leaderA.role}</p>
                    </div>
                    <span 
                      className={`text-xl font-black px-3 py-1 rounded-xl ${
                        leaderA.netRating >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
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
                <div className="bg-slate-800/80 rounded-2xl p-5 border border-slate-700 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-400">{partyB?.name}</span>
                      <h4 className="text-lg font-bold text-white">{leaderB.leaderName}</h4>
                      <p className="text-xs text-slate-300">{leaderB.role}</p>
                    </div>
                    <span 
                      className={`text-xl font-black px-3 py-1 rounded-xl ${
                        leaderB.netRating >= 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
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

          {/* Full Grid of All Leaders */}
          <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 mb-1">
              National Leader Approval Rankings
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Net approval score (% approve minus % disapprove) across UK party leaders
            </p>

            <div className="space-y-3">
              {leaderRatings
                .sort((a, b) => b.netRating - a.netRating)
                .map((leader) => {
                  const party = parties.find((p) => p.id === leader.partyId);

                  return (
                    <div
                      key={leader.partyId}
                      className="p-4 rounded-xl border border-slate-100 bg-slate-50/60 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
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
