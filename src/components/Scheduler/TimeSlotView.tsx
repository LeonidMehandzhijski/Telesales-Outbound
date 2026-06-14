// src/components/Scheduler/TimeSlotView.tsx
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import BreakCard from './BreakCard';
import type { TimeSlotViewProps } from '../../types';
import { DROPPABLE_IDS } from '../../constants/droppableIds';

const TimeSlotView: React.FC<TimeSlotViewProps> = ({
  timeSlot,
  shiftId,
  agents,
  breakDefinitions,
  scheduledBreaks,
  onUpdateAgentStatus,
  expandedCards,
  toggleCardExpansion,
  isUpdatingBreak,
  errorMessages,
  optimisticUpdates,
}) => {
  const breaksInThisTimeSlot = scheduledBreaks.filter(
    sb => sb.shiftId === shiftId && sb.timeSlotId === timeSlot.id
  );

  // Determine if any agent is assigned to any break in this time slot
  const hasAssignedAgents = breaksInThisTimeSlot.some(
    b => b.agents && b.agents.length > 0
  );

  return (
    <div key={timeSlot.id} className="p-3 rounded-lg min-h-[200px] bg-slate-50 border border-slate-200">
      <Droppable
        droppableId={DROPPABLE_IDS.TIMESLOT(shiftId, timeSlot.id)}
        type="AGENT"
        direction="vertical"
      >
        {(providedSlot, snapshotSlot) => (
          <div
            ref={providedSlot.innerRef}
            {...providedSlot.droppableProps}
            className={`h-full rounded-lg transition-colors duration-150 ${snapshotSlot.isDraggingOver ? 'bg-indigo-100' : ''}`}
          >
            {(() => {
              const overrides: Record<string, string> = {
                '0900-1700': '11:00 - 17:00',
                '1000-1800': '16:00 - 22:00',
              };
              const display = overrides[timeSlot.id] || timeSlot.display;
              return (
                <h4 className="text-lg font-semibold text-slate-700 mb-3 text-center pb-2 border-b border-slate-300">{display}</h4>
              );
            })()}
            
            {/* Conditionally render the break cards */}
            {hasAssignedAgents ? (
              <div className="space-y-3">
                {breakDefinitions.map(breakDef => {
                  const cardId = `${shiftId}-${timeSlot.id}-${breakDef.breakTypeIndex}`;
                  const currentScheduledBreakData = breaksInThisTimeSlot.find(
                    sb => sb.breakTypeIndex === breakDef.breakTypeIndex
                  );
                  
                  // Don't render cards for breaks that are fully completed
                  if (currentScheduledBreakData?.agents && currentScheduledBreakData.agents.length > 0 &&
                      currentScheduledBreakData.agents.every(a => a.status === 'done')) {
                    return null;
                  }
                  
                  const isExpanded = expandedCards[cardId] !== false;

                  return (
                    <BreakCard
                      key={cardId}
                      cardId={cardId}
                      breakDef={breakDef}
                      currentScheduledBreak={currentScheduledBreakData}
                      shiftId={shiftId}
                      timeSlotId={timeSlot.id}
                      allAgents={agents}
                      onUpdateAgentStatus={onUpdateAgentStatus}
                      isExpanded={isExpanded}
                      onToggleExpansion={() => toggleCardExpansion(cardId)}
                      isUpdatingBreak={isUpdatingBreak}
                      errorMessages={errorMessages}
                      optimisticUpdates={optimisticUpdates}
                    />
                  );
                })}
              </div>
            ) : (
              // Show a placeholder message when no agents are assigned
              <div className="text-sm text-gray-400 italic text-center py-10">
                {snapshotSlot.isDraggingOver ? 'Drop agent to assign breaks' : 'Drag an agent here'}
              </div>
            )}
            
            {providedSlot.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default TimeSlotView;