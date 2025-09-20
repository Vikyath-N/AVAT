import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  Car, 
  MapPin, 
  AlertTriangle,
  Clock,
  Filter,
  Download,
  Calendar,
  BarChart3
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap
} from 'recharts';
import { UserPreferences } from '../types';

interface AnalyticsProps {
  preferences: UserPreferences;
}

const Analytics: React.FC<AnalyticsProps> = ({ preferences }) => {
  const [selectedView, setSelectedView] = useState('overview');
  const [timeRange, setTimeRange] = useState('6m');

  // Mock data for comprehensive analytics
  const vehicleModelData = [
    { model: 'Model 3', make: 'Tesla', accidents: 23, miles: 50000, rate: 0.46 },
    { model: 'Pacifica', make: 'Chrysler', accidents: 49, miles: 120000, rate: 0.41 },
    { model: 'Bolt', make: 'Chevrolet', accidents: 41, miles: 95000, rate: 0.43 },
    { model: 'Model Y', make: 'Tesla', accidents: 12, miles: 25000, rate: 0.48 },
    { model: 'i-Pace', make: 'Jaguar', accidents: 8, miles: 18000, rate: 0.44 }
  ];

  const intersectionAnalysis = [
    { type: 'Traffic Light', accidents: 156, severity: 2.3, peakHour: '5-6 PM' },
    { type: 'Stop Sign', accidents: 89, severity: 1.8, peakHour: '8-9 AM' },
    { type: 'Roundabout', accidents: 23, severity: 3.1, peakHour: '12-1 PM' },
    { type: 'Highway Merge', accidents: 67, severity: 3.8, peakHour: '7-8 AM' },
    { type: 'Residential', accidents: 134, severity: 1.2, peakHour: '3-4 PM' }
  ];

  const cityTypeAnalysis = [
    { type: 'Urban', accidents: 234, population: 500000, rate: 0.47, avgSeverity: 2.1 },
    { type: 'Suburban', accidents: 189, population: 300000, rate: 0.63, avgSeverity: 1.8 },
    { type: 'Rural', accidents: 45, population: 100000, rate: 0.45, avgSeverity: 2.5 }
  ];

  const damagePatterns = [
    { location: 'Front End', frequency: 234, scenarios: ['Rear-end collision', 'Intersection crash'] },
    { location: 'Side Impact', frequency: 156, scenarios: ['Lane change', 'Intersection'] },
    { location: 'Rear End', frequency: 89, scenarios: ['Following too close', 'Sudden stop'] },
    { location: 'Multiple Areas', frequency: 67, scenarios: ['High-speed crash', 'Rollover'] }
  ];

  const temporalPatterns = [
    { hour: 6, accidents: 12, weather: 'Clear' },
    { hour: 7, accidents: 28, weather: 'Clear' },
    { hour: 8, accidents: 45, weather: 'Clear' },
    { hour: 9, accidents: 34, weather: 'Clear' },
    { hour: 10, accidents: 23, weather: 'Clear' },
    { hour: 11, accidents: 19, weather: 'Cloudy' },
    { hour: 12, accidents: 31, weather: 'Cloudy' },
    { hour: 13, accidents: 28, weather: 'Clear' },
    { hour: 14, accidents: 33, weather: 'Clear' },
    { hour: 15, accidents: 41, weather: 'Clear' },
    { hour: 16, accidents: 52, weather: 'Clear' },
    { hour: 17, accidents: 67, weather: 'Clear' },
    { hour: 18, accidents: 58, weather: 'Clear' },
    { hour: 19, accidents: 39, weather: 'Clear' },
    { hour: 20, accidents: 25, weather: 'Clear' },
    { hour: 21, accidents: 18, weather: 'Clear' },
    { hour: 22, accidents: 14, weather: 'Clear' },
    { hour: 23, accidents: 9, weather: 'Clear' }
  ];

  const riskFactorData = [
    { factor: 'Weather', clear: 85, rain: 65, fog: 45, snow: 25 },
    { factor: 'Time', morning: 70, afternoon: 85, evening: 75, night: 35 },
    { factor: 'Traffic', light: 90, moderate: 70, heavy: 45, congested: 25 },
    { factor: 'Road Type', highway: 60, arterial: 75, residential: 85, rural: 40 }
  ];

  const COLORS = ['#3498db', '#e74c3c', '#f39c12', '#9b59b6', '#1abc9c', '#34495e'];

  const views = [
    { id: 'overview', name: 'Overview', icon: BarChart3 },
    { id: 'vehicles', name: 'Vehicle Analysis', icon: Car },
    { id: 'locations', name: 'Location Analysis', icon: MapPin },
    { id: 'patterns', name: 'Pattern Analysis', icon: TrendingUp },
    { id: 'risk', name: 'Risk Assessment', icon: AlertTriangle }
  ];

  const renderOverview = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Vehicle Model Performance */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4">Vehicle Model Safety Comparison</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={vehicleModelData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis dataKey="model" stroke="#ffffff" fontSize={12} />
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

      {/* City Type Analysis */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4">Accidents by City Type</h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={cityTypeAnalysis}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={5}
              dataKey="accidents"
            >
              {cityTypeAnalysis.map((entry, index) => (
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
        <div className="flex justify-center gap-4 mt-4">
          {cityTypeAnalysis.map((item, index) => (
            <div key={item.type} className="flex items-center space-x-2">
              <div 
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-dark-muted">{item.type}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Temporal Patterns */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="card-tesla lg:col-span-2"
      >
        <h3 className="text-lg font-semibold mb-4">Hourly Accident Distribution</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={temporalPatterns}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis dataKey="hour" stroke="#ffffff" fontSize={12} />
            <YAxis stroke="#ffffff" fontSize={12} />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                color: '#ffffff'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="accidents" 
              stroke="#3498db" 
              strokeWidth={2}
              dot={{ fill: '#3498db', strokeWidth: 2, r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );

  const renderVehicleAnalysis = () => (
    <div className="space-y-6">
      {/* Vehicle Safety Metrics */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4">Vehicle Safety Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-dark-border">
                <th className="text-left py-3 px-4">Make & Model</th>
                <th className="text-left py-3 px-4">Total Accidents</th>
                <th className="text-left py-3 px-4">Miles Driven</th>
                <th className="text-left py-3 px-4">Accident Rate</th>
                <th className="text-left py-3 px-4">Safety Score</th>
              </tr>
            </thead>
            <tbody>
              {vehicleModelData.map((vehicle, index) => (
                <tr key={vehicle.model} className="border-b border-dark-border/50 hover:bg-dark-card/30">
                  <td className="py-3 px-4">
                    <div>
                      <div className="font-medium">{vehicle.make} {vehicle.model}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">{vehicle.accidents}</td>
                  <td className="py-3 px-4">{vehicle.miles.toLocaleString()}</td>
                  <td className="py-3 px-4">{vehicle.rate}/1000 miles</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-16 h-2 bg-dark-border rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-accent-danger via-accent-warning to-accent-success"
                          style={{ width: `${(1 - vehicle.rate) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm">{((1 - vehicle.rate) * 100).toFixed(0)}%</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Damage Pattern Analysis */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4">Damage Location Patterns</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {damagePatterns.map((pattern, index) => (
            <div key={pattern.location} className="bg-dark-card/30 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium">{pattern.location}</h4>
                <span className="text-lg font-bold text-tesla-blue">{pattern.frequency}</span>
              </div>
              <div className="space-y-1">
                {pattern.scenarios.map((scenario, idx) => (
                  <div key={idx} className="text-sm text-dark-muted">• {scenario}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderLocationAnalysis = () => (
    <div className="space-y-6">
      {/* Intersection Analysis */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4">Most Problematic Intersection Types</h3>
        <ResponsiveContainer width="100%" height={400}>
          <ScatterChart data={intersectionAnalysis}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3a3a3a" />
            <XAxis dataKey="accidents" stroke="#ffffff" fontSize={12} name="Accidents" />
            <YAxis dataKey="severity" stroke="#ffffff" fontSize={12} name="Avg Severity" />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                color: '#ffffff'
              }}
              cursor={{ strokeDasharray: '3 3' }}
            />
            <Scatter dataKey="accidents" fill="#3498db" />
          </ScatterChart>
        </ResponsiveContainer>
      </motion.div>

      {/* City Type Comparison */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4">City Type Risk Assessment</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {cityTypeAnalysis.map((city, index) => (
            <div key={city.type} className="bg-dark-card/30 rounded-lg p-6 text-center">
              <div className="text-2xl font-bold mb-2" style={{ color: COLORS[index] }}>
                {city.accidents}
              </div>
              <div className="text-lg font-medium mb-4">{city.type} Areas</div>
              <div className="space-y-2 text-sm text-dark-muted">
                <div>Population: {city.population.toLocaleString()}</div>
                <div>Rate: {city.rate} per 1000</div>
                <div>Avg Severity: {city.avgSeverity}/5</div>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );

  const renderRiskAssessment = () => (
    <div className="space-y-6">
      {/* Risk Factor Analysis */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card-tesla"
      >
        <h3 className="text-lg font-semibold mb-4">Risk Factor Analysis</h3>
        <ResponsiveContainer width="100%" height={400}>
          <RadarChart data={riskFactorData}>
            <PolarGrid stroke="#3a3a3a" />
            <PolarAngleAxis dataKey="factor" tick={{ fill: '#ffffff', fontSize: 12 }} />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 100]} 
              tick={{ fill: '#ffffff', fontSize: 10 }}
            />
            <Radar
              name="Clear/Light"
              dataKey="clear"
              stroke="#3498db"
              fill="#3498db"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Radar
              name="Adverse Conditions"
              dataKey="rain"
              stroke="#e74c3c"
              fill="#e74c3c"
              fillOpacity={0.1}
              strokeWidth={2}
            />
            <Tooltip 
              contentStyle={{
                backgroundColor: '#1a1a1a',
                border: '1px solid #3a3a3a',
                borderRadius: '8px',
                color: '#ffffff'
              }}
            />
          </RadarChart>
        </ResponsiveContainer>
      </motion.div>
    </div>
  );

  const renderCurrentView = () => {
    switch (selectedView) {
      case 'vehicles': return renderVehicleAnalysis();
      case 'locations': return renderLocationAnalysis();
      case 'patterns': return renderOverview();
      case 'risk': return renderRiskAssessment();
      default: return renderOverview();
    }
  };

  return (
    <div className="p-6 space-y-6 overflow-y-auto h-full bg-dark-bg">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-gradient mb-2">
            Advanced Analytics
          </h1>
          <p className="text-dark-muted">
            Deep dive analysis of autonomous vehicle accident patterns and trends
          </p>
        </div>
        
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <select 
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="bg-dark-card border border-dark-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-tesla-blue"
          >
            <option value="1m">Last Month</option>
            <option value="3m">Last 3 Months</option>
            <option value="6m">Last 6 Months</option>
            <option value="1y">Last Year</option>
            <option value="all">All Time</option>
          </select>
          
          <button className="btn-tesla-primary flex items-center space-x-2">
            <Download className="w-4 h-4" />
            <span>Export</span>
          </button>
        </div>
      </motion.div>

      {/* View Selector */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-wrap gap-2"
      >
        {views.map((view) => {
          const Icon = view.icon;
          return (
            <button
              key={view.id}
              onClick={() => setSelectedView(view.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-all ${
                selectedView === view.id
                  ? 'border-tesla-blue bg-tesla-blue/20 text-tesla-blue'
                  : 'border-dark-border hover:border-dark-muted text-dark-muted hover:text-white'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm font-medium">{view.name}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Content */}
      <div className="min-h-0">
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default Analytics;
