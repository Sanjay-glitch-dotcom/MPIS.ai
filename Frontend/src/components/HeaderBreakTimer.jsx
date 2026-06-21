import React, { useEffect, useState } from 'react';
import useAuthStore from '../store/useAuthStore';
import { Activity } from 'lucide-react';

export default function HeaderBreakTimer() {
  const { user } = useAuthStore();
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    let timer;
    if (user?.activity_status === 'ON_BREAK' && user?.active_break_start) {
      const updateTimer = () => {
        const start = new Date(user.active_break_start).getTime();
        const now = new Date().getTime();
        setElapsedTime(Math.floor((now - start) / 1000));
      };
      
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    } else {
      setElapsedTime(0);
    }
    
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [user?.activity_status, user?.active_break_start]);

  if (user?.activity_status !== 'ON_BREAK') return null;

  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="hidden sm:flex items-center space-x-2 bg-yellow-500/10 text-yellow-400 px-3 py-1.5 rounded-full border border-yellow-500/20 ml-4 animate-in fade-in zoom-in duration-300">
      <Activity className="w-4 h-4 animate-pulse" />
      <span className="text-xs font-bold uppercase tracking-wider">On Break</span>
      <span className="font-mono text-sm font-bold bg-black/40 px-1.5 py-0.5 rounded shadow-inner text-yellow-300">
        {formatTime(elapsedTime)}
      </span>
    </div>
  );
}
