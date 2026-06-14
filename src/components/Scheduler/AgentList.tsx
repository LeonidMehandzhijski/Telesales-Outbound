// src/components/Scheduler/AgentList.tsx
import React from 'react';
import { Droppable } from 'react-beautiful-dnd';
import AgentItemDraggable from './AgentItemDraggable';
import type { AgentWithDraggableId } from '../../types/scheduler.types';
import { DROPPABLE_IDS } from '../../constants/droppableIds';

const AgentList: React.FC<{ 
  availableAgents: AgentWithDraggableId[]; 
  getAgentBreakTime: (agentId: string) => { time: string; isActive: boolean } | null;
}> = ({ availableAgents, getAgentBreakTime }) => {
  // Debug: Log the available agents to verify data
  console.log('[AgentList] Available agents:', availableAgents.map(agent => ({
    id: agent.id,
    name: agent.name,
    draggableId: agent.draggableId,
    currentShiftId: agent.currentShiftId
  })));
  return (
    <Droppable droppableId={DROPPABLE_IDS.AGENT_LIST} type="AGENT" direction="vertical">
      {(provided) => (
        <div
          {...provided.droppableProps}
          ref={provided.innerRef}
          className="w-full md:w-64 bg-slate-800 text-white flex flex-col"
          style={{ minHeight: '200px', maxHeight: 'calc(100vh - 150px)' }}
        >
          <div className="p-4 pb-2">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-slate-100">Агенти</h2>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto overflow-x-hidden px-2 pb-2">
            <div className="space-y-2">
              {availableAgents.map((agent, index) => {
                // Generate draggableId once and use it consistently
                const draggableId = `agent-${agent.id}`.trim();
                console.log(`[AgentList] Rendering agent ${index}:`, {
                  index,
                  agentId: agent.id,
                  draggableId,
                  agentName: agent.name,
                  currentShiftId: agent.currentShiftId
                });
                
                return (
                  <AgentItemDraggable
                    key={draggableId}
                    agent={agent}
                    index={index}
                    getAgentBreakTime={getAgentBreakTime}
                  />
                );
              })}
              {provided.placeholder}
              {availableAgents.length === 0 && (
                <p className="text-slate-400 text-sm italic p-2">
                  Няма налични агенти или всички агенти са завършили почивките си за текущата смяна.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </Droppable>
  );
};

export default AgentList;
