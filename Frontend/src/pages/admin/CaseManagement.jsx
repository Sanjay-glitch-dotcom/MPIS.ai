import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Activity, Edit, X, Search, Filter, Calendar, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import CaseDetailsModal from '../../components/CaseDetailsModal';
import CaseProgressModal from '../../components/CaseProgressModal';
import { Target } from 'lucide-react';

const statusColors = {
  ACTIVE: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30 shadow-[0_0_10px_rgba(234,179,8,0.2)]',
  PROCESSING: 'bg-blue-500/10 text-blue-500 border-blue-500/30 shadow-[0_0_10px_rgba(59,130,246,0.2)]',
  FOUND: 'bg-green-500/10 text-green-500 border-green-500/30 shadow-[0_0_10px_rgba(34,197,94,0.2)]',
  CLOSED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const CaseManagement = () => {
  const [missingPersons, setMissingPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Edit Modal State
  const [editingMp, setEditingMp] = useState(null);
  const [trackingMp, setTrackingMp] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('missing-persons/');
      setMissingPersons(res.data);
    } catch (error) {
      console.error("Error fetching cases:", error);
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (mp) => {
    setEditingMp(mp);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Activity className="w-12 h-12 text-primary animate-pulse mb-4" />
        <p className="text-primary font-mono tracking-widest uppercase text-sm animate-pulse">Accessing Global Database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <AnimatePresence>
        {editingMp && (
          <CaseDetailsModal 
            mp={editingMp} 
            onClose={() => setEditingMp(null)} 
            onUpdate={() => {
              setEditingMp(null);
              fetchData();
            }} 
          />
        )}
        {trackingMp && (
          <CaseProgressModal
            caseId={trackingMp.id}
            onClose={() => setTrackingMp(null)}
          />
        )}
      </AnimatePresence>

      <div>
        <h2 className="text-3xl font-black tracking-tight text-white uppercase mb-2">Global Case Management</h2>
        <p className="text-slate-400 font-mono text-sm uppercase tracking-widest mb-8">Full directory of active and resolved cases</p>
        
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 bg-black/40 backdrop-blur-xl border border-white/5 p-4 rounded-2xl shadow-inner">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search by name or case details..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500/50 transition-all font-medium"
            />
          </div>
          <div className="relative min-w-[200px]">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <select 
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
              className="w-full bg-black/50 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500/50 transition-all font-medium appearance-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="PROCESSING">Processing</option>
              <option value="FOUND">Found</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        <AnimatePresence>
          {missingPersons.filter(mp => {
            const matchesSearch = (mp.first_name + ' ' + mp.last_name + ' ' + mp.description).toLowerCase().includes(searchQuery.toLowerCase());
            const matchesStatus = statusFilter === 'ALL' || mp.status === statusFilter;
            return matchesSearch && matchesStatus;
          }).length === 0 ? (
            <div className="col-span-full p-16 text-center text-slate-500 font-mono bg-black/40 border border-white/5 rounded-3xl shadow-inner">No matching cases found.</div>
          ) : (
            missingPersons.filter(mp => {
              const matchesSearch = (mp.first_name + ' ' + mp.last_name + ' ' + mp.description).toLowerCase().includes(searchQuery.toLowerCase());
              const matchesStatus = statusFilter === 'ALL' || mp.status === statusFilter;
              return matchesSearch && matchesStatus;
            }).map((mp, index) => (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.05 }}
                key={mp.id} 
                className="bg-black/40 backdrop-blur-xl rounded-3xl border border-white/5 overflow-hidden flex flex-col shadow-inner group relative hover:border-white/10 transition-colors"
              >
                <div className="h-48 bg-black relative overflow-hidden">
                  {mp.photo && <img src={mp.photo.startsWith('http') ? mp.photo : `http://localhost:8000${mp.photo}`} alt={mp.first_name} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" />}
                  <div className="absolute top-4 right-4">
                    <span className={`text-[10px] uppercase tracking-widest font-bold px-3 py-1.5 rounded-lg border backdrop-blur-md ${statusColors[mp.status] || statusColors['ACTIVE']}`}>
                      {mp.status}
                    </span>
                  </div>
                </div>
                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="font-bold text-xl text-white mb-1">{mp.first_name} {mp.last_name}</h3>
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-400 font-mono uppercase">Age: {mp.age}</span>
                    <span className="px-2 py-1 bg-white/5 rounded text-[10px] text-slate-400 font-mono uppercase">{mp.gender}</span>
                  </div>
                  
                  <div className="space-y-2 mb-4 pb-4 border-b border-white/5">
                    <div className="flex items-center text-xs text-slate-500 font-mono">
                      <User className="w-3 h-3 mr-2" /> REP_BY: <span className="ml-1 text-slate-300 truncate">{mp.reported_by_name}</span>
                    </div>
                    <div className="flex items-center text-xs text-slate-500 font-mono">
                      <Calendar className="w-3 h-3 mr-2" /> LAST_UPDATE: <span className="ml-1 text-slate-300">{new Date(mp.updated_at || mp.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>

                  <p className="text-sm text-slate-400 line-clamp-3 mb-6 flex-1">{mp.description}</p>
                  
                  <div className="mt-auto space-y-2">
                    <button onClick={() => setTrackingMp(mp)} className="w-full flex justify-center items-center py-3 bg-purple-600/10 hover:bg-purple-600 text-purple-500 hover:text-white rounded-xl transition-all border border-purple-600/30 hover:border-transparent font-bold text-xs tracking-widest uppercase shadow-sm">
                      <Target className="w-4 h-4 mr-2" /> Track Progress
                    </button>
                    <button onClick={() => openEditModal(mp)} className="w-full flex justify-center items-center py-3 bg-blue-600/10 hover:bg-blue-600 text-blue-500 hover:text-white rounded-xl transition-all border border-blue-600/30 hover:border-transparent font-bold text-xs tracking-widest uppercase shadow-sm">
                      <Edit className="w-4 h-4 mr-2" /> Manage Case File
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CaseManagement;
