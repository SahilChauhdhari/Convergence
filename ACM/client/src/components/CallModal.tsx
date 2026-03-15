import React, { useEffect } from 'react';
import { X, Video, Phone, Calendar, Copy, Check } from 'lucide-react';

interface CallModalProps {
  roomName: string;
  onClose: () => void;
}

const CallModal: React.FC<CallModalProps> = ({ roomName, onClose }) => {
  const [copied, setCopied] = React.useState(false);
  const meetingLink = `https://meet.aether.im/${roomName.toLowerCase().replace(/\s+/g, '-')}-${Math.random().toString(36).slice(2, 7)}`;

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const copyLink = () => {
    navigator.clipboard.writeText(meetingLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-sm mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{
          background: 'linear-gradient(145deg, #12122a, #0f0f1e)',
          border: '1px solid rgba(139,92,246,0.25)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-700/40">
          <h2 className="text-white font-semibold text-sm">Start a call or meeting</h2>
          <button onClick={onClose} className="text-slate-500 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="px-5 py-5 space-y-3">
          {/* Channel name */}
          <p className="text-xs text-slate-400 mb-1">
            Channel: <span className="text-slate-200 font-medium">{roomName}</span>
          </p>

          {/* Voice Call */}
          <button
            onClick={onClose}
            className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-[#1a1a2e] hover:bg-[#1e1e38] border border-slate-700/40 hover:border-[#8b5cf6]/40 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center group-hover:bg-emerald-500/20 transition-colors">
              <Phone size={18} className="text-emerald-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-200">Start Voice Call</div>
              <div className="text-xs text-slate-500">Invite channel members to a call</div>
            </div>
          </button>

          {/* Video Call */}
          <button
            onClick={onClose}
            className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-[#1a1a2e] hover:bg-[#1e1e38] border border-slate-700/40 hover:border-[#8b5cf6]/40 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#8b5cf6]/10 flex items-center justify-center group-hover:bg-[#8b5cf6]/20 transition-colors">
              <Video size={18} className="text-[#8b5cf6]" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-200">Start Video Meeting</div>
              <div className="text-xs text-slate-500">Face-to-face video conference</div>
            </div>
          </button>

          {/* Schedule Meeting */}
          <button
            onClick={onClose}
            className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-[#1a1a2e] hover:bg-[#1e1e38] border border-slate-700/40 hover:border-[#8b5cf6]/40 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center group-hover:bg-amber-500/20 transition-colors">
              <Calendar size={18} className="text-amber-400" />
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-slate-200">Schedule Meeting</div>
              <div className="text-xs text-slate-500">Send a calendar invite to this channel</div>
            </div>
          </button>

          {/* Meeting link */}
          <div className="pt-2">
            <p className="text-[11px] text-slate-500 mb-1.5">Or share meeting link</p>
            <div className="flex items-center gap-2 bg-[#1a1a2e] border border-slate-700/40 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-400 truncate flex-1">{meetingLink}</span>
              <button
                onClick={copyLink}
                className="shrink-0 text-slate-500 hover:text-white transition-colors"
                title="Copy link"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CallModal;
