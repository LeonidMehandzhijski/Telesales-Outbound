export interface Shift {
  id: string;
  name: string; // e.g., "07:00 - 15:00"
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

export interface AppBreakDefinition {
  id: string; // e.g., "prva_pauza"
  name: string; // e.g., "Prva pauza"
  durationMinutes: number;
  color?: string;
  maxAgents: number; // How many agents can take this break simultaneously
}

export interface BreakTiming {
  breakDefinitionId: string;
  hoursFromShiftStart: number;
  specificTime: string;
}

export const APP_SHIFTS: Shift[] = [
  { id: 's1', name: '07:00 - 15:00', startTime: '07:00', endTime: '15:00' },
  { id: 's2', name: '08:00 - 16:00', startTime: '08:00', endTime: '16:00' },
  { id: 's3', name: '11:00 - 17:00', startTime: '09:00', endTime: '17:00' },
  { id: 's4', name: '16:00 - 22:00', startTime: '10:00', endTime: '18:00' },
  { id: 's5', name: '12:00 - 20:00', startTime: '12:00', endTime: '20:00' },
  { id: 's6', name: '14:00 - 22:00', startTime: '14:00', endTime: '22:00' },
  { id: 's7', name: '16:00 - 00:00', startTime: '16:00', endTime: '00:00' },
  { id: 's8', name: '17:00 - 01:00', startTime: '17:00', endTime: '01:00' },
];

export const APP_BREAK_DEFINITIONS: AppBreakDefinition[] = [
  { id: 'prva', name: 'Прва пауза', durationMinutes: 15, maxAgents: 10, color: '#4CAF50' },
  { id: 'vtora', name: 'Втора пауза', durationMinutes: 15, maxAgents: 10, color: '#2196F3' },
  { id: 'treta', name: 'Трета пауза', durationMinutes: 15, maxAgents: 10, color: '#FF9800' },
];

// Define timing of breaks within a shift (e.g., hours from shift start)
// This is a simplified approach. You might need more complex rules.
export const BREAK_TIMING_IN_SHIFT = [
  { breakDefinitionId: 'prva', hoursFromShiftStart: 2, specificTime: '10:00' }, // Example: Prva is at 10:00 for early shifts, or 2hrs in
  { breakDefinitionId: 'vtora', hoursFromShiftStart: 5, specificTime: '14:00' }, // Example: Vtora is at 14:00 for early shifts, or 5hrs in
  { breakDefinitionId: 'treta', hoursFromShiftStart: 7, specificTime: '16:00' }  // Example: Treta is at 16:00 for early shifts, or 7hrs in
]; 