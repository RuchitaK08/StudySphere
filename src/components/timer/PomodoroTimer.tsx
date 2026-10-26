import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, CheckCircle2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { soundService } from '../../services/audioService';
import { firestoreService } from '../../services/firestoreService';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../layout/Toast';
import type { SharedTimerState, TimerMode, StudyRoom } from '../../types';

interface PomodoroTimerProps {
  room?: StudyRoom | null;
  onTimerChange?: (timerState: SharedTimerState) => void;
  isHost?: boolean;
}

export const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  room,
  onTimerChange,
  isHost = true
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<TimerMode>(room?.timerState?.mode || 'focus');
  const [isRunning, setIsRunning] = useState<boolean>(room?.timerState?.isRunning || false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(
    room?.timerState?.pausedRemainingSeconds || 25 * 60
  );
  const [ambientActive, setAmbientActive] = useState<string | null>(null);

  const durationMap: Record<TimerMode, number> = {
    focus: 25 * 60,
    shortBreak: 5 * 60,
    longBreak: 15 * 60
  };

  const totalDuration = durationMap[mode];

  // Sync with room state if available
  useEffect(() => {
    if (!room?.timerState) return;

    const { mode: roomMode, isRunning: roomRunning, endsAt, pausedRemainingSeconds } = room.timerState;
    setMode(roomMode);
    setIsRunning(roomRunning);

    if (roomRunning && endsAt) {
      const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
      setSecondsRemaining(remaining);
    } else {
      setSecondsRemaining(pausedRemainingSeconds ?? durationMap[roomMode]);
    }
  }, [room?.timerState]);

  // Main countdown tick
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning) {
      interval = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            handleSessionCompleted();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning, mode]);

  const handleSessionCompleted = async () => {
    setIsRunning(false);
    soundService.playCompletionChime();

    // Trigger celebration confetti
    try {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
    } catch {}

    const sessionMinutes = Math.round(totalDuration / 60);

    if (mode === 'focus' && user) {
      showToast(`🎉 Focus session completed! ${sessionMinutes} minutes logged to cloud.`, 'success');
      try {
        await firestoreService.recordSession({
          user,
          minutes: sessionMinutes,
          mode: 'Focus time',
          roomId: room?.id,
          roomName: room?.name || 'Personal Focus'
        });
      } catch (err) {
        console.warn('Could not record session to cloud:', err);
      }
    } else {
      showToast('Break time completed! Ready to focus again?', 'info');
    }

    // Reset to focus or break default
    if (onTimerChange) {
      onTimerChange({
        mode: 'focus',
        durationMinutes: 25,
        isRunning: false,
        startedAt: null,
        endsAt: null,
        pausedRemainingSeconds: 25 * 60,
        lastUpdatedBy: user?.displayName,
        lastUpdatedAt: Date.now()
      });
    }
  };

  const toggleTimer = () => {
    soundService.playClick();
    const nextRunning = !isRunning;
    setIsRunning(nextRunning);

    const now = Date.now();
    const endsAt = nextRunning ? now + secondsRemaining * 1000 : null;

    if (onTimerChange) {
      onTimerChange({
        mode,
        durationMinutes: Math.round(totalDuration / 60),
        isRunning: nextRunning,
        startedAt: nextRunning ? now : null,
        endsAt,
        pausedRemainingSeconds: secondsRemaining,
        lastUpdatedBy: user?.displayName,
        lastUpdatedAt: now
      });
    }

    showToast(nextRunning ? 'Timer started. Deep focus mode active.' : 'Timer paused.', 'info');
  };

  const resetTimer = () => {
    soundService.playClick();
    setIsRunning(false);
    const defaultSecs = durationMap[mode];
    setSecondsRemaining(defaultSecs);

    if (onTimerChange) {
      onTimerChange({
        mode,
        durationMinutes: Math.round(defaultSecs / 60),
        isRunning: false,
        startedAt: null,
        endsAt: null,
        pausedRemainingSeconds: defaultSecs,
        lastUpdatedBy: user?.displayName,
        lastUpdatedAt: Date.now()
      });
    }
    showToast('Timer reset.', 'info');
  };

  const switchMode = (newMode: TimerMode) => {
    soundService.playClick();
    setMode(newMode);
    setIsRunning(false);
    const secs = durationMap[newMode];
    setSecondsRemaining(secs);

    if (onTimerChange) {
      onTimerChange({
        mode: newMode,
        durationMinutes: Math.round(secs / 60),
        isRunning: false,
        startedAt: null,
        endsAt: null,
        pausedRemainingSeconds: secs,
        lastUpdatedBy: user?.displayName,
        lastUpdatedAt: Date.now()
      });
    }
  };

  const toggleAmbientSound = (type: 'rain' | 'lofi' | 'waves') => {
    const active = soundService.toggleAmbient(type);
    setAmbientActive(active ? type : null);
  };

  // Time format
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // SVG circular progress calculation
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progressRatio = secondsRemaining / totalDuration;
  const strokeDashoffset = circumference * (1 - progressRatio);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm relative overflow-hidden">
      {/* Background ambient glow */}
      <div className="absolute -top-24 -left-24 w-60 h-60 bg-primary-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Mode Selector Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl mb-8 z-10">
        <button
          onClick={() => switchMode('focus')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            mode === 'focus'
              ? 'bg-white dark:bg-slate-900 text-primary-700 dark:text-primary-300 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Focus (25m)
        </button>
        <button
          onClick={() => switchMode('shortBreak')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            mode === 'shortBreak'
              ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-300 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Short Break (5m)
        </button>
        <button
          onClick={() => switchMode('longBreak')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            mode === 'longBreak'
              ? 'bg-white dark:bg-slate-900 text-indigo-700 dark:text-indigo-300 shadow-sm'
              : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
          }`}
        >
          Long Break (15m)
        </button>
      </div>

      {/* SVG Progress Ring */}
      <div className="relative w-64 h-64 flex items-center justify-center my-2">
        <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 240 240">
          <circle
            cx="120"
            cy="120"
            r={radius}
            className="text-slate-100 dark:text-slate-800"
            strokeWidth="12"
            stroke="currentColor"
            fill="transparent"
          />
          <circle
            cx="120"
            cy="120"
            r={radius}
            className={`transition-all duration-500 ${
              mode === 'focus'
                ? 'text-primary-600 dark:text-primary-400'
                : mode === 'shortBreak'
                ? 'text-emerald-500'
                : 'text-indigo-500'
            }`}
            strokeWidth="12"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            stroke="currentColor"
            fill="transparent"
          />
        </svg>

        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-[11px] uppercase tracking-widest font-bold text-slate-400 mb-1">
            {mode === 'focus' ? 'Deep Work' : mode === 'shortBreak' ? 'Short Rest' : 'Long Recharge'}
          </span>
          <span className="text-5xl font-extrabold tracking-tighter text-slate-900 dark:text-white tabular-nums font-mono">
            {timeFormatted}
          </span>
          <div className="flex items-center gap-1.5 mt-2 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600'}`} />
            <span>{isRunning ? 'Synchronized' : 'Ready to start'}</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-3 mt-6 z-10">
        <button
          onClick={toggleTimer}
          className={`px-8 py-3.5 rounded-2xl text-sm font-bold text-white shadow-lg flex items-center gap-2.5 transition-all active:scale-95 ${
            isRunning
              ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-500/25'
              : 'bg-primary-600 hover:bg-primary-700 shadow-primary-500/30'
          }`}
        >
          {isRunning ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isRunning ? 'Pause Timer' : 'Start Focus'}</span>
        </button>

        <button
          onClick={resetTimer}
          className="p-3.5 rounded-2xl text-slate-600 dark:text-slate-300 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors"
          title="Reset Timer"
          aria-label="Reset Timer"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* Ambient sound generator controls */}
      <div className="mt-8 pt-4 border-t border-slate-100 dark:border-slate-800 w-full flex items-center justify-between text-xs text-slate-500">
        <span className="font-semibold flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-primary-500" />
          Study Ambience:
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => toggleAmbientSound('rain')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              ambientActive === 'rain'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            🌧️ Rain
          </button>
          <button
            onClick={() => toggleAmbientSound('lofi')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              ambientActive === 'lofi'
                ? 'bg-primary-100 text-primary-700 dark:bg-primary-950 dark:text-primary-300 font-bold'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            ☕ Lofi Focus
          </button>
          {ambientActive && (
            <button
              onClick={() => soundService.stopAmbient()}
              className="p-1 text-slate-400 hover:text-slate-600"
              title="Stop audio"
            >
              <VolumeX className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
