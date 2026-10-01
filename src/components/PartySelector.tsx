import React from 'react';
import { Party, PartyId } from '../types/politics';
import { Check, Plus } from 'lucide-react';

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
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 dark:border-slate-800 mb-6 transition-colors">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Select Parties to Compare
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Choose 2 or more parties for side-by-side comparison on mobile, tablet, or desktop
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={onSelectTop4}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
          >
            Big 4 Parties
          </button>
          <button
            onClick={onSelectAll}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-300 font-medium transition-colors cursor-pointer"
          >
            All 8 Parties
          </button>
        </div>
      </div>

      {/* Party toggle buttons */}
      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        {parties.map((party) => {
          const isSelected = selectedParties.includes(party.id);
          return (
            <button
              key={party.id}
              onClick={() => onToggleParty(party.id)}
              style={{
                borderColor: party.color,
                backgroundColor: isSelected ? party.color : 'transparent',
                ...(isSelected ? { color: party.textColor } : {}),
              }}
              className={`group flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shadow-xs cursor-pointer ${
                isSelected
                  ? 'ring-2 ring-offset-1 dark:ring-offset-slate-900 shadow-sm'
                  : 'text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/60 opacity-80 hover:opacity-100'
              }`}
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                style={{
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.25)' : party.color,
                  color: isSelected ? party.textColor : '#ffffff',
                }}
              >
                {isSelected ? <Check className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
              </span>
              <span>{party.shortName}</span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                  isSelected
                    ? 'opacity-85'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                }`}
                style={isSelected ? { backgroundColor: 'rgba(0,0,0,0.15)', color: party.textColor } : {}}
              >
                {party.seats} MPs
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
