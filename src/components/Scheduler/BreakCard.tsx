// src/components/Scheduler/BreakCard.tsx
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';
import AgentItemInBreak from './AgentItemInBreak';
// **FIX:** Removed unused 'ScheduledBreak' type import
import type { BreakCardProps, AgentInSlot } from '../../types';
import { DROPPABLE_IDS } from '../../constants/droppableIds';
import { getAgentDetails } from './scheduler.utils';


const BreakCard: React.FC<BreakCardProps> = ({
  breakDef,
  currentScheduledBreak,
  shiftId,
  timeSlotId,
  allAgents,
  onUpdateAgentStatus,
  isExpanded,
  onToggleExpansion,
  cardId,
  isUpdatingBreak,
  errorMessages,
  optimisticUpdates,
}) => {

  const breakAgents: AgentInSlot[] = currentScheduledBreak?.agents || [];
  const thisBreakKey = `${shiftId}-${timeSlotId}-${breakDef.breakTypeIndex}`;

  // **FIX:** Removed unused variable 'isAnyAgentInThisBreakUpdating'
  const errorMessageForThisBreak = errorMessages[thisBreakKey];
  const optimisticUpdateForThisBreak = optimisticUpdates[thisBreakKey] as { status: 'active' | 'done'; agentId: string } | undefined;

  if (currentScheduledBreak?.agents && currentScheduledBreak.agents.length > 0 &&
      currentScheduledBreak.agents.every((a: AgentInSlot) => a.status === 'done')) {
    return null;
  }

  return (
    <div key={cardId} className={`rounded-md shadow-sm border overflow-hidden ${breakDef.color.replace('bg-', 'border-')}-500`}>
      <button
        onClick={onToggleExpansion}
        className={`w-full flex items-center justify-between p-2.5 text-left text-sm font-medium focus:outline-none
                    ${breakDef.color} text-white hover:opacity-90`}
      >
        <span>{breakDef.name} ({breakAgents.length})</span>
        {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>

      {isExpanded && (
        <Droppable
          droppableId={DROPPABLE_IDS.BREAK(shiftId, timeSlotId, breakDef.breakTypeIndex)}
          type="AGENT"
          direction="vertical"
          key={`break-drop-${cardId}`}
        >
          {(provided, snapshot) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className={`p-2 bg-white min-h-[50px] ${snapshot.isDraggingOver ? 'bg-blue-50' : ''}`}
            >
              {errorMessageForThisBreak && (
                <div className="text-xs text-red-600 p-1.5 mb-2 bg-red-50 border border-red-200 rounded flex items-center">
                  <AlertCircle size={14} className="mr-1.5" />
                  {errorMessageForThisBreak}
                </div>
              )}
              {breakAgents.length > 0 ? (
                <ul className="space-y-1.5">
                  {breakAgents.map((agentInSlot: AgentInSlot, index: number) => {
                    const agentDetail = getAgentDetails(agentInSlot.agentId, allAgents);
                    if (!agentDetail) return null;

                    const isThisAgentUpdating = isUpdatingBreak[`${thisBreakKey}-${agentInSlot.agentId}`] || isUpdatingBreak[thisBreakKey];
                    const optimisticStatusForThisAgent = optimisticUpdateForThisBreak?.agentId === agentInSlot.agentId 
                                                      ? optimisticUpdateForThisBreak.status 
                                                      : undefined;

                    return (
                      <AgentItemInBreak
                        key={`${agentInSlot.agentId}-${index}-${cardId}`}
                        agentInSlot={agentInSlot}
                        agentDetail={agentDetail}
                        index={index}
                        shiftId={shiftId}
                        timeSlotId={timeSlotId}
                        breakTypeIndex={breakDef.breakTypeIndex}
                        onUpdateAgentStatus={onUpdateAgentStatus}
                        isUpdatingThisBreak={isThisAgentUpdating}
                        optimisticStatus={optimisticStatusForThisAgent}
                      />
                    );
                  })}
                </ul>
              ) : (
                <div className="text-xs text-gray-400 italic text-center py-2">
                  {snapshot.isDraggingOver ? 'Drop agent here' : 'Empty (Drag agent here)'}
                </div>
              )}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      )}
    </div>
  );
};

export default BreakCard;