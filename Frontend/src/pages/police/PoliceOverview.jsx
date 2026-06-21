import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import useAuthStore from '../../store/useAuthStore';
import { Target, AlertTriangle, Users, Clock } from 'lucide-react';

const PoliceOverview = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    activeInvestigations: 0,
    pendingVerifications: 0,
    recentAlerts: 0,
  });
  const [timelineEvents, setTimelineEvents] = useState([]);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const [matchesRes, notifsRes, casesRes, timelineRes] = await Promise.all([
        api.get('/matches/'),
        api.get('/notifications/'),
        api.get('/case-assignments/'),
        api.get('/timeline/')
      ]);
      
      const myCases = casesRes.data.filter(c => c.officer === user?.id);

      setStats({
        activeInvestigations: myCases.length,
        pendingVerifications: matchesRes.data.filter(m => m.status === 'PENDING').length,
        recentAlerts: notifsRes.data.length,
      });
      setTimelineEvents(timelineRes.data.slice(0, 5));
    } catch (err) {
      console.error(err);
    }
  };

  const statCards = [
    { title: 'My Investigations', value: stats.activeInvestigations, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { title: 'Pending Verifications', value: stats.pendingVerifications, icon: Target, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' },
    { title: 'Recent Alerts', value: stats.recentAlerts, icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Command Overview</h1>
        <p className="text-slate-400 font-light mt-1">Real-time status of your assigned investigations.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className={`p-6 rounded-2xl border ${stat.border} bg-[#0f172a]/50 backdrop-blur-sm relative overflow-hidden group hover:border-white/20 transition-all`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} blur-2xl group-hover:scale-150 transition-transform`} />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-slate-400 uppercase tracking-wider">{stat.title}</p>
                <h3 className={`text-4xl font-black mt-2 ${stat.color}`}>{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-xl ${stat.bg} border ${stat.border}`}>
                <stat.icon className={`w-8 h-8 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        <div className="bg-[#0f172a]/50 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
           <h3 className="text-lg font-bold text-white mb-4 flex items-center"><Clock className="w-5 h-5 mr-2 text-blue-400" /> Recent Timeline Events</h3>
           {timelineEvents.length === 0 ? (
             <p className="text-slate-500 font-mono text-sm">No recent timeline events found.</p>
           ) : (
             <div className="space-y-4">
               {timelineEvents.map(event => (
                 <div key={event.id} className="border-l-2 border-blue-500/30 pl-4 py-1">
                   <p className="text-xs font-mono text-slate-500 mb-1">{new Date(event.date).toLocaleString()}</p>
                   <p className="text-sm font-bold text-blue-400">{event.event_type}</p>
                   <p className="text-sm text-slate-300">{event.description}</p>
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
};

export default PoliceOverview;
