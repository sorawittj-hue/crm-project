# Page Analytics Implementation Guide

## Overview

Comprehensive page analytics tracking has been implemented for the CRM application. This includes:

- **Page View Tracking**: Automatic tracking of all page visits
- **Event Tracking**: User interactions, clicks, and actions
- **Performance Metrics**: Page load times and interaction latency
- **User Behavior**: Session duration, bounce rate, user flows
- **Custom Event Tracking**: Deal actions, filter usage, exports

## Files Added/Modified

### New Files

1. **`src/utils/analytics.js`**
   - Core analytics utility module
   - Functions: `trackPageView`, `trackEvent`, `trackPerformance`, `getAnalyticsSummary`
   - LocalStorage-based data persistence
   - Session management

2. **`src/hooks/useAnalytics.jsx`**
   - React hooks for analytics tracking
   - `usePageViewTracking`: Auto-track page views on route changes
   - `useEventTracker`: Custom event tracking hook
   - `useInteractionLatency`: Performance tracking

3. **`src/hooks/useAnalyticsTracker.js`**
   - Pre-configured event tracking functions
   - Deal actions, filters, AI features, UI interactions

4. **`src/pages/PageAnalyticsDashboard.jsx`**
   - Visual dashboard for analytics data
   - Page views, events, performance metrics
   - Charts and real-time data visualization

### Modified Files

1. **`src/App.jsx`**
   - Added `AnalyticsTracker` component for automatic page view tracking
   - Added `/page-analytics` route

2. **`src/components/layout/AppLayout.jsx`**
   - Added "Page Analytics" navigation item

3. **`src/hooks/useDeals.js`**
   - Added tracking for deal CRUD operations

4. **`src/pages/AnalyticsPage.jsx`**
   - Added tracking for AI analysis, time range changes, tab changes, exports

## Usage

### Automatic Page View Tracking

Page views are automatically tracked on every route change via the `AnalyticsTracker` component in `App.jsx`.

### Manual Event Tracking

```javascript
import { trackEvent, AnalyticsEvents } from '../utils/analytics';

// Track a custom event
trackEvent(AnalyticsEvents.CLICK, {
  elementName: 'submit_button',
  context: { page: 'dashboard' }
});
```

### Using the Analytics Tracker Hook

```javascript
import { useAnalyticsTracker } from '../hooks/useAnalyticsTracker';

function MyComponent() {
  const analytics = useAnalyticsTracker();

  const handleClick = () => {
    analytics.trackClick('my_button');
    analytics.trackDealCreated({ id: 1, value: 10000 });
    analytics.trackFilterApplied('status', 'active');
  };

  return <button onClick={handleClick}>Click Me</button>;
}
```

### Getting Analytics Summary

```javascript
import { getAnalyticsSummary } from '../utils/analytics';

// Get summary for last 7 days
const summary = getAnalyticsSummary('7d');
// Returns: pageViews, events, performance, sessions, userBehavior

// Get summary for last 24 hours
const todaySummary = getAnalyticsSummary('24h');
```

### Performance Tracking

```javascript
import { trackPerformance, trackPageLoad } from '../utils/analytics';

// Track page load (automatic)
trackPageLoad();

// Track custom performance metric
const startTime = Date.now();
// ... some operation
trackPerformance('api_call', Date.now() - startTime);
```

## Analytics Events

Available event types in `AnalyticsEvents`:

### Page Views
- `PAGE_VIEW`: Page navigation
- `NAVIGATION`: Route changes

### Deal Actions
- `DEAL_CREATED`: New deal created
- `DEAL_UPDATED`: Deal modified
- `DEAL_DELETED`: Deal removed
- `DEAL_STAGE_CHANGED`: Stage transition
- `DEAL_VALUE_CHANGED`: Value update

### Filters & Search
- `FILTER_APPLIED`: Filter changed
- `SEARCH_PERFORMED`: Search executed
- `SORT_CHANGED`: Sort order changed

### Data Operations
- `DATA_EXPORTED`: Data export
- `DATA_IMPORTED`: Data import
- `BULK_ACTION`: Bulk operations

### AI Features
- `AI_ANALYSIS_REQUESTED`: AI analysis triggered
- `AI_INSIGHT_GENERATED`: AI insight created

### UI Interactions
- `TAB_CHANGED`: Tab switch
- `MODAL_OPENED` / `MODAL_CLOSED`: Modal interactions
- `DROPDOWN_OPENED`: Dropdown opened
- `CLICK`: Generic click

### Performance
- `PAGE_LOAD`: Page load complete
- `API_REQUEST`: API call
- `INTERACTION_LATENCY`: User interaction time

## Page Analytics Dashboard

Access the analytics dashboard at `/page-analytics` or via the sidebar navigation.

### Features

- **Time Range Selection**: 24h, 7d, 30d, all time
- **Key Metrics**: Page views, events, session duration, bounce rate
- **Charts**: 
  - Top pages by views
  - Events by type (pie chart)
  - Hourly activity heatmap
- **Tabs**:
  - Overview: Summary charts and metrics
  - Page Views: Detailed page view log
  - Event Log: Complete event history
  - Performance: Performance metrics breakdown
- **Export**: Download analytics data as JSON

## Data Storage

- **LocalStorage**: Long-term analytics data storage
- **SessionStorage**: Current session data
- **Auto-cleanup**: Old data managed automatically

## Performance Considerations

- Analytics tracking is asynchronous and non-blocking
- Data is batched and persisted efficiently
- Page load tracking uses native Performance API
- Minimal impact on application performance

## Future Enhancements

Potential improvements:

1. Integration with external analytics services (Google Analytics, Mixpanel)
2. Real-time analytics streaming
3. User segmentation and cohort analysis
4. Funnel analysis for conversion tracking
5. A/B testing support
6. Custom dashboard builder
7. Automated insights and alerts
