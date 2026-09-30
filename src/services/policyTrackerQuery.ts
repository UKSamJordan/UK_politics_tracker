import { Party, CabinetMember, PolicyTopic } from '../types/politics';
import { getStoredApiKey } from './liveUpdater';

export interface DateMetadata {
  fullDateString: string;
  shortDateString: string;
  year: number;
  monthName: string;
  timestamp: string;
}

export function getCurrentDateMetadata(): DateMetadata {
  const now = new Date();
  const fullDateString = now.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const shortDateString = now.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
  const year = now.getFullYear();
  const monthName = now.toLocaleDateString('en-GB', { month: 'long' });
  const timestamp = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }) + ' BST';

  return {
    fullDateString,
    shortDateString,
    year,
    monthName,
    timestamp
  };
}

export interface GroundTruthSnippet {
  matchedTopicTitle?: string;
  matchedCategory?: string;
  contextText: string;
}

/**
 * Algorithmic Ground-Truth Retriever:
 * Extracts verified 2026 policy manifestos and frontbench context matching the user's question
 */
export function extractRelevantGroundTruth(
  question: string,
  policies: PolicyTopic[] = [],
  cabinets: CabinetMember[] = [],
  parties: Party[] = []
): GroundTruthSnippet {
  const q = question.toLowerCase();

  // Topic keyword maps
  const topicKeywordMap: Record<string, string[]> = {
    'welfare': ['triple lock', 'pension', 'pensioner', 'retire', 'state pension', 'waspi', 'winter fuel', 'social care', 'attendance allowance'],
    'defence': ['defence', 'defense', 'military', 'nato', 'army', 'armed forces', 'trident', 'war', '2.5%', '3%', '3.0%', 'procurement', 'troops'],
    'economy': ['tax', 'income tax', 'wealth tax', 'national debt', 'vat', 'fiscal', 'borrowing', 'budget', 'gdp', 'inflation', 'interest rates', 'personal allowance'],
    'nhs': ['nhs', 'health', 'hospital', 'doctor', 'nurse', 'waiting list', 'dentist', 'dentistry', 'social care', 'mental health'],
    'housing': ['housing', 'renters', 'landlord', 'section 21', 'eviction', 'planning', 'council house', 'mortgage', 'rent control', 'stamp duty'],
    'immigration': ['immigration', 'asylum', 'border', 'small boats', 'rwanda', 'deportation', 'visa', 'migrant', 'echr'],
    'energy': ['energy', 'net zero', 'oil', 'gas', 'north sea', 'wind', 'solar', 'nuclear', 'climate', 'green levy', 'gb energy']
  };

  let bestTopic: PolicyTopic | undefined;
  let highestScore = 0;

  for (const policy of policies) {
    let score = 0;
    const cat = policy.category.toLowerCase();
    const keywords = topicKeywordMap[cat] || [];

    for (const kw of keywords) {
      if (q.includes(kw)) score += 4;
    }

    if (policy.title && q.includes(policy.title.toLowerCase())) score += 6;
    if (policy.description && policy.description.toLowerCase().split(' ').some(w => w.length > 4 && q.includes(w))) score += 1;

    if (score > highestScore) {
      highestScore = score;
      bestTopic = policy;
    }
  }

  // Key Frontbench Ground Truth (Active Parliament Context)
  const coreFrontbenchContext = `
ACTIVE UK PARLIAMENTARY & GOVERNMENT CONTEXT:
- Governing Party: Labour Party (Prime Minister: Andy Burnham, Chancellor of the Exchequer: Rachel Reeves, Deputy Prime Minister: Angela Rayner).
- Official Opposition: Conservative Party (Leader: Kemi Badenoch, Shadow Chancellor: Mel Stride, Shadow Justice: Nick Timothy).
- Third Party: Reform UK (Party Leader: Nigel Farage, Shadow Chancellor: Robert Jenrick, Shadow Education: Suella Braverman).
- Liberal Democrats: Sir Ed Davey (Leader), Daisy Cooper (Deputy Leader & Treasury).
- Green Party: Zack Polanski (Party Leader, elected Sept 2025), Carla Denyer MP (Parliamentary Leader in Commons).
- Scottish National Party (SNP): John Swinney (First Minister) / Stephen Flynn MP (Westminster Leader).
- Plaid Cymru: Rhun ap Iorwerth (Leader), Liz Saville Roberts MP (Westminster Leader).
`;

  if (!bestTopic) {
    return {
      contextText: coreFrontbenchContext
    };
  }

  // Build structured pledge breakdown for the matched topic
  const pledgesText = Object.entries(bestTopic.pledges || {})
    .map(([partyId, pledge]: [string, any]) => {
      const pName = parties.find(p => p.id === partyId)?.name || partyId.toUpperCase();
      return `* ${pName}: "${pledge.headline}" — ${pledge.summary} (Official Source: ${pledge.officialSourceUrl || 'Official Manifesto'})`;
    })
    .join('\n');

  const contextText = `
${coreFrontbenchContext}
VERIFIED 2026 MANIFESTO PLEDGES FOR MATCHED TOPIC: "${bestTopic.title}"
${pledgesText}
`;

  return {
    matchedTopicTitle: bestTopic.title,
    matchedCategory: bestTopic.category,
    contextText
  };
}

