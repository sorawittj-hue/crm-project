import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

/**
 * Protected Route wrapper component
 * Redirects to login if user is not authenticated
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  // Show loading state while checking auth
  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>กำลังตรวจสอบการเข้าสู่ระบบ...</p>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    // Redirect to login page and remember where they were trying to go
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If authenticated, render the children (protected content)
  return children;
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e5e5e5',
    borderTopColor: '#2563eb',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  loadingText: {
    marginTop: '16px',
    color: '#666',
    fontSize: '14px',
  },
};

// Add CSS animation for spinner
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(styleSheet);
}

export default ProtectedRoute;
