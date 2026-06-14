// src/types/scheduler.types.ts
import { DropResult } from 'react-beautiful-dnd';
import { Timestamp } from 'firebase/firestore';

export interface Agent {
  id: string;
  name: string;
  avatar?: string;
  ImePrezime: string;
  isOnBreak: boolean;
  // New time-range break fields for Telesales timeline
  startTime?: string | null; // HH:mm
  endTime?: string | null;   // HH:mm
  breakDuration?: number | null; // minutes
  reservedBy?: string | null; // email
  date?: string | null; // yyyy-MM-dd
  shiftStart?: Date | Timestamp | null;
  shiftEnd?: Date | Timestamp | null;
  currentBreakStartTime?: Date | Timestamp | null;
  // **FIX:** Allowed null for fields that can be cleared
  currentBreakId?: string | null;
  currentShiftId?: string | null;
  assignedBreaks?: {
    shiftId: string;
    timeSlotId: string;
    breakTypeIndex: number;
    status: 'scheduled' | 'active' | 'done';
    breakSlotId: string;
  }[];
  activeBreak_StartTime?: Date | Timestamp | null;
  activeBreak_ScheduledBreakId?: string | null;
  totalBreakDurationToday?: number | null;
}

export interface AgentWithDraggableId extends Agent {
  draggableId: string;
}

export interface BreakDefinition {
  id: string;
  name: string;
  durationMinutes: number;
  color: string;
  breakTypeIndex: number;
}

export interface TimeSlot {
  id: string;
  display: string;
}

export interface AppShift {
  id: string;
  name: string;
  timeSlots: TimeSlot[];
}

export interface DailyBreakSlot {
  id: string;
  shiftId: string;
  timeSlotId: string;
  breakDefinitionId: string;
  breakTypeIndex: number;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  assignedAgentIds: string[];
  status: 'available' | 'scheduled' | 'active' | 'done';
  // **FIX:** Allowed null for fields that can be cleared
  actualStartTime?: Timestamp | null;
  actualEndTime?: Timestamp | null;
}

export interface AgentInSlot {
  agentId: string;
  status: 'scheduled' | 'active' | 'done';
  // **FIX:** Allowed null for fields that can be cleared
  startTime?: Timestamp | null;
  endTime?: Timestamp | null;
}

export interface ScheduledBreak {
  id: string;
  shiftId: string;
  timeSlotId: string;
  breakTypeIndex: number;
  breakDefinitionId: string;
  name: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  assignedAgentIds: string[];
  status: 'available' | 'scheduled' | 'active' | 'done';
  // **FIX:** Allowed null for fields that can be cleared
  actualStartTime?: Timestamp | null;
  actualEndTime?: Timestamp | null;
  agents?: AgentInSlot[]; // This already uses AgentInSlot which is now fixed
}

export interface SchedulerProps {
  onDragEnd: (result: DropResult) => void;
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
}

export interface AgentListProps {
  availableAgents: AgentWithDraggableId[];
  getAgentBreakTime: (agentId: string) => { time: string; isActive: boolean } | null;
}

export interface AgentItemDraggableProps {
  agent: AgentWithDraggableId;
  index: number;
  getAgentBreakTime: (agentId: string) => { time: string; isActive: boolean } | null;
}

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

export interface TimeSlotViewProps {
  timeSlot: TimeSlot;
  shiftId: string;
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

export interface BreakCardProps {
  breakDef: BreakDefinition;
  currentScheduledBreak: ScheduledBreak | undefined;
  shiftId: string;
  timeSlotId: string;
  allAgents: Agent[];
  onUpdateAgentStatus: SchedulerProps['onUpdateAgentStatus'];
  isExpanded: boolean;
  onToggleExpansion: () => void;
  cardId: string;
  isUpdatingBreak: Record<string, boolean>;
  errorMessages: Record<string, string>;
  optimisticUpdates: Record<string, { status: 'active' | 'done' }>;
}

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