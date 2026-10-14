import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('sdkconfig.json');
const rawConfig = fs.readFileSync(configPath, 'utf8');
const firebaseConfig = JSON.parse(rawConfig.match(/\{[\s\S]*\}/)[0]);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function fixPolls() {
  const filePath = path.resolve('src/data/polls.json');
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  await setDoc(doc(db, 'polls', 'current'), data);
  console.log("Uploaded polls as a single document 'current' in the 'polls' collection.");
  process.exit(0);
}

fixPolls().catch(console.error);
