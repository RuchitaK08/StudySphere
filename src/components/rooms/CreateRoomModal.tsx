import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { firestoreService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../layout/Toast';
import type { RoomCategory, RoomVibe, StudyRoom } from '../../types';
import { Sparkles, Hash, BookOpen } from 'lucide-react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRoomCreated: (room: StudyRoom) => void;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onRoomCreated
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [category, setCategory] = useState<RoomCategory>('Technology');
  const [vibe, setVibe] = useState<RoomVibe>('Quiet focus');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setSubmitting(true);
    try {
      const newRoom = await firestoreService.createRoom({
        name: name.trim(),
        category,
        vibe,
        description: description.trim() || `A focused space for studying ${name.trim()} together.`,
        hostId: user?.uid || 'guest-host',
        hostName: user?.displayName || 'Student Host'
      });

      showToast(`Study Room "${newRoom.name}" created! Join Code: ${newRoom.code} ✦`, 'success');
      onRoomCreated(newRoom);
      onClose();
      // Reset form
      setName('');
      setDescription('');
    } catch (err) {
      console.error(err);
      showToast('Failed to create room. Please try again.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create a Collaborative Study Room"
      subtitle="Host a virtual study session. Your peers can join in real-time."
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Room Name
          </label>
          <input
            type="text"
            required
            maxLength={50}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Distributed Systems & Cloud Labs"
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Subject Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as RoomCategory)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Technology">Technology & Coding</option>
              <option value="Exam prep">Exam Prep</option>
              <option value="Creative">Creative & Design</option>
              <option value="General">General / Silent</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Room Atmosphere
            </label>
            <select
              value={vibe}
              onChange={(e) => setVibe(e.target.value as RoomVibe)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="Quiet focus">Quiet focus (no chat)</option>
              <option value="Study buddies">Study buddies (active)</option>
              <option value="Accountability">Accountability (goal check-ins)</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
            Description / Session Goal (Optional)
          </label>
          <textarea
            rows={3}
            maxLength={200}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Solving 3 LeetCode medium questions and reviewing Cloud Computing Unit 4."
            className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all resize-none"
          />
        </div>

        <div className="p-3 rounded-xl bg-primary-50/70 dark:bg-primary-950/40 border border-primary-100 dark:border-primary-900/60 text-xs text-primary-800 dark:text-primary-300 flex items-center gap-2">
          <Hash className="w-4 h-4 shrink-0 text-primary-600 dark:text-primary-400" />
          <span>A unique 6-character room code will be generated for your classmates to join instantly.</span>
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
            disabled={submitting}
            className="px-5 py-2 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-md shadow-primary-500/25 flex items-center gap-2"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>{submitting ? 'Creating Room...' : 'Create Room ✦'}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
};
