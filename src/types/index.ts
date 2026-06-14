// src/types/index.ts

// Re-export all types from the app and scheduler type definition files
export * from './app.types';
export * from './scheduler.types';

// --- Add the types that were previously in `src/types.ts` ---
import { Timestamp } from 'firebase/firestore';
import type { DailyBreakSlot } from './scheduler.types';

// Structure for storing daily schedules in Firestore
export interface DailySchedule {
  id: string; // Date string (e.g., 'yyyy-MM-DD')
  breakSlots: DailyBreakSlot[];
  lastUpdated?: Timestamp;
}

// For the active breaks banner
export interface ActiveBreakInfo {
  agentName: string;
  breakName: string;
  startTime: string;
  agentId: string;
  slotId: string;
}

// --- NEW ---
// For the real-time event banner
export type LastBreakEvent = {
  agentName: string;
  action: 'active' | 'done';
  timestamp: Date;
};