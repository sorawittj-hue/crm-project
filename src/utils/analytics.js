/**
 * Page Analytics Module
 * 
 * Provides comprehensive analytics tracking including:
 * - Page views
 * - Custom events
 * - Performance metrics
 * - User behavior tracking
 */

// Analytics event types
export const AnalyticsEvents = {
  // Page views
  PAGE_VIEW: 'page_view',
  
  // User actions
  CLICK: 'click',
  NAVIGATION: 'navigation',
  
  // Deal actions
  DEAL_CREATED: 'deal_created',
  DEAL_UPDATED: 'deal_updated',
  DEAL_DELETED: 'deal_deleted',
  DEAL_STAGE_CHANGED: 'deal_stage_changed',
  DEAL_VALUE_CHANGED: 'deal_value_changed',
  
  // Filter & search
  FILTER_APPLIED: 'filter_applied',
  SEARCH_PERFORMED: 'search_performed',
  SORT_CHANGED: 'sort_changed',
  
  // Data operations
  DATA_EXPORTED: 'data_exported',
  DATA_IMPORTED: 'data_imported',
  BULK_ACTION: 'bulk_action',
  
  // AI features
  AI_ANALYSIS_REQUESTED: 'ai_analysis_requested',
  AI_INSIGHT_GENERATED: 'ai_insight_generated',
  
  // UI interactions
  TAB_CHANGED: 'tab_changed',
  MODAL_OPENED: 'modal_opened',
  MODAL_CLOSED: 'modal_closed',
  DROPDOWN_OPENED: 'dropdown_opened',
  
  // Performance
  PAGE_LOAD: 'page_load',
  API_REQUEST: 'api_request',
  INTERACTION_LATENCY: 'interaction_latency'
};

// Storage key for analytics data
const ANALYTICS_STORAGE_KEY = 'crm_analytics_data';
const SESSION_STORAGE_KEY = 'crm_session_data';

// Analytics data structure
class AnalyticsData {
  constructor() {
    this.pageViews = [];
    this.events = [];
    this.sessions = [];
    this.performance = [];
    this.userBehavior = {
      totalClicks: 0,
      totalInteractions: 0,
      averageSessionDuration: 0,
      bounceRate: 0
    };
  }
}

// Get current session
function getSession() {
  const stored = sessionStorage.getItem(SESSION_STORAGE_KEY);
  if (stored) {
    return JSON.parse(stored);
  }
  
  const newSession = {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    startTime: Date.now(),
    pageViews: 0,
    events: 0,
    entryPage: window.location.pathname
  };
  
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(newSession));
  return newSession;
}

// Update session
function updateSession(session) {
  sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
}

