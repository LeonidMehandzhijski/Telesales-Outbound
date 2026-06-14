// src/components/Scheduler/AgentItemInBreak.tsx
import React, { useState, useEffect } from 'react';
import { Persona, PersonaSize } from '@fluentui/react';
import { PlayCircle, CheckCircle2, UserCheck, Loader2, Clock } from 'lucide-react';
import type { AgentItemInBreakProps } from '../../types/scheduler.types';
import { formatDuration } from './scheduler.utils';
import { Timestamp } from 'firebase/firestore';

const AgentItemInBreak: React.FC<AgentItemInBreakProps> = ({
  agentInSlot,
  agentDetail,
  index,
  shiftId,
  timeSlotId,
  breakTypeIndex,
  onUpdateAgentStatus,
  isUpdatingThisBreak,
  optimisticStatus,
}) => {
  const [elapsedTime, setElapsedTime] = useState<string>('');

  const currentDisplayStatus = optimisticStatus || agentInSlot.status;

  useEffect(() => {
    let interval: NodeJS.Timeout | undefined;

    if (currentDisplayStatus === 'active' && agentDetail) {
      // Prioritize the actual start time from the slot, fallback to the agent's general break start time
      const startTimeFirestore = agentInSlot.startTime || agentDetail.currentBreakStartTime;
      let startTime: Date | null = null;
      
      if (startTimeFirestore) {
         if (startTimeFirestore instanceof Timestamp) {
            startTime = startTimeFirestore.toDate();
         } else if (startTimeFirestore instanceof Date) {
            startTime = startTimeFirestore
         }
      }

      if (startTime) {
        // Set initial value immediately
        const initialDiffSeconds = Math.floor((new Date().getTime() - startTime.getTime()) / 1000);
        setElapsedTime(formatDuration(initialDiffSeconds));
        
        interval = setInterval(() => {
          const now = new Date();
          const diffSeconds = Math.floor((now.getTime() - (startTime as Date).getTime()) / 1000);
          setElapsedTime(formatDuration(diffSeconds));
        }, 1000);
      }
    } else {
        setElapsedTime(''); // Clear timer if not active
    }

    // Cleanup function to clear the interval
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [currentDisplayStatus, agentInSlot.startTime, agentDetail]);

  if (!agentDetail) return null;

  let statusColor = 'text-slate-500';
  let StatusIcon = PlayCircle;
  let buttonTitle = 'Start Break';

  if (currentDisplayStatus === 'active') {
    statusColor = 'text-red-500';
    StatusIcon = CheckCircle2;
    buttonTitle = 'End Break';
  } else if (currentDisplayStatus === 'done') {
    statusColor = 'text-green-500';
    StatusIcon = UserCheck;
  }

  const handleStatusUpdateClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (isUpdatingThisBreak || currentDisplayStatus === 'done') return;

    onUpdateAgentStatus({
      agentId: agentInSlot.agentId,
      shiftId,
      timeSlotId,
      breakTypeIndex,
      newStatus: currentDisplayStatus === 'scheduled' ? 'active' : 'done',
    });
  };

  return (
    <li
      key={`${agentInSlot.agentId}-${index}`}
      className={`flex items-center justify-between p-1.5 rounded-md transition-colors
                  ${currentDisplayStatus === 'done' ? 'opacity-60 bg-green-50' : 'hover:bg-slate-100'}
                  ${currentDisplayStatus === 'active' ? 'font-semibold ring-1 ring-red-300 bg-red-50' : ''}
                  ${currentDisplayStatus === 'scheduled' ? 'bg-blue-50' : ''}`}
    >
      <Persona
        text={agentDetail.name}
        size={PersonaSize.size24}
        imageAlt={agentDetail.name}
        styles={{
          primaryText: {
            fontSize: '0.8rem',
            fontWeight: currentDisplayStatus === 'active' ? 600 : 400,
            color: currentDisplayStatus === 'active'
              ? 'rgb(239 68 68)'
              : currentDisplayStatus === 'done'
                ? 'rgb(22 101 52)'
                : 'inherit'
          },
        }}
      />
      
      <div className="flex items-center space-x-2">
        {currentDisplayStatus === 'active' && elapsedTime && (
          <div className="flex items-center text-xs text-red-600 font-mono" title="Elapsed Time">
            <Clock size={14} className="mr-1" />
            {elapsedTime}
          </div>
        )}

        {isUpdatingThisBreak && <Loader2 size={18} className="animate-spin text-slate-500" />}
        
        {!isUpdatingThisBreak && currentDisplayStatus !== 'done' && (
          <button
            onClick={handleStatusUpdateClick}
            title={buttonTitle}
            disabled={isUpdatingThisBreak}
            className={`p-1 rounded-full transition-colors disabled:opacity-50
              ${currentDisplayStatus === 'scheduled'
                ? 'text-sky-600 hover:bg-sky-100'
                : 'text-emerald-600 hover:bg-emerald-100'
            }`}
          >
            <StatusIcon size={18} />
          </button>
        )}
        
        {!isUpdatingThisBreak && currentDisplayStatus === 'done' && (
          <UserCheck size={18} className="text-green-600"/>
        )}
      </div>
    </li>
  );
};

export default AgentItemInBreak;