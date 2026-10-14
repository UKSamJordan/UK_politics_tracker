const fs = require('fs');

let content = fs.readFileSync('src/components/LiveAIFeed.tsx', 'utf8');

// Remove import of ApiKey functions
content = content.replace(/import \{ getStoredApiKey, setStoredApiKey \} from '\.\.\/services\/liveUpdater';/g, '');

// Remove apiKey and showKeyInput states
content = content.replace(/const \[apiKey, setApiKey\] = useState\(\(\) => getStoredApiKey\(\)\);/g, '');
content = content.replace(/const \[showKeyInput, setShowKeyInput\] = useState\(false\);/g, '');

// Remove handleSaveKey
content = content.replace(/const handleSaveKey = \([\s\S]*?\};/g, '');

// Remove customApiKey passing
content = content.replace(/customApiKey: apiKey,/g, '');

// Remove the "Set Admin API Key" button block
content = content.replace(/<button\s+onClick=\{\(\) => setShowKeyInput\(!showKeyInput\)\}[\s\S]*?<\/button>/g, '');

// Remove the form block
content = content.replace(/\{showKeyInput && \([\s\S]*?\}\)/g, '');

// Save changes
fs.writeFileSync('src/components/LiveAIFeed.tsx', content);
