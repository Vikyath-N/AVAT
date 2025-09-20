import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Menu, 
  Bell, 
  Settings, 
  User, 
  Search,
  Zap,
  Activity
} from 'lucide-react';
import { UserPreferences } from '../../types';

interface NavbarProps {
  onSidebarToggle: () => void;
  preferences: UserPreferences;
  onPreferencesChange: (preferences: Partial<UserPreferences>) => void;
}

const Navbar: React.FC<NavbarProps> = ({ 
  onSidebarToggle, 
  preferences, 
  onPreferencesChange 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    { id: 1, message: '5 new accidents reported in San Francisco', time: '2 min ago', type: 'warning' },
    { id: 2, message: 'Waymo accident rate decreased by 12%', time: '1 hour ago', type: 'success' },
    { id: 3, message: 'System maintenance scheduled for tonight', time: '3 hours ago', type: 'info' },
  ];

  return (
    <motion.nav 
      initial={{ y: -60 }}
      animate={{ y: 0 }}
      className="bg-dark-surface/80 backdrop-blur-md border-b border-dark-border px-4 py-3 flex items-center justify-between relative z-40"
    >
      {/* Left Section */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onSidebarToggle}
          className="p-2 rounded-lg hover:bg-dark-card transition-colors lg:hidden"
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo and Title */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-gradient-to-br from-tesla-blue to-tesla-green rounded-lg flex items-center justify-center">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="hidden sm:block">
            <h1 className="text-xl font-bold text-gradient">AVAT</h1>
            <p className="text-xs text-dark-muted">Autonomous Vehicle Analysis</p>
          </div>
        </div>
      </div>

      {/* Center Section - Search */}
      <div className="flex-1 max-w-md mx-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-dark-muted" />
          <input
            type="text"
            placeholder="Search accidents, companies, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-dark-card border border-dark-border rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tesla-blue focus:border-transparent placeholder-dark-muted"
          />
        </div>
      </div>

      {/* Right Section */}
      <div className="flex items-center space-x-3">
        {/* Real-time Status */}
        <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 bg-dark-card rounded-lg">
          <div className="w-2 h-2 bg-tesla-green rounded-full animate-pulse" />
          <span className="text-xs text-dark-muted">Live</span>
        </div>

        {/* System Status */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-dark-card transition-colors relative"
          title="System Status"
        >
          <Activity className="w-5 h-5 text-tesla-green" />
        </motion.button>

        {/* Notifications */}
        <div className="relative">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-lg hover:bg-dark-card transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-3 h-3 bg-tesla-red rounded-full text-xs flex items-center justify-center text-white">
                {notifications.length}
              </span>
            )}
          </motion.button>

          {/* Notifications Dropdown */}
          {showNotifications && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="absolute right-0 top-12 w-80 bg-dark-surface border border-dark-border rounded-lg shadow-tesla z-50"
            >
              <div className="p-4 border-b border-dark-border">
                <h3 className="font-semibold">Notifications</h3>
              </div>
              <div className="max-h-64 overflow-y-auto">
                {notifications.map((notification) => (
                  <div key={notification.id} className="p-4 border-b border-dark-border/50 hover:bg-dark-card/50">
                    <div className="flex items-start space-x-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${
                        notification.type === 'warning' ? 'bg-accent-warning' :
                        notification.type === 'success' ? 'bg-accent-success' :
                        'bg-accent-info'
                      }`} />
                      <div className="flex-1">
                        <p className="text-sm">{notification.message}</p>
                        <p className="text-xs text-dark-muted mt-1">{notification.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <div className="p-3 text-center">
                <button className="text-sm text-tesla-blue hover:underline">
                  View All Notifications
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Settings */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-dark-card transition-colors"
          title="Settings"
        >
          <Settings className="w-5 h-5" />
        </motion.button>

        {/* User Profile */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-lg hover:bg-dark-card transition-colors"
          title="User Profile"
        >
          <User className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.nav>
  );
};

export default Navbar;
