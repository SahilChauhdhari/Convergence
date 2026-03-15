import { API_URL, SOCKET_URL } from '../config';
import React, { useState, useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Header from './Header';
import Sidebar from './Sidebar';
import ChatFeed from './ChatFeed';
import MessageInput from './MessageInput';
import UserProfileModal from './UserProfileModal';
import CreateRoomModal from './CreateRoomModal';
import CallModal from './CallModal';
import { User, Message, PowerLog } from '../types';
import { Lock, UserPlus, X, Users, Shield } from 'lucide-react';

interface MainChatProps {
  user: User;
  onLogout: () => void;
}

// Modal for managing members (add/kick)
const ManageMembersModal: React.FC<{
  roomId: number;
  onClose: () => void;
  onAdd: (userId: number) => void;
  onKick: (userId: number) => void;
  members: any[];
}> = ({ roomId, onClose, onAdd, onKick, members }) => {
  const [searchVal, setSearchVal] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #12122a, #0f0f1e)', border: '1px solid rgba(139,92,246,0.25)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6d28d9]/30 flex items-center justify-center">
              <Users size={16} className="text-[#8b5cf6]" />
            </div>
            <h2 className="text-white font-semibold text-base">Manage Members</h2>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Current Members</p>
            <div className="space-y-1 max-h-40 overflow-y-auto sleek-scrollbar">
              {members.length === 0 && <p className="text-slate-500 text-sm">No members found.</p>}
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between bg-[#1a1a2e] rounded-lg px-3 py-2">
                  <span className="text-sm text-slate-200">{m.name || m.username}</span>
                  <button onClick={() => onKick(m.id)} className="text-rose-400 hover:text-rose-300 text-xs font-semibold px-2 py-0.5 rounded hover:bg-rose-500/10 transition-colors">Kick</button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Add User by ID</p>
            <div className="flex gap-2">
              <input
                type="number"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="User ID"
                className="flex-1 bg-[#1a1a2e] border border-slate-700/60 text-slate-200 placeholder-slate-500 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#8b5cf6] transition-all"
              />
              <button
                onClick={() => { if (searchVal) { onAdd(parseInt(searchVal)); setSearchVal(''); } }}
                disabled={!searchVal}
                className="px-4 py-2 text-sm font-semibold text-white bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-40 rounded-lg transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal for renaming a room
const RenameRoomModal: React.FC<{
  roomId: number;
  currentName: string;
  onClose: () => void;
  onRename: (roomId: number, name: string) => void;
}> = ({ roomId, currentName, onClose, onRename }) => {
  const [name, setName] = useState(currentName);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); inputRef.current?.select(); }, []);
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="w-full max-w-sm mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #12122a, #0f0f1e)', border: '1px solid rgba(139,92,246,0.25)' }}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40">
          <h2 className="text-white font-semibold text-base">Rename Channel</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"><X size={18} /></button>
        </div>
        <div className="px-6 py-4">
          <input
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && name.trim()) { onRename(roomId, name.trim()); onClose(); } }}
            className="w-full bg-[#1a1a2e] border border-slate-700/60 text-slate-200 placeholder-slate-500 rounded-lg px-4 py-3 text-sm outline-none focus:border-[#8b5cf6] transition-all"
          />
        </div>
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors">Cancel</button>
          <button
            disabled={!name.trim() || name.trim() === currentName}
            onClick={() => { onRename(roomId, name.trim()); onClose(); }}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-40 rounded-lg transition-colors"
          >
            Rename
          </button>
        </div>
      </div>
    </div>
  );
};

