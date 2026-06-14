// src/services/scheduleService.ts
import { db } from '../firebase';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  writeBatch,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { format, addMinutes, parse } from 'date-fns';
// **FIXED:** Import all types from the central index file.
import type { DailySchedule, DailyBreakSlot, Agent } from '../types';
import { 
  APP_SHIFTS, 
  APP_BREAK_DEFINITIONS, 
  AppBreakDefinition, 
  BREAK_TIMING_IN_SHIFT,
  BreakTiming 
} from '../config';

/**
 * Helper to get the Firestore document reference for a daily schedule.
 * @param date - The date string in 'yyyy-MM-dd' format.
 * @returns DocumentReference for the daily schedule.
 */
const getDailyScheduleDocRef = (date: string) => doc(db, 'dailySchedules', date);

/**
 * Generates an array of DailyBreakSlot objects for a given date.
 */
export const generateSlotsForDay = (date: string): DailyBreakSlot[] => {
  const slots: DailyBreakSlot[] = [];
  const todayDateObj = parse(date, 'yyyy-MM-dd', new Date());

  APP_SHIFTS.forEach(shift => {
    APP_BREAK_DEFINITIONS.forEach((breakDef, breakIndex) => {
      const slotId = `${shift.id}_${breakDef.id}_${date.replace(/-/g, '')}_${breakIndex}`;
      const [shiftStartHour, shiftStartMinute] = shift.startTime.split(':').map(Number);
      
      const breakTiming = BREAK_TIMING_IN_SHIFT.find(
        (timing: BreakTiming) => timing.breakDefinitionId === breakDef.id
      );
      
      const breakOffsetMinutes = breakTiming?.hoursFromShiftStart 
        ? breakTiming.hoursFromShiftStart * 60 
        : (breakIndex + 1) * 60;

      const breakStartTime = new Date(todayDateObj);
      breakStartTime.setHours(shiftStartHour, shiftStartMinute, 0, 0);
      addMinutes(breakStartTime, breakOffsetMinutes);

      const breakEndTime = addMinutes(new Date(breakStartTime), breakDef.durationMinutes);

      slots.push({
        id: slotId,
        shiftId: shift.id,
        timeSlotId: `${shift.startTime}-${shift.endTime}`,
        breakDefinitionId: breakDef.id,
        breakTypeIndex: breakIndex,
        name: `${shift.name} - ${breakDef.name}`,
        startTime: format(breakStartTime, 'HH:mm'),
        endTime: format(breakEndTime, 'HH:mm'),
        durationMinutes: breakDef.durationMinutes,
        assignedAgentIds: [],
        status: 'available',
      });
    });
  });
  return slots;
};

/**
 * Fetches the daily schedule for a given date. If it doesn't exist, creates one.
 */
export const getOrCreateDailySchedule = async (date: string): Promise<DailySchedule | null> => {
  const scheduleDocRef = getDailyScheduleDocRef(date);
  try {
    const docSnap = await getDoc(scheduleDocRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as DailySchedule;
    }

    console.log(`No schedule found for ${date}. Creating a new one.`);
    const newSlots = generateSlotsForDay(date);
    const newScheduleData = { 
      breakSlots: newSlots, 
      lastUpdated: serverTimestamp() as Timestamp 
    } as Omit<DailySchedule, 'id'>;
    await setDoc(scheduleDocRef, newScheduleData);
    console.log(`Created new schedule for ${date} with ${newSlots.length} slots.`);
    
    // **FIXED:** Changed `new Date()` to `Timestamp.now()` to match the `Timestamp` type.
    return { id: date, ...newScheduleData, lastUpdated: Timestamp.now() } as DailySchedule;
  } catch (error) {
    console.error("Error getting or creating daily schedule:", error);
    return null;
  }
};
// ... rest of file is unchanged, only function shown for brevity

/**
 * Assigns an agent to a break slot within the DailySchedule document's breakSlots array.
 * Ensures an agent is assigned to only one break of a specific type within a shift.
 * @param date - The date of the schedule.
 * @param targetSlotId - The ID of the slot (within the breakSlots array) to assign the agent to.
 * @param agentId - The ID of the agent to assign.
 */
