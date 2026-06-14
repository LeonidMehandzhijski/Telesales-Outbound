// src/components/Scheduler/Scheduler.tsx
import React, { useCallback, useMemo, useState } from 'react';
import type { 
  Agent, 
  AppShift, 
  ScheduledBreak, 
  BreakDefinition,
  AgentWithDraggableId
} from '../../types';

import AgentList from './AgentList';
import ShiftView from './ShiftView';
import { DropResult } from 'react-beautiful-dnd';
import { formatDuration } from './scheduler.utils'; // <-- Import the formatter

interface SchedulerProps {
  onDragEnd: (result: DropResult) => void;
  agents: Agent[];
  appShifts: AppShift[];
  breakDefinitions: BreakDefinition[];
  scheduledBreaks: ScheduledBreak[];
  onAssignAgent: (params: { 
    agentId: string; 
    shiftId: string; 
    timeSlotId: string; 
    breakTypeIndex: number 
  }) => void;
  onUpdateAgentStatus: (params: {
    agentId: string;
    shiftId: string;
    timeSlotId: string;
    breakTypeIndex: number;
    newStatus: 'active' | 'done';
  }) => void;
}

const Scheduler: React.FC<SchedulerProps> = ({
  agents,
  appShifts,
  breakDefinitions,
  scheduledBreaks,
  onUpdateAgentStatus,
}) => {
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});
  const [isUpdatingBreak] = useState<Record<string, boolean>>({});
  const [errorMessages] = useState<Record<string, string>>({});
  const [optimisticUpdates] = useState<Record<string, { status: 'active' | 'done' }>>({});

  const toggleCardExpansion = useCallback((cardId: string) => {
    setExpandedCards(prev => ({
      ...prev,
      [cardId]: !prev[cardId],
    }));
  }, []);

  const getAgentBreakTime = useCallback((agentId: string) => {
    const agent = agents.find(a => a.id === agentId);
    if (!agent?.isOnBreak || !agent.currentBreakStartTime) return null;
    
    const startTime = 'toDate' in agent.currentBreakStartTime 
      ? agent.currentBreakStartTime.toDate() 
      : new Date(agent.currentBreakStartTime);
      
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    // --- FIX: Calculate difference in seconds and format as MM:SS ---
    const diffSeconds = Math.floor(diffMs / 1000);
    
    return {
      time: formatDuration(diffSeconds),
      isActive: true,
    };
  }, [agents]);

  const availableAgents = useMemo<AgentWithDraggableId[]>(() => {
    return agents.map((agent) => ({
      ...agent,
      id: String(agent.id).trim(),
      name: agent.ImePrezime || agent.name || 'Unknown Agent',
      draggableId: `agent-${agent.id}`.trim()
    } as AgentWithDraggableId));
  }, [agents]);

  return (
    <div className="flex flex-col md:flex-row h-full md:h-screen w-full bg-slate-100 overflow-hidden">
        {/* Agent List Panel */}
        <div className="w-full md:w-64 flex-shrink-0 bg-slate-800 shadow-lg z-10">
            <AgentList 
                availableAgents={availableAgents} 
                getAgentBreakTime={getAgentBreakTime} 
            />
        </div>

        {/* Shifts Panel */}
        <div className="flex-1 p-2 md:p-6 overflow-y-auto">
            <div className="space-y-8">
                {appShifts.map((shift) => (
                    <ShiftView
                        key={shift.id}
                        shift={shift}
                        agents={agents}
                        breakDefinitions={breakDefinitions}
                        scheduledBreaks={scheduledBreaks}
                        onUpdateAgentStatus={onUpdateAgentStatus}
                        expandedCards={expandedCards}
                        toggleCardExpansion={toggleCardExpansion}
                        isUpdatingBreak={isUpdatingBreak}
                        errorMessages={errorMessages}
                        optimisticUpdates={optimisticUpdates}
                    />
                ))}
            </div>
        </div>
    </div>
  );
};

export default Scheduler;