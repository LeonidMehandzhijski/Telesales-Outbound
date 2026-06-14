// src/components/Scheduler/AgentItemDraggable.tsx
import React from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { Persona, PersonaSize, FontWeights } from '@fluentui/react';
import type { AgentItemDraggableProps } from '../../types/scheduler.types';
import { formatDuration } from './scheduler.utils';

const AgentItemDraggable: React.FC<AgentItemDraggableProps> = ({ agent, index, getAgentBreakTime }) => {
  const draggableId = `agent-${agent.id}`.trim();

  return (
    <Draggable
      draggableId={draggableId}
      index={index}
    >
      {(provided, snapshot) => {
        const breakTime = getAgentBreakTime(agent.id);
        
        return (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            {...provided.dragHandleProps}
            className={`mb-2 p-2 rounded-md transition-all duration-200 ${
              snapshot.isDragging 
                ? 'bg-sky-600 shadow-lg transform scale-105 z-10' 
                : 'bg-slate-700 hover:bg-slate-600'
            }`}
            style={{
              ...provided.draggableProps.style,
              userSelect: 'none',
            }}
          >
            <div className="flex items-center justify-between w-full">
              <Persona
                text={agent.name}
                size={PersonaSize.size32}
                styles={{
                  primaryText: {
                    fontWeight: FontWeights.semibold,
                    color: snapshot.isDragging ? '#FFFFFF' : '#E2E8F0',
                    fontSize: '0.875rem',
                  },
                }}
              />
              
              {/* This container ensures consistent alignment for the timers */}
              <div className="flex items-center" style={{ minWidth: '45px', justifyContent: 'flex-end' }}>
                
                {/* Renders the ACTIVE break timer (e.g., 01:23) */}
                {breakTime && breakTime.isActive && (
                  <span 
                    className={`ml-2 text-sm font-mono text-red-400 animate-pulse`}
                    title="Current break time"
                  >
                    {breakTime.time}
                  </span>
                )}

                {/* Renders the TOTAL USED break timer (e.g., 05:45) */}
                {/* This condition ensures NOTHING is rendered if time is 0 */}
                {!breakTime?.isActive && (agent.totalBreakDurationToday ?? 0) > 0 && (
                  <span 
                    className={`ml-2 text-sm font-mono text-slate-400`}
                    title="Total break time used today"
                  >
                    {formatDuration(agent.totalBreakDurationToday || 0)}
                  </span>
                )}
              </div>
            </div>
          </div>
        );
      }}
    </Draggable>
  );
};

export default AgentItemDraggable;