import React, { useState } from 'react';
import { Party, PartyId, CabinetMember, LeaderRating } from '../types/politics';
import { Users, Award, Shield, Briefcase, Landmark, HeartPulse, UserCheck, BarChart3 } from 'lucide-react';
import { SectionRefreshButton } from './SectionRefreshButton';

interface CabinetExplorerProps {
  parties: Party[];
  cabinetMembers: CabinetMember[];
  leaderRatings?: LeaderRating[];
  onNavigateToPolls?: () => void;
}

export const CabinetExplorer: React.FC<CabinetExplorerProps> = ({
  parties,
  cabinetMembers,
  leaderRatings = [],
  onNavigateToPolls,
}) => {
  const [selectedPartyId, setSelectedPartyId] = useState<PartyId>('labour');
  const [roleFilter, setRoleFilter] = useState<string>('all');

  const selectedParty = parties.find((p) => p.id === selectedPartyId) || parties[0];
  const partyLeaderRating = leaderRatings.find((l) => l.partyId === selectedPartyId);

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
    return Users;
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
            Explore the key decision-makers steering each party: their cabinet roles, parliamentary backgrounds, constituencies, signature philosophies, and leadership approval ratings.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <SectionRefreshButton sectionName="Cabinet Roster" defaultDate="September 2026 • Verified Public Record" />

          {/* Quick Role Filter */}
          <div className="flex items-center space-x-1.5 self-start sm:self-auto bg-slate-50 p-1.5 rounded-xl border border-slate-200">
            <span className="text-[11px] font-bold text-slate-500 pl-2">Portfolio:</span>
            {['all', 'defence', 'chancellor', 'home', 'health'].map((role) => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize transition-all ${
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
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPartyId(p.id)}
              style={{
                backgroundColor: isSelected ? p.color : '#ffffff',
                borderColor: p.color,
                color: isSelected ? p.textColor : '#334155',
              }}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition-all border shadow-xs ${
                isSelected ? 'ring-2 ring-offset-1' : 'hover:bg-slate-50'
              }`}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: isSelected ? p.textColor : p.color }}
              />
              <span>
                {p.shortName} {p.id === 'labour' ? '(His Majesty\'s Government)' : '(Opposition / Leadership)'}
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
            <div className="bg-black/25 p-3 rounded-xl backdrop-blur-xs text-left">
              <span className="text-[10px] block opacity-80 uppercase font-semibold">Leader Approval</span>
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
            <span className="text-[11px] block opacity-85 mt-0.5">Leader: {selectedParty.leader}</span>
          </div>
        </div>
      </div>

      {/* Grid of Ministers / Spokespeople */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredMembers.map((member) => {
          const Icon = getRoleIcon(member.role);
          const isLeaderCard = member.isLeader;
          const leaderRating = isLeaderCard ? partyLeaderRating : null;

          return (
            <div
              key={member.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              <div 
                className="absolute top-0 left-0 bottom-0 w-1.5"
                style={{ backgroundColor: selectedParty.color }}
              />

              <div className="pl-1">
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
                <h5 className="text-xs font-semibold text-slate-600 mb-3">
                  {member.role}
                </h5>

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
              </div>

              {/* Verified badge */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 pl-1">
                <span className="flex items-center space-x-1">
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Frontbench Registered</span>
                </span>
                {onNavigateToPolls && isLeaderCard ? (
                  <button 
                    onClick={onNavigateToPolls}
                    className="font-bold text-rose-600 hover:text-rose-700 flex items-center space-x-1"
                  >
                    <BarChart3 className="w-3 h-3" />
                    <span>Compare Approval</span>
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
