import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Load config
const configPath = path.resolve('sdkconfig.json');
const rawConfig = fs.readFileSync(configPath, 'utf8');

// The file looks like:
// const firebaseConfig = { ... };
// We need to parse just the JSON part
const configMatch = rawConfig.match(/\{[\s\S]*\}/);
if (!configMatch) throw new Error("Could not parse sdkconfig.json");
const firebaseConfig = JSON.parse(configMatch[0]);

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = [
  'parties',
  'policies',
  'cabinets',
  'categories',
  'factchecks',
  'policyDecisions',
  'polls',
  'quizQuestions'
];

async function migrate() {
  console.log("Starting Firestore migration...");

  for (const collectionName of COLLECTIONS) {
    const filePath = path.resolve(`src/data/${collectionName}.json`);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filePath}, skipping...`);
      continue;
    }

    console.log(`Processing ${collectionName}.json...`);
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Depending on the structure, we'll write it to Firestore
    // For arrays, we'll write each item as a document (if it has an id)
    // For objects, we'll write the object itself or its keys as documents
    
    if (Array.isArray(data)) {
      let count = 0;
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        // Use 'id' if available, else use index
        const docId = item.id || `item_${i}`;
        await setDoc(doc(db, collectionName, docId), item);
        count++;
      }
      console.log(` -> Uploaded ${count} documents to collection '${collectionName}'.`);
    } else {
      // It's a single object map
      // For things like parties.json where keys are 'labour', 'conservative', etc.
      let count = 0;
      for (const [key, value] of Object.entries(data)) {
        await setDoc(doc(db, collectionName, key), { ...value, _id: key });
        count++;
      }
      console.log(` -> Uploaded ${count} documents to collection '${collectionName}'.`);
    }
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(console.error);
