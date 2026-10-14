const fs = require('fs');

let content = fs.readFileSync('src/services/liveUpdater.ts', 'utf8');

content = `import { httpsCallable } from 'firebase/functions';
import { functions } from '../firebase';
` + content;

// Replace the getStoredApiKey function
content = content.replace(/export function getStoredApiKey\(\): string \| null \{[\s\S]*?^\}/m, `export function getStoredApiKey(): string | null {
  return "SERVER_SIDE_MANAGED";
}`);

// Remove saveApiKey and clearApiKey implementations just in case
content = content.replace(/export function saveApiKey\(key: string\) \{[\s\S]*?^\}/m, `export function saveApiKey(key: string) {
  console.log('API keys are now securely managed on the backend.');
}`);

content = content.replace(/export function clearApiKey\(\) \{[\s\S]*?^\}/m, `export function clearApiKey() {
  console.log('API keys are now securely managed on the backend.');
}`);

// Replace queryGemini
content = content.replace(/async function queryGemini\(prompt: string, apiKey: string, timeoutMs: number = 6000\): Promise<any> \{[\s\S]*?return JSON\.parse\(cleanText\);\n  \} catch \(err\) \{[\s\S]*?\} finally \{[\s\S]*?\}\n\}/m, `async function queryGemini(prompt: string, apiKey: string, timeoutMs: number = 6000): Promise<any> {
  try {
    const askGemini = httpsCallable(functions, 'askGemini');
    const result = await askGemini({ prompt, systemInstruction: "You are a UK political data API. You must return ONLY valid JSON matching the schema implied by the prompt. Never wrap your response in markdown blocks like \`\`\`json." });
    
    const data = result.data as { text: string };
    
    // Attempt to clean markdown backticks if any slipped through
    const cleanText = data.text.replace(/^\\s*\\x60\\x60\\x60(json)?/m, '').replace/\\x60\\x60\\x60\\s*$/, '');
    return JSON.parse(cleanText.trim());
  } catch (err: any) {
    console.error("Cloud Function AskGemini Error:", err);
    throw err;
  }
}`);

// Fix the backtick literal in the replace
content = content.replace(/cleanText\.replace\/\\\\x60/g, "cleanText.replace(/\\\\x60");

fs.writeFileSync('src/services/liveUpdater.ts', content);
