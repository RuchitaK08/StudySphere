import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageSquare, Bot } from 'lucide-react';
import type { RoomMessage } from '../../types';
import { useAuth } from '../../context/AuthContext';

interface RoomChatProps {
  messages: RoomMessage[];
  onSendMessage: (text: string) => Promise<void>;
}

export const RoomChat: React.FC<RoomChatProps> = ({ messages, onSendMessage }) => {
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = inputText.trim();
    if (!text) return;

    setSending(true);
    try {
      await onSendMessage(text);
      setInputText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="w-8 h-8 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
          <MessageSquare className="w-4 h-4" />
        </div>
        <div>
          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
            Room Discussion
          </h4>
          <p className="text-[11px] text-slate-400">
            Real-time messages across participants
          </p>
        </div>
      </div>

      {/* Messages stream */}
      <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[340px] text-xs">
        {messages.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            No messages yet. Say hello to your study buddies! 👋
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === user?.uid;
            const isSystem = msg.isSystem || msg.senderId === 'system';

            if (isSystem) {
              return (
                <div key={msg.id} className="flex justify-center my-1.5">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-medium border border-slate-200/60 dark:border-slate-700">
                    <Bot className="w-3.5 h-3.5 text-primary-500" />
                    <span>{msg.text}</span>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-purple-500 to-indigo-500 text-white font-bold text-[10px] flex items-center justify-center shrink-0">
                  {msg.senderName ? msg.senderName.substring(0, 1).toUpperCase() : 'S'}
                </div>

                {/* Message bubble */}
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 ${
                    isMe
                      ? 'bg-primary-600 text-white rounded-tr-none'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-none'
                  }`}
                >
                  {!isMe && (
                    <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-0.5">
                      {msg.senderName}
                    </span>
                  )}
                  <p className="leading-relaxed break-words">{msg.text}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input row */}
      <form onSubmit={handleSend} className="flex gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Send a message to everyone..."
          className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
        />
        <button
          type="submit"
          disabled={sending || !inputText.trim()}
          className="px-3 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white rounded-xl transition-all shadow-sm text-xs font-semibold flex items-center gap-1 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
