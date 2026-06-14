// src/components/Timeline/components/BreakDurationModal.tsx
import React, { useState } from 'react';

interface BreakDurationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (startMinuteOffset: 0 | 15 | 30 | 45, durationMinutes: 15 | 30 | 45 | 60) => void;
  onRequestDrop?: (agentId: string, slotId: string) => void;
}

const BreakDurationModal: React.FC<BreakDurationModalProps> = ({ isOpen, onClose, onConfirm }) => {
  const [offset, setOffset] = useState<0 | 15 | 30 | 45>(0);
  const [duration, setDuration] = useState<15 | 30 | 45 | 60>(30);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-md shadow-lg p-4 w-80">
        <h3 className="text-base font-semibold mb-3">Select break</h3>
        <div className="mb-3">
          <label className="block text-sm text-gray-700 mb-1">Start offset within 30-min slot</label>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
            value={offset}
            onChange={e => setOffset(Number(e.target.value) as 0 | 15 | 30 | 45)}
          >
            <option value={0}>:00</option>
            <option value={15}>:15</option>
            <option value={30}>:30</option>
            <option value={45}>:45</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm text-gray-700 mb-1">Duration (minutes)</label>
          <select
            className="w-full border rounded px-2 py-1 text-sm"
            value={duration}
            onChange={e => setDuration(Number(e.target.value) as 15 | 30 | 45 | 60)}
          >
            <option value={15}>15</option>
            <option value={30}>30</option>
            <option value={45}>45</option>
            <option value={60}>60</option>
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <button className="px-3 py-1.5 text-sm rounded border" onClick={onClose}>Cancel</button>
          <button
            className="px-3 py-1.5 text-sm rounded bg-indigo-600 text-white"
            onClick={() => onConfirm(offset, duration)}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default BreakDurationModal;


