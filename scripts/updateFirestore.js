// @ts-check
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, doc, setDoc, getDocs, deleteDoc, Timestamp, serverTimestamp } = require('firebase/firestore');

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
const app = initializeApp(firebaseConfig, 'firestore-update-script');
const db = getFirestore(app);
console.log('Firebase initialized successfully');

async function updateDatabase() {
  try {
    console.log('Starting database update...');
    
    // 1. Remove old break definitions collection
    console.log('\nRemoving old break definitions...');
    const breakDefsSnapshot = await getDocs(collection(db, 'breakDefinitions'));
    const deletePromises = [];
    
    breakDefsSnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });
    
    await Promise.all(deletePromises);
    console.log(`✓ Removed ${breakDefsSnapshot.size} break definitions`);
    
    // 2. Update agents structure
    console.log('\nUpdating agents...');
    const agentsSnapshot = await getDocs(collection(db, 'agents'));
    const updatePromises = [];
    
    agentsSnapshot.forEach((agentDoc) => {
      const agentData = agentDoc.data();
      
      // Update agent document with new structure
      updatePromises.push(
        setDoc(
          doc(db, 'agents', agentDoc.id),
          {
            name: agentData.name,
            status: agentData.status || 'available',
            totalBreakTime: 0, // Initialize total break time
            currentBreak: null, // Will store { startTime, duration } when on break
            shift: agentData.shift || { start: '09:00', end: '17:00' },
            updatedAt: serverTimestamp()
          },
          { merge: true } // Only update specified fields
        )
      );
      console.log(`✓ Updated agent: ${agentData.name}`);
    });
    
    await Promise.all(updatePromises);
    
    console.log('\n✅ Database update complete!');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error updating database:');
    console.error(error);
    process.exit(1);
  }
}

// Run the update
updateDatabase().catch(console.error);
