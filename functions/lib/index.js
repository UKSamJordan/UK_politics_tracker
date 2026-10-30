"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autonomousPoliticalAgent = exports.analyzeMediaLens = exports.updatePledgeInFirestore = exports.auditAndSyncPolicies = exports.askGemini = void 0;
const https_1 = require("firebase-functions/v2/https");
const params_1 = require("firebase-functions/params");
const genai_1 = require("@google/genai");
const admin = require("firebase-admin");
const autonomousAgent_1 = require("./autonomousAgent");
Object.defineProperty(exports, "autonomousPoliticalAgent", { enumerable: true, get: function () { return autonomousAgent_1.autonomousPoliticalAgent; } });
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
function getServerDateMetadata() {
    const now = new Date();
    const fullDateString = now.toLocaleDateString("en-GB", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });
    const shortDateString = now.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
    });
    const year = now.getFullYear();
    const monthName = now.toLocaleDateString("en-GB", { month: "long" });
    const timestamp = now.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) + " GMT";
    return { fullDateString, shortDateString, year, monthName, timestamp };
}
function buildServerActionPrompt(data) {
    const action = String((data === null || data === void 0 ? void 0 : data.action) || "").trim();
    const dateMeta = getServerDateMetadata();
    switch (action) {
        case "factchecks": {
            return {
                systemInstruction: "You are a UK political data API with live Google Search access. Return ONLY valid JSON matching the schema implied by the prompt. Never wrap your response in markdown blocks.",
                prompt: `You are an expert UK political fact-checker and researcher with live Google Search access.
Audit and retrieve the latest high-profile political claims and independent fact-checking investigations across all UK political parties (Labour, Conservative, Reform UK, Liberal Democrats, Green Party, SNP, Plaid Cymru, Restore Britain).

GROUNDING & VERIFICATION RULES:
1. RECENCY FIRST:
   - Provide the most recent fact-checks first. Dates MUST be formatted as 'YYYY-MM-DD'.
2. INDEPENDENT SOURCES ONLY:
   - Citations must come from reputable fact-checking or non-partisan research institutions: Full Fact, BBC Reality Check, Channel 4 FactCheck, Institute for Fiscal Studies (IFS), Office for Budget Responsibility (OBR), National Audit Office (NAO), Migration Observatory, or RUSI.
   - Include valid sourceUrl and source name.
3. VERDICT TAXONOMY:
   - verdict MUST be one of: 'False' | 'Misleading' | 'Disputed' | 'Needs Context' | 'Unproven' | 'Accurate'.
4. STRICT SCHEMA:
   - partyId MUST be one of: 'labour' | 'conservative' | 'reform' | 'libdem' | 'green' | 'snp' | 'plaid' | 'restore'.
   - category MUST be one of: 'defence' | 'economy' | 'welfare' | 'nhs' | 'immigration' | 'energy' | 'housing' | 'education' | 'governance'.

Return a JSON array of 10 to 14 FactCheckItem objects (ordered by newest date descending):
Array<{
  id: string;
  partyId: "labour" | "conservative" | "reform" | "libdem" | "green" | "snp" | "plaid" | "restore";
  speaker: string;
  date: string;
  claim: string;
  verdict: "False" | "Misleading" | "Disputed" | "Needs Context" | "Unproven" | "Accurate";
  explanation: string;
  source: string;
  sourceUrl: string;
  category: "defence" | "economy" | "welfare" | "nhs" | "immigration" | "energy" | "housing" | "education" | "governance";
}>`,
            };
        }
        case "personDossier": {
            const personName = String((data === null || data === void 0 ? void 0 : data.personName) || "").slice(0, 120);
            const role = String((data === null || data === void 0 ? void 0 : data.role) || "").slice(0, 160);
            const partyName = String((data === null || data === void 0 ? void 0 : data.partyName) || "").slice(0, 100);
            const constituency = (data === null || data === void 0 ? void 0 : data.constituency) ? String(data.constituency).slice(0, 120) : "";
            if (!personName) {
                throw new Error("personName is required for personDossier.");
            }
            return {
                systemInstruction: "You are an objective UK parliamentary research analyst with live Google Search access.",
                prompt: `You are an expert UK parliamentary researcher and political intelligence analyst.
Provide an up-to-the-minute factual intelligence dossier on:
- Name: ${personName}
- Current Role: ${role}
- Party: ${partyName}
${constituency ? `- Constituency / Base: ${constituency}` : ""}
- Context Date: ${dateMeta.monthName} ${dateMeta.year}

Provide a comprehensive, strictly factual, and non-partisan summary covering:
1. RECENT KEY ACTIONS & POLICY MOVES (3-4 bullet points detailing specific bills introduced, parliamentary speeches, departmental decisions, committee appearances, or campaign launches).
2. LATEST PUBLIC STATEMENTS & QUOTES (2 concrete statements or stances on national policy issues like the economy, public services, defence, energy, or party strategy).
3. CURRENT STRATEGIC CONTEXT (1-2 sentences on their current political influence, standing within their party, or upcoming parliamentary priorities).

Format cleanly with markdown bold headers and bullet points. Be specific with figures, names of initiatives, and dates where known. Keep tone strictly objective and factual.`,
            };
        }
        case "policyQuestion": {
            const question = String((data === null || data === void 0 ? void 0 : data.question) || "").trim().slice(0, 500);
            const contextText = String((data === null || data === void 0 ? void 0 : data.contextText) || "").slice(0, 6000);
            if (!question) {
                throw new Error("question is required for policyQuestion.");
            }
            return {
                systemInstruction: "You are a senior UK political analyst with live Google Search access. Provide a clear, factual, objective markdown briefing grounded in the latest UK political developments.",
                prompt: `You are the Westminster Policy Tracker, an authoritative UK parliamentary intelligence and policy verification engine with live Google Search access.

CRITICAL TEMPORAL MANDATE (MANDATORY CURRENT-DAY ANCHOR):
- TODAY'S DATE IS: ${dateMeta.fullDateString}.
- THE CURRENT YEAR IS: ${dateMeta.year}.
- CURRENT TIME: ${dateMeta.timestamp}.
- You MUST evaluate and answer this question strictly from the perspective of TODAY (${dateMeta.fullDateString}), using Google Search to verify any recent UK party policy announcements, white papers, or bills.
- Under NO circumstances may you terminate your analysis in 2024 or early 2025.
- If the user asks about ongoing legislation, immigration announcements, fiscal rules, tax thresholds, benefits, or uprating formulas:
  1. Clearly state the ACTIVE CURRENT STATUS right now in ${dateMeta.monthName} ${dateMeta.year}.
  2. Detail how previous decisions have taken effect and what current rules or bills are operational today.
  3. Address the live parliamentary dynamics and recent party overhauls.
  4. Detail the contrasting positions of the political parties based on their latest verified platforms.

${contextText}

USER QUESTION:
"${question}"

REQUIRED RESPONSE FORMAT:
- Output clean Markdown with clear section headings (###) and bullet points.
- Section 1: ### 1. Current Active Status (As of ${dateMeta.fullDateString})
- Section 2: ### 2. Live Parliamentary & Policy Dynamics
- Section 3: ### 3. Cross-Party Positions & Battlegrounds

Tone: Strictly objective, analytical, impartial, and grounded in official parliamentary records.`,
            };
        }
        case "verifyPledge": {
            const partyName = String((data === null || data === void 0 ? void 0 : data.partyName) || "").slice(0, 100);
            const topicTitle = String((data === null || data === void 0 ? void 0 : data.topicTitle) || "").slice(0, 200);
            const pledgeHeadline = String((data === null || data === void 0 ? void 0 : data.pledgeHeadline) || "").slice(0, 300);
            const pledgeSummary = String((data === null || data === void 0 ? void 0 : data.pledgeSummary) || "").slice(0, 1000);
            const spokespersonContext = String((data === null || data === void 0 ? void 0 : data.spokespersonContext) || "").slice(0, 300);
            const leaderContext = String((data === null || data === void 0 ? void 0 : data.leaderContext) || "").slice(0, 300);
            if (!partyName || !pledgeHeadline) {
                throw new Error("partyName and pledgeHeadline are required for verifyPledge.");
            }
            return {
                systemInstruction: "You are an independent UK political fact-checker with live Google Search access. Return ONLY valid JSON matching the requested schema.",
                prompt: `You are the Westminster Policy Tracker Parliamentary Scrutiny Engine with live Google Search access.

CRITICAL RECENCY & PERSONNEL MANDATE (STRICT 2024–2026 ENFORCEMENT):
- Current Date: ${dateMeta.fullDateString}.
- Current Year: ${dateMeta.year}.
- Current Parliament: Active 2024–2029 Parliament.
- Use Google Search to perform an objective, strictly factual recency verification of the following UK political pledge:
  Party: ${partyName}
  Policy Area: ${topicTitle}
  Stated Headline: "${pledgeHeadline}"
  Stated Summary: "${pledgeSummary}"

PERSONNEL & TEMPORAL CONSTRAINTS:
${spokespersonContext}
${leaderContext}
- You MUST ONLY cite statements from the CURRENT Parliament (2024–2026, following the July 2024 General Election).
- Note parliamentary status: Opposition parties (e.g. Conservatives, Reform, Lib Dems) hold Shadow or Spokesperson roles, not Government Secretary of State posts.

Investigate via Google Search:
1. Has ${partyName} recently announced a major policy overhaul, white paper, or updated stance in "${topicTitle}" that modifies, expands, or supersedes the stated headline?
2. When was this pledge (or its updated version) last officially reaffirmed or announced by CURRENT party leadership or frontbench spokespeople?
3. Provide the most recent direct ministerial or spokesperson quote from 2024–2026 regarding this specific policy.
4. Assign an objective verdict: "Confirmed Active", "Conditional / Pending Review", "Modified", or "Superseded".
5. If the party's current policy has evolved beyond "${pledgeHeadline}" (i.e. verdict is "Modified" or "Superseded"), populate "updatedPledge" with the latest official headline, summary, 3-4 keyPoints, costEstimate, timeline, officialSourceTitle, and officialSourceUrl. Otherwise set "updatedPledge" to null.

Return your response in STRICT valid JSON with these exact keys:
{
  "verdict": "Confirmed Active",
  "lastAffirmedSummary": "1-2 sentences on when and where this policy was last officially affirmed or updated by current frontbenchers.",
  "quoteText": "Exact quote words spoken or written by the politician in 2024-2026.",
  "quoteSpeaker": "Full name and parliamentary/party title of active 2024-2026 frontbencher.",
  "quoteDate": "Month and Year or specific date in 2024-2026.",
  "quoteContext": "Venue or forum where said (e.g. House of Commons Hansard Debate, Party Conference, Official Policy Launch).",
  "statusAnalysis": "2-3 concise bullet points on current statutory pathway, key mechanisms, and funding conditionality.",
  "updatedPledge": null
}`,
            };
        }
        case "latestDecisions": {
            const categoryFilter = (data === null || data === void 0 ? void 0 : data.category) && data.category !== "all" ? String(data.category).slice(0, 80) : "";
            const categoryClause = categoryFilter
                ? `Focus on the "${categoryFilter}" sector.`
                : `Draw across core UK sectors: Immigration, Economy, Welfare, NHS, Energy, Housing, Education, Defence.`;
            return {
                systemInstruction: "You are a UK political data API with live Google Search access. Return ONLY valid JSON matching the schema implied by the prompt. Never label historical events as Today.",
                prompt: `You are the Westminster Policy Tracker with live Google Search access. Return a JSON array of the 8 most recent and significant real-world UK policy decisions, enacted acts, white papers, and official party policy overhauls from the 2025–2026 UK political cycle evaluated as of ${dateMeta.fullDateString}.
CRITICAL FILTER & DATE INTEGRITY RULES:
- ${categoryClause}
- Focus EXCLUSIVELY on substantive policy decisions, enacted legislation, government white papers, or major official party policy overhauls.
- STRICT DATE RULE: In the "time" field, you MUST state the ACTUAL Month & Year (or specific date) when the announcement or legislation occurred (e.g. "Oct 2026 • Policy Launch", "Sep 2026 • White Paper", "May 2025 • Royal Assent"). NEVER write "Today" or "Yesterday" unless the event literally occurred on ${dateMeta.fullDateString}.
- Order from most recent to oldest.

Return STRICT JSON matching this schema:
[
  {
    "id": "live-decision-1",
    "time": "Oct 2026 • Policy Launch",
    "title": "Clear headline of the policy decision or party announcement",
    "party": "Reform UK",
    "partyColor": "#12B6CF",
    "category": "Immigration",
    "tag": "Official Party Blueprint",
    "summary": "Precise 2-sentence summary of the decision and its statutory effect.",
    "statutoryVehicle": "e.g. Public General Act, Command Paper, or Official Party Policy Blueprint",
    "fiscalImpact": "e.g. £7bn/yr projected saving or £2.9bn baseline allocation",
    "crossPartyStance": "e.g. Opposed by Labour; Conservatives back ECHR exit",
    "deepDiveDetails": "2 concise paragraphs explaining what was decided, key numbers/mechanisms, and implementation timeline."
  }
]`,
            };
        }
        case "customTopic": {
            const cleanQuery = String((data === null || data === void 0 ? void 0 : data.topicQuery) || "").trim().slice(0, 160);
            if (!cleanQuery) {
                throw new Error("topicQuery is required for customTopic.");
            }
            const slug = cleanQuery
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "")
                .slice(0, 40);
            return {
                systemInstruction: "You are an impartial UK Parliamentary Policy Comparison API with live Google Search access. Return ONLY valid JSON matching the requested PolicyTopic schema.",
                prompt: `You are a non-partisan UK Parliamentary Research & Policy Comparison Engine with live Google Search access.
Today's Date: ${dateMeta.fullDateString} (${dateMeta.monthName} ${dateMeta.year}).

The user wants a comprehensive, side-by-side 8-party policy comparison on the following UK policy topic:
TOPIC QUERY: "${cleanQuery}"

Use Google Search to verify the current 2025/2026 official positions, enacted legislation, manifestos, and frontbench announcements for all 8 UK political parties on "${cleanQuery}":
1. "labour" (Governing Labour Party)
2. "conservative" (Official Opposition Conservative Party)
3. "reform" (Reform UK)
4. "libdem" (Liberal Democrats)
5. "green" (Green Party of England & Wales)
6. "snp" (Scottish National Party)
7. "plaid" (Plaid Cymru)
8. "restore" (Restore Britain)

Return ONLY valid JSON matching this exact PolicyTopic structure (no markdown code fences):
{
  "id": "custom-${slug}-${Date.now()}",
  "category": "custom",
  "title": "Formal, clear UK Policy Title for '${cleanQuery}'",
  "description": "Concise 1-sentence explanation of the core policy debate, legislation, and trade-offs across Westminster.",
  "officialFigureBenchmark": {
    "label": "Relevant Official UK Benchmark Metric Label",
    "value": "Specific current statistic or expenditure figure",
    "source": "Official UK source (e.g. ONS / HM Treasury / House of Commons Library)"
  },
  "publicOpinionQuestion": "Relevant YouGov / Ipsos style public opinion question on this issue?",
  "publicOpinionSupportOverall": 62,
  "pledges": {
    "labour": {
      "partyId": "labour",
      "headline": "Concise, specific headline of Labour's 2026 policy & legislation on this issue",
      "summary": "2-sentence factual summary of Labour's active policy, legislation, or government programme.",
      "keyPoints": [
        "Specific policy mechanism or statutory measure 1",
        "Specific policy mechanism or target 2",
        "Specific funding or regulatory commitment 3",
        "Specific timeline or reform 4"
      ],
      "costEstimate": "Estimated fiscal cost or funding mechanism",
      "targetTimeline": "Implementation timeline (e.g. 2025–2029 Parliament)",
      "factCheckSnippet": "Independent assessment from IFS, Full Fact, House of Commons Library, or National Audit Office.",
      "factCheckVerdict": "verified",
      "factCheckSource": "Name of independent body (e.g. Full Fact / IFS / HoC Library)",
      "officialSourceTitle": "Labour Party / UK Government Official Policy",
      "officialSourceUrl": "https://labour.org.uk/change",
      "lastVerifiedDate": "${dateMeta.monthName} ${dateMeta.year}"
    },
    "conservative": { "partyId": "conservative", "headline": "...", "summary": "...", "keyPoints": ["...", "...", "...", "..."], "costEstimate": "...", "targetTimeline": "...", "factCheckSnippet": "...", "factCheckVerdict": "clarified", "factCheckSource": "...", "officialSourceTitle": "Conservative Party Official Plan", "officialSourceUrl": "https://www.conservatives.com/our-plan", "lastVerifiedDate": "${dateMeta.monthName} ${dateMeta.year}" },
    "reform": { "partyId": "reform", "headline": "...", "summary": "...", "keyPoints": ["...", "...", "...", "..."], "costEstimate": "...", "targetTimeline": "...", "factCheckSnippet": "...", "factCheckVerdict": "disputed", "factCheckSource": "...", "officialSourceTitle": "Reform UK Official Policy Contract", "officialSourceUrl": "https://www.reformparty.uk/policies", "lastVerifiedDate": "${dateMeta.monthName} ${dateMeta.year}" },
    "libdem": { "partyId": "libdem", "headline": "...", "summary": "...", "keyPoints": ["...", "...", "...", "..."], "costEstimate": "...", "targetTimeline": "...", "factCheckSnippet": "...", "factCheckVerdict": "verified", "factCheckSource": "...", "officialSourceTitle": "Liberal Democrats Official Plan", "officialSourceUrl": "https://www.libdems.org.uk/plan", "lastVerifiedDate": "${dateMeta.monthName} ${dateMeta.year}" },
    "green": { "partyId": "green", "headline": "...", "summary": "...", "keyPoints": ["...", "...", "...", "..."], "costEstimate": "...", "targetTimeline": "...", "factCheckSnippet": "...", "factCheckSource": "...", "factCheckVerdict": "clarified", "officialSourceTitle": "Green Party Official Manifesto", "officialSourceUrl": "https://greenparty.org.uk/manifesto", "lastVerifiedDate": "${dateMeta.monthName} ${dateMeta.year}" },
    "snp": { "partyId": "snp", "headline": "...", "summary": "...", "keyPoints": ["...", "...", "...", "..."], "costEstimate": "...", "targetTimeline": "...", "factCheckSnippet": "...", "factCheckVerdict": "verified", "factCheckSource": "...", "officialSourceTitle": "SNP Official Policy Platform", "officialSourceUrl": "https://www.snp.org/policies", "lastVerifiedDate": "${dateMeta.monthName} ${dateMeta.year}" },
    "plaid": { "partyId": "plaid", "headline": "...", "summary": "...", "keyPoints": ["...", "...", "...", "..."], "costEstimate": "...", "targetTimeline": "...", "factCheckSnippet": "...", "factCheckVerdict": "verified", "factCheckSource": "...", "officialSourceTitle": "Plaid Cymru Official Policy Platform", "officialSourceUrl": "https://partyof.wales/policies", "lastVerifiedDate": "${dateMeta.monthName} ${dateMeta.year}" },
    "restore": { "partyId": "restore", "headline": "...", "summary": "...", "keyPoints": ["...", "...", "...", "..."], "costEstimate": "...", "targetTimeline": "...", "factCheckSnippet": "...", "factCheckVerdict": "disputed", "factCheckSource": "...", "officialSourceTitle": "Restore Britain Official Platform", "officialSourceUrl": "https://restorebritain.org.uk", "lastVerifiedDate": "${dateMeta.monthName} ${dateMeta.year}" }
  }
}

IMPORTANT:
- Every party MUST have a complete, detailed entry in "pledges" with 3–4 concrete "keyPoints".
- "factCheckVerdict" MUST be one of: "verified", "disputed", "unfunded", "clarified".`,
            };
        }
        default:
            throw new Error("Unsupported or missing action parameter.");
    }
}
const VALID_PARTIES = new Set([
    "labour",
    "conservative",
    "reform",
    "libdem",
    "green",
    "snp",
    "plaid",
    "restore",
]);
/**
 * Live Grounded Gemini Query Endpoint
 * All prompts and systemInstructions are constructed strictly server-side based on a whitelisted action.
 */
