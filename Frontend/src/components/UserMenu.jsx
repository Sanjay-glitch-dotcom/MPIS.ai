import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import { Settings, LogOut, Coffee, Activity, Menu, X } from 'lucide-react';
import { toast } from 'sonner';

export default function UserMenu({ basePath = '' }) {
  const { user, logout, toggleBreak } = useAuthStore();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [isToggling, setIsToggling] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Timer logic for active break
  useEffect(() => {
    let timer;
    if (user?.activity_status === 'ON_BREAK' && user?.active_break_start) {
      const updateTimer = () => {
        const start = new Date(user.active_break_start).getTime();
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      };
      
      updateTimer(); // Initial call
      timer = setInterval(updateTimer, 1000);
    } else {
      setElapsedTime(0);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user?.activity_status, user?.active_break_start]);

  const isOnBreak = user?.activity_status === 'ON_BREAK';
  const showBreakOption = ['ADMIN', 'POLICE', 'SUB_ADMIN', 'SUB_POLICE'].includes(user?.role);

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleToggleBreak = async () => {
    setIsToggling(true);
    const success = await toggleBreak(isOnBreak ? 'end' : 'start');
    if (success) {
      toast.success(isOnBreak ? 'Welcome back! Your break has ended.' : 'You are now on a break.');
      setIsOpen(false);
    } else {
      toast.error('Failed to toggle break status.');
    }
    setIsToggling(false);
  };

  const handleLogout = () => {
    if (window.confirm("Are you sure you want to log out?")) {
      logout();
      navigate('/login');
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 md:p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors border border-transparent focus:outline-none focus:border-white/10 ml-2"
        title="Menu"
      >
        {isOpen ? <X className="w-5 h-5 md:w-6 md:h-6" /> : <Menu className="w-5 h-5 md:w-6 md:h-6" />}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-[#0f172a] border border-white/10 rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] py-1 z-[100] animate-in fade-in slide-in-from-top-2 origin-top-right duration-200">
          
          <Link 
            to={`${basePath}/settings`}
            onClick={() => setIsOpen(false)}
            className="flex items-center px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white transition-colors"
          >
            <Settings className="w-4 h-4 mr-2 text-slate-400" />
            Security Settings
          </Link>

          {showBreakOption && (
            <button 
              onClick={handleToggleBreak}
              disabled={isToggling}
              className={`w-full text-left flex items-center px-3 py-2 text-sm transition-colors ${
                isOnBreak 
                  ? 'text-yellow-400 hover:bg-yellow-500/10' 
                  : 'text-emerald-400 hover:bg-emerald-500/10'
              }`}
            >
              {isOnBreak ? (
                <>
                  <Activity className="w-4 h-4 mr-2 animate-pulse" />
                  <span className="flex-1">End Break</span>
                  <span className="font-mono bg-black/30 px-1 py-0.5 rounded text-[10px]">
                    {formatTime(elapsedTime)}
                  </span>
                </>
              ) : (
                <>
                  <Coffee className="w-4 h-4 mr-2" />
                  Take Break
                </>
              )}
            </button>
          )}

          <div className="h-px bg-white/5 my-1" />

          <button 
            onClick={handleLogout}
            className="w-full text-left flex items-center px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