export const assignAgentToBreakInSchedule = async (
  date: string,
  targetSlotId: string,
  agentId: string
): Promise<void> => {
  const scheduleDocRef = getDailyScheduleDocRef(date);
  const scheduleSnap = await getDoc(scheduleDocRef);

  if (!scheduleSnap.exists()) {
    throw new Error(`Schedule for ${date} not found. Cannot assign agent.`);
  }

  const schedule = scheduleSnap.data() as DailySchedule;
  let breakSlots = schedule.breakSlots ? [...schedule.breakSlots] : []; // Defensive copy

  const targetSlotIndex = breakSlots.findIndex(s => s.id === targetSlotId);
  if (targetSlotIndex === -1) {
    throw new Error(`Target slot ${targetSlotId} not found in schedule for ${date}.`);
  }

  const targetSlot = breakSlots[targetSlotIndex];
  const { shiftId, breakTypeIndex, breakDefinitionId } = targetSlot;
  const breakDef = APP_BREAK_DEFINITIONS.find(b => b.id === breakDefinitionId);
  const maxAgentsInSlot = breakDef?.maxAgents || 1;

  // 1. Unassign agent from any other slot of the same breakTypeIndex within the same shiftId
  breakSlots = breakSlots.map(slot => {
    if (slot.shiftId === shiftId && slot.breakTypeIndex === breakTypeIndex && slot.id !== targetSlotId) {
      const updatedAssignedAgentIds = (slot.assignedAgentIds || []).filter(id => id !== agentId);
      return {
        ...slot,
        assignedAgentIds: updatedAssignedAgentIds,
        status: updatedAssignedAgentIds.length > 0 ? 'scheduled' : 'available',
      };
    }
    return slot;
  });

  // 2. Assign agent to the target slot if not already full and agent not already in it
  const finalTargetSlot = breakSlots.find(s => s.id === targetSlotId)!; // Should exist
  const currentAgentsInTargetSlot = finalTargetSlot.assignedAgentIds || [];

  if (currentAgentsInTargetSlot.length < maxAgentsInSlot && !currentAgentsInTargetSlot.includes(agentId)) {
    const updatedAssignedAgentIds = [...currentAgentsInTargetSlot, agentId];
    breakSlots = breakSlots.map(slot =>
      slot.id === targetSlotId
        ? { ...slot, assignedAgentIds: updatedAssignedAgentIds, status: 'scheduled' }
        : slot
    );
  } else if (currentAgentsInTargetSlot.includes(agentId)) {
    console.log(`Agent ${agentId} already in slot ${targetSlotId}. No change to this slot.`);
  } else {
    console.warn(`Slot ${targetSlotId} is full. Cannot assign agent ${agentId}.`);
    // Optionally throw an error or handle this case as per requirements
    // For now, we proceed with other changes (like unassignment from other slots)
  }

  await updateDoc(scheduleDocRef, { breakSlots: breakSlots, lastUpdated: serverTimestamp() });
  console.log(`Agent ${agentId} assignment processed for slot ${targetSlotId} in schedule ${date}.`);
};

/**
 * Clears an agent from a specific break slot within the DailySchedule's breakSlots array.
 * @param date - The date of the schedule.
 * @param slotId - The ID of the slot (within the breakSlots array) to clear the agent from.
 * @param agentId - The ID of the agent to remove.
 */
export const clearAgentFromBreakInSchedule = async (
  date: string,
  slotId: string,
  agentId: string
): Promise<void> => {
  const scheduleDocRef = getDailyScheduleDocRef(date);
  const scheduleSnap = await getDoc(scheduleDocRef);

  if (!scheduleSnap.exists()) {
    throw new Error(`Schedule for ${date} not found.`);
  }

  const schedule = scheduleSnap.data() as DailySchedule;
  let slotFoundAndAgentCleared = false;

  const newSlots = (schedule.breakSlots || []).map(slot => {
    if (slot.id === slotId) {
      const currentAssigned = slot.assignedAgentIds || [];
      const agentIndex = currentAssigned.indexOf(agentId);
      if (agentIndex > -1) {
        const newAssignedAgentIds = [...currentAssigned];
        newAssignedAgentIds.splice(agentIndex, 1);
        slotFoundAndAgentCleared = true;
        return {
          ...slot,
          assignedAgentIds: newAssignedAgentIds,
          status: newAssignedAgentIds.length > 0 ? 'scheduled' : 'available',
          actualStartTime: newAssignedAgentIds.length > 0 ? slot.actualStartTime : null, // Clear if slot becomes empty
          actualEndTime: newAssignedAgentIds.length > 0 ? slot.actualEndTime : null,
        };
      }
    }
    return slot;
  });

  if (slotFoundAndAgentCleared) {
    await updateDoc(scheduleDocRef, { breakSlots: newSlots, lastUpdated: serverTimestamp() });
    console.log(`Agent ${agentId} cleared from slot ${slotId} in schedule ${date}.`);
  } else {
    console.warn(`clearAgentFromBreakInSchedule: Agent ${agentId} in Slot ${slotId} not found or slot itself not found.`);
  }
};

