const fs = require('fs');
let text = fs.readFileSync('src/components/LiveAIFeed.tsx', 'utf8');

text = text.replace(/import \{ getStoredApiKey, setStoredApiKey \} from '\.\.\/services\/liveUpdater';\n/, '');
text = text.replace(/const \[apiKey, setApiKey\] = useState\(\(\) => getStoredApiKey\(\)\);\n/, '');
text = text.replace(/const \[showKeyInput, setShowKeyInput\] = useState\(false\);\n/, '');
text = text.replace(/const handleSaveKey = \([\s\S]*?^\s*};\n/m, '');
text = text.replace(/customApiKey: apiKey,\n/g, '');
text = text.replace(/fetchLatestPolicyDecisions\(apiKey, {/g, 'fetchLatestPolicyDecisions({');

// Replace the Set Admin API Key button block:
// <button
//   onClick={() => setShowKeyInput(!showKeyInput)}
//   ...
// </button>
const buttonRegex = /<button\s+onClick=\{\(\) => setShowKeyInput\(!showKeyInput\)\}[\s\S]*?<\/button>/;
text = text.replace(buttonRegex, '');

// Replace the form block:
// {showKeyInput && (
//   <form onSubmit={handleSaveKey} ...
//   </form>
// )}
const formRegex = /\{showKeyInput && \([\s\S]*?<\/form>\n\s*\)\}/;
text = text.replace(formRegex, '');

fs.writeFileSync('src/components/LiveAIFeed.tsx', text);
