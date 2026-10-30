import React, { useState, useEffect } from 'react';
import { Party, PartyId, CabinetMember, LeaderRating } from '../types/politics';
import { 
  Users, 
  Award, 
  Shield, 
  Briefcase, 
  Landmark, 
  HeartPulse, 
  UserCheck, 
  BarChart3, 
  ShieldCheck, 
  Sparkles,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  RefreshCw
} from 'lucide-react';
import { SectionRefreshButton } from './SectionRefreshButton';
import { CabinetChangeReport, fetchPersonIntelligence } from '../services/liveUpdater';

interface BriefingItem {
  summaryText: string;
  timestamp: string;
  source: string;
}

const BRIEFINGS_STORAGE_KEY = 'uk_politics_person_briefings_v2';

interface CabinetExplorerProps {
  parties: Party[];
  cabinetMembers: CabinetMember[];
  leaderRatings?: LeaderRating[];
  initialPartyId?: PartyId;
  onNavigateToPolls?: (partyId?: PartyId, subTab?: 'voting' | 'leaders' | 'bestpm' | 'policies') => void;
  onRefreshRoster?: () => Promise<CabinetChangeReport | void> | void;
  onOpenSystemHealthModal?: () => void;
}

export const CabinetExplorer: React.FC<CabinetExplorerProps> = ({
  parties,
  cabinetMembers,
  leaderRatings = [],
  initialPartyId,
  onNavigateToPolls,
  onRefreshRoster,
  onOpenSystemHealthModal,
}) => {
  const [selectedPartyId, setSelectedPartyId] = useState<PartyId>(initialPartyId || 'labour');

  useEffect(() => {
    if (initialPartyId) {
      setSelectedPartyId(initialPartyId);
    }
  }, [initialPartyId]);
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [lastChangeReport, setLastChangeReport] = useState<CabinetChangeReport | null>(null);
  const [showReportDetails, setShowReportDetails] = useState(false);

  // Gemini Person Intelligence Briefings
  const [memberBriefings, setMemberBriefings] = useState<Record<string, BriefingItem>>(() => {
    try {
      const saved = localStorage.getItem(BRIEFINGS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [loadingMemberId, setLoadingMemberId] = useState<string | null>(null);
  const [expandedBriefingId, setExpandedBriefingId] = useState<string | null>(null);
  const [briefingError, setBriefingError] = useState<string | null>(null);

  const selectedParty = parties.find((p) => p.id === selectedPartyId) || parties[0];
  const partyLeaderRating = leaderRatings.find((l) => l.partyId === selectedPartyId);

  const handleFetchBriefing = async (member: CabinetMember, forceRefresh: boolean = false) => {
    if (expandedBriefingId === member.id && !forceRefresh) {
      setExpandedBriefingId(null);
      return;
    }

    if (memberBriefings[member.id] && !forceRefresh) {
      setExpandedBriefingId(member.id);
      return;
    }

    setLoadingMemberId(member.id);
    setExpandedBriefingId(member.id);
    setBriefingError(null);

    try {
      const result = await fetchPersonIntelligence(
        member.name,
        member.role,
        selectedParty.name,
        member.constituency
      );

      const updated = {
        ...memberBriefings,
        [member.id]: {
          summaryText: result.summaryText,
          timestamp: result.timestamp,
          source: result.source,
        },
      };

      setMemberBriefings(updated);
      localStorage.setItem(BRIEFINGS_STORAGE_KEY, JSON.stringify(updated));
    } catch (err: any) {
      console.error('Failed to fetch person briefing:', err);
      setBriefingError(`Could not generate intelligence dossier: ${err.message || 'Network error'}`);
    } finally {
      setLoadingMemberId(null);
    }
  };

  const renderDossierContent = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) return <div key={idx} className="h-1.5" />;
      if (trimmed.startsWith('###') || (trimmed.startsWith('**') && trimmed.endsWith('**'))) {
        return (
          <h5 key={idx} className="text-xs font-bold text-amber-300 mt-2 mb-1">
            {trimmed.replace(/^#+\s*/, '').replace(/^\*\*|\*\*$/g, '')}
          </h5>
        );
      }
      if (trimmed.startsWith('* ') || trimmed.startsWith('- ') || trimmed.startsWith('• ')) {
        const bulletText = trimmed.replace(/^[\*\-•]\s*/, '');
        return (
          <div key={idx} className="flex items-start space-x-1.5 text-xs text-slate-200 pl-1">
            <span className="text-rose-400 mt-0.5">•</span>
            <span>{bulletText}</span>
          </div>
        );
      }
      if (trimmed.startsWith('>')) {
        return (
          <blockquote key={idx} className="border-l-2 border-indigo-400 pl-2.5 my-1.5 text-xs italic text-indigo-100/90 bg-white/5 py-1 rounded-r">
            {trimmed.replace(/^>\s*/, '')}
          </blockquote>
        );
      }
      return (
        <p key={idx} className="text-xs text-slate-300">
          {trimmed}
        </p>
      );
    });
  };

  const filteredMembers = cabinetMembers.filter((m) => {
    const matchesParty = m.partyId === selectedPartyId;
    const roleLower = m.role.toLowerCase();
    const filterLower = roleFilter.toLowerCase();
    let matchesRole = roleFilter === 'all' || roleLower.includes(filterLower);
    if (!matchesRole) {
      if (filterLower === 'leader') {
        matchesRole = Boolean(m.isLeader) || roleLower.includes('prime minister') || roleLower.includes('first secretary') || roleLower.includes('deputy leader');
      } else if (filterLower === 'chancellor') {
        matchesRole = roleLower.includes('treasury') || roleLower.includes('economy') || roleLower.includes('finance');
      } else if (filterLower === 'work & pensions') {
        matchesRole = roleLower.includes('work') || roleLower.includes('pension') || roleLower.includes('welfare');
      } else if (filterLower === 'business & trade') {
        matchesRole = roleLower.includes('business') || roleLower.includes('trade') || roleLower.includes('enterprise');
      }
    }
    return matchesParty && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    const lower = role.toLowerCase();
    if (lower.includes('prime minister') || lower.includes('leader')) return Landmark;
    if (lower.includes('chancellor') || lower.includes('treasury')) return Briefcase;
    if (lower.includes('defence') || lower.includes('military')) return Shield;
    if (lower.includes('health') || lower.includes('social care')) return HeartPulse;
    if (lower.includes('education') || lower.includes('schools')) return GraduationCap;
    return Users;
  };

  // Party member counts
  const memberCounts = parties.reduce<Record<string, number>>((acc, p) => {
    acc[p.id] = cabinetMembers.filter((m) => m.partyId === p.id).length;
    return acc;
  }, {});

  const handleRefreshWithDiff = async () => {
    if (onRefreshRoster) {
      const report = await onRefreshRoster();
      if (report && typeof report === 'object' && 'hasChanges' in report) {
        setLastChangeReport(report as CabinetChangeReport);
        setShowReportDetails(true);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 dark:text-rose-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Parliamentary Teams & Frontbench</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Cabinet & Shadow Cabinet Profiles
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Explore active UK political decision-makers: ministerial portfolios, official appointment dates, parliamentary constituencies, signature philosophies, and leadership approval ratings.
          </p>
        </div>

        {/* Universal Roster Integrity Strip */}
        <div className="p-3 bg-slate-50 dark:bg-slate-850 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/60 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3 max-w-full min-w-0">
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="font-bold text-slate-800 dark:text-slate-200">
              Universal Frontbench Integrity:
            </span>
            <span className="text-slate-600 dark:text-slate-400">
              {cabinetMembers.length} verified frontbench records across all 8 parties
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto max-w-full">
            {parties.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPartyId(p.id)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedPartyId === p.id
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {p.shortName} ({memberCounts[p.id] || 0})
              </button>
            ))}
            {onOpenSystemHealthModal && (
              <button
                onClick={onOpenSystemHealthModal}
                className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-200 dark:hover:bg-emerald-900 border border-emerald-300 dark:border-emerald-800 transition-colors ml-1 cursor-pointer"
              >
                System Audit
              </button>
            )}
          </div>
        </div>

        {/* Change Detection Report Banner (Shows when update is pressed) */}
        {lastChangeReport && (
          <div className={`p-4 rounded-xl border transition-all animate-fade-in ${
            lastChangeReport.hasChanges
              ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-950 dark:text-amber-200'
              : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-950 dark:text-emerald-200'
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
                    Change Identification Engine ({lastChangeReport.timestamp})
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
              <div className="mt-3 pt-3 border-t border-amber-200 dark:border-amber-800 space-y-1.5 text-xs">
                {lastChangeReport.changes.map((c, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600 dark:bg-amber-400" />
                    <strong>{c.personName}</strong>: <span>{c.details}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 w-full min-w-0">
          <SectionRefreshButton
            sectionName="Cabinet Roster"
            defaultDate="October 2026 • Verified Public Record"
            onRefresh={handleRefreshWithDiff}
            className="w-full sm:w-auto"
          />

          {/* Quick Role Filter */}
          <div className="flex items-center space-x-1.5 self-stretch sm:self-auto bg-slate-50 dark:bg-slate-800/80 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 overflow-x-auto max-w-full scrollbar-none min-w-0">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 pl-2 shrink-0">Portfolio:</span>
            {[
              'all',
              'leader',
              'chancellor',
              'foreign',
              'home',
              'defence',
              'health',
              'justice',
              'education',
              'work & pensions',
              'business & trade',
              'housing',
              'energy',
              'transport',
              'environment',
              'culture',
            ].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize whitespace-nowrap shrink-0 transition-all cursor-pointer ${
                  roleFilter === role
                    ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Party Switcher Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none max-w-full min-w-0">
        {parties.map((p) => {
          const isSelected = p.id === selectedPartyId;
          const count = memberCounts[p.id] || 0;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPartyId(p.id)}
              style={{
                backgroundColor: isSelected ? p.color : undefined,
                borderColor: p.color,
                color: isSelected ? p.textColor : undefined,
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border shadow-xs cursor-pointer ${
                isSelected 
                  ? 'ring-2 ring-offset-1 dark:ring-offset-slate-950' 
                  : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: isSelected ? p.textColor : p.color }}
              />
              <span>
                {p.shortName}{' '}
                <span className="opacity-80 font-normal">({count})</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Party Information Banner */}
      <div 
        className="p-4 sm:p-5 rounded-2xl border text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4 max-w-full min-w-0 overflow-hidden"
        style={{ backgroundColor: selectedParty.color }}
      >
        <div>
          <span className="text-xs uppercase tracking-wider font-semibold opacity-85">
            {selectedParty.orientation} • Founded {selectedParty.founded}
          </span>
          <h3 className="text-xl sm:text-2xl font-black mt-0.5">{selectedParty.name}</h3>
          <p className="text-xs sm:text-sm opacity-95 max-w-2xl mt-1 leading-relaxed">
            {selectedParty.description}
          </p>
        </div>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {partyLeaderRating && (
            <div 
              onClick={() => onNavigateToPolls && onNavigateToPolls(selectedPartyId, 'leaders')}
              className={`bg-black/25 p-3 rounded-xl backdrop-blur-xs text-left ${onNavigateToPolls ? 'cursor-pointer hover:bg-black/35 transition-colors border border-white/10' : ''}`}
              title="Click to view detailed multi-pollster leader approval ratings"
            >
              <span className="text-[10px] block opacity-80 uppercase font-semibold flex items-center justify-between">
                <span>Leader Personal Approval</span>
                {onNavigateToPolls && <span className="text-[9px] underline opacity-90">Compare ↗</span>}
              </span>
              <span className="text-lg font-black block">
                {partyLeaderRating.netRating >= 0 ? `+${partyLeaderRating.netRating}` : partyLeaderRating.netRating} Net
              </span>
              <span className="text-[10px] block opacity-80">
                {partyLeaderRating.approvePct}% App / {partyLeaderRating.disapprovePct}% Dis
              </span>
            </div>
          )}
          <div className="text-left md:text-right shrink-0 bg-black/15 p-3 rounded-xl backdrop-blur-xs">
            <span className="text-[11px] block opacity-80 uppercase font-semibold">House of Commons</span>
            <span className="text-2xl font-black">{selectedParty.seats} MPs</span>
            <span className="text-[10px] block opacity-75 mt-0.5">
              Verified: {selectedParty.seatsLastVerified || 'October 2026'}
            </span>
            <span className="text-[11px] block opacity-85 mt-0.5">Leader: {selectedParty.leader}</span>
          </div>
        </div>
      </div>

      {/* Contextual Explainer Banners per Party */}
      {selectedPartyId === 'labour' && (
        <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-950 dark:text-rose-200 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-900/50 flex items-center justify-center text-rose-800 dark:text-rose-300 shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-rose-900 dark:text-rose-200 block text-sm">
                His Majesty's Government — Full 25-Member Cabinet Roster (Burnham Ministry, July 2026)
              </span>
              <p className="text-rose-700 dark:text-rose-300 mt-0.5">
                Complete Cabinet and Cabinet-attending roster across every Whitehall department following the July 2026 transition: Prime Minister <strong>Andy Burnham</strong>, First Secretary <strong>Louise Haigh</strong>, Chancellor <strong>John Healey</strong>, Foreign Secretary <strong>Ed Miliband</strong>, Home Secretary <strong>Shabana Mahmood</strong>, Defence Secretary <strong>Wes Streeting</strong>, Health Secretary <strong>Yvette Cooper</strong>, Lord Chancellor <strong>Alex Norris</strong>, plus all 17 departmental & parliamentary Cabinet posts.
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-rose-200/70 dark:bg-rose-900/60 text-rose-900 dark:text-rose-200 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            25 Cabinet Posts
          </span>
        </div>
      )}

      {selectedPartyId === 'conservative' && (
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950 dark:text-blue-200 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center text-blue-800 dark:text-blue-300 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-blue-900 dark:text-blue-200 block text-sm">
                His Majesty's Official Opposition — Full 25-Member Shadow Cabinet (Kemi Badenoch)
              </span>
              <p className="text-blue-700 dark:text-blue-300 mt-0.5">
                Complete 25-member Shadow Cabinet updated for the 2026 reshuffle: Leader <strong>Kemi Badenoch</strong>, Deputy Leader <strong>Alex Burghart</strong>, Shadow Chancellor <strong>Andrew Griffith</strong>, Shadow Foreign Secretary <strong>Tom Tugendhat</strong>, Shadow Home Secretary <strong>Chris Philp</strong>, Shadow Defence Secretary <strong>James Cartlidge</strong>, Shadow Health Secretary <strong>Damian Hinds</strong>, and Shadow Justice Secretary <strong>Nick Timothy</strong>.
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-blue-200/70 dark:bg-blue-900/60 text-blue-900 dark:text-blue-200 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            25 Shadow Posts
          </span>
        </div>
      )}

      {selectedPartyId === 'reform' && (
        <div className="bg-cyan-50 dark:bg-cyan-950/30 border border-cyan-200 dark:border-cyan-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-cyan-950 dark:text-cyan-200 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 dark:bg-cyan-900/50 flex items-center justify-center text-cyan-800 dark:text-cyan-300 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-cyan-900 dark:text-cyan-200 block text-sm">
                Official Reform UK "Shadow Cabinet" (Announced Feb 17, 2026)
              </span>
              <p className="text-cyan-700 dark:text-cyan-300 mt-0.5">
                8 verified members. Nigel Farage formed Reform's first official frontbench team in February 2026 to prepare for government, featuring defectors <strong>Robert Jenrick</strong> (Shadow Chancellor) and <strong>Suella Braverman</strong> (Shadow Education), alongside <strong>Zia Yusuf</strong> (Shadow Home Secretary) and <strong>Richard Tice</strong> (Shadow Business & Energy).
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-cyan-200/70 dark:bg-cyan-900/60 text-cyan-900 dark:text-cyan-200 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            February 2026 Team
          </span>
        </div>
      )}

      {selectedPartyId === 'libdem' && (
        <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 dark:text-amber-200 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center text-amber-800 dark:text-amber-300 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-900 dark:text-amber-200 block text-sm">
                Liberal Democrats Full Parliamentary Frontbench (16 Spokespersons • 72 MPs)
              </span>
              <p className="text-amber-700 dark:text-amber-300 mt-0.5">
                Complete 16-member frontbench team led by <strong>Sir Ed Davey</strong> and Deputy Leader <strong>Daisy Cooper</strong> (Treasury), covering Health (<strong>Helen Morgan</strong>), Foreign Affairs (<strong>Calum Miller</strong>), Home (<strong>Lisa Smart</strong>), Justice (<strong>Jess Brown-Fuller</strong>), Education (<strong>Munira Wilson</strong>), Work & Pensions (<strong>Steve Darling</strong>), Business (<strong>Sarah Olney</strong>), Housing (<strong>Gideon Amos</strong>), Energy (<strong>Pippa Heylings</strong>), Transport (<strong>Olly Glover</strong>), and Environment (<strong>Tim Farron</strong>).
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-amber-200/70 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            16 Frontbench Posts
          </span>
        </div>
      )}

      {selectedPartyId === 'green' && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 dark:text-emerald-200 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-800 dark:text-emerald-300 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-emerald-900 dark:text-emerald-200 block text-sm">
                Green Party Leadership & Parliamentary Team (7 Verified Figures)
              </span>
              <p className="text-emerald-700 dark:text-emerald-300 mt-0.5">
                Full verified leadership roster: <strong>Zack Polanski</strong> (Party Leader, elected September 2025) and <strong>Carla Denyer</strong> (Parliamentary Leader & MP for Bristol Central), alongside <strong>Adrian Ramsay</strong> (MP for Waveney Valley), <strong>Ellie Chowns</strong> (MP for North Herefordshire), <strong>Siân Berry</strong> (MP for Brighton Pavilion), and Deputy Leaders <strong>Mothin Ali</strong> & <strong>Rachel Millward</strong> (elected August 2025).
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-emerald-200/70 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            September 2025 Leadership
          </span>
        </div>
      )}

      {selectedPartyId === 'snp' && (
        <div className="bg-yellow-50 dark:bg-yellow-950/30 border border-yellow-200 dark:border-yellow-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-yellow-950 dark:text-yellow-200 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center text-yellow-800 dark:text-yellow-300 shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-yellow-900 dark:text-yellow-200 block text-sm">
                SNP Parliamentary & Scottish Government Leadership (6 Frontbenchers)
              </span>
              <p className="text-yellow-700 dark:text-yellow-300 mt-0.5">
                Party Leader & First Minister <strong>John Swinney</strong>, Westminster Group Leader <strong>Stephen Flynn</strong>, Deputy Westminster Leader <strong>Pete Wishart</strong> (Home & Constitution), Chief Whip <strong>Kirsty Blackman</strong> (Economy & Pensions), <strong>Dave Doogan</strong> (Defence & Energy), and <strong>Brendan O'Hara</strong> (Foreign Affairs & Justice).
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-yellow-200/70 dark:bg-yellow-900/60 text-yellow-900 dark:text-yellow-200 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            6 Frontbench Posts
          </span>
        </div>
      )}

      {selectedPartyId === 'plaid' && (
        <div className="bg-teal-50 dark:bg-teal-950/30 border border-teal-200 dark:border-teal-900/60 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-950 dark:text-teal-200 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 dark:bg-teal-900/50 flex items-center justify-center text-teal-800 dark:text-teal-300 shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-teal-900 dark:text-teal-200 block text-sm">
                Plaid Cymru Parliamentary & Senedd Frontbench
              </span>
              <p className="text-teal-700 dark:text-teal-300 mt-0.5">
                Full representation: Senedd Leader <strong>Rhun ap Iorwerth</strong> (June 2023), Westminster Group Leader <strong>Liz Saville Roberts</strong> (June 2017 / July 2024), Treasury Spokesperson <strong>Ben Lake</strong> (July 2024), Agriculture Spokesperson <strong>Ann Davies</strong> (July 2024), and Health Spokesperson <strong>Llinos Medi</strong> (July 2024).
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-teal-200/70 dark:bg-teal-900/60 text-teal-900 dark:text-teal-200 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            July 2024 Frontbench
          </span>
        </div>
      )}

      {/* CUE 1 (Mobile): Interactive Minister Quick-Jump Strip & Swipe Indicator */}
      {filteredMembers.length > 1 && (
        <div className="md:hidden bg-slate-900/90 border border-slate-700 rounded-xl p-2.5 space-y-2 shadow-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-300 px-0.5">
            <span className="flex items-center space-x-1.5">
              <span>👆 Tap a frontbencher or swipe sideways</span>
              <span className="text-indigo-400 font-extrabold">↔</span>
            </span>
            <span
              className="text-[10px] font-extrabold px-2 py-0.5 rounded-md border"
              style={{
                backgroundColor: `${selectedParty.color}25`,
                borderColor: `${selectedParty.color}70`,
                color: '#f8fafc',
              }}
            >
              {filteredMembers.length} {selectedParty.shortName} Figures
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none pb-0.5">
            {filteredMembers.map((m, idx) => (
              <button
                key={m.id}
                type="button"
                onClick={() => {
                  const el = document.getElementById(`cabinet-card-${m.id}`);
                  el?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
                }}
                style={{ borderColor: selectedParty.color }}
                className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold whitespace-nowrap shrink-0 bg-slate-800 hover:bg-slate-700 text-white border border-l-4 shadow-2xs active:scale-95 transition-transform cursor-pointer"
              >
                <span className="text-[10px] opacity-75">{idx + 1}.</span>
                <span>{m.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* CUE 2: Horizontal Snap Carousel on Mobile (`w-[86%]`), Multi-Column Grid on Desktop */}
      <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 overflow-x-auto md:overflow-visible snap-x snap-mandatory gap-3.5 md:gap-4 pb-3 md:pb-0 -mx-1 px-1 md:mx-0 md:px-0 scrollbar-none w-full max-w-full min-w-0">
        {filteredMembers.map((member, memberIdx) => {
          const Icon = getRoleIcon(member.role);
          const isLeaderCard = member.isLeader;
          const leaderRating = isLeaderCard ? partyLeaderRating : null;
          const is2026 = member.appointedDate && member.appointedDate.includes('2026');
          const briefing = memberBriefings[member.id];
          const hasBriefing = Boolean(briefing);
          const isExpanded = expandedBriefingId === member.id;
          const isLoadingBriefing = loadingMemberId === member.id;
          const prevMember = memberIdx > 0 ? filteredMembers[memberIdx - 1] : null;
          const nextMember = memberIdx < filteredMembers.length - 1 ? filteredMembers[memberIdx + 1] : null;

          return (
            <div
              key={member.id}
              id={`cabinet-card-${member.id}`}
              style={{ borderColor: `${selectedParty.color}65` }}
              className="w-[86%] sm:w-[88%] md:w-auto flex-none snap-start bg-white dark:bg-slate-900 rounded-2xl border-2 shadow-md flex flex-col justify-between hover:shadow-lg transition-shadow relative overflow-hidden min-w-0 max-w-full"
            >
              {/* Bold Party-Coloured Top Banner */}
              <div
                className="px-4 py-2.5 flex items-center justify-between gap-2 border-b border-black/10"
                style={{
                  backgroundColor: selectedParty.color,
                  color: selectedParty.textColor || '#ffffff',
                }}
              >
                <span className="text-[11px] font-extrabold uppercase tracking-wider flex items-center space-x-1.5 truncate">
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{member.isLeader ? `${selectedParty.shortName} Leader` : `${selectedParty.shortName} Frontbench`}</span>
                </span>
                <div className="flex items-center space-x-1.5 shrink-0">
                  {member.constituency && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-black/25 text-white truncate max-w-[130px]">
                      MP: {member.constituency}
                    </span>
                  )}
                  <span className="md:hidden text-[10px] font-black px-2 py-0.5 rounded-full bg-black/30 text-white">
                    {memberIdx + 1}/{filteredMembers.length}
                  </span>
                </div>
              </div>

              <div className="p-4 sm:p-5 flex-1 flex flex-col">
                {/* Name */}
                <h4 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-slate-100 leading-tight">
                  {member.name}
                </h4>

                {/* Specific Portfolio Title */}
                <h5 className="text-xs sm:text-sm font-bold text-indigo-600 dark:text-indigo-300 mt-0.5 mb-2.5">
                  {member.role}
                </h5>

                {/* Appointment Date Badge & Recency Tag */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
                  <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700/80 px-2 py-0.5 rounded-md">
                    <Calendar className="w-3 h-3 text-slate-500 dark:text-slate-400" />
                    <span>In post: <strong className="text-slate-900 dark:text-slate-100">{member.appointedDate || 'Current Parliament'}</strong></span>
                  </span>
                  {is2026 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center space-x-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>2026 Reshuffle</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-50 dark:bg-slate-800/60 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                      Verified Active
                    </span>
                  )}
                </div>

                {/* Leader Approval Rating Badge (if this is the leader) */}
                {leaderRating && (
                  <div className="mb-3.5 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700 dark:text-slate-300">Public Approval Score:</span>
                      <span 
                        className={`font-black px-2 py-0.5 rounded text-xs ${
                          leaderRating.netRating >= 0 ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300'
                        }`}
                      >
                        {leaderRating.netRating >= 0 ? `+${leaderRating.netRating}` : leaderRating.netRating} Net
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden flex mb-1">
                      <div className="bg-emerald-500 h-full" style={{ width: `${leaderRating.approvePct}%` }} />
                      <div className="bg-rose-500 h-full" style={{ width: `${leaderRating.disapprovePct}%` }} />
                      <div className="bg-slate-400 dark:bg-slate-500 h-full" style={{ width: `${leaderRating.dontKnowPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400">
                      <span>{leaderRating.approvePct}% Approve • {leaderRating.disapprovePct}% Disapprove</span>
                      <span>{leaderRating.pollster}</span>
                    </div>
                  </div>
                )}

                {/* Bio */}
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3.5">
                  {member.bio}
                </p>

                {/* Signature Stance */}
                <div className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 block mb-1">
                    Signature Stance & Priorities:
                  </span>
                  <p className="text-xs text-slate-800 dark:text-slate-200 font-medium italic">
                    "{member.keyStance}"
                  </p>
                </div>

                {/* Live Intelligence Dossier */}
                <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleFetchBriefing(member)}
                      disabled={isLoadingBriefing}
                      className={`flex-1 inline-flex items-center justify-center space-x-1.5 py-2 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        isExpanded
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200 dark:shadow-none'
                          : hasBriefing
                          ? 'bg-indigo-50 dark:bg-indigo-950/50 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800'
                          : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-950/40 dark:via-purple-950/40 dark:to-pink-950/40 hover:from-indigo-100 hover:via-purple-100 hover:to-pink-100 dark:hover:from-indigo-900/50 dark:hover:via-purple-900/50 dark:hover:to-pink-900/50 text-indigo-900 dark:text-indigo-200 border border-indigo-200/90 dark:border-indigo-800/80'
                      }`}
                      title={`Scan for most recent updates on ${member.name}'s latest actions, statements, and policy stances`}
                    >
                      {isLoadingBriefing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600 dark:text-indigo-400" />
                          <span>Scanning Recent Record...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className={`w-3.5 h-3.5 ${isExpanded ? 'text-amber-300' : 'text-indigo-600 dark:text-indigo-400'}`} />
                          <span>
                            {hasBriefing 
                              ? (isExpanded ? 'Hide Intelligence Dossier' : '⚡ View Live Intelligence Dossier') 
                              : '⚡ Live Intelligence Report'}
                          </span>
                          {hasBriefing && (
                            isExpanded ? <ChevronUp className="w-3.5 h-3.5 ml-0.5" /> : <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
                          )}
                        </>
                      )}
                    </button>

                    {hasBriefing && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleFetchBriefing(member, true);
                        }}
                        disabled={isLoadingBriefing}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-700 transition-colors cursor-pointer"
                        title="Scan for most recent updates"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBriefing ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Expanded Dossier Box */}
                  {isExpanded && briefing && (
                    <div className="mt-2.5 rounded-xl bg-slate-900 dark:bg-slate-950 text-slate-100 p-3.5 border border-slate-800 dark:border-slate-750 shadow-md animate-fade-in text-xs space-y-2.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2 text-[11px] text-slate-400">
                        <div className="flex items-center space-x-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                          <span className="font-semibold text-slate-200">Live Parliamentary Intelligence</span>
                        </div>
                        <span className="font-mono text-[10px] text-slate-400">
                          {briefing.timestamp}
                        </span>
                      </div>

                      <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 text-slate-200 leading-relaxed font-sans">
                        {renderDossierContent(briefing.summaryText)}
                      </div>

                      <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-400">
                        <span>Grounded in recent UK politics</span>
                        <span className="font-mono text-indigo-400 font-semibold">{briefing.source}</span>
                      </div>
                    </div>
                  )}

                  {briefingError && expandedBriefingId === member.id && (
                    <div className="mt-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-200 text-xs flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">{briefingError}</p>
                        <button
                          onClick={() => handleFetchBriefing(member, true)}
                          className="mt-1 font-bold text-rose-700 dark:text-rose-400 underline cursor-pointer"
                        >
                          Retry Scan
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Verified badge */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400 dark:text-slate-500">
                  <span className="flex items-center space-x-1">
                    <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Frontbench Registered</span>
                  </span>
                  {onNavigateToPolls && isLeaderCard ? (
                    <button 
                      onClick={() => onNavigateToPolls(member.partyId, 'leaders')}
                      className="font-bold text-rose-600 dark:text-rose-400 hover:text-rose-700 dark:hover:text-rose-300 flex items-center space-x-1.5 cursor-pointer bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/50 px-2.5 py-1 rounded-lg transition-colors border border-rose-200/80 dark:border-rose-900/80 shadow-2xs text-[11px]"
                      title={`Compare ${member.name}'s personal approval ratings across YouGov, Ipsos & Savanta`}
                    >
                      <BarChart3 className="w-3.5 h-3.5" />
                      <span>Compare Leader Approval ↗</span>
                    </button>
                  ) : (
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{selectedParty.shortName}</span>
                  )}
                </div>
              </div>

              {/* CUE 3 (Mobile): Explicit Prev / Next Minister Footer Buttons */}
              {filteredMembers.length > 1 && (
                <div className="md:hidden px-3.5 py-2.5 bg-slate-950/60 border-t border-slate-800 flex items-center justify-between gap-2">
                  {prevMember ? (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`cabinet-card-${prevMember.id}`);
                        el?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
                      }}
                      className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-bold border border-slate-700 cursor-pointer active:scale-95 transition-transform"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                      <span className="truncate max-w-[90px]">{prevMember.name.split(' ').slice(-1)[0]}</span>
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500">First Card</span>
                  )}

                  <span className="text-[10px] font-extrabold text-slate-400">
                    Swipe ↔ ({memberIdx + 1}/{filteredMembers.length})
                  </span>

                  {nextMember ? (
                    <button
                      type="button"
                      onClick={() => {
                        const el = document.getElementById(`cabinet-card-${nextMember.id}`);
                        el?.scrollIntoView({ behavior: 'smooth', inline: 'start', block: 'nearest' });
                      }}
                      style={{
                        backgroundColor: selectedParty.color,
                        color: selectedParty.textColor || '#ffffff',
                      }}
                      className="flex items-center space-x-1 px-3 py-1.5 rounded-lg text-[11px] font-extrabold shadow-xs cursor-pointer active:scale-95 transition-transform"
                    >
                      <span className="truncate max-w-[105px]">Next: {nextMember.name.split(' ').slice(-1)[0]}</span>
                      <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  ) : (
                    <span className="text-[10px] font-semibold text-slate-500">End of Roster</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
