// scripts/initShifts.js
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, writeBatch } from 'firebase/firestore';

const firebaseConfig = {
  // Your Firebase config
};

const app = initializeApp(firebaseConfig, 'init-shifts-script');
const db = getFirestore(app);

// Define all shifts with their break configurations
const shifts = [
  {
    id: 'shift_07_15',
    name: '07:00 - 15:00',
    startTime: '07:00',
    endTime: '15:00',
    breakTypes: ['Прва пауза', 'Втора пауза', 'Трета пауза'],
    isActive: true
  },
  {
    id: 'shift_09_17',
    name: '09:00 - 17:00',
    startTime: '09:00',
    endTime: '17:00',
    breakTypes: ['Прва пауза', 'Втора пауза', 'Трета пауза'],
    isActive: true
  },
  {
    id: 'shift_10_18',
    name: '10:00 - 18:00',
    startTime: '10:00',
    endTime: '18:00',
    breakTypes: ['Прва пауза', 'Втора пауза', 'Трета пауза'],
    isActive: true
  },
  {
    id: 'shift_14_22',
    name: '14:00 - 22:00',
    startTime: '14:00',
    endTime: '22:00',
    breakTypes: ['Прва пауза', 'Втора пауза', 'Трета пауза'],
    isActive: true
  },
  {
    id: 'shift_15_23',
    name: '15:00 - 23:00',
    startTime: '15:00',
    endTime: '23:00',
    breakTypes: ['Прва пауза', 'Втора пауза', 'Трета пауза'],
    isActive: true
  },
  {
    id: 'shift_22_06',
    name: '22:00 - 06:00',
    startTime: '22:00',
    endTime: '06:00',
    breakTypes: ['Прва пауза', 'Втора пауза', 'Трета пауза'],
    isActive: true,
    isOvernight: true  // Special flag for overnight shifts
  }
];

async function initializeShifts() {
  const batch = writeBatch(db);
  
  // Add all shifts
  for (const shift of shifts) {
    const shiftRef = doc(db, 'shifts', shift.id);
    batch.set(shiftRef, shift);
  }
  
  // Add a default settings document
  const settingsRef = doc(db, 'settings', 'shifts');
  batch.set(settingsRef, {
    lastUpdated: new Date(),
    version: '1.0'
  });
  
  try {
    await batch.commit();
    console.log('✅ Successfully initialized all shifts');
  } catch (error) {
    console.error('❌ Error initializing shifts:', error);
  } finally {
    process.exit(0);
  }
}

initializeShifts().catch(console.error);