const MainChat: React.FC<MainChatProps> = ({ user, onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [isDnDActive, setIsDnDActive] = useState(false);
  const [isSecurityFreeze, setIsSecurityFreeze] = useState(false);
  const [isEmergencyMode, setIsEmergencyMode] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<number | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const [onlineUsers, setOnlineUsers] = useState<Set<number>>(new Set());
  const [profileUser, setProfileUser] = useState<User | null>(null);
  const [createModal, setCreateModal] = useState<'channel' | 'dm' | null>(null);
  const [showCallModal, setShowCallModal] = useState(false);
  const [manageMembersRoomId, setManageMembersRoomId] = useState<number | null>(null);
  const [manageMembersData, setManageMembersData] = useState<any[]>([]);
  const [renameRoom, setRenameRoom] = useState<{ id: number; name: string } | null>(null);

  const isAdmin = user.role === 'admin' || (user.role_level || 0) >= 50;

  // Initialize Socket.IO and fetch rooms
  useEffect(() => {
    fetchRooms();
    const socket = io('/', {
      auth: { token: localStorage.getItem('token') }
    });
    socketRef.current = socket;

    socket.on('online_users', (userIds: number[]) => {
      setOnlineUsers(new Set(userIds));
    });

    socket.on('user_status', ({ userId, status }: { userId: number, status: string }) => {
      setOnlineUsers(prev => {
        const next = new Set(prev);
        if (status === 'online') next.add(userId);
        else next.delete(userId);
        return next;
      });
    });

    socket.on('new_message', (msg: any) => {
      const formattedMsg: Message = {
        id: msg.id,
        room_id: msg.room_id,
        user_id: msg.user_id,
        user_name: msg.user_name,
        message: msg.message || msg.content,
        created_at: msg.created_at,
        attachments: msg.attachments || []
      };
      
      setMessages((prev) => {
        if (prev.find(m => m.id === formattedMsg.id)) return prev;
        return [...prev, formattedMsg];
      });
    });

    // Handle real-time message deletion
    socket.on('message_deleted', ({ messageId }: { messageId: number }) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
    });

    // Handle real-time room updates
    socket.on('room_updated', (updatedRoom: any) => {
      setRooms(prev => prev.map(r => r.id === updatedRoom.id ? { ...r, name: updatedRoom.name } : r));
    });

    socket.on('room_deleted', ({ roomId }: { roomId: number }) => {
      setRooms(prev => prev.filter(r => r.id !== roomId));
      setSelectedRoomId(prev => prev === roomId ? null : prev);
    });

    return () => {
      socket.off('online_users');
      socket.off('user_status');
      socket.off('new_message');
      socket.off('message_deleted');
      socket.off('room_updated');
      socket.off('room_deleted');
      socket.disconnect();
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(API_URL + '/api/rooms/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(prev => {
          // Preserve recipientName for DMs already in state
          return data.map((room: any) => {
            const existing = prev.find(r => r.id === room.id);
            return existing?.recipientName ? { ...room, recipientName: existing.recipientName } : room;
          });
        });
        if (data.length > 0 && !selectedRoomId) {
          setSelectedRoomId(data[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  // Fetch messages when room changes
  useEffect(() => {
    if (selectedRoomId) {
      fetchMessages(selectedRoomId);
      socketRef.current?.emit('join_room', selectedRoomId.toString());
    }
    return () => {
      if (selectedRoomId) {
        socketRef.current?.emit('leave_room', selectedRoomId.toString());
      }
    };
  }, [selectedRoomId]);

  const fetchMessages = async (roomId: number) => {
    try {
      const response = await fetch(API_URL + `/api/messages/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data.map((m: any) => ({
          id: m.id,
          room_id: m.room_id,
          user_id: m.user_id,
          user_name: m.user_name,
          message: m.message || m.content,
          created_at: m.created_at,
          attachments: m.attachments || []
        })));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || !selectedRoomId) return;

    const content = inputText;
    setInputText('');

    try {
      const response = await fetch(API_URL + `/api/messages/${selectedRoomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        const err = await response.json();
        if (err.error === 'announcements_only_ceo') {
          // Shouldn't happen since we block UI, but handle gracefully
        } else {
          console.error('Failed to send message:', err);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  const handleSendFile = async (file: File) => {
    if (!selectedRoomId) return;
    const formData = new FormData();
    formData.append('file', file);
    if (inputText.trim()) {
      formData.append('content', inputText.trim());
      setInputText('');
    }

    try {
      const response = await fetch(API_URL + `/api/messages/${selectedRoomId}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      if (!response.ok) {
        console.error('Failed to send file:', response);
      }
    } catch (e) {
      console.error('Error sending file:', e);
    }
  };

  const handleStartDm = async (userId: number, recipientName?: string) => {
    try {
      const response = await fetch(API_URL + '/api/rooms/dm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipientId: userId })
      });
      if (response.ok) {
        const room = await response.json();
        const resolvedName = room.recipientName || recipientName;
        // Store DM with recipient name
        setRooms(prev => {
          const exists = prev.find(r => r.id === room.id);
          if (exists) {
            return prev.map(r => r.id === room.id ? { ...r, recipientName: resolvedName } : r);
          }
          return [...prev, { ...room, recipientName: resolvedName }];
        });
        setSelectedRoomId(room.id);
      }
    } catch (e) {
      console.error('Failed to create DM', e);
    }
  };

  // Admin: delete a message
  const handleDeleteMessage = async (messageId: number) => {
    if (!selectedRoomId) return;
    try {
      const res = await fetch(API_URL + `/api/messages/${selectedRoomId}/messages/${messageId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        setMessages(prev => prev.filter(m => m.id !== messageId));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to delete message');
      }
    } catch (e) {
      console.error('Delete message failed:', e);
    }
  };

  // Admin: kick user from current room
  const handleKickUser = async (userId: string | number, roomId: number) => {
    if (!confirm(`Are you sure you want to kick this user from the channel?`)) return;
    try {
      const res = await fetch(API_URL + `/api/rooms/${roomId}/members/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || 'Failed to kick user');
      }
    } catch (e) {
      console.error('Kick user failed:', e);
    }
  };

  // Admin: add user to current room
  const handleAddUser = async (userId: number) => {
    if (!manageMembersRoomId) return;
    try {
      const res = await fetch(API_URL + `/api/rooms/${manageMembersRoomId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ userId })
      });
      if (res.ok) {
        fetchManageMembers(manageMembersRoomId);
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to add user');
      }
    } catch (e) {
      console.error('Add user failed:', e);
    }
  };

  // Admin: rename a room
  const handleRenameRoom = async (roomId: number, name: string) => {
    try {
      const res = await fetch(API_URL + `/api/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ name })
      });
      if (res.ok) {
        const updated = await res.json();
        setRooms(prev => prev.map(r => r.id === roomId ? { ...r, name: updated.name } : r));
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to rename room');
      }
    } catch (e) {
      console.error('Rename room failed:', e);
    }
  };

  const fetchManageMembers = async (roomId: number) => {
    try {
      const res = await fetch(API_URL + `/api/rooms/${roomId}/members`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (res.ok) {
        const data = await res.json();
        setManageMembersData(data);
      }
    } catch (e) {
      console.error('Fetch members failed:', e);
    }
  };

  const openManageMembers = (roomId: number) => {
    setManageMembersRoomId(roomId);
    fetchManageMembers(roomId);
  };

  const activeRoom = rooms.find(r => r.id === selectedRoomId);
  const activeRoomName = activeRoom ? (
    activeRoom.name.startsWith('DM-') 
      ? (activeRoom.recipientName || (() => {
          const otherId = activeRoom.name.replace('DM-', '').split('-').find((id: string) => id !== user.id.toString());
          return otherId ? `User ${otherId}` : activeRoom.name.replace('DM-', '');
        })())
      : activeRoom.name
  ) : undefined;

  // Check if active room is General Announcements
  const isAnnouncementsRoom = !!(activeRoom && activeRoom.name && activeRoom.name.toLowerCase() === 'general-announcements');
  // CEO username check
  const isCeo = user.role === 'admin' && localStorage.getItem('username') === 'Rajesh Sharma';
  // Actually check by stored username from token — we use the user object name
  const isRajeshSharma = user.name === 'Rajesh Sharma';
  const canPostInRoom = !isAnnouncementsRoom || isRajeshSharma;

  return (
    <div className={`flex h-screen aether-chat-bg text-gray-200 transition-colors duration-300 overflow-hidden ${isEmergencyMode ? 'emergency-mode-bg emergency-mode-text' : ''}`}>
      
      {/* Sidebar on the Left */}
      <Sidebar 
        user={user}
        messages={messages}
        rooms={rooms}
        isDnDActive={isDnDActive}
        setIsDnDActive={setIsDnDActive}
        isEmergencyMode={isEmergencyMode}
        setIsEmergencyMode={setIsEmergencyMode}
        selectedRoomId={selectedRoomId}
        onRoomSelect={(id) => setSelectedRoomId(id)}
        onlineUsers={onlineUsers}
        onCreateRoom={() => setCreateModal('channel')}
        onCreateDm={() => setCreateModal('dm')}
        onDeleteRoom={async (roomId: number) => {
          if (!window.confirm('Delete this room? This cannot be undone.')) return;
          try {
            const res = await fetch(API_URL + `/api/rooms/${roomId}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
            });
            if (res.ok) {
              if (selectedRoomId === roomId) setSelectedRoomId(null);
              fetchRooms();
            } else {
              const err = await res.json();
              alert(err.error || 'Failed to delete room');
            }
          } catch (e) {
            console.error(e);
          }
        }}
        onRenameRoom={isAdmin ? (roomId, currentName) => setRenameRoom({ id: roomId, name: currentName }) : undefined}
        onManageMembers={isAdmin ? openManageMembers : undefined}
      />

      {/* Main Content Area on the Right */}
      <div className="flex-1 flex flex-col min-w-0">
        
        {/* Header at the top of the Chat Area */}
        <Header 
          user={user}
          isEmergencyMode={isEmergencyMode}
          isSecurityFreeze={isSecurityFreeze}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          isAdminPanelOpen={isAdminPanelOpen}
          setIsAdminPanelOpen={setIsAdminPanelOpen}
          hasNotifications={messages.length > 5}
          onStartDm={handleStartDm}
          roomName={activeRoomName}
          onProfileClick={(clickedUser) => setProfileUser(clickedUser || user)}
          onCallClick={() => setShowCallModal(true)}
        />

        <div className="flex-1 flex overflow-hidden">
          <main className="flex-1 flex flex-col relative z-0 overflow-hidden">
          <ChatFeed 
            messages={messages.filter(m => (!selectedRoomId || m.room_id === selectedRoomId) && (!searchQuery || m.message.toLowerCase().includes(searchQuery.toLowerCase()) || m.user_name.toLowerCase().includes(searchQuery.toLowerCase())))}
            currentUser={user}
            isDnDActive={isDnDActive}
            onDeleteMessage={handleDeleteMessage}
            onKickUser={handleKickUser}
          />
          
          {selectedRoomId ? (
            <>
              {/* Announcements restriction banner */}
              {isAnnouncementsRoom && !canPostInRoom && (
                <div className="mx-4 mb-3 flex items-center gap-3 px-4 py-3 rounded-xl border"
                  style={{
                    background: 'rgba(109,40,217,0.1)',
                    borderColor: 'rgba(139,92,246,0.3)',
                  }}>
                  <div className="w-8 h-8 rounded-lg bg-[#6d28d9]/30 flex items-center justify-center shrink-0">
                    <Lock size={15} className="text-[#8b5cf6]" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-200">Read-only Channel</p>
                    <p className="text-xs text-slate-400">Only the CEO (Rajesh Sharma) can post here.</p>
                  </div>
                </div>
              )}
              <MessageInput 
                inputText={inputText}
                setInputText={setInputText}
                handleSendMessage={handleSendMessage}
                handleSendFile={handleSendFile}
                isDnDActive={isDnDActive}
                roomName={activeRoomName}
                disabled={!canPostInRoom}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 bg-transparent">
              Select a channel to start collaborating
            </div>
          )}
          </main>

          {/* Feature: Upcoming Event Panel */}
          <aside className="w-[300px] border-l border-[#1a1a2e] bg-transparent hidden xl:flex flex-col p-6 overflow-y-auto shrink-0 z-10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-slate-200">Upcoming Event</h3>
              <button className="text-slate-400 hover:text-white">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="m6 9 6 6 6-6"/></svg>
              </button>
            </div>
            
            <div className="bg-[#1a1a2e] rounded-xl p-5 border border-slate-700/50 shadow-lg">
              <h4 className="font-bold text-white mb-1">Creative Review Meeting</h4>
              <p className="text-xs text-slate-400 mb-4">Today • 3:00 PM</p>
              
              <p className="text-sm text-slate-300 mb-6">Reviewing new campaign assets with the core team.</p>
              
              <div className="flex items-center gap-1 text-xs text-slate-400 mb-4">
                RSVP: 
                <button className="text-[#8b5cf6] font-medium ml-1 hover:underline">Yes</button> | 
                <button className="text-slate-500 ml-1 hover:text-white transition-colors">Maybe</button> | 
                <button className="text-slate-500 ml-1 hover:text-white transition-colors">No</button>
              </div>

              <button className="w-full bg-gradient-to-r from-[#8b5cf6] to-[#6d28d9] hover:from-[#7c3aed] hover:to-[#5b21b6] text-white py-2 rounded-lg text-sm font-medium transition-colors shadow-md">
                View Details
              </button>
            </div>

            {/* Admin Panel quick-info if admin */}
            {isAdmin && (
              <div className="mt-4 bg-[#1a1a2e] rounded-xl p-5 border border-[#6d28d9]/30 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={14} className="text-[#8b5cf6]" />
                  <h4 className="font-bold text-white text-sm">Admin Controls</h4>
                </div>
                <ul className="text-xs text-slate-400 space-y-1.5">
                  <li>• Right-click any message to delete or kick</li>
                  <li>• Right-click any channel to rename or manage</li>
                  <li>• Use + next to Channels to create new ones</li>
                </ul>
              </div>
            )}
          </aside>
        </div>
      </div>

      {profileUser && (
        <UserProfileModal
          user={profileUser}
          onClose={() => setProfileUser(null)}
          onlineUsers={onlineUsers}
          onLogout={profileUser.id === user.id ? onLogout : undefined}
        />
      )}

      {/* Create Room/DM Modal */}
      {createModal && (
        <CreateRoomModal
          mode={createModal}
          onClose={() => setCreateModal(null)}
          onConfirm={async (value) => {
            setCreateModal(null);
            if (createModal === 'channel') {
              try {
                const res = await fetch(API_URL + '/api/rooms', {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                  },
                  body: JSON.stringify({ name: value })
                });
                if (res.ok) fetchRooms();
                else { const e = await res.json(); alert(e.error || 'Failed to create channel'); }
              } catch (e) { console.error(e); }
            } else {
              // DM: search for user by name, then start DM
              try {
                const s = await fetch(API_URL + `/api/auth/search?q=${encodeURIComponent(value)}`, {
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (s.ok) {
                  const users = await s.json();
                  if (users.length > 0) {
                    const recipient = users[0];
                    // Pass recipient's full name so DM shows the real person's name
                    handleStartDm(recipient.id, recipient.name || recipient.username);
                  } else {
                    alert(`User "${value}" not found`);
                  }
                }
              } catch (e) { console.error(e); }
            }
          }}
        />
      )}

      {/* Call / Meeting Modal */}
      {showCallModal && (
        <CallModal
          roomName={activeRoomName || 'General'}
          onClose={() => setShowCallModal(false)}
        />
      )}

      {/* Manage Members Modal */}
      {manageMembersRoomId !== null && (
        <ManageMembersModal
          roomId={manageMembersRoomId}
          onClose={() => { setManageMembersRoomId(null); setManageMembersData([]); }}
          onAdd={handleAddUser}
          onKick={async (userId) => {
            await handleKickUser(userId, manageMembersRoomId);
            fetchManageMembers(manageMembersRoomId);
          }}
          members={manageMembersData}
        />
      )}

      {/* Rename Room Modal */}
      {renameRoom && (
        <RenameRoomModal
          roomId={renameRoom.id}
          currentName={renameRoom.name}
          onClose={() => setRenameRoom(null)}
          onRename={handleRenameRoom}
        />
      )}
    </div>
  );
};

export default MainChat;
