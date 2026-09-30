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
    <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500">
            Select Parties to Compare
          </h2>
          <p className="text-xs text-slate-500">
            Choose 2 or more parties for side-by-side comparison on mobile, tablet, or desktop
          </p>
        </div>
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={onSelectTop4}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
          >
            Big 4 Parties
          </button>
          <button
            onClick={onSelectAll}
            className="px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors"
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
                color: isSelected ? party.textColor : '#1e293b',
              }}
              className={`group flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all border shadow-xs ${
                isSelected
                  ? 'ring-2 ring-offset-1 shadow-sm'
                  : 'hover:bg-slate-50 opacity-75 hover:opacity-100'
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
              <span className="text-[10px] px-1.5 py-0.2 rounded-full opacity-80" style={{
                backgroundColor: isSelected ? 'rgba(0,0,0,0.15)' : '#f1f5f9',
                color: isSelected ? party.textColor : '#64748b'
              }}>
                {party.seats} MPs
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
