import React, { createContext, useContext, useEffect, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Party, CabinetMember, PolicyTopic, FactCheckItem, MediaClusterStory } from '../types/politics';

import partiesData from '../data/parties.json';
import cabinetsData from '../data/cabinets.json';
import policiesData from '../data/policies.json';
import pollsData from '../data/polls.json';
import factchecksData from '../data/factchecks.json';
import quizQuestionsData from '../data/quizQuestions.json';
import mediaLensData from '../data/mediaLens.json';

interface FirebaseDataContextType {
  parties: Party[];
  cabinets: CabinetMember[];
  policies: PolicyTopic[];
  polls: any;
  factChecks: FactCheckItem[];
  quizQuestions: any[];
  mediaLens: MediaClusterStory[];
  loading: boolean;
  setCabinets: (c: CabinetMember[]) => void;
  setPolicies: (p: PolicyTopic[]) => void;
  setPolls: (p: any) => void;
  setFactChecks: (f: FactCheckItem[]) => void;
  setMediaLens: (m: MediaClusterStory[]) => void;
}

const FirebaseDataContext = createContext<FirebaseDataContextType | null>(null);

export const FirebaseDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [parties, setParties] = useState<Party[]>(partiesData as Party[]);
  const [cabinets, setCabinets] = useState<CabinetMember[]>(cabinetsData as CabinetMember[]);
  const [policies, setPolicies] = useState<PolicyTopic[]>(policiesData as PolicyTopic[]);
  const [polls, setPolls] = useState<any>(pollsData);
  const [factChecks, setFactChecks] = useState<FactCheckItem[]>(factchecksData as FactCheckItem[]);
  const [quizQuestions, setQuizQuestions] = useState<any[]>(quizQuestionsData);
  const [mediaLens, setMediaLens] = useState<MediaClusterStory[]>(mediaLensData as MediaClusterStory[]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubCabinets = onSnapshot(collection(db, 'cabinets'), (snap) => {
      if (!snap.empty) setCabinets(snap.docs.map(d => d.data() as CabinetMember));
    });
    const unsubParties = onSnapshot(collection(db, 'parties'), (snap) => {
      if (!snap.empty) setParties(snap.docs.map(d => d.data() as Party));
    });
    const unsubPolicies = onSnapshot(collection(db, 'policies'), (snap) => {
      if (!snap.empty) {
        const orderMap = new Map((policiesData as PolicyTopic[]).map((t, idx) => [t.id, idx]));
        const ordered = snap.docs
          .map((d) => d.data() as PolicyTopic)
          .sort((a, b) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99));
        setPolicies(ordered);
      }
    });
    const unsubPolls = onSnapshot(doc(db, 'polls', 'current'), (snap) => {
      if (snap.exists()) setPolls(snap.data());
    });
    const unsubFactChecks = onSnapshot(collection(db, 'factchecks'), (snap) => {
      if (!snap.empty) setFactChecks(snap.docs.map(d => d.data() as FactCheckItem));
    });
    const unsubQuiz = onSnapshot(collection(db, 'quizQuestions'), (snap) => {
      if (!snap.empty) setQuizQuestions(snap.docs.map(d => d.data()));
    });
    const unsubMediaLens = onSnapshot(collection(db, 'media_lens'), (snap) => {
      if (!snap.empty) {
        const baselineOrder = new Map(
          (mediaLensData as MediaClusterStory[]).map((m, idx) => [m.id, idx])
        );
        const liveItems = snap.docs
          .map((d) => d.data() as MediaClusterStory & { createdAt?: number })
          .sort((a, b) => {
            if (a.createdAt || b.createdAt) {
              return (b.createdAt ?? 0) - (a.createdAt ?? 0);
            }
            return (baselineOrder.get(a.id) ?? 99) - (baselineOrder.get(b.id) ?? 99);
          });
        const liveTitles = new Set(liveItems.map((i) => i.title?.toLowerCase()));
        const merged = [
          ...liveItems,
          ...(mediaLensData as MediaClusterStory[]).filter(
            (b) => !liveTitles.has(b.title?.toLowerCase())
          ),
        ];
        setMediaLens(merged);
      }
    });
    
    setLoading(false);
    return () => {
      unsubCabinets();
      unsubParties();
      unsubPolicies();
      unsubPolls();
      unsubFactChecks();
      unsubQuiz();
      unsubMediaLens();
    };
  }, []);

  return (
    <FirebaseDataContext.Provider value={{ parties, cabinets, policies, polls, factChecks, quizQuestions, mediaLens, loading, setCabinets, setPolicies, setPolls, setFactChecks, setMediaLens }}>
      {children}
    </FirebaseDataContext.Provider>
  );
};

export const useFirebaseData = () => {
  const ctx = useContext(FirebaseDataContext);
  if (!ctx) throw new Error("useFirebaseData must be used within FirebaseDataProvider");
  return ctx;
};

