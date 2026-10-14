import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

const configPath = path.resolve('sdkconfig.json');
const rawConfig = fs.readFileSync(configPath, 'utf8');
const configMatch = rawConfig.match(/\{[\s\S]*\}/);
const firebaseConfig = JSON.parse(configMatch[0]);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = [
  'cabinets',
  'categories',
  'factchecks',
  'policyDecisions',
  'polls',
  'quizQuestions'
];

async function migrate() {
  console.log("Starting Firestore migration (Part 2)...");

  for (const collectionName of COLLECTIONS) {
    const filePath = path.resolve(`src/data/${collectionName}.json`);
    if (!fs.existsSync(filePath)) continue;

    console.log(`Processing ${collectionName}.json...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    
    let promises = [];
    if (Array.isArray(data)) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        const docId = item.id || item.partyId || `item_${i}`;
        promises.push(setDoc(doc(db, collectionName, docId), item).then(() => console.log(`  Uploaded ${docId}`)));
      }
    } else {
      for (const [key, value] of Object.entries(data)) {
        promises.push(setDoc(doc(db, collectionName, key), { ...value, _id: key }).then(() => console.log(`  Uploaded ${key}`)));
      }
    }
    await Promise.all(promises);
    console.log(` -> Finished collection '${collectionName}'.`);
  }
  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(console.error);
