import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { useToast } from '../layout/Toast';
import type { StudyRoom } from '../../types';
import { KeyRound, ArrowRight } from 'lucide-react';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: StudyRoom[];
  onJoinSuccess: (room: StudyRoom) => void;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onJoinSuccess
}) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) return;

    const matchedRoom = rooms.find((r) => r.code?.toUpperCase() === cleanCode || r.id.toUpperCase() === cleanCode);

    if (matchedRoom) {
      showToast(`Joined room: ${matchedRoom.name}!`, 'success');
      onJoinSuccess(matchedRoom);
      onClose();
      setCode('');
    } else {
      setError(`No active room found with code "${cleanCode}". Please check with the host.`);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Join Room with Code"
      subtitle="Enter the 6-character room code shared by your peer."
    >
      <form onSubmit={handleJoin} className="flex flex-col gap-4 mt-2">
        {error && (
          <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-300">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Room Code
          </label>
          <div className="relative">
            <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              required
              maxLength={12}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. DSA204 or CLD401"
              className="w-full pl-10 pr-3.5 py-2.5 text-base font-mono uppercase tracking-wider rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Codes are case-insensitive (e.g. "DSA204", "CLD401", "EXAM99").
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-md shadow-primary-500/25 flex items-center gap-1.5"
          >
            <span>Enter Room</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </form>
    </Modal>
  );
};
