import React, { useState, useEffect } from 'react';
import { X, Activity, User, Users, Shield, Clock, Search, Target, MapPin, CheckCircle2, ChevronRight, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import api from '../lib/api';
import { toast } from 'sonner';

const getStatusColor = (status) => {
  const colors = {
    ACTIVE: 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30',
    PROCESSING: 'text-blue-500 bg-blue-500/10 border-blue-500/30',
    FOUND: 'text-green-500 bg-green-500/10 border-green-500/30',
    CLOSED: 'text-slate-400 bg-slate-500/10 border-slate-500/30',
  };
  return colors[status] || colors.ACTIVE;
};

const CaseProgressModal = ({ caseId, onClose }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProgress = async () => {
      try {
        const res = await api.get(`/missing-persons/${caseId}/detailed_overview/`);
        setData(res.data);
      } catch (err) {
        console.error(err);
        toast.error('Failed to load progress tracking details.');
      } finally {
        setLoading(false);
      }
    };
    fetchProgress();
  }, [caseId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
        <div className="flex flex-col items-center">
          <Activity className="w-12 h-12 text-blue-500 animate-pulse mb-4" />
          <p className="text-blue-500 font-mono tracking-widest uppercase text-sm animate-pulse">Initializing Global Tracker...</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { case_details, team, timeline, overview } = data;

  const progressPercentage = 
    case_details.status === 'FOUND' ? 100 :
    case_details.status === 'CLOSED' ? 100 :
    case_details.status === 'PROCESSING' ? 50 : 25;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 lg:p-8">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-[#0a0515] w-full max-w-6xl max-h-[90vh] rounded-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col relative"
      >
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/40 backdrop-blur-xl relative z-20">
          <div className="flex items-center space-x-6">
            {case_details.photo ? (
              <img src={case_details.photo} alt="Photo" className="w-16 h-16 rounded-2xl object-cover border border-white/10" />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                <User className="w-8 h-8 text-slate-500" />
              </div>
            )}
            <div>
              <div className="flex items-center space-x-3 mb-1">
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">{case_details.first_name} {case_details.last_name}</h2>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border ${getStatusColor(case_details.status)}`}>
                  {case_details.status}
                </span>
                {case_details.priority === 'Critical' && (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-widest border border-red-500/50 bg-red-500/10 text-red-500 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" /> Priority: Critical
                  </span>
                )}
              </div>
              <p className="text-slate-400 font-mono text-xs uppercase tracking-widest">
                Case ID: #{case_details.id.toString().padStart(6, '0')} • Reported: {new Date(case_details.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* Progress Overview Section */}
          <section className="bg-black/40 border border-white/5 rounded-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center uppercase tracking-widest">
                <Activity className="w-5 h-5 mr-2 text-blue-500" /> Progress Overview
              </h3>
              <div className="text-right">
                <p className="text-sm text-slate-400 font-mono">Current Stage</p>
                <p className="font-bold text-blue-400 uppercase tracking-widest">{case_details.status}</p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="relative h-4 bg-white/5 rounded-full overflow-hidden mb-8 border border-white/10">
              <motion.div 
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.2 }}
                className={`absolute top-0 left-0 h-full ${progressPercentage === 100 ? 'bg-green-500' : 'bg-blue-500'} shadow-[0_0_20px_rgba(59,130,246,0.5)]`}
              />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                <MapPin className="w-6 h-6 text-purple-400 mb-2" />
                <h4 className="text-2xl font-black text-white">{overview.sightings_count}</h4>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Sightings Received</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                <Target className="w-6 h-6 text-orange-400 mb-2" />
                <h4 className="text-2xl font-black text-white">{overview.matches_count}</h4>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Matches Detected</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                <Clock className="w-6 h-6 text-emerald-400 mb-2" />
                <h4 className="text-sm font-bold text-white font-mono">{new Date(case_details.last_updated).toLocaleDateString()}</h4>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Last Update</p>
              </div>
              <div className="bg-white/5 rounded-xl p-4 border border-white/5 flex flex-col items-center justify-center text-center">
                <User className="w-6 h-6 text-blue-400 mb-2" />
                <h4 className="text-sm font-bold text-white truncate w-full">{case_details.last_updated_by}</h4>
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mt-1">Last Officer</p>
              </div>
            </div>
          </section>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Team Involvement */}
            <section className="lg:col-span-1 bg-black/40 border border-white/5 rounded-2xl p-6 h-fit">
              <h3 className="text-lg font-bold text-white flex items-center uppercase tracking-widest mb-6">
                <Users className="w-5 h-5 mr-2 text-purple-500" /> Assigned Team
              </h3>
              {team.length === 0 ? (
                <p className="text-slate-500 font-mono text-sm">No officials currently assigned.</p>
              ) : (
                <div className="space-y-4">
                  {team.map((member, idx) => (
                    <div key={idx} className="flex items-center space-x-4 bg-white/5 p-4 rounded-xl border border-white/5 hover:bg-white/10 transition-colors">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 border border-purple-500/50 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-purple-400" />
                        </div>
                        <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#0a0515] ${
                          member.activity_status === 'ONLINE' ? 'bg-green-500' :
                          member.activity_status === 'ON_BREAK' ? 'bg-yellow-500' : 'bg-slate-500'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{member.name}</p>
                        <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">{member.role.replace('_', ' ')}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Timeline */}
            <section className="lg:col-span-2 bg-black/40 border border-white/5 rounded-2xl p-6">
              <h3 className="text-lg font-bold text-white flex items-center uppercase tracking-widest mb-6">
                <Clock className="w-5 h-5 mr-2 text-emerald-500" /> Case Timeline & Activity Log
              </h3>
              
              <div className="relative pl-6 border-l-2 border-white/10 space-y-8">
                {timeline.map((event, idx) => (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-[33px] top-1.5 w-4 h-4 rounded-full bg-[#0a0515] border-2 border-emerald-500" />
                    <div className="bg-white/5 rounded-xl p-4 border border-white/5 group hover:border-white/20 transition-colors">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-bold text-white uppercase tracking-widest text-sm flex items-center">
                          {event.event_type}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-500">
                          {new Date(event.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mb-3">{event.description}</p>
                      <div className="flex items-center text-[10px] font-mono text-slate-500 uppercase">
                        <User className="w-3 h-3 mr-1" />
                        {event.user_name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default CaseProgressModal;
