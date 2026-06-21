import React, { useState, useEffect } from 'react';
import { Server, Activity, ShieldAlert, KeyRound, UserPlus, Power, Trash2, Edit } from 'lucide-react';
import api from '../../lib/api';
import { toast } from 'sonner';

const SystemLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLogs();
    
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchLogs = async () => {
    try {
      const { data } = await api.get('/audit-logs/');
      setLogs(data);
    } catch (err) {
      toast.error('Failed to load system logs.');
    } finally {
      setLoading(false);
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

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center">
          <Server className="w-8 h-8 mr-3 text-purple-500" /> System Logs
        </h1>
        <p className="text-slate-400 font-light mt-1">Global audit logs and system activity monitoring.</p>
      </div>

      <div className="bg-black/40 backdrop-blur-sm border border-white/5 rounded-2xl overflow-hidden">
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
            {loading ? (
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

export default SystemLogs;
