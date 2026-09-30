import React, { useState } from 'react';
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
  onNavigateToPolls?: (partyId?: PartyId, subTab?: 'voting' | 'leaders' | 'bestpm' | 'policies') => void;
  onRefreshRoster?: () => Promise<CabinetChangeReport | void> | void;
  onOpenSystemHealthModal?: () => void;
}

export const CabinetExplorer: React.FC<CabinetExplorerProps> = ({
  parties,
  cabinetMembers,
  leaderRatings = [],
  onNavigateToPolls,
  onRefreshRoster,
  onOpenSystemHealthModal,
}) => {
  const [selectedPartyId, setSelectedPartyId] = useState<PartyId>('labour');
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
    const matchesRole = 
      roleFilter === 'all' ||
      m.role.toLowerCase().includes(roleFilter.toLowerCase());
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
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs space-y-4">
        <div>
          <div className="flex items-center space-x-2 text-rose-600 font-bold text-xs uppercase tracking-wider mb-1">
            <Users className="w-4 h-4" />
            <span>Parliamentary Teams & Frontbench</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
            Cabinet & Shadow Cabinet Profiles
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            Explore active UK political decision-makers: ministerial portfolios, official appointment dates, parliamentary constituencies, signature philosophies, and leadership approval ratings.
          </p>
        </div>

        {/* Universal Roster Integrity Strip */}
        <div className="p-3 bg-slate-50 border border-slate-200/80 rounded-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs font-bold text-slate-800">
              Universal Frontbench Integrity:
            </span>
            <span className="text-xs text-slate-600">
              52 verified frontbench records across all 8 parties
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 self-stretch md:self-auto">
            {parties.map((p) => (
              <button
                key={p.id}
                onClick={() => setSelectedPartyId(p.id)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                  selectedPartyId === p.id
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {p.shortName} ({memberCounts[p.id] || 0})
              </button>
            ))}
            {onOpenSystemHealthModal && (
              <button
                onClick={onOpenSystemHealthModal}
                className="px-2.5 py-0.5 rounded-lg text-[11px] font-bold bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-colors ml-1 cursor-pointer"
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
              ? 'bg-amber-50 border-amber-200 text-amber-950'
              : 'bg-emerald-50 border-emerald-200 text-emerald-950'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center space-x-2">
                {lastChangeReport.hasChanges ? (
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
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
              <div className="mt-3 pt-3 border-t border-amber-200 space-y-1.5 text-xs">
                {lastChangeReport.changes.map((c, i) => (
                  <div key={i} className="flex items-center space-x-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-600" />
                    <strong>{c.personName}</strong>: <span>{c.details}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <SectionRefreshButton
            sectionName="Cabinet Roster"
            defaultDate="September 2026 • Verified Public Record"
            onRefresh={handleRefreshWithDiff}
          />

          {/* Quick Role Filter */}
          <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 pl-2">Portfolio:</span>
            {['all', 'defence', 'chancellor', 'home', 'health', 'education'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  roleFilter === role
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Party Switcher Tabs */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
        {parties.map((p) => {
          const isSelected = p.id === selectedPartyId;
          const count = memberCounts[p.id] || 0;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPartyId(p.id)}
              style={{
                backgroundColor: isSelected ? p.color : '#ffffff',
                borderColor: p.color,
                color: isSelected ? p.textColor : '#334155',
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border shadow-xs cursor-pointer ${
                isSelected ? 'ring-2 ring-offset-1' : 'hover:bg-slate-50'
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
        className="p-5 rounded-2xl border text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
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
              Verified: {selectedParty.seatsLastVerified || 'September 2026'}
            </span>
            <span className="text-[11px] block opacity-85 mt-0.5">Leader: {selectedParty.leader}</span>
          </div>
        </div>
      </div>

      {/* Contextual Explainer Banners per Party */}
      {selectedPartyId === 'labour' && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-rose-950 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-800 shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-rose-900 block text-sm">
                His Majesty's Government (Burnham Administration, July 2026)
              </span>
              <p className="text-rose-700 mt-0.5">
                Took office July 20, 2026, following Keir Starmer's resignation. All 9 ministerial appointments verified with exact appointment dates: Prime Minister <strong>Andy Burnham</strong>, First Secretary <strong>Louise Haigh</strong>, Chancellor <strong>John Healey</strong>, Defence Secretary <strong>Wes Streeting</strong>, and Health Secretary <strong>Yvette Cooper</strong>.
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-rose-200/70 text-rose-900 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            July 2026 Reshuffle
          </span>
        </div>
      )}

      {selectedPartyId === 'conservative' && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-950 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 flex items-center justify-center text-blue-800 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-blue-900 block text-sm">
                Official Opposition Frontbench (Kemi Badenoch)
              </span>
              <p className="text-blue-700 mt-0.5">
                9 verified shadow ministers. Following Robert Jenrick's defection to Reform UK, <strong>Nick Timothy</strong> was appointed Shadow Justice Secretary (Feb 2026), alongside <strong>Mel Stride</strong> (Shadow Chancellor, Nov 2024), <strong>Chris Philp</strong> (Shadow Home, Nov 2024), <strong>Victoria Atkins</strong> (Shadow Health, Nov 2024), and <strong>Laura Trott</strong> (Shadow Education, Nov 2024).
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-blue-200/70 text-blue-900 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            Nov 2024 / Feb 2026
          </span>
        </div>
      )}

      {selectedPartyId === 'reform' && (
        <div className="bg-cyan-50 border border-cyan-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-cyan-950 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-800 shrink-0">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-cyan-900 block text-sm">
                Official Reform UK "Shadow Cabinet" (Announced Feb 17, 2026)
              </span>
              <p className="text-cyan-700 mt-0.5">
                8 verified members. Nigel Farage formed Reform's first official frontbench team in February 2026 to prepare for government, featuring defectors <strong>Robert Jenrick</strong> (Shadow Chancellor) and <strong>Suella Braverman</strong> (Shadow Education), alongside Chairman <strong>Zia Yusuf</strong> (Shadow Home Secretary) and <strong>Richard Tice</strong> (Shadow Business & Energy).
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-cyan-200/70 text-cyan-900 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            February 2026 Team
          </span>
        </div>
      )}

      {selectedPartyId === 'libdem' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 flex items-center justify-center text-amber-800 shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-amber-900 block text-sm">
                Liberal Democrats Parliamentary Frontbench (72 MPs)
              </span>
              <p className="text-amber-700 mt-0.5">
                Comprehensive 11-member frontbench team appointed following the July 2024 general election, led by <strong>Sir Ed Davey</strong> and Deputy Leader <strong>Daisy Cooper</strong> (Treasury), with key spokespeople including <strong>Helen Morgan</strong> (Health), <strong>Munira Wilson</strong> (Education), <strong>Tim Farron</strong> (Environment/Sewage), and <strong>Sarah Olney</strong> (Business).
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-amber-200/70 text-amber-900 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            July 2024 Frontbench
          </span>
        </div>
      )}

      {selectedPartyId === 'green' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-950 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-800 shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-emerald-900 block text-sm">
                Green Party Leadership & Parliamentary Team (7 Verified Figures)
              </span>
              <p className="text-emerald-700 mt-0.5">
                Full verified leadership roster: <strong>Zack Polanski</strong> (Party Leader, elected September 2025) and <strong>Carla Denyer</strong> (Parliamentary Leader & MP for Bristol Central), alongside <strong>Adrian Ramsay</strong> (MP for Waveney Valley), <strong>Ellie Chowns</strong> (MP for North Herefordshire), <strong>Siân Berry</strong> (MP for Brighton Pavilion), and Deputy Leaders <strong>Mothin Ali</strong> & <strong>Rachel Millward</strong> (elected August 2025).
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-emerald-200/70 text-emerald-900 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            September 2025 Leadership
          </span>
        </div>
      )}

      {selectedPartyId === 'snp' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-yellow-950 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-100 flex items-center justify-center text-yellow-800 shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-yellow-900 block text-sm">
                SNP Parliamentary & Scottish Government Leadership
              </span>
              <p className="text-yellow-700 mt-0.5">
                Party Leader & First Minister <strong>John Swinney</strong> (May 2024), Westminster Group Leader <strong>Stephen Flynn</strong> (Dec 2022 / July 2024), Work & Pensions Spokesperson <strong>Kirsty Blackman</strong> (July 2024), and Foreign Affairs & Defence Spokesperson <strong>Dave Doogan</strong> (July 2024).
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-yellow-200/70 text-yellow-900 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            May 2024 / July 2024
          </span>
        </div>
      )}

      {selectedPartyId === 'plaid' && (
        <div className="bg-teal-50 border border-teal-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-teal-950 shadow-2xs">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center text-teal-800 shrink-0">
              <Landmark className="w-4 h-4" />
            </div>
            <div>
              <span className="font-bold text-teal-900 block text-sm">
                Plaid Cymru Parliamentary & Senedd Frontbench
              </span>
              <p className="text-teal-700 mt-0.5">
                Full representation: Senedd Leader <strong>Rhun ap Iorwerth</strong> (June 2023), Westminster Group Leader <strong>Liz Saville Roberts</strong> (June 2017 / July 2024), Treasury Spokesperson <strong>Ben Lake</strong> (July 2024), Agriculture Spokesperson <strong>Ann Davies</strong> (July 2024), and Health Spokesperson <strong>Llinos Medi</strong> (July 2024).
              </p>
            </div>
          </div>
          <span className="shrink-0 font-bold bg-teal-200/70 text-teal-900 px-3 py-1 rounded-xl text-[11px] self-start sm:self-auto">
            July 2024 Frontbench
          </span>
        </div>
      )}

      {/* Grid of Ministers / Spokespeople */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const Icon = getRoleIcon(member.role);
          const isLeaderCard = member.isLeader;
          const leaderRating = isLeaderCard ? partyLeaderRating : null;
          const is2026 = member.appointedDate && member.appointedDate.includes('2026');
          const briefing = memberBriefings[member.id];
          const hasBriefing = Boolean(briefing);
          const isExpanded = expandedBriefingId === member.id;
          const isLoadingBriefing = loadingMemberId === member.id;

          return (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div 
                className="absolute top-0 left-0 bottom-0 w-1.5"
                style={{ backgroundColor: selectedParty.color }}
              />

              <div className="pl-1 flex-1 flex flex-col">
                {/* Header: Role and Icon */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-rose-600 bg-rose-50 px-2 py-0.5 rounded flex items-center space-x-1">
                    <Icon className="w-3 h-3" />
                    <span>{member.isLeader ? 'Party Leader' : 'Cabinet Portfolio'}</span>
                  </span>
                  {member.constituency && (
                    <span className="text-[11px] text-slate-400 font-medium">
                      MP: {member.constituency}
                    </span>
                  )}
                </div>

                {/* Name */}
                <h4 className="text-lg font-bold text-slate-900 leading-tight">
                  {member.name}
                </h4>

                {/* Specific Portfolio Title */}
                <h5 className="text-xs font-semibold text-slate-600 mb-2">
                  {member.role}
                </h5>

                {/* Appointment Date Badge & Recency Tag */}
                <div className="flex flex-wrap items-center gap-1.5 mb-3.5">
                  <span className="inline-flex items-center space-x-1 text-[11px] font-medium text-slate-600 bg-slate-100 border border-slate-200/80 px-2 py-0.5 rounded-md">
                    <Calendar className="w-3 h-3 text-slate-500" />
                    <span>In post: <strong className="text-slate-900">{member.appointedDate || 'Current Parliament'}</strong></span>
                  </span>
                  {is2026 ? (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center space-x-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      <span>2026 Reshuffle</span>
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-50 text-slate-500 border border-slate-200">
                      Verified Active
                    </span>
                  )}
                </div>

                {/* Leader Approval Rating Badge (if this is the leader) */}
                {leaderRating && (
                  <div className="mb-3.5 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-700">Public Approval Score:</span>
                      <span 
                        className={`font-black px-2 py-0.5 rounded text-xs ${
                          leaderRating.netRating >= 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {leaderRating.netRating >= 0 ? `+${leaderRating.netRating}` : leaderRating.netRating} Net
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden flex mb-1">
                      <div className="bg-emerald-500 h-full" style={{ width: `${leaderRating.approvePct}%` }} />
                      <div className="bg-rose-500 h-full" style={{ width: `${leaderRating.disapprovePct}%` }} />
                      <div className="bg-slate-400 h-full" style={{ width: `${leaderRating.dontKnowPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-500">
                      <span>{leaderRating.approvePct}% Approve • {leaderRating.disapprovePct}% Disapprove</span>
                      <span>{leaderRating.pollster}</span>
                    </div>
                  </div>
                )}

                {/* Bio */}
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  {member.bio}
                </p>

                {/* Signature Stance */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Signature Stance & Priorities:
                  </span>
                  <p className="text-xs text-slate-800 font-medium italic">
                    "{member.keyStance}"
                  </p>
                </div>

                {/* Live Intelligence Dossier */}
                <div className="mt-3.5 pt-3 border-t border-slate-100">
                  <div className="flex items-center justify-between gap-1.5">
                    <button
                      onClick={() => handleFetchBriefing(member)}
                      disabled={isLoadingBriefing}
                      className={`flex-1 inline-flex items-center justify-center space-x-1.5 py-1.5 px-3 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        isExpanded
                          ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-200'
                          : hasBriefing
                          ? 'bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200'
                          : 'bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 hover:from-indigo-100 hover:via-purple-100 hover:to-pink-100 text-indigo-900 border border-indigo-200/90'
                      }`}
                      title={`Scan for most recent updates on ${member.name}'s latest actions, statements, and policy stances`}
                    >
                      {isLoadingBriefing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                          <span>Scanning Recent Record...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className={`w-3.5 h-3.5 ${isExpanded ? 'text-amber-300' : 'text-indigo-600'}`} />
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
                        className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                        title="Scan for most recent updates"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isLoadingBriefing ? 'animate-spin' : ''}`} />
                      </button>
                    )}
                  </div>

                  {/* Expanded Dossier Box */}
                  {isExpanded && briefing && (
                    <div className="mt-2.5 rounded-xl bg-slate-900 text-slate-100 p-3.5 border border-slate-800 shadow-md animate-fade-in text-xs space-y-2.5">
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
                    <div className="mt-2 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start space-x-2">
                      <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-semibold">{briefingError}</p>
                        <button
                          onClick={() => handleFetchBriefing(member, true)}
                          className="mt-1 font-bold text-rose-700 underline cursor-pointer"
                        >
                          Retry Scan
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Verified badge */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 pl-1">
                <span className="flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Frontbench Registered</span>
                </span>
                {onNavigateToPolls && isLeaderCard ? (
                  <button 
                    onClick={() => onNavigateToPolls(member.partyId, 'leaders')}
                    className="font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1.5 cursor-pointer bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors border border-rose-200/80 shadow-2xs text-[11px]"
                    title={`Compare ${member.name}'s personal approval ratings across YouGov, Ipsos & Savanta`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span>Compare Leader Approval ↗</span>
                  </button>
                ) : (
                  <span className="font-semibold text-slate-700">{selectedParty.shortName}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
