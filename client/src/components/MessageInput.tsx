import React, { useRef, useState } from 'react';
import { Send, Paperclip, X, Smile, Download, AtSign, Plus } from 'lucide-react';

interface MessageInputProps {
  inputText: string;
  setInputText: (text: string) => void;
  handleSendMessage: (e?: React.FormEvent) => void;
  handleSendFile: (file: File) => void;
  isDnDActive: boolean;
  roomName?: string;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({ 
  inputText, setInputText, handleSendMessage, handleSendFile, isDnDActive, roomName, disabled
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const onSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (selectedFile) {
      handleSendFile(selectedFile);
      setSelectedFile(null);
    } else {
      handleSendMessage(e);
    }
  };

  const placeholder = isDnDActive 
    ? "Do Not Disturb active..." 
    : disabled
    ? "This channel is read-only"
    : `Message ${roomName ? '#' + roomName : '...'}`;

  return (
    <div className="p-4 bg-transparent z-10 transition-colors duration-300">
      
      {/* File Preview */}
      {selectedFile && (
        <div className="mb-3 flex items-center gap-3 bg-[#1a1a2e] border border-slate-700 p-2 rounded-lg max-w-sm mx-auto">
          <Paperclip size={16} className="text-[#8b5cf6]" />
          <span className="text-sm text-slate-300 truncate flex-1">{selectedFile.name}</span>
          <button 
            type="button" 
            onClick={() => setSelectedFile(null)}
            className="text-slate-500 hover:text-rose-500 transition-colors"
          >
            <X size={16} />
          </button>
        </div>
      )}

      <form onSubmit={onSubmit} className="flex items-center gap-3 max-w-5xl mx-auto w-full bg-[#1a1a2e]/60 border border-slate-700/50 rounded-full px-4 py-3 shadow-lg focus-within:border-slate-500 transition-colors relative block">
        
        <button title="Emojis" type="button" className="text-slate-400 hover:text-white transition-colors p-1">
           <Smile size={18} />
        </button>

        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              setSelectedFile(e.target.files[0]);
            }
          }}
        />

        <input
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={placeholder}
          disabled={isDnDActive || !!disabled}
          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) onSubmit(); }}
          className={`flex-1 bg-transparent outline-none text-sm text-slate-200 placeholder-slate-500 min-w-0 ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
        />

        {/* Right side icons */}
        <div className="flex items-center gap-1 sm:gap-2">
          <button title="Download" type="button" className="text-slate-400 hover:text-white transition-colors p-1 hidden sm:block">
            <Download size={18} />
          </button>
          
          <button title="Emojis" type="button" className="text-slate-400 hover:text-white transition-colors p-1 hidden sm:block">
            <Smile size={18} />
          </button>

          <button title="Mentions" type="button" className="text-slate-400 hover:text-white transition-colors p-1">
            <AtSign size={18} />
          </button>

          {/* Plus / Attach Button instead of old paperclip */}
          <button 
            title="Attach File"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isDnDActive}
            className="text-slate-400 hover:text-white transition-colors p-1"
          >
            <Plus size={18} />
          </button>

          {/* Hidden send submit to allow "Enter" inside standard input */}
          <button type="submit" className="hidden"></button>
        </div>

      </form>
    </div>
  );
};

export default MessageInput;
