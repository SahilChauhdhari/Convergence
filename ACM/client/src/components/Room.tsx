import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { io, Socket } from 'socket.io-client';

interface Message {
  id: number;
  room_id: number;
  user_name: string;
  message: string;
  created_at: string;
}

const Room: React.FC = () => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const navigate = useNavigate();
  const { roomId } = useParams<{ roomId: string }>();

  useEffect(() => {
    fetchMessages();

    // Initialize socket connection
    const socket = io('/', {
      auth: { token: localStorage.getItem('token') } // If backend used token
    });
    
    // Assign username to socket.data or similar logic if needed
    // The backend uses `socket.data.username` but we can't easily set that directly from client without passing it in handshake
    // Let's rely on standard events
    
    socketRef.current = socket;

    if (roomId) {
      socket.emit('join_room', roomId);
    }

    socket.on('new_message', (msg: any) => {
      setMessages((prev) => {
        // Prevent duplicate messages if REST already fetched it or self-sent
        if (prev.find(m => m.id === msg.id)) return prev;
        return [...prev, {
          id: msg.id,
          room_id: msg.room_id,
          user_name: msg.user_name || localStorage.getItem('username'), // fallback
          message: msg.content,
          created_at: msg.created_at
        }];
      });
    });

    return () => {
      if (roomId) {
        socket.emit('leave_room', roomId);
      }
      socket.disconnect();
    };
  }, [roomId]);

  const fetchMessages = async () => {
    if (!roomId) return;

    try {
      const response = await fetch(`/api/messages/${roomId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(data);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!roomId || !message.trim()) return;

    try {
      const response = await fetch(`/api/messages/${roomId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ content: message }),
      });

      if (response.ok) {
        // Emit via socket for real-time to others
        socketRef.current?.emit('send_message', { roomId, content: message });
        
        fetchMessages();
        setMessage('');
      } else {
        alert('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between w-full">
          <button
            onClick={() => navigate('/')}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xl font-bold text-gray-800">#</span>
            <span className="text-lg text-gray-600 capitalize">Room {roomId}</span>
            <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
              {messages.length} messages
            </span>
          </div>

          <div className="w-10"></div>
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 max-w-4xl mx-auto px-4 py-6 w-full overflow-y-auto">
        {loading ? (
          <div className="text-center py-12">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            This room is quiet. Be the first to say hello!
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map(msg => (
              <div
                key={msg.id}
                className={`flex ${msg.user_name === localStorage.getItem('username') ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[70%] rounded-2xl px-4 py-3 shadow-sm ${
                    msg.user_name === localStorage.getItem('username')
                      ? 'bg-indigo-600 text-white'
                      : 'bg-white text-gray-900 border border-gray-200'
                  }`}
                >
                  <p className="text-xs font-bold mb-1 opacity-75">{msg.user_name}</p>
                  <div className="whitespace-pre-wrap text-sm">
                    {msg.message}
                  </div>
                  <p className="text-[10px] mt-1 opacity-50 text-right">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Input Area */}
      <div className="bg-white border-t p-4">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-indigo-500 transition-colors"
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors shadow-lg"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Room;