import React, { useState } from 'react';
import { AlertTriangle, ChevronDown, Plus, Hash, FileText, MessageSquare, User as UserIcon, Trash2 } from 'lucide-react';
import { User, Message } from '../types';
import Avatar from './Avatar';

interface SidebarProps {
  user: User;
  messages: Message[];
  rooms: any[];
  isDnDActive: boolean;
  setIsDnDActive: (active: boolean) => void;
  isEmergencyMode: boolean;
  setIsEmergencyMode: (active: boolean) => void;
  selectedRoomId: number | null;
  onRoomSelect: (roomId: number) => void;
  onlineUsers: Set<number>;
  onCreateRoom: () => void;
  onCreateDm: () => void;
  onDeleteRoom: (roomId: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  rooms,
  selectedRoomId,
  onRoomSelect,
  onlineUsers,
  onCreateRoom,
  onCreateDm,
  onDeleteRoom
}) => {
  const [emergencyOpen, setEmergencyOpen] = useState(true);

  const emergencyRooms = rooms.filter(r => r.name.toLowerCase().includes('failure') || r.name.toLowerCase().includes('crisis'));
  const chatRooms = rooms.filter(r => !r.name.startsWith('DM-') && !emergencyRooms.includes(r));
  const directMessages = rooms.filter(r => r.name.startsWith('DM-'));

  const getChannelIcon = (name: string) => {
    if (name.includes('announcements') || name.includes('requests')) return <MessageSquare size={14} className="opacity-70" />;
    return <FileText size={14} className="opacity-70" />;
  };

  return (
    <div className="w-64 bg-[#0f0f1e] border-r border-[#1a1a2e] hidden md:flex flex-col z-10 transition-colors duration-300 h-full text-slate-300 select-none">
      
      {/* Branding */}
      <div className="p-6 flex items-center gap-3">
        {/* Custom 'A' logo for Aether Impact */}
        <div className="w-8 h-8 rounded shrink-0 bg-gradient-to-br from-[#8b5cf6] to-[#4c1d95] flex items-center justify-center font-bold text-white shadow-lg">
          A
        </div>
        <h1 className="text-[#e2e8f0] font-bold tracking-widest text-sm uppercase">Aether Impact</h1>
      </div>

      <div className="flex-1 overflow-y-auto mt-2 pb-6 sleek-scrollbar space-y-6">
        
        {/* Channels Section */}
        <div>
          <div className="flex items-center justify-between px-6 mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wider group cursor-pointer">
            <div className="flex items-center gap-2">
              <MessageSquare size={14} />
              Channels
            </div>
            <button onClick={onCreateRoom} title="Create Channel" className="hover:text-white transition-colors">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-[2px]">
            {chatRooms.map(room => {
              const isActive = selectedRoomId === room.id;
              return (
                <div key={room.id} className="relative group/room flex items-center">
                  <button
                    onClick={() => onRoomSelect(room.id)}
                    className={`flex-1 text-left px-6 py-2 text-sm transition-all flex items-center gap-3 ${
                      isActive
                        ? 'bg-[#5b21b6] text-white font-medium'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1a2e]'
                    }`}
                  >
                    {isActive && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r"></div>
                    )}
                    {isActive ? <Plus size={14} className="bg-white/20 rounded-sm p-0.5" /> : getChannelIcon(room.name)}
                    {room.name}
                  </button>
                  <button
                    title="Delete channel"
                    onClick={(e) => { e.stopPropagation(); onDeleteRoom(room.id); }}
                    className="absolute right-3 opacity-0 group-hover/room:opacity-100 transition-opacity text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* Emergency Section */}
        {emergencyRooms.length > 0 && (
          <div>
            <div 
              onClick={() => setEmergencyOpen(!emergencyOpen)}
              className="flex items-center justify-between px-6 mb-2 text-xs font-semibold text-rose-500 uppercase tracking-wider group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle size={14} />
                EMERGENCY
              </div>
              <ChevronDown size={14} className={`transform transition-transform ${emergencyOpen ? '' : '-rotate-90'}`} />
            </div>
            
            {emergencyOpen && (
              <div className="space-y-[2px]">
                {emergencyRooms.map(room => (
                  <button
                    key={room.id}
                    onClick={() => onRoomSelect(room.id)}
                    className={`w-full text-left px-6 py-2 text-sm transition-all flex items-center gap-3 relative ${
                      selectedRoomId === room.id
                        ? 'bg-rose-900/40 text-rose-200 border-l border-rose-500'
                        : 'text-rose-400/70 hover:text-rose-300 hover:bg-rose-900/20'
                    }`}
                  >
                    <AlertTriangle size={12} className="opacity-50" />
                    {room.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Direct Messages Section */}
        <div>
          <div className="flex items-center justify-between px-6 mb-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <div className="flex items-center gap-2">
              <UserIcon size={14} className="opacity-70" />
              Direct Messages
            </div>
            <button onClick={onCreateDm} title="New Direct Message" className="hover:text-white transition-colors">
              <Plus size={14} />
            </button>
          </div>
          <div className="space-y-1">
            
            {/* Self / You Entry */}
            <div className="w-full text-left px-6 py-2 text-sm flex items-center justify-between group cursor-pointer hover:bg-[#1a1a2e]">
              <div className="flex items-center gap-3 text-slate-300">
                <Avatar src={undefined} fallback={user.name} className="w-6 h-6 rounded-full" />
                <span className="truncate">{user.name} (you)</span>
              </div>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
            </div>

            {/* Other DMs */}
            {directMessages.map(room => {
              const ids = room.name.replace('DM-', '').split('-');
              const otherUserId = ids.find((id: string) => id !== user.id.toString());
              const isOnline = otherUserId && onlineUsers.has(parseInt(otherUserId));
              
              const displayName = room.name.replace('DM-', 'Chat ');

              return (
                <button
                  key={room.id}
                  onClick={() => onRoomSelect(room.id)}
                  className={`w-full text-left px-6 py-2 text-sm transition-all flex items-center justify-between group ${
                    selectedRoomId === room.id
                      ? 'bg-[#1a1a2e] text-white'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-[#1a1a2e]'
                  }`}
                >
                  <div className="flex items-center gap-3 max-w-[80%]">
                    <Avatar src={undefined} fallback={displayName} className="w-6 h-6 rounded-full" />
                    <span className="truncate">{displayName}</span>
                  </div>
                  {isOnline && (
                    <div className="w-2 h-2 rounded-full bg-emerald-500/80"></div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
};

export default Sidebar;