// Load analytics from localStorage
function loadAnalytics() {
  try {
    const stored = localStorage.getItem(ANALYTICS_STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.warn('Failed to load analytics data:', e);
  }
  return new AnalyticsData();
}

// Save analytics to localStorage
function saveAnalytics(data) {
  try {
    localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save analytics data:', e);
  }
}

// Track page view
export function trackPageView(pathname, title = '') {
  const session = getSession();
  const analytics = loadAnalytics();
  
  const pageView = {
    id: `pv_${Date.now()}`,
    sessionId: session.id,
    path: pathname,
    title: title || document.title,
    timestamp: Date.now(),
    referrer: document.referrer || 'direct'
  };
  
  analytics.pageViews.push(pageView);
  session.pageViews++;
  
  // Calculate session duration for previous page
  if (analytics.pageViews.length > 1) {
    const prevPage = analytics.pageViews[analytics.pageViews.length - 2];
    const duration = pageView.timestamp - prevPage.timestamp;
    prevPage.duration = duration;
  }
  
  updateSession(session);
  saveAnalytics(analytics);
  
  // Dispatch custom event for listeners
  window.dispatchEvent(new CustomEvent(AnalyticsEvents.PAGE_VIEW, { detail: pageView }));
  
  return pageView;
}

// Track custom event
export function trackEvent(eventType, payload = {}) {
  const session = getSession();
  const analytics = loadAnalytics();
  
  const event = {
    id: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    sessionId: session.id,
    type: eventType,
    payload,
    timestamp: Date.now(),
    path: window.location.pathname,
    userAgent: navigator.userAgent
  };
  
  analytics.events.push(event);
  session.events++;
  
  // Update user behavior
  analytics.userBehavior.totalInteractions++;
  if (eventType === AnalyticsEvents.CLICK) {
    analytics.userBehavior.totalClicks++;
  }
  
  updateSession(session);
  saveAnalytics(analytics);
  
  // Dispatch custom event for listeners
  window.dispatchEvent(new CustomEvent(eventType, { detail: event }));
  
  return event;
}

// Track performance metric
export function trackPerformance(metricName, value, unit = 'ms', metadata = {}) {
  const session = getSession();
  const analytics = loadAnalytics();
  
  const metric = {
    id: `perf_${Date.now()}`,
    sessionId: session.id,
    name: metricName,
    value,
    unit,
    metadata,
    timestamp: Date.now(),
    path: window.location.pathname
  };
  
  analytics.performance.push(metric);
  saveAnalytics(analytics);
  
  return metric;
}

// Track page load performance
export function trackPageLoad() {
  if (window.performance && window.performance.timing) {
    const timing = window.performance.timing;
    const navigationStart = timing.navigationStart;
    
    const metrics = {
      dnsLookup: timing.domainLookupEnd - timing.domainLookupStart,
      tcpConnection: timing.connectEnd - timing.connectStart,
      sslHandshake: timing.secureConnectionStart ? timing.connectEnd - timing.secureConnectionStart : 0,
      timeToFirstByte: timing.responseStart - navigationStart,
      contentDownload: timing.responseEnd - timing.responseStart,
      domInteractive: timing.domInteractive - navigationStart,
      domContentLoaded: timing.domContentLoadedEventEnd - navigationStart,
      pageLoad: timing.loadEventEnd - navigationStart,
      firstPaint: performance.getEntriesByType('paint')?.find(p => p.name === 'first-paint')?.startTime || 0,
      firstContentfulPaint: performance.getEntriesByType('paint')?.find(p => p.name === 'first-contentful-paint')?.startTime || 0
    };
    
    Object.entries(metrics).forEach(([name, value]) => {
      if (value > 0) {
        trackPerformance(`page_${name}`, value);
      }
    });
    
    return metrics;
  }
  return null;
}

// Get analytics summary
export function getAnalyticsSummary(timeRange = '7d') {
  const analytics = loadAnalytics();
  const now = Date.now();
  const timeRanges = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
    'all': Infinity
  };
  
  const cutoff = now - (timeRanges[timeRange] || timeRanges['7d']);
  
  // Filter data by time range
  const filteredPageViews = analytics.pageViews.filter(pv => pv.timestamp >= cutoff);
  const filteredEvents = analytics.events.filter(e => e.timestamp >= cutoff);
  const filteredPerformance = analytics.performance.filter(p => p.timestamp >= cutoff);
  
  // Calculate metrics
  const pageViewsByPath = filteredPageViews.reduce((acc, pv) => {
    acc[pv.path] = (acc[pv.path] || 0) + 1;
    return acc;
  }, {});
  
  const eventsByType = filteredEvents.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {});
  
  // Calculate average session duration
  const sessionsWithEnd = analytics.sessions.filter(s => s.endTime);
  const avgSessionDuration = sessionsWithEnd.length > 0
    ? sessionsWithEnd.reduce((sum, s) => sum + (s.endTime - s.startTime), 0) / sessionsWithEnd.length
    : 0;
  
  // Calculate bounce rate (sessions with only 1 page view)
  const bouncedSessions = Object.values(analytics.sessions)
    .filter(s => s.pageViews === 1).length;
  const bounceRate = analytics.sessions.length > 0
    ? (bouncedSessions / analytics.sessions.length) * 100
    : 0;
  
  // Calculate average page load time
  const pageLoadMetrics = filteredPerformance.filter(p => p.name === 'page_pageLoad');
  const avgPageLoad = pageLoadMetrics.length > 0
    ? pageLoadMetrics.reduce((sum, p) => sum + p.value, 0) / pageLoadMetrics.length
    : 0;
  
  return {
    timeRange,
    pageViews: {
      total: filteredPageViews.length,
      byPath: pageViewsByPath,
      unique: Object.keys(pageViewsByPath).length
    },
    events: {
      total: filteredEvents.length,
      byType: eventsByType
    },
    performance: {
      avgPageLoad: Math.round(avgPageLoad),
      metrics: filteredPerformance
    },
    sessions: {
      total: analytics.sessions.length,
      avgDuration: Math.round(avgSessionDuration),
      bounceRate: Math.round(bounceRate)
    },
    userBehavior: analytics.userBehavior
  };
}

