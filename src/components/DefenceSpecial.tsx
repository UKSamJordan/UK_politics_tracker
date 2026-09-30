import React, { useState } from 'react';
import { Party, PolicyTopic } from '../types/politics';
import { Shield, Anchor, Target, Award, ArrowRight, CheckCircle2, AlertTriangle, Calculator } from 'lucide-react';
import { SectionRefreshButton } from './SectionRefreshButton';

interface DefenceSpecialProps {
  parties: Party[];
  defencePolicyTopic?: PolicyTopic;
  onRefreshDefence?: () => Promise<void> | void;
}

export const DefenceSpecial: React.FC<DefenceSpecialProps> = ({ 
  parties, 
  defencePolicyTopic,
  onRefreshDefence,
}) => {
  const [calcGdpPct, setCalcGdpPct] = useState<number>(2.5);

  // UK nominal GDP approx £2.7 trillion (£2,700 billion)
  const ukGdpBillion = 2700;
  const calculatedBudget = (ukGdpBillion * (calcGdpPct / 100)).toFixed(1);
  const baselineBudget = (ukGdpBillion * (2.3 / 100)).toFixed(1);
  const difference = (parseFloat(calculatedBudget) - parseFloat(baselineBudget)).toFixed(1);

  const partyDefenceSpecs = [
    {
      partyId: 'labour',
      targetGdp: 'Roadmap to 2.5%',
      trident: 'Retain & Modernize (Unshakeable commitment)',
      troopTarget: 'Maintain & improve retention / Armed Forces Commissioner',
      natoUkraine: 'Deepen European defence pacts (UK-Germany Trinity House Treaty); full Ukraine aid',
    },
    {
      partyId: 'conservative',
      targetGdp: '2.5% by 2030 (£87bn/yr)',
      trident: 'Full Dreadnought replacement ring-fenced',
      troopTarget: 'Lock army floor at minimum 73,000 personnel',
      natoUkraine: 'Expand AUKUS and GCAP Tempest fighter programme; sustain £3bn/yr Ukraine aid',
    },
    {
      partyId: 'reform',
      targetGdp: 'Surge to 3.0% within 6 yrs',
      trident: 'Retain & expand sovereign command',
      troopTarget: 'Surge regular army to 100,000 troops with enlistment cash bonuses',
      natoUkraine: 'Prioritise UK territorial defence; review non-essential foreign commitments',
    },
    {
      partyId: 'libdem',
      targetGdp: '2.5% when fiscal headroom allows',
      trident: 'Maintain continuous-at-sea deterrence with strict non-proliferation scrutiny',
      troopTarget: 'Reverse troop cuts, rebuild army personnel to 73,000 minimum',
      natoUkraine: 'Strengthen European NATO pillar and legally bind Armed Forces Covenant',
    },
    {
      partyId: 'green',
      targetGdp: 'Defensive parity (scrap nuclear)',
      trident: 'Cancel Trident; decommission all nuclear warheads',
      troopTarget: 'Shift to peacekeeping, disaster relief, cyber defence, and UN missions',
      natoUkraine: 'Halt all arms exports to autocratic regimes; diplomacy-led conflict resolution',
    },
    {
      partyId: 'snp',
      targetGdp: 'Proportionate Scottish share (~£3.5bn)',
      trident: 'Immediate removal of Trident nuclear submarines from Faslane',
      troopTarget: 'Nordic-style conventional Scottish defence force',
      natoUkraine: 'Join NATO as non-nuclear state; defend Baltic & North Atlantic sea lines',
    },
    {
      partyId: 'plaid',
      targetGdp: 'Defensive and humanitarian focus',
      trident: 'Oppose nuclear renewal; invest savings in healthcare and regional growth',
      troopTarget: 'Protect Welsh military installations (Brecon, RAF Valley) and veterans',
      natoUkraine: 'Parliamentary vote legally mandated before any overseas deployment',
    },
    {
      partyId: 'restore',
      targetGdp: '3.0% GDP Statutory Floor',
      trident: 'Retain and expand independent sovereign British nuclear deterrent',
      troopTarget: 'Major naval expansion; voluntary National Service in military/cyber reserves',
      natoUkraine: 'Homeland defence primacy; end foreign entanglements without vital British interest',
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header Hero Banner */}
      <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-widest">
              <Shield className="w-4 h-4" />
              <span>National Security & Armed Forces</span>
            </div>
            <SectionRefreshButton
              sectionName="Defence Brief"
              defaultDate="September 2026 Review"
              onRefresh={onRefreshDefence}
            />
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight mb-3">
            UK Military & Defence Policy Tracker
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            With European security challenged and global tensions rising, defence spending and troop readiness have become pivotal general election and parliamentary debates. Compare how every party plans to equip Britain's Armed Forces.
          </p>

          {/* Key Facts Quick Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 pt-6 border-t border-slate-800 text-xs">
            <div>
              <span className="text-slate-400 block">Current Spending</span>
              <span className="text-base sm:text-lg font-bold text-white">~2.3% of GDP</span>
              <span className="text-[10px] text-slate-500 block">approx £54.2bn / yr</span>
            </div>
            <div>
              <span className="text-slate-400 block">Regular Army Size</span>
              <span className="text-base sm:text-lg font-bold text-white">~73,000</span>
              <span className="text-[10px] text-slate-500 block">Trained regular troops</span>
            </div>
            <div>
              <span className="text-slate-400 block">Nuclear Deterrent</span>
              <span className="text-base sm:text-lg font-bold text-white">Trident (Vanguard)</span>
              <span className="text-[10px] text-slate-500 block">Dreadnought replacing</span>
            </div>
            <div>
              <span className="text-slate-400 block">Public Opinion</span>
              <span className="text-base sm:text-lg font-bold text-emerald-400">64% Back 2.5%</span>
              <span className="text-[10px] text-slate-500 block">RUSI / YouGov poll</span>
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Defence Spending Calculator */}
      <div className="bg-white rounded-2xl p-5 sm:p-6 border border-slate-200 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Interactive Defence Spending Model</h3>
              <p className="text-xs text-slate-500">Calculate how each party's GDP target shifts UK annual defence spending</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400 block">Model Target</span>
            <span className="text-xl font-extrabold text-blue-700">{calcGdpPct}% of GDP</span>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2">
          <input
            type="range"
            min="1.5"
            max="3.5"
            step="0.1"
            value={calcGdpPct}
            onChange={(e) => setCalcGdpPct(parseFloat(e.target.value))}
            className="w-full accent-blue-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
          />
          <div className="flex justify-between text-[11px] font-semibold text-slate-400">
            <span>1.5% (Disarmament)</span>
            <span>2.0% (NATO minimum)</span>
            <span className="text-slate-900 font-bold">2.3% (Current UK)</span>
            <span>2.5% (Labour/Con/LD)</span>
            <span>3.0% (Reform/Restore)</span>
            <span>3.5% (Cold War peak)</span>
          </div>
        </div>

        {/* Calculated summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100 text-center">
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block">Total Defence Budget</span>
            <span className="text-xl font-bold text-slate-900">£{calculatedBudget} Billion</span>
            <span className="text-[10px] text-slate-400 block">Annual UK expenditure</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block">Change vs Current Level</span>
            <span className={`text-xl font-bold ${parseFloat(difference) >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
              {parseFloat(difference) >= 0 ? `+£${difference}` : `-£${Math.abs(parseFloat(difference))}`} Billion
            </span>
            <span className="text-[10px] text-slate-400 block">per year in public finances</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
            <span className="text-xs text-slate-500 block">Equivalent Public Cost</span>
            <span className="text-xl font-bold text-slate-900">
              £{(parseFloat(calculatedBudget) * 1000 / 67).toFixed(0)} / Citizen
            </span>
            <span className="text-[10px] text-slate-400 block">based on 67M UK population</span>
          </div>
        </div>
      </div>

      {/* Military Policy Comparison Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {partyDefenceSpecs.map((spec) => {
          const party = parties.find((p) => p.id === spec.partyId);
          if (!party) return null;

          return (
            <div
              key={spec.partyId}
              className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden"
            >
              {/* Colored top bar */}
              <div 
                className="absolute top-0 left-0 right-0 h-1.5" 
                style={{ backgroundColor: party.color }}
              />

              <div>
                {/* Party header */}
                <div className="flex items-center justify-between mb-4 mt-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className="w-3.5 h-3.5 rounded-full"
                      style={{ backgroundColor: party.color }}
                    />
                    <h3 className="font-bold text-base text-slate-900">{party.name}</h3>
                  </div>
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{
                    backgroundColor: party.color,
                    color: party.textColor
                  }}>
                    {spec.targetGdp}
                  </span>
                </div>

                {/* Specs */}
                <div className="space-y-3.5 text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Nuclear Deterrent (Trident)
                    </span>
                    <p className="text-slate-800 font-semibold mt-0.5">{spec.trident}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Army Manpower & Recruiting
                    </span>
                    <p className="text-slate-700 mt-0.5">{spec.troopTarget}</p>
                  </div>

                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">
                      Alliances (NATO & Ukraine)
                    </span>
                    <p className="text-slate-700 mt-0.5">{spec.natoUkraine}</p>
                  </div>
                </div>
              </div>

              {/* Bottom badge */}
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px]">
                <span className="text-slate-400 font-medium">Defence Secretary / Shadow:</span>
                <span className="font-bold text-slate-800">
                  {party.id === 'labour' ? 'John Healey' :
                   party.id === 'conservative' ? 'James Cartlidge' :
                   party.id === 'libdem' ? 'Calum Miller' :
                   party.id === 'reform' ? 'Spokesperson' : party.leader}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
