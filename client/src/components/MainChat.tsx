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

interface MainChatProps {
  user: User;
  onLogout: () => void;
}

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

    return () => {
      socket.disconnect();
    };
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch('/api/rooms/my', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRooms(data);
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
      const response = await fetch(`/api/messages/${roomId}`, {
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
    setInputText(''); // Clear early for better UX

    try {
      const response = await fetch(`/api/messages/${selectedRoomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content }),
      });

      if (!response.ok) {
        console.error('Failed to send message:', response);
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
      const response = await fetch(`/api/messages/${selectedRoomId}/upload`, {
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

  const handleStartDm = async (userId: number) => {
    try {
      const response = await fetch('/api/rooms/dm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ recipientId: userId })
      });
      if (response.ok) {
        const room = await response.json();
        // Option 1: fetchRooms() will eventually get it, but we can optimistically update
        await fetchRooms();
        setSelectedRoomId(room.id);
      }
    } catch (e) {
      console.error('Failed to create DM', e);
    }
  };

  const activeRoom = rooms.find(r => r.id === selectedRoomId);
  const activeRoomName = activeRoom ? (
    activeRoom.name.startsWith('DM-') 
      ? activeRoom.name.replace('DM-', 'Chat ') 
      : activeRoom.name
  ) : undefined;

  return (
    <div className="flex h-screen aether-chat-bg text-gray-200 transition-colors duration-300 overflow-hidden">
      
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
            const res = await fetch(`/api/rooms/${roomId}`, {
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
          />
          
          {selectedRoomId ? (
            <MessageInput 
              inputText={inputText}
              setInputText={setInputText}
              handleSendMessage={handleSendMessage}
              handleSendFile={handleSendFile}
              isDnDActive={isDnDActive}
              roomName={activeRoomName}
            />
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
          </aside>
        </div>
      </div>

      {profileUser && (
        <UserProfileModal 
          user={profileUser} 
          onClose={() => setProfileUser(null)} 
          onlineUsers={onlineUsers} 
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
                const res = await fetch('/api/rooms', {
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
              // DM: search for user then start DM
              try {
                const s = await fetch(`/api/users/search?q=${encodeURIComponent(value)}`, {
                  headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
                });
                if (s.ok) {
                  const users = await s.json();
                  if (users.length > 0) handleStartDm(users[0].id);
                  else alert(`User "${value}" not found`);
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
    </div>
  );
};

export default MainChat;
