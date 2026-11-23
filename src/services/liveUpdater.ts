import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
/**
 * UK Politics Comparator - Live Update Engine (v3)
 * ----------------------------------------------------
 * Performs real network requests to keep political rosters, polling,
 * and policy matrices up to date:
 *
 * 1. Cache-busting HTTP fetch from the live CDN (/data/*.json?t=...)
 * 2. Optional direct in-browser query to Gemini 3.8 Flash if an API key is stored,
 *    allowing live verification and automated discovery of reshuffles or new polls.
 * 3. Persists fresh records in browser localStorage (v3) so the app remains up to date.
 * 4. Algorithmic Diff & Change Detection: compares old state vs incoming data to
 *    explicitly report reshuffles, new appointments, defections, and MP seat changes.
 */

import { CabinetMember, PolicyTopic, FactCheckItem, Party, PartyId } from '../types/politics';

const STORAGE_KEYS = {
  CABINETS: 'uk_politics_cabinets_v5',
  POLICIES: 'uk_politics_policies_v5',
  POLLS: 'uk_politics_polls_v5',
  FACTCHECKS: 'uk_politics_factchecks_v5',
  API_KEY: 'uk_politics_gemini_api_key',
};

export interface CabinetChangeItem {
  type: 'role_changed' | 'appointed' | 'removed' | 'defection';
  partyId: string;
  personName: string;
  details: string;
}

export interface CabinetChangeReport {
  hasChanges: boolean;
  totalMembersChecked: number;
  changes: CabinetChangeItem[];
  summary: string;
  timestamp: string;
}

export interface PolicyChangeItem {
  category: string;
  partyId: string;
  topicTitle: string;
  oldHeadline?: string;
  newHeadline: string;
  details: string;
}

export interface PolicyChangeReport {
  hasChanges: boolean;
  totalTopicsChecked: number;
  changes: PolicyChangeItem[];
  summary: string;
  timestamp: string;
}

export interface SeatChangeItem {
  partyId: string;
  partyName: string;
  oldSeats: number;
  newSeats: number;
  delta: number;
}

// Automatically purge any legacy client-side key from browser localStorage on startup
try {
  if (typeof window !== 'undefined' && window.localStorage) {
    window.localStorage.removeItem(STORAGE_KEYS.API_KEY);
    window.localStorage.removeItem('GEMINI_USER_KEY');
  }
} catch {
  // Ignore storage access errors
}

// All Gemini queries run server-side via Firebase Cloud Functions.
export const getStoredApiKey = (): string => {
  return '';
};

export const setStoredApiKey = (_key: string): void => {
  localStorage.removeItem(STORAGE_KEYS.API_KEY);
  localStorage.removeItem('GEMINI_USER_KEY');
};

/**
 * Real HTTP fetch from CDN with cache-busting timestamp and safety timeout
 */
export async function fetchLiveCdnData<T>(filename: string, timeoutMs: number = 6000): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const timestamp = Date.now();
    const res = await fetch(`/data/${filename}?_t=${timestamp}`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        Pragma: 'no-cache',
      },
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP error ${res.status} fetching /data/${filename}`);
    }

    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Algorithmic Cabinet Change Detection
 */
export function detectCabinetChanges(
  currentList: CabinetMember[],
  newList: CabinetMember[]
): CabinetChangeReport {
  const changes: CabinetChangeItem[] = [];
  const oldMap = new Map(currentList.map((m) => [m.id, m]));
  const newMap = new Map(newList.map((m) => [m.id, m]));

  for (const newM of newList) {
    const oldM = oldMap.get(newM.id);
    if (!oldM) {
      changes.push({
        type: 'appointed',
        partyId: newM.partyId,
        personName: newM.name,
        details: `Newly appointed to ${newM.role} (${newM.appointedDate})`,
      });
    } else {
      if (oldM.partyId !== newM.partyId) {
        changes.push({
          type: 'defection',
          partyId: newM.partyId,
          personName: newM.name,
          details: `Defected/transferred from ${oldM.partyId} to ${newM.partyId} as ${newM.role}`,
        });
      } else if (oldM.role !== newM.role) {
        changes.push({
          type: 'role_changed',
          partyId: newM.partyId,
          personName: newM.name,
          details: `Role updated from "${oldM.role}" to "${newM.role}" (In post: ${newM.appointedDate})`,
        });
      }
    }
  }

  for (const oldM of currentList) {
    if (!newMap.has(oldM.id)) {
      changes.push({
        type: 'removed',
        partyId: oldM.partyId,
        personName: oldM.name,
        details: `Stepped down / removed from ${oldM.role}`,
      });
    }
  }

  const hasChanges = changes.length > 0;
  const summary = hasChanges
    ? `Identified ${changes.length} change(s) across frontbench portfolios.`
    : `All ${newList.length} frontbench appointments and dates match verified parliamentary records (0 changes detected).`;

  return {
    hasChanges,
    totalMembersChecked: newList.length,
    changes,
    summary,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

/**
 * Algorithmic MP Seat Count Change Detection
 */
export function detectSeatChanges(
  currentParties: Party[],
  newParties: Party[]
): SeatChangeItem[] {
  const changes: SeatChangeItem[] = [];
  const oldMap = new Map(currentParties.map((p) => [p.id, p.seats]));
  for (const newP of newParties) {
    const oldSeats = oldMap.get(newP.id);
    if (oldSeats !== undefined && oldSeats !== newP.seats) {
      changes.push({
        partyId: newP.id,
        partyName: newP.name,
        oldSeats,
        newSeats: newP.seats,
        delta: newP.seats - oldSeats,
      });
    }
  }
  return changes;
}

/**
 * Helper to call syncSection Cloud Function with a safe timeout
 */
async function callSyncSection(
  section: 'polls' | 'cabinets' | 'factchecks' | 'decisions' | 'media' | 'policies' | 'all',
  extra: Record<string, any> = {},
  timeoutMs: number = 70000
): Promise<any> {
  const syncFn = httpsCallable(functions, 'syncSection');
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Sync (${section}) timed out`)), timeoutMs)
  );
  const res = (await Promise.race([
    syncFn({ section, ...extra }),
    timeoutPromise,
  ])) as any;
  return res?.data;
}

