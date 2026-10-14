"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.autonomousPoliticalAgent = void 0;
exports.fetchMultiSourceNewsDigest = fetchMultiSourceNewsDigest;
exports.extractJsonFromText = extractJsonFromText;
exports.runAutonomousAudit = runAutonomousAudit;
const scheduler_1 = require("firebase-functions/v2/scheduler");
const params_1 = require("firebase-functions/params");
const genai_1 = require("@google/genai");
const admin = require("firebase-admin");
const Parser = require("rss-parser");
if (!admin.apps.length) {
    admin.initializeApp();
}
const db = admin.firestore();
const parser = new Parser({ timeout: 4500 });
const geminiApiKey = (0, params_1.defineSecret)("GEMINI_API_KEY");
const RSS_FEEDS = [
    { name: "BBC Politics", url: "https://feeds.bbci.co.uk/news/politics/rss.xml" },
    { name: "The Guardian UK Politics", url: "https://www.theguardian.com/politics/rss" },
    { name: "Sky News Politics", url: "https://feeds.skynews.com/feeds/rss/politics.xml" },
];
async function fetchMultiSourceNewsDigest(maxItemsPerFeed = 6) {
    const feedResults = await Promise.allSettled(RSS_FEEDS.map(async (f) => {
        const parsed = await parser.parseURL(f.url);
        const items = (parsed.items || []).slice(0, maxItemsPerFeed);
        return items.map((item) => `[${f.name}] Title: ${item.title}\nSummary: ${item.contentSnippet || item.content || ""}\nDate: ${item.pubDate || item.isoDate || ""}`);
    }));
    const allItems = [];
    for (const res of feedResults) {
        if (res.status === "fulfilled") {
            allItems.push(...res.value);
        }
    }
    return allItems.join("\n\n---\n\n");
}
function extractJsonFromText(text) {
    const cleaned = text
        .replace(/^\s*```(json)?/im, "")
        .replace(/```\s*$/im, "")
        .trim();
    try {
        return JSON.parse(cleaned);
    }
    catch (_a) {
        const objMatch = cleaned.match(/\{[\s\S]*\}/);
        if (objMatch) {
            return JSON.parse(objMatch[0]);
        }
        const arrMatch = cleaned.match(/\[[\s\S]*\]/);
        if (arrMatch) {
            return JSON.parse(arrMatch[0]);
        }
        throw new Error("Could not parse JSON from AI response");
    }
}
async function runAutonomousAudit(apiKey, targetCategory, options) {
    var _a, _b, _c, _d;
    const includeFactChecks = (_a = options === null || options === void 0 ? void 0 : options.includeFactChecks) !== null && _a !== void 0 ? _a : false;
    const todayStr = new Date().toISOString().split("T")[0];
    const monthYearStr = new Date().toLocaleDateString("en-GB", { month: "long", year: "numeric" });
    // 1. Fetch multi-source RSS news digest & Firestore policies in parallel
    const [recentNews, policiesSnap] = await Promise.all([
        fetchMultiSourceNewsDigest(6),
        db.collection("policies").get(),
    ]);
    const currentPolicies = [];
    policiesSnap.forEach((doc) => {
        const data = doc.data();
        if (!targetCategory || targetCategory === "all" || data.category === targetCategory || data.id === targetCategory) {
            currentPolicies.push(data);
        }
    });
    // Build a compact summary of current stored policy headlines & summaries so Gemini can spot outdated stances rapidly
    const currentPolicySnapshot = currentPolicies.map((topic) => ({
        id: topic.id,
        category: topic.category,
        title: topic.title,
        pledges: Object.fromEntries(Object.entries(topic.pledges || {}).map(([pid, p]) => [
            pid,
            {
                headline: p.headline,
                summary: p.summary,
                lastVerifiedDate: p.lastVerifiedDate,
            },
        ])),
    }));
    const ai = new genai_1.GoogleGenAI({ apiKey });
    const factCheckTaskClause = includeFactChecks
        ? `3. Also identify up to 5 major new fact-checkable claims from recent UK political news for our 'factCheckUpdates' list.`
        : `3. Set "factCheckUpdates": [] (skip fact-check generation in this fast policy matrix sync).`;
    const prompt = `You are the Autonomous UK Political Database Admin with live Google Search access.
Today's Date: ${todayStr} (${monthYearStr}).

Here is the latest multi-source UK political RSS digest:
${recentNews || "Use live Google Search to check latest UK political announcements."}

Here is the current snapshot of our stored UK party policies (${targetCategory && targetCategory !== "all" ? `Filtered to sector: ${targetCategory}` : "All sectors"}):
${JSON.stringify(currentPolicySnapshot)}

YOUR TASK:
1. Use Google Search to check for recent 2025/2026 UK political policy announcements, white papers, legislation, or major party policy shifts across UK parties (labour, conservative, reform, libdem, green, snp, plaid, restore)${targetCategory && targetCategory !== "all" ? ` specifically in the "${targetCategory}" policy area` : ""}.
2. Compare live reality against our stored policy snapshot above. If ANY party has announced a major policy shift, tougher target, new legislation, or updated platform that is missing or outdated in our stored snapshot, include a 'policyUpdates' entry to update that party's pledge! If our stored snapshot already includes the latest announcements, return an empty 'policyUpdates' array.
${factCheckTaskClause}

Return ONLY valid JSON matching this exact structure (no markdown fences):
{
  "policyUpdates": [
    {
      "topicId": "exact topic.id from the snapshot above (e.g. immigration-and-borders)",
      "partyId": "labour" | "conservative" | "reform" | "libdem" | "green" | "snp" | "plaid" | "restore",
      "headline": "Updated concise headline reflecting current 2026 stance",
      "summary": "Updated 2-sentence factual summary of the party's current position",
      "keyPoints": [
        "Concrete bullet point 1",
        "Concrete bullet point 2",
        "Concrete bullet point 3",
        "Concrete bullet point 4"
      ],
      "costEstimate": "Updated fiscal estimate or funding mechanism",
      "targetTimeline": "Updated implementation timeline",
      "factCheckSnippet": "Concise independent assessment (IFS, Full Fact, Migration Observatory, OBR, etc.)",
      "factCheckSource": "Name of independent body",
      "officialSourceTitle": "Official Policy Document / Announcement Title",
      "changeReason": "1-sentence explanation of what changed and why"
    }
  ],
  "factCheckUpdates": []
}`;
    const response = await ai.models.generateContent({
        model: "gemini-3.8-flash",
        contents: prompt,
        config: {
            temperature: 0.1,
            tools: [{ googleSearch: {} }],
        },
    });
    const groundingMeta = (_c = (_b = response.candidates) === null || _b === void 0 ? void 0 : _b[0]) === null || _c === void 0 ? void 0 : _c.groundingMetadata;
    const searchQueries = (groundingMeta === null || groundingMeta === void 0 ? void 0 : groundingMeta.webSearchQueries) || [];
    const sources = ((_d = groundingMeta === null || groundingMeta === void 0 ? void 0 : groundingMeta.groundingChunks) === null || _d === void 0 ? void 0 : _d.map((c) => { var _a, _b; return ({ title: ((_a = c.web) === null || _a === void 0 ? void 0 : _a.title) || "Web Source", uri: ((_b = c.web) === null || _b === void 0 ? void 0 : _b.uri) || "" }); }).filter((s) => s.uri)) || [];
    const parsed = extractJsonFromText(response.text || '{"policyUpdates":[],"factCheckUpdates":[]}');
    const policyUpdates = Array.isArray(parsed.policyUpdates) ? parsed.policyUpdates : [];
    const factCheckUpdates = Array.isArray(parsed.factCheckUpdates) ? parsed.factCheckUpdates : [];
    const batch = db.batch();
    const appliedPolicyChanges = [];
    // Apply policy updates to Firestore
    const topicMap = new Map(currentPolicies.map((t) => [t.id, t]));
    const modifiedTopicIds = new Set();
    for (const upd of policyUpdates) {
        const topic = topicMap.get(upd.topicId);
        if (!topic || !topic.pledges || !upd.partyId)
            continue;
        const existingPledge = topic.pledges[upd.partyId] || { partyId: upd.partyId };
        const oldHeadline = existingPledge.headline;
        topic.pledges[upd.partyId] = Object.assign(Object.assign({}, existingPledge), { partyId: upd.partyId, headline: upd.headline || existingPledge.headline, summary: upd.summary || existingPledge.summary, keyPoints: Array.isArray(upd.keyPoints) && upd.keyPoints.length > 0 ? upd.keyPoints : existingPledge.keyPoints, costEstimate: upd.costEstimate || existingPledge.costEstimate, targetTimeline: upd.targetTimeline || existingPledge.targetTimeline, factCheckSnippet: upd.factCheckSnippet || existingPledge.factCheckSnippet, factCheckSource: upd.factCheckSource || existingPledge.factCheckSource, officialSourceTitle: upd.officialSourceTitle || existingPledge.officialSourceTitle, lastVerifiedDate: `Verified ${monthYearStr}` });
        modifiedTopicIds.add(topic.id);
        appliedPolicyChanges.push({
            category: topic.category,
            partyId: upd.partyId,
            topicTitle: topic.title,
            oldHeadline,
            newHeadline: upd.headline,
            details: upd.changeReason || `Updated ${upd.partyId.toUpperCase()} stance on ${topic.title}: "${upd.headline}"`,
        });
    }
    for (const topicId of modifiedTopicIds) {
        const updatedTopic = topicMap.get(topicId);
        if (updatedTopic) {
            batch.set(db.collection("policies").doc(topicId), updatedTopic, { merge: true });
        }
    }
    // Apply fact check updates to Firestore
    for (const fc of factCheckUpdates) {
        if (fc.id && fc.partyId && fc.claim) {
            batch.set(db.collection("factchecks").doc(fc.id), fc, { merge: true });
        }
    }
    // Log agent execution status in Firestore
    const statusRecord = {
        lastRunAt: new Date().toISOString(),
        targetCategory: targetCategory || "all",
        policyUpdatesCount: appliedPolicyChanges.length,
        factCheckUpdatesCount: factCheckUpdates.length,
        appliedPolicyChanges,
        searchQueries,
        sources: sources.slice(0, 10),
    };
    batch.set(db.collection("system_status").doc("autonomous_agent"), statusRecord, { merge: true });
    await batch.commit();
    return Object.assign(Object.assign({}, statusRecord), { updatedPolicies: Array.from(topicMap.values()) });
}
exports.autonomousPoliticalAgent = (0, scheduler_1.onSchedule)({
    schedule: "every 6 hours",
    secrets: [geminiApiKey],
    timeoutSeconds: 300,
}, async () => {
    try {
        console.log("Autonomous Political Agent waking up for multi-source + Google Search audit...");
        const result = await runAutonomousAudit(geminiApiKey.value(), "all");
        console.log(`Autonomous audit complete: ${result.policyUpdatesCount} policy updates, ${result.factCheckUpdatesCount} fact-checks.`);
    }
    catch (error) {
        console.error("Autonomous Agent encountered an error:", error);
    }
});
//# sourceMappingURL=autonomousAgent.js.map