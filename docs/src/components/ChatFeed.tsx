import React, { useEffect, useRef, useState } from 'react';
import { X, FileText, AlertCircle, Download, Info } from 'lucide-react';
import { User, Message } from '../types';
import Avatar from './Avatar';
import AdminContextMenu from './AdminContextMenu';

interface ChatFeedProps {
  messages: Message[];
  currentUser: User;
  isDnDActive: boolean;
  onDeleteMessage?: (messageId: number) => void;
  onKickUser?: (userId: string | number, roomId: number) => void;
}

// Helper to highlight @mentions and render newlines
const formatMessageWithTags = (text: string) => {
  if (!text) return null;
  return text.split('\n').map((line, li) => {
    const parts = line.split(/(@\w+)/g);
    return (
      <span key={li}>
        {parts.map((part, i) => {
          if (part.startsWith('@')) {
            return <span key={i} className="text-[#8b5cf6] font-medium bg-[#8b5cf6]/10 px-1 rounded">{part}</span>;
          }
          return <span key={i}>{part}</span>;
        })}
        {li < text.split('\n').length - 1 && <br />}
      </span>
    );
  });
};

// Helper mock role badge based on user name (for Aether demo)
const getMockRoleBadge = (name: string) => {
  if (!name) return null;
  const roles: Record<string, string> = {
    'Arjun': 'Campaign Strategist',
    'Sara': 'Creative Designer',
    'Leo': 'Client Success',
    'Riya': 'AI Engineer',
    'Maya': 'Data Analyst',
    'Dev': 'Lead Engineer',
    'Compliance Officer': 'Compliance',
    'Admin': 'System Admin',
    'Ops Lead': 'Ops Lead',
    'Rajesh': 'CEO',
  };
  const firstName = name.split(' ')[0];
  const role = roles[firstName] || roles[name];
  if (!role) return null;
  return <span className="ml-2 text-[10px] uppercase font-bold tracking-wider text-[#8b5cf6] bg-[#8b5cf6]/10 px-1.5 py-0.5 rounded">{role}</span>;
};

// System command — tiny inline pill, sits in the message flow
const SystemMessage = ({ content }: { content: string }) => {
  const lines = content.split('\n');
  const command = lines[0].trim();
  const output = lines.slice(1).join(' ').trim().replace(/^>\s*/, '');
  return (
    <div className="flex items-start gap-3 px-2 py-0.5 my-0.5 opacity-60 hover:opacity-90 transition-opacity">
      <div className="w-9 shrink-0 flex justify-center pt-0.5">
        <Info size={12} className="text-slate-500" />
      </div>
      <p className="text-[12px] italic text-slate-500 leading-relaxed">
        <span className="font-mono not-italic text-slate-400">{command}</span>
        {output && <span className="ml-2">— {output}</span>}
      </p>
    </div>
  );
};

interface ContextMenuState {
  x: number;
  y: number;
  messageId: number;
  userId: string | number;
  roomId: number;
  text: string;
}

