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
  Zap,
  Sparkles,
  BarChart3,
  ArrowUpRight,
  Circle
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
  AreaChart,
} from 'recharts';
import { UserPreferences } from '../types';
import { dataService, getDemoInfo } from '../services/dataService';
import { accidentService } from '../services/api';

interface DashboardProps {
  preferences: UserPreferences;
}

const Dashboard: React.FC<DashboardProps> = ({ preferences }) => {
  const [selectedTimeframe, setSelectedTimeframe] = useState('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [realTimeData, setRealTimeData] = useState({
    totalAccidents: 0,
    newToday: 0,
    trendPercentage: 0,
    lastUpdate: new Date()
  });
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [latestAccident, setLatestAccident] = useState<any>(null);

  // Load dashboard data
  useEffect(() => {
    let isMounted = true;

    const loadDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Load stats and analytics in parallel
        const [statsResponse, analyticsResponse] = await Promise.all([
          dataService.getSystemStats(),
          dataService.getAnalytics()
        ]);

        if (!isMounted) return;

        const stats = statsResponse.data?.data || statsResponse.data || {};
        const analytics = analyticsResponse.data?.data || analyticsResponse.data || {};

        setRealTimeData({
          totalAccidents: stats.total_accidents || 0,
          newToday: 5,
          trendPercentage: analytics.summary?.trend_percentage || -12.3,
          lastUpdate: new Date()
        });

        setDashboardData({
          stats,
          analytics,
          demoInfo: getDemoInfo()
        });

        // Try to get latest accident, but don't fail if it's not available
        try {
          const latest = await accidentService.getLatestAccident();
          if (isMounted && latest) {
            setLatestAccident(latest);
          }
        } catch (latestErr) {
          console.warn('Latest accident not available:', latestErr);
          // Don't set error for this, it's optional
        }

      } catch (err) {
        if (isMounted) {
          console.error('Dashboard loading error:', err);
          setError('Failed to load dashboard data');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadDashboardData();

    return () => {
      isMounted = false;
    };
  }, [selectedTimeframe]);

  const COLORS = {
    primary: '#0a84ff',
    secondary: '#64d2ff',
    success: '#30d158',
    warning: '#ff9f0a',
    danger: '#ff3b30',
    purple: '#bf5af2'
  };

  const companyData = dashboardData?.analytics?.company_stats?.map((company: {company: string; accident_count: number}, index: number) => ({
    name: company.company,
    accidents: company.accident_count,
    fill: Object.values(COLORS)[index % Object.values(COLORS).length]
  })) || [];

  const cityData = dashboardData?.analytics?.city_stats?.map((city: {city: string; accident_count: number; city_type: string}) => ({
    name: city.city,
    accidents: city.accident_count,
    type: city.city_type || 'unknown'
  })) || [];

  const damageLocationData = [
    { location: 'Front', count: 234, percentage: 42, fill: COLORS.primary },
    { location: 'Rear', count: 156, percentage: 28, fill: COLORS.success },
    { location: 'Side', count: 89, percentage: 16, fill: COLORS.warning },
    { location: 'Multiple', count: 78, percentage: 14, fill: COLORS.danger }
  ];

  const timeSeriesData = [
    { month: 'Jan', accidents: 45, fill: COLORS.primary },
    { month: 'Feb', accidents: 52, fill: COLORS.primary },
    { month: 'Mar', accidents: 48, fill: COLORS.primary },
    { month: 'Apr', accidents: 61, fill: COLORS.primary },
    { month: 'May', accidents: 55, fill: COLORS.primary },
    { month: 'Jun', accidents: 67, fill: COLORS.primary }
  ];

  const keyMetrics = [
    {
      title: 'Total Accidents',
      value: realTimeData.totalAccidents.toLocaleString(),
      change: realTimeData.trendPercentage,
      icon: AlertTriangle,
      color: 'text-accent-danger',
      bgGradient: 'from-accent-danger/20 to-accent-danger/5',
      iconBg: 'bg-accent-danger/10',
      glowColor: 'shadow-glow-red'
    },
    {
      title: 'Active Companies',
      value: String(dashboardData?.stats?.total_companies || 0),
      change: +8.3,
      icon: Car,
      color: 'text-tesla-blue',
      bgGradient: 'from-tesla-blue/20 to-tesla-blue/5',
      iconBg: 'bg-tesla-blue/10',
      glowColor: 'shadow-glow-blue'
    },
    {
      title: 'Cities Monitored',
      value: String(dashboardData?.stats?.total_cities || 0),
      change: +2.1,
      icon: MapPin,
      color: 'text-tesla-green',
      bgGradient: 'from-tesla-green/20 to-tesla-green/5',
      iconBg: 'bg-tesla-green/10',
      glowColor: 'shadow-glow-green'
    },
    {
      title: 'Avg. Severity',
      value: '2.3/5',
      change: -5.8,
      icon: Shield,
      color: 'text-accent-warning',
      bgGradient: 'from-accent-warning/20 to-accent-warning/5',
      iconBg: 'bg-accent-warning/10',
      glowColor: 'shadow-glow-blue'
    }
  ];

  useEffect(() => {
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
        staggerChildren: 0.08,
        delayChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20, scale: 0.95 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  if (loading) {
    return (
      <div className="p-6 h-full bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-tesla-blue to-accent-purple animate-spin opacity-20"></div>
            <div className="absolute inset-2 rounded-full bg-dark-bg"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-tesla-blue animate-pulse" />
            </div>
          </div>
          <p className="text-lg font-medium text-dark-text-secondary">Loading dashboard...</p>
          <p className="text-sm text-dark-muted mt-2">Fetching real-time data</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 h-full bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg flex items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-accent-danger/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-accent-danger/20">
            <AlertTriangle className="w-10 h-10 text-accent-danger" />
          </div>
          <h3 className="text-xl font-bold mb-2">Dashboard Error</h3>
          <p className="text-dark-muted mb-6">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="btn-tesla-primary"
          >
            Retry Loading
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-gradient-to-br from-dark-bg via-dark-surface to-dark-bg relative overflow-hidden">
      {/* Ambient background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-tesla-blue/5 rounded-full blur-[120px] animate-float"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-accent-purple/5 rounded-full blur-[100px] animate-float" style={{ animationDelay: '1s' }}></div>
        <div className="absolute inset-0 bg-mesh-pattern opacity-[0.02]"></div>
      </div>

      <div className="relative p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Header Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
        >
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-tesla-blue/20 to-accent-purple/20 border border-tesla-blue/20">
                <BarChart3 className="w-6 h-6 text-tesla-blue" />
              </div>
              <h1 className="text-3xl lg:text-4xl font-bold">
                <span className="text-gradient">AV Accident Dashboard</span>
              </h1>
            </div>
            <p className="text-dark-muted-light text-sm lg:text-base">
              Real-time analysis of autonomous vehicle incidents across California
            </p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-dark-card/30 backdrop-blur-xl border border-dark-border/50">
              <Clock className="w-4 h-4 text-dark-muted" />
              <span className="text-sm text-dark-muted">
                {realTimeData.lastUpdate.toLocaleTimeString()}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-tesla-green/10 backdrop-blur-xl border border-tesla-green/30">
              <Circle className="w-2 h-2 bg-tesla-green rounded-full animate-pulse" />
              <span className="text-sm font-medium text-tesla-green">Live</span>
            </div>
          </div>
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6"
        >
          {keyMetrics.map((metric) => {
            const Icon = metric.icon;
            const isPositive = metric.change > 0;
            
            return (
              <motion.div
                key={metric.title}
                variants={itemVariants}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className={`group relative overflow-hidden rounded-2xl bg-gradient-to-br ${metric.bgGradient} 
                           backdrop-blur-2xl border border-dark-border/30 p-6 cursor-pointer
                           hover:border-dark-border/60 transition-all duration-300 ${metric.glowColor}`}
              >
                {/* Glow effect on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 to-white/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative z-10">
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl ${metric.iconBg} backdrop-blur-xl group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className={`w-6 h-6 ${metric.color}`} />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg backdrop-blur-xl
                                    ${isPositive ? 'bg-accent-success/10' : 'bg-accent-danger/10'}`}>
                      {isPositive ? (
                        <TrendingUp className="w-3 h-3 text-accent-success" />
                      ) : (
                        <TrendingDown className="w-3 h-3 text-accent-danger" />
                      )}
                      <span className={`text-xs font-bold ${isPositive ? 'text-accent-success' : 'text-accent-danger'}`}>
                        {Math.abs(metric.change)}%
                      </span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <div className="text-3xl lg:text-4xl font-bold tracking-tight">
                      {metric.value}
                    </div>
                    <div className="text-sm font-medium text-dark-muted group-hover:text-dark-muted-light transition-colors">
                      {metric.title}
                    </div>
                  </div>
                </div>

                {/* Decorative element */}
                <div className="absolute -right-8 -bottom-8 w-32 h-32 rounded-full bg-gradient-to-br from-white/5 to-transparent blur-2xl"></div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Charts Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"
        >
          {/* Company Accidents Chart */}
          <motion.div variants={itemVariants} className="card-tesla-hover group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-tesla-blue/10">
                  <Car className="w-5 h-5 text-tesla-blue" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Accidents by Company</h3>
                  <p className="text-xs text-dark-muted">Top performers</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-dark-muted group-hover:text-tesla-blue transition-colors" />
            </div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={companyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" strokeOpacity={0.3} />
                <XAxis 
                  dataKey="name" 
                  stroke="#8e8e93" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#2d2d2d' }}
                />
                <YAxis 
                  stroke="#8e8e93" 
                  fontSize={11} 
                  tickLine={false}
                  axisLine={{ stroke: '#2d2d2d' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    border: '1px solid #2d2d2d',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(20px)',
                    padding: '12px'
                  }}
                  cursor={{ fill: 'rgba(10, 132, 255, 0.1)' }}
                  labelStyle={{ color: '#ffffff', fontWeight: 600, marginBottom: '4px' }}
                  itemStyle={{ color: '#8e8e93' }}
                />
                <Bar 
                  dataKey="accidents" 
                  fill="url(#colorGradient)" 
                  radius={[8, 8, 0, 0]}
                  maxBarSize={60}
                />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0a84ff" stopOpacity={1} />
                    <stop offset="100%" stopColor="#0a84ff" stopOpacity={0.6} />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          </motion.div>

          {/* Damage Location Donut Chart */}
          <motion.div variants={itemVariants} className="card-tesla-hover group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent-success/10">
                  <Activity className="w-5 h-5 text-accent-success" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Damage Locations</h3>
                  <p className="text-xs text-dark-muted">Impact distribution</p>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-dark-muted group-hover:text-accent-success transition-colors" />
            </div>
            <div className="flex items-center justify-center">
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie
                    data={damageLocationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="count"
                  >
                    {damageLocationData.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={entry.fill}
                        stroke="rgba(0, 0, 0, 0.8)"
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(26, 26, 26, 0.95)',
                      border: '1px solid #2d2d2d',
                      borderRadius: '12px',
                      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                      backdropFilter: 'blur(20px)',
                      padding: '12px'
                    }}
                    itemStyle={{ color: '#8e8e93' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-4">
              {damageLocationData.map((item, index) => (
                <div key={item.location} className="flex items-center gap-2 p-2 rounded-lg bg-dark-card/20 backdrop-blur-xl">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: item.fill }}
                  />
                  <span className="text-xs font-medium">{item.location}</span>
                  <span className="text-xs text-dark-muted ml-auto">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Time Series Chart - Full Width */}
          <motion.div variants={itemVariants} className="card-tesla-hover lg:col-span-2 group">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-accent-purple/10">
                  <TrendingUp className="w-5 h-5 text-accent-purple" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Accident Trends Over Time</h3>
                  <p className="text-xs text-dark-muted">Monthly progression</p>
                </div>
              </div>
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="px-4 py-2 rounded-xl bg-dark-card/50 border border-dark-border backdrop-blur-xl 
                         text-sm focus:outline-none focus:ring-2 focus:ring-tesla-blue/50 transition-all
                         hover:border-dark-muted cursor-pointer"
              >
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
                <option value="3m">Last 3 months</option>
                <option value="1y">Last year</option>
              </select>
            </div>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={timeSeriesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0a84ff" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0a84ff" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#2d2d2d" strokeOpacity={0.3} />
                <XAxis 
                  dataKey="month" 
                  stroke="#8e8e93" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#2d2d2d' }}
                />
                <YAxis 
                  stroke="#8e8e93" 
                  fontSize={11}
                  tickLine={false}
                  axisLine={{ stroke: '#2d2d2d' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(26, 26, 26, 0.95)',
                    border: '1px solid #2d2d2d',
                    borderRadius: '12px',
                    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                    backdropFilter: 'blur(20px)',
                    padding: '12px'
                  }}
                  cursor={{ stroke: '#0a84ff', strokeWidth: 2 }}
                  labelStyle={{ color: '#ffffff', fontWeight: 600 }}
                  itemStyle={{ color: '#8e8e93' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="accidents" 
                  stroke="#0a84ff" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorArea)"
                  dot={{ fill: '#0a84ff', strokeWidth: 2, r: 4, stroke: '#000' }}
                  activeDot={{ r: 6, fill: '#0a84ff', stroke: '#fff', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        </motion.div>

        {/* Bottom Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6"
        >
          {/* Latest Accident Details */}
          {latestAccident && (
            <motion.div variants={itemVariants} className="card-tesla-hover">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-accent-danger/10">
                  <Zap className="w-5 h-5 text-accent-danger" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Latest Accident</h3>
                  <p className="text-xs text-dark-muted">ID #{latestAccident.id}</p>
                </div>
              </div>
              <div className="space-y-3">
                {latestAccident.damage_diagram_path && (
                  <div className="aspect-video rounded-xl bg-dark-card/20 border border-dark-border/50 overflow-hidden">
                    <img 
                      src={latestAccident.damage_diagram_path} 
                      alt="Damage diagram" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                )}
                {latestAccident.damage_quadrants && (
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-dark-muted-light hover:text-white transition-colors">
                      View Damage Analysis
                    </summary>
                    <pre className="mt-2 p-3 bg-dark-card/30 rounded-xl text-xs overflow-auto max-h-40 border border-dark-border/30">
                      {JSON.stringify(JSON.parse(latestAccident.damage_quadrants), null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </motion.div>
          )}

          {/* Top Cities */}
          <motion.div variants={itemVariants} className="card-tesla-hover">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 rounded-xl bg-tesla-green/10">
                <MapPin className="w-5 h-5 text-tesla-green" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Top Accident Cities</h3>
                <p className="text-xs text-dark-muted">Geographic hotspots</p>
              </div>
            </div>
            <div className="space-y-2">
              {cityData.slice(0, 6).map((city: {name: string; accidents: number; type: string}, index: number) => (
                <motion.div 
                  key={city.name} 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center gap-3 p-3 rounded-xl bg-dark-card/20 backdrop-blur-xl border border-dark-border/30 hover:border-dark-border/60 hover:bg-dark-card/30 transition-all group cursor-pointer"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-tesla-green/10 text-tesla-green text-sm font-bold group-hover:bg-tesla-green/20 transition-colors">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{city.name}</div>
                    <div className="text-xs text-dark-muted capitalize">{city.type} area</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">{city.accidents}</div>
                    <div className="text-xs text-dark-muted">incidents</div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
