import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../lib/api';
import { Search, MapPin, Target, Eye, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PublicCaseModal from '../components/PublicCaseModal';

const statusConfig = {
  REPORTED: { label: 'Newly Reported', color: 'bg-orange-500/90 text-white', groupOrder: 1 },
  PROCESSING: { label: 'Processing', color: 'bg-blue-500/90 text-white', groupOrder: 2 },
  ACTIVE: { label: 'Active Case', color: 'bg-yellow-500/90 text-black', groupOrder: 3 },
  UNDER_REVIEW: { label: 'Under Review', color: 'bg-purple-500/90 text-white', groupOrder: 4 },
  INVESTIGATING: { label: 'Investigating', color: 'bg-indigo-500/90 text-white', groupOrder: 5 },
  POSSIBLE_MATCH: { label: 'Possible Match', color: 'bg-pink-500/90 text-white', groupOrder: 6 },
  VERIFIED: { label: 'Verified Match', color: 'bg-teal-500/90 text-white', groupOrder: 7 },
  FOUND: { label: 'Found Safe', color: 'bg-green-500/90 text-white', groupOrder: 8 },
  CLOSED: { label: 'Closed / Unsolved', color: 'bg-slate-600/90 text-white', groupOrder: 9 },
};

const PublicDatabase = () => {
  const [missingPersons, setMissingPersons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMp, setSelectedMp] = useState(null);
  const [activeTab, setActiveTab] = useState('ACTIVE'); // 'ACTIVE' or 'FOUND'

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get('missing-persons/');
        // The backend now filters based on roles, but we still have both ACTIVE and FOUND here.
        setMissingPersons(res.data);
      } catch (error) {
        console.error("Error fetching database:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredPersons = missingPersons.filter(mp => {
    // If activeTab is 'FOUND', strictly match 'FOUND'
    // If activeTab is 'ACTIVE', match anything EXCEPT 'FOUND'
    const matchesTab = activeTab === 'FOUND' 
      ? mp.status === 'FOUND' 
      : mp.status !== 'FOUND';

    const matchesSearch = mp.first_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      mp.last_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      mp.description.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesTab && matchesSearch;
  });

  // Group cases by status if on ACTIVE tab
  const groupedCases = {};
  if (activeTab === 'ACTIVE') {
    filteredPersons.forEach(mp => {
      const statusStr = mp.status || 'ACTIVE';
      if (!groupedCases[statusStr]) {
        groupedCases[statusStr] = [];
      }
      groupedCases[statusStr].push(mp);
    });
  }

  // Helper to render case card
  const renderCaseCard = (mp) => {
    const config = statusConfig[mp.status] || statusConfig['ACTIVE'];
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }} 
        animate={{ opacity: 1, scale: 1 }} 
        exit={{ opacity: 0, scale: 0.9 }}
        key={mp.id}
        onClick={() => setSelectedMp(mp)}
        className="bg-surface/60 backdrop-blur-xl rounded-3xl border border-white/10 overflow-hidden flex flex-col hover:border-blue-500/50 transition-all group shadow-xl cursor-pointer"
      >
        <div className="h-56 bg-black relative overflow-hidden">
          {mp.photo ? (
            <img 
              src={mp.photo.startsWith('http') ? mp.photo : `http://localhost:8000${mp.photo}`} 
              alt={mp.first_name} 
              className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" 
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">No Image</div>
          )}
          <div className="absolute top-3 right-3">
            <span className={`${config.color} text-[10px] uppercase tracking-widest font-black px-3 py-1 rounded shadow-lg backdrop-blur-md`}>
              {config.label}
            </span>
          </div>
        </div>
        
        <div className="p-6 flex-1 flex flex-col">
          <h3 className="text-2xl font-bold mb-1">{mp.first_name} {mp.last_name}</h3>
          <div className="flex space-x-4 mb-4 text-sm font-mono text-slate-400">
            <span>Age: <span className="text-white font-bold">{mp.age}</span></span>
            <span>Gender: <span className="text-white font-bold">{mp.gender}</span></span>
          </div>
          
          <p className="text-sm text-slate-300 line-clamp-3 mb-6 flex-1">
            {mp.description}
          </p>
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
            }}
            className="mt-auto w-full"
          >
            <Link to="/submit-sighting" className="w-full flex justify-center items-center py-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white border border-red-600/50 rounded-xl transition-all font-bold tracking-widest uppercase text-xs">
              <Eye className="w-4 h-4 mr-2" /> Report Sighting
            </Link>
          </button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="space-y-8">
      <AnimatePresence>
        {selectedMp && (
          <PublicCaseModal 
            mp={selectedMp} 
            onClose={() => setSelectedMp(null)} 
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="bg-surface/60 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight mb-2 flex items-center">
            <Database className="mr-3 text-blue-500 w-10 h-10" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-white">Missing People</span>
          </h1>
          <p className="text-slate-400 font-mono tracking-widest text-sm uppercase">Public Database • Real-time Active Cases</p>
        </div>
        <div className="relative w-full md:w-96">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name, location, or details..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-black/40 border border-white/5 focus:border-blue-500 rounded-full py-3 pl-12 pr-6 text-white outline-none transition-all shadow-inner focus:bg-black/60"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex justify-center space-x-4 mb-8">
        <button 
          onClick={() => setActiveTab('ACTIVE')}
          className={`px-6 py-3 rounded-full font-bold tracking-widest uppercase text-sm transition-all duration-300 ${activeTab === 'ACTIVE' ? 'bg-blue-600 text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]' : 'bg-black/40 text-slate-400 border border-white/5 hover:border-white/20'}`}
        >
          Active Searches
        </button>
        <button 
          onClick={() => setActiveTab('FOUND')}
          className={`px-6 py-3 rounded-full font-bold tracking-widest uppercase text-sm transition-all duration-300 ${activeTab === 'FOUND' ? 'bg-green-600 text-white shadow-[0_0_15px_rgba(22,163,74,0.4)]' : 'bg-black/40 text-slate-400 border border-white/5 hover:border-white/20'}`}
        >
          Resolved / Found Safe
        </button>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center">
          <Target className="w-12 h-12 text-blue-500 animate-spin mb-4" />
          <p className="text-blue-500 font-mono tracking-widest uppercase text-sm animate-pulse">Querying National Grid...</p>
        </div>
      ) : (
        <div>
          {filteredPersons.length === 0 ? (
            <div className="text-center py-20 text-slate-500 font-mono">
              No records match your search criteria.
            </div>
          ) : activeTab === 'FOUND' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {filteredPersons.map(mp => renderCaseCard(mp))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="space-y-12">
              {Object.keys(groupedCases)
                .sort((a, b) => (statusConfig[a]?.groupOrder || 99) - (statusConfig[b]?.groupOrder || 99))
                .map(statusKey => {
                  const cases = groupedCases[statusKey];
                  const config = statusConfig[statusKey] || statusConfig['ACTIVE'];
                  return (
                    <div key={statusKey}>
                      <div className="flex items-center mb-6">
                        <h2 className="text-2xl font-black text-white uppercase tracking-wider">{config.label}</h2>
                        <div className="ml-4 flex-1 h-px bg-white/10"></div>
                        <span className="ml-4 text-sm font-mono text-slate-500">{cases.length} CASE{cases.length !== 1 ? 'S' : ''}</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        <AnimatePresence>
                          {cases.map(mp => renderCaseCard(mp))}
                        </AnimatePresence>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PublicDatabase;
