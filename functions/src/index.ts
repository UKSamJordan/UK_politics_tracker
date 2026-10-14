import { onCall } from "firebase-functions/v2/https";
import { defineSecret } from "firebase-functions/params";
import { GoogleGenAI } from "@google/genai";
import * as admin from "firebase-admin";
import { autonomousPoliticalAgent, runAutonomousAudit } from "./autonomousAgent";

if (!admin.apps.length) {
  admin.initializeApp();
}
const db = admin.firestore();

const geminiApiKey = defineSecret("GEMINI_API_KEY");

/**
 * Live Grounded Gemini Query Endpoint
 * Enables Google Search Grounding (tools: [{ googleSearch: {} }]) by default so
 * every query, verification, and briefing has live access to current UK political news.
 */
export const askGemini = onCall(
  { secrets: [geminiApiKey], cors: true, timeoutSeconds: 120 },
  async (request) => {
    try {
      const { prompt, systemInstruction, disableSearch } = request.data || {};

      if (!prompt) {
        throw new Error("Prompt is required.");
      }

      const ai = new GoogleGenAI({ apiKey: geminiApiKey.value() });

      const config: any = {
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

      const groundingMeta = response.candidates?.[0]?.groundingMetadata;
      const searchQueries = groundingMeta?.webSearchQueries || [];
      const sources =
        groundingMeta?.groundingChunks
          ?.map((c: any) => ({
            title: c.web?.title || "Verified Web Source",
            uri: c.web?.uri || "",
          }))
          .filter((s: any) => s.uri) || [];

      return {
        text: response.text || "",
        searchQueries,
        sources: sources.slice(0, 8),
      };
    } catch (error: any) {
      console.error("Gemini AI Error:", error);
      throw new Error(`Failed to generate AI response: ${error.message}`);
    }
  }
);

/**
 * On-Demand Live Policy & News Audit (Callable from 'Update Policy Matrix' & 'Sync All')
 * Performs a multi-source RSS + Google Search grounded check on a specific policy category
 * (e.g. 'immigration') or across all policy areas, and persists updates directly to Firestore.
 */
export const auditAndSyncPolicies = onCall(
  { secrets: [geminiApiKey], cors: true, timeoutSeconds: 180 },
  async (request) => {
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

      const result = await runAutonomousAudit(geminiApiKey.value(), category || "all", {
        includeFactChecks: false,
      });
      return result;
    } catch (error: any) {
      console.error("auditAndSyncPolicies Error:", error);
      throw new Error(`Live policy audit failed: ${error.message}`);
    }
  }
);

/**
 * Persist an updated single party pledge or collection item to Firestore
 * Called when on-demand AI Pledge Verification detects a modified/superseded party policy.
 */
export const updatePledgeInFirestore = onCall(
  { cors: true, timeoutSeconds: 60 },
  async (request) => {
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
      pledges[partyId] = {
        ...(pledges[partyId] || {}),
        ...updatedPledge,
        partyId,
      };

      await docRef.set({ ...data, pledges }, { merge: true });
      return { success: true, topicId, partyId };
    } catch (error: any) {
      console.error("updatePledgeInFirestore Error:", error);
      throw new Error(`Failed to update pledge in Firestore: ${error.message}`);
    }
  }
);

export { autonomousPoliticalAgent };
