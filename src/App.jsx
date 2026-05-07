import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// Components (not lazy — always needed)
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/layout/ErrorBoundary';
import ProtectedRoute from './components/layout/ProtectedRoute';
import SkeletonLoader from './components/ui/SkeletonLoader';

// Pages — lazy-loaded so each page only loads when visited
const LoginPage = lazy(() => import('./pages/LoginPage'));
const CommandCenterPage = lazy(() => import('./pages/CommandCenterPage'));
const PipelinePage = lazy(() => import('./pages/PipelinePage'));
const CustomersPage = lazy(() => import('./pages/CustomersPage'));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage'));
const ToolsPage = lazy(() => import('./pages/ToolsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

// DevTools — only imported in development, excluded from production bundle by Vite
const DevTools = import.meta.env.DEV
  ? lazy(() =>
      import('@tanstack/react-query-devtools').then((m) => ({
        default: m.ReactQueryDevtools,
      }))
    )
  : null;

// Configure QueryClient with sensible defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

const PageFallback = () => (
  <div className="p-6">
    <SkeletonLoader />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Suspense fallback={<PageFallback />}>
            <Routes>
              {/* Public route */}
              <Route path="/login" element={<LoginPage />} />

              {/* Protected routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<Navigate replace to="/command" />} />
                <Route path="command" element={<CommandCenterPage />} />
                <Route path="pipeline" element={<PipelinePage />} />
                <Route path="customers" element={<CustomersPage />} />
                <Route path="dashboard" element={<Navigate replace to="/command" />} />
                <Route path="analytics" element={<AnalyticsPage />} />
                <Route path="tools" element={<ToolsPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Routes>
          </Suspense>
        </Router>

        {/* ReactQueryDevtools — only rendered in dev, tree-shaken in production */}
        {DevTools && (
          <Suspense fallback={null}>
            <DevTools initialIsOpen={false} />
          </Suspense>
        )}
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
