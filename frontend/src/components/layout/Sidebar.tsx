import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  X, 
  BarChart3, 
  Map, 
  Activity, 
  Settings,
  Car,
  AlertTriangle,
  TrendingUp,
  MapPin,
  Database,
  Zap
} from 'lucide-react';
import { UserPreferences } from '../../types';

interface SidebarProps {
  onClose: () => void;
  preferences: UserPreferences;
  onPreferencesChange: (preferences: Partial<UserPreferences>) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose, preferences }) => {
  const location = useLocation();

  const navigationItems = [
    {
      name: 'Dashboard',
      path: '/dashboard',
      icon: BarChart3,
      description: 'Overview & Key Metrics'
    },
    {
      name: 'Map View',
      path: '/map',
      icon: Map,
      description: 'Geographic Analysis'
    },
    {
      name: 'Analytics',
      path: '/analytics',
      icon: Activity,
      description: 'Deep Dive Analysis'
    },
    {
      name: 'Settings',
      path: '/settings',
      icon: Settings,
      description: 'App Configuration'
    }
  ];

  const quickStats = [
    { label: 'Total Accidents', value: '1,247', icon: AlertTriangle, color: 'text-accent-danger' },
    { label: 'Active Companies', value: '12', icon: Car, color: 'text-tesla-blue' },
    { label: 'Cities Tracked', value: '45', icon: MapPin, color: 'text-tesla-green' },
    { label: 'Data Points', value: '15.2K', icon: Database, color: 'text-accent-purple' }
  ];

  return (
    <motion.div
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      exit={{ x: -300 }}
      className="bg-dark-surface border-r border-dark-border h-full w-64 flex flex-col relative"
    >
      {/* Header */}
      <div className="p-6 border-b border-dark-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-tesla-blue to-tesla-green rounded-lg flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gradient">AVAT</h2>
              <p className="text-xs text-dark-muted">Analysis Platform</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-dark-card transition-colors lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 1024 && onClose()}
              className={({ isActive }) =>
                `group flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-tesla-blue/20 text-tesla-blue border border-tesla-blue/30'
                    : 'hover:bg-dark-card text-dark-muted hover:text-white'
                }`
              }
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-tesla-blue' : 'group-hover:text-white'}`} />
              <div className="flex-1">
                <div className={`font-medium ${isActive ? 'text-tesla-blue' : 'group-hover:text-white'}`}>
                  {item.name}
                </div>
                <div className="text-xs text-dark-muted group-hover:text-dark-muted">
                  {item.description}
                </div>
              </div>
              {isActive && (
                <motion.div
                  layoutId="sidebar-indicator"
                  className="w-1 h-6 bg-tesla-blue rounded-full"
                />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Quick Stats */}
      <div className="p-4 border-t border-dark-border">
        <h3 className="text-sm font-semibold text-dark-muted mb-3 uppercase tracking-wide">
          Quick Stats
        </h3>
        <div className="space-y-3">
          {quickStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                whileHover={{ scale: 1.02 }}
                className="flex items-center space-x-3 p-2 rounded-lg hover:bg-dark-card/50 transition-colors"
              >
                <div className={`p-2 rounded-lg bg-dark-card ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-sm">{stat.value}</div>
                  <div className="text-xs text-dark-muted">{stat.label}</div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Status Indicator */}
      <div className="p-4 border-t border-dark-border">
        <div className="flex items-center space-x-3 p-3 bg-dark-card/30 rounded-lg">
          <div className="w-3 h-3 bg-tesla-green rounded-full animate-pulse" />
          <div className="flex-1">
            <div className="text-sm font-medium">System Status</div>
            <div className="text-xs text-dark-muted">All systems operational</div>
          </div>
          <TrendingUp className="w-4 h-4 text-tesla-green" />
        </div>
      </div>

      {/* Version Info */}
      <div className="p-4 text-center">
        <div className="text-xs text-dark-muted">
          Version 2.0.0 • Built with ❤️
        </div>
      </div>
    </motion.div>
  );
};

export default Sidebar;
