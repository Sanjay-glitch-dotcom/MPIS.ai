import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import api from '../lib/api';
import { Map as MapIcon, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

const MapDashboard = () => {
  const [sightings, setSightings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSightings = async () => {
      try {
        const res = await api.get('sightings/');
        // Filter out sightings that don't have valid coordinates
        const validSightings = res.data.filter(s => s.latitude && s.longitude);
        setSightings(validSightings);
      } catch (error) {
        console.error("Error fetching map data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchSightings();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Activity className="w-12 h-12 text-primary animate-pulse mb-4" />
        <p className="text-primary font-mono tracking-widest uppercase text-sm animate-pulse">Initializing Geospatial Grid...</p>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 h-[80vh] flex flex-col"
    >
      <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-primary/20 shadow-[0_0_30px_rgba(220,38,38,0.1)] flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center tracking-tight">
            <MapIcon className="mr-3 text-primary w-8 h-8" /> 
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400">Global Heatmap Intelligence</span>
          </h1>
          <p className="text-slate-400 font-mono text-sm uppercase tracking-widest mt-1">Live visualization of all reported sightings</p>
        </div>
        <div className="hidden md:flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-ping" />
          <span className="text-xs text-red-500 font-bold uppercase tracking-widest">Live</span>
        </div>
      </div>

      <div className="flex-1 rounded-2xl overflow-hidden border border-slate-700 shadow-2xl relative">
        <MapContainer center={[20.5937, 78.9629]} zoom={5} scrollWheelZoom={true} className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" // Dark theme map
          />
          
          {sightings.map(s => (
            <CircleMarker 
              key={s.id}
              center={[s.latitude, s.longitude]}
              pathOptions={{ fillColor: 'red', color: 'red', fillOpacity: 0.5 }}
              radius={8}
            >
              <Popup className="custom-popup">
                <div className="p-2 w-48 text-black">
                  <h3 className="font-bold border-b pb-1 mb-2">{s.location}</h3>
                  {s.photo && (
                    <img src={s.photo.startsWith('http') ? s.photo : `http://localhost:8000${s.photo}`} alt="Sighting" className="w-full h-24 object-cover rounded mb-2" />
                  )}
                  <p className="text-xs mb-1"><strong>Time:</strong> {new Date(s.date).toLocaleString()}</p>
                  <p className="text-xs line-clamp-2 italic">"{s.description}"</p>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>
        
        {/* Overlay Legend */}
        <div className="absolute bottom-6 right-6 z-[1000] bg-black/80 backdrop-blur-md p-4 rounded-xl border border-slate-700">
          <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2 border-b border-slate-700 pb-1">Legend</h4>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500 opacity-80" />
            <span className="text-sm font-mono">Reported Sighting</span>
          </div>
          <div className="mt-3 text-xs text-slate-500 font-mono">
            Total Points: {sightings.length}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default MapDashboard;
