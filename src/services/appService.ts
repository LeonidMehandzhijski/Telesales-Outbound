// src/services/appService.ts
import { db } from '../firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  addDoc,
  updateDoc,
  writeBatch,
  Unsubscribe,
  Timestamp,
  arrayUnion,
  setDoc,
} from 'firebase/firestore';
import { format } from 'date-fns';
import type { DailyBreakSlot, Agent } from '../types';
import { subscribeToAgents as fbSubscribeToAgents, subscribeToBreakSlots as fbSubscribeToBreakSlotsRaw } from './firebaseService';
import { mockBreakDefinitions, mockShifts } from '../config/mockData';


/**
 * Gets today's date string in yyyy-MM-dd format.
 */
export const getTodayDateString = (): string => {
  return format(new Date(), 'yyyy-MM-dd');
};

/**
 * Converts a value to a Timestamp if it's a Firestore Timestamp or can be converted.
 */
const convertToTimestamp = (value: any): Timestamp | null => {
  if (!value) return null;
  if (value instanceof Timestamp) return value;
  if (value.toDate) return Timestamp.fromDate(value.toDate());
  if (value.seconds) return new Timestamp(value.seconds, value.nanoseconds || 0);
  return null;
};

/**
 * Subscribes to agent data changes.
 */
export const subscribeToAgents = (callback: (agents: Agent[]) => void): Unsubscribe => {
  return fbSubscribeToAgents((agents) => {
    const processedAgents = agents.map(agent => ({
      ...agent,
      shiftStart: convertToTimestamp(agent.shiftStart) || agent.shiftStart,
      shiftEnd: convertToTimestamp(agent.shiftEnd) || agent.shiftEnd,
      currentBreakStartTime: convertToTimestamp(agent.currentBreakStartTime) || agent.currentBreakStartTime,
      activeBreak_StartTime: convertToTimestamp(agent.activeBreak_StartTime) || agent.activeBreak_StartTime
    }));
    callback(processedAgents);
  });
};

/**
 * Subscribes to raw daily break slot data for a given date.
 */
export const subscribeToBreakSlots = (dateString: string, callback: (slots: DailyBreakSlot[]) => void): Unsubscribe => {
  return fbSubscribeToBreakSlotsRaw(dateString, (slots: DailyBreakSlot[]) => {
    callback(slots);
  });
};

/**
 * Assigns an agent to a specific break.
 */
export const assignAgentToBreak = async (params: {
  agentId: string;
  shiftId: string;
  timeSlotId: string;
  breakTypeIndex: number;
}): Promise<void> => {
  console.log('=== ASSIGN AGENT TO BREAK (appService) ===');
  console.log('Params:', params);
  const { agentId, shiftId, timeSlotId, breakTypeIndex } = params;
  const today = getTodayDateString();

  try {
    const agentRef = doc(db, 'Agents', agentId);
    const agentDoc = await getDoc(agentRef);
    const agentData = agentDoc.data() as Agent | undefined;

    if (!agentData) {
      throw new Error(`Agent with ID ${agentId} not found.`);
    }

    const alreadyAssigned = (agentData.assignedBreaks as any[])?.some(
      (b: any) =>
        b.shiftId === shiftId &&
        b.timeSlotId === timeSlotId &&
        b.breakTypeIndex === breakTypeIndex
    );
    if (alreadyAssigned) {
      console.log('Agent already assigned to this exact break. No action taken.');
      return;
    }

    const breakSlotsCollectionRef = collection(db, `dailySchedules/${today}/breakSlots`);
    const q = query(
      breakSlotsCollectionRef,
      where('shiftId', '==', shiftId),
      where('timeSlotId', '==', timeSlotId),
      where('breakTypeIndex', '==', breakTypeIndex)
    );

    const querySnapshot = await getDocs(q);
    let breakSlotDocId: string;

    if (!querySnapshot.empty) {
      const breakSlotDoc = querySnapshot.docs[0];
      breakSlotDocId = breakSlotDoc.id;
      const currentAssignedAgentIds = (breakSlotDoc.data().assignedAgentIds as string[]) || [];

      if (!currentAssignedAgentIds.includes(agentId)) {
         await updateDoc(doc(db, `dailySchedules/${today}/breakSlots`, breakSlotDocId), {
           assignedAgentIds: arrayUnion(agentId),
         });
      }
    } else {
      const breakDef = mockBreakDefinitions.find(b => b.breakTypeIndex === breakTypeIndex);
      if (!breakDef) throw new Error(`Break definition for index ${breakTypeIndex} not found.`);

      const newSlotData: Omit<DailyBreakSlot, 'id'> = {
        shiftId,
        timeSlotId,
        breakDefinitionId: breakDef.id,
        breakTypeIndex,
        name: `${mockShifts.find(s => s.id === shiftId)?.name || 'Unknown Shift'} - ${breakDef.name}`,
        startTime: '',
        endTime: '',
        durationMinutes: breakDef.durationMinutes || 15,
        assignedAgentIds: [agentId],
        status: 'scheduled',
        actualStartTime: null,
        actualEndTime: null
      };
      const newBreakSlotDocRef = await addDoc(breakSlotsCollectionRef, newSlotData);
      breakSlotDocId = newBreakSlotDocRef.id;
    }
    
    const newBreakAssignment = {
        breakSlotId: breakSlotDocId,
        shiftId,
        timeSlotId,
        breakTypeIndex,
        status: 'scheduled',
    };
    
    const agentUpdateData: { assignedBreaks: any; currentShiftId?: string } = {
        assignedBreaks: arrayUnion(newBreakAssignment)
    };
    
    if (!agentData.currentShiftId) {
        agentUpdateData.currentShiftId = shiftId;
    }
    
    await updateDoc(agentRef, agentUpdateData);

    console.log('Successfully assigned agent to break and updated agent document.');

  } catch (error) {
    console.error('Error in assignAgentToBreak (appService):', error);
    throw error;
  }
};

