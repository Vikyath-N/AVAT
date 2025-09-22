import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from 'react-query';
import { Toaster } from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

// Components
import Navbar from './components/layout/Navbar';
import Sidebar from './components/layout/Sidebar';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

// Pages
import Dashboard from './pages/DashboardDemo';
import MapView from './pages/MapViewDemo';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';

// Hooks and Utils
import { useLocalStorage } from './hooks/useLocalStorage';
import { UserPreferences } from './types';

// Create React Query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
    },
  },
});

const defaultPreferences: UserPreferences = {
  theme: 'dark',
  map_style: 'mapbox://styles/mapbox/dark-v11',
  default_zoom: 10,
  auto_refresh: true,
  notifications: true,
};

function App() {
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    'user_preferences',
    defaultPreferences
  );
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate initial app loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Apply theme to document
    document.documentElement.className = preferences.theme;
  }, [preferences.theme]);

  const updatePreferences = (newPreferences: Partial<UserPreferences>) => {
    setPreferences(prev => ({ ...prev, ...newPreferences }));
  };

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <div className="min-h-screen bg-dark-bg text-dark-text">
            {/* Background Pattern */}
            <div className="fixed inset-0 bg-mesh-pattern opacity-5 pointer-events-none" />
            
            {/* Main Layout */}
            <div className="relative flex min-h-screen overflow-hidden">
              {/* Sidebar */}
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ x: -300 }}
                    animate={{ x: 0 }}
                    exit={{ x: -300 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                    className="fixed inset-y-0 left-0 z-50 w-64 lg:relative lg:translate-x-0"
                  >
                    <Sidebar 
                      onClose={() => setSidebarOpen(false)}
                      preferences={preferences}
                      onPreferencesChange={updatePreferences}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Main Content */}
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Navigation */}
                <Navbar
                  onSidebarToggle={() => setSidebarOpen(!sidebarOpen)}
                  preferences={preferences}
                  onPreferencesChange={updatePreferences}
                />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                  <Routes>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route 
                      path="/dashboard" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Dashboard preferences={preferences} />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/map" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ duration: 0.5 }}
                        >
                          <MapView preferences={preferences} />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/analytics" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Analytics preferences={preferences} />
                        </motion.div>
                      } 
                    />
                    <Route 
                      path="/settings" 
                      element={
                        <motion.div
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5 }}
                        >
                          <Settings 
                            preferences={preferences}
                            onPreferencesChange={updatePreferences}
                          />
                        </motion.div>
                      } 
                    />
                  </Routes>
                </main>
              </div>
            </div>

            {/* Overlay for mobile sidebar */}
            <AnimatePresence>
              {sidebarOpen && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/50 z-40 lg:hidden"
                  onClick={() => setSidebarOpen(false)}
                />
              )}
            </AnimatePresence>

            {/* Toast Notifications */}
            <Toaster
              position="top-right"
              toastOptions={{
                duration: 4000,
                style: {
                  background: '#1a1a1a',
                  color: '#ffffff',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  fontSize: '14px',
                },
                success: {
                  iconTheme: {
                    primary: '#00ff41',
                    secondary: '#1a1a1a',
                  },
                },
                error: {
                  iconTheme: {
                    primary: '#cc0000',
                    secondary: '#1a1a1a',
                  },
                },
              }}
            />
          </div>
        </Router>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
