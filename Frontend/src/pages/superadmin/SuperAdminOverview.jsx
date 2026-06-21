import React, { useState, useEffect } from 'react';
import api from '../../lib/api';
import { Server, Users, ShieldAlert, Activity, KeyRound, UserPlus, Power, Trash2, Edit } from 'lucide-react';

const SuperAdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(true);

  useEffect(() => {
    fetchStats();
    
    const interval = setInterval(() => {
      fetchStats();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const [{ data: statsData }, { data: logsData }] = await Promise.all([
        api.get('/admin/analytics/'),
        api.get('/audit-logs/')
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingLogs(false);
    }
  };

  const getActionIcon = (action) => {
    if (action.includes('PASSWORD')) return <KeyRound className="w-4 h-4 text-orange-400" />;
    if (action.includes('CREATE')) return <UserPlus className="w-4 h-4 text-blue-400" />;
    if (action.includes('DELETE')) return <Trash2 className="w-4 h-4 text-red-500" />;
    if (action.includes('SUSPEND') || action.includes('ACTIVATE')) return <Power className="w-4 h-4 text-emerald-400" />;
    if (action.includes('LOCK')) return <ShieldAlert className="w-4 h-4 text-red-500" />;
    if (action.includes('UPDATE')) return <Edit className="w-4 h-4 text-blue-400" />;
    return <Activity className="w-4 h-4 text-purple-400" />;
  };

  const getActionColor = (action) => {
    if (action.includes('DELETE') || action.includes('LOCK') || action.includes('SUSPEND')) return 'text-red-400 bg-red-500/10 border-red-500/30';
    if (action.includes('ACTIVATE')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
    if (action.includes('PASSWORD')) return 'text-orange-400 bg-orange-500/10 border-orange-500/30';
    if (action.includes('CREATE')) return 'text-blue-400 bg-blue-500/10 border-blue-500/30';
    return 'text-purple-400 bg-purple-500/10 border-purple-500/30';
  };

  if (!stats) return <div className="text-purple-500 font-mono animate-pulse">Initializing Root Diagnostics...</div>;

  const statCards = [
    { title: 'Total Cases', value: stats.total_cases, icon: ShieldAlert, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' },
    { title: 'Total Users', value: stats.total_citizens + stats.total_family, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/20' },
    { title: 'Active Server Load', value: 'Normal', icon: Server, color: 'text-green-500', bg: 'bg-green-500/10', border: 'border-green-500/20' },
    { title: 'System Audits', value: 'Secure', icon: Activity, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase">Root Diagnostics</h1>
        <p className="text-slate-400 font-light mt-1">Global system overview and health monitoring.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <div key={index} className={`p-6 rounded-2xl border ${stat.border} bg-black/50 backdrop-blur-sm relative overflow-hidden group hover:border-white/20 transition-all`}>
            <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${stat.bg} blur-2xl group-hover:scale-150 transition-transform`} />
            <div className="relative z-10 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{stat.title}</p>
                <h3 className={`text-3xl font-black mt-2 ${stat.color}`}>{stat.value}</h3>
              </div>
              <div className={`p-3 rounded-xl ${stat.bg} border ${stat.border}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 bg-black/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
        <h3 className="text-lg font-bold text-white mb-4 p-6 pb-0 flex items-center"><Server className="w-5 h-5 mr-2 text-purple-400" /> System Audit Logs</h3>
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
            <tr>
              <th className="px-6 py-4 font-bold tracking-wider rounded-tl-2xl">Timestamp</th>
              <th className="px-6 py-4 font-bold tracking-wider">Action</th>
              <th className="px-6 py-4 font-bold tracking-wider">Object</th>
              <th className="px-6 py-4 font-bold tracking-wider">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {loadingLogs ? (
              <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500 animate-pulse">Loading audit stream...</td></tr>
            ) : logs.length === 0 ? (
              <tr><td colSpan="4" className="px-6 py-8 text-center text-slate-500">No logs found in the system.</td></tr>
            ) : (
              logs.map(log => (
                <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-xs font-mono text-slate-500">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-widest border flex items-center w-fit ${getActionColor(log.action)}`}>
                      {getActionIcon(log.action)}
                      <span className="ml-2">{log.action.replace(/_/g, ' ')}</span>
                    </span>
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-400">
                    {log.object_type} #{log.object_id || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-xs">
                    <pre className="bg-black/50 p-2 rounded-lg border border-white/5 text-slate-300 overflow-x-auto max-w-md">
                      {JSON.stringify(log.details, null, 2)}
                    </pre>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default SuperAdminOverview;
