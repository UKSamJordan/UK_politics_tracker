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
/**
 * Live Grounded Gemini Query Endpoint
 * Enables Google Search Grounding (tools: [{ googleSearch: {} }]) by default so
 * every query, verification, and briefing has live access to current UK political news.
 */
exports.askGemini = (0, https_1.onCall)({ secrets: [geminiApiKey], cors: true, timeoutSeconds: 120 }, async (request) => {
    var _a, _b, _c;
    try {
        const { prompt, systemInstruction, disableSearch } = request.data || {};
        if (!prompt) {
            throw new Error("Prompt is required.");
        }
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
        const groundingMeta = (_b = (_a = response.candidates) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.groundingMetadata;
        const searchQueries = (groundingMeta === null || groundingMeta === void 0 ? void 0 : groundingMeta.webSearchQueries) || [];
        const sources = ((_c = groundingMeta === null || groundingMeta === void 0 ? void 0 : groundingMeta.groundingChunks) === null || _c === void 0 ? void 0 : _c.map((c) => {
            var _a, _b;
            return ({
                title: ((_a = c.web) === null || _a === void 0 ? void 0 : _a.title) || "Verified Web Source",
                uri: ((_b = c.web) === null || _b === void 0 ? void 0 : _b.uri) || "",
            });
        }).filter((s) => s.uri)) || [];
        return {
            text: response.text || "",
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
 * Performs a multi-source RSS + Google Search grounded check on a specific policy category
 * (e.g. 'immigration') or across all policy areas, and persists updates directly to Firestore.
 */
exports.auditAndSyncPolicies = (0, https_1.onCall)({ secrets: [geminiApiKey], cors: true, timeoutSeconds: 180 }, async (request) => {
    try {
        const { category, seedPolicies, forceSeed } = request.data || {};
        // Only seed Firestore if forceSeed is explicitly true or if topics are missing from Firestore
        if (Array.isArray(seedPolicies) && seedPolicies.length > 0) {
            const existingSnap = await db.collection("policies").select().get();
            const existingIds = new Set(existingSnap.docs.map((d) => d.id));
            const seedBatch = db.batch();
            let hasWrites = false;
            for (const topic of seedPolicies) {
                if (topic && topic.id && (forceSeed === true || !existingIds.has(topic.id))) {
                    seedBatch.set(db.collection("policies").doc(topic.id), topic, { merge: true });
                    hasWrites = true;
                }
            }
            if (hasWrites) {
                await seedBatch.commit();
            }
        }
        const result = await (0, autonomousAgent_1.runAutonomousAudit)(geminiApiKey.value(), category || "all", {
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
 * Persist an updated single party pledge or collection item to Firestore
 * Called when on-demand AI Pledge Verification detects a modified/superseded party policy.
 */
exports.updatePledgeInFirestore = (0, https_1.onCall)({ cors: true, timeoutSeconds: 60 }, async (request) => {
    try {
        const { topicId, partyId, updatedPledge } = request.data || {};
        if (!topicId || !partyId || !updatedPledge) {
            throw new Error("topicId, partyId, and updatedPledge are required.");
        }
        const docRef = db.collection("policies").doc(topicId);
        const snap = await docRef.get();
        if (!snap.exists) {
            throw new Error(`Policy topic ${topicId} not found in Firestore.`);
        }
        const data = snap.data() || {};
        const pledges = data.pledges || {};
        pledges[partyId] = Object.assign(Object.assign(Object.assign({}, (pledges[partyId] || {})), updatedPledge), { partyId });
        await docRef.set(Object.assign(Object.assign({}, data), { pledges }), { merge: true });
        return { success: true, topicId, partyId };
    }
    catch (error) {
        console.error("updatePledgeInFirestore Error:", error);
        throw new Error(`Failed to update pledge in Firestore: ${error.message}`);
    }
});
/**
 * On-Demand Media Lens ('Ground News for Westminster') Multi-Spectrum Newspaper Analyzer
 */
exports.analyzeMediaLens = (0, https_1.onCall)({ secrets: [geminiApiKey], cors: true, timeoutSeconds: 120 }, async (request) => {
    var _a;
    try {
        const { customTopic, seedStories } = request.data || {};
        if (Array.isArray(seedStories) && seedStories.length > 0) {
            const batch = db.batch();
            for (const story of seedStories) {
                if (story && story.id) {
                    batch.set(db.collection("media_lens").doc(story.id), story, { merge: true });
                }
            }
            await batch.commit();
            if (!customTopic && ((_a = request.data) === null || _a === void 0 ? void 0 : _a.seedOnly)) {
                return { stories: seedStories };
            }
        }
        const result = await (0, autonomousAgent_1.runMediaLensAnalysis)(geminiApiKey.value(), customTopic);
        return result;
    }
    catch (error) {
        console.error("analyzeMediaLens Error:", error);
        throw new Error(`Failed to analyze UK media framing: ${error.message}`);
    }
});
//# sourceMappingURL=index.js.map