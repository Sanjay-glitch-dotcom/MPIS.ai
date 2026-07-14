import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icon for last seen (Red)
const lastSeenIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Component to handle map clicks and set location
const MapEvents = ({ onLocationSelect }) => {
  useMapEvents({
    async click(e) {
      if (onLocationSelect) {
        let address = '';
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${e.latlng.lat}&lon=${e.latlng.lng}`);
          const data = await res.json();
          address = data.display_name || '';
        } catch (err) {
          console.error("Reverse geocoding failed", err);
        }
        onLocationSelect({ lat: e.latlng.lat, lng: e.latlng.lng, address });
      }
    },
  });
  return null;
};

const GeoSpatialMap = ({ 
  center = [17.3850, 78.4867], // Default to Hyderabad
  zoom = 13, 
  onLocationSelect, 
  markers = [], // Array of { lat, lng, type: 'last_seen' | 'sighting', popupText: string }
  selectable = false,
  selectedLocation = null
}) => {
  return (
    <div className="h-64 w-full rounded-xl overflow-hidden border border-slate-700/50 relative z-0">
      <MapContainer center={center} zoom={zoom} minZoom={3} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} maxBounds={[[-90, -180], [90, 180]]}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          noWrap={true}
        />
        {selectable && <MapEvents onLocationSelect={onLocationSelect} />}
        
        {/* Render provided markers */}
        {markers.map((marker, idx) => (
          <Marker 
            key={idx} 
            position={[marker.lat, marker.lng]}
            icon={marker.type === 'last_seen' ? lastSeenIcon : new L.Icon.Default()}
          >
            {marker.popupText && <Popup>{marker.popupText}</Popup>}
          </Marker>
        ))}

        {/* Render currently selected location (for reporting forms) */}
        {selectable && selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
            <Popup>Selected Location</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
};

export default GeoSpatialMap;