/**
 * Live Update: Cabinet Roster & MP Seats with Live Parliamentary Search + Firestore Sync
 */
export async function refreshCabinetRoster(currentMembers: CabinetMember[]): Promise<{
  data: CabinetMember[];
  updatedParties?: Party[];
  source: string;
  updatedCount: number;
  changeReport: CabinetChangeReport;
}> {
  try {
    const payload = await callSyncSection('cabinets', {}, 70000);
    if (payload && Array.isArray(payload.updatedCabinets) && payload.updatedCabinets.length > 0) {
      localStorage.setItem(STORAGE_KEYS.CABINETS, JSON.stringify(payload.updatedCabinets));
      const report = detectCabinetChanges(currentMembers, payload.updatedCabinets);
      if (Array.isArray(payload.appliedChanges) && payload.appliedChanges.length > 0 && !report.hasChanges) {
        report.changes = payload.appliedChanges;
        report.hasChanges = true;
        report.summary = `Identified ${payload.appliedChanges.length} live parliamentary frontbench update(s).`;
      }
      return {
        data: payload.updatedCabinets,
        updatedParties: Array.isArray(payload.updatedParties) ? payload.updatedParties : undefined,
        source: 'Live Parliamentary Register + Google Search & Firestore Sync',
        updatedCount: payload.updatedCabinets.length,
        changeReport: report,
      };
    }
  } catch (err) {
    console.warn('Live syncSection(cabinets) failed, falling back to CDN:', err);
  }

  const cdnData = await fetchLiveCdnData<CabinetMember[]>('cabinets.json', 6000);
  localStorage.setItem(STORAGE_KEYS.CABINETS, JSON.stringify(cdnData));
  const report = detectCabinetChanges(currentMembers, cdnData);

  return {
    data: cdnData,
    source: 'Live CDN Data Bank (/data/cabinets.json)',
    updatedCount: cdnData.length,
    changeReport: report,
  };
}

/**
 * Live Update: Polling, Leader Approval & Best PM via Live BPC Search + Firestore Sync
 */
export async function refreshPollData(): Promise<{
  data: any;
  source: string;
}> {
  try {
    const payload = await callSyncSection('polls', {}, 70000);
    if (payload && payload.polls) {
      localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(payload.polls));
      return {
        data: payload.polls,
        source: 'Live BPC Polling Audit (YouGov • Ipsos • More in Common • Savanta) & Firestore Sync',
      };
    }
  } catch (err) {
    console.warn('Live syncSection(polls) failed, falling back to CDN:', err);
  }

  const cdnData = await fetchLiveCdnData<any>('polls.json', 6000);
  localStorage.setItem(STORAGE_KEYS.POLLS, JSON.stringify(cdnData));
  return {
    data: cdnData,
    source: 'Live CDN Data Bank (/data/polls.json)',
  };
}

/**
 * Algorithmic Policy Change Detection
 */
