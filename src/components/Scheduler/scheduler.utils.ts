// src/components/Scheduler/scheduler.utils.ts
import type { Agent } from '../../types/scheduler.types';

/**
 * Finds and returns agent details from a list of all agents.
 * @param agentId - The ID of the agent to find.
 * @param allAgents - An array of all agent objects.
 * @returns The agent object if found, otherwise undefined.
 */
export const getAgentDetails = (agentId: string, allAgents: Agent[]): Agent | undefined => {
  return allAgents.find(a => a.id === agentId);
};

/**
 * Formats a duration in seconds to a MM:SS string.
 * @param seconds - The duration in seconds.
 * @returns A string formatted as MM:SS.
 */
export const formatDuration = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

/**
 * Extracts the agent ID from a draggableId string.
 * Assumes draggableId format is 'agent-${agentId}'.
 * @param draggableId - The draggable ID string.
 * @returns The agent ID if the format is valid, otherwise null.
 */
export const getAgentIdFromDraggableId = (draggableId: string): string | null => {
  if (!draggableId.startsWith('agent-')) {
    console.error('Invalid draggableId format:', draggableId);
    return null;
  }
  return draggableId.substring(6); // Remove 'agent-' prefix
};