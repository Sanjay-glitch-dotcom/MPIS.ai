import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMap, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { renderToStaticMarkup } from 'react-dom/server';
import { Search, MapPin, Loader2, X, Check } from 'lucide-react';
import { toast } from 'sonner';

// Custom Marker Icon
const customIcon = L.divIcon({
  className: 'bg-transparent border-none',
  html: renderToStaticMarkup(
    <div className="relative flex items-center justify-center -mt-8 -ml-4">
      <MapPin className="text-red-500 fill-red-500/20 w-10 h-10 drop-shadow-lg filter" />
      <div className="absolute top-2 w-3 h-3 bg-red-600 rounded-full"></div>
    </div>
  ),
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

// Component to dynamically update map center
function MapController({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center) {
      map.flyTo(center, 16, { duration: 1.5 });
    }
  }, [center, map]);
  return null;
}

export default function LocationPicker({ onConfirm, onCancel }) {
  const [position, setPosition] = useState({ lat: 20.5937, lng: 78.9629 }); // Default India
  const [address, setAddress] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGeocoding, setIsGeocoding] = useState(false);
  
  const markerRef = useRef(null);

  // Try to get user's current location on mount
  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          setPosition({ lat, lng });
          fetchAddress(lat, lng);
        },
        () => {
          // Fallback location if denied
          toast.info("Location access denied. Please search manually.");
        }
      );
    }
  }, []);

  const fetchAddress = async (lat, lng) => {
    setIsGeocoding(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      const data = await res.json();
      if (data && data.display_name) {
        setAddress(data.display_name);
      } else {
        setAddress('Unknown location');
      }
    } catch (error) {
      console.error("Geocoding error:", error);
      setAddress('Error fetching address');
    } finally {
      setIsGeocoding(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
      const data = await res.json();
      
      if (data && data.length > 0) {
        const result = data[0];
        const newLat = parseFloat(result.lat);
        const newLng = parseFloat(result.lon);
        setPosition({ lat: newLat, lng: newLng });
        setAddress(result.display_name);
        toast.success("Location found");
      } else {
        toast.error("Location not found. Try a different search term.");
      }
    } catch (error) {
      console.error("Search error:", error);
      toast.error("Error searching location");
    } finally {
      setIsSearching(false);
    }
  };

  const handleDragEnd = useMemo(
    () => () => {
      const marker = markerRef.current;
      if (marker != null) {
        const newPos = marker.getLatLng();
        setPosition(newPos);
        fetchAddress(newPos.lat, newPos.lng);
      }
    },
    []
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-[#0f172a] border border-blue-500/20 rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden relative">
        
        {/* Header & Search */}
        <div className="p-4 bg-[#0f172a]/90 backdrop-blur-md border-b border-white/5 flex flex-col md:flex-row gap-4 items-center justify-between z-10 relative">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30 text-blue-400">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-tight">Select Location</h2>
              <p className="text-xs text-slate-400">Search and drag the pin to set the exact spot</p>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="flex-1 w-full max-w-md relative flex">
            <input 
              type="text" 
              placeholder="Search any city, street, or landmark..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-l-xl py-2.5 pl-4 pr-10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 transition-colors"
            />
            {searchQuery && (
              <button 
                type="button" 
                onClick={() => setSearchQuery('')}
                className="absolute right-[52px] top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <button 
              type="submit"
              disabled={isSearching}
              className="bg-blue-600 hover:bg-blue-500 text-white px-4 rounded-r-xl border border-blue-600 transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
            </button>
          </form>

          <button 
            onClick={onCancel}
            className="hidden md:flex p-2 text-slate-400 hover:text-white hover:bg-white/5 rounded-xl transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Map Area */}
        <div className="flex-1 relative bg-slate-900">
          <MapContainer center={[position.lat, position.lng]} zoom={5} className="w-full h-full">
            <MapController center={[position.lat, position.lng]} />
            
            <LayersControl position="topright">
              <LayersControl.BaseLayer name="Satellite View" checked>
                <TileLayer
                  attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
                  url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                  maxZoom={19}
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Dark Map">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                />
              </LayersControl.BaseLayer>
              <LayersControl.BaseLayer name="Street Map">
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
              </LayersControl.BaseLayer>
            </LayersControl>

            <Marker 
              position={position}
              draggable={true}
              icon={customIcon}
              eventHandlers={{ dragend: handleDragEnd }}
              ref={markerRef}
            />
          </MapContainer>
          
          {/* Instructions Overlay */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-black/60 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 text-white text-sm flex items-center shadow-lg pointer-events-none">
            <MapPin className="w-4 h-4 mr-2 text-blue-400" />
            Drag the pin to fine-tune the location
          </div>
        </div>

        {/* Footer Sidebar / Action Area */}
        <div className="bg-[#0f172a] border-t border-white/5 p-4 flex flex-col md:flex-row items-center justify-between gap-4 z-10 relative">
          <div className="flex-1 min-w-0 w-full flex items-center bg-black/40 p-3 rounded-xl border border-white/5">
            {isGeocoding ? (
              <div className="flex items-center text-slate-400">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Fetching address data...
              </div>
            ) : (
              <div className="truncate pr-4">
                <p className="text-sm font-bold text-white truncate">
                  {address || "No address selected"}
                </p>
                <div className="flex gap-4 mt-1 text-xs font-mono text-blue-400">
                  <span>Lat: {position.lat.toFixed(6)}</span>
                  <span>Lng: {position.lng.toFixed(6)}</span>
                </div>
              </div>
            )}
          </div>
          
          <div className="flex gap-3 w-full md:w-auto">
            <button 
              onClick={onCancel}
              className="flex-1 md:flex-none px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
            >
              Cancel
            </button>
            <button 
              onClick={() => onConfirm({ address, lat: position.lat, lng: position.lng })}
              className="flex-1 md:flex-none flex items-center justify-center px-8 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-500 border border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-colors"
            >
              <Check className="w-5 h-5 mr-2" /> Confirm Location
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