/**
 * Updates the status of an agent's break ('active' or 'done').
 */
export const updateAgentBreakStatus = async (params: {
  agentId: string;
  shiftId: string;
  timeSlotId: string;
  breakTypeIndex: number;
  newStatus: 'active' | 'done';
}): Promise<void> => {
  console.log('Updating agent break status (appService):', params);
  const { agentId, shiftId, timeSlotId, breakTypeIndex, newStatus } = params;
  const agentRef = doc(db, 'Agents', agentId);
  const today = getTodayDateString();

  try {
    const agentDoc = await getDoc(agentRef);
    if (!agentDoc.exists()) throw new Error(`Agent ${agentId} not found.`);
    const agentData = agentDoc.data() as Agent;

    const assignedBreaks = (agentData.assignedBreaks as any[]) || [];
    const assignedBreakIndex = assignedBreaks.findIndex(
      (b: any) => b.shiftId === shiftId && b.timeSlotId === timeSlotId && b.breakTypeIndex === breakTypeIndex
    );

    if (assignedBreakIndex === -1) {
      throw new Error(`Agent ${agentId} is not assigned to the specified break.`);
    }

    const breakSlotId = assignedBreaks[assignedBreakIndex].breakSlotId;
    if (!breakSlotId) {
        throw new Error(`BreakSlot ID missing for agent ${agentId} on break ${shiftId}-${timeSlotId}-${breakTypeIndex}`);
    }
    const breakSlotRef = doc(db, `dailySchedules/${today}/breakSlots`, breakSlotId);

    const batch = writeBatch(db);
    const agentUpdates: Partial<Agent> & { assignedBreaks?: any[] } = {};
    const breakSlotUpdates: Partial<DailyBreakSlot> = {};

    const updatedAssignedBreaks = [...assignedBreaks];
    
    updatedAssignedBreaks[assignedBreakIndex] = {
      ...updatedAssignedBreaks[assignedBreakIndex],
      status: newStatus,
    };
    agentUpdates.assignedBreaks = updatedAssignedBreaks;


    if (newStatus === 'active') {
      agentUpdates.isOnBreak = true;
      agentUpdates.activeBreak_StartTime = Timestamp.now();
      agentUpdates.currentBreakId = breakSlotId;
      breakSlotUpdates.actualStartTime = Timestamp.now();
      breakSlotUpdates.actualEndTime = null;

    } else if (newStatus === 'done') {
      agentUpdates.isOnBreak = false;
      const startTime = agentData.activeBreak_StartTime ? (agentData.activeBreak_StartTime as Timestamp).toDate() : new Date();
      const endTime = new Date();
      const durationMs = endTime.getTime() - startTime.getTime();
      
      const currentDurationSeconds = Math.floor(durationMs / 1000);
      
      agentUpdates.totalBreakDurationToday = (agentData.totalBreakDurationToday || 0) + currentDurationSeconds;
      
      agentUpdates.activeBreak_StartTime = null;
      agentUpdates.currentBreakId = null;
      breakSlotUpdates.actualEndTime = Timestamp.now();

      const completedInCurrentShift = updatedAssignedBreaks.filter(
        (b: any) => b.shiftId === agentData.currentShiftId && b.status === 'done'
      ).length;

      if (agentData.currentShiftId && completedInCurrentShift >= 3) {
        agentUpdates.currentShiftId = ""; 
        console.log(`Agent ${agentId} completed 3 breaks in shift ${agentData.currentShiftId}. Resetting currentShiftId.`);
      }
    }

    batch.update(agentRef, agentUpdates);
    batch.update(breakSlotRef, breakSlotUpdates);

    await batch.commit();
    console.log(`Agent ${agentId} status updated to ${newStatus} for break ${breakSlotId}`);

    // Update the shared event document for the banner
    const lastEventRef = doc(db, 'appState', 'lastEvent');
    await setDoc(lastEventRef, {
        agentName: agentData.name || agentData.ImePrezime,
        action: newStatus,
        timestamp: Timestamp.now()
    });

  } catch (error) {
    console.error('Error in updateAgentBreakStatus (appService):', error);
    throw error;
  }
};


/**
 * Resets the application state by clearing agent assignments and break slots.
 */
export const resetApplicationState = async (): Promise<void> => {
  try {
    const batch = writeBatch(db);
    const today = getTodayDateString();

    const agentsSnapshot = await getDocs(collection(db, 'Agents'));
    agentsSnapshot.docs.forEach(agentDoc => {
      const agentRef = doc(db, 'Agents', agentDoc.id);
      batch.update(agentRef, {
        isOnBreak: false,
        activeBreak_StartTime: null, 
        currentBreakId: null,
        currentShiftId: null,
        assignedBreaks: [], 
        totalBreakDurationToday: 0,
      });
    });

    const breakSlotsPath = `dailySchedules/${today}/breakSlots`;
    const scheduleDocRef = doc(db, 'dailySchedules', today);

    const breakSlotsQuery = query(collection(db, breakSlotsPath));
    const breakSlotsSnapshot = await getDocs(breakSlotsQuery);
    
    if (!breakSlotsSnapshot.empty) {
        breakSlotsSnapshot.docs.forEach(slotDoc => {
          batch.delete(doc(db, breakSlotsPath, slotDoc.id));
        });
    }
    
    batch.set(scheduleDocRef, { 
        date: today,
        lastReset: Timestamp.now(),
        breakSlots: [],
    }, { merge: true });

    await batch.commit();
    console.log('Application state reset successfully.');
  } catch (error) {
    console.error('Error resetting application state (appService):', error);
    throw error;
  }
};