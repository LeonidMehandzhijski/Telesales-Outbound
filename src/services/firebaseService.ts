// src/services/firebaseService.ts
import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  Unsubscribe,
  onSnapshot,
  QuerySnapshot,
  DocumentData,
  Timestamp,
  DocumentData as FirebaseDocumentData,
} from 'firebase/firestore';
import type { DailyBreakSlot, Agent, LastBreakEvent } from '../types';
import type { QueryDocumentSnapshot } from 'firebase/firestore';

// Helper function to convert Firestore timestamps to Timestamp objects
const convertTimestamps = (data: FirebaseDocumentData): any => {
  if (!data || typeof data !== 'object') return data;
  
  if (data.seconds !== undefined && data.nanoseconds !== undefined) {
    return new Timestamp(data.seconds, data.nanoseconds);
  }
  
  if (Array.isArray(data)) {
    return data.map(convertTimestamps);
  }
  
  const result: Record<string, any> = {};
  for (const key in data) {
    if (data.hasOwnProperty(key)) {
      result[key] = convertTimestamps(data[key]);
    }
  }
  
  return result;
};

// Subscribe to agent data changes
export const subscribeToAgents = (callback: (agents: Agent[]) => void): Unsubscribe => {
  const unsubscribe = onSnapshot(collection(db, 'Agents'), (snapshot: QuerySnapshot<DocumentData>) => {
    const agents = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = convertTimestamps(doc.data());
      return {
        id: doc.id,
        ...data
      } as Agent;
    });
    callback(agents);
  });
  return unsubscribe;
};

// Subscribe to break slots for a given date
export const subscribeToBreakSlots = (dateString: string, callback: (slots: DailyBreakSlot[]) => void): Unsubscribe => {
  const unsubscribe = onSnapshot(collection(db, 'dailySchedules', dateString, 'breakSlots'), (snapshot: QuerySnapshot<DocumentData>) => {
    const slots = snapshot.docs.map((doc: QueryDocumentSnapshot<DocumentData>) => {
      const data = convertTimestamps(doc.data());
      return {
        id: doc.id,
        ...data
      } as DailyBreakSlot;
    });
    callback(slots);
  });
  return unsubscribe;
};

/**
 * Subscribes to the last break event for the banner.
 * @param callback - Function to call with the event data.
 * @returns A function to unsubscribe from the listener.
 */
export const subscribeToLastBreakEvent = (callback: (event: LastBreakEvent | null) => void) => {
    const eventRef = doc(db, 'appState', 'lastEvent');
    return onSnapshot(eventRef, (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            // Convert Firestore Timestamp to a JavaScript Date object
            const event: LastBreakEvent = {
                agentName: data.agentName,
                action: data.action,
                timestamp: (data.timestamp as Timestamp).toDate(),
            };
            callback(event);
        } else {
            callback(null);
        }
    });
};