import React, { useState } from 'react';
import { Party, PartyId } from '../types/politics';
import { HelpCircle, CheckCircle, RotateCcw, Award, ChevronRight, Compass } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Cell } from 'recharts';
import quizQuestionsData from '../data/quizQuestions.json';

interface PolicyQuizProps {
  parties: Party[];
}

interface IdeologicalVector {
  economic: number;
  social: number;
}

interface Question {
  id: number;
  category: string;
  question: string;
  options: {
    text: string;
    affinities: Partial<Record<PartyId, number>>;
    ideologicalVector: IdeologicalVector;
  }[];
}

const questions = quizQuestionsData as Question[];

export const PolicyQuiz: React.FC<PolicyQuizProps> = ({ parties }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  
  // Scoring state
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

  const [vectorTotals, setVectorTotals] = useState<IdeologicalVector>({ economic: 0, social: 0 });
  
  const [quizFinished, setQuizFinished] = useState(false);

  const handleSelectOption = (
    affinities: Partial<Record<PartyId, number>>,
    vector: IdeologicalVector
  ) => {
    // 1. Update affinity scores
    const updated = { ...scores };
    Object.entries(affinities).forEach(([partyId, points]) => {
      const p = partyId as PartyId;
      updated[p] = (updated[p] || 0) + (points || 0);
    });
    setScores(updated);

    // 2. Update vector totals
    setVectorTotals(prev => ({
      economic: prev.economic + vector.economic,
      social: prev.social + vector.social,
    }));

    // 3. Move to next or finish
    if (currentQuestion + 1 < questions.length) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      setQuizFinished(true);
    }
  };

  const resetQuiz = () => {
    setCurrentQuestion(0);
    setScores({
      labour: 0, conservative: 0, reform: 0, libdem: 0,
      green: 0, snp: 0, plaid: 0, restore: 0,
    });
    setVectorTotals({ economic: 0, social: 0 });
    setQuizFinished(false);
  };

  // Calculate percentage rankings based on affinity scores
  const maxPossible = questions.length * 3; // Max 3 points per question
  const sortedResults = Object.entries(scores)
    .map(([partyId, score]) => {
      const party = parties.find((p) => p.id === partyId);
      const matchPct = Math.min(100, Math.round((score / maxPossible) * 100));
      return { party, matchPct, score };
    })
    .sort((a, b) => b.score - a.score);

  // Calculate final ideological coordinates (averages)
  const finalX = parseFloat((vectorTotals.economic / questions.length).toFixed(2));
  const finalY = parseFloat((vectorTotals.social / questions.length).toFixed(2));

  // Determine quadrant for textual analysis
  let quadrantAnalysis = "";
  if (finalX <= 0 && finalY >= 0) {
    quadrantAnalysis = "You land in the **Authoritarian Left** quadrant. This indicates a preference for state economic intervention (such as nationalisation or heavier taxation on wealth) alongside stricter social rules or firmer state control over borders and security.";
  } else if (finalX <= 0 && finalY < 0) {
    quadrantAnalysis = "You land in the **Libertarian Left** quadrant. You generally support redistributive economics and well-funded public services, coupled with strong support for civil liberties, social progressivism, and internationalism.";
  } else if (finalX > 0 && finalY >= 0) {
    quadrantAnalysis = "You land in the **Authoritarian Right** quadrant. You tend to favor free-market economics and lower taxation, combined with traditionalist social values, strict law and order, and strong national sovereignty.";
  } else {
    quadrantAnalysis = "You land in the **Libertarian Right** quadrant. You strongly support free markets, deregulation, and low taxes, paired with a preference for personal liberty and minimal state interference in social matters.";
  }

  // Prep data for ScatterChart
  const partyNodes = parties.map(p => ({
    name: p.shortName,
    x: p.compass?.economicScore ?? 0,
    y: p.compass?.socialScore ?? 0,
    color: p.color,
    isUser: false
  }));

  const userNode = {
    name: "You",
    x: finalX,
    y: finalY,
    color: "#000000",
    isUser: true
  };

  const chartData = [...partyNodes, userNode];

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Intro */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs text-center">
        <div className="w-12 h-12 bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 rounded-2xl flex items-center justify-center mx-auto mb-3">
          <HelpCircle className="w-6 h-6" />
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100">
          "Where Do You Stand?" Blind Policy Matcher
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
          Answer {questions.length} straightforward policy questions without seeing party labels. We'll plot your exact ideological coordinates and match you with official UK party manifestos.
        </p>
      </div>

      {!quizFinished ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          {/* Question progress */}
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span className="uppercase text-rose-600 dark:text-rose-400 tracking-wider">
              {questions[currentQuestion].category}
            </span>
            <span>Question {currentQuestion + 1} of {questions.length}</span>
          </div>

          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-slate-900 dark:bg-blue-500 h-full transition-all duration-300"
              style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
            />
          </div>

          {/* Question Text */}
          <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100">
            {questions[currentQuestion].question}
          </h3>

          {/* Options */}
          <div className="space-y-3">
            {questions[currentQuestion].options.map((opt, i) => (
              <button
                key={i}
                onClick={() => handleSelectOption(opt.affinities, opt.ideologicalVector)}
                className="w-full p-4 text-left rounded-xl border border-slate-200 dark:border-slate-700 hover:border-slate-900 dark:hover:border-blue-500 hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-all text-sm text-slate-800 dark:text-slate-200 font-medium flex items-center justify-between group cursor-pointer"
              >
                <span>{opt.text}</span>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-blue-400 shrink-0 ml-2" />
              </button>
            ))}
          </div>
        </div>
      ) : (
        /* Results View */
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-8">
          <div className="text-center">
            <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-2">
              <Award className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100">Your Political Alignment</h3>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">Based on {questions.length} cross-sector policy decisions.</p>
          </div>

          {/* New Matrix Analysis Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center border-t border-b border-slate-100 dark:border-slate-800 py-6">
            <div className="space-y-4">
              <div className="flex items-center space-x-2 text-indigo-600 dark:text-indigo-400">
                <Compass className="w-5 h-5" />
                <h4 className="font-bold text-lg text-slate-900 dark:text-slate-100">Ideological Compass</h4>
              </div>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed" dangerouslySetInnerHTML={{__html: quadrantAnalysis.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')}}></p>
              
              <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-100 dark:border-slate-800">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-500 dark:text-slate-400">Economic Axis (Left/Right)</span>
                  <span className="font-mono font-bold dark:text-slate-200">{finalX > 0 ? '+' : ''}{finalX}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500 dark:text-slate-400">Social Axis (Lib/Auth)</span>
                  <span className="font-mono font-bold dark:text-slate-200">{finalY > 0 ? '+' : ''}{finalY}</span>
                </div>
              </div>
            </div>

            {/* Scatter Chart Mini-Matrix */}
            <div className="h-64 sm:h-72 w-full bg-slate-50 dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-700 p-2 relative overflow-hidden">
                {/* Axis Labels Overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400">AUTHORITARIAN</span>
                  <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-bold text-slate-400">LIBERTARIAN</span>
                  <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 -rotate-90">LEFT (STATE)</span>
                  <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-bold text-slate-400 rotate-90">RIGHT (MARKET)</span>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" className="dark:stroke-slate-800" />
                    <XAxis type="number" dataKey="x" domain={[-5, 5]} hide />
                    <YAxis type="number" dataKey="y" domain={[-5, 5]} hide />
                    <Tooltip 
                      cursor={{strokeDasharray: '3 3'}}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-white dark:bg-slate-800 p-2 rounded shadow-lg border border-slate-100 dark:border-slate-700 text-xs">
                              <span className="font-bold dark:text-white">{data.name}</span>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine x={0} stroke="#94a3b8" className="dark:stroke-slate-600" />
                    <ReferenceLine y={0} stroke="#94a3b8" className="dark:stroke-slate-600" />
                    <Scatter data={chartData}>
                      {chartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.isUser ? (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000') : entry.color} 
                          opacity={entry.isUser ? 1 : 0.4} 
                          r={entry.isUser ? 8 : 6}
                          stroke={entry.isUser ? (document.documentElement.classList.contains('dark') ? '#ffffff' : '#000000') : 'none'}
                          strokeWidth={2}
                        />
                      ))}
                    </Scatter>
                  </ScatterChart>
                </ResponsiveContainer>
            </div>
          </div>

          {/* Match rankings */}
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 mb-3">Manifesto Match Breakdown</h4>
            <div className="space-y-3">
              {sortedResults.map((res, index) => {
                if (!res.party) return null;
                // Highlight the top match slightly
                const isTop = index === 0;
                return (
                  <div
                    key={res.party.id}
                    className={`p-3.5 rounded-xl border flex items-center justify-between gap-3 ${
                      isTop 
                        ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' 
                        : 'bg-slate-50 dark:bg-slate-800/60 border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className={`text-xs font-bold w-4 ${isTop ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}`}>
                        #{index + 1}
                      </span>
                      <span 
                        className="w-3.5 h-3.5 rounded-full" 
                        style={{ backgroundColor: res.party.color }}
                      />
                      <div>
                        <span className="font-bold text-sm text-slate-900 dark:text-slate-100 block">{res.party.name}</span>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400">{res.party.leader}</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <div className="w-20 sm:w-28 bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full transition-all duration-1000 ease-out" 
                          style={{ 
                            width: `${res.matchPct}%`,
                            backgroundColor: res.party.color 
                          }}
                        />
                      </div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200 w-10 text-right">
                        {res.matchPct}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reset button */}
          <div className="text-center pt-4">
            <button
              onClick={resetQuiz}
              className="inline-flex items-center space-x-2 px-6 py-2.5 rounded-xl bg-slate-900 dark:bg-blue-600 text-white text-sm font-semibold hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Retake Policy Quiz</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