/**
 * Updates the status of a break slot (within DailySchedule) and the corresponding agent's status.
 * This is a combined operation.
 * @param date - The date of the schedule.
 * @param slotId - The ID of the break slot in the schedule's breakSlots array.
 * @param agentId - The ID of the agent whose break status is changing.
 * @param newStatus - The new status ('active' or 'done').
 */
export const updateBreakStatusInScheduleAndAgent = async (
  date: string,
  slotId: string,
  agentId: string,
  newStatus: 'active' | 'done'
): Promise<void> => {
  const scheduleDocRef = getDailyScheduleDocRef(date);
  const agentRef = doc(db, 'Agents', agentId); // Path to agent document

  const batch = writeBatch(db);

  // --- Update Schedule Document ---
  const scheduleSnap = await getDoc(scheduleDocRef);
  if (!scheduleSnap.exists()) throw new Error(`Schedule for ${date} not found.`);
  const schedule = scheduleSnap.data() as DailySchedule;

  let targetSlotForAgent: DailyBreakSlot | undefined;

  const updatedBreakSlots = (schedule.breakSlots || []).map(slot => {
    if (slot.id === slotId && (slot.assignedAgentIds || []).includes(agentId)) {
      targetSlotForAgent = slot; // Capture the slot for agent update logic
      const update: Partial<DailyBreakSlot> = { status: newStatus }; // Status of the slot itself
      if (newStatus === 'active') {
        update.actualStartTime = serverTimestamp() as any; // Type assertion for serverTimestamp
        update.actualEndTime = undefined; // Use undefined instead of null
      } else if (newStatus === 'done') {
        update.actualEndTime = serverTimestamp() as any;
        // actualStartTime should ideally be preserved.
      }
      return { ...slot, ...update };
    }
    return slot;
  });
  batch.update(scheduleDocRef, { breakSlots: updatedBreakSlots, lastUpdated: serverTimestamp() });

  // --- Update Agent Document ---
  if (!targetSlotForAgent) {
      console.warn(`Agent ${agentId} not found in slot ${slotId} or slot not found. Agent document not updated for break status.`);
      // Decide if to commit partial batch or throw error
      await batch.commit();
      return;
  }

  const agentUpdate: Partial<Agent> = {};
  if (newStatus === 'active') {
    agentUpdate.isOnBreak = true;
    agentUpdate.currentBreakStartTime = serverTimestamp() as any;
    agentUpdate.currentBreakId = slotId; // Store the ID of the slot from the schedule array
    // agentUpdate.activeBreak_ScheduledBreakId = slotId; // If using this field
  } else if (newStatus === 'done') {
    agentUpdate.isOnBreak = false;
    // Fetch current agent data to calculate duration if needed, or handle duration purely on slot
    const agentSnap = await getDoc(agentRef); // Consider if this getDoc can be avoided for performance
    const agentData = agentSnap.data() as Agent | undefined;
    
    if (agentData?.currentBreakStartTime) {
        // Duration calculation can be complex with server timestamps.
        // Often better to calculate duration on client or via a cloud function if precise server-side calc is needed.
        // For now, just updating status.
    }
    // agentUpdate.totalBreakDurationToday = ... // Update total duration if tracked on agent
    agentUpdate.currentBreakStartTime = undefined; // Use undefined instead of null
    agentUpdate.currentBreakId = undefined; // Use undefined instead of null
    // agentUpdate.activeBreak_ScheduledBreakId = null;
  }
  batch.update(agentRef, agentUpdate);

  await batch.commit();
  console.log(`Status for slot ${slotId} (agent ${agentId}) updated to ${newStatus} in schedule ${date} and agent doc.`);
};
