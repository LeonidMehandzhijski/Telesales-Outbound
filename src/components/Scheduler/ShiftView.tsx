// src/components/Scheduler/ShiftView.tsx
import React from 'react';
import TimeSlotView from './TimeSlotView';
import type { ShiftViewProps } from '../../types/scheduler.types';

const ShiftView: React.FC<ShiftViewProps> = ({
  shift,
  agents,
  breakDefinitions,
  scheduledBreaks, // All scheduled breaks for the app
  onUpdateAgentStatus,
  expandedCards,
  toggleCardExpansion,
  isUpdatingBreak,
  errorMessages,
  optimisticUpdates,
}) => {
  // Filter scheduledBreaks for the current shift to pass down if needed,
  // or let TimeSlotView do its own filtering.
  // For now, TimeSlotView filters from the main scheduledBreaks list.
  const relevantScheduledBreaks = scheduledBreaks.filter(sb => sb.shiftId === shift.id);

  return (
    <div key={shift.id} className="bg-white p-1 md:p-4 rounded-lg shadow-md">
      <h3 className="text-2xl font-bold mb-2 md:mb-4 text-indigo-700">{shift.name}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
        {shift.timeSlots.map(timeSlot => (
          <TimeSlotView
            key={timeSlot.id}
            timeSlot={timeSlot}
            shiftId={shift.id}
            agents={agents}
            breakDefinitions={breakDefinitions}
            scheduledBreaks={relevantScheduledBreaks} // Pass filtered breaks for this shift
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
  );
};

export default ShiftView;