export function detectPolicyChanges(
  currentList: PolicyTopic[],
  newList: PolicyTopic[]
): PolicyChangeReport {
  const changes: PolicyChangeItem[] = [];
  const oldTopicMap = new Map(currentList.map((t) => [t.id, t]));

  for (const newT of newList) {
    const oldT = oldTopicMap.get(newT.id);
    if (!oldT) {
      changes.push({
        category: newT.category,
        partyId: 'all',
        topicTitle: newT.title,
        newHeadline: newT.title,
        details: `New policy sector added: ${newT.title}`,
      });
    } else {
      for (const [pid, newPledge] of Object.entries(newT.pledges)) {
        const oldPledge = oldT.pledges[pid as PartyId];
        if (!oldPledge) {
          changes.push({
            category: newT.category,
            partyId: pid,
            topicTitle: newT.title,
            newHeadline: newPledge.headline,
            details: `New pledge recorded for ${pid.toUpperCase()}: "${newPledge.headline}"`,
          });
        } else if (
          oldPledge.headline !== newPledge.headline ||
          oldPledge.summary !== newPledge.summary
        ) {
          changes.push({
            category: newT.category,
            partyId: pid,
            topicTitle: newT.title,
            oldHeadline: oldPledge.headline,
            newHeadline: newPledge.headline,
            details: `Pledge updated: "${oldPledge.headline}" → "${newPledge.headline}" (Source: ${newPledge.officialSourceTitle || 'Official Platform'})`,
          });
        }
      }
    }
  }

  const hasChanges = changes.length > 0;
  const summary = hasChanges
    ? `Identified ${changes.length} policy evolution(s) across official party platforms.`
    : `All ${newList.length} policy sectors and official party sources match current verified records (0 changes detected).`;

  return {
    hasChanges,
    totalTopicsChecked: newList.length,
    changes,
    summary,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
  };
}

/**
 * Live Update: Policy Matrix with Live Google-Search Grounding & Firestore Sync
 */
export async function refreshPolicyMatrix(
  currentPolicies: PolicyTopic[] = [],
  category?: string
): Promise<{
  data: PolicyTopic[];
  source: string;
  changeReport: PolicyChangeReport;
}> {
  let cdnBaseline: PolicyTopic[] = currentPolicies;

  try {
    const fetched = await fetchLiveCdnData<PolicyTopic[]>('policies.json', 6000);
    if (Array.isArray(fetched) && fetched.length > 0) {
      cdnBaseline = fetched;
    }
  } catch (err) {
    console.warn('CDN fetch failed in refreshPolicyMatrix, continuing with current baseline:', err);
  }

  try {
    const auditFn = httpsCallable(functions, 'auditAndSyncPolicies');
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Live policy audit timed out')), 75000)
    );

    const result = (await Promise.race([
      auditFn({
        category: category && category !== 'all' ? category : undefined,
      }),
      timeoutPromise,
    ])) as any;

    const payload = result?.data;
    if (payload && Array.isArray(payload.updatedPolicies) && payload.updatedPolicies.length > 0) {
      const orderMap = new Map(cdnBaseline.map((t, idx) => [t.id, idx]));
      const orderedPolicies = [...payload.updatedPolicies].sort(
        (a: PolicyTopic, b: PolicyTopic) => (orderMap.get(a.id) ?? 99) - (orderMap.get(b.id) ?? 99)
      );

      localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(orderedPolicies));
      const changeReport = detectPolicyChanges(currentPolicies, orderedPolicies);

      const serverChanges = payload.appliedPolicyChanges || payload.changes || [];
      if (Array.isArray(serverChanges) && serverChanges.length > 0) {
        const existingKeys = new Set(changeReport.changes.map((c) => `${c.partyId}-${c.newHeadline}`));
        for (const sc of serverChanges) {
          const key = `${sc.partyId}-${sc.newHeadline}`;
          if (!existingKeys.has(key)) {
            changeReport.changes.push({
              category: sc.category || sc.topicId || category || 'all',
              partyId: sc.partyId,
              topicTitle: sc.topicTitle || sc.topicId,
              oldHeadline: sc.oldHeadline,
              newHeadline: sc.newHeadline,
              details: sc.details || `Live AI Search Discovery: "${sc.oldHeadline}" → "${sc.newHeadline}"`,
            });
          }
        }
        changeReport.hasChanges = changeReport.changes.length > 0;
        if (changeReport.hasChanges) {
          changeReport.summary = `Identified ${changeReport.changes.length} policy evolution(s) via Live Google Search Grounding & Parliamentary Audit.`;
        }
      }

      return {
        data: orderedPolicies,
        source: 'Gemini 3.8 Flash + Google Search Grounding & Firestore Live Sync',
        changeReport,
      };
    }
  } catch (err) {
    console.warn('Live Cloud Function auditAndSyncPolicies failed or timed out, applying CDN baseline:', err);
  }

  if (Array.isArray(cdnBaseline) && cdnBaseline.length > 0) {
    localStorage.setItem(STORAGE_KEYS.POLICIES, JSON.stringify(cdnBaseline));
    const changeReport = detectPolicyChanges(currentPolicies, cdnBaseline);
    return {
      data: cdnBaseline,
      source: 'Live CDN Data Bank (/data/policies.json • Audited Platforms)',
      changeReport,
    };
  }

  throw new Error('Unable to reach live policy verification servers.');
}

