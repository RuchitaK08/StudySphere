import React, { useState, useEffect } from 'react';
import { PomodoroTimer } from '../components/timer/PomodoroTimer';
import { CollaborativeTasks } from '../components/tasks/CollaborativeTasks';
import { RoomChat } from '../components/chat/RoomChat';
import { Badge } from '../components/common/Badge';
import { firestoreService } from '../services/firestoreService';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/layout/Toast';
import type { StudyRoom, RoomMember, RoomTask, RoomMessage, SharedTimerState } from '../types';
import {
  Users,
  Copy,
  Check,
  ArrowLeft,
  Share2,
  ShieldAlert,
  Sparkles,
  Layers,
  UploadCloud
} from 'lucide-react';

interface StudyRoomPageProps {
  room: StudyRoom;
  onLeaveRoom: () => void;
  onOpenUpload: (roomId: string) => void;
}

export const StudyRoomPage: React.FC<StudyRoomPageProps> = ({
  room: initialRoom,
  onLeaveRoom,
  onOpenUpload
}) => {
  const [room, setRoom] = useState<StudyRoom>(initialRoom);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [tasks, setTasks] = useState<RoomTask[]>([]);
  const [messages, setMessages] = useState<RoomMessage[]>([]);
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'tasks' | 'chat'>('tasks');

  const { user } = useAuth();
  const { showToast } = useToast();

  const isHost = user?.uid === room.hostId;

  // Real-time subscriptions for Room, Members, Tasks, and Messages
  useEffect(() => {
    // 1. Join room
    if (user) {
      firestoreService.joinRoom(room.id, user);
    }

    // 2. Listen to room updates (for timer synchronization across clients)
    const unsubRoom = firestoreService.subscribeRoom(room.id, (updatedRoom: StudyRoom | null) => {
      if (updatedRoom) {
        setRoom(updatedRoom);
      }
    });

    // 3. Listen to members
    const unsubMembers = firestoreService.subscribeRoomMembers(room.id, (memberList: RoomMember[]) => {
      setMembers(memberList);
    });

    // 4. Listen to tasks
    const unsubTasks = firestoreService.subscribeTasks(room.id, (taskList: RoomTask[]) => {
      setTasks(taskList);
    });

    // 5. Listen to messages
    const unsubMessages = firestoreService.subscribeMessages(room.id, (messageList: RoomMessage[]) => {
      setMessages(messageList);
    });

    return () => {
      unsubRoom();
      unsubMembers();
      unsubTasks();
      unsubMessages();
      if (user) {
        firestoreService.leaveRoom(room.id, user.uid);
      }
    };
  }, [room.id, user]);

  const copyCode = () => {
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    showToast(`Room code ${room.code} copied! Share it with your classmates.`, 'info');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleTimerChange = async (timerState: SharedTimerState) => {
    await firestoreService.updateRoomTimer(room.id, timerState);
  };

  const handleAddTask = async (title: string) => {
    if (!user) return;
    await firestoreService.addTask(room.id, title, user);
  };

  const handleToggleTask = async (taskId: string, completed: boolean) => {
    if (!user) return;
    await firestoreService.toggleTask(room.id, taskId, completed, user);
  };

  const handleDeleteTask = async (taskId: string) => {
    await firestoreService.deleteTask(room.id, taskId);
  };

  const handleSendMessage = async (text: string) => {
    if (!user) return;
    await firestoreService.sendMessage(room.id, text, user);
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Room Header Banner */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 sm:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Badge variant="blue">{room.category}</Badge>
              <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 rounded-full">
                {room.vibe}
              </span>
              <button
                onClick={copyCode}
                className="flex items-center gap-1.5 px-3 py-0.5 rounded-full font-mono text-xs font-bold text-primary-700 dark:text-primary-300 bg-primary-50 dark:bg-primary-950/60 border border-primary-200/80 dark:border-primary-800 hover:bg-primary-100 transition-colors"
                title="Click to copy join code"
              >
                <span>Code: {room.code}</span>
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>

            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {room.name}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Host: <b className="text-slate-700 dark:text-slate-300">{room.hostName}</b> · {room.description}
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => onOpenUpload(room.id)}
              className="px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 rounded-xl transition-all flex items-center gap-1.5"
            >
              <UploadCloud className="w-3.5 h-3.5 text-primary-500" />
              <span>Share Note</span>
            </button>

            <button
              onClick={onLeaveRoom}
              className="px-3.5 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 rounded-xl transition-all flex items-center gap-1.5"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Leave Room</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Room Layout: Left Timer, Right Collaborative Tab Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Synchronized Pomodoro Timer (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <PomodoroTimer
            room={room}
            onTimerChange={handleTimerChange}
            isHost={isHost}
          />

          {/* Active Participants Box */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary-500" />
                Active Participants ({members.length})
              </span>
              <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full">
                Live Presence
              </span>
            </div>

            <div className="space-y-2">
              {members.map((member) => (
                <div
                  key={member.uid}
                  className="flex items-center justify-between text-xs py-1.5 px-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-bold text-[10px] flex items-center justify-center">
                        {member.displayName ? member.displayName.substring(0, 1).toUpperCase() : 'S'}
                      </div>
                      <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white dark:ring-slate-900" />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-slate-200 leading-tight">
                        {member.displayName} {member.uid === user?.uid && '(You)'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {member.currentStatus || 'Focusing'}
                      </p>
                    </div>
                  </div>

                  {member.role === 'host' && (
                    <span className="text-[10px] font-bold text-primary-600 bg-primary-50 dark:bg-primary-950 px-2 py-0.5 rounded-full">
                      Host
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Collaborative Tasks & Real-time Chat (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Tab buttons */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'tasks'
                  ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Collaborative Tasks ({tasks.length})
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              Room Discussion ({messages.length})
            </button>
          </div>

          {/* Active View Component */}
          {activeTab === 'tasks' ? (
            <CollaborativeTasks
              tasks={tasks}
              onAddTask={handleAddTask}
              onToggleTask={handleToggleTask}
              onDeleteTask={handleDeleteTask}
            />
          ) : (
            <RoomChat
              messages={messages}
              onSendMessage={handleSendMessage}
            />
          )}
        </div>
      </div>
    </div>
  );
};
