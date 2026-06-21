import React, { useEffect, useState } from 'react';
import api from '../../lib/api';
import { Activity, CheckCircle, XCircle, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import MatchDetailsModal from '../../components/MatchDetailsModal';

const rowVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 }
};

const VerificationCenter = () => {
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMatch, setSelectedMatch] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await api.get('matches/');
      setMatches(res.data);
    } catch (error) {
      console.error("Error fetching matches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMatchStatusChange = async (id, newStatus) => {
    try {
      await api.patch(`matches/${id}/`, { status: newStatus });
      toast.success("Match status updated.");
      fetchData();
    } catch (error) {
      toast.error("Error updating match status.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Activity className="w-12 h-12 text-primary animate-pulse mb-4" />
        <p className="text-primary font-mono tracking-widest uppercase text-sm animate-pulse">Syncing Verification Queue...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-3xl font-black tracking-tight text-white uppercase mb-2">Match Verification Center</h2>
        <p className="text-slate-400 font-mono text-sm uppercase tracking-widest">Review AI-detected matches</p>
      </div>

      <div className="bg-black/40 backdrop-blur-xl border border-white/5 rounded-3xl shadow-inner overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="p-6 font-semibold text-slate-400 uppercase tracking-widest text-xs">Target Profile</th>
                <th className="p-6 font-semibold text-slate-400 uppercase tracking-widest text-xs">Sighting Intel</th>
                <th className="p-6 font-semibold text-slate-400 uppercase tracking-widest text-xs">AI Confidence</th>
                <th className="p-6 font-semibold text-slate-400 uppercase tracking-widest text-xs">Status</th>
                <th className="p-6 font-semibold text-slate-400 uppercase tracking-widest text-xs text-right">Directives</th>
              </tr>
            </thead>
            <motion.tbody initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.05 } } }}>
              {matches.length === 0 ? (
                <tr><td colSpan="5" className="p-16 text-center text-slate-500 font-mono">No active matches in the queue.</td></tr>
              ) : (
                matches.map(match => (
                  <motion.tr variants={rowVariants} key={match.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="p-6 flex items-center space-x-4">
                      <div className="w-14 h-14 rounded-xl bg-black overflow-hidden border border-slate-800 shadow-lg">
                        <img src={match.missing_person_details?.photo?.startsWith('http') ? match.missing_person_details.photo : `http://localhost:8000${match.missing_person_details?.photo}`} className="w-full h-full object-cover grayscale opacity-80 hover:grayscale-0 transition-all" alt="" />
                      </div>
                      <div>
                        <p className="font-bold text-lg text-white">{match.missing_person_details?.first_name} {match.missing_person_details?.last_name}</p>
                        <p className="text-xs text-slate-500 font-mono mt-0.5">REP_BY: {match.missing_person_details?.reported_by_name}</p>
                      </div>
                    </td>
                    <td className="p-6">
                       <p className="font-medium text-slate-300">{match.sighting_details?.location}</p>
                       <p className="text-xs text-slate-500 font-mono mt-1">{new Date(match.sighting_details?.date).toLocaleString()}</p>
                    </td>
                    <td className="p-6">
                      <div className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-primary/20 text-primary border border-primary/30 shadow-inner mb-2">
                        {(match.similarity_score * 100).toFixed(1)}% MATCH
                      </div>
                      {match.review_comments && (
                        <div className="text-[10px] text-slate-400 font-mono">
                          {match.review_comments.replace('Automated Match Breakdown: ', '')}
                        </div>
                      )}
                    </td>
                    <td className="p-6">
                      <span className={`text-[10px] uppercase font-bold tracking-widest px-3 py-1.5 rounded-lg border shadow-sm ${match.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30' : match.status === 'VERIFIED' ? 'bg-green-500/10 text-green-500 border-green-500/30' : 'bg-red-500/10 text-red-500 border-red-500/30'}`}>
                        {match.status}
                      </span>
                    </td>
                    <td className="p-6 text-right space-x-3 whitespace-nowrap">
                      <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setSelectedMatch(match)} className="p-2.5 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-xl transition-all border border-blue-500/30 shadow-sm" title="View Details & Map">
                        <Eye className="w-5 h-5" />
                      </motion.button>
                      {match.status === 'PENDING' && (
                        <>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleMatchStatusChange(match.id, 'VERIFIED')} className="p-2.5 bg-green-500/10 hover:bg-green-500 text-green-500 hover:text-white rounded-xl transition-all border border-green-500/30 shadow-sm" title="Verify Match">
                            <CheckCircle className="w-5 h-5" />
                          </motion.button>
                          <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => handleMatchStatusChange(match.id, 'REJECTED')} className="p-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all border border-red-500/30 shadow-sm" title="Reject Match">
                            <XCircle className="w-5 h-5" />
                          </motion.button>
                        </>
                      )}
                    </td>
                  </motion.tr>
                ))
              )}
            </motion.tbody>
          </table>
        </div>
      </div>
      
      <AnimatePresence>
        {selectedMatch && (
          <MatchDetailsModal 
            match={selectedMatch} 
            onClose={() => setSelectedMatch(null)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default VerificationCenter;
