import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Car, 
  AlertTriangle, 
  MapPin, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Clock,
  Shield,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { UserPreferences } from '../types';

interface DashboardProps {
  preferences: UserPreferences;
}

const Dashboard: React.FC<DashboardProps> = ({ preferences }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [realTimeData, setRealTimeData] = useState({
    totalAccidents: 134,
    newToday: 3,
    trendPercentage: -12.3,
    lastUpdate: new Date()
  });

  // Demo data for GitHub Pages
  const companyData = [
    { name: 'Waymo', accidents: 49, change: -8.2 },
    { name: 'Cruise', accidents: 41, change: -15.1 },
    { name: 'Tesla', accidents: 23, change: +5.3 },
    { name: 'Zoox', accidents: 15, change: -3.7 },
    { name: 'Apple', accidents: 6, change: -25.0 }
  ];

  const cityData = [
    { name: 'San Francisco', accidents: 45, type: 'urban' },
    { name: 'Mountain View', accidents: 32, type: 'suburban' },
    { name: 'Palo Alto', accidents: 18, type: 'suburban' },
    { name: 'Fremont', accidents: 15, type: 'suburban' },
    { name: 'San Jose', accidents: 12, type: 'urban' },
    { name: 'Cupertino', accidents: 8, type: 'suburban' }
  ];

  const intersectionData = [
    { type: 'Traffic Light', count: 67, severity: 'moderate' },
    { type: 'Stop Sign', count: 34, severity: 'minor' },
    { type: 'Roundabout', count: 12, severity: 'severe' },
    { type: 'Highway Merge', count: 15, severity: 'severe' },
    { type: 'Residential', count: 6, severity: 'minor' }
  ];

  const damageLocationData = [
    { location: 'Front', count: 56, percentage: 42 },
    { location: 'Rear', count: 37, percentage: 28 },
    { location: 'Side', count: 21, percentage: 16 },
    { location: 'Multiple', count: 20, percentage: 14 }
  ];

  const timeSeriesData = [
    { month: 'Jul', accidents: 18, waymo: 6, cruise: 5, tesla: 3, others: 4 },
    { month: 'Aug', accidents: 22, waymo: 8, cruise: 6, tesla: 4, others: 4 },
    { month: 'Sep', accidents: 19, waymo: 7, cruise: 5, tesla: 3, others: 4 },
    { month: 'Oct', accidents: 25, waymo: 9, cruise: 7, tesla: 5, others: 4 },
    { month: 'Nov', accidents: 23, waymo: 8, cruise: 6, tesla: 4, others: 5 },
    { month: 'Dec', accidents: 27, waymo: 11, cruise: 8, tesla: 4, others: 4 }
  ];

  const keyMetrics = [
    {
      title: 'Total Accidents',
      value: realTimeData.totalAccidents.toLocaleString(),
      change: realTimeData.trendPercentage,
      icon: AlertTriangle,
      color: 'text-accent-danger',
      bgColor: 'bg-accent-danger/10'
    },
    {
      title: 'Active Companies',
      value: '5',
      change: +8.3,
      icon: Car,
      color: 'text-tesla-blue',
      bgColor: 'bg-tesla-blue/10'
    },
    {
      title: 'Cities Monitored',
      value: '6',
      change: +2.1,
      icon: MapPin,
      color: 'text-tesla-green',
      bgColor: 'bg-tesla-green/10'
    },
    {
      title: 'Avg. Severity Score',
      value: '2.1/5',
      change: -5.8,
      icon: Shield,
      color: 'text-accent-warning',
      bgColor: 'bg-accent-warning/10'
    }
  ];

  const COLORS = ['#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c'];

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setRealTimeData(prev => ({
        ...prev,
        lastUpdate: new Date()
      }));
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full bg-dark-bg">
      {/* Demo Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-dark-card border border-dark-border rounded-lg p-4"
      >
        <div className="flex items-center space-x-3">
          <Zap className="w-5 h-5 text-tesla-blue" />
          <div>
            <p className="text-tesla-blue font-medium">🚀 AVAT Demo Platform</p>
            <p className="text-sm text-dark-muted">
              Showcasing Tesla-inspired UI with California AV accident analysis • Using sample data for demonstration
            </p>
          </div>
        </div>
      </motion.div>

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2">
            AV Accident Dashboard
          </h1>
          <p className="text-dark-muted">
            Real-time analysis of autonomous vehicle incidents across California
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <div className="flex items-center space-x-2 text-sm text-dark-muted">
            <Clock className="w-4 h-4" />
            <span>Last updated: {realTimeData.lastUpdate.toLocaleTimeString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-tesla-green rounded-full animate-pulse" />
            <span className="text-sm text-tesla-green">Live</span>
          </div>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
      >
        {keyMetrics.map((metric, index) => {
          const Icon = metric.icon;
          return (
            <motion.div
              key={metric.title}
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              className="card-tesla relative overflow-hidden"
            >
              <div className={`absolute top-0 right-0 w-16 h-16 ${metric.bgColor} rounded-full -mr-8 -mt-8`} />
              <div className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`w-6 h-6 ${metric.color}`} />
                  </div>
                  <div className="flex items-center space-x-1">
                  {metric.change > 0 ? (
                      <TrendingUp className="w-4 h-4 text-white/80" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-white/80" />
                    )}
                    <span className={`text-sm font-medium text-white/80`}>
                      {Math.abs(metric.change)}%
                    </span>
                  </div>
                </div>
                <div className="text-2xl font-bold mb-1">{metric.value}</div>
                <div className="text-sm text-dark-muted">{metric.title}</div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Company Accidents Chart */}
        <motion.div variants={itemVariants} className="card-tesla">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Accidents by Company</h3>
            <div className="flex items-center space-x-2">
              <Car className="w-5 h-5 text-tesla-blue" />
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={companyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
              <XAxis dataKey="name" stroke="#ffffff" fontSize={12} />
              <YAxis stroke="#ffffff" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Bar dataKey="accidents" fill="#3498db" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Damage Location Pie Chart */}
        <motion.div variants={itemVariants} className="card-tesla">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Damage Locations</h3>
            <Activity className="w-5 h-5 text-tesla-green" />
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={damageLocationData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={5}
                dataKey="count"
              >
                {damageLocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {damageLocationData.map((item, index) => (
              <div key={item.location} className="flex items-center space-x-2">
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-dark-muted">{item.location}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Time Series Chart */}
        <motion.div variants={itemVariants} className="card-tesla lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Accident Trends Over Time</h3>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="bg-dark-card border border-dark-border rounded-lg px-3 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-white"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="3m">Last 3 months</option>
                <option value="6m">Last 6 months</option>
              </select>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <AreaChart data={timeSeriesData}>
              <defs>
                <linearGradient id="colorAccidents" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3498db" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3498db" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
              <XAxis dataKey="month" stroke="#ffffff" fontSize={12} />
              <YAxis stroke="#ffffff" fontSize={12} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: '#1a1a1a',
                  border: '1px solid #3a3a3a',
                  borderRadius: '8px',
                  color: '#ffffff'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="accidents" 
                stroke="#3498db" 
                fillOpacity={1} 
                fill="url(#colorAccidents)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </motion.div>

      {/* Bottom Section - Tables */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 lg:grid-cols-2 gap-6"
      >
        {/* Top Cities */}
        <motion.div variants={itemVariants} className="card-tesla">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Top Accident Cities</h3>
            <MapPin className="w-5 h-5 text-tesla-green" />
          </div>
          <div className="space-y-3">
            {cityData.map((city, index) => (
              <div key={city.name} className="flex items-center justify-between p-3 bg-dark-card/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-tesla-blue/20 rounded-lg flex items-center justify-center text-sm font-bold text-tesla-blue">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{city.name}</div>
                    <div className="text-sm text-dark-muted capitalize">{city.type}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{city.accidents}</div>
                  <div className="text-sm text-dark-muted">accidents</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Intersection Types */}
        <motion.div variants={itemVariants} className="card-tesla">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">Intersection Analysis</h3>
            <Zap className="w-5 h-5 text-accent-warning" />
          </div>
          <div className="space-y-3">
            {intersectionData.map((intersection, index) => (
              <div key={intersection.type} className="flex items-center justify-between p-3 bg-dark-card/30 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${
                    intersection.severity === 'severe' ? 'bg-accent-danger' :
                    intersection.severity === 'moderate' ? 'bg-accent-warning' :
                    'bg-accent-success'
                  }`} />
                  <div>
                    <div className="font-medium">{intersection.type}</div>
                    <div className="text-sm text-dark-muted capitalize">{intersection.severity}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{intersection.count}</div>
                  <div className="text-sm text-dark-muted">accidents</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
