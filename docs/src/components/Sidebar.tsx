import React, { useState, useRef, useEffect } from 'react';
import { AlertTriangle, ChevronDown, Plus, Hash, FileText, MessageSquare, User as UserIcon, Trash2, Edit2, Users, Settings } from 'lucide-react';
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
  onRenameRoom?: (roomId: number, currentName: string) => void;
  onManageMembers?: (roomId: number) => void;
}

interface ChannelMenu {
  x: number;
  y: number;
  roomId: number;
  roomName: string;
}

const Sidebar: React.FC<SidebarProps> = ({
  user,
  rooms,
  selectedRoomId,
  onRoomSelect,
  onlineUsers,
  onCreateRoom,
  onCreateDm,
  onDeleteRoom,
  onRenameRoom,
  onManageMembers,
  isEmergencyMode,
  setIsEmergencyMode,
}) => {
  const [emergencyOpen, setEmergencyOpen] = useState(true);
  const [channelMenu, setChannelMenu] = useState<ChannelMenu | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const isAdmin = user.role === 'admin' || (user.role_level || 0) >= 50;

  const emergencyRooms = rooms.filter(r => r.name.toLowerCase().includes('failure') || r.name.toLowerCase().includes('crisis'));
  const chatRooms = rooms.filter(r => !r.name.startsWith('DM-') && !emergencyRooms.includes(r));
  const directMessages = rooms.filter(r => r.name.startsWith('DM-'));

  const getChannelIcon = (name: string) => {
    if (name.includes('announcements') || name.includes('requests')) return <MessageSquare size={14} className="opacity-70" />;
    return <FileText size={14} className="opacity-70" />;
  };

  // Dismiss channel right-click menu on outside click
  useEffect(() => {
    if (!channelMenu) return;
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setChannelMenu(null);
      }
    };
    const keyHandler = (e: KeyboardEvent) => { if (e.key === 'Escape') setChannelMenu(null); };
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', keyHandler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', keyHandler);
    };
  }, [channelMenu]);

  const handleChannelContextMenu = (e: React.MouseEvent, room: any) => {
    if (!isAdmin) return;
    e.preventDefault();
    setChannelMenu({
      x: Math.min(e.clientX, window.innerWidth - 200),
      y: Math.min(e.clientY, window.innerHeight - 160),
      roomId: room.id,
      roomName: room.name,
    });
  };

  return (
    <div className={`w-64 bg-[#0f0f1e] border-r border-[#1a1a2e] hidden md:flex flex-col z-10 transition-colors duration-300 h-full text-slate-300 select-none ${isEmergencyMode ? 'emergency-mode-sidebar' : ''}`}>
      
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
            {isAdmin && (
              <button onClick={onCreateRoom} title="Create Channel" className="hover:text-white transition-colors">
                <Plus size={14} />
              </button>
            )}
          </div>
          <div className="space-y-[2px]">
            {chatRooms.map(room => {
              const isActive = selectedRoomId === room.id;
              return (
                <div
                  key={room.id}
                  className="relative group/room flex items-center"
                  onContextMenu={(e) => handleChannelContextMenu(e, room)}
                >
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
                    <span className="truncate">{room.name}</span>
                  </button>
                  {isAdmin && (
                    <button
                      title="Delete channel"
                      onClick={(e) => { e.stopPropagation(); onDeleteRoom(room.id); }}
                      className="absolute right-3 opacity-0 group-hover/room:opacity-100 transition-opacity text-slate-500 hover:text-rose-400 p-1"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
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
              
              // Use recipientName if available, otherwise just use the username of the other person (fallback)
              const displayName = room.recipientName || (otherUserId && onlineUsers.has(parseInt(otherUserId)) ? `User ${otherUserId}` : room.name.replace('DM-', ''));

              return (
                <div
                  key={room.id}
                  className="relative group/room flex items-center"
                >
                  <button
                    onClick={() => onRoomSelect(room.id)}
                    className={`flex-1 w-full text-left px-6 py-2 text-sm transition-all flex items-center justify-between group ${
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
                  <button
                    title="Delete DM"
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

      </div>

      {/* Emergency Protocol Button at the bottom */}
      <div className="p-4 border-t border-[#1a1a2e]">
        <button
          onClick={() => setIsEmergencyMode(!isEmergencyMode)}
          className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition-all ${
            isEmergencyMode 
              ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]' 
              : 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/30'
          }`}
        >
          <AlertTriangle size={16} className={isEmergencyMode ? "animate-pulse" : ""} />
          {isEmergencyMode ? 'EMERGENCY PROTOCOL ACTIVE' : 'ACTIVATE EMERGENCY'}
        </button>
      </div>

      {/* Admin Channel Right-Click Context Menu */}
      {channelMenu && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: channelMenu.x,
            top: channelMenu.y,
            zIndex: 1000,
            background: 'linear-gradient(145deg, #1a1a2e, #12122a)',
            border: '1px solid rgba(139,92,246,0.3)',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)',
          }}
          className="w-52 rounded-xl overflow-hidden"
        >
          {/* Header */}
          <div className="px-4 py-2 border-b border-slate-700/50">
            <p className="text-xs font-semibold text-slate-400 truncate">#{channelMenu.roomName}</p>
          </div>

          {onRenameRoom && (
            <button
              onClick={() => { onRenameRoom(channelMenu.roomId, channelMenu.roomName); setChannelMenu(null); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Edit2 size={14} className="text-slate-400" />
              Rename Channel
            </button>
          )}

          {onManageMembers && (
            <button
              onClick={() => { onManageMembers(channelMenu.roomId); setChannelMenu(null); }}
              className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
            >
              <Users size={14} className="text-slate-400" />
              Manage Members
            </button>
          )}

          <div className="border-t border-slate-700/50 my-0.5" />

          <button
            onClick={() => { onDeleteRoom(channelMenu.roomId); setChannelMenu(null); }}
            className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-rose-400 hover:bg-rose-500/10 hover:text-rose-300 transition-colors"
          >
            <Trash2 size={14} />
            Delete Channel
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
