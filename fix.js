const fs = require('fs');
let content = fs.readFileSync('src/providers/FirebaseDataProvider.tsx', 'utf8');
content = content.replace(/const unsubPolls = onSnapshot\(doc\(db, 'polls', 'current'\), \(snap\) => \{[\s\S]*?\}\);/m, `const unsubPolls = onSnapshot(doc(db, 'polls', 'current'), (snap) => {
      if (snap.exists()) {
        setPolls(snap.data());
      }
    });`);
fs.writeFileSync('src/providers/FirebaseDataProvider.tsx', content);