exports.askGemini = (0, https_1.onCall)({ secrets: [geminiApiKey], cors: true, timeoutSeconds: 120 }, async (request) => {
    var _a, _b, _c, _d, _e;
    try {
        const reqData = request.data || {};
        const { prompt, systemInstruction, disableSearch } = buildServerActionPrompt(reqData);
        const ai = new genai_1.GoogleGenAI({ apiKey: geminiApiKey.value() });
        const config = {
            temperature: 0.15,
        };
        if (systemInstruction) {
            config.systemInstruction = systemInstruction;
        }
        if (!disableSearch) {
            config.tools = [{ googleSearch: {} }];
        }
        const response = await ai.models.generateContent({
            model: "gemini-3.8-flash",
            contents: prompt,
            config,
        });
        const responseText = response.text || "";
        // Server-side persistence when Gemini itself verifies a modified or superseded pledge
        if (reqData.action === "verifyPledge" &&
            typeof reqData.topicId === "string" &&
            typeof reqData.partyId === "string" &&
            VALID_PARTIES.has(reqData.partyId)) {
            try {
                const parsed = (0, autonomousAgent_1.extractJsonFromText)(responseText);
                const vLower = String((parsed === null || parsed === void 0 ? void 0 : parsed.verdict) || "").toLowerCase();
                if ((vLower.includes("modified") || vLower.includes("superseded")) &&
                    ((_a = parsed === null || parsed === void 0 ? void 0 : parsed.updatedPledge) === null || _a === void 0 ? void 0 : _a.headline) &&
                    ((_b = parsed === null || parsed === void 0 ? void 0 : parsed.updatedPledge) === null || _b === void 0 ? void 0 : _b.summary) &&
                    parsed.updatedPledge.headline !== reqData.pledgeHeadline) {
                    const topicId = reqData.topicId.slice(0, 100);
                    const partyId = reqData.partyId;
                    const docRef = db.collection("policies").doc(topicId);
                    const snap = await docRef.get();
                    if (snap.exists) {
                        const existingData = snap.data() || {};
                        const pledges = existingData.pledges || {};
                        const dateMeta = getServerDateMetadata();
                        pledges[partyId] = Object.assign(Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (pledges[partyId] || {})), { headline: String(parsed.updatedPledge.headline).slice(0, 300), summary: String(parsed.updatedPledge.summary).slice(0, 1000) }), (Array.isArray(parsed.updatedPledge.keyPoints)
                            ? { keyPoints: parsed.updatedPledge.keyPoints.slice(0, 5).map((k) => String(k).slice(0, 300)) }
                            : {})), (parsed.updatedPledge.costEstimate
                            ? { costEstimate: String(parsed.updatedPledge.costEstimate).slice(0, 200) }
                            : {})), (parsed.updatedPledge.timeline
                            ? { targetTimeline: String(parsed.updatedPledge.timeline).slice(0, 200) }
                            : {})), { partyId, factCheckVerdict: "verified", lastVerifiedDate: `Verified ${dateMeta.monthName} ${dateMeta.year}` });
                        const todayStr = new Date().toISOString().split("T")[0];
                        await docRef.set(Object.assign(Object.assign({}, existingData), { pledges, updatedAt: todayStr }), { merge: true });
                    }
                }
            }
            catch (persistErr) {
                console.warn("Server-side verifyPledge persistence skipped:", persistErr);
            }
        }
        const groundingMeta = (_d = (_c = response.candidates) === null || _c === void 0 ? void 0 : _c[0]) === null || _d === void 0 ? void 0 : _d.groundingMetadata;
        const searchQueries = (groundingMeta === null || groundingMeta === void 0 ? void 0 : groundingMeta.webSearchQueries) || [];
        const sources = ((_e = groundingMeta === null || groundingMeta === void 0 ? void 0 : groundingMeta.groundingChunks) === null || _e === void 0 ? void 0 : _e.map((c) => {
            var _a, _b;
            return ({
                title: ((_a = c.web) === null || _a === void 0 ? void 0 : _a.title) || "Verified Web Source",
                uri: ((_b = c.web) === null || _b === void 0 ? void 0 : _b.uri) || "",
            });
        }).filter((s) => s.uri)) || [];
        return {
            text: responseText,
            searchQueries,
            sources: sources.slice(0, 8),
        };
    }
    catch (error) {
        console.error("Gemini AI Error:", error);
        throw new Error(`Failed to generate AI response: ${error.message}`);
    }
});
/**
 * On-Demand Live Policy & News Audit (Callable from 'Update Policy Matrix' & 'Sync All')
 * Never accepts arbitrary client-supplied policy documents.
 */
