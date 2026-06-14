// @ts-check
const { initializeApp } = require('firebase/app');
const { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  deleteDoc,
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
const app = initializeApp(firebaseConfig, 'firestore-cleanup-script');
const db = getFirestore(app);
console.log('Firebase initialized successfully');

async function cleanupDatabase() {
  const batch = writeBatch(db);
  
  try {
    console.log('Starting database cleanup...');
    
    // 1. Remove all break slots
    console.log('\nRemoving break slots...');
    const breakSlotsSnapshot = await getDocs(collection(db, 'breakSlots'));
    let slotsRemoved = 0;
    
    breakSlotsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
      slotsRemoved++;
    });
    
    // 2. Update agents to remove any slot-related data
    console.log('\nUpdating agents...');
    const agentsSnapshot = await getDocs(collection(db, 'agents'));
    let agentsUpdated = 0;
    
    agentsSnapshot.forEach((agentDoc) => {
      const agentData = agentDoc.data();
      const updateData = {};
      
      // Only update if we need to clean up slot-related data
      if (agentData.breakSlotId || agentData.assignedBreak) {
        updateData.breakSlotId = null;
        updateData.assignedBreak = null;
        updateData.updatedAt = serverTimestamp();
        batch.update(doc(db, 'agents', agentDoc.id), updateData);
        agentsUpdated++;
      }
    });
    
    // Execute all operations in a single batch
    console.log('\nCommitting all changes...');
    await batch.commit();
    
    console.log(`\n✅ Database cleanup complete!`);
    console.log(`- Removed ${slotsRemoved} break slots`);
    console.log(`- Updated ${agentsUpdated} agents`);
    
  } catch (error) {
    console.error('❌ Error cleaning up database:');
    console.error(error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

// Run the cleanup
cleanupDatabase().catch(console.error);
