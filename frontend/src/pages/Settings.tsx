import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, 
  Moon, 
  Sun, 
  Map, 
  Bell, 
  Download,
  Database,
  Wifi,
  Shield,
  Palette,
  Globe
} from 'lucide-react';
import { UserPreferences } from '../types';

interface SettingsProps {
  preferences: UserPreferences;
  onPreferencesChange: (preferences: Partial<UserPreferences>) => void;
}

const Settings: React.FC<SettingsProps> = ({ preferences, onPreferencesChange }) => {
  const [activeSection, setActiveSection] = useState('appearance');

  const sections = [
    { id: 'appearance', name: 'Appearance', icon: Palette },
    { id: 'map', name: 'Map Settings', icon: Map },
    { id: 'notifications', name: 'Notifications', icon: Bell },
    { id: 'data', name: 'Data & Privacy', icon: Database },
    { id: 'system', name: 'System', icon: SettingsIcon }
  ];

  const mapStyles = [
    { 
      id: 'mapbox://styles/mapbox/dark-v11', 
      name: 'Dark', 
      description: 'Tesla-inspired dark theme',
      preview: '/api/placeholder/120/80'
    },
    { 
      id: 'mapbox://styles/mapbox/satellite-v9', 
      name: 'Satellite', 
      description: 'High-resolution satellite imagery',
      preview: '/api/placeholder/120/80'
    },
    { 
      id: 'mapbox://styles/mapbox/streets-v12', 
      name: 'Streets', 
      description: 'Classic street map view',
      preview: '/api/placeholder/120/80'
    },
    { 
      id: 'mapbox://styles/mapbox/outdoors-v12', 
      name: 'Outdoors', 
      description: 'Terrain and outdoor features',
      preview: '/api/placeholder/120/80'
    }
  ];

  const renderAppearanceSettings = () => (
    <div className="space-y-6">
      {/* Theme Selection */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Palette className="w-5 h-5" />
          <span>Theme</span>
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <button
            onClick={() => onPreferencesChange({ theme: 'dark' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              preferences.theme === 'dark'
                ? 'border-tesla-blue bg-tesla-blue/10'
                : 'border-dark-border hover:border-dark-muted'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-dark-surface rounded-lg flex items-center justify-center">
                <Moon className="w-5 h-5 text-tesla-blue" />
              </div>
              <div className="text-left">
                <div className="font-medium">Dark Mode</div>
                <div className="text-sm text-dark-muted">Tesla-inspired dark interface</div>
              </div>
            </div>
          </button>
          
          <button
            onClick={() => onPreferencesChange({ theme: 'light' })}
            className={`p-4 rounded-lg border-2 transition-all ${
              preferences.theme === 'light'
                ? 'border-tesla-blue bg-tesla-blue/10'
                : 'border-dark-border hover:border-dark-muted'
            }`}
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-200 rounded-lg flex items-center justify-center">
                <Sun className="w-5 h-5 text-yellow-500" />
              </div>
              <div className="text-left">
                <div className="font-medium">Light Mode</div>
                <div className="text-sm text-dark-muted">Classic light interface</div>
              </div>
            </div>
          </button>
        </div>
      </motion.div>

      {/* Display Options */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4">Display Options</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Animations</div>
              <div className="text-sm text-dark-muted">Enable smooth transitions and effects</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-dark-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-tesla-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tesla-blue"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Reduce Motion</div>
              <div className="text-sm text-dark-muted">Minimize animations for better performance</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-dark-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-tesla-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tesla-blue"></div>
            </label>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderMapSettings = () => (
    <div className="space-y-6">
      {/* Map Style */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4">Map Style</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {mapStyles.map((style) => (
            <button
              key={style.id}
              onClick={() => onPreferencesChange({ map_style: style.id })}
              className={`p-4 rounded-lg border-2 transition-all text-left ${
                preferences.map_style === style.id
                  ? 'border-tesla-blue bg-tesla-blue/10'
                  : 'border-dark-border hover:border-dark-muted'
              }`}
            >
              <div className="w-full h-20 bg-dark-card rounded-lg mb-3 flex items-center justify-center">
                <Map className="w-8 h-8 text-dark-muted" />
              </div>
              <div className="font-medium">{style.name}</div>
              <div className="text-sm text-dark-muted">{style.description}</div>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Map Behavior */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4">Map Behavior</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Default Zoom Level</label>
            <input
              type="range"
              min="8"
              max="16"
              value={preferences.default_zoom}
              onChange={(e) => onPreferencesChange({ default_zoom: parseInt(e.target.value) })}
              className="w-full h-2 bg-dark-border rounded-lg appearance-none cursor-pointer slider"
            />
            <div className="flex justify-between text-sm text-dark-muted mt-1">
              <span>City View (8)</span>
              <span>Current: {preferences.default_zoom}</span>
              <span>Street View (16)</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto-center on accidents</div>
              <div className="text-sm text-dark-muted">Automatically center map when selecting accidents</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-dark-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-tesla-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tesla-blue"></div>
            </label>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      {/* Notification Preferences */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Bell className="w-5 h-5" />
          <span>Notification Preferences</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">New Accidents</div>
              <div className="text-sm text-dark-muted">Get notified when new accidents are reported</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={preferences.notifications}
                onChange={(e) => onPreferencesChange({ notifications: e.target.checked })}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-dark-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-tesla-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tesla-blue"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">System Updates</div>
              <div className="text-sm text-dark-muted">Notifications about system maintenance and updates</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-dark-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-tesla-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tesla-blue"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Weekly Reports</div>
              <div className="text-sm text-dark-muted">Receive weekly summary reports via email</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" className="sr-only peer" />
              <div className="w-11 h-6 bg-dark-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-tesla-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tesla-blue"></div>
            </label>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      {/* Data Management */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Database className="w-5 h-5" />
          <span>Data Management</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Auto-refresh Data</div>
              <div className="text-sm text-dark-muted">Automatically update accident data every 15 minutes</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                checked={preferences.auto_refresh}
                onChange={(e) => onPreferencesChange({ auto_refresh: e.target.checked })}
                className="sr-only peer" 
              />
              <div className="w-11 h-6 bg-dark-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-tesla-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tesla-blue"></div>
            </label>
          </div>
          
          <div className="pt-4 border-t border-dark-border">
            <button className="w-full btn-tesla-primary flex items-center justify-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export All Data</span>
            </button>
            <p className="text-xs text-dark-muted mt-2 text-center">
              Download a complete copy of your data in JSON format
            </p>
          </div>
        </div>
      </motion.div>

      {/* Privacy Settings */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center space-x-2">
          <Shield className="w-5 h-5" />
          <span>Privacy</span>
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Analytics Tracking</div>
              <div className="text-sm text-dark-muted">Help improve the platform by sharing usage data</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" defaultChecked className="sr-only peer" />
              <div className="w-11 h-6 bg-dark-border peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-tesla-blue/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-tesla-blue"></div>
            </label>
          </div>
        </div>
      </motion.div>
    </div>
  );

  const renderSystemSettings = () => (
    <div className="space-y-6">
      {/* System Information */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4">System Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-muted">Version:</span>
              <span className="font-mono">2.0.0</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-muted">Build:</span>
              <span className="font-mono">2024.01.15</span>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-muted">Environment:</span>
              <span className="font-mono">Production</span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-dark-muted">API Status:</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-tesla-green rounded-full" />
                <span className="text-tesla-green">Online</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-muted">Database:</span>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-tesla-green rounded-full" />
                <span className="text-tesla-green">Connected</span>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-dark-muted">Last Update:</span>
              <span className="font-mono">2 min ago</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Actions */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4">System Actions</h3>
        <div className="space-y-3">
          <button className="w-full btn-tesla flex items-center justify-center space-x-2">
            <Wifi className="w-4 h-4" />
            <span>Test Connection</span>
          </button>
          <button className="w-full btn-tesla flex items-center justify-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Download Logs</span>
          </button>
          <button className="w-full btn-tesla-danger flex items-center justify-center space-x-2">
            <Database className="w-4 h-4" />
            <span>Reset Settings</span>
          </button>
        </div>
      </motion.div>
    </div>
  );

  const renderCurrentSection = () => {
    switch (activeSection) {
      case 'map': return renderMapSettings();
      case 'notifications': return renderNotificationSettings();
      case 'data': return renderDataSettings();
      case 'system': return renderSystemSettings();
      default: return renderAppearanceSettings();
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full bg-dark-bg">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3"
      >
        <SettingsIcon className="w-8 h-8 text-tesla-blue" />
        <div>
          <h1 className="text-3xl font-bold text-gradient">Settings</h1>
          <p className="text-dark-muted">Customize your AVAT experience</p>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1"
        >
          <div className="card-tesla">
            <nav className="space-y-1">
              {sections.map((section) => {
                const Icon = section.icon;
                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all text-left ${
                      activeSection === section.id
                        ? 'bg-tesla-blue/20 text-tesla-blue'
                        : 'hover:bg-dark-card/50 text-dark-muted hover:text-white'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">{section.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-3"
        >
          {renderCurrentSection()}
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;