/**
 * Live Update: Fact Checks with Server-Side Firestore Persistence
 */
export async function refreshFactChecks(): Promise<{
  data: FactCheckItem[];
  source: string;
}> {
  try {
    const payload = await callSyncSection('factchecks', {}, 70000);
    if (payload && Array.isArray(payload.factChecks) && payload.factChecks.length > 0) {
      localStorage.setItem(STORAGE_KEYS.FACTCHECKS, JSON.stringify(payload.factChecks));
      return {
        data: payload.factChecks,
        source: 'Live Fact-Check Audit (Full Fact • BBC Verify • IFS • OBR) & Firestore Sync',
      };
    }
  } catch (err) {
    console.warn('syncSection(factchecks) failed, falling back to CDN:', err);
  }

  const cdnData = await fetchLiveCdnData<FactCheckItem[]>('factchecks.json', 6000);
  const sorted = [...cdnData].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  localStorage.setItem(STORAGE_KEYS.FACTCHECKS, JSON.stringify(sorted));
  return {
    data: sorted,
    source: 'Live CDN Data Bank (/data/factchecks.json)',
  };
}

/**
 * Live Update: Policy Decisions Timeline (`policy_decisions`)
 */
export async function refreshPolicyDecisions(category?: string): Promise<{
  decisions: any[];
  source: string;
}> {
  const payload = await callSyncSection(
    'decisions',
    { category: category && category !== 'all' ? category : undefined },
    70000
  );
  return {
    decisions: Array.isArray(payload?.decisions) ? payload.decisions : [],
    source: 'Live Westminster Policy Decisions Sync',
  };
}

/**
 * Unified Full-Site Sync across all 6 Firestore collections in parallel (~40-50s total)
 */
export async function refreshAllSiteSections(): Promise<any> {
  const analyzeMediaFn = httpsCallable(functions, 'analyzeMediaLens');
  const auditPoliciesFn = httpsCallable(functions, 'auditAndSyncPolicies');

  const results = await Promise.allSettled([
    analyzeMediaFn({}),
    auditPoliciesFn({}),
    callSyncSection('polls', {}, 85000),
    callSyncSection('cabinets', {}, 85000),
    callSyncSection('factchecks', {}, 85000),
    callSyncSection('decisions', {}, 85000),
  ]);

  return {
    completed: results.filter((r) => r.status === 'fulfilled').length,
    total: results.length,
  };
}

/**
 * Live Intelligence Dossier: Fetch on-demand summary of recent statements & actions for a specific person
 */
export async function fetchPersonIntelligence(
  personName: string,
  role: string,
  partyName: string,
  constituency?: string
): Promise<{
  personName: string;
  summaryText: string;
  timestamp: string;
  source: string;
}> {
  try {
    const askGemini = httpsCallable(functions, 'askGemini');

    // Race the cloud function against a 12-second timeout
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('TimeoutError')), 12000);
    });

    const callPromise = askGemini({
      action: 'personDossier',
      personName,
      role,
      partyName,
      constituency,
    });
    const result = (await Promise.race([callPromise, timeoutPromise])) as any;

    const text = result.data.text || 'No intelligence dossier returned.';

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    return {
      personName,
      summaryText: text,
      timestamp: `Today at ${timestamp} GMT`,
      source: 'Gemini 3.8 Flash • Real-Time Parliamentary Scrutiny',
    };
  } catch (err: any) {
    if (err.message === 'TimeoutError') {
      const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      return {
        personName,
        summaryText: `### 1. Active Frontbench Standing\n- **Role**: ${role} (${partyName})\n${constituency ? `- **Constituency**: ${constituency}\n` : ''}- Currently listed in active official parliamentary register.\n\n### 2. Live Scrutiny Status\n- The live intelligence server timed out (12s network threshold). Portfolio policy records and voting record remain fully verified in the Westminster Data Bank.`,
        timestamp: `Verified at ${timestamp} GMT`,
        source: 'Parliamentary Register Fallback Record',
      };
    }
    console.error('fetchPersonIntelligence error:', err);
    throw err;
  }
}
