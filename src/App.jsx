import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { useEffect } from 'react';

// Components
import AppLayout from './components/layout/AppLayout';
import ErrorBoundary from './components/layout/ErrorBoundary';
import ProtectedRoute from './components/layout/ProtectedRoute';

// Pages
import CommandCenterPage from './pages/CommandCenterPage';
import PipelinePage from './pages/PipelinePage';
import CustomersPage from './pages/CustomersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ToolsPage from './pages/ToolsPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/LoginPage';

// Configure QueryClient with global error handling
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
      // Global error handler for queries
      onError: (error) => {
        console.error('Query error:', error);
        // You can show toast notifications here
        // toast.error(error.message);
      },
    },
    mutations: {
      // Global error handler for mutations
      onError: (error) => {
        console.error('Mutation error:', error);
        // You can show toast notifications here
        // toast.error(error.message);
      },
      // Global success handler
      onSuccess: () => {
        // Optional: invalidate queries on successful mutations
        // queryClient.invalidateQueries();
      },
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <Router>
          <Routes>
            {/* Public route - Login page */}
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
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