exports.auditAndSyncPolicies = (0, https_1.onCall)({ secrets: [geminiApiKey], cors: true, timeoutSeconds: 180 }, async (request) => {
    var _a;
    try {
        const rawCategory = (_a = request.data) === null || _a === void 0 ? void 0 : _a.category;
        const safeCategory = typeof rawCategory === "string" ? rawCategory.trim().slice(0, 60) : "all";
        const result = await (0, autonomousAgent_1.runAutonomousAudit)(geminiApiKey.value(), safeCategory || "all", {
            includeFactChecks: false,
        });
        return result;
    }
    catch (error) {
        console.error("auditAndSyncPolicies Error:", error);
        throw new Error(`Live policy audit failed: ${error.message}`);
    }
});
/**
 * Locked-down legacy endpoint: direct client pledge writes are strictly forbidden.
 * Pledge updates are verified and persisted exclusively server-side inside askGemini.
 */
exports.updatePledgeInFirestore = (0, https_1.onCall)({ cors: true, timeoutSeconds: 15 }, async () => {
    throw new https_1.HttpsError("permission-denied", "Direct client writes are disabled. Pledge updates are verified and persisted strictly server-side.");
});
/**
 * On-Demand Media Lens Multi-Spectrum Newspaper Analyzer
 * Never accepts arbitrary client-supplied story documents.
 */
exports.analyzeMediaLens = (0, https_1.onCall)({ secrets: [geminiApiKey], cors: true, timeoutSeconds: 120 }, async (request) => {
    var _a;
    try {
        const rawTopic = (_a = request.data) === null || _a === void 0 ? void 0 : _a.customTopic;
        const safeTopic = typeof rawTopic === "string" && rawTopic.trim().length > 0
            ? rawTopic.trim().slice(0, 160)
            : undefined;
        const result = await (0, autonomousAgent_1.runMediaLensAnalysis)(geminiApiKey.value(), safeTopic);
        return result;
    }
    catch (error) {
        console.error("analyzeMediaLens Error:", error);
        throw new Error(`Failed to analyze UK media framing: ${error.message}`);
    }
});
//# sourceMappingURL=index.js.map