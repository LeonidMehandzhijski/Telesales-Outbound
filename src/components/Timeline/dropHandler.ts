// src/components/Timeline/dropHandler.ts
import type { DropResult } from 'react-beautiful-dnd';

type Handler = ((result: DropResult) => void) | null;

let handlerRef: Handler = null;

export const setTimelineDropHandler = (h: Handler) => {
  handlerRef = h;
};

export const getTimelineDropHandler = (): Handler => handlerRef;


