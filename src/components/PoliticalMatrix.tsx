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
  HeartPulse, 
  ExternalLink, 
  ArrowRight, 
  CheckCircle2, 
  Sliders, 
  Layers,
  Sparkles,
  RotateCcw,
  FileText
} from 'lucide-react';

interface PoliticalMatrixProps {
  parties: Party[];
  policies: PolicyTopic[];
  onSelectPartyForCabinet?: (partyId: PartyId) => void;
  isDark?: boolean;
}

type MatrixMode = 'parties' | 'policies';

export interface PolicyPartyCoord {
  economic: number;
  social: number;
  rationale: string;
  quadrant: string;
}

export interface PolicyLens {
  id: string;
  name: string;
  shortName: string;
  category: string;
  topicId: string;
  description: string;
  partyCoords: Record<PartyId, PolicyPartyCoord>;
}

// Rigorous 2026 Policy-Specific Compass Coordinates for all 8 UK Parties
export const POLICY_LENSES: PolicyLens[] = [
  {
    id: 'defence',
    name: 'Defence & Armed Forces',
    shortName: 'Defence',
    category: 'defence',
    topicId: 'defence-spending-and-military',
    description: 'Military expenditure (% of GDP), sovereign stockpiles, NATO nuclear deterrent (Trident), and troop numbers.',
    partyCoords: {
      conservative: {
        economic: 4.5,
        social: 7.0,
        quadrant: 'Auth-Right',
        rationale: 'Legislate 2.5% of GDP by 2030 (scaling to 3%), protect 73,000 regular Army personnel floor, ring-fence Dreadnought nuclear submarines, and expand AUKUS alliances.'
      },
      labour: {
        economic: 1.5,
        social: 4.5,
        quadrant: 'Auth-Right',
        rationale: 'Unshakeable commitment to NATO and continuous nuclear deterrent; Strategic Defence Review roadmap to 2.5% of GDP when fiscal conditions allow; Trinity House treaty with Germany.'
      },
      reform: {
        economic: 6.0,
        social: 8.5,
        quadrant: 'Auth-Right',
        rationale: 'Surge defence expenditure to 3% within 6 years, expand Army to 100,000, sovereign British manufacturing, full tax exemption for veterans, and withdraw from foreign entanglements.'
      },
      libdem: {
        economic: -1.0,
        social: -1.5,
        quadrant: 'Lib-Left',
        rationale: 'Reverse troop cuts, maintain minimum 73,000 Army headcount, legally binding Armed Forces Covenant, European security interoperability, and strict parliamentary war scrutiny.'
      },
      green: {
        economic: -7.5,
        social: -8.0,
        quadrant: 'Lib-Left',
        rationale: 'Cancel Trident nuclear replacement, sign the UN Nuclear Ban Treaty, halt arms sales to human rights violators, and transition defence engineering into clean technology.'
      },
      snp: {
        economic: -5.0,
        social: -4.5,
        quadrant: 'Lib-Left',
        rationale: 'Immediate removal of nuclear warheads from Faslane on the Clyde; transition to Nordic-style conventional defence forces within non-nuclear NATO membership.'
      },
      plaid: {
        economic: -6.0,
        social: -5.0,
        quadrant: 'Lib-Left',
        rationale: 'Peace-first non-interventionist foreign policy; oppose Trident renewal; redirect nuclear spending into Welsh health and education; protect Welsh military bases.'
      },
      restore: {
        economic: 7.5,
        social: 9.0,
        quadrant: 'Auth-Right',
        rationale: 'Sovereign re-armament with 3% GDP statutory floor; major expansion of Royal Navy surface fleet; restore national service options; end diversity programmes in the military.'
      }
    }
  },
  {
    id: 'nhs',
    name: 'NHS & Healthcare',
    shortName: 'NHS',
    category: 'nhs',
    topicId: 'nhs-and-healthcare',
    description: 'NHS elective waiting lists, hospital-to-community reforms, primary care access, and private capacity usage.',
    partyCoords: {
      labour: {
        economic: -3.0,
        social: 3.0,
        quadrant: 'Auth-Left',
        rationale: 'Deliver 40,000 extra weekly appointments via high-intensity surgical hubs; 10-year health plan shifting from acute hospitals to neighbourhood community centres; digital single health record.'
      },
      conservative: {
        economic: 3.5,
        social: 2.5,
        quadrant: 'Auth-Right',
        rationale: 'Leverage independent sector private hospital capacity to clear waiting backlogs; expand Pharmacy First scheme; modernisation of digital NHS app for patient choice.'
      },
      reform: {
        economic: 6.0,
        social: -1.0,
        quadrant: 'Lib-Right',
        rationale: 'Issue private treatment vouchers for any patient waiting more than 31 days for NHS care; zero basic rate income tax for all frontline healthcare personnel; transition to insurance model.'
      },
      libdem: {
        economic: -4.5,
        social: -4.0,
        quadrant: 'Lib-Left',
        rationale: 'Statutory 7-day GP appointment guarantee; free personal care for elderly and disabled; dedicated mental health therapy funding parity funded via pharmaceutical windfall taxes.'
      },
      green: {
        economic: -8.5,
        social: -6.0,
        quadrant: 'Lib-Left',
        rationale: '£50bn emergency public health injection; completely terminate all private hospital and agency outsourcing; restore universal free dentistry; 15% frontline staff pay restoration.'
      },
      snp: {
        economic: -5.0,
        social: -3.0,
        quadrant: 'Lib-Left',
        rationale: 'Protect NHS Scotland frontline funding at 3% higher per capita than England; integrate health and local authority social care via the National Care Service.'
      },
      plaid: {
        economic: -6.5,
        social: -4.0,
        quadrant: 'Lib-Left',
        rationale: 'Student loan forgiveness for Welsh medical and nursing graduates working 5 years in Welsh NHS; eliminate hospital ambulance handover gridlock; fair parity for carers.'
      },
      restore: {
        economic: 4.0,
        social: 6.5,
        quadrant: 'Auth-Right',
        rationale: 'Direct administrative purge of non-clinical NHS diversity managers; British citizen priority in elective treatment; redirect administrative savings to frontline nursing.'
      }
    }
  },
  {
    id: 'economy',
    name: 'Economy & Taxation',
    shortName: 'Economy',
    category: 'economy',
    topicId: 'economy-tax-and-debt',
    description: 'Fiscal rules, National Wealth Fund, income tax thresholds, corporation tax, and inheritance tax.',
    partyCoords: {
      labour: {
        economic: -2.0,
        social: 2.0,
        quadrant: 'Centrist',
        rationale: 'Stability Rule (balance day-to-day spending in 3 years); National Wealth Fund £7.3bn catalytic capital; abolish non-dom status; 20% VAT on private school fees; employer NIC uplift.'
      },
      conservative: {
        economic: 6.5,
        social: 3.0,
        quadrant: 'Auth-Right',
        rationale: 'Abolish 40% inheritance tax over parliament; reverse agricultural relief curbs; cut small business corporation taxes; reduce civil service headcount to cut state spending.'
      },
      reform: {
        economic: 8.5,
        social: 1.0,
        quadrant: 'Lib-Right',
        rationale: 'Raise income tax personal allowance from £12,570 to £20,000 (freeing 7m workers); slash corporation tax to 15%; abolish inheritance tax on estates under £2m; eliminate net zero levies.'
      },
      libdem: {
        economic: -3.5,
        social: -3.0,
        quadrant: 'Lib-Left',
        rationale: 'Windfall tax on super-profits of banks and oil majors; reform capital gains tax; fund local council services and reverse real-terms cuts in public service delivery.'
      },
      green: {
        economic: -9.0,
        social: -5.0,
        quadrant: 'Lib-Left',
        rationale: 'Annual 1% wealth tax on assets over £10m and 2% on fortunes over £100m; equalise Capital Gains Tax with income tax bands; pilot Universal Basic Income; carbon tax on luxury emissions.'
      },
      snp: {
        economic: -6.0,
        social: -3.0,
        quadrant: 'Lib-Left',
        rationale: 'Maintain progressive Scottish income tax bands; oppose Westminster spending austerity; demand full devolution of borrowing and corporation tax levers to Holyrood; rejoin EU single market.'
      },
      plaid: {
        economic: -7.0,
        social: -4.0,
        quadrant: 'Lib-Left',
        rationale: 'Abolish the 1978 Barnett formula in favour of needs-based statutory funding; retain Welsh renewable and water resource revenues; introduce regional wealth retention taxes.'
      },
      restore: {
        economic: 7.0,
        social: 6.0,
        quadrant: 'Auth-Right',
        rationale: 'Abolish civil service red tape; slash foreign aid to zero; statutory Buy British manufacturing quotas; replace foreign imports with domestic production.'
      }
    }
  },
  {
    id: 'housing',
    name: 'Housing & Planning',
    shortName: 'Housing',
    category: 'housing',
    topicId: 'housing-and-planning',
    description: 'Mandatory housing targets, brownfield passports, Renters\' Rights Bill (Section 21 abolition), and social housing.',
    partyCoords: {
      labour: {
        economic: -2.5,
        social: 4.0,
        quadrant: 'Auth-Left',
        rationale: 'Enact mandatory 370,000 annual housebuilding targets; introduce grey belt release presumption; brownfield passports; abolish Section 21 no-fault evictions in Renters\' Rights Bill.'
      },
      conservative: {
        economic: 5.0,
        social: 3.5,
        quadrant: 'Auth-Right',
        rationale: 'Protect Green Belt land from top-down central quotas; abolish mandatory targets in favour of local community consent; relaunch Help to Buy equity loans for first-time buyers.'
      },
      reform: {
        economic: 6.5,
        social: 5.0,
        quadrant: 'Auth-Right',
        rationale: 'Ban foreign non-resident buyers from purchasing UK residential properties; scrap Section 21 abolition to protect private landlord rights; cut brownfield stamp duty to boost supply.'
      },
      libdem: {
        economic: -3.0,
        social: -3.0,
        quadrant: 'Lib-Left',
        rationale: 'Build 380,000 homes per year through community-led planning; build 150,000 social homes; pioneer Rent-to-Own equity schemes; tax penalties for developer land-banking.'
      },
      green: {
        economic: -8.5,
        social: -5.0,
        quadrant: 'Lib-Left',
        rationale: 'Grant local mayors statutory powers to freeze and cap private rents; build 150,000 zero-carbon social council homes per year; mandate Passivhaus green building standards.'
      },
      snp: {
        economic: -5.5,
        social: -2.5,
        quadrant: 'Lib-Left',
        rationale: '£600m Affordable Housing Supply Programme in Scotland; legislate long-term Rent Pressure Zones in Scottish cities; expand statutory tenant protections.'
      },
      plaid: {
        economic: -6.5,
        social: -3.5,
        quadrant: 'Lib-Left',
        rationale: 'Enact 300% council tax premium on second homes; require Article 4 planning permission for holiday lets; compulsory purchase powers for empty luxury properties in rural Wales.'
      },
      restore: {
        economic: 5.5,
        social: 7.0,
        quadrant: 'Auth-Right',
        rationale: 'Ban non-citizens from owning UK residential land or housing; abolish heritage planning restrictions; prioritize local multi-generational British families on council waiting lists.'
      }
    }
  },
  {
    id: 'energy',
    name: 'Energy & Net Zero',
    shortName: 'Energy',
    category: 'energy',
    topicId: 'energy-and-net-zero',
    description: 'Great British Energy, Clean Power 2030, North Sea oil and gas licences, nuclear energy, and insulation.',
    partyCoords: {
      labour: {
        economic: -4.5,
        social: 2.0,
        quadrant: 'Centrist',
        rationale: 'Incorporate Great British Energy (£8.3bn) in Aberdeen; deliver clean electricity grid by 2030; end new North Sea exploration licences; £3.4bn Warm Homes Plan for insulation.'
      },
      conservative: {
        economic: 4.5,
        social: 2.5,
        quadrant: 'Auth-Right',
        rationale: 'Pragmatic Net Zero transition by 2050; max out North Sea oil and gas production licences; build fleet of Rolls-Royce Small Modular Nuclear Reactors; protect motorists from EV mandates.'
      },
      reform: {
        economic: 9.0,
        social: 4.0,
        quadrant: 'Auth-Right',
        rationale: 'Repeal the Climate Change Act 2008; abolish all renewable subsidies and green levies on household bills; fast-track onshore shale gas fracking; keep coal and gas plants open.'
      },
      libdem: {
        economic: -5.5,
        social: -5.0,
        quadrant: 'Lib-Left',
        rationale: 'Rooftop solar revolution on all new homes; 80% clean power by 2030; nationwide emergency home insulation programme; empower community energy co-operatives to sell to neighbours.'
      },
      green: {
        economic: -10.0,
        social: -7.0,
        quadrant: 'Lib-Left',
        rationale: 'Phase out all fossil fuel combustion by 2030; 100% renewable electricity; oppose all nuclear power; introduce Ecocide Law criminalizing environmental damage; carbon border taxes.'
      },
      snp: {
        economic: -5.0,
        social: -2.0,
        quadrant: 'Lib-Left',
        rationale: 'Scotland as clean energy superpower via ScotWind; £500m Just Transition Fund for Aberdeen oil workers; oppose new nuclear power stations in Scotland; reform transmission grid charges.'
      },
      plaid: {
        economic: -6.5,
        social: -4.0,
        quadrant: 'Lib-Left',
        rationale: 'Expand Ynni Cymru publicly owned energy company; build tidal energy lagoons in Swansea Bay; devolve Crown Estate marine seabed revenues to Wales.'
      },
      restore: {
        economic: 8.0,
        social: 6.5,
        quadrant: 'Auth-Right',
        rationale: 'Total fossil fuel energy independence; reopen deep coal mines; drill North Sea reserves; ban solar farms on productive agricultural food land.'
      }
    }
  },
  {
    id: 'education',
    name: 'Education & Tuition',
    shortName: 'Education',
    category: 'education',
    topicId: 'education-schools-and-universities',
    description: 'Private school VAT, university tuition fees, free breakfast clubs, Skills England, and Ofsted reform.',
    partyCoords: {
      labour: {
        economic: -2.5,
        social: 1.5,
        quadrant: 'Centrist',
        rationale: 'End 20% VAT exemption on private school fees to fund 6,500 state teachers; universal free primary breakfast clubs; establish Skills England; abolish single-word Ofsted grades.'
      },
      conservative: {
        economic: 5.0,
        social: 4.5,
        quadrant: 'Auth-Right',
        rationale: 'Preserve charitable status of independent schools; clamp down on low-earning "rip-off" university degrees; protect knowledge-rich EBacc school curriculum; fund 100,000 apprenticeships.'
      },
      reform: {
        economic: 7.0,
        social: 6.5,
        quadrant: 'Auth-Right',
        rationale: 'Zero student loan interest for British STEM students; ban transgender guidance and DEI roles in schools; mandate traditional patriotic British history curriculum.'
      },
      libdem: {
        economic: -5.0,
        social: -6.0,
        quadrant: 'Lib-Left',
        rationale: 'Reinstate university maintenance grants for low-income students; universal free school meals for all primary pupils in poverty; review university tuition fee cap structure.'
      },
      green: {
        economic: -9.0,
        social: -7.5,
        quadrant: 'Lib-Left',
        rationale: 'Completely abolish university tuition fees in England; cancel historic student loan debt; end school academisation; replace Ofsted with collaborative peer review.'
      },
      snp: {
        economic: -5.5,
        social: -3.0,
        quadrant: 'Lib-Left',
        rationale: 'Maintain universal free university tuition for Scottish-domiciled students; expand statutory funded early learning and childcare to 1,140 hours annually.'
      },
      plaid: {
        economic: -6.5,
        social: -4.0,
        quadrant: 'Lib-Left',
        rationale: 'Delivered Universal Free School Meals for all primary pupils across Wales; parity of esteem for vocational apprenticeships; statutory funding for Welsh-medium education.'
      },
      restore: {
        economic: 6.0,
        social: 8.0,
        quadrant: 'Auth-Right',
        rationale: 'Return to meritocratic grammar schools in every borough; eliminate equality and diversity bureaucracy in universities; mandatory civic examinations for school leavers.'
      }
    }
  },
  {
    id: 'welfare',
    name: 'Welfare & Pensions',
    shortName: 'Welfare',
    category: 'welfare',
    topicId: 'pensions-triple-lock-and-national-care',
    description: 'State Pension Triple Lock, disability benefit assessments, Back to Work health devolution, and Child Poverty Strategy.',
    partyCoords: {
      labour: {
        economic: -2.5,
        social: 2.5,
        quadrant: 'Centrist',
        rationale: 'Statutory commitment to State Pension Triple Lock; Get Britain Working white paper devolving health-work hubs to mayors; reform Carer\'s Allowance earnings cliff-edge to £196/wk.'
      },
      conservative: {
        economic: 4.5,
        social: 4.0,
        quadrant: 'Auth-Right',
        rationale: 'Enact Triple Lock Plus to guarantee pensioner tax allowances rise with pensions; reform working-age PIP disability criteria to curb rising welfare spending.'
      },
      reform: {
        economic: 4.0,
        social: 2.0,
        quadrant: 'Auth-Right',
        rationale: 'Retain Triple Lock; raise personal tax allowance to £20,000 so no pensioner pays income tax; enforce 5-year residency rule before foreign nationals can claim welfare; Fraud Strike Force.'
      },
      libdem: {
        economic: -5.5,
        social: -5.5,
        quadrant: 'Lib-Left',
        rationale: 'Abolish the two-child benefit cap and benefit cap immediately; reform Carer\'s Allowance into a progressive taper; establish independent review of disability assessments.'
      },
      green: {
        economic: -9.5,
        social: -8.0,
        quadrant: 'Lib-Left',
        rationale: 'Pilot Universal Basic Income (UBI); scrap the two-child benefit limit; £40/week emergency uplift to all disability benefits; abolish punitive DWP sanctions.'
      },
      snp: {
        economic: -6.0,
        social: -3.5,
        quadrant: 'Lib-Left',
        rationale: 'Deliver £26.70/week Scottish Child Payment for 330,000 children; mitigate UK bedroom tax in Scotland; oppose Westminster conditionality and sanction regimes.'
      },
      plaid: {
        economic: -7.0,
        social: -4.5,
        quadrant: 'Lib-Left',
        rationale: 'Devolve welfare and social security administration to the Senedd; abolish two-child limit; replace outsourced private disability assessors with in-house NHS teams.'
      },
      restore: {
        economic: 3.5,
        social: 7.0,
        quadrant: 'Auth-Right',
        rationale: 'Strict 5-year residency and national insurance contribution rule for any welfare claim; mandatory bi-weekly in-person interviews for under-35 claimants.'
      }
    }
  },
  {
    id: 'immigration',
    name: 'Immigration & Borders',
    shortName: 'Borders',
    category: 'immigration',
    topicId: 'immigration-and-borders',
    description: 'Border Security Command, asylum hotel phase-out, salary thresholds (£38,700), visa caps, and ECHR membership.',
    partyCoords: {
      labour: {
        economic: 1.0,
        social: 4.0,
        quadrant: 'Auth-Right',
        rationale: 'Statutory Border Security Command with counter-terror search and seizure powers; exit expensive asylum hotels/barges; enforce £38,700 salary threshold; returns treaties with safe nations.'
      },
      conservative: {
        economic: 4.5,
        social: 7.5,
        quadrant: 'Auth-Right',
        rationale: 'Introduce legally binding annual statutory cap on all legal visas voted by Parliament; revive third-country deterrent removal scheme; raise dependent thresholds.'
      },
      reform: {
        economic: 7.5,
        social: 9.5,
        quadrant: 'Auth-Right',
        rationale: 'Achieve net zero non-essential immigration; withdraw the UK from the ECHR and UN Refugee Convention; 20% employer immigration levy; offshore detention and deportation.'
      },
      libdem: {
        economic: -2.5,
        social: -6.5,
        quadrant: 'Lib-Left',
        rationale: 'Repeal the Illegal Migration Act 2023; grant asylum seekers the right to work after 3 months; establish safe and legal humanitarian corridors; expand European youth mobility.'
      },
      green: {
        economic: -8.0,
        social: -9.0,
        quadrant: 'Lib-Left',
        rationale: 'Abolish all immigration detention centres; end the hostile environment; grant immediate right to work for asylum seekers; create Climate Refugee visa category.'
      },
      snp: {
        economic: -4.5,
        social: -5.0,
        quadrant: 'Lib-Left',
        rationale: 'Pilot a dedicated Scottish Visa to address rural Highland depopulation and NHS staffing; defend European freedom of movement; humane community dispersal.'
      },
      plaid: {
        economic: -5.5,
        social: -5.5,
        quadrant: 'Lib-Left',
        rationale: 'Deliver Wales as a true "Nation of Sanctuary"; humane community integration with Welsh language lessons; end use of isolated former military sites for asylum accommodation.'
      },
      restore: {
        economic: 7.0,
        social: 10.0,
        quadrant: 'Auth-Right',
        rationale: 'Complete military border lockdown using Royal Navy patrols in the Channel; emergency 5-year freeze on all asylum applications; repeal Human Rights Act.'
      }
    }
  }
];

