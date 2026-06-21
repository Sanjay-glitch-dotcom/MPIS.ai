import React from 'react';
import { X, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import GeoSpatialMap from './GeoSpatialMap';

const MatchDetailsModal = ({ match, onClose }) => {
  if (!match) return null;

  const mp = match.missing_person_details;
  const sighting = match.sighting_details;

  const markers = [];
  if (mp.latitude && mp.longitude) {
    markers.push({ lat: mp.latitude, lng: mp.longitude, type: 'last_seen', popupText: `Last Seen: ${mp.last_seen_location}` });
  }
  if (sighting.latitude && sighting.longitude) {
    markers.push({ lat: sighting.latitude, lng: sighting.longitude, type: 'sighting', popupText: `Sighting: ${sighting.location}` });
  }

  // Determine map center
  const center = markers.length > 0 ? [markers[0].lat, markers[0].lng] : [20.5937, 78.9629];

  return (
    <motion.div 
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
    >
      <motion.div 
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
        className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)]"
      >
        <div className="flex justify-between items-center p-6 border-b border-white/10 bg-black/40">
          <h3 className="text-xl font-bold text-white tracking-tight flex items-center uppercase">
            <MapPin className="w-6 h-6 mr-3 text-primary" /> 
            Match Details & Geo-Spatial Mapping
          </h3>
          <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 bg-black/20 flex flex-col md:flex-row gap-6">
          <div className="md:w-1/3 space-y-6">
            <div className="bg-black/40 p-4 rounded-xl border border-white/5 space-y-4">
              <div>
                <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-1">Target Profile</h4>
                <div className="flex items-center space-x-3">
                  <img src={mp.photo?.startsWith('http') ? mp.photo : `http://localhost:8000${mp.photo}`} className="w-12 h-12 rounded-lg object-cover" alt="" />
                  <div>
                    <p className="font-bold text-white">{mp.first_name} {mp.last_name}</p>
                    <p className="text-xs text-slate-400">Last seen: {mp.last_seen_date}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 pt-4">
                <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-1">Sighting Intel</h4>
                {sighting.photo && (
                  <img src={sighting.photo?.startsWith('http') ? sighting.photo : `http://localhost:8000${sighting.photo}`} className="w-full h-32 object-cover rounded-lg mb-2" alt="" />
                )}
                <p className="text-sm text-white mb-1">"{sighting.description}"</p>
                <p className="text-xs text-slate-400">Date: {new Date(sighting.date).toLocaleString()}</p>
              </div>
            </div>

            <div className="bg-primary/10 p-4 rounded-xl border border-primary/30">
              <h4 className="text-xs uppercase font-bold text-primary tracking-widest mb-2">Composite Score Breakdown</h4>
              <p className="text-2xl font-black text-white mb-2">{(match.similarity_score * 100).toFixed(1)}%</p>
              {match.review_comments ? (
                <div className="text-sm text-slate-300 font-mono space-y-1">
                  {match.review_comments.replace('Automated Match Breakdown: ', '').split(', ').map((item, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{item.split(': ')[0]}:</span>
                      <span className="font-bold">{item.split(': ')[1]}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500">Breakdown unavailable.</p>
              )}
            </div>
          </div>

          <div className="md:w-2/3 h-full min-h-[300px]">
            <h4 className="text-xs uppercase font-bold text-slate-500 tracking-widest mb-2">Geo-Spatial Proximity</h4>
            <div className="h-[calc(100%-2rem)]">
              <GeoSpatialMap center={center} markers={markers} zoom={11} />
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default MatchDetailsModal;
