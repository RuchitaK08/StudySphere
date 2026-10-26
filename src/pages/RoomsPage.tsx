import React, { useState } from 'react';
import { RoomCard } from '../components/rooms/RoomCard';
import { EmptyState } from '../components/common/EmptyState';
import { Search, Plus, KeyRound, Filter, Users } from 'lucide-react';
import type { StudyRoom, RoomCategory } from '../types';

interface RoomsPageProps {
  rooms: StudyRoom[];
  onEnterRoom: (room: StudyRoom) => void;
  onCreateRoom: () => void;
  onJoinCode: () => void;
}

export const RoomsPage: React.FC<RoomsPageProps> = ({
  rooms,
  onEnterRoom,
  onCreateRoom,
  onJoinCode
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const categories = ['All', 'Technology', 'Exam prep', 'Creative', 'General'];

  const filteredRooms = rooms.filter((room) => {
    const matchesCategory =
      selectedCategory === 'All' || room.category === selectedCategory;
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery =
      !query ||
      room.name.toLowerCase().includes(query) ||
      room.description.toLowerCase().includes(query) ||
      (room.code && room.code.toLowerCase().includes(query));

    return matchesCategory && matchesQuery;
  });

  return (
    <div className="space-y-6 animate-fade-in max-w-7xl mx-auto">
      {/* Title & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Study Rooms Directory
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Pick a virtual room, settle in, and make progress together in real time.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onJoinCode}
            className="px-4 py-2.5 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
          >
            <KeyRound className="w-3.5 h-3.5 text-primary-500" />
            <span>Join with Code</span>
          </button>

          <button
            onClick={onCreateRoom}
            className="px-4 py-2.5 text-xs font-bold text-white bg-primary-600 hover:bg-primary-700 rounded-xl transition-all shadow-md shadow-primary-500/25 flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Room</span>
          </button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-2.5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by subject, room name, or 6-digit code..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border-none focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
          />
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Room Grid */}
      {filteredRooms.length === 0 ? (
        <EmptyState
          icon={<Users className="w-6 h-6" />}
          title="No study rooms found"
          description={
            searchQuery
              ? `No rooms matched "${searchQuery}". Try a different keyword or create a new room.`
              : 'No study rooms in this category yet. Be the first to host one!'
          }
          action={{
            label: '+ Create Room',
            onClick: onCreateRoom
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredRooms.map((room) => (
            <RoomCard key={room.id} room={room} onEnter={onEnterRoom} />
          ))}
        </div>
      )}
    </div>
  );
};
