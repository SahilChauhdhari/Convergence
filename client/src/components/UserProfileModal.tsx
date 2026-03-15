import React from 'react';
import { User as UserType } from '../types';
import Avatar from './Avatar';
import { Mail, Briefcase, Calendar, Clock, X, LogOut } from 'lucide-react';

interface UserProfileModalProps {
  user: UserType | null;
  onClose: () => void;
  onlineUsers: Set<number>;
  onLogout?: () => void;
}

// Mock extra fields required by the user's prompt (Department and Joined Since)
const getMockDetails = (name: string) => {
  const departments: Record<string, string> = {
    'Arjun': 'Marketing',
    'Sara': 'Design',
    'Leo': 'Client Success',
    'Riya': 'Engineering',
    'Maya': 'Operations',
    'Dev': 'Administration'
  };
  
  const joinedDates: Record<string, string> = {
    'Arjun': 'March 2021',
    'Sara': 'June 2022',
    'Leo': 'January 2020',
    'Riya': 'November 2023',
    'Maya': 'August 2019',
    'Dev': 'Founded'
  };

  return {
    department: departments[name] || 'General',
    joinedSince: joinedDates[name] || 'Unknown'
  };
};

const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose, onlineUsers, onLogout }) => {
  if (!user) return null;

  const isOnline = onlineUsers.has(Number(user.id));
  const details = getMockDetails(user.name);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div 
        className="bg-[#0f0f1e] border border-slate-700/50 w-full max-w-sm rounded-xl shadow-2xl overflow-hidden relative"
        onClick={e => e.stopPropagation()}
      >
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 bg-[#1a1a2e]/50 rounded-full p-1 backdrop-blur-md">
          <X size={18} />
        </button>

        <div className="h-24 bg-gradient-to-r from-[#4c1d95] to-[#8b5cf6] relative">
          <div className="absolute -bottom-10 left-6">
            <div className="relative">
              <Avatar src={user.avatar} fallback={user.name} className="w-20 h-20 rounded-full border-4 border-[#0f0f1e] shadow-lg" />
              <div className={`absolute bottom-1 right-1 w-4 h-4 rounded-full border-2 border-[#0f0f1e] ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
            </div>
          </div>
        </div>

        <div className="pt-14 pb-6 px-6">
          <h2 className="text-xl font-bold text-white mb-1">{user.name}</h2>
          <p className="text-sm font-medium text-[#8b5cf6] mb-4 bg-[#8b5cf6]/10 w-fit px-2 py-0.5 rounded capitalize">{user.role}</p>

          <div className="space-y-4 text-sm text-slate-300">
            <div className="flex items-center gap-3 bg-[#1a1a2e]/50 p-2.5 rounded-lg border border-white/5">
              <Mail size={16} className="text-slate-500" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium">Email</p>
                <p>{user.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 bg-[#1a1a2e]/50 p-2.5 rounded-lg border border-white/5">
              <Briefcase size={16} className="text-slate-500" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium">Department</p>
                <p>{details.department}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#1a1a2e]/50 p-2.5 rounded-lg border border-white/5">
              <Calendar size={16} className="text-slate-500" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium">Joined Since</p>
                <p>{details.joinedSince}</p>
              </div>
            </div>

            <div className="flex items-center gap-3 bg-[#1a1a2e]/50 p-2.5 rounded-lg border border-white/5 border-l-2 border-l-emerald-500">
              <Clock size={16} className="text-slate-500" />
              <div className="flex-1">
                <p className="text-xs text-slate-500 font-medium">Current Status</p>
                <p className={isOnline ? 'text-emerald-400 font-medium' : 'text-slate-400'}>
                  {isOnline ? 'Online' : 'Offline'}
                </p>
              </div>
            </div>
          </div>

          {onLogout && (
            <button
              onClick={onLogout}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 py-2.5 rounded-lg transition-colors border border-rose-500/20 font-medium"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfileModal;
