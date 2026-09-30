import React, { useState } from 'react';
import { Party, PartyId, FactCheckItem, PolicyCategory } from '../types/politics';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Info, 
  ExternalLink, 
  Search,
  Filter,
  ShieldCheck
} from 'lucide-react';
import { SectionRefreshButton } from './SectionRefreshButton';

interface FactCheckDirectoryProps {
  parties: Party[];
  factChecks: FactCheckItem[];
  onRefreshFactChecks?: () => Promise<void> | void;
}

export const FactCheckDirectory: React.FC<FactCheckDirectoryProps> = ({
  parties,
  factChecks,
  onRefreshFactChecks,
}) => {
  const [selectedVerdict, setSelectedVerdict] = useState<string>('all');
  const [selectedParty, setSelectedParty] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredChecks = factChecks.filter((fc) => {
    const matchesVerdict = selectedVerdict === 'all' || fc.verdict.toLowerCase() === selectedVerdict.toLowerCase();
    const matchesParty = selectedParty === 'all' || fc.partyId === selectedParty;
    const matchesSearch = 
      searchQuery.trim() === '' ||
      fc.claim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fc.speaker.toLowerCase().includes(searchQuery.toLowerCase()) ||
      fc.explanation.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesVerdict && matchesParty && matchesSearch;
  });

  const getVerdictStyle = (verdict: string) => {
    switch (verdict.toLowerCase()) {
      case 'accurate':
        return {
          bg: 'bg-emerald-50 border-emerald-200 text-emerald-800',
          badge: 'bg-emerald-600 text-white',
          icon: CheckCircle2,
        };
      case 'false':
        return {
          bg: 'bg-rose-50 border-rose-200 text-rose-800',
          badge: 'bg-rose-600 text-white',
          icon: XCircle,
        };
      case 'misleading':
      case 'disputed':
        return {
          bg: 'bg-amber-50 border-amber-200 text-amber-800',
          badge: 'bg-amber-600 text-white',
          icon: AlertTriangle,
        };
      case 'needs context':
      default:
        return {
          bg: 'bg-blue-50 border-blue-200 text-blue-800',
          badge: 'bg-blue-600 text-white',
          icon: Info,
        };
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Independent Verification & Scrutiny</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Political Claims Fact-Checker
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Independent, non-partisan assessments of statements made by party leaders, based on findings from Full Fact, the Institute for Fiscal Studies (IFS), and the UK Statistics Authority.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2 shrink-0">
          <SectionRefreshButton
            sectionName="Fact Checks"
            defaultDate="September 2026 Audit"
            onRefresh={onRefreshFactChecks}
          />
          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
            <span className="font-semibold text-slate-700">Standards:</span>
            <span>Full Fact • IFS • ONS</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Verdict filter chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 scrollbar-none">
          {['all', 'accurate', 'misleading', 'disputed', 'needs context', 'false'].map((verdict) => (
            <button
              key={verdict}
              onClick={() => setSelectedVerdict(verdict)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all ${
                selectedVerdict === verdict
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {verdict}
            </button>
          ))}
        </div>

        {/* Search & Party Filter */}
        <div className="flex items-center space-x-2">
          <select
            value={selectedParty}
            onChange={(e) => setSelectedParty(e.target.value)}
            className="text-xs sm:text-sm bg-white border border-slate-200 rounded-xl px-3 py-1.5 focus:outline-hidden focus:ring-2 focus:ring-slate-900 text-slate-700"
          >
            <option value="all">All Parties</option>
            {parties.map((p) => (
              <option key={p.id} value={p.id}>{p.shortName}</option>
            ))}
          </select>

          <div className="relative min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search claims..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs sm:text-sm bg-white border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
          </div>
        </div>
      </div>

      {/* List of Fact Checks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredChecks.map((fc) => {
          const party = parties.find((p) => p.id === fc.partyId);
          const style = getVerdictStyle(fc.verdict);
          const Icon = style.icon;

          return (
            <div
              key={fc.id}
              className={`rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all bg-white hover:shadow-md`}
            >
              <div>
                {/* Header: Party, Speaker, Date */}
                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    {party && (
                      <span
                        className="px-2 py-0.5 rounded text-[11px] font-bold text-white shadow-xs"
                        style={{ backgroundColor: party.color }}
                      >
                        {party.shortName}
                      </span>
                    )}
                    <span className="text-xs font-bold text-slate-800">{fc.speaker}</span>
                  </div>

                  <span className="text-[11px] text-slate-400">{fc.date}</span>
                </div>

                {/* The Claim */}
                <div className="mb-4">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Claim Under Scrutiny:
                  </span>
                  <blockquote className="text-sm font-semibold text-slate-900 italic border-l-2 border-slate-300 pl-3 py-0.5">
                    "{fc.claim}"
                  </blockquote>
                </div>

                {/* Verdict Badge */}
                <div className="mb-3">
                  <span className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${style.badge}`}>
                    <Icon className="w-3.5 h-3.5" />
                    <span>Verdict: {fc.verdict}</span>
                  </span>
                </div>

                {/* Detailed Explanation */}
                <div className="text-xs text-slate-600 leading-relaxed space-y-1">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">
                    Factual Analysis:
                  </span>
                  <p>{fc.explanation}</p>
                </div>
              </div>

              {/* Source & Link */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Fact-checked by:</span>
                <a
                  href={fc.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
                >
                  <span>{fc.source}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
