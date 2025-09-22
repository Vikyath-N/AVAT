import React, { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import Map, { 
  Marker, 
  Popup, 
  NavigationControl, 
  FullscreenControl, 
  ScaleControl,
  GeolocateControl
} from 'react-map-gl';
import { 
  Filter, 
  AlertCircle, 
  Car
} from 'lucide-react';
import { UserPreferences, AccidentRecord, MapViewport } from '../types';
import { mockAccidents } from '../services/mockData';

interface MapViewProps {
  preferences: UserPreferences;
}

const MapView: React.FC<MapViewProps> = ({ preferences }) => {
  const [viewport, setViewport] = useState<MapViewport>({
    latitude: 37.7749,
    longitude: -122.4194,
    zoom: 10
  });
  
  const [selectedAccident, setSelectedAccident] = useState<AccidentRecord | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [mapStyle, setMapStyle] = useState('mapbox://styles/mapbox/dark-v11');
  const [selectedCompanies, setSelectedCompanies] = useState<string[]>([]);

  const accidents = mockAccidents;

  const mapStyles = [
    { id: 'dark', name: 'Dark', url: 'mapbox://styles/mapbox/dark-v11' },
    { id: 'satellite', name: 'Satellite', url: 'mapbox://styles/mapbox/satellite-v9' },
    { id: 'streets', name: 'Streets', url: 'mapbox://styles/mapbox/streets-v12' },
    { id: 'outdoors', name: 'Outdoors', url: 'mapbox://styles/mapbox/outdoors-v12' }
  ];

  const companies = ['Waymo', 'Cruise', 'Tesla', 'Zoox', 'Apple'];

  const getMarkerColor = (severity: string): string => {
    switch (severity) {
      case 'minor': return '#10b981'; // green
      case 'moderate': return '#f59e0b'; // yellow
      case 'severe': return '#ef4444'; // red
      case 'total loss': return '#7c2d12'; // dark red
      default: return '#6b7280'; // gray
    }
  };

  const filteredAccidents = useMemo(() => {
    return accidents.filter((accident: AccidentRecord) => {
      if (selectedCompanies.length > 0 && accident.company && !selectedCompanies.includes(accident.company)) {
        return false;
      }
      return true;
    });
  }, [selectedCompanies]);

  const handleMarkerClick = useCallback((accident: AccidentRecord) => {
    setSelectedAccident(accident);
    setViewport(prev => ({
      ...prev,
      latitude: accident.location_lat || prev.latitude,
      longitude: accident.location_lng || prev.longitude,
      zoom: 15
    }));
  }, []);

  return (
    <div className="h-full relative">
      {/* Map Container */}
      <Map
        {...viewport}
        onMove={evt => setViewport(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        mapboxAccessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        attributionControl={false}
      >
        {/* Navigation Controls */}
        <NavigationControl position="top-right" />
        <FullscreenControl position="top-right" />
        <GeolocateControl position="top-right" />
        <ScaleControl position="bottom-right" />

        {/* Accident Markers */}
        {filteredAccidents.map((accident) => (
          <Marker
            key={accident.id}
            latitude={accident.location_lat || 0}
            longitude={accident.location_lng || 0}
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              handleMarkerClick(accident);
            }}
          >
            <motion.div
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              className="cursor-pointer"
            >
              <div 
                className="w-6 h-6 rounded-full border-2 border-white shadow-lg flex items-center justify-center"
                style={{ backgroundColor: getMarkerColor(accident.damage_severity || 'minor') }}
              >
                <AlertCircle className="w-3 h-3 text-white" />
              </div>
            </motion.div>
          </Marker>
        ))}

        {/* Accident Popup */}
        {selectedAccident && (
          <Popup
            latitude={selectedAccident.location_lat || 0}
            longitude={selectedAccident.location_lng || 0}
            onClose={() => setSelectedAccident(null)}
            closeButton={true}
            closeOnClick={false}
            offset={[0, -10] as [number, number]}
          >
            <div className="p-4 max-w-sm">
              <div className="flex items-center space-x-2 mb-3">
                <Car className="w-5 h-5 text-tesla-blue" />
                <h3 className="font-semibold text-lg">{selectedAccident.company}</h3>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-dark-muted">Vehicle:</span>
                  <span>{selectedAccident.vehicle_make} {selectedAccident.vehicle_model}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-dark-muted">Severity:</span>
                  <span className={`capitalize font-medium ${
                    selectedAccident.damage_severity === 'severe' ? 'text-accent-danger' :
                    selectedAccident.damage_severity === 'moderate' ? 'text-accent-warning' :
                    'text-accent-success'
                  }`}>
                    {selectedAccident.damage_severity}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-dark-muted">Location:</span>
                  <span>{selectedAccident.city}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-dark-muted">Intersection:</span>
                  <span className="capitalize">{selectedAccident.intersection_type}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-dark-muted">Casualties:</span>
                  <span>{selectedAccident.casualties}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-dark-muted">Time:</span>
                  <span>{selectedAccident.timestamp ? new Date(selectedAccident.timestamp).toLocaleString() : 'N/A'}</span>
                </div>
              </div>
              
              <div className="mt-4 pt-3 border-t border-dark-border">
                <button className="w-full btn-tesla-primary text-sm py-2">
                  View Full Report
                </button>
              </div>
            </div>
          </Popup>
        )}
      </Map>

      {/* Control Panel */}
      <motion.div
        initial={{ x: -300 }}
        animate={{ x: showFilters ? 0 : -250 }}
        className="absolute left-0 top-0 h-full w-80 bg-dark-surface/90 backdrop-blur-md border-r border-dark-border z-10"
      >
        <div className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold">Map Controls</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="p-2 rounded-lg hover:bg-dark-card transition-colors"
            >
              <Filter className="w-5 h-5" />
            </button>
          </div>

          {/* Map Style Selector */}
          <div>
            <label className="block text-sm font-medium mb-2">Map Style</label>
            <div className="grid grid-cols-2 gap-2">
              {mapStyles.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setMapStyle(style.url)}
                  className={`p-2 text-sm rounded-lg border transition-colors ${
                    mapStyle === style.url
                      ? 'border-tesla-blue bg-tesla-blue/20 text-tesla-blue'
                      : 'border-dark-border hover:border-dark-muted'
                  }`}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          {/* Company Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Companies</label>
            <div className="space-y-2">
              {companies.map((company) => (
                <label key={company} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={selectedCompanies.includes(company)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCompanies([...selectedCompanies, company]);
                      } else {
                        setSelectedCompanies(selectedCompanies.filter(c => c !== company));
                      }
                    }}
                    className="rounded border-dark-border bg-dark-card text-tesla-blue focus:ring-tesla-blue focus:ring-offset-dark-surface"
                  />
                  <span className="text-sm">{company}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Statistics */}
          <div className="pt-4 border-t border-dark-border">
            <h3 className="text-sm font-medium mb-3">Current View</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Total Accidents:</span>
                <span className="font-medium">{filteredAccidents.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">With Casualties:</span>
                <span className="font-medium">
                  {filteredAccidents.filter(a => (a.casualties || 0) > 0).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-dark-muted">Severe Damage:</span>
                <span className="font-medium">
                  {filteredAccidents.filter(a => a.damage_severity === 'severe').length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setShowFilters(!showFilters)}
        className="absolute left-4 top-4 z-20 p-3 bg-dark-surface/90 backdrop-blur-md border border-dark-border rounded-lg shadow-tesla"
      >
        <Filter className="w-5 h-5" />
      </motion.button>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-dark-surface/90 backdrop-blur-md border border-dark-border rounded-lg p-4 z-10">
        <h4 className="text-sm font-medium mb-2">Severity Legend</h4>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-accent-success" />
            <span className="text-xs">Minor</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-accent-warning" />
            <span className="text-xs">Moderate</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-accent-danger" />
            <span className="text-xs">Severe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
