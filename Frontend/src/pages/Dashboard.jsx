import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../store/useAuthStore';
import api from '../lib/api';
import { User, MapPin, Search, Activity, ShieldAlert, Eye, Target, Edit, Trash2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
};

const statusColors = {
  ACTIVE: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/30',
  PROCESSING: 'bg-blue-500/10 text-blue-500 border-blue-500/30',
  FOUND: 'bg-green-500/10 text-green-500 border-green-500/30',
  CLOSED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
};

const Dashboard = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [missingPersons, setMissingPersons] = useState([]);
  const [sightings, setSightings] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editingMp, setEditingMp] = useState(null);
  const [editFormData, setEditFormData] = useState({ description: '', status: '' });

  const fetchData = async () => {
    try {
      const [mpRes, sRes, mRes] = await Promise.all([
        api.get('missing-persons/'),
        api.get('sightings/'),
        api.get('matches/')
      ]);
      setMissingPersons(mpRes.data.filter(mp => mp.reported_by === user.id));
      setSightings(sRes.data.filter(s => s.reporter === user.id));
      setMatches(mRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate('/login');
    } else {
      fetchData();
    }
  }, [user, navigate]);

  const handleDeleteMp = async (id) => {
    if (!window.confirm("Are you sure you want to delete this report? This action cannot be undone.")) return;
    try {
      await api.delete(`missing-persons/${id}/`);
      toast.success("Report deleted successfully.");
      setMissingPersons(prev => prev.filter(mp => mp.id !== id));
    } catch (error) {
      toast.error("Failed to delete report.");
    }
  };

  const handleDeleteSighting = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sighting?")) return;
    try {
      await api.delete(`sightings/${id}/`);
      toast.success("Sighting deleted successfully.");
      setSightings(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      toast.error("Failed to delete sighting.");
    }
  };

  const openEditModal = (mp) => {
    setEditingMp(mp);
    setEditFormData({ description: mp.description, status: mp.status });
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    try {
      // Use PATCH for partial updates (doesn't require photo)
      await api.patch(`missing-persons/${editingMp.id}/`, editFormData);
      toast.success("Report updated successfully.");
      setEditingMp(null);
      fetchData(); // refresh data
    } catch (error) {
      toast.error("Failed to update report.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Activity className="w-12 h-12 text-primary animate-pulse mb-4" />
        <p className="text-primary font-mono tracking-widest uppercase text-sm animate-pulse">Initializing Command Center...</p>
      </div>
    );
  }

  return (
    <>
      <AnimatePresence>
        {editingMp && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          >
            <motion.div 
              initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="bg-surface/80 backdrop-blur-xl border border-white/10 p-6 rounded-3xl w-full max-w-md relative shadow-2xl"
            >
              <button onClick={() => setEditingMp(null)} className="absolute top-4 right-4 text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
              <h3 className="text-xl font-bold mb-4">Edit Report: {editingMp.first_name} {editingMp.last_name}</h3>
              
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Status</label>
                  <select 
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({...editFormData, status: e.target.value})}
                    className="w-full bg-black/50 border border-slate-700 rounded-lg px-4 py-2 text-white"
                  >
                    <option value="ACTIVE">Active</option>
                    <option value="PROCESSING">Processing</option>
                    <option value="FOUND">Found</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-1">Description & Details</label>
                  <textarea 
                    rows="4"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                    className="w-full bg-black/40 border border-white/5 rounded-xl px-4 py-3 text-white focus:border-primary/50 focus:bg-black/60 transition-all shadow-inner"
                  />
                </div>
                <button type="submit" className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 rounded-lg transition-all">Save Changes</button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial="hidden" animate="show" variants={containerVariants} className="space-y-8">
        {/* Header Section */}
        <motion.div variants={itemVariants} className="flex flex-col md:flex-row md:items-center justify-between bg-surface/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-xl">
          <div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight flex items-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Welcome, {user?.first_name}</span>
            </h1>
            <p className="text-slate-400 font-mono text-sm tracking-widest uppercase flex items-center">
              <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse shadow-[0_0_10px_rgba(34,197,94,1)]"></span>
              System Online & Monitoring
            </p>
          </div>
          
          <div className="mt-6 md:mt-0 flex gap-4">
            <div className="bg-black/50 p-4 rounded-xl border border-slate-800 text-center min-w-[120px]">
              <p className="text-3xl font-black text-primary">{matches.length}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Matches</p>
            </div>
            <div className="bg-black/50 p-4 rounded-xl border border-slate-800 text-center min-w-[120px]">
              <p className="text-3xl font-black text-white">{missingPersons.length + sightings.length}</p>
              <p className="text-xs text-slate-500 uppercase tracking-wider font-bold">Total Reports</p>
            </div>
          </div>
        </motion.div>

        {/* AI Matches Section */}
        <motion.div variants={itemVariants}>
          <h2 className="text-xl font-bold mb-6 uppercase tracking-widest text-slate-300 flex items-center">
            <Target className="mr-3 text-primary w-6 h-6" /> Priority AI Matches
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {matches.length === 0 ? (
              <div className="col-span-full p-8 rounded-2xl border border-slate-800 bg-black/30 backdrop-blur-sm text-center">
                <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                <p className="text-slate-500 font-mono">No critical matches detected by the neural network.</p>
              </div>
            ) : (
              matches.map(match => (
                <motion.div 
                  whileHover={{ scale: 1.02 }}
                  key={match.id} 
                  className="bg-surface/60 backdrop-blur-xl p-6 rounded-3xl border border-white/10 shadow-xl relative overflow-hidden group"
                >
                  <div className="flex flex-col sm:flex-row gap-6 relative z-10">
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="font-bold text-xl text-white">Target Identified: <span className="text-primary">{match.missing_person_details?.first_name}</span></h3>
                        <span className="bg-primary/20 text-primary border border-primary/50 text-xs px-2 py-1 rounded-md font-bold tracking-wider">
                          {(match.similarity_score * 100).toFixed(1)}% CONF
                        </span>
                      </div>
                      <div className="space-y-2 mb-4 font-mono text-sm text-slate-400">
                        <p className="flex items-center"><MapPin className="w-4 h-4 mr-2" /> LOC: {match.sighting_details?.location}</p>
                        <p className="flex items-center"><Activity className="w-4 h-4 mr-2" /> TIME: {new Date(match.sighting_details?.date).toLocaleString()}</p>
                      </div>
                      <div className="w-full bg-slate-900 rounded-full h-1.5 mb-2 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(match.similarity_score * 100).toFixed(0)}%` }} transition={{ duration: 1.5 }} className="bg-primary h-1.5 shadow-[0_0_10px_rgba(220,38,38,1)]" />
                      </div>
                    </div>
                    <div className="w-28 h-28 bg-black rounded-xl overflow-hidden flex-shrink-0 border-2 border-slate-800 p-1">
                      <img src={match.sighting_details?.photo?.startsWith('http') ? match.sighting_details.photo : `http://localhost:8000${match.sighting_details?.photo}`} alt="Sighting" className="w-full h-full object-cover rounded-lg grayscale hover:grayscale-0 transition-all" />
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Missing Reports Section */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-bold mb-6 uppercase tracking-widest text-slate-300 flex items-center">
              <User className="mr-3 text-slate-400 w-6 h-6" /> Missing Profiles
            </h2>
            <div className="space-y-4">
              {missingPersons.length === 0 ? (
                <p className="text-slate-500 font-mono text-sm p-4 bg-black/30 rounded-xl border border-slate-800">No active profiles registered.</p>
              ) : (
                missingPersons.map(mp => (
                  <motion.div whileHover={{ x: 5 }} key={mp.id} className="bg-surface/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex shadow-xl group">
                    <div className="w-24 bg-black relative">
                      {mp.photo && <img src={mp.photo.startsWith('http') ? mp.photo : `http://localhost:8000${mp.photo}`} alt={mp.first_name} className="w-full h-full object-cover opacity-80" />}
                    </div>
                    <div className="p-4 flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-bold text-lg">{mp.first_name} {mp.last_name}</h3>
                        <span className={`text-[10px] uppercase tracking-widest font-bold px-2 py-1 rounded border ${statusColors[mp.status] || statusColors['ACTIVE']}`}>
                          {mp.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2 pr-12">{mp.description}</p>
                      
                      {/* Action Buttons */}
                      <div className="absolute bottom-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => openEditModal(mp)} className="p-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition-colors" title="Edit Report">
                          <Edit className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDeleteMp(mp.id)} className="p-2 bg-red-900/50 hover:bg-red-600 text-white rounded-lg transition-colors" title="Delete Report">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>

          {/* Sightings Section */}
          <motion.div variants={itemVariants}>
            <h2 className="text-xl font-bold mb-6 uppercase tracking-widest text-slate-300 flex items-center">
              <Eye className="mr-3 text-slate-400 w-6 h-6" /> Submitted Sightings
            </h2>
            <div className="space-y-4">
              {sightings.length === 0 ? (
                <p className="text-slate-500 font-mono text-sm p-4 bg-black/30 rounded-xl border border-slate-800">No sighting data uploaded.</p>
              ) : (
                sightings.map(s => (
                  <motion.div whileHover={{ x: 5 }} key={s.id} className="bg-surface/60 backdrop-blur-xl rounded-2xl border border-white/10 overflow-hidden flex shadow-xl group relative">
                    <div className="w-24 bg-black">
                      {s.photo && <img src={s.photo.startsWith('http') ? s.photo : `http://localhost:8000${s.photo}`} alt="Sighting" className="w-full h-full object-cover opacity-80" />}
                    </div>
                    <div className="p-4 flex-1">
                      <h3 className="font-bold text-md mb-1 truncate">{s.location}</h3>
                      <p className="text-xs text-slate-400 font-mono mb-2">{new Date(s.date).toLocaleString()}</p>
                      <p className="text-xs text-slate-300 line-clamp-1 pr-10">{s.description}</p>
                      
                      {/* Action Buttons */}
                      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleDeleteSighting(s.id)} className="p-2 bg-red-900/50 hover:bg-red-600 text-white rounded-lg transition-colors" title="Delete Sighting">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>
      </motion.div>
    </>
  );
};

export default Dashboard;
