// @ts-check
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  writeBatch,
  serverTimestamp 
} = require('firebase/firestore');

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
const app = initializeApp(firebaseConfig, 'firestore-setup-script');
const db = getFirestore(app);
console.log('Firebase initialized successfully');

// Default break slots configuration
const DEFAULT_BREAK_SLOTS = [
  { id: 'break1', name: 'Break 1', startTime: '10:00', endTime: '10:20' },
  { id: 'break2', name: 'Break 2', startTime: '12:00', endTime: '12:20' },
  { id: 'break3', name: 'Break 3', startTime: '14:30', endTime: '14:40' }
];

async function setupDatabase() {
  const batch = writeBatch(db);
  
  try {
    console.log('Starting database setup...');
    
    // 1. Update agents collection
    console.log('\nUpdating agents collection...');
    const agentsSnapshot = await getDocs(collection(db, 'agents'));
    let agentsUpdated = 0;
    
    agentsSnapshot.forEach((agentDoc) => {
      const agentData = agentDoc.data();
      
      // Only update if needed
      if (agentData.totalBreakTime === undefined || agentData.currentBreak === undefined) {
        batch.update(doc(db, 'agents', agentDoc.id), {
          totalBreakTime: 0,
          currentBreak: null,
          updatedAt: serverTimestamp()
        });
        agentsUpdated++;
      }
    });
    
    // 2. Create break slots if they don't exist
    console.log('\nSetting up break slots...');
    for (const slot of DEFAULT_BREAK_SLOTS) {
      const slotRef = doc(db, 'breakSlots', slot.id);
      batch.set(slotRef, {
        ...slot,
        assignedAgent: null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }, { merge: true });
    }
    
    // Execute all operations in a single batch
    console.log('\nCommitting all changes...');
    await batch.commit();
    
    console.log(`\n✅ Database setup complete!`);
    console.log(`- Updated ${agentsUpdated} agents`);
    console.log(`- Created/updated ${DEFAULT_BREAK_SLOTS.length} break slots`);
    
  } catch (error) {
    console.error('❌ Error setting up database:');
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the setup
setupDatabase().catch(console.error);
