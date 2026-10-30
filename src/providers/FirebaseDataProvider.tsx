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

const BUNDLED_BASELINE_EPOCH = '2026-10-30';
const VALID_PARTY_IDS = new Set([
  'labour',
  'conservative',
  'reform',
  'libdem',
  'green',
  'snp',
  'plaid',
  'restore',
]);

function extractClaimKeywords(claim: string): string[] {
  const stopWords = new Set([
    'about', 'after', 'again', 'against', 'almost', 'alone', 'along', 'already',
    'although', 'always', 'among', 'annual', 'annually', 'around', 'because',
    'before', 'being', 'between', 'billion', 'britain', 'british', 'clear',
    'claim', 'could', 'every', 'first', 'government', 'million', 'ministers',
    'never', 'other', 'party', 'people', 'percent', 'policy', 'public', 'should',
    'state', 'still', 'their', 'there', 'these', 'think', 'those', 'through',
    'under', 'united', 'voters', 'which', 'while', 'would', 'years',
  ]);
  return Array.from(
    new Set(
      (claim || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 5 && !stopWords.has(w))
    )
  );
}

function deduplicateFactChecks(items: FactCheckItem[]): FactCheckItem[] {
  const sorted = [...items].sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );
  const accepted: Array<{ item: FactCheckItem; keywords: Set<string> }> = [];

  for (const fc of sorted) {
    if (!fc?.id || !fc?.claim || !VALID_PARTY_IDS.has(fc.partyId)) continue;
    const speakerLower = (fc.speaker || '').toLowerCase();
    if (speakerLower === 'environment agency' || speakerLower === 'ons') continue;

    const kws = extractClaimKeywords(fc.claim);
    const isDuplicate = accepted.some((existing) => {
      if (existing.item.id === fc.id) return true;
      if (existing.item.claim.trim().toLowerCase() === fc.claim.trim().toLowerCase()) return true;
      if (existing.item.partyId !== fc.partyId) return false;
      let shared = 0;
      for (const w of kws) {
        if (existing.keywords.has(w)) shared++;
      }
      return shared >= 3;
    });

    if (!isDuplicate) {
      accepted.push({ item: fc, keywords: new Set(kws) });
    }
  }

  return accepted.map((a) => a.item);
}

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
      if (!snap.empty) {
        const liveMap = new Map<string, CabinetMember & { updatedAt?: string }>();
        snap.docs.forEach((d) => {
          const data = d.data() as CabinetMember & { updatedAt?: string };
          if (data?.id && data.updatedAt && data.updatedAt >= BUNDLED_BASELINE_EPOCH) {
            liveMap.set(data.id, data);
          }
        });
        if (liveMap.size > 0) {
          const merged = (cabinetsData as CabinetMember[]).map((base) => liveMap.get(base.id) || base);
          const baseIds = new Set(merged.map((m) => m.id));
          for (const extra of liveMap.values()) {
            if (!baseIds.has(extra.id)) merged.push(extra);
          }
          setCabinets(merged);
        }
      }
    });

    const unsubParties = onSnapshot(collection(db, 'parties'), (snap) => {
      if (!snap.empty) {
        const liveMap = new Map<string, Party & { updatedAt?: string }>();
        snap.docs.forEach((d) => {
          const data = d.data() as Party & { updatedAt?: string };
          if (data?.id && data.updatedAt && data.updatedAt >= BUNDLED_BASELINE_EPOCH) {
            liveMap.set(data.id, data);
          }
        });
        if (liveMap.size > 0) {
          setParties((partiesData as Party[]).map((base) => liveMap.get(base.id) || base));
        }
      }
    });

    const unsubPolicies = onSnapshot(collection(db, 'policies'), (snap) => {
      if (!snap.empty) {
        const orderMap = new Map((policiesData as PolicyTopic[]).map((t, idx) => [t.id, idx]));
        const liveMap = new Map(
          snap.docs.map((d) => [d.id, d.data() as PolicyTopic & { updatedAt?: string }])
        );
        const merged: PolicyTopic[] = [];
        for (const baseTopic of policiesData as PolicyTopic[]) {
          const liveTopic = liveMap.get(baseTopic.id);
          if (liveTopic && liveTopic.updatedAt && liveTopic.updatedAt >= BUNDLED_BASELINE_EPOCH) {
            merged.push({
              ...baseTopic,
              ...liveTopic,
              pledges: {
                ...baseTopic.pledges,
                ...(liveTopic.pledges || {}),
              },
            });
          } else {
            merged.push(baseTopic);
          }
          liveMap.delete(baseTopic.id);
        }
        // Append custom or newly created topics from Firestore only if created recently
        for (const extraTopic of liveMap.values()) {
          if (extraTopic.category !== 'custom') {
            merged.unshift(extraTopic);
          }
        }
        merged.sort((a, b) => {
          const aIsCustom = a.category === 'custom';
          const bIsCustom = b.category === 'custom';
          if (aIsCustom && !bIsCustom) return -1;
          if (!aIsCustom && bIsCustom) return 1;
          return (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99);
        });
        setPolicies(merged);
      }
    });

    const unsubPolls = onSnapshot(doc(db, 'polls', 'current'), (snap) => {
      if (snap.exists()) {
        const livePolls = snap.data();
        if (
          livePolls?.lastUpdated &&
          String(livePolls.lastUpdated) >= String(pollsData.lastUpdated)
        ) {
          setPolls(livePolls);
        }
      }
    });

    const unsubFactChecks = onSnapshot(collection(db, 'factchecks'), (snap) => {
      if (!snap.empty) {
        const baseById = new Map((factchecksData as FactCheckItem[]).map((fc) => [fc.id, fc]));
        const liveDocs = snap.docs
          .map((d) => d.data() as FactCheckItem)
          .filter((fc) => fc?.id && !baseById.has(fc.id));
        const combined = deduplicateFactChecks([
          ...(factchecksData as FactCheckItem[]),
          ...liveDocs,
        ]);
        setFactChecks(combined);
      }
    });

    const unsubQuiz = onSnapshot(collection(db, 'quizQuestions'), (snap) => {
      if (!snap.empty && snap.docs.length >= quizQuestionsData.length) {
        setQuizQuestions(snap.docs.map((d) => d.data()));
      }
    });

    const unsubMediaLens = onSnapshot(collection(db, 'media_lens'), (snap) => {
      if (!snap.empty) {
        const baselineList = mediaLensData as MediaClusterStory[];
        const baselineById = new Map(baselineList.map((m) => [m.id, m]));
        const liveItems = snap.docs
          .filter((d) => !d.id.startsWith('custom-') && !baselineById.has(d.id))
          .map((d) => d.data() as MediaClusterStory & { createdAt?: number })
          .filter((item) => item?.id && !String(item.id).startsWith('custom-') && item?.title)
          .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));

        const seenTitles = new Set<string>();
        const merged: MediaClusterStory[] = [];

        // Keep flagship baseline lead cluster first if it's the October 2026 Budget special, followed by live press clusters, then remaining baseline clusters
        if (baselineList.length > 0 && baselineList[0].id === 'media-cluster-budget-oct26') {
          merged.push(baselineList[0]);
          seenTitles.add(baselineList[0].title.toLowerCase());
        }

        for (const item of liveItems) {
          const tLower = item.title.toLowerCase();
          if (!seenTitles.has(tLower)) {
            merged.push(item);
            seenTitles.add(tLower);
          }
        }

        for (const baseItem of baselineList) {
          const tLower = baseItem.title.toLowerCase();
          if (!seenTitles.has(tLower)) {
            merged.push(baseItem);
            seenTitles.add(tLower);
          }
        }

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

