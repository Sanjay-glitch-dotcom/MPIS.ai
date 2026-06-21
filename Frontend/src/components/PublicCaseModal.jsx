import React, { useState, useEffect } from 'react';
import { X, Calendar, MapPin, Eye, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import api from '../lib/api';

const PublicCaseModal = ({ mp, onClose }) => {
  const [timeline, setTimeline] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTimeline = async () => {
      try {
        const res = await api.get(`missing-persons/${mp.id}/timeline/`);
        setTimeline(res.data);
      } catch (err) {
        console.error("Error fetching timeline:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTimeline();
  }, [mp.id]);

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-surface/90 backdrop-blur-xl border border-white/10 p-0 rounded-3xl w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
      >
        <button onClick={onClose} className="absolute top-4 right-4 z-10 bg-black/50 p-2 rounded-full text-white hover:bg-white/20 transition-colors"><X className="w-5 h-5" /></button>
        
        {/* Left Side: Image and Details */}
        <div className="w-full md:w-2/5 bg-black/40 border-r border-white/10 flex flex-col relative">
          <div className="h-64 md:h-1/2 w-full">
            {mp.photo ? (
              <img src={mp.photo.startsWith('http') ? mp.photo : `http://localhost:8000${mp.photo}`} alt={mp.first_name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">No Image</div>
            )}
          </div>
          <div className="p-6 flex-1 overflow-y-auto">
            <h3 className="text-3xl font-black mb-1">{mp.first_name} {mp.last_name}</h3>
            <div className="flex space-x-4 mb-4 pb-4 border-b border-white/10 text-sm font-mono text-slate-400">
              <span>Age: <span className="text-white font-bold">{mp.age}</span></span>
              <span>Gender: <span className="text-white font-bold">{mp.gender}</span></span>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center"><MapPin className="w-3 h-3 mr-1" /> Last Seen Location</h4>
                <p className="text-sm text-white font-bold">{mp.last_seen_location}</p>
              </div>
              <div>
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center"><Calendar className="w-3 h-3 mr-1" /> Last Seen Date</h4>
                <p className="text-sm text-white font-bold">{mp.last_seen_date}</p>
              </div>
              <div>
                <h4 className="text-[10px] text-slate-500 uppercase tracking-widest mb-1 flex items-center"><ShieldAlert className="w-3 h-3 mr-1" /> Physical Description</h4>
                <p className="text-sm text-slate-300 leading-relaxed">{mp.description}</p>
              </div>
            </div>
          </div>
          
          <div className="p-4 border-t border-white/10 bg-black/60">
            <Link to="/submit-sighting" state={{ missing_date: mp.last_seen_date }} className="w-full flex justify-center items-center py-3 bg-red-600 hover:bg-red-500 text-white rounded-xl transition-all font-bold tracking-widest uppercase text-xs shadow-[0_0_15px_rgba(220,38,38,0.3)]">
              <Eye className="w-4 h-4 mr-2" /> Submit a Sighting
            </Link>
          </div>
        </div>

        {/* Right Side: Timeline */}
        <div className="w-full md:w-3/5 p-8 flex flex-col overflow-y-auto bg-black/20">
          <h3 className="text-xl font-bold mb-6 text-white tracking-tight flex items-center border-b border-white/10 pb-4">
            <Calendar className="w-5 h-5 mr-3 text-blue-500" /> Case Timeline
          </h3>
          
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-slate-500 animate-pulse font-mono text-sm tracking-widest">Loading Records...</p>
            </div>
          ) : timeline.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
              <ShieldAlert className="w-8 h-8 mb-2 opacity-20" />
              <p className="font-mono text-sm">No timeline events recorded.</p>
            </div>
          ) : (
            <div className="relative border-l-2 border-white/10 pl-6 space-y-8 py-2 flex-1">
              {timeline.map((event, index) => (
                <div key={event.id} className="relative">
                  <div className="absolute -left-[35px] bg-[#0f172a] p-1 rounded-full border border-white/20">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                  </div>
                  <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
                    <div className="text-[10px] text-blue-400 font-mono mb-1">{new Date(event.timestamp).toLocaleString()}</div>
                    <h4 className="text-white font-bold text-sm mb-1">{event.event_type}</h4>
                    <p className="text-slate-400 text-sm leading-relaxed">{event.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PublicCaseModal;
