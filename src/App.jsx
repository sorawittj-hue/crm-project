import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import AppLayout from './components/layout/AppLayout';

// Pages
import CommandCenterPage from './pages/CommandCenterPage';
import PipelinePage from './pages/PipelinePage';
import CustomersPage from './pages/CustomersPage';
import AnalyticsPage from './pages/AnalyticsPage';
import ToolsPage from './pages/ToolsPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes (consistent across app)
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          <Route element={<AppLayout />}>
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
  );
}

export default App;
