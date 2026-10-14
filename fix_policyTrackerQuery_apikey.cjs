const fs = require('fs');

let content = fs.readFileSync('src/services/policyTrackerQuery.ts', 'utf8');

// Remove import of getStoredApiKey
content = content.replace(/import \{ getStoredApiKey \} from '\.\/liveUpdater';\n/g, '');

// queryWestminsterPolicyTracker
content = content.replace(/customApiKey\?: string;/g, '');
content = content.replace(/const apiKey = \(options\.customApiKey \|\| ''\)\.trim\(\) \|\| getStoredApiKey\(\);\n\s*if \(!apiKey\) \{\n\s*throw new Error\('No active Gemini API key configured\. Please enter your API key to activate live policy queries\.'\);\n\s*\}/g, '');

// verifyPledgeRecency
content = content.replace(/customApiKey\?: string/g, '');
content = content.replace(/const apiKey = \(customApiKey \|\| ''\)\.trim\(\) \|\| getStoredApiKey\(\);\n\s*\/\/ If no API key configured, seamlessly return the grounded verified record\n\s*if \(!apiKey\) \{\n\s*return getGroundedPledgeFallback\(partyName, topicTitle, pledgeHeadline, pledgeSummary, dateMeta\);\n\s*\}/g, '');

// fetchLatestPolicyDecisions
// Need to be careful here
content = content.replace(/const apiKey = \(customApiKey \|\| ''\)\.trim\(\) \|\| getStoredApiKey\(\);\n\s*if \(!apiKey\) \{\n\s*return getFilteredFallbacks\(\);\n\s*\}/g, '');

fs.writeFileSync('src/services/policyTrackerQuery.ts', content);
