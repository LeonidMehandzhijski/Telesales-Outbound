import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { getAuth, signInAnonymously } from 'firebase/auth';

// Firebase config for PauziRCC (pauzircc)
const firebaseConfig = {
  apiKey: "AIzaSyAFzxx7puma7RcMg6t7Jn3oJKyJggByeC8",
  authDomain: "pauzircc.firebaseapp.com",
  projectId: "pauzircc",
  storageBucket: "pauzircc.firebasestorage.app",
  messagingSenderId: "110637105049",
  appId: "1:110637105049:web:e42adf6f6167f71436dd08",
};

const app = initializeApp(firebaseConfig, 'seed-agents-script');
const db = getFirestore(app);
const auth = getAuth(app);

// Provided agents list
const agentNames: string[] = [
  'Elena Aneva',
  'Pavlinka Janevska',
  'Semra Osmani',
  'Angela Simonovska',
  'Egzona Azemi',
  'Snezhana Radoeshka Dimovska',
  'Teona Angelovska',
  'Ilina Todeva',
  'Marija Putovikj',
  'Dushica Gjoshevska',
  'Despina Todeva',
  'Marijana Kostadinoska',
  'Margarita Argirova',
  'Marija Petrevska',
  'Teodora Sazdovska',
  'Arjeta Izeiri',
  'Natasha Ilievska',
  'Ivana Trajkovska',
  'Zharko Vanevski',
  'Anela Bihorac',
  'Maja Jovanoska',
];

function generateAgentId(index: number): string {
  // Generate IDs like Agent1, Agent2, ...
  return `Agent${index + 1}`;
}

async function seedAgents() {
  // Ensure we are authenticated to satisfy security rules
  await signInAnonymously(auth);
  console.log('Seeding Agents collection...');
  let created = 0;

  for (let i = 0; i < agentNames.length; i++) {
    const name = agentNames[i];
    const agentId = generateAgentId(i);
    const ref = doc(db, 'Agents', agentId);

    // Minimal shape expected by the app `Agent` type and UI
    const docData = {
      name,
      ImePrezime: name,
      status: 'available',
      isOnBreak: false,
      totalBreakDurationToday: 0,
      currentBreakId: null,
      currentShiftId: null,
      assignedBreaks: [],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(ref, docData, { merge: true });
    created++;
    console.log(`✓ Created/updated ${agentId}: ${name}`);
  }

  console.log(`\n✅ Done. Seeded ${created} agents into 'Agents' collection in project 'pauzircc'.`);
}

seedAgents().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});


