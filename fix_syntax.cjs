const fs = require('fs');
let content = fs.readFileSync('src/services/policyTrackerQuery.ts', 'utf8');
content = content.replace(/\.replace\/```\\s\*\$\/, ''\)/g, ".replace(/```\\s*$/, '')");
fs.writeFileSync('src/services/policyTrackerQuery.ts', content);
