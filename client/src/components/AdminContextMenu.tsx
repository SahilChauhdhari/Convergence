import React, { useEffect, useRef } from 'react';
import { Trash2, UserX, Copy } from 'lucide-react';

interface AdminContextMenuProps {
  x: number;
  y: number;
  isAdmin: boolean;
  isOwnMessage: boolean;
  onClose: () => void;
  onDelete: () => void;
  onKick: () => void;
  onCopy: () => void;
}

const AdminContextMenu: React.FC<AdminContextMenuProps> = ({
  x, y, isAdmin, isOwnMessage, onClose, onDelete, onKick, onCopy
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust position so menu doesn't go off-screen
  const left = Math.min(x, window.innerWidth - 220);
  const top = Math.min(y, window.innerHeight - 200);

  const itemClass = "flex items-center gap-3 w-full px-4 py-2.5 text-sm text-left transition-colors";

  return (
    <div
      ref={menuRef}
      style={{
        position: 'fixed',
        left,
        top,
        zIndex: 1000,
        background: 'linear-gradient(145deg, #1a1a2e, #12122a)',
        border: '1px solid rgba(139,92,246,0.3)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(139,92,246,0.1)',
      }}
      className="w-52 rounded-xl overflow-hidden"
    >
      {/* Copy Text - available to everyone */}
      <button
        onClick={() => { onCopy(); onClose(); }}
        className={`${itemClass} text-slate-300 hover:bg-white/5 hover:text-white`}
      >
        <Copy size={15} className="text-slate-400" />
        Copy Text
      </button>

      {/* Admin-only section */}
      {(isAdmin || isOwnMessage) && (
        <>
          <div className="border-t border-slate-700/50 my-0.5" />

          <button
            onClick={() => { onDelete(); onClose(); }}
            className={`${itemClass} text-rose-400 hover:bg-rose-500/10 hover:text-rose-300`}
          >
            <Trash2 size={15} />
            Delete Message
          </button>

          {isAdmin && (
            <button
              onClick={() => { onKick(); onClose(); }}
              className={`${itemClass} text-orange-400 hover:bg-orange-500/10 hover:text-orange-300`}
            >
              <UserX size={15} />
              Kick from Room
            </button>
          )}
        </>
      )}
    </div>
  );
};

export default AdminContextMenu;
