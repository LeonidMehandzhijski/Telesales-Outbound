// src/services/breakService.ts
import { db } from '../firebase';
import {
  collection,
  doc,
  onSnapshot,
  query,
  updateDoc,
  serverTimestamp,
  writeBatch,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import { format } from 'date-fns';
import type { DailyBreakSlot, Agent } from '../types/scheduler.types';
import type { ActiveBreakInfo } from '../types';
import type { AppBreakDefinition } from '../config';
import { APP_BREAK_DEFINITIONS } from '../config';

/**
 * Helper to get the Firestore collection path for daily break slots.
 * @param date - The date string in 'yyyy-MM-dd' format.
 * @returns The collection path string.
 */
export const getBreakSlotCollectionPath = (date: string): string => `dailySchedules/${date}/breakSlots`;

/**
 * Subscribes to real-time updates for break slots on a specific date.
 * @param date - The date string ('yyyy-MM-dd') for which to fetch break slots.
 * @param callback - Function to execute with the array of DailyBreakSlot objects.
 * @returns A function to unsubscribe from the listener.
 */
export const subscribeToDailyBreakSlots = (date: string, callback: (slots: DailyBreakSlot[]) => void): (() => void) => {
  const slotsCollectionPath = getBreakSlotCollectionPath(date);
  const q = query(collection(db, slotsCollectionPath));
  return onSnapshot(q, (snapshot) => {
    const slots = snapshot.docs.map(docData => ({
      id: docData.id,
      ...docData.data(),
    } as DailyBreakSlot));
    console.log(`DailyBreakSlot subscription update for ${date}: ${slots.length} slots`);
    callback(slots);
  }, (error) => {
    console.error(`Error subscribing to daily break slots for ${date}:`, error);
    // Optionally, call callback with empty array or error state
    callback([]);
  });
};

/**
 * Fetches break definitions. Currently returns mock data.
 * TODO: Replace with actual Firestore fetch if definitions are stored there.
 * @returns A promise that resolves to an array of AppBreakDefinition.
 */
export const getBreakDefinitions = async (): Promise<AppBreakDefinition[]> => {
  // In a real app, these would likely be managed in Firestore by an admin.
  return APP_BREAK_DEFINITIONS;
};

/**
 * Assigns or unassigns an agent to/from a specific break slot.
 * Can also handle moving an agent by clearing their assignment from a previous slot.
 * Note: This function directly modifies a single DailyBreakSlot document.
 * If you need to manage assignments within an array in a parent DailySchedule document,
 * use functions in `scheduleService.ts`.
 * @param date - The date of the schedule.
 * @param slotId - The ID of the target break slot.
 * @param agentId - The ID of the agent to assign, or null to unassign.
 * @param agentName - The name of the agent (used if assigning).
 * @param previousSlotId - Optional ID of the slot from which the agent is being moved.
 */
export const assignAgentToSingleBreakSlot = async (
  date: string,
  slotId: string,
  agentId: string | null,
  agentName: string | null, // Required if agentId is not null
  previousSlotId?: string | null
): Promise<void> => {
  const batch = writeBatch(db);
  const slotsCollectionPath = getBreakSlotCollectionPath(date);

  // Clear previous slot if agent was moved
  if (previousSlotId && previousSlotId !== slotId) { // Ensure not clearing the same slot
    const prevSlotRef = doc(db, slotsCollectionPath, previousSlotId);
    batch.update(prevSlotRef, {
      assignedAgentIds: [], // Assuming assignedAgentIds is an array, clear it or remove specific agent
      // assignedAgentName: null, // If single agent, name would be cleared too
      status: 'available',
      actualStartTime: null,
      actualEndTime: null,
    });
    console.log(`Cleared agent from previous slot: ${previousSlotId}`);
  }

  const targetSlotRef = doc(db, slotsCollectionPath, slotId);
  if (agentId && agentName) { // Assigning agent
    // Assuming assignedAgentIds is an array. If it's a single ID, logic changes.
    // For this example, let's assume it's an array and we are adding the agent.
    // If a slot can only have one agent, this should be a direct set, not array push.
    // The original `firebaseService` had `assignedAgentId` (singular) for `DailyBreakSlot`.
    // Let's stick to that for this function.
    batch.update(targetSlotRef, {
      assignedAgentId: agentId, // Singular agent ID
      assignedAgentName: agentName,
      status: 'scheduled', // Agent is assigned, break is scheduled
    });
    console.log(`Assigned agent ${agentId} to slot: ${slotId}`);
  } else { // Unassigning agent (agentId is null)
    batch.update(targetSlotRef, {
      assignedAgentId: null,
      assignedAgentName: null,
      status: 'available',
      actualStartTime: null,
      actualEndTime: null,
    });
    console.log(`Unassigned agent from slot: ${slotId}`);
  }

  await batch.commit();
};


/**
 * Updates the status of a specific break slot (e.g., 'active', 'done').
 * This function is for individual DailyBreakSlot documents.
 * @param date - The date of the schedule.
 * @param slotId - The ID of the break slot to update.
 * @param newStatus - The new status for the break slot.
 */
export const updateSingleBreakSlotStatus = async (
  date: string,
  slotId: string,
  newStatus: 'active' | 'done' | 'available' | 'scheduled'
): Promise<void> => {
  const slotRef = doc(db, getBreakSlotCollectionPath(date), slotId);
  const updateData: Partial<DailyBreakSlot> = { status: newStatus };

  if (newStatus === 'active') {
    updateData.actualStartTime = serverTimestamp() as any;
    updateData.actualEndTime = undefined; // Use undefined instead of null
  } else if (newStatus === 'done') {
    updateData.actualEndTime = serverTimestamp() as any;
    // actualStartTime should ideally be preserved if already set.
    // If it might not be set, fetch the doc first or handle it.
  } else if (newStatus === 'available' || newStatus === 'scheduled') {
    // Resetting to available or scheduled should clear active/actual times
    updateData.actualStartTime = undefined;
    updateData.actualEndTime = undefined;
    if (newStatus === 'available') { // If becoming available, clear assigned agents
        updateData.assignedAgentIds = [];
    }
  }

  await updateDoc(slotRef, updateData);
  console.log(`Slot ${slotId} status updated to ${newStatus} for date ${date}`);
};


/**
 * Generates a list of active break information for display (e.g., in a banner).
 * @param breakSlots - Array of DailyBreakSlot objects for the current day.
 * @param agents - Array of all Agent objects.
 * @param breakDefs - Array of AppBreakDefinition objects.
 * @returns An array of ActiveBreakInfo objects.
 */
export const getActiveBreakInfo = (
    breakSlots: DailyBreakSlot[],
    agents: Agent[],
    breakDefs: AppBreakDefinition[]
): ActiveBreakInfo[] => {
  const activeInfo: ActiveBreakInfo[] = [];
  breakSlots.forEach(slot => {
    // Check if slot is active and has assigned agents
    if (slot.status === 'active' && slot.assignedAgentIds && slot.assignedAgentIds.length > 0) {
      // Get the first assigned agent (or modify logic if you need to handle multiple agents)
      const agentId = slot.assignedAgentIds[0];
      const agent = agents.find(a => a.id === agentId && a.isOnBreak);
      if (agent && slot.actualStartTime) { // Check slot.actualStartTime for active breaks
        const definition = breakDefs.find(bd => bd.id === slot.breakDefinitionId);
        let formattedStartTime = 'N/A';

        const startTimeObj = slot.actualStartTime; // Use actualStartTime from the slot
        let startTimeDate: Date | null = null;

        if ((startTimeObj as Timestamp)?.seconds !== undefined) {
          startTimeDate = new Date((startTimeObj as Timestamp).seconds * 1000);
        } else if (startTimeObj instanceof Date) { // Should be Firestore Timestamp from server
          startTimeDate = startTimeObj;
        } else if (typeof startTimeObj === 'string') { // Fallback for string date
            try { startTimeDate = new Date(startTimeObj); } catch (e) { console.warn("Invalid date string for startTime", startTimeObj); }
        }


        if (startTimeDate && !isNaN(startTimeDate.getTime())) {
          formattedStartTime = format(startTimeDate, 'HH:mm');
        } else {
            console.warn("Could not parse actualStartTime for active break:", slot.actualStartTime, "Slot ID:", slot.id);
        }

        activeInfo.push({
          agentId: agent.id,
          agentName: agent.name || 'Unknown Agent',
          breakName: definition?.name || slot.name || 'Unknown Break',
          startTime: formattedStartTime,
          slotId: slot.id, // ID of the DailyBreakSlot document
        });
      }
    }
  });
  return activeInfo;
};
