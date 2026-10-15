import React, { useState } from 'react';
import { Party, PartyId } from '../types/politics';
import { Check, Plus, ChevronDown, ChevronUp, Users } from 'lucide-react';

interface PartySelectorProps {
  parties: Party[];
  selectedParties: PartyId[];
  onToggleParty: (id: PartyId) => void;
  onSelectAll: () => void;
  onSelectTop4: () => void;
}

export const PartySelector: React.FC<PartySelectorProps> = ({
  parties,
  selectedParties,
  onToggleParty,
  onSelectAll,
  onSelectTop4,
}) => {
  const [mobileExpanded, setMobileExpanded] = useState(false);
  const activePartyObjects = parties.filter((p) => selectedParties.includes(p.id));

  return (
    <div className="bg-slate-900 rounded-2xl p-3.5 sm:p-5 shadow-md border border-slate-700 mb-5 transition-colors">
      {/* Top Header Row — Tappable on Mobile to Expand/Collapse */}
      <div className="flex items-center justify-between gap-2">
        <div
          onClick={() => setMobileExpanded(!mobileExpanded)}
          className="flex items-center space-x-2.5 cursor-pointer sm:cursor-default min-w-0 flex-1"
        >
          <div className="w-8 h-8 rounded-xl bg-indigo-500/20 border border-indigo-400/40 flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-indigo-300" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center space-x-2">
              <h2 className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-white">
                Comparing {selectedParties.length} of {parties.length} Parties
              </h2>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-300 truncate">
              Tap parties below to add or remove them from the comparison cards
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2 shrink-0">
          <div className="hidden sm:flex items-center space-x-2 text-xs">
            <button
              onClick={onSelectTop4}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-600 font-bold transition-colors cursor-pointer"
            >
              Big 4 Parties
            </button>
            <button
              onClick={onSelectAll}
              className="px-3 py-1.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-200 border border-indigo-400/40 font-bold transition-colors cursor-pointer"
            >
              All 8 Parties
            </button>
          </div>

          <button
            onClick={() => setMobileExpanded(!mobileExpanded)}
            className="sm:hidden px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-200 border border-slate-600 text-xs font-bold flex items-center space-x-1 cursor-pointer"
          >
            <span>{mobileExpanded ? 'Done' : 'Change'}</span>
            {mobileExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Mobile Compact Preview Chips when collapsed */}
      {!mobileExpanded && (
        <div
          onClick={() => setMobileExpanded(true)}
          className="sm:hidden flex items-center gap-1.5 overflow-x-auto pt-2.5 mt-2.5 border-t border-slate-800 [&::-webkit-scrollbar]:hidden cursor-pointer"
        >
          {activePartyObjects.map((party) => (
            <span
              key={party.id}
              style={{
                backgroundColor: party.color,
                color: party.textColor,
              }}
              className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold whitespace-nowrap shrink-0 shadow-2xs"
            >
              {party.shortName}
            </span>
          ))}
          <span className="text-[11px] text-indigo-300 font-semibold whitespace-nowrap pl-1">
            + Tap to edit
          </span>
        </div>
      )}

      {/* Full Party Toggle Buttons (Always visible on sm+, toggleable on mobile) */}
      <div className={`${mobileExpanded ? 'block' : 'hidden sm:block'} mt-3.5 pt-3.5 border-t border-slate-800`}>
        <div className="flex sm:hidden items-center justify-between gap-2 mb-3">
          <button
            onClick={onSelectTop4}
            className="flex-1 py-1.5 rounded-xl bg-slate-800 text-slate-200 border border-slate-600 text-xs font-bold"
          >
            Select Big 4
          </button>
          <button
            onClick={onSelectAll}
            className="flex-1 py-1.5 rounded-xl bg-indigo-600/30 text-indigo-200 border border-indigo-400/40 text-xs font-bold"
          >
            Select All 8 Parties
          </button>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-2.5">
          {parties.map((party) => {
            const isSelected = selectedParties.includes(party.id);
            return (
              <button
                key={party.id}
                onClick={() => onToggleParty(party.id)}
                style={{
                  borderColor: party.color,
                  backgroundColor: isSelected ? party.color : 'rgba(30, 41, 59, 0.7)',
                  ...(isSelected ? { color: party.textColor } : {}),
                }}
                className={`group flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-extrabold transition-all border-2 shadow-xs cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-white/20 shadow-md scale-[1.01]'
                    : 'text-slate-200 hover:bg-slate-800 opacity-75 hover:opacity-100'
                }`}
              >
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{
                    backgroundColor: isSelected ? 'rgba(0,0,0,0.22)' : party.color,
                    color: isSelected ? party.textColor : '#ffffff',
                  }}
                >
                  {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                </span>
                <span>{party.shortName}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                    isSelected
                      ? 'opacity-90'
                      : 'bg-slate-900/80 text-slate-300'
                  }`}
                  style={isSelected ? { backgroundColor: 'rgba(0,0,0,0.2)', color: party.textColor } : {}}
                >
                  {party.seats} MPs
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

