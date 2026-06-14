// src/components/Timeline/Timeline.tsx
import React, { useMemo, useState, useCallback, useEffect } from 'react';
import { Droppable, DropResult, Draggable } from 'react-beautiful-dnd';
import type { Agent, AgentWithDraggableId } from '../../types/scheduler.types';
import { saveAgentBreakReservation } from '../../services/agentService';
import { format } from 'date-fns';
import BreakDurationModal from './components/BreakDurationModal';
import AgentList from '../Scheduler/AgentList';
import { DROPPABLE_IDS } from '../../constants/droppableIds';
import TimelineTrash from './TimelineTrash';
import { setTimelineDropHandler } from './dropHandler';
import { getAgentIdFromDraggableId } from '../Scheduler/scheduler.utils';

type Minute = `${number}${number}`;

export interface TimelineProps {
  agents: Agent[];
  currentUserEmail?: string | null;
}

type Slot = {
  id: string;
  label: string;
  startMinutesFromMidnight: number; // 0.. 1410 step 30
};

type PendingDrop = {
  agentId: string;
  slotId: string;
};

const toMinutes = (hhmm: string): number => {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
};

const toHHMM = (mins: number): string => {
  const clamped = ((mins % (24 * 60)) + (24 * 60)) % (24 * 60);
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const generateSlots = (): Slot[] => {
  const slots: Slot[] = [];
  const startDay = 7 * 60; // 07:00
  const endDay = 21 * 60; // 21:00
  for (let i = startDay; i < endDay; i += 30) {
    const start = toHHMM(i);
    const end = toHHMM(i + 30);
    slots.push({ id: `slot-${i}`, label: `${start} – ${end}`, startMinutesFromMidnight: i });
  }
  return slots;
};

const rangesOverlap = (aStart: number, aEnd: number, bStart: number, bEnd: number) => {
  return Math.max(aStart, bStart) < Math.min(aEnd, bEnd);
};

const Timeline: React.FC<TimelineProps> = ({ agents, currentUserEmail }) => {
  const [selectedDate, setSelectedDate] = useState<string>(() => format(new Date(), 'yyyy-MM-dd'));
  const [agentFilter, setAgentFilter] = useState<string>('');
  const [pendingDrop, setPendingDrop] = useState<PendingDrop | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const slots = useMemo(() => generateSlots(), []);

  const availableAgents = useMemo<AgentWithDraggableId[]>(() => {
    // Exclude agents who already have a reservation on the selected date to avoid duplicate draggableIds
    const eligible = agents.filter(a => !(a.date === selectedDate && a.startTime && a.endTime));
    return eligible.map(a => ({
      ...a,
      draggableId: `agent-${a.id}`,
      name: a.ImePrezime || a.name || 'Unknown Agent',
    }));
  }, [agents, selectedDate]);

  const breaksForDate = useMemo(() => {
    return agents
      .filter(a => a.date === selectedDate && a.startTime && a.endTime)
      .map(a => ({
        agentId: a.id,
        name: a.ImePrezime || a.name,
        start: toMinutes(a.startTime as string),
        end: toMinutes(a.endTime as string),
        color: '#22c55e',
      }));
  }, [agents, selectedDate]);

  const onDropAgentIntoSlot = useCallback((slotId: string, agentId: string) => {
    setPendingDrop({ slotId, agentId });
    setModalOpen(true);
  }, []);

  const handleConfirmBreak = useCallback(async (startMinuteOffset: 0 | 15 | 30 | 45, durationMinutes: 15 | 30 | 45 | 60) => {
    if (!pendingDrop) return;
    const slot = slots.find(s => s.id === pendingDrop.slotId);
    if (!slot) return;

    const startMinutes = slot.startMinutesFromMidnight + startMinuteOffset;
    const endMinutes = startMinutes + durationMinutes;

    // Allow up to 4 overlapping reservations in the same time range
    const concurrentCount = breaksForDate.reduce((count, b) => {
      return count + (rangesOverlap(startMinutes, endMinutes, b.start, b.end) ? 1 : 0);
    }, 0);
    if (concurrentCount >= 4) {
      alert('Овој термин е веќе пополнет (макс. 4 агенти). Одберете друг термин.');
      return;
    }

    const startHHMM = toHHMM(startMinutes);
    const endHHMM = toHHMM(endMinutes);
    await saveAgentBreakReservation(pendingDrop.agentId, {
      startTime: startHHMM as string,
      endTime: endHHMM as string,
      breakDuration: durationMinutes,
      reservedBy: currentUserEmail || 'unknown',
      date: selectedDate,
    });
    setModalOpen(false);
    setPendingDrop(null);
  }, [pendingDrop, slots, breaksForDate, currentUserEmail, selectedDate]);

  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();

  // For scroll-to-current hour on mount
  useEffect(() => {
    const hourBucket = Math.floor(nowMins / 60) * 60;
    const withinRange = hourBucket >= 7 * 60 && hourBucket < 21 * 60;
    const currentSlotId = withinRange ? `slot-${Math.floor(nowMins / 30) * 30}` : `slot-${7 * 60}`;
    const el = document.getElementById(currentSlotId);
    if (el) {
      el.scrollIntoView({ block: 'center' });
    }
  }, []);

  // Register global drop handler so App's DragDropContext can delegate drops here
  useEffect(() => {
    setTimelineDropHandler((result: DropResult) => {
      const { destination, draggableId } = result;
      if (!destination) return;
      const slotId = destination.droppableId; // expected 'slot-<mins>' or TRASH/AGENT_LIST
      const agentId = getAgentIdFromDraggableId(draggableId);
      if (!agentId) return;
      if (slotId === DROPPABLE_IDS.TRASH || slotId === DROPPABLE_IDS.AGENT_LIST) {
        import('../../services/agentService').then(m => m.clearAgentBreakReservation(agentId));
        return;
      }
      onDropAgentIntoSlot(slotId, agentId);
    });
    return () => setTimelineDropHandler(null);
  }, [onDropAgentIntoSlot]);

  return (
    <div className="flex gap-4 h-full">
      <div className="w-64 flex-shrink-0">
        <div className="bg-white rounded-md p-3 shadow mb-3">
          <label className="block text-sm font-medium text-gray-700 mb-1">Датум</label>
          <input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="w-full border rounded px-2 py-1 text-sm"
          />
          <label className="block text-sm font-medium text-gray-700 mt-3 mb-1">Филтер по агент</label>
          <input
            type="text"
            value={agentFilter}
            onChange={e => setAgentFilter(e.target.value)}
            placeholder="Барај агент"
            className="w-full border rounded px-2 py-1 text-sm"
          />
        </div>
        <div className="overflow-hidden rounded-md shadow">
          <AgentList
            availableAgents={availableAgents}
            getAgentBreakTime={() => null}
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Sticky Trash droppable */}
        <div className="sticky top-0 z-20 p-2">
          <TimelineTrash />
        </div>
        <div className="relative">
          {slots.map(slot => {
            const isCurrentHour = Math.floor(nowMins / 60) === Math.floor(slot.startMinutesFromMidnight / 60);
            const slotBreaks = breaksForDate.filter(b => rangesOverlap(slot.startMinutesFromMidnight, slot.startMinutesFromMidnight + 30, b.start, b.end));
            return (
              <div key={slot.id} id={slot.id} className={`relative border-b px-3 py-2 ${isCurrentHour ? 'bg-amber-50' : 'bg-white'}`}>
                <div className="text-xs text-gray-500 mb-1">{slot.label}</div>

                <Droppable droppableId={slot.id} type="AGENT" direction="vertical">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`h-12 rounded border ${snapshot.isDraggingOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-gray-50'}`}
                    >
                      {/* Render overlapping fragments of breaks that touch this slot */}
                      <div className="relative h-full">
                        {slotBreaks
                          .filter(b => (agentFilter ? (b.name?.toLowerCase().includes(agentFilter.toLowerCase())) : true))
                          .map((b, idx) => {
                            const overlapStart = Math.max(slot.startMinutesFromMidnight, b.start);
                            const overlapEnd = Math.min(slot.startMinutesFromMidnight + 30, b.end);
                            const minutesInSlot = overlapEnd - overlapStart;
                            const offsetWithinSlot = overlapStart - slot.startMinutesFromMidnight; // 0..30
                            const topPct = (offsetWithinSlot / 30) * 100;
                            const heightPct = (minutesInSlot / 30) * 100;
                            // Calculate side-by-side positioning for concurrent breaks
                            const concurrentAtThisMoment = slotBreaks
                              .filter(x => {
                                const xOverlapStart = Math.max(slot.startMinutesFromMidnight, x.start);
                                const xOverlapEnd = Math.min(slot.startMinutesFromMidnight + 30, x.end);
                                return rangesOverlap(overlapStart, overlapEnd, xOverlapStart, xOverlapEnd);
                              })
                              .sort((x, y) => x.agentId.localeCompare(y.agentId));
                            const columnIndex = concurrentAtThisMoment.findIndex(x => x.agentId === b.agentId);
                            const maxColumns = Math.min(4, concurrentAtThisMoment.length);
                            const colWidthPct = 100 / maxColumns;
                            const leftPct = columnIndex * colWidthPct;
                            const draggableId = `agent-${b.agentId}`;
                            return (
                              <Draggable draggableId={draggableId} index={idx} key={`${b.agentId}-${overlapStart}`}>
                                {(dragProvided) => (
                                  <div
                                    ref={dragProvided.innerRef}
                                    {...dragProvided.draggableProps}
                                    {...dragProvided.dragHandleProps}
                                    className="absolute rounded-sm text-[10px] leading-3 px-1 flex items-center cursor-grab"
                                    style={{ 
                                      top: `${topPct}%`, 
                                      height: `${heightPct}%`, 
                                      left: `${leftPct}%`, 
                                      width: `${colWidthPct}%`, 
                                      backgroundColor: '#c7f9cc', 
                                      zIndex: 5, 
                                      ...dragProvided.draggableProps.style 
                                    }}
                                  >
                                    <span className="truncate">{b.name}</span>
                                  </div>
                                )}
                              </Draggable>
                            );
                          })}
                      </div>
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            );
          })}
        </div>
      </div>

      <BreakDurationModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setPendingDrop(null); }}
        onConfirm={handleConfirmBreak}
        onRequestDrop={(agentId, slotId) => onDropAgentIntoSlot(slotId, agentId)}
      />
    </div>
  );
};

export default Timeline;


