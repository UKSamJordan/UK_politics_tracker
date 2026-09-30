import React, { useState } from 'react';
import { Party, PartyId, PolicyTopic, PolicyCategory } from '../types/politics';
import { 
  Shield, 
  TrendingUp, 
  HeartPulse, 
  Plane, 
  Zap, 
  Home, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { SectionRefreshButton } from './SectionRefreshButton';

interface PolicyMatrixProps {
  parties: Party[];
  selectedParties: PartyId[];
  policies: PolicyTopic[];
  onRefreshPolicies?: () => Promise<void> | void;
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

  const categories = [
    { id: 'all', label: 'All Policy Areas', icon: null },
    { id: 'defence', label: 'Defence & Military', icon: Shield },
    { id: 'economy', label: 'Economy & Tax', icon: TrendingUp },
    { id: 'nhs', label: 'NHS & Healthcare', icon: HeartPulse },
    { id: 'immigration', label: 'Immigration & Borders', icon: Plane },
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

  return (
    <div className="space-y-6">
      {/* Header with Live Refresh */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Compare Party Policies & Manifestos</h2>
          <p className="text-xs text-slate-500">Cross-reference verified pledges, cost estimates, and independent fact checks</p>
        </div>
        <SectionRefreshButton
          sectionName="Policy Matrix"
          defaultDate="September 2026 Party Conferences"
          onRefresh={onRefreshPolicies}
        />
      </div>

      {/* Category Pills & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Category horizontal scroll */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 md:pb-0 scrollbar-none">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${
                  isSelected
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
              >
                {Icon && <Icon className="w-3.5 h-3.5" />}
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative min-w-[240px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search policies (e.g. NATO, VAT, 2.5%, NHS)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900"
          />
        </div>
      </div>

      {/* No parties warning */}
      {activeParties.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 text-center text-amber-800 text-sm">
          Please select at least one party above to view and compare policies.
        </div>
      )}

      {/* Policy Topics Accordion / Sections */}
      <div className="space-y-6">
        {filteredPolicies.map((topic) => {
          const isExpanded = expandedTopic === topic.id || expandedTopic === null;

          return (
            <div
              key={topic.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition-all"
            >
              {/* Topic Header Banner */}
              <div 
                onClick={() => setExpandedTopic(expandedTopic === topic.id ? 'collapsed' : topic.id)}
                className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 to-white border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-slate-100/50"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded">
                      {topic.category}
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900">
                      {topic.title}
                    </h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-3xl">
                    {topic.description}
                  </p>
                </div>

                <div className="flex items-center space-x-3">
                  {topic.officialFigureBenchmark && (
                    <div className="hidden md:flex flex-col text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {topic.officialFigureBenchmark.label}
                      </span>
                      <span className="text-xs font-bold text-slate-800">
                        {topic.officialFigureBenchmark.value}
                      </span>
                    </div>
                  )}
                  <button className="text-slate-400 hover:text-slate-600 p-1">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Official Benchmark for Mobile */}
              {topic.officialFigureBenchmark && (
                <div className="md:hidden px-4 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">{topic.officialFigureBenchmark.label}:</span>
                  <span className="font-bold text-slate-800">{topic.officialFigureBenchmark.value}</span>
                </div>
              )}

              {/* Public Opinion Bar */}
              {topic.publicOpinionQuestion && (
                <div className="px-4 sm:px-5 py-2.5 bg-sky-50/70 border-b border-sky-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                  <div className="flex items-center space-x-2 text-sky-950 font-medium">
                    <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />
                    <span>Public Opinion: <i>"{topic.publicOpinionQuestion}"</i></span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    <div className="w-24 sm:w-32 bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div 
                        className="bg-sky-600 h-2 rounded-full" 
                        style={{ width: `${topic.publicOpinionSupportOverall || 50}%` }}
                      />
                    </div>
                    <span className="font-bold text-sky-900">
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
                } divide-y md:divide-y-0 md:divide-x divide-slate-100`}>
                  {activeParties.map((party) => {
                    const pledge = topic.pledges[party.id];
                    if (!pledge) return null;

                    return (
                      <div key={party.id} className="p-4 sm:p-5 flex flex-col justify-between space-y-4">
                        <div>
                          {/* Party Badge & Leader */}
                          <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                            <div className="flex items-center space-x-2">
                              <span
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: party.color }}
                              />
                              <span className="font-bold text-sm text-slate-900">
                                {party.shortName}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500 font-medium">
                              {party.leader}
                            </span>
                          </div>

                          {/* Headline */}
                          <h4 className="font-bold text-sm sm:text-base text-slate-900 mb-2 leading-snug">
                            {pledge.headline}
                          </h4>

                          {/* Summary */}
                          <p className="text-xs text-slate-600 leading-relaxed mb-3">
                            {pledge.summary}
                          </p>

                          {/* Key Points Bullet List */}
                          <div className="space-y-1.5 mb-4">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Core Manifesto Pledges:
                            </span>
                            <ul className="space-y-1">
                              {pledge.keyPoints.map((point, i) => (
                                <li key={i} className="text-xs text-slate-700 flex items-start space-x-1.5">
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

                        {/* Bottom Metadata: Cost, Timeline, Fact Check */}
                        <div className="pt-3 border-t border-slate-100 space-y-2">
                          {pledge.costEstimate && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-medium">Estimated Cost:</span>
                              <span className="font-semibold text-slate-700 text-right">{pledge.costEstimate}</span>
                            </div>
                          )}

                          {pledge.targetTimeline && (
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-slate-400 font-medium">Timeline:</span>
                              <span className="font-semibold text-slate-700">{pledge.targetTimeline}</span>
                            </div>
                          )}

                          {/* Fact Check Callout */}
                          {pledge.factCheckSnippet && (
                            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 mt-2 space-y-1.5">
                              <div className="flex items-center justify-between">
                                {getVerdictBadge(pledge.factCheckVerdict)}
                                <span className="text-[10px] text-slate-400">{pledge.factCheckSource}</span>
                              </div>
                              <p className="text-[11px] text-slate-600 italic">
                                "{pledge.factCheckSnippet}"
                              </p>
                            </div>
                          )}
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
