/**
 * Page Analytics Dashboard
 * Displays tracked analytics data including page views, events, and performance metrics
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Eye, Clock, TrendingDown,
  BarChart3, Users, Zap, Download, RefreshCw,
  ArrowUpRight, ArrowDownRight, Monitor
} from 'lucide-react';
import { Card, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Badge } from '../components/ui/Badge';
import {
  ResponsiveContainer, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, PieChart as RechartsPieChart,
  Pie, Cell
} from 'recharts';
import {
  getAnalyticsSummary,
  getEventLog,
  getPageViewHistory
} from '../utils/analytics';
import { cn } from '../lib/utils';

const formatTime = (ms) => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
};

const formatNumber = (num) => new Intl.NumberFormat('th-TH').format(num);

const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#10b981', '#ef4444', '#3b82f6', '#14b8a6'];

// Metric Card Component
const MetricCard = ({ title, value, subValue, icon: Icon, trend, color = "primary" }) => (
  <motion.div
    whileHover={{ scale: 1.02, y: -4 }}
    className={cn(
      "relative overflow-hidden rounded-2xl p-6 backdrop-blur-xl border transition-all duration-300",
      color === "primary" ? "bg-primary/10 border-primary/20" :
        color === "emerald" ? "bg-emerald-500/10 border-emerald-500/20" :
          color === "amber" ? "bg-amber-500/10 border-amber-500/20" :
            color === "rose" ? "bg-rose-500/10 border-rose-500/20" :
              "bg-white/5 border-white/5"
    )}
  >
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-4">
        <div className={cn(
          "w-12 h-12 rounded-xl flex items-center justify-center",
          color === "primary" ? "bg-primary/20 text-primary" :
            color === "emerald" ? "bg-emerald-500/20 text-emerald-500" :
              color === "amber" ? "bg-amber-500/20 text-amber-500" :
                color === "rose" ? "bg-rose-500/20 text-rose-500" :
                  "bg-white/10 text-white"
        )}>
          <Icon size={22} />
        </div>
        {trend !== undefined && (
          <div className={cn(
            "flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-black uppercase tracking-widest",
            trend >= 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-rose-500/20 text-rose-400"
          )}>
            {trend >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(trend)}%
          </div>
        )}
      </div>
      <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.25em] mb-2">{title}</p>
      <h3 className="text-3xl font-black tabular-nums tracking-tighter">{value}</h3>
      {subValue && <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest opacity-50 mt-1">{subValue}</p>}
    </div>
  </motion.div>
);

// Event Log Row
const EventRow = ({ event }) => (
  <motion.tr
    initial={{ opacity: 0, x: -20 }}
    animate={{ opacity: 1, x: 0 }}
    className="border-b border-white/5 hover:bg-white/5 transition-colors"
  >
    <td className="py-3 px-4">
      <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">
        {event.type.replace(/_/g, ' ')}
      </Badge>
    </td>
    <td className="py-3 px-4 text-sm font-medium">{event.path}</td>
    <td className="py-3 px-4 text-xs text-muted-foreground">
      {new Date(event.timestamp).toLocaleString()}
    </td>
    <td className="py-3 px-4">
      <code className="text-[10px] bg-white/5 px-2 py-1 rounded">
        {JSON.stringify(event.payload).slice(0, 50)}...
      </code>
    </td>
  </motion.tr>
);

// Page View Row
const PageViewRow = ({ view }) => (
  <motion.tr
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="border-b border-white/5 hover:bg-white/5 transition-colors"
  >
    <td className="py-3 px-4">
      <div className="flex items-center gap-2">
        <Eye size={14} className="text-muted-foreground" />
        <span className="text-sm font-medium">{view.path}</span>
      </div>
    </td>
    <td className="py-3 px-4 text-xs text-muted-foreground">
      {new Date(view.timestamp).toLocaleString()}
    </td>
    <td className="py-3 px-4 text-sm">
      {view.duration ? formatTime(view.duration) : '-'}
    </td>
    <td className="py-3 px-4 text-xs text-muted-foreground truncate max-w-[200px]">
      {view.referrer}
    </td>
  </motion.tr>
);

export default function PageAnalyticsDashboard() {
  const [timeRange, setTimeRange] = useState('7d');
  const [analytics, setAnalytics] = useState(null);
  const [eventLog, setEventLog] = useState([]);
  const [pageViews, setPageViews] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(() => {
    setIsLoading(true);
    const summary = getAnalyticsSummary(timeRange);
    const events = getEventLog(50);
    const views = getPageViewHistory(30);

    setAnalytics(summary);
    setEventLog(events);
    setPageViews(views);
    setIsLoading(false);
  }, [timeRange]);

  useEffect(() => {
    loadData();

    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [loadData]);

  // Prepare page views by path data for chart
  const pageViewsData = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.pageViews.byPath)
      .map(([path, count]) => ({ name: path, views: count }))
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  }, [analytics]);

  // Prepare events by type data for chart
  const eventsByTypeData = useMemo(() => {
    if (!analytics) return [];
    return Object.entries(analytics.events.byType)
      .map(([type, count]) => ({
        name: type.replace(/_/g, ' ').toUpperCase(),
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
  }, [analytics]);

  // Prepare hourly activity data
  const hourlyActivity = useMemo(() => {
    if (!eventLog.length) return [];

    const hours = {};
    for (let i = 23; i >= 0; i--) {
      const hour = new Date();
      hour.setHours(hour.getHours() - i);
      const key = hour.getHours().toString().padStart(2, '0') + ':00';
      hours[key] = 0;
    }

    eventLog.forEach(event => {
      const date = new Date(event.timestamp);
      const key = date.getHours().toString().padStart(2, '0') + ':00';
      if (Object.prototype.hasOwnProperty.call(hours, key)) {
        hours[key]++;
      }
    });

    return Object.entries(hours).map(([hour, count]) => ({ hour, count }));
  }, [eventLog]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full border-4 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <Activity className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary animate-pulse" size={32} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-[0.5em] text-muted-foreground animate-pulse">Loading Analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-primary/10 via-purple-500/10 to-primary/10 p-6 rounded-[2rem] border border-white/10 backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center shadow-2xl shadow-primary/30">
            <BarChart3 size={28} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">Page Analytics</h1>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-[0.4em] mt-1">User Behavior • Performance • Engagement</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-black/40 rounded-xl p-1 border border-white/10">
            {['24h', '7d', '30d', 'all'].map(range => (
              <button
                key={range}
                onClick={() => setTimeRange(range)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all",
                  timeRange === range ? "bg-primary text-white" : "text-muted-foreground hover:text-white"
                )}
              >
                {range}
              </button>
            ))}
          </div>

          <Button
            onClick={loadData}
            variant="outline"
            className="h-10 w-10 rounded-xl border-white/10 bg-white/5"
          >
            <RefreshCw size={16} />
          </Button>

          <Button
            onClick={() => {
              const data = JSON.stringify({ analytics, eventLog, pageViews }, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `analytics-export-${Date.now()}.json`;
              a.click();
            }}
            className="h-10 px-4 rounded-xl bg-primary font-black uppercase tracking-widest text-[8px]"
          >
            <Download size={14} className="mr-2" />
            Export
          </Button>
        </div>
      </header>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Page Views"
          value={formatNumber(analytics?.pageViews.total || 0)}
          subValue={`${analytics?.pageViews.unique || 0} Unique Pages`}
          icon={Eye}
          color="primary"
        />
        <MetricCard
          title="Total Events"
          value={formatNumber(analytics?.events.total || 0)}
          subValue={`${Object.keys(analytics?.events.byType || {}).length} Event Types`}
          icon={Activity}
          color="emerald"
        />
        <MetricCard
          title="Avg Session Duration"
          value={formatTime(analytics?.sessions.avgDuration || 0)}
          subValue={`${analytics?.sessions.total || 0} Total Sessions`}
          icon={Clock}
          color="amber"
        />
        <MetricCard
          title="Avg Page Load"
          value={formatTime(analytics?.performance.avgPageLoad || 0)}
          subValue={`Bounce Rate: ${analytics?.sessions.bounceRate || 0}%`}
          icon={Zap}
          color="rose"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10">
        {[
          { id: 'overview', label: 'Overview', icon: BarChart3 },
          { id: 'pageviews', label: 'Page Views', icon: Eye },
          { id: 'events', label: 'Event Log', icon: Activity },
          { id: 'performance', label: 'Performance', icon: Zap }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-[9px] font-black uppercase tracking-widest border-b-2 transition-all",
              activeTab === tab.id
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-white"
            )}
          >
            <tab.icon size={14} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Page Views Chart */}
          <Card className="bg-black/20 border-white/5 rounded-2xl p-6 backdrop-blur-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Eye size={16} className="text-primary" /> Top Pages
              </CardTitle>
            </CardHeader>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={pageViewsData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} angle={-45} textAnchor="end" height={60} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                    labelStyle={{ fontSize: 10, fontWeight: 900 }}
                  />
                  <Bar dataKey="views" fill="url(#pageViewGradient)" radius={[8, 8, 0, 0]} />
                  <defs>
                    <linearGradient id="pageViewGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.2} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Events by Type Chart */}
          <Card className="bg-black/20 border-white/5 rounded-2xl p-6 backdrop-blur-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} className="text-emerald-500" /> Events by Type
              </CardTitle>
            </CardHeader>
            <div style={{ height: '280px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={eventsByTypeData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    fontSize={10}
                  >
                    {eventsByTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </Card>

          {/* Hourly Activity */}
          <Card className="bg-black/20 border-white/5 rounded-2xl p-6 backdrop-blur-xl lg:col-span-2">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Clock size={16} className="text-amber-500" /> Hourly Activity (Last 24h)
              </CardTitle>
            </CardHeader>
            <div style={{ height: '200px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={hourlyActivity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 10 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px' }}
                  />
                  <Area type="monotone" dataKey="count" stroke="#f97316" strokeWidth={2} fill="url(#hourlyGradient)" />
                  <defs>
                    <linearGradient id="hourlyGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      )}

      {/* Page Views Tab */}
      {activeTab === 'pageviews' && (
        <Card className="bg-black/20 border-white/5 rounded-2xl p-6 backdrop-blur-xl">
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Eye size={16} className="text-primary" /> Recent Page Views
              </CardTitle>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">
                {pageViews.length} views
              </Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Page</th>
                  <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                  <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Duration</th>
                  <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Referrer</th>
                </tr>
              </thead>
              <tbody>
                {pageViews.map((view, i) => (
                  <PageViewRow key={i} view={view} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Events Tab */}
      {activeTab === 'events' && (
        <Card className="bg-black/20 border-white/5 rounded-2xl p-6 backdrop-blur-xl">
          <CardHeader className="p-0 mb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Activity size={16} className="text-emerald-500" /> Event Log
              </CardTitle>
              <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest">
                {eventLog.length} events
              </Badge>
            </div>
          </CardHeader>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Path</th>
                  <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                  <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Payload</th>
                </tr>
              </thead>
              <tbody>
                {eventLog.map((event, i) => (
                  <EventRow key={i} event={event} />
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && (
        <div className="space-y-6">
          {/* Performance Metrics Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Avg Page Load"
              value={formatTime(analytics?.performance.avgPageLoad || 0)}
              icon={Clock}
              color="primary"
            />
            <MetricCard
              title="Bounce Rate"
              value={`${analytics?.sessions.bounceRate || 0}%`}
              icon={TrendingDown}
              color={analytics?.sessions.bounceRate > 50 ? 'rose' : 'emerald'}
            />
            <MetricCard
              title="Total Sessions"
              value={analytics?.sessions.total || 0}
              icon={Users}
              color="amber"
            />
          </div>

          {/* Performance Metrics Table */}
          <Card className="bg-black/20 border-white/5 rounded-2xl p-6 backdrop-blur-xl">
            <CardHeader className="p-0 mb-6">
              <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                <Monitor size={16} className="text-primary" /> Detailed Performance Metrics
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Metric</th>
                    <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Value</th>
                    <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Path</th>
                    <th className="text-left py-3 px-4 text-[9px] font-black uppercase tracking-widest text-muted-foreground">Timestamp</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics?.performance.metrics?.slice(0, 50).map((metric, i) => (
                    <motion.tr
                      key={i}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    >
                      <td className="py-3 px-4">
                        <code className="text-[10px] font-black uppercase tracking-widest text-primary">
                          {metric.name.replace(/_/g, ' ')}
                        </code>
                      </td>
                      <td className="py-3 px-4">
                        <span className="text-sm font-bold text-emerald-400">
                          {formatTime(metric.value)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {metric.path}
                      </td>
                      <td className="py-3 px-4 text-xs text-muted-foreground">
                        {new Date(metric.timestamp).toLocaleString()}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
