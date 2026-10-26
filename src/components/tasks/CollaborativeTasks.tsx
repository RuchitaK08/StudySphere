import React, { useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, ListTodo } from 'lucide-react';
import type { RoomTask } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../layout/Toast';

interface CollaborativeTasksProps {
  tasks: RoomTask[];
  onAddTask: (title: string) => Promise<void>;
  onToggleTask: (taskId: string, completed: boolean) => Promise<void>;
  onDeleteTask: (taskId: string) => Promise<void>;
}

export const CollaborativeTasks: React.FC<CollaborativeTasksProps> = ({
  tasks,
  onAddTask,
  onToggleTask,
  onDeleteTask
}) => {
  const [newTitle, setNewTitle] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    setSubmitting(true);
    try {
      await onAddTask(title);
      setNewTitle('');
      showToast('Task added to collaborative room board! ✦', 'success');
    } catch {
      showToast('Failed to add task.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const completedCount = tasks.filter((t) => t.completed).length;
  const progressPercent = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
      {/* Header & Progress */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-primary-50 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center">
            <ListTodo className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
              Shared Tasks
            </h4>
            <p className="text-[11px] text-slate-400">
              Real-time room sprint checklist
            </p>
          </div>
        </div>
        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-full">
          {completedCount} / {tasks.length}
        </span>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mb-4">
        <div
          className="bg-emerald-500 h-full transition-all duration-300"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Add Task Input Form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-4">
        <input
          type="text"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          placeholder="Add a room study goal..."
          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
        />
        <button
          type="submit"
          disabled={submitting || !newTitle.trim()}
          className="px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm text-xs font-semibold flex items-center gap-1 shrink-0"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </form>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1 max-h-[340px]">
        {tasks.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            No study goals added yet. Add the first goal above to keep the room aligned!
          </div>
        ) : (
          tasks.map((task) => (
            <div
              key={task.id}
              className={`group flex items-start justify-between gap-3 p-3 rounded-2xl border transition-all ${
                task.completed
                  ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40 text-slate-400 line-through'
                  : 'bg-white dark:bg-slate-850 border-slate-100 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div
                onClick={() => onToggleTask(task.id, !task.completed)}
                className="flex items-start gap-2.5 cursor-pointer flex-1"
              >
                <div className="mt-0.5 shrink-0">
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 fill-emerald-100 dark:fill-emerald-950" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-300 dark:text-slate-600 group-hover:text-primary-500 transition-colors" />
                  )}
                </div>
                <div>
                  <p className="text-xs font-medium leading-relaxed">{task.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-[10px] text-slate-400 font-normal">
                    <span>By {task.createdByName || 'Student'}</span>
                    {task.completed && task.completedByName && (
                      <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                        ✓ Done by {task.completedByName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Delete button (visible on hover) */}
              <button
                onClick={() => onDeleteTask(task.id)}
                className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity"
                title="Delete task"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
