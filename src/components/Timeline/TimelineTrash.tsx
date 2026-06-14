// src/components/Timeline/TimelineTrash.tsx
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import { DROPPABLE_IDS } from '../../constants/droppableIds';

const TimelineTrash: React.FC = () => {
  return (
    <Droppable droppableId={DROPPABLE_IDS.TRASH} type="AGENT">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.droppableProps}
          className={`rounded border text-sm px-3 py-2 ${snapshot.isDraggingOver ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 bg-white text-gray-600'}`}
        >
          Drop here to remove from timeline
          {provided.placeholder}
        </div>
      )}
    </Droppable>
  );
};

export default TimelineTrash;




