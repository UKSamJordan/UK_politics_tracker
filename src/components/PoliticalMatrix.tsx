import React, { useState } from 'react';
import { Party, PartyId, PolicyTopic } from '../types/politics';
import { 
  Compass, 
  Crosshair, 
  Scale, 
  Users, 
  Shield, 
  TrendingUp, 
  GraduationCap, 
  Plane, 
  Zap, 
  Home, 
  Heart, 
  HeartPulse, 
  ExternalLink, 
  ArrowRight, 
  Info, 
  CheckCircle2, 
  Sliders, 
  Layers,
  Sparkles
} from 'lucide-react';

interface PoliticalMatrixProps {
  parties: Party[];
  policies: PolicyTopic[];
  onSelectPartyForCabinet?: (partyId: PartyId) => void;
}

type MatrixMode = 'parties' | 'policies';

export const PoliticalMatrix: React.FC<PoliticalMatrixProps> = ({
  parties,
  policies,
  onSelectPartyForCabinet,
}) => {
  const [mode, setMode] = useState<MatrixMode>('parties');
  const [selectedPartyId, setSelectedPartyId] = useState<PartyId>('labour');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(policies[0]?.id || 'education-schools-and-universities');
  
  // Head to Head ideological distance calculator
  const [comparePartyA, setComparePartyA] = useState<PartyId>('labour');
  const [comparePartyB, setComparePartyB] = useState<PartyId>('reform');

  // Policy category filter
  const [policyCategoryFilter, setPolicyCategoryFilter] = useState<string>('all');

  const selectedParty = parties.find((p) => p.id === selectedPartyId) || parties[0];
  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId) || policies[0];

  const partyA = parties.find((p) => p.id === comparePartyA) || parties[0];
  const partyB = parties.find((p) => p.id === comparePartyB) || parties[1];

  // Calculate Euclidean ideological distance
  const calcDistance = (p1: Party, p2: Party) => {
    const x1 = p1.compass?.economicScore ?? 0;
    const y1 = p1.compass?.socialScore ?? 0;
    const x2 = p2.compass?.economicScore ?? 0;
    const y2 = p2.compass?.socialScore ?? 0;
    const dist = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));
    return Number(dist.toFixed(1));
  };

  const ideologicalDistance = calcDistance(partyA, partyB);

  // SVG coordinate conversion: values range from -10 to +10
  // SVG Canvas viewBox is 0 0 600 600, with center at (300, 300)
  // X: -10 -> 40, +10 -> 560
  // Y: -10 (Libertarian, bottom) -> 560, +10 (Authoritarian, top) -> 40
  const toSvgCoords = (econ: number, social: number) => {
    const x = 300 + (econ / 10) * 250;
    const y = 300 - (social / 10) * 250;
    return { x, y };
  };

  const filteredPolicies = policies.filter((topic) => {
    if (policyCategoryFilter === 'all') return true;
    return topic.category === policyCategoryFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>Ideological Mapping & Political Science Spectrum</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Political Compass & Policy Ideology Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Multi-axis positioning mapping the 8 UK political parties and core policy choices across Economic (Left vs Right) and Social Governance (Authoritarian vs Libertarian) axes based on verified 2026 manifestos.
          </p>
        </div>

        {/* Mode Selector Toggle */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200 max-w-full">
          <button
            onClick={() => setMode('parties')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'parties'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600" />
            <span>Party Compass (8 Parties)</span>
          </button>
          <button
            onClick={() => setMode('policies')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'policies'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-600" />
            <span>Policy Stance Compass</span>
          </button>
        </div>
      </div>

      {/* Axis Definition Guidance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-gradient-to-r from-rose-50 to-blue-50 border border-slate-200 rounded-xl p-3.5 flex items-start space-x-3">
          <div className="p-2 bg-white rounded-lg shadow-2xs shrink-0 text-slate-700">
            <Scale className="w-4 h-4 text-rose-600" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-xs mb-0.5">Horizontal Axis: Economic Policy (Left ↔ Right)</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong>Left (-10):</strong> Wealth taxes, public ownership of rail/water/energy, state planning, strong welfare protection.<br />
              <strong>Right (+10):</strong> Deregulation, competitive markets, lower corporation tax, private school relief, fiscal shrinking.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-purple-50 border border-slate-200 rounded-xl p-3.5 flex items-start space-x-3">
          <div className="p-2 bg-white rounded-lg shadow-2xs shrink-0 text-slate-700">
            <Sliders className="w-4 h-4 text-indigo-600" />
          </div>
          <div>
            <span className="font-bold text-slate-900 block text-xs mb-0.5">Vertical Axis: Social & Governance (Authoritarian ↔ Libertarian)</span>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              <strong>Authoritarian (+10, Top):</strong> Strict border controls, leaving ECHR, mandatory national service, law enforcement.<br />
              <strong>Libertarian (-10, Bottom):</strong> Civil liberties, human rights protections, freedom of movement, drug law reform.
            </p>
          </div>
        </div>
      </div>

      {/* Main Grid & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 2D Interactive SVG Compass Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-4 sm:p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crosshair className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-sm text-slate-900">
                {mode === 'parties' ? 'UK Political Parties on the 2D Spectrum' : 'Key Policy Proposals on the 2D Spectrum'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Interactive Canvas • Click to Inspect
            </span>
          </div>

          {/* SVG 2D Canvas */}
          <div className="relative w-full aspect-square max-w-[560px] mx-auto bg-slate-50/50 rounded-2xl border border-slate-200 overflow-hidden shadow-inner">
            {/* Quadrant Tint Overlays */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
              {/* Top-Left: Authoritarian Left */}
              <div className="bg-rose-500/5 p-3 flex flex-col justify-start items-start border-r border-b border-dashed border-slate-300">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800/80 bg-rose-100/80 px-2 py-0.5 rounded">
                  Authoritarian Left
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 hidden sm:inline">State Socialism & Regulation</span>
              </div>
              {/* Top-Right: Authoritarian Right */}
              <div className="bg-blue-500/5 p-3 flex flex-col justify-start items-end border-b border-dashed border-slate-300">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800/80 bg-blue-100/80 px-2 py-0.5 rounded">
                  Authoritarian Right
                </span>
                <span className="text-[9px] text-slate-400 mt-0.5 hidden sm:inline">National Conservatism & Order</span>
              </div>
              {/* Bottom-Left: Libertarian Left */}
              <div className="bg-emerald-500/5 p-3 flex flex-col justify-end items-start border-r border-dashed border-slate-300">
                <span className="text-[9px] text-slate-400 mb-0.5 hidden sm:inline">Democratic Socialism & Green Liberties</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800/80 bg-emerald-100/80 px-2 py-0.5 rounded">
                  Libertarian Left
                </span>
              </div>
              {/* Bottom-Right: Libertarian Right */}
              <div className="bg-amber-500/5 p-3 flex flex-col justify-end items-end">
                <span className="text-[9px] text-slate-400 mb-0.5 hidden sm:inline">Free-Market Libertarianism</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800/80 bg-amber-100/80 px-2 py-0.5 rounded">
                  Libertarian Right
                </span>
              </div>
            </div>

            {/* SVG Elements */}
            <svg viewBox="0 0 600 600" className="w-full h-full relative z-10">
              {/* Sub-grid lines */}
              <g stroke="#cbd5e1" strokeWidth="0.8" strokeDasharray="3 3">
                <line x1="175" y1="40" x2="175" y2="560" />
                <line x1="425" y1="40" x2="425" y2="560" />
                <line x1="40" y1="175" x2="560" y2="175" />
                <line x1="40" y1="425" x2="560" y2="425" />
              </g>

              {/* Major Axes */}
              <g stroke="#64748b" strokeWidth="1.8">
                {/* Horizontal X Axis */}
                <line x1="30" y1="300" x2="570" y2="300" />
                {/* Vertical Y Axis */}
                <line x1="300" y1="30" x2="300" y2="570" />
              </g>

              {/* Axis Label Ticks */}
              <text x="50" y="295" fontSize="11" fontWeight="bold" fill="#64748b" textAnchor="start">← ECONOMIC LEFT</text>
              <text x="550" y="295" fontSize="11" fontWeight="bold" fill="#64748b" textAnchor="end">ECONOMIC RIGHT →</text>
              <text x="305" y="45" fontSize="11" fontWeight="bold" fill="#64748b" textAnchor="start">↑ AUTHORITARIAN</text>
              <text x="305" y="565" fontSize="11" fontWeight="bold" fill="#64748b" textAnchor="start">↓ LIBERTARIAN</text>

              {/* ---------------- PLOTTING: PARTIES MODE ---------------- */}
              {mode === 'parties' && parties.map((p) => {
                const econ = p.compass?.economicScore ?? 0;
                const soc = p.compass?.socialScore ?? 0;
                const { x, y } = toSvgCoords(econ, soc);
                const isSelected = selectedPartyId === p.id;

                return (
                  <g
                    key={p.id}
                    onClick={() => setSelectedPartyId(p.id)}
                    className="cursor-pointer transition-all duration-200"
                    transform={`translate(${x}, ${y})`}
                  >
                    {/* Active highlight pulse aura */}
                    {isSelected && (
                      <circle
                        r="24"
                        fill="none"
                        stroke={p.color}
                        strokeWidth="2.5"
                        strokeDasharray="4 4"
                        className="animate-spin"
                        style={{ animationDuration: '8s' }}
                      />
                    )}
                    {/* Shadow & Pin Circle */}
                    <circle
                      r="16"
                      fill={p.color}
                      stroke="#ffffff"
                      strokeWidth="2.5"
                      className="transition-transform hover:scale-110 drop-shadow-md"
                    />
                    {/* Text Label */}
                    <text
                      textAnchor="middle"
                      dy="4"
                      fontSize="9"
                      fontWeight="900"
                      fill={p.textColor || '#ffffff'}
                      className="select-none pointer-events-none"
                    >
                      {p.avatarText}
                    </text>
                    {/* Party Tag Label */}
                    <g transform="translate(0, 24)" className="pointer-events-none select-none">
                      <rect
                        x="-38"
                        y="-7"
                        width="76"
                        height="15"
                        rx="4"
                        fill="#ffffff"
                        stroke={isSelected ? p.color : '#e2e8f0'}
                        strokeWidth={isSelected ? '1.5' : '1'}
                        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.08))"
                      />
                      <text
                        textAnchor="middle"
                        y="4"
                        fontSize="8.5"
                        fontWeight={isSelected ? '800' : '600'}
                        fill="#0f172a"
                      >
                        {p.shortName} ({econ > 0 ? `+${econ}` : econ}, {soc > 0 ? `+${soc}` : soc})
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* ---------------- PLOTTING: POLICIES MODE ---------------- */}
              {mode === 'policies' && filteredPolicies.map((topic) => {
                const econ = topic.compass?.economic ?? 0;
                const soc = topic.compass?.social ?? 0;
                const { x, y } = toSvgCoords(econ, soc);
                const isSelected = selectedPolicyId === topic.id;

                return (
                  <g
                    key={topic.id}
                    onClick={() => setSelectedPolicyId(topic.id)}
                    className="cursor-pointer transition-all duration-200"
                    transform={`translate(${x}, ${y})`}
                  >
                    {isSelected && (
                      <circle
                        r="20"
                        fill="none"
                        stroke="#4f46e5"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    )}
                    <circle
                      r="13"
                      fill={isSelected ? '#4f46e5' : '#0f172a'}
                      stroke="#ffffff"
                      strokeWidth="2"
                      className="hover:scale-110 drop-shadow-sm"
                    />
                    <text
                      textAnchor="middle"
                      dy="3.5"
                      fontSize="8"
                      fontWeight="bold"
                      fill="#ffffff"
                      className="select-none pointer-events-none"
                    >
                      {topic.category.slice(0, 3).toUpperCase()}
                    </text>
                    <g transform="translate(0, 20)" className="pointer-events-none select-none">
                      <rect
                        x="-45"
                        y="-7"
                        width="90"
                        height="15"
                        rx="4"
                        fill="#ffffff"
                        stroke={isSelected ? '#4f46e5' : '#e2e8f0'}
                        strokeWidth={isSelected ? '1.5' : '1'}
                        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.06))"
                      />
                      <text
                        textAnchor="middle"
                        y="4"
                        fontSize="8"
                        fontWeight={isSelected ? '800' : '600'}
                        fill="#0f172a"
                      >
                        {topic.title.split(' ')[0]} ({econ}, {soc})
                      </text>
                    </g>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Quick Party Selector Pills */}
          {mode === 'parties' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Inspect Party:
              </span>
              {parties.map((p) => {
                const isActive = selectedPartyId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPartyId(p.id)}
                    className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                    <span>{p.shortName}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Policy Category Pills */}
          {mode === 'policies' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                Filter Sector:
              </span>
              {[
                { id: 'all', label: 'All Sectors' },
                { id: 'defence', label: 'Defence' },
                { id: 'economy', label: 'Economy' },
                { id: 'education', label: 'Education' },
                { id: 'immigration', label: 'Immigration' },
                { id: 'energy', label: 'Energy' },
                { id: 'housing', label: 'Housing' },
                { id: 'nhs', label: 'NHS' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setPolicyCategoryFilter(c.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    policyCategoryFilter === c.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Deep Dive Ideology Dossier Inspector (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Party Dossier Inspector */}
          {mode === 'parties' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0"
                    style={{ backgroundColor: selectedParty.color }}
                  >
                    {selectedParty.avatarText}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-lg leading-snug">
                      {selectedParty.name}
                    </h3>
                    <span className="text-xs text-slate-500 font-medium block">
                      Leader: {selectedParty.leader} ({selectedParty.leaderTitle})
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 shrink-0">
                  {selectedParty.seats} MPs
                </span>
              </div>

              {/* Coordinates & Quadrant Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Spectrum Position
                  </span>
                  <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    {selectedParty.compass?.quadrant || 'Ideological Quadrant'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Economic Score</span>
                    <span className="text-base font-black text-slate-900">
                      {selectedParty.compass && selectedParty.compass.economicScore > 0 ? `+${selectedParty.compass.economicScore}` : selectedParty.compass?.economicScore} / 10
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {selectedParty.compass && selectedParty.compass.economicScore < 0 ? 'Left-wing / Public State' : 'Right-wing / Market-first'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200">
                    <span className="text-[10px] text-slate-500 block">Social / Governance</span>
                    <span className="text-base font-black text-slate-900">
                      {selectedParty.compass && selectedParty.compass.socialScore > 0 ? `+${selectedParty.compass.socialScore}` : selectedParty.compass?.socialScore} / 10
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {selectedParty.compass && selectedParty.compass.socialScore < 0 ? 'Civil Libertarian' : 'Authoritarian / Traditional'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Ideological Summary & Rationale */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center space-x-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Ideological Blueprint & 2026 Rationale</span>
                </h4>
                <p className="text-xs text-slate-700 leading-relaxed font-medium bg-slate-50/60 p-3 rounded-xl border border-slate-100">
                  {selectedParty.compass?.rationale}
                </p>
              </div>

              {/* Party Motto & Description */}
              <div className="text-xs text-slate-500 border-t border-slate-100 pt-3">
                <span className="italic block text-slate-600 font-medium mb-1">
                  "{selectedParty.motto}"
                </span>
                <p className="line-clamp-3 text-[11px] leading-relaxed">
                  {selectedParty.description}
                </p>
              </div>
            </div>
          )}

          {/* Policy Dossier Inspector */}
          {mode === 'policies' && (
            <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {selectedPolicy.category.toUpperCase()}
                  </span>
                  <h3 className="font-extrabold text-slate-900 text-lg leading-snug mt-1.5">
                    {selectedPolicy.title}
                  </h3>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Policy Coordinates:</span>
                  <span className="font-extrabold text-slate-900">
                    Economic: {selectedPolicy.compass?.economic} • Social: {selectedPolicy.compass?.social}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Ideological Sector:</span>
                  <span className="font-extrabold text-indigo-700 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {selectedPolicy.compass?.quadrant}
                  </span>
                </div>
                <p className="text-xs text-slate-600 mt-2 leading-relaxed">
                  {selectedPolicy.compass?.summary}
                </p>
              </div>

              {/* Official Benchmark */}
              {selectedPolicy.officialFigureBenchmark && (
                <div className="bg-emerald-50/60 border border-emerald-200/80 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">
                    {selectedPolicy.officialFigureBenchmark.label}
                  </span>
                  <span className="text-xs font-bold text-emerald-950 block">
                    {selectedPolicy.officialFigureBenchmark.value}
                  </span>
                  <span className="text-[10px] text-emerald-700 block">
                    Source: {selectedPolicy.officialFigureBenchmark.source}
                  </span>
                </div>
              )}

              {/* Public Opinion */}
              {selectedPolicy.publicOpinionQuestion && (
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Public Sentiment Benchmark</span>
                  <p className="text-slate-700 font-medium italic text-[11px]">
                    "{selectedPolicy.publicOpinionQuestion}"
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-xs font-extrabold text-rose-700">
                      {selectedPolicy.publicOpinionSupportOverall}% Public Support
                    </span>
                    <div className="flex-1 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-rose-600 h-full rounded-full" 
                        style={{ width: `${selectedPolicy.publicOpinionSupportOverall}%` }} 
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Ideological Distance & Head-to-Head Comparison Calculator */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-5 border border-slate-700 shadow-xs space-y-4">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
              <Scale className="w-4 h-4" />
              <span>Party Ideological Proximity Index</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Party A:</label>
                <select
                  value={comparePartyA}
                  onChange={(e) => setComparePartyA(e.target.value as PartyId)}
                  className="w-full bg-slate-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden cursor-pointer"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] text-slate-400 block mb-1">Party B:</label>
                <select
                  value={comparePartyB}
                  onChange={(e) => setComparePartyB(e.target.value as PartyId)}
                  className="w-full bg-slate-800 text-white text-xs font-bold px-2.5 py-1.5 rounded-lg border border-slate-700 focus:outline-hidden cursor-pointer"
                >
                  {parties.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Distance Score Metric */}
            <div className="bg-white/10 rounded-xl p-3 flex items-center justify-between border border-white/10">
              <div>
                <span className="text-[10px] text-slate-300 block uppercase font-bold tracking-wider">
                  Spectrum Distance Score
                </span>
                <span className="text-xl font-black text-rose-400">
                  {ideologicalDistance} <span className="text-xs text-slate-400 font-normal">/ 28.3 max</span>
                </span>
              </div>
              <span className="text-xs px-2.5 py-1 rounded-lg bg-white/15 font-bold text-slate-200">
                {ideologicalDistance < 4 ? 'Very Close / Allied' : ideologicalDistance < 8 ? 'Moderate Divergence' : ideologicalDistance < 13 ? 'Significant Battleground' : 'Polar Opposites'}
              </span>
            </div>

            <p className="text-[11px] text-slate-300 leading-relaxed">
              Calculates Euclidean vector distance in political space: sqrt(deltaEcon^2 + deltaSoc^2). Comparing <strong>{partyA.shortName}</strong> ({partyA.compass?.economicScore}, {partyA.compass?.socialScore}) against <strong>{partyB.shortName}</strong> ({partyB.compass?.economicScore}, {partyB.compass?.socialScore}).
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
