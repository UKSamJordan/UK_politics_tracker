import React, { useState } from 'react';
import { Party, PartyId, PolicyTopic, CabinetMember, PollPoint, PolicyPopularityItem, FactCheckItem } from './types/politics';
import { Navbar } from './components/Navbar';
import { PartySelector } from './components/PartySelector';
import { PolicyMatrix } from './components/PolicyMatrix';
import { DefenceSpecial } from './components/DefenceSpecial';
import { CabinetExplorer } from './components/CabinetExplorer';
import { PollTracker } from './components/PollTracker';
import { FactCheckDirectory } from './components/FactCheckDirectory';
import { PolicyQuiz } from './components/PolicyQuiz';
import { DataBankModal } from './components/DataBankModal';

// Load Data Bank JSON files
import partiesData from './data/parties.json';
import cabinetsData from './data/cabinets.json';
import policiesData from './data/policies.json';
import pollsData from './data/polls.json';
import factchecksData from './data/factchecks.json';

export const App: React.FC = () => {
  const parties: Party[] = partiesData as Party[];
  const cabinets: CabinetMember[] = cabinetsData as CabinetMember[];
  const policies: PolicyTopic[] = policiesData as PolicyTopic[];
  const factChecks: FactCheckItem[] = factchecksData as FactCheckItem[];
  const timeSeries: PollPoint[] = pollsData.timeSeries as PollPoint[];
  const policyPopularity: PolicyPopularityItem[] = pollsData.policyPopularity as PolicyPopularityItem[];
  const leaderRatings = (pollsData as any).leaderRatings || [];
  const bestPrimeMinister = (pollsData as any).bestPrimeMinister;

  // State
  const [activeTab, setActiveTab] = useState<string>('compare');
  // Default selected parties: Big 4 initially, or all 8
  const [selectedParties, setSelectedParties] = useState<PartyId[]>([
    'labour',
    'conservative',
    'reform',
    'libdem',
    'green'
  ]);
  const [isDataBankModalOpen, setIsDataBankModalOpen] = useState(false);

  // Toggle party handler
  const handleToggleParty = (id: PartyId) => {
    if (selectedParties.includes(id)) {
      if (selectedParties.length > 1) {
        setSelectedParties(selectedParties.filter((p) => p !== id));
      }
    } else {
      setSelectedParties([...selectedParties, id]);
    }
  };

  const handleSelectAll = () => {
    setSelectedParties(parties.map((p) => p.id));
  };

  const handleSelectTop4 = () => {
    setSelectedParties(['labour', 'conservative', 'reform', 'libdem']);
  };

  const defenceTopic = policies.find((p) => p.category === 'defence');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenDataBankModal={() => setIsDataBankModalOpen(true)}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Render Party Selector only on Comparison tab */}
        {activeTab === 'compare' && (
          <PartySelector
            parties={parties}
            selectedParties={selectedParties}
            onToggleParty={handleToggleParty}
            onSelectAll={handleSelectAll}
            onSelectTop4={handleSelectTop4}
          />
        )}

        {/* View Switching */}
        {activeTab === 'compare' && (
          <PolicyMatrix
            parties={parties}
            selectedParties={selectedParties}
            policies={policies}
          />
        )}

        {activeTab === 'defence' && (
          <DefenceSpecial
            parties={parties}
            defencePolicyTopic={defenceTopic}
          />
        )}

        {activeTab === 'cabinets' && (
          <CabinetExplorer
            parties={parties}
            cabinetMembers={cabinets}
            leaderRatings={leaderRatings}
            onNavigateToPolls={() => setActiveTab('polls')}
          />
        )}

        {activeTab === 'polls' && (
          <PollTracker
            parties={parties}
            timeSeries={timeSeries}
            policyPopularity={policyPopularity}
            leaderRatings={leaderRatings}
            bestPrimeMinister={bestPrimeMinister}
            lastUpdated={pollsData.lastUpdated}
          />
        )}

        {activeTab === 'factchecks' && (
          <FactCheckDirectory
            parties={parties}
            factChecks={factChecks}
          />
        )}

        {activeTab === 'quiz' && (
          <PolicyQuiz
            parties={parties}
          />
        )}
      </main>

      {/* Data Bank Architecture Modal */}
      <DataBankModal
        isOpen={isDataBankModalOpen}
        onClose={() => setIsDataBankModalOpen(false)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-12 py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <p className="font-semibold text-slate-700">
              UK Political Parties Comparator & Intelligence Hub
            </p>
            <p className="mt-0.5">
              Independent, non-partisan data referenced from official party manifestos, Full Fact, ONS, and British Polling Council members.
            </p>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 font-medium">
              Cloudflare Pages Ready
            </span>
            <span className="px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 font-medium">
              Data Bank Model: £0 Visitor Cost
            </span>
            <span className="px-2.5 py-1 rounded-md bg-purple-50 text-purple-700 font-medium">
              Gemini Flash 3.8 Synced
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
