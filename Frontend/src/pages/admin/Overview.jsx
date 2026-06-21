import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const Overview = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('admin/analytics/');
      setAnalytics(res.data);
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Activity className="w-12 h-12 text-primary animate-pulse mb-4" />
        <p className="text-primary font-mono tracking-widest uppercase text-sm animate-pulse">Gathering Intel...</p>
      </div>
    );
  }

  const chartData = analytics ? [
    { name: 'Missing', count: analytics.total_cases },
    { name: 'Active', count: analytics.active_cases },
    { name: 'Found', count: analytics.resolved_cases },
    { name: 'Sightings', count: analytics.total_sightings },
    { name: 'Matches', count: analytics.verified_matches },
  ] : [];

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white uppercase mb-2">System Analytics Overview</h2>
        <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">Real-time MPIS Network Status</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-1 relative z-10">Total Missing</p>
          <p className="text-5xl font-black text-white relative z-10">{analytics?.total_cases || 0}</p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-yellow-500 text-xs font-bold tracking-widest uppercase mb-1 relative z-10">Active Cases</p>
          <p className="text-5xl font-black text-yellow-500 relative z-10">{analytics?.active_cases || 0}</p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-inner relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-green-500 text-xs font-bold tracking-widest uppercase mb-1 relative z-10">Resolved</p>
          <p className="text-5xl font-black text-green-500 relative z-10">{analytics?.resolved_cases || 0}</p>
        </div>
        <div className="bg-black/40 backdrop-blur-xl border border-red-500/20 p-6 rounded-3xl shadow-[0_0_30px_rgba(220,38,38,0.1)] relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <p className="text-primary text-xs font-bold tracking-widest uppercase mb-1 relative z-10">Pending Matches</p>
          <p className="text-5xl font-black text-primary relative z-10">{analytics?.pending_matches || 0}</p>
          {analytics?.pending_matches > 0 && <div className="absolute top-0 right-0 w-2 h-full bg-primary animate-pulse" />}
        </div>
      </div>

      <div className="bg-black/40 backdrop-blur-xl border border-white/5 p-8 rounded-3xl shadow-inner h-96">
        <h3 className="text-slate-400 text-xs font-bold tracking-widest uppercase mb-8 flex items-center">
          <Activity className="w-4 h-4 mr-2" /> Global Activity Metrics
        </h3>
        <ResponsiveContainer width="100%" height="85%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
            <XAxis dataKey="name" stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12, fontWeight: 'bold' }} axisLine={false} tickLine={false} dy={10} />
            <YAxis stroke="#94a3b8" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} dx={-10} />
            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.02)' }} contentStyle={{ backgroundColor: '#050505', borderColor: '#334155', borderRadius: '16px', color: '#fff', padding: '12px' }} itemStyle={{ fontWeight: 'bold' }} />
            <Bar dataKey="count" fill="#dc2626" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Overview;