export const PoliticalMatrix: React.FC<PoliticalMatrixProps> = ({
  parties,
  policies,
  onSelectPartyForCabinet,
  isDark = false,
}) => {
  const [mode, setMode] = useState<MatrixMode>('parties');
  const [activeLensId, setActiveLensId] = useState<string>('overall');
  const [selectedPartyId, setSelectedPartyId] = useState<PartyId>('labour');
  const [selectedPolicyId, setSelectedPolicyId] = useState<string>(policies[0]?.id || 'defence-spending-and-military');
  
  // Head to Head ideological distance calculator
  const [comparePartyA, setComparePartyA] = useState<PartyId>('labour');
  const [comparePartyB, setComparePartyB] = useState<PartyId>('reform');

  // Policy proposals benchmark filter
  const [policyCategoryFilter, setPolicyCategoryFilter] = useState<string>('all');

  const selectedParty = parties.find((p) => p.id === selectedPartyId) || parties[0];
  const partyA = parties.find((p) => p.id === comparePartyA) || parties[0];
  const partyB = parties.find((p) => p.id === comparePartyB) || parties[1];

  // Active Policy Lens
  const activeLens = POLICY_LENSES.find((l) => l.id === activeLensId) || null;
  const isPolicyLensActive = activeLens !== null;

  // Active Policy Topic object from policies.json for pledges
  const activeTopic = isPolicyLensActive
    ? policies.find((p) => p.id === activeLens.topicId || p.category === activeLens.category)
    : null;

  // Selected policy in 'policies' mode
  const selectedPolicy = policies.find((p) => p.id === selectedPolicyId) || policies[0];

  // Resolve coordinate for party on active lens or baseline
  const getPartyActiveCoords = (p: Party) => {
    if (activeLens && activeLens.partyCoords[p.id]) {
      return {
        econ: activeLens.partyCoords[p.id].economic,
        soc: activeLens.partyCoords[p.id].social,
        rationale: activeLens.partyCoords[p.id].rationale,
        quadrant: activeLens.partyCoords[p.id].quadrant
      };
    }
    return {
      econ: p.compass?.economicScore ?? 0,
      soc: p.compass?.socialScore ?? 0,
      rationale: p.compass?.rationale ?? '',
      quadrant: p.compass?.quadrant ?? 'Centrist'
    };
  };

  // Calculate Euclidean ideological distance
  const calcDistance = (p1: Party, p2: Party) => {
    const c1 = getPartyActiveCoords(p1);
    const c2 = getPartyActiveCoords(p2);
    const dist = Math.sqrt(Math.pow(c1.econ - c2.econ, 2) + Math.pow(c1.soc - c2.soc, 2));
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

  // Selected party's active coordinates and baseline shift
  const selectedPartyActiveCoords = getPartyActiveCoords(selectedParty);
  const baselineEcon = selectedParty.compass?.economicScore ?? 0;
  const baselineSoc = selectedParty.compass?.socialScore ?? 0;
  const shiftEcon = Number((selectedPartyActiveCoords.econ - baselineEcon).toFixed(1));
  const shiftSoc = Number((selectedPartyActiveCoords.soc - baselineSoc).toFixed(1));

  // Selected party's pledge on the active policy lens
  const partyPledge = activeTopic?.pledges?.[selectedPartyId];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400 font-bold text-xs uppercase tracking-wider mb-1">
            <Compass className="w-4 h-4" />
            <span>Ideological Mapping & Multi-Axis Spectrum</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
            Political Compass & Policy Ideology Matrix
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Examine the overall ideological alignment of all 8 UK political parties, then click any policy sector below to see how each party shifts and where they lie on that specific policy debate.
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex flex-wrap sm:flex-nowrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 max-w-full">
          <button
            onClick={() => setMode('parties')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'parties'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
            <span>Party Compass & Policy Lenses</span>
          </button>
          <button
            onClick={() => setMode('policies')}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              mode === 'policies'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span>Policy Proposals Benchmark</span>
          </button>
        </div>
      </div>

      {/* Axis Definition Guidance Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        <div className="bg-gradient-to-r from-rose-50 to-blue-50 dark:from-rose-950/20 dark:to-blue-950/20 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-start space-x-3">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-2xs shrink-0 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Scale className="w-4 h-4 text-rose-600 dark:text-rose-400" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs mb-0.5">Horizontal Axis: Economic Policy (Left ↔ Right)</span>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              <strong>Left (-10):</strong> Wealth taxes, public ownership of rail/energy/water, universal services, progressive redistribution.<br />
              <strong>Right (+10):</strong> Deregulation, competitive markets, lower corporation tax, private school relief, fiscal shrinking.
            </p>
          </div>
        </div>

        <div className="bg-gradient-to-r from-emerald-50 to-purple-50 dark:from-emerald-950/20 dark:to-purple-950/20 border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 flex items-start space-x-3">
          <div className="p-2 bg-white dark:bg-slate-800 rounded-lg shadow-2xs shrink-0 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            <Sliders className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block text-xs mb-0.5">Vertical Axis: Social & Governance (Authoritarian ↔ Libertarian)</span>
            <p className="text-slate-600 dark:text-slate-300 text-[11px] leading-relaxed">
              <strong>Authoritarian (+10, Top):</strong> Strict border controls, leaving ECHR, mandatory national service, law enforcement.<br />
              <strong>Libertarian (-10, Bottom):</strong> Civil liberties, human rights protections, freedom of movement, drug law reform.
            </p>
          </div>
        </div>
      </div>

      {/* Policy Area Lens Bar (Only in 'parties' mode) */}
      {mode === 'parties' && (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <Crosshair className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                Policy Area Lens: Select an Issue to See Where Parties Lie
              </h3>
            </div>
            {isPolicyLensActive && (
              <button
                onClick={() => setActiveLensId('overall')}
                className="inline-flex items-center space-x-1.5 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 cursor-pointer self-start sm:self-auto bg-indigo-50 dark:bg-indigo-950/60 px-2.5 py-1 rounded-lg border border-indigo-200 dark:border-indigo-800"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset to Overall Party Alignment</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {/* Overall baseline pill */}
            <button
              onClick={() => setActiveLensId('overall')}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                activeLensId === 'overall'
                  ? 'bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300 dark:ring-indigo-700'
                  : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <span>🌐</span>
              <span>Overall Party Alignment</span>
            </button>

            {/* Individual policy area lenses */}
            {POLICY_LENSES.map((lens) => {
              const isLensActive = activeLensId === lens.id;
              const iconsMap: Record<string, string> = {
                defence: '🛡️',
                nhs: '🏥',
                economy: '📈',
                housing: '🏡',
                energy: '⚡',
                education: '🎓',
                welfare: '🤝',
                immigration: '🛂'
              };

              return (
                <button
                  key={lens.id}
                  onClick={() => setActiveLensId(lens.id)}
                  className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    isLensActive
                      ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs ring-2 ring-indigo-400 dark:ring-indigo-500'
                      : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700'
                  }`}
                >
                  <span>{iconsMap[lens.id] || '📌'}</span>
                  <span>{lens.name}</span>
                </button>
              );
            })}
          </div>

          {isPolicyLensActive && (
            <div className="bg-indigo-50/60 dark:bg-indigo-950/40 p-3 rounded-xl border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
              <div>
                <span className="font-extrabold block text-indigo-950 dark:text-indigo-100">
                  Active Lens: {activeLens.name}
                </span>
                <span className="text-[11px] text-indigo-700 dark:text-indigo-300">
                  {activeLens.description} Party pins repositioned to show exact stance on this issue. Faint circles indicate baseline positions.
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid & Inspector Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* 2D Interactive SVG Compass Canvas (7 cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Crosshair className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h3 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                {mode === 'parties' 
                  ? (isPolicyLensActive ? `Parties on ${activeLens.name}` : 'UK Political Parties on the 2D Spectrum') 
                  : 'Key Policy Proposals on the 2D Spectrum'}
              </h3>
            </div>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Interactive Canvas • Click to Inspect
            </span>
          </div>

          {/* SVG 2D Canvas */}
          <div className="relative w-full aspect-square max-w-[560px] mx-auto bg-slate-50/50 dark:bg-slate-950 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-inner">
            {/* Quadrant Tint Overlays */}
            <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 pointer-events-none">
              {/* Top-Left: Authoritarian Left */}
              <div className="bg-rose-500/5 dark:bg-rose-500/10 p-3 flex flex-col justify-start items-start border-r border-b border-dashed border-slate-300 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800/80 dark:text-rose-300 bg-rose-100/80 dark:bg-rose-950/80 px-2 py-0.5 rounded">
                  Authoritarian Left
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:inline">State Regulation & Public Delivery</span>
              </div>
              {/* Top-Right: Authoritarian Right */}
              <div className="bg-blue-500/5 dark:bg-blue-500/10 p-3 flex flex-col justify-start items-end border-b border-dashed border-slate-300 dark:border-slate-800">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-800/80 dark:text-blue-300 bg-blue-100/80 dark:bg-blue-950/80 px-2 py-0.5 rounded">
                  Authoritarian Right
                </span>
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mt-0.5 hidden sm:inline">National Security & Market Order</span>
              </div>
              {/* Bottom-Left: Libertarian Left */}
              <div className="bg-emerald-500/5 dark:bg-emerald-500/10 p-3 flex flex-col justify-end items-start border-r border-dashed border-slate-300 dark:border-slate-800">
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-0.5 hidden sm:inline">Democratic Social Liberties & Green Rights</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800/80 dark:text-emerald-300 bg-emerald-100/80 dark:bg-emerald-950/80 px-2 py-0.5 rounded">
                  Libertarian Left
                </span>
              </div>
              {/* Bottom-Right: Libertarian Right */}
              <div className="bg-amber-500/5 dark:bg-amber-500/10 p-3 flex flex-col justify-end items-end">
                <span className="text-[9px] text-slate-400 dark:text-slate-500 mb-0.5 hidden sm:inline">Free-Market Libertarianism & Deregulation</span>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800/80 dark:text-amber-300 bg-amber-100/80 dark:bg-amber-950/80 px-2 py-0.5 rounded">
                  Libertarian Right
                </span>
              </div>
            </div>

            {/* SVG Elements */}
            <svg viewBox="0 0 600 600" className="w-full h-full relative z-10">
              {/* Sub-grid lines */}
              <g stroke={isDark ? '#334155' : '#cbd5e1'} strokeWidth="0.8" strokeDasharray="3 3">
                <line x1="175" y1="40" x2="175" y2="560" />
                <line x1="425" y1="40" x2="425" y2="560" />
                <line x1="40" y1="175" x2="560" y2="175" />
                <line x1="40" y1="425" x2="560" y2="425" />
              </g>

              {/* Major Axes */}
              <g stroke={isDark ? '#94a3b8' : '#64748b'} strokeWidth="1.8">
                {/* Horizontal X Axis */}
                <line x1="30" y1="300" x2="570" y2="300" />
                {/* Vertical Y Axis */}
                <line x1="300" y1="30" x2="300" y2="570" />
              </g>

              {/* Axis Label Ticks */}
              <text x="50" y="295" fontSize="11" fontWeight="bold" fill={isDark ? '#94a3b8' : '#64748b'} textAnchor="start">← ECONOMIC LEFT</text>
              <text x="550" y="295" fontSize="11" fontWeight="bold" fill={isDark ? '#94a3b8' : '#64748b'} textAnchor="end">ECONOMIC RIGHT →</text>
              <text x="305" y="45" fontSize="11" fontWeight="bold" fill={isDark ? '#94a3b8' : '#64748b'} textAnchor="start">↑ AUTHORITARIAN</text>
              <text x="305" y="565" fontSize="11" fontWeight="bold" fill={isDark ? '#94a3b8' : '#64748b'} textAnchor="start">↓ LIBERTARIAN</text>

              {/* ---------------- PLOTTING: PARTIES MODE (WITH POLICY LENS) ---------------- */}
              {mode === 'parties' && parties.map((p) => {
                const activeCoords = getPartyActiveCoords(p);
                const { x, y } = toSvgCoords(activeCoords.econ, activeCoords.soc);

                // Baseline coordinates for displacement vector
                const baseEcon = p.compass?.economicScore ?? 0;
                const baseSoc = p.compass?.socialScore ?? 0;
                const { x: baseX, y: baseY } = toSvgCoords(baseEcon, baseSoc);
                const hasShifted = isPolicyLensActive && (baseX !== x || baseY !== y);

                const isSelected = selectedPartyId === p.id;

                return (
                  <g key={p.id}>
                    {/* If policy lens is active, draw ghost baseline pin and vector line */}
                    {hasShifted && (
                      <g className="pointer-events-none">
                        {/* Connecting displacement vector */}
                        <line
                          x1={baseX}
                          y1={baseY}
                          x2={x}
                          y2={y}
                          stroke={p.color}
                          strokeWidth="1.6"
                          strokeDasharray="3 3"
                          opacity={0.55}
                        />
                        {/* Ghost baseline indicator */}
                        <circle
                          cx={baseX}
                          cy={baseY}
                          r="7"
                          fill={p.color}
                          fillOpacity={0.2}
                          stroke={p.color}
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                        <text
                          x={baseX}
                          y={baseY + 2.5}
                          textAnchor="middle"
                          fontSize="6.5"
                          fontWeight="bold"
                          fill={isDark ? '#94a3b8' : '#64748b'}
                          opacity={0.7}
                        >
                          base
                        </text>
                      </g>
                    )}

                    {/* Active Party Pin Group */}
                    <g
                      onClick={() => setSelectedPartyId(p.id)}
                      className="cursor-pointer transition-all duration-300"
                      transform={`translate(${x}, ${y})`}
                    >
                      {/* Active highlight pulse aura */}
                      {isSelected && (
                        <circle
                          r="25"
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
                        stroke={isDark ? '#0f172a' : '#ffffff'}
                        strokeWidth="2.5"
                        className="transition-transform hover:scale-115 drop-shadow-md"
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
                          x="-42"
                          y="-7"
                          width="84"
                          height="15"
                          rx="4"
                          fill={isDark ? '#1e293b' : '#ffffff'}
                          stroke={isSelected ? p.color : isDark ? '#334155' : '#e2e8f0'}
                          strokeWidth={isSelected ? '1.5' : '1'}
                          filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
                        />
                        <text
                          textAnchor="middle"
                          y="4"
                          fontSize="8"
                          fontWeight={isSelected ? '800' : '600'}
                          fill={isDark ? '#f8fafc' : '#0f172a'}
                        >
                          {p.shortName} ({activeCoords.econ > 0 ? `+${activeCoords.econ}` : activeCoords.econ}, {activeCoords.soc > 0 ? `+${activeCoords.soc}` : activeCoords.soc})
                        </text>
                      </g>
                    </g>
                  </g>
                );
              })}

              {/* ---------------- PLOTTING: POLICIES BENCHMARK MODE ---------------- */}
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
                      fill={isSelected ? '#4f46e5' : isDark ? '#334155' : '#0f172a'}
                      stroke={isDark ? '#0f172a' : '#ffffff'}
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
                        fill={isDark ? '#1e293b' : '#ffffff'}
                        stroke={isSelected ? '#4f46e5' : isDark ? '#334155' : '#e2e8f0'}
                        strokeWidth={isSelected ? '1.5' : '1'}
                        filter="drop-shadow(0 1px 2px rgba(0,0,0,0.1))"
                      />
                      <text
                        textAnchor="middle"
                        y="4"
                        fontSize="8"
                        fontWeight={isSelected ? '800' : '600'}
                        fill={isDark ? '#f8fafc' : '#0f172a'}
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
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
                Inspect Party:
              </span>
              {parties.map((p) => {
                const isActive = selectedPartyId === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => setSelectedPartyId(p.id)}
                    className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: p.color }} />
                    <span>{p.shortName}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Quick Policy Category Filter Pills (in 'policies' mode) */}
          {mode === 'policies' && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2">
              <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mr-1">
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
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    policyCategoryFilter === c.id
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
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
          {/* Party Dossier Inspector (in 'parties' mode) */}
          {mode === 'parties' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div className="flex items-center space-x-3">
                  <div 
                    className="w-11 h-11 rounded-xl flex items-center justify-center font-black text-white text-base shadow-sm shrink-0"
                    style={{ backgroundColor: selectedParty.color }}
                  >
                    {selectedParty.avatarText}
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg leading-snug">
                      {selectedParty.name}
                    </h3>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-medium block">
                      Leader: {selectedParty.leader} ({selectedParty.leaderTitle})
                    </span>
                  </div>
                </div>
                <span className="text-xs font-extrabold px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 shrink-0">
                  {selectedParty.seats} MPs
                </span>
              </div>

              {/* Active Lens Context Banner */}
              {isPolicyLensActive ? (
                <div className="bg-indigo-50/70 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-800/80 rounded-xl p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                      Issue Stance: {activeLens.name}
                    </span>
                    <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-indigo-600 text-white shadow-2xs">
                      {selectedPartyActiveCoords.quadrant}
                    </span>
                  </div>

                  {/* Coordinates & Shift from baseline */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-indigo-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Economic Score</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {selectedPartyActiveCoords.econ > 0 ? `+${selectedPartyActiveCoords.econ}` : selectedPartyActiveCoords.econ}
                      </span>
                      {shiftEcon !== 0 && (
                        <span className={`text-[10px] font-bold block ${shiftEcon > 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
                          {shiftEcon > 0 ? `+${shiftEcon} to Right` : `${shiftEcon} to Left`}
                        </span>
                      )}
                    </div>

                    <div className="bg-white dark:bg-slate-800 p-2 rounded-lg border border-indigo-100 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block">Social / Governance</span>
                      <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                        {selectedPartyActiveCoords.soc > 0 ? `+${selectedPartyActiveCoords.soc}` : selectedPartyActiveCoords.soc}
                      </span>
                      {shiftSoc !== 0 && (
                        <span className={`text-[10px] font-bold block ${shiftSoc > 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                          {shiftSoc > 0 ? `+${shiftSoc} Auth` : `${shiftSoc} Libertarian`}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-indigo-950 dark:text-indigo-200 leading-relaxed font-medium pt-1">
                    {selectedPartyActiveCoords.rationale}
                  </p>
                </div>
              ) : (
                /* Overall Spectrum Position Banner */
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Overall Baseline Position
                    </span>
                    <span className="text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-950/70 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                      {selectedParty.compass?.quadrant || 'Ideological Quadrant'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Economic Score</span>
                      <span className="text-base font-black text-slate-900 dark:text-slate-100">
                        {selectedParty.compass && selectedParty.compass.economicScore > 0 ? `+${selectedParty.compass.economicScore}` : selectedParty.compass?.economicScore} / 10
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                        {selectedParty.compass && selectedParty.compass.economicScore < 0 ? 'Left-wing / Public State' : 'Right-wing / Market-first'}
                      </span>
                    </div>
                    <div className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 block">Social / Governance</span>
                      <span className="text-base font-black text-slate-900 dark:text-slate-100">
                        {selectedParty.compass && selectedParty.compass.socialScore > 0 ? `+${selectedParty.compass.socialScore}` : selectedParty.compass?.socialScore} / 10
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-slate-500 block mt-0.5">
                        {selectedParty.compass && selectedParty.compass.socialScore < 0 ? 'Civil Libertarian' : 'Authoritarian / Traditional'}
                      </span>
                    </div>
                  </div>

                  {/* Ideological Blueprint */}
                  <div className="space-y-1.5 pt-1">
                    <h4 className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 flex items-center space-x-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                      <span>Ideological Blueprint & 2026 Rationale</span>
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium bg-white dark:bg-slate-800/80 p-3 rounded-xl border border-slate-200/80 dark:border-slate-700">
                      {selectedParty.compass?.rationale}
                    </p>
                  </div>
                </div>
              )}

              {/* Policy Pledge Deep-Dive if a policy lens is active */}
              {isPolicyLensActive && partyPledge && (
                <div className="space-y-3 pt-1 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center space-x-2">
                    <FileText className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h4 className="font-extrabold text-xs uppercase tracking-wider text-slate-900 dark:text-slate-100">
                      Official 2026 Manifesto Pledge
                    </h4>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                    <h5 className="font-bold text-sm text-slate-900 dark:text-slate-100 leading-snug">
                      {partyPledge.headline}
                    </h5>

                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {partyPledge.summary}
                    </p>

                    {partyPledge.keyPoints && partyPledge.keyPoints.length > 0 && (
                      <ul className="space-y-1.5 pt-1">
                        {partyPledge.keyPoints.slice(0, 3).map((pt, idx) => (
                          <li key={idx} className="flex items-start space-x-2 text-xs text-slate-700 dark:text-slate-300">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-700">
                      {partyPledge.costEstimate && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-slate-200/70 dark:bg-slate-700 text-slate-800 dark:text-slate-200">
                          Cost: {partyPledge.costEstimate}
                        </span>
                      )}
                      {partyPledge.targetTimeline && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                          {partyPledge.targetTimeline}
                        </span>
                      )}
                      {partyPledge.officialSourceUrl && (
                        <a
                          href={partyPledge.officialSourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1 ml-auto"
                        >
                          <span>{partyPledge.officialSourceTitle || 'Official Manifesto'}</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Party Motto & Description */}
              <div className="text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800 pt-3">
                <span className="italic block text-slate-600 dark:text-slate-300 font-medium mb-1">
                  "{selectedParty.motto}"
                </span>
                <p className="line-clamp-2 text-[11px] leading-relaxed">
                  {selectedParty.description}
                </p>
              </div>
            </div>
          )}

          {/* Policy Proposals Inspector (in 'policies' mode) */}
          {mode === 'policies' && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
              <div className="flex items-start justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60 px-2 py-0.5 rounded">
                    {selectedPolicy.category.toUpperCase()}
                  </span>
                  <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-lg leading-snug mt-1.5">
                    {selectedPolicy.title}
                  </h3>
                </div>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3.5 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Policy Coordinates:</span>
                  <span className="font-extrabold text-slate-900 dark:text-slate-100">
                    Economic: {selectedPolicy.compass?.economic} • Social: {selectedPolicy.compass?.social}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400 font-medium">Ideological Sector:</span>
                  <span className="font-extrabold text-indigo-700 dark:text-indigo-300 bg-white dark:bg-slate-800 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700">
                    {selectedPolicy.compass?.quadrant}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                  {selectedPolicy.compass?.summary}
                </p>
              </div>

              {/* Official Benchmark */}
              {selectedPolicy.officialFigureBenchmark && (
                <div className="bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/60 rounded-xl p-3 space-y-1">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 dark:text-emerald-300 block">
                    {selectedPolicy.officialFigureBenchmark.label}
                  </span>
                  <span className="text-xs font-bold text-emerald-950 dark:text-emerald-200 block">
                    {selectedPolicy.officialFigureBenchmark.value}
                  </span>
                  <span className="text-[10px] text-emerald-700 dark:text-emerald-400 block">
                    Source: {selectedPolicy.officialFigureBenchmark.source}
                  </span>
                </div>
              )}

              {/* Public Opinion */}
              {selectedPolicy.publicOpinionQuestion && (
                <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs space-y-1.5">
                  <span className="text-[10px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Public Sentiment Benchmark</span>
                  <p className="text-slate-700 dark:text-slate-300 font-medium italic text-[11px]">
                    "{selectedPolicy.publicOpinionQuestion}"
                  </p>
                  <div className="flex items-center space-x-2 pt-1">
                    <span className="text-xs font-extrabold text-rose-700 dark:text-rose-400">
                      {selectedPolicy.publicOpinionSupportOverall}% Public Support
                    </span>
                    <div className="flex-1 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
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
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-rose-400 font-bold text-xs uppercase tracking-wider">
                <Scale className="w-4 h-4" />
                <span>Ideological Proximity Index</span>
              </div>
              <span className="text-[10px] font-bold text-slate-400 px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                {isPolicyLensActive ? `Lens: ${activeLens.shortName}` : 'Overall Spectrum'}
              </span>
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
              Calculates Euclidean vector distance: &radic;(&Delta;Econ&sup2; + &Delta;Soc&sup2;). Comparing <strong>{partyA.shortName}</strong> against <strong>{partyB.shortName}</strong> {isPolicyLensActive ? `on ${activeLens.name}` : 'on Overall Platform'}.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
