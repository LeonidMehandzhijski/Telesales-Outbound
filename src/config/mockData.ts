// src/config/mockData.ts
import type { BreakDefinition, AppShift } from '../types/scheduler.types';

// Using BreakDefinition structure
export const mockBreakDefinitions: BreakDefinition[] = [
  { id: 'break-1', name: 'Прва пауза', durationMinutes: 15, color: 'bg-green-500', breakTypeIndex: 0 },
  { id: 'break-2', name: 'Втора пауза', durationMinutes: 60, color: 'bg-sky-500', breakTypeIndex: 1 },
  { id: 'break-3', name: 'Трета пауза', durationMinutes: 5, color: 'bg-amber-500', breakTypeIndex: 2 },
];

// Using the AppShift structure
export const mockShifts: AppShift[] = [
  {
    id: 'morning',
    name: 'Прва смена',
    timeSlots: [
      { id: '0700-1500', display: '07:00 - 15:00' },
      { id: '0800-1600', display: '08:00 - 16:00' },
      { id: '0900-1700', display: '11:00 - 17:00' },
      { id: '1000-1800', display: '16:00 - 22:00' },
    ],
  },
  {
    id: 'evening',
    name: 'Втора смена',
    timeSlots: [
      { id: '1200-2000', display: '12:00 - 20:00' },
      { id: '1400-2200', display: '14:00 - 22:00' },
      { id: '1600-0000', display: '16:00 - 00:00' },
      { id: '1700-0100', display: '17:00 - 01:00' },
    ],
  },
];
