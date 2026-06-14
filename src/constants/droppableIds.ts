export const DROPPABLE_IDS = {
  AGENT_LIST: 'agent-list',
  TRASH: 'trash-bin',
  BREAK: (shiftId: string, timeSlotId: string, breakTypeIndex: number) => 
    `break-${shiftId}-${timeSlotId}-${breakTypeIndex}`,
  TIMESLOT: (shiftId: string, timeSlotId: string) =>
    `timeslot-${shiftId}-${timeSlotId}`
} as const;