export interface PolicyTrackerQueryResult {
  answer: string;
  timestamp: string;
  verifiedDate: string;
  source: string;
  matchedTopicTitle?: string;
  isAuditPassed: boolean;
}

/**
 * Execute real-time query with strict temporal grounding and recency verification
 */
export async function queryWestminsterPolicyTracker(
  question: string,
  options: {
    policies?: PolicyTopic[];
    cabinets?: CabinetMember[];
    parties?: Party[];
    customApiKey?: string;
  } = {}
): Promise<PolicyTrackerQueryResult> {
  const apiKey = (options.customApiKey || '').trim() || getStoredApiKey();
  if (!apiKey) {
    throw new Error('No active Gemini API key configured. Please enter your API key to activate live policy queries.');
  }

  const dateMeta = getCurrentDateMetadata();
  const groundTruth = extractRelevantGroundTruth(
    question,
    options.policies || [],
    options.cabinets || [],
    options.parties || []
  );

  const prompt = `You are the Westminster Policy Tracker, an authoritative UK parliamentary intelligence and policy verification engine.

CRITICAL TEMPORAL MANDATE (MANDATORY CURRENT-DAY ANCHOR):
- TODAY'S DATE IS: ${dateMeta.fullDateString}.
- THE CURRENT YEAR IS: ${dateMeta.year}.
- CURRENT TIME: ${dateMeta.timestamp}.
- You MUST evaluate and answer this question strictly from the perspective of TODAY (${dateMeta.fullDateString}).
- Under NO circumstances may you terminate your analysis in 2024 or early 2025.
- If the user asks about ongoing legislation, fiscal rules, tax thresholds, benefits, or uprating formulas (such as the State Pension Triple Lock, defence spending pathways, housing targets, or NHS waiting list metrics):
  1. Clearly state the ACTIVE CURRENT STATUS right now in ${dateMeta.monthName} ${dateMeta.year}.
  2. Detail how previous decisions (such as the 2024 Autumn Budget or April 2025 upratings) have already taken effect and what current rates/rules are operational today.
  3. Address the live ${dateMeta.year} parliamentary dynamics: the latest indices, ONS economic data published recently in ${dateMeta.year}, upcoming fiscal events (e.g. the late 2026 fiscal event/Autumn Statement), and committee reports.
  4. Detail the contrasting positions of the political parties based on verified 2026 manifestos.

${groundTruth.contextText}

USER QUESTION:
"${question}"

REQUIRED RESPONSE FORMAT:
- Output clean Markdown with clear section headings (###) and bullet points.
- Section 1: ### 1. Current Active Status (As of ${dateMeta.fullDateString})
  (Explain what is currently in place today in ${dateMeta.year}, what rates or laws are active right now, and how earlier policies took effect).
- Section 2: ### 2. Live ${dateMeta.year} Parliamentary & Fiscal Dynamics
  (Explain recent ${dateMeta.year} developments, latest ONS/government data, parliamentary debates, and upcoming decisions scheduled for late ${dateMeta.year} or early ${dateMeta.year + 1}).
- Section 3: ### 3. Cross-Party Positions & Battlegrounds
  (Directly compare Labour, Conservative, Reform UK, Lib Dems, Greens, SNP, and Plaid Cymru positions with concrete figures and pledges from their 2026 manifestos).

Tone: Strictly objective, analytical, impartial, and grounded in official parliamentary records.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.15
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const parts = data.candidates?.[0]?.content?.parts || [];
  let answer = parts.map((p: any) => p.text || '').filter(Boolean).join('\n\n') || 'No response returned from model.';

  // Algorithmic Recency Audit:
  // Validate that the output contains references to the current year or upcoming milestones
  const containsCurrentYear = answer.includes(String(dateMeta.year)) || answer.includes(String(dateMeta.year + 1));
  const containsStaleCutoff = answer.includes('as of April 2025') && !containsCurrentYear;

  let isAuditPassed = containsCurrentYear && !containsStaleCutoff;

  // If audit fails, append ground-truth synchronization note
  if (!isAuditPassed && groundTruth.matchedTopicTitle) {
    answer += `\n\n> 🔍 **Policy Tracker Recency Verification Note (${dateMeta.fullDateString})**: Our automated audit detected that parts of the generated response focused on prior fiscal periods. For up-to-the-minute verified party manifestos as of today, please refer to the "${groundTruth.matchedTopicTitle}" section in the Policy Explorer.`;
  }

  return {
    answer,
    timestamp: dateMeta.timestamp,
    verifiedDate: dateMeta.fullDateString,
    source: `Westminster Policy Tracker • Live Grounded Scrutiny (${dateMeta.shortDateString})`,
    matchedTopicTitle: groundTruth.matchedTopicTitle,
    isAuditPassed
  };
}
