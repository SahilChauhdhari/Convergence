import React, { useState, useEffect, useRef } from 'react';
import { X, Hash, User } from 'lucide-react';

interface CreateRoomModalProps {
  mode: 'channel' | 'dm';
  onClose: () => void;
  onConfirm: (value: string) => void;
}

const CreateRoomModal: React.FC<CreateRoomModalProps> = ({ mode, onClose, onConfirm }) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const isChannel = mode === 'channel';

  return (
    /* Backdrop */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-md mx-4 rounded-xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #12122a, #0f0f1e)',
          border: '1px solid rgba(139,92,246,0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700/40">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#6d28d9]/30 flex items-center justify-center">
              {isChannel ? <Hash size={16} className="text-[#8b5cf6]" /> : <User size={16} className="text-[#8b5cf6]" />}
            </div>
            <h2 className="text-white font-semibold text-base">
              {isChannel ? 'Create New Channel' : 'Start Direct Message'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            {isChannel ? 'Channel Name' : 'Username or Email'}
          </label>
          <div className="relative flex items-center">
            {isChannel && (
              <span className="absolute left-3 text-slate-500 font-mono text-sm select-none">#</span>
            )}
            <input
              ref={inputRef}
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && value.trim()) { onConfirm(value.trim()); } }}
              placeholder={isChannel ? 'e.g. design-team' : 'e.g. sara.designer'}
              className={`w-full bg-[#1a1a2e] border border-slate-700/60 text-slate-200 placeholder-slate-500 rounded-lg py-3 text-sm outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/15 transition-all ${isChannel ? 'pl-8 pr-4' : 'px-4'}`}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            {isChannel
              ? 'Channels are where your team communicates. Keep names short and topic-focused.'
              : 'Start a private conversation with another team member.'}
          </p>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 px-6 pb-5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white rounded-lg hover:bg-white/5 transition-colors"
          >
            Cancel
          </button>
          <button
            disabled={!value.trim()}
            onClick={() => value.trim() && onConfirm(value.trim())}
            className="px-5 py-2 text-sm font-semibold text-white bg-[#6d28d9] hover:bg-[#7c3aed] disabled:opacity-40 disabled:cursor-not-allowed rounded-lg transition-colors shadow-lg shadow-purple-900/30"
          >
            {isChannel ? 'Create Channel' : 'Start Chat'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateRoomModal;