const ChatFeed: React.FC<ChatFeedProps> = ({ messages, currentUser, isDnDActive, onDeleteMessage, onKickUser }) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);

  const isAdmin = currentUser.role === 'admin' || (currentUser.role_level || 0) >= 50;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      messageId: msg.id,
      userId: msg.user_id,
      roomId: msg.room_id,
      text: msg.message,
    });
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-1 scroll-smooth sleek-scrollbar transition-colors duration-300 relative" id="chat-feed">
      
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2">
          <span className="text-4xl">💬</span>
          <span className="text-sm">No messages yet. Be the first!</span>
        </div>
      )}

      {messages.map((msg, idx) => {

        const isCurrentUser = Number(msg.user_id) === Number(currentUser.id);

        // Detect system/command messages by content starting with "/"
        const isCommand = msg.message?.trimStart().startsWith('/');
        
        // Group consecutive messages from same sender
        const prevMsg = messages[idx - 1];
        const isContinuation = prevMsg && 
          prevMsg.user_id === msg.user_id && 
          !isCommand && 
          (new Date(msg.created_at).getTime() - new Date(prevMsg.created_at).getTime()) < 5 * 60 * 1000;

        if (isCommand) {
          return (
            <div key={msg.id}>
              <SystemMessage content={msg.message} />
            </div>
          );
        }

        return (
          <div
            key={msg.id}
            onContextMenu={(e) => handleContextMenu(e, msg)}
            className={`flex gap-3 group px-2 py-0.5 rounded-lg hover:bg-white/5 transition-colors relative ${
              isCurrentUser ? 'flex-row-reverse' : 'flex-row'
            } ${isContinuation ? 'mt-0.5' : 'mt-4'}`}
          >

            {/* Avatar — hide if continuation */}
            <div className={`shrink-0 mt-1 ${isContinuation ? 'opacity-0 w-10' : ''}`}>
              <Avatar src={undefined} fallback={msg.user_name} className="w-9 h-9 rounded-full" />
            </div>

            <div className={`flex flex-col max-w-[70%] min-w-0 ${isCurrentUser ? 'items-end' : 'items-start'}`}>
              
              {/* Name + Role + Timestamp — only on first message in group */}
              {!isContinuation && (
                <div className={`flex items-baseline gap-2 mb-1 ${isCurrentUser ? 'flex-row-reverse' : 'flex-row'}`}>
                  <span className="font-semibold text-sm text-slate-200">{msg.user_name}</span>
                  {getMockRoleBadge(msg.user_name)}
                  <span className="text-[11px] text-slate-500">
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              )}

              {/* Message Bubble */}
              <div
                className={`px-4 py-2 rounded-2xl text-[14px] leading-relaxed whitespace-pre-wrap break-words ${
                  isCurrentUser
                    ? 'bg-[#6d28d9] text-white rounded-br-sm shadow-md'
                    : 'bg-[#1a1a2e] text-slate-200 border border-slate-700/40 rounded-bl-sm'
                }`}
              >
                {formatMessageWithTags(msg.message)}
              </div>

              {/* Attachments UI */}
              {msg.attachments && msg.attachments.length > 0 && (
                <div className="mt-2 grid gap-2">
                  {msg.attachments.map((att, i) => (
                    <div key={i} className="max-w-[280px]">
                      {att.name.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
                        <div className="relative group/att inline-block">
                          <img src={att.name} alt="attachment" className="max-w-full rounded-lg border border-slate-700/50 shadow-sm max-h-64 object-cover" />
                          <button className="absolute top-2 right-2 p-1.5 bg-[#0f0f1e]/80 hover:bg-[#8b5cf6] text-white rounded opacity-0 group-hover/att:opacity-100 transition-all">
                            <Download size={14} />
                          </button>
                        </div>
                      ) : (
                        <a href={att.name} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 bg-[#1a1a2e] border border-slate-700/50 hover:border-[#8b5cf6]/50 p-3 rounded-lg text-sm w-fit min-w-[220px] transition-colors group/file">
                          <div className="flex items-center gap-3 text-slate-300">
                            <div className="bg-[#8b5cf6]/20 p-2 rounded text-[#8b5cf6]">
                              <FileText size={16} />
                            </div>
                            <span className="font-medium truncate max-w-[140px]">{att.name.split('/').pop()}</span>
                          </div>
                          <Download size={16} className="text-slate-500 group-hover/file:text-white transition-colors" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hover Quick Delete (own message or admin) */}
            {(isCurrentUser || isAdmin) && onDeleteMessage && (
              <div className={`absolute top-1 ${isCurrentUser ? 'left-2' : 'right-2'} bg-[#1a1a2e] border border-slate-700/50 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity`}>
                <button
                  onClick={() => onDeleteMessage(msg.id)}
                  className="p-1.5 hover:bg-white/10 text-slate-400 hover:text-rose-400 transition-colors"
                  title="Delete message"
                >
                  <X size={14} />
                </button>
              </div>
            )}

          </div>
        );
      })}

      {/* Notifications Banner */}
      {isDnDActive && (
        <div className="flex justify-center mt-4">
          <div className="bg-rose-500/10 text-rose-400 px-4 py-2 rounded-lg border border-rose-900/50 text-sm font-medium flex items-center gap-2 animate-in fade-in zoom-in duration-300">
            <AlertCircle size={16} />
            Notifications Suppressed
          </div>
        </div>
      )}

      {/* Auto-scroll anchor */}
      <div ref={bottomRef} />

      {/* Right-click Context Menu */}
      {contextMenu && (
        <AdminContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          isAdmin={isAdmin}
          isOwnMessage={Number(contextMenu.userId) === Number(currentUser.id)}
          onClose={() => setContextMenu(null)}
          onDelete={() => {
            if (onDeleteMessage) onDeleteMessage(contextMenu.messageId);
            setContextMenu(null);
          }}
          onKick={() => {
            if (onKickUser) onKickUser(contextMenu.userId, contextMenu.roomId);
            setContextMenu(null);
          }}
          onCopy={() => {
            navigator.clipboard.writeText(contextMenu.text).catch(() => {});
            setContextMenu(null);
          }}
        />
      )}
    </div>
  );
};

export default ChatFeed;