// Get detailed event log
export function getEventLog(limit = 100, filters = {}) {
  const analytics = loadAnalytics();
  let events = [...analytics.events];
  
  // Apply filters
  if (filters.type) {
    events = events.filter(e => e.type === filters.type);
  }
  if (filters.path) {
    events = events.filter(e => e.path === filters.path);
  }
  if (filters.since) {
    events = events.filter(e => e.timestamp >= filters.since);
  }
  
  // Sort by timestamp descending
  events.sort((a, b) => b.timestamp - a.timestamp);
  
  return events.slice(0, limit);
}

// Get page view history
export function getPageViewHistory(limit = 50) {
  const analytics = loadAnalytics();
  const views = [...analytics.pageViews];
  views.sort((a, b) => b.timestamp - a.timestamp);
  return views.slice(0, limit);
}

// Get performance metrics
export function getPerformanceMetrics(metricName, timeRange = '7d') {
  const analytics = loadAnalytics();
  const now = Date.now();
  const timeRanges = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    'all': Infinity
  };
  
  const cutoff = now - (timeRanges[timeRange] || timeRanges['7d']);
  let metrics = analytics.performance.filter(p => p.timestamp >= cutoff);
  
  if (metricName) {
    metrics = metrics.filter(p => p.name === metricName);
  }
  
  return metrics;
}

// Clear analytics data
export function clearAnalytics() {
  localStorage.removeItem(ANALYTICS_STORAGE_KEY);
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

// Initialize analytics on app start
export function initAnalytics() {
  const analytics = loadAnalytics();
  const session = getSession();
  
  // Track session start
  console.log('[Analytics] Initialized:', {
    sessionId: session.id,
    totalPageViews: analytics.pageViews.length,
    totalEvents: analytics.events.length
  });
  
  // Track page load performance
  if (document.readyState === 'complete') {
    trackPageLoad();
  } else {
    window.addEventListener('load', () => {
      trackPageLoad();
      trackEvent(AnalyticsEvents.PAGE_LOAD, { 
        type: 'complete',
        timestamp: Date.now()
      });
    });
  }
  
  // Track before unload to calculate session duration
  window.addEventListener('beforeunload', () => {
    const currentSession = getSession();
    const analytics = loadAnalytics();
    
    // Update session end time
    currentSession.endTime = Date.now();
    const duration = currentSession.endTime - currentSession.startTime;
    
    // Add to sessions history
    analytics.sessions.push({
      ...currentSession,
      duration
    });
    
    updateSession(currentSession);
    saveAnalytics(analytics);
  });
  
  return { analytics, session };
}

// React Hook for tracking page views
export function usePageTracking() {
  return {
    trackPageView,
    trackEvent,
    trackPerformance
  };
}

// Export AnalyticsEvents for convenience
export default {
  AnalyticsEvents,
  trackPageView,
  trackEvent,
  trackPerformance,
  trackPageLoad,
  getAnalyticsSummary,
  getEventLog,
  getPageViewHistory,
  getPerformanceMetrics,
  clearAnalytics,
  initAnalytics,
  usePageTracking
};
