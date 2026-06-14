// src/hooks/useAppController.ts
import { useState, useEffect, useCallback } from 'react';
import { DropResult } from 'react-beautiful-dnd';
import type {
  Agent,
  ScheduledBreak,
  DailyBreakSlot,
  AgentInSlot,
} from '../types';
import {
  getTodayDateString,
  subscribeToAgents,
  subscribeToBreakSlots,
  assignAgentToBreak,
  updateAgentBreakStatus,
  resetApplicationState as serviceResetApplicationState,
} from '../services/appService';
import { subscribeToLastBreakEvent } from '../services/firebaseService';
import { mockBreakDefinitions } from '../config/mockData';
import type { LastBreakEvent } from '../types';

export interface AppControllerReturn {
  agents: Agent[];
  scheduledBreaks: ScheduledBreak[];
  loading: boolean;
  error: string | null;
  lastBreakEvent: LastBreakEvent | null;
  handleDragEnd: (result: DropResult) => Promise<void>;
  handleAssignAgentOptimistic: (params: { agentId: string; shiftId: string; timeSlotId: string; breakTypeIndex: number }) => void;
  handleUpdateAgentStatusOptimistic: (params: {
    agentId: string;
    shiftId: string;
    timeSlotId: string;
    breakTypeIndex: number;
    newStatus: 'active' | 'done';
  }) => void;
  resetAppState: () => Promise<void>;
}

const useAppController = (): AppControllerReturn => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [dailyBreakSlots, setDailyBreakSlots] = useState<DailyBreakSlot[]>([]);
  const [scheduledBreaks, setScheduledBreaks] = useState<ScheduledBreak[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastBreakEvent, setLastBreakEvent] = useState<LastBreakEvent | null>(null);

  useEffect(() => {
    setLoading(true);
    const today = getTodayDateString();

    const unsubscribeAgents = subscribeToAgents((fetchedAgents) => {
      setAgents(fetchedAgents);
    });

    const unsubscribeDailySlots = subscribeToBreakSlots(today, (fetchedSlots) => {
      setDailyBreakSlots(fetchedSlots);
    });

    // Subscribe to the shared banner state from Firestore
    const unsubscribeLastEvent = subscribeToLastBreakEvent((event) => {
      setLastBreakEvent(event);
    });

    return () => {
      unsubscribeAgents();
      unsubscribeDailySlots();
      unsubscribeLastEvent();
    };
  }, []);

  useEffect(() => {
    const agentsMap = new Map(agents.map(agent => [agent.id, agent]));

    const combinedBreaks: ScheduledBreak[] = dailyBreakSlots.map(slot => {
      const agentsInThisSlot: AgentInSlot[] = (slot.assignedAgentIds || []).map(agentId => {
        const agentDetail = agentsMap.get(agentId);
        
        const assignedBreakInfo = agentDetail?.assignedBreaks?.find(
          b => b.breakSlotId === slot.id
        );
        
        return {
          agentId: agentId,
          status: assignedBreakInfo?.status || 'scheduled', 
          startTime: slot.actualStartTime,
          endTime: slot.actualEndTime,
        };
      });

      const isSlotDone = agentsInThisSlot.length > 0 && agentsInThisSlot.every(a => a.status === 'done');
      
      return {
        ...slot,
        agents: agentsInThisSlot,
        status: isSlotDone ? 'done' : slot.status,
      };
    });
    
    setScheduledBreaks(combinedBreaks);
    if (loading) setLoading(false);
    
  }, [agents, dailyBreakSlots, loading]);


  const handleAssignAgentOptimistic = useCallback(async (params: { agentId: string; shiftId: string; timeSlotId: string; breakTypeIndex: number }) => {
    try {
      await assignAgentToBreak(params);
    } catch (err) {
      console.error("Failed to assign agent:", err);
      setError("Failed to assign agent. Check console.");
    }
  }, []);

  const handleUpdateAgentStatusOptimistic = useCallback(async (params: {
    agentId: string;
    shiftId: string;
    timeSlotId: string;
    breakTypeIndex: number;
    newStatus: 'active' | 'done';
  }) => {
    try {
      // This function in appService now handles updating the banner state in Firestore
      await updateAgentBreakStatus(params);
    } catch (err: any) {
      console.error("Failed to update agent status:", err);
      setError(`Failed to update status: ${err.message}`);
    }
  }, []);

  const handleDragEnd = useCallback(async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination || !draggableId.startsWith('agent-')) {
      return;
    }

    const agentId = draggableId.substring(6).trim();

    if (destination.droppableId.startsWith('timeslot-')) {
      const parts = destination.droppableId.substring(9).split('-');
      const shiftId = parts[0];
      const timeSlotId = parts.slice(1).join('-');

      if (!shiftId || !timeSlotId) {
        console.error('Could not parse timeslot destination:', destination.droppableId);
        return;
      }

      const assignmentPromises = mockBreakDefinitions.map(breakDef => {
        return handleAssignAgentOptimistic({
          agentId,
          shiftId,
          timeSlotId,
          breakTypeIndex: breakDef.breakTypeIndex,
        });
      });
      
      await Promise.all(assignmentPromises);

    } else if (destination.droppableId.startsWith('break-')) {
        const parts = destination.droppableId.substring(6).split('-');
        const shiftId = parts[0];
        const breakTypeIndex = parseInt(parts[parts.length - 1], 10);
        const timeSlotId = parts.slice(1, -1).join('-');

        if (isNaN(breakTypeIndex) || !shiftId || !timeSlotId) {
            console.error('Could not parse break destination:', destination.droppableId);
            return;
        }

        await handleAssignAgentOptimistic({ agentId, shiftId, timeSlotId, breakTypeIndex });
    }
  }, [handleAssignAgentOptimistic]);

  const resetAppState = useCallback(async () => {
    if (!window.confirm('Are you sure you want to reset all assignments and agent statuses? This action cannot be undone.')) {
      return;
    }
    setLoading(true);
    try {
      await serviceResetApplicationState();
    } catch (err) {
      console.error("Failed to reset app state:", err);
      setError("Failed to reset state. Check console.");
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    agents,
    scheduledBreaks,
    loading,
    error,
    lastBreakEvent,
    handleDragEnd,
    handleAssignAgentOptimistic,
    handleUpdateAgentStatusOptimistic,
    resetAppState,
  };
};

export default useAppController;