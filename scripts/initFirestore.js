// @ts-check
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, Timestamp } = require('firebase/firestore');

// Initialize Firebase with your config
const firebaseConfig = {
  apiKey: "AIzaSyBFuCWUIZP4TRy9vlwe6vxMM794SKIK-Jo",
  authDomain: "pauzi-a69be.firebaseapp.com",
  projectId: "pauzi-a69be",
  storageBucket: "pauzi-a69be.appspot.com",
  messagingSenderId: "288205053019",
  appId: "1:288205053019:web:4623ffb925d53d628db37e",
  measurementId: "G-DPTQH9W13S"
};

console.log('Initializing Firebase...');
const app = initializeApp(firebaseConfig, 'firestore-init-script');
const db = getFirestore(app);
console.log('Firebase initialized successfully');

// Sample data
const breakDefinitions = [
  {
    id: 'break1',
    name: 'Прва пауза',
    duration: 15,
    color: '#FF6B6B',
    icon: 'coffee',
    order: 1
  },
  {
    id: 'break2',
    name: 'Втора пауза',
    duration: 30,
    color: '#4ECDC4',
    icon: 'utensils',
    order: 2
  },
  {
    id: 'break3',
    name: 'Трета пауза',
    duration: 15,
    color: '#45B7D1',
    icon: 'coffee',
    order: 3
  }
];

// Initialize Firestore
async function initializeFirestore() {
  try {
    console.log('Starting Firestore initialization...');
    
    // Add break definitions
    console.log('\nAdding break definitions...');
    for (const def of breakDefinitions) {
      const docRef = doc(db, 'breakDefinitions', def.id);
      await setDoc(docRef, {
        name: def.name,
        duration: def.duration,
        color: def.color,
        icon: def.icon,
        order: def.order,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`✓ Added break definition: ${def.name}`);
    }
    
    // Add sample agents
    console.log('\nAdding sample agents...');
    const sampleAgents = [
      { 
        id: 'agent1', 
        name: 'John Doe', 
        status: 'available', 
        currentBreak: null, 
        shift: { start: '09:00', end: '17:00' } 
      },
      { 
        id: 'agent2', 
        name: 'Jane Smith', 
        status: 'available', 
        currentBreak: null, 
        shift: { start: '10:00', end: '18:00' } 
      }
    ];
    
    for (const agent of sampleAgents) {
      const agentRef = doc(db, 'agents', agent.id);
      await setDoc(agentRef, {
        name: agent.name,
        status: agent.status,
        currentBreak: agent.currentBreak,
        shift: agent.shift,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      console.log(`✓ Added agent: ${agent.name}`);
    }
    
    console.log('\n✅ Firestore initialization complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error initializing Firestore:');
    console.error(error);
    process.exit(1);
  }
}

// Run the initialization
initializeFirestore().catch(console.error);
