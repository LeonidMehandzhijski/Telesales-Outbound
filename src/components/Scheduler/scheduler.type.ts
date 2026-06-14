// src/components/Scheduler/scheduler.types.ts
import { DropResult } from 'react-beautiful-dnd';

export interface Agent {
  id: string; // This will be the Firebase document ID
  name: string;
  avatar?: string; // For Persona imageText
  ImePrezime?: string;
  isOnBreak?: boolean;
  shiftStart?: any;
  shiftEnd?: any;
  currentBreakStartTime?: any;
  currentBreakId?: string;
  currentShiftId?: string; // Tracks which shift the agent is currently assigned to (e.g., "0700-1500")
}

export interface BreakDefinition {
  id: string;
  name: string; // e.g., "Прва пауза"
  durationMinutes: number;
  color: string; // Tailwind color class, e.g., 'bg-green-500'
  breakTypeIndex: number; // 0, 1, 2
}

export interface TimeSlot {
  id: string; // e.g., "0700-1500"
  display: string; // e.g., "07-15"
}

export interface AppShift {
  id: string; // e.g., "morning"
  name: string; // e.g., "Prva smena"
  timeSlots: TimeSlot[];
}

export interface AgentInSlot {
  agentId: string;
  status: 'scheduled' | 'active' | 'done';
}

export interface ScheduledBreak {
  // Unique key for this break instance: ${shiftId}-${timeSlotId}-${breakTypeIndex}
  id: string;
  shiftId: string;
  timeSlotId: string;
  breakTypeIndex: number;
  agents: AgentInSlot[];
}

// Props for the main Scheduler component
export interface SchedulerProps {
  onDragEnd: (result: DropResult) => void; // Note: Made this required as it's essential for DND
  agents: Agent[];
  appShifts: AppShift[];
  breakDefinitions: BreakDefinition[];
  scheduledBreaks: ScheduledBreak[];
  onAssignAgent: (params: {
    agentId: string;
    shiftId: string;
    timeSlotId: string;
    breakTypeIndex: number;
  }) => void;
  onUpdateAgentStatus: (params: {
    agentId: string;
    shiftId: string;
    timeSlotId: string;
    breakTypeIndex: number;
    newStatus: 'active' | 'done';
  }) => void;
  // onRemoveAgentFromBreak?: (params: { agentId: string; shiftId: string; timeSlotId: string; breakTypeIndex: number }) => void;
}

// Props for AgentList component
export interface AgentListProps {
  availableAgents: (Agent & { draggableId: string })[];
  getAgentBreakTime: (agentId: string) => { time: string; isActive: boolean } | null;
}

// Props for AgentItemDraggable component
export interface AgentItemDraggableProps {
  agent: Agent & { draggableId: string };
  index: number;
  getAgentBreakTime: (agentId: string) => { time: string; isActive: boolean } | null;
}

// Props for ShiftView component
export interface ShiftViewProps {
  shift: AppShift;
  agents: Agent[];
  breakDefinitions: BreakDefinition[];
  scheduledBreaks: ScheduledBreak[];
  onUpdateAgentStatus: SchedulerProps['onUpdateAgentStatus'];
  expandedCards: Record<string, boolean>;
  toggleCardExpansion: (cardId: string) => void;
  isUpdatingBreak: Record<string, boolean>;
  errorMessages: Record<string, string>;
  optimisticUpdates: Record<string, { status: 'active' | 'done' }>;
}

// Props for TimeSlotView component
export interface TimeSlotViewProps {
  timeSlot: TimeSlot;
  shiftId: string;
  agents: Agent[];
  breakDefinitions: BreakDefinition[];
  scheduledBreaks: ScheduledBreak[]; // Breaks relevant to this specific timeslot
  onUpdateAgentStatus: SchedulerProps['onUpdateAgentStatus'];
  expandedCards: Record<string, boolean>;
  toggleCardExpansion: (cardId: string) => void;
  isUpdatingBreak: Record<string, boolean>;
  errorMessages: Record<string, string>;
  optimisticUpdates: Record<string, { status: 'active' | 'done' }>;
}

// Props for BreakCard component
export interface BreakCardProps {
  breakDef: BreakDefinition;
  currentScheduledBreak: ScheduledBreak | undefined;
  shiftId: string;
  timeSlotId: string;
  allAgents: Agent[]; // Renamed from 'agents' to avoid confusion with agents in this specific break
  onUpdateAgentStatus: SchedulerProps['onUpdateAgentStatus'];
  isExpanded: boolean;
  onToggleExpansion: () => void; // Simplified from toggleCardExpansion(cardId)
  cardId: string; // For Droppable ID and key
  isUpdatingBreak: Record<string, boolean>; // Pass down for specific break
  errorMessages: Record<string, string>; // Pass down for specific break
  optimisticUpdates: Record<string, { status: 'active' | 'done' }>; // Pass down for specific break
}

// Props for AgentItemInBreak component
export interface AgentItemInBreakProps {
  agentInSlot: AgentInSlot;
  agentDetail: Agent | undefined;
  index: number;
  shiftId: string;
  timeSlotId: string;
  breakTypeIndex: number;
  onUpdateAgentStatus: SchedulerProps['onUpdateAgentStatus'];
  isUpdatingThisBreak: boolean;
  optimisticStatus?: 'active' | 'done';
}
