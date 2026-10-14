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

async function migrate() {
  console.log("Starting Firestore migration (Part 3)...");

  const collectionName = 'quizQuestions';
  const filePath = path.resolve(`src/data/${collectionName}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  
  let promises = [];
  for (let i = 0; i < data.length; i++) {
    const item = data[i];
    const docId = String(item.id) || `item_${i}`; // Cast to String!
    promises.push(setDoc(doc(db, collectionName, docId), item).then(() => console.log(`  Uploaded ${docId}`)));
  }
  await Promise.all(promises);
  console.log(` -> Finished collection '${collectionName}'.`);
  
  console.log("Migration complete!");
  process.exit(0);
}

migrate().catch(console.error);
