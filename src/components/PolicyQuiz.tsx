import React, { useState } from 'react';
import { Party, PartyId } from '../types/politics';
import { HelpCircle, CheckCircle, RotateCcw, Award, ChevronRight } from 'lucide-react';

interface PolicyQuizProps {
  parties: Party[];
}

interface Question {
  id: number;
  category: string;
  question: string;
  options: {
    text: string;
    affinities: Partial<Record<PartyId, number>>;
  }[];
}

export const PolicyQuiz: React.FC<PolicyQuizProps> = ({ parties }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [scores, setScores] = useState<Record<PartyId, number>>({
    labour: 0,
    conservative: 0,
    reform: 0,
    libdem: 0,
    green: 0,
    snp: 0,
    plaid: 0,
    restore: 0,
  });
  const [quizFinished, setQuizFinished] = useState(false);

  const questions: Question[] = [
    {
      id: 1,
      category: 'Military & Defence',
      question: 'What should be the UK’s defence policy priority?',
      options: [
        {
          text: 'Reach 2.5% of GDP responsibly via a Strategic Defence Review and close EU security pacts.',
          affinities: { labour: 3, libdem: 2 },
        },
        {
          text: 'Legislate a firm 2.5% of GDP target by 2030 funded strictly by cutting back-office civil servants.',
          affinities: { conservative: 3 },
        },
        {
          text: 'Surge defence spending to 3% of GDP, expand the regular army to 100,000, and focus on territorial homeland defence.',
          affinities: { reform: 3, restore: 3 },
        },
        {
          text: 'Scrap the Trident nuclear weapons system and redirect billions into international diplomacy, peacekeeping, and climate resilience.',
          affinities: { green: 3, snp: 2, plaid: 2 },
        },
      ],
    },
    {
      id: 2,
      category: 'Economy & Tax',
      question: 'How should the UK balance public finances and taxation?',
      options: [
        {
          text: 'Do not raise income tax or VAT rates; reform borrowing rules to enable capital infrastructure investment.',
          affinities: { labour: 3 },
        },
        {
          text: 'Cut corporation tax and roll back business regulations; shrink welfare rolls and stop state spending growth.',
          affinities: { conservative: 3 },
        },
        {
          text: 'Raise the income tax-free allowance to £20,000 to help low earners and slash corporation tax to 15%.',
          affinities: { reform: 3 },
        },
        {
          text: 'Introduce a 1%–2% annual wealth tax on multi-millionaires and tax capital gains at the same rate as employment income.',
          affinities: { green: 3, snp: 2, plaid: 2, libdem: 1 },
        },
      ],
    },
    {
      id: 3,
      category: 'NHS & Healthcare',
      question: 'What is the best way to fix NHS waiting lists and care backlogs?',
      options: [
        {
          text: 'Deliver 40,000 extra weekend/evening appointments a week, utilise spare private hospital capacity for NHS patients for free, and digitalize care.',
          affinities: { labour: 3 },
        },
        {
          text: 'Give every patient an independent healthcare voucher paid by the state if they wait over 31 days.',
          affinities: { reform: 3, restore: 2 },
        },
        {
          text: 'Introduce a legal right to see a GP within 7 days, hire 8,000 more family doctors, and fund free personal adult social care.',
          affinities: { libdem: 3, snp: 2 },
        },
        {
          text: 'Inject £50bn funded by wealth taxes, give doctors full pay restoration, and permanently ban all private involvement in the NHS.',
          affinities: { green: 3 },
        },
      ],
    },
    {
      id: 4,
      category: 'Immigration & Borders',
      question: 'How should the government manage immigration and border control?',
      options: [
        {
          text: 'Create an elite Border Security Command to break smuggler gangs and require sectors using visas to train domestic workers.',
          affinities: { labour: 3 },
        },
        {
          text: 'Set an annual statutory legal cap on total visas and restore third-country deportation deterrence.',
          affinities: { conservative: 3 },
        },
        {
          text: 'Institute a complete freeze on non-essential immigration, leave the ECHR, and return all small boats to France.',
          affinities: { reform: 3, restore: 3 },
        },
        {
          text: 'Transfer asylum processing to an independent agency, allow asylum seekers to work after 3 months, and devolve work visas to nations.',
          affinities: { libdem: 2, green: 3, snp: 2, plaid: 2 },
        },
      ],
    },
    {
      id: 5,
      category: 'Energy & Climate',
      question: 'What is your vision for Britain’s energy future and Net Zero?',
      options: [
        {
          text: 'Create Great British Energy, stop new North Sea exploration licenses, and achieve 100% clean power by 2030.',
          affinities: { labour: 3 },
        },
        {
          text: 'Keep the 2050 Net Zero target but protect consumers by holding annual North Sea oil & gas licensing rounds and rolling out mini nuclear reactors.',
          affinities: { conservative: 3 },
        },
        {
          text: 'Scrap Net Zero targets and green levies completely to cut bills; aggressively extract British oil, gas, and shale gas.',
          affinities: { reform: 3, restore: 3 },
        },
        {
          text: 'Bring the Net Zero target forward to 2040, nationalise energy utilities, and quadruple wind, solar, and tidal power.',
          affinities: { green: 3, snp: 2, plaid: 2 },
        },
      ],
    },
  ];

  const handleSelectOption = (affinities: Partial<Record<PartyId, number>>) => {
    const updated = { ...scores };
    Object.entries(affinities).forEach(([partyId, points]) => {
      const p = partyId as PartyId;
      updated[p] = (updated[p] || 0) + (points || 0);
    });
    setScores(updated);

    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScores({
      labour: 0,
      conservative: 0,
      reform: 0,
      libdem: 0,
      green: 0,
      snp: 0,
      plaid: 0,
      restore: 0,
    });
    setQuizFinished(false);
  };

  // Calculate percentages
  const maxPossible = 15;
  const sortedResults = Object.entries(scores)
    .map(([partyId, score]) => {
      const party = parties.find((p) => p.id === partyId);
      const matchPct = Math.min(100, Math.round((score / maxPossible) * 100));
      return { party, matchPct, score };
    })
    .sort((a, b) => b.score - a.score);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Intro */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs text-center">
        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
          "Where Do You Stand?" Blind Policy Matcher
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          Answer 5 straightforward policy questions without seeing party labels. We'll match your real choices with official UK party manifestos.
        </p>
      </div>

      {!quizFinished ? (
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          {/* Question progress */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
            <span className="uppercase text-rose-600 tracking-wider">
              {questions[currentQuestion].category}
            </span>
            <span>Question {currentQuestion + 1} of {questions.length}</span>
          </div>

          <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-slate-900 h-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900">
            {questions[currentQuestion].question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {questions[currentQuestion].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelectOption(opt.affinities)}
                className="w-full p-4 text-left rounded-xl border border-slate-200 hover:border-slate-900 hover:bg-slate-50/80 transition-all text-xs sm:text-sm text-slate-800 font-medium flex items-center justify-between group"
              >
                <span>{opt.text}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-900 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Your Political Alignment Results</h3>
            <p className="text-xs text-slate-500 mt-0.5">Based on your stances on defence, economy, NHS, immigration, and energy</p>
          </div>

          {/* Match rankings */}
          <div className="space-y-3">
            {sortedResults.map((res, index) => {
              if (!res.party) return null;
              return (
                <div
                  key={res.party.id}
                  className="p-3.5 rounded-xl border border-slate-100 bg-slate-50 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-xs font-bold text-slate-400 w-4">#{index + 1}</span>
                    <span 
                      className="w-3.5 h-3.5 rounded-full" 
                      style={{ backgroundColor: res.party.color }}
                    />
                    <div>
                      <span className="font-bold text-sm text-slate-900 block">{res.party.name}</span>
                      <span className="text-[11px] text-slate-500">{res.party.leader}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <div className="w-20 sm:w-28 bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div 
                        className="h-full rounded-full" 
                        style={{ 
                          width: `${res.matchPct}%`,
                          backgroundColor: res.party.color 
                        }}
                      />
                    </div>
                    <span className="font-bold text-xs text-slate-800 w-10 text-right">
                      {res.matchPct}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reset button */}
          <div className="text-center pt-2">
            <button
              onClick={resetQuiz}
              className="inline-flex items-center space-x-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Retake Policy Quiz</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
