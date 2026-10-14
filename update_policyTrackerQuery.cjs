const fs = require('fs');

let content = fs.readFileSync('src/services/policyTrackerQuery.ts', 'utf8');

// Inject imports if not present
if (!content.includes('httpsCallable')) {
  content = `import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
` + content;
}

// First replacement (generatePoliticalInsight)
content = content.replace(/const url = `https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.8-flash:generateContent\?key=\$\{apiKey\}`;[\s\S]*?let answer = parts\.map\(\(p: any\) => p\.text \|\| ''\)\.filter\(Boolean\)\.join\('\\n\\n'\) \|\| 'No response returned from model\.';/m, `const askGemini = httpsCallable(functions, 'askGemini');
    const result = await askGemini({ prompt, systemInstruction: "You are a senior UK political analyst. Provide a short, factual, objective summary without formatting." });
    let answer = (result.data as any).text || 'No response returned from model.';`);

// Second replacement (verifyPledgeViaGemini)
content = content.replace(/const url = `https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.8-flash:generateContent\?key=\$\{apiKey\}`;[\s\S]*?const rawText = data\.candidates\?\.\[0\]\?\.content\?\.parts\?\.\[0\]\?\.text \|\| '';/m, `const askGemini = httpsCallable(functions, 'askGemini');
    const result = await askGemini({ prompt, systemInstruction: "You are an independent UK political fact-checker. Provide factual analysis of pledges." });
    const rawText = (result.data as any).text || '';`);
    
// We also need to remove the `!response.ok` check since httpsCallable throws.
// Wait, the original code had:
/*
    if (!response.ok) {
      // If API returns an error status (quota/auth), gracefully use verified ground-truth record
      return getGroundedPledgeFallback(partyName, topicTitle, pledgeHeadline, pledgeSummary, dateMeta);
    }
*/
// The try-catch block covers the httpsCallable error, so it will fall into `catch (err)` which already handles returning the fallback!
// Let's verify what `catch (err)` does in `verifyPledgeViaGemini`.
// `catch (err)`: `console.warn('Gemini verification query failed:', err); return getGroundedPledgeFallback(partyName, topicTitle, pledgeHeadline, pledgeSummary, dateMeta);`
// So it is safe to just replace up to `rawText`.

// Third replacement (fetchLiveDecisions)
content = content.replace(/const url = `https:\/\/generativelanguage\.googleapis\.com\/v1beta\/models\/gemini-3\.8-flash:generateContent\?key=\$\{apiKey\}`;[\s\S]*?const parsed = JSON\.parse\(text\);/m, `const askGemini = httpsCallable(functions, 'askGemini');
    const result = await askGemini({ prompt, systemInstruction: "You are a UK political data API. You must return ONLY valid JSON matching the schema implied by the prompt." });
    let text = (result.data as any).text || '[]';
    // Attempt to clean markdown backticks if any slipped through
    text = text.replace(/^\\s*\`\`\`(json)?/m, '').replace/\`\`\`\\s*$/, '');
    const parsed = JSON.parse(text.trim());`);
    
// Fix backticks
content = content.replace(/replace\/\\\`/g, "replace(/\\`");

// Clean up unused ApiKey code.
// The file has:
// const apiKey = getStoredApiKey();
// if (!apiKey) {
//   throw new Error('No active Gemini API key configured. Please enter your API key to activate live policy queries.');
// }
// I can just remove these checks!
content = content.replace(/const apiKey = getStoredApiKey\(\);\s*if \(\!apiKey\) \{\s*throw new Error\([^)]+\);\s*\}/g, "");
// And for fetchLiveDecisions:
// const apiKey = getStoredApiKey();
// if (!apiKey) return getFilteredFallbacks();
content = content.replace(/const apiKey = getStoredApiKey\(\);\s*if \(\!apiKey\) return [^;]+;/g, "");

fs.writeFileSync('src/services/policyTrackerQuery.ts', content);
