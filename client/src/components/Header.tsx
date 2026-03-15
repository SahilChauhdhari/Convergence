import { API_URL, SOCKET_URL } from '../config';
import React from 'react';
import { 
  Search, Bell, Mic, Hash, ChevronDown, Video
} from 'lucide-react';
import Avatar from './Avatar';
import { User } from '../types';

interface HeaderProps {
  user: User;
  isEmergencyMode: boolean;
  isSecurityFreeze: boolean;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  setIsAdminPanelOpen: (isOpen: boolean) => void;
  isAdminPanelOpen: boolean;
  hasNotifications: boolean;
  onStartDm?: (userId: number) => void;
  roomName?: string;
  onProfileClick?: (user?: User) => void;
  onCallClick?: () => void;
}

const Header: React.FC<HeaderProps> = ({ 
  user, searchQuery, setSearchQuery, hasNotifications, onStartDm, roomName, onProfileClick, onCallClick
}) => {
  const [searchResults, setSearchResults] = React.useState<any[]>([]);

  // Hardcoded profiles — always available as fallback
  // You can search for "Sara" or "Arjun" and they will appear
  const HARDCODED_PROFILES = [
    { id: 26, username: 'sara.designer',    name: 'Sara',  role: 'Creative Designer',        department: 'Creative Design',    email: 'sara@aether.in' },
    { id: 27, username: 'arjun.strategist', name: 'Arjun', role: 'Campaign Strategist',       department: 'Campaign Strategy',  email: 'arjun@aether.in' },
  ];

  React.useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const q = searchQuery.toLowerCase();

    // Always include hardcoded profiles if they match
    const hardcodedMatches = HARDCODED_PROFILES.filter(
      p => p.name.toLowerCase().includes(q) || p.username.toLowerCase().includes(q)
    );

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(API_URL + `/api/users/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (res.ok) {
          const data = await res.json();
          // Merge live results with hardcoded, dedup by username
          const combined = [
            ...hardcodedMatches,
            ...data.filter((d: any) => !hardcodedMatches.find(h => h.username === d.username))
          ];
          setSearchResults(combined);
        } else {
          setSearchResults(hardcodedMatches);
        }
      } catch (e) {
        setSearchResults(hardcodedMatches);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <header className="h-16 flex items-center justify-between px-6 z-20 relative transition-colors duration-300">
      
      {/* Left side: Room Name + Call button */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-white font-semibold text-lg cursor-pointer hover:bg-white/5 px-2 py-1 rounded">
          {roomName ? (
            <>
              {roomName}
              <ChevronDown size={14} className="text-slate-400 ml-1" />
            </>
          ) : (
            <span className="text-slate-400 text-sm font-normal">Select a channel</span>
          )}
        </div>
        {roomName && (
          <button
            onClick={onCallClick}
            title="Start a call or meeting"
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-[#6d28d9]/20 hover:bg-[#6d28d9]/40 text-[#a78bfa] hover:text-white border border-[#6d28d9]/30 hover:border-[#8b5cf6]/50 transition-all"
          >
            <Video size={13} />
            <span>Call</span>
          </button>
        )}
      </div>

      {/* Center: Search Bar */}
      <div className="hidden md:flex relative flex-1 max-w-xl mx-8 z-50">
        <label className="w-full relative flex items-center group">
          <Search size={16} className="absolute left-3 text-slate-400 group-focus-within:text-white" />
          <input
            type="text"
            placeholder="Search"
            className="w-full bg-[#1a1a2e]/60 hover:bg-[#1a1a2e]/80 focus:bg-[#1a1a2e] border border-transparent focus:border-slate-700/50 rounded-md py-1.5 pl-9 pr-4 text-sm text-slate-200 placeholder-slate-400 outline-none transition-all shadow-[inset_0_1px_4px_rgba(0,0,0,0.1)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </label>
        
        {/* Live Search Dropdown */}
        {searchQuery.trim() && (
          <div className="absolute top-10 left-0 w-full bg-[#0f0f1e] shadow-2xl rounded-lg py-2 border border-[#1a1a2e] text-slate-300">
            {searchResults.length > 0 ? (
              searchResults.map(result => (
                <button 
                  key={result.id}
                  onClick={() => {
                    if (onProfileClick) onProfileClick(result);
                    setSearchQuery('');
                    setSearchResults([]);
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-[#1a1a2e] flex items-center gap-3"
                >
                  <Avatar fallback={result.name} className="w-6 h-6 rounded-full" />
                  <div>
                    <div className="text-sm font-medium text-white">{result.name}</div>
                    <div className="text-xs text-slate-400">@{result.username}</div>
                  </div>
                </button>
              ))
            ) : (
              <div className="px-4 py-3 text-sm text-slate-400 text-center">
                User not found
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right Icons: Mic, Bell, Profile */}
      <div className="flex items-center gap-4 shrink-0">
        
        {/* Voice/Mic */}
        <button title="Start Voice Call" className="text-slate-400 hover:text-white transition-colors relative">
          <Mic size={18} />
        </button>

        {/* Notifications */}
        <button title="Notifications" className="text-slate-400 hover:text-white transition-colors relative">
          <Bell size={18} />
          {hasNotifications && (
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-[#15152a]"></span>
          )}
        </button>

        {/* User Profile */}
        <button 
          title="Your Profile"
          onClick={() => onProfileClick && onProfileClick(user)}
          className="flex items-center gap-2 hover:bg-white/5 py-1 px-2 rounded -mr-2 transition-colors"
        >
          <Avatar src={user.avatar} fallback={user.name} className="w-7 h-7 rounded-sm" />
          <span className="text-sm text-slate-200 font-medium hidden sm:block">
            {user.name.split(' ')[0]} {/* Example: 'Dev' */}
          </span>
          <ChevronDown size={14} className="text-slate-400" />
        </button>

      </div>
    </header>
  );
};

export default Header;
