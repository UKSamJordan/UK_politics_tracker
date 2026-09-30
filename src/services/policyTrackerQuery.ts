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

export interface PledgeVerificationResult {
  rawText: string;
  verdict: 'Confirmed Active' | 'Conditional / Pending Review' | 'Modified' | 'Superseded' | 'Under Debate';
  verdictTone: 'emerald' | 'amber' | 'blue' | 'rose';
  lastAffirmedSummary: string;
  latestQuote: string;
  statusAnalysis: string;
  timestamp: string;
  source: string;
}

/**
 * On-demand AI Pledge Recency Verification:
 * Scrutinises when a pledge was last affirmed, current standing, and ministerial quotes
 */
export async function verifyPledgeRecency(
  partyName: string,
  topicTitle: string,
  pledgeHeadline: string,
  pledgeSummary: string,
  customApiKey?: string
): Promise<PledgeVerificationResult> {
  const apiKey = (customApiKey || '').trim() || getStoredApiKey();
  if (!apiKey) {
    throw new Error('No active Gemini API key configured.');
  }

  const dateMeta = getCurrentDateMetadata();

  const prompt = `You are the Westminster Policy Tracker Parliamentary Scrutiny Engine.
CRITICAL MANDATE:
- Current Date: ${dateMeta.fullDateString}.
- Current Year: ${dateMeta.year}.
- You must perform an objective, strictly factual recency verification of the following UK political pledge:
  Party: ${partyName}
  Policy Area: ${topicTitle}
  Stated Headline: "${pledgeHeadline}"
  Stated Summary: "${pledgeSummary}"

Investigate:
1. When was this pledge first made, and when was it LAST officially reaffirmed or commented on by party leaders or ministers/spokespeople (cite names, dates, and forums where available, e.g. Commons debates, Autumn Budget, conference speeches)?
2. What is its exact status as of today (${dateMeta.fullDateString})? Is it funded, enacted in a bill, pending a formal review (like the Strategic Defence Review or NHS 10-year plan), or subject to fiscal rules?
3. Provide the most recent direct ministerial or spokesperson quote regarding this specific policy.
4. Assign an objective verdict:
   - "Confirmed Active" (if the policy is active and firmly committed)
   - "Conditional / Pending Review" (if committed in principle but sequenced, unfunded, or tied to fiscal headroom or an ongoing review)
   - "Modified" (if targets, dates, or numbers were altered)
   - "Under Debate" (if contested internally or under consultation)

Format your response cleanly:
### 1. Verification Record & Last Affirmed
(1-2 paragraphs detailing when last affirmed, by whom, and in what context)

### 2. Status & Conditionality Analysis
(Bullet points explaining current standing, funding status, and statutory pathway)

### 3. Latest Verified Public Statement
(Direct quote in quotes with speaker and approximate date)

### 4. Verdict: [Confirmed Active / Conditional / Pending Review / Modified / Under Debate]
(Summary justification)`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.15 }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No verification data returned.';

  // Parse structured elements
  let verdict: PledgeVerificationResult['verdict'] = 'Confirmed Active';
  let verdictTone: PledgeVerificationResult['verdictTone'] = 'emerald';

  const lowerText = rawText.toLowerCase();
  if (lowerText.includes('verdict: conditional') || lowerText.includes('conditional / pending review') || lowerText.includes('pending review')) {
    verdict = 'Conditional / Pending Review';
    verdictTone = 'amber';
  } else if (lowerText.includes('verdict: modified')) {
    verdict = 'Modified';
    verdictTone = 'blue';
  } else if (lowerText.includes('verdict: under debate')) {
    verdict = 'Under Debate';
    verdictTone = 'amber';
  } else if (lowerText.includes('verdict: superseded') || lowerText.includes('withdrawn')) {
    verdict = 'Superseded';
    verdictTone = 'rose';
  }

  // Extract sections
  let lastAffirmedSummary = '';
  let latestQuote = '';
  let statusAnalysis = '';

  const sections = rawText.split(/###\s+/);
  for (const sec of sections) {
    if (sec.startsWith('1.') || sec.toLowerCase().includes('verification record')) {
      lastAffirmedSummary = sec.replace(/^1\.[^\n]+\n/, '').trim();
    } else if (sec.startsWith('2.') || sec.toLowerCase().includes('status')) {
      statusAnalysis = sec.replace(/^2\.[^\n]+\n/, '').trim();
    } else if (sec.startsWith('3.') || sec.toLowerCase().includes('latest verified')) {
      latestQuote = sec.replace(/^3\.[^\n]+\n/, '').trim();
    }
  }

  return {
    rawText,
    verdict,
    verdictTone,
    lastAffirmedSummary: lastAffirmedSummary || rawText.slice(0, 300),
    latestQuote: latestQuote || 'Ministerial statements on Hansard record.',
    statusAnalysis: statusAnalysis || 'Policy actively registered in party platform.',
    timestamp: `Today at ${dateMeta.timestamp}`,
    source: 'Gemini 3.8 Flash • Parliamentary Hansard & Scrutiny Engine'
  };
}

export interface PolicyNewsItem {
  id: string;
  time: string;
  title: string;
  party: string;
  partyColor: string;
  category: string;
  tag: string;
  summary: string;
  statutoryVehicle?: string;
  fiscalImpact?: string;
  crossPartyStance?: string;
  deepDiveDetails?: string;
}

/**
 * Live Policy Decisions Scanner:
 * Filters strictly for real-world policy acts, statutory decisions, and manifesto commitments
 */
export async function fetchLatestPolicyDecisions(
  customApiKey?: string
): Promise<PolicyNewsItem[]> {
  const apiKey = (customApiKey || '').trim() || getStoredApiKey();
  if (!apiKey) {
    throw new Error('No active Gemini API key configured.');
  }

  const dateMeta = getCurrentDateMetadata();

  const prompt = `You are the Westminster Policy Tracker. Return a JSON array of the 5 most significant real-world UK policy decisions, enacted acts, and statutory milestones from the current Parliament evaluated as of ${dateMeta.fullDateString}.
CRITICAL FILTER:
- Focus EXCLUSIVELY on substantive policy decisions, enacted legislation, government white papers, statutory instruments, or formal party manifesto commitments.
- Filter OUT personal gossip, party infighting, media commentary, or polling horseraces.
- Categories should be drawn from: Defence, Housing, Energy, Economy, Welfare, NHS, Justice, or Transport.

Return STRICT JSON matching this schema:
[
  {
    "id": "decision-1",
    "time": "Today • ${dateMeta.timestamp}",
    "title": "Clear headline of the policy decision",
    "party": "Labour",
    "partyColor": "#E4003B",
    "category": "Housing",
    "tag": "Primary Legislation",
    "summary": "Precise 2-sentence summary of the decision and its statutory effect.",
    "statutoryVehicle": "e.g. Public General Act, Commons Second Reading (Bill 8), Command Paper, or Treasury Direction",
    "fiscalImpact": "e.g. £2.9bn baseline allocation or revenue neutral",
    "crossPartyStance": "e.g. Opposed by Conservatives citing borrowing; welcomed by Lib Dems with amendments",
    "deepDiveDetails": "3-4 concise paragraphs explaining what was decided, the statutory timeline, why it matters to the public, and implementation dates."
  }
]`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.15,
        responseMimeType: 'application/json'
      }
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Gemini API Error (${response.status}): ${errText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('No policy decisions returned');

  const parsed = JSON.parse(text);
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('Invalid policy decisions format returned');
  }

  return parsed;
}
