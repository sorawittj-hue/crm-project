import { Component } from 'react';

/**
 * Global Error Boundary component
 * Catches unhandled JavaScript errors anywhere in the component tree
 * Prevents white screens on crash
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  /**
   * Update state when an error is caught
   */
  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      error 
    };
  }

  /**
   * Log error details
   */
  componentDidCatch(error, errorInfo) {
    // Log to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    
    // You could also send this to an error tracking service like Sentry
    // Sentry.captureException(error, { extra: errorInfo });
    
    this.setState({
      errorInfo
    });
  }

  /**
   * Reset error state and reload page
   */
  handleReset = () => {
    this.setState({ 
      hasError: false, 
      error: null,
      errorInfo: null 
    });
  };

  /**
   * Reload the page
   */
  handleReload = () => {
    window.location.reload();
  };

  render() {
    // If an error occurred, render fallback UI
    if (this.state.hasError) {
      return (
        <div style={styles.container}>
          <div style={styles.content}>
            <div style={styles.icon}>⚠️</div>
            <h1 style={styles.title}>เกิดข้อผิดพลาด</h1>
            <p style={styles.message}>
              ขออภัย มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง
            </p>
            
            {/* Show error details in development */}
            {import.meta.env.DEV && this.state.error && (
              <details style={styles.details}>
                <summary style={styles.summary}>
                  รายละเอียดข้อผิดพลาด
                </summary>
                <pre style={styles.pre}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div style={styles.buttons}>
              <button 
                onClick={this.handleReload}
                style={styles.primaryButton}
              >
                🔄 รีเฟรชหน้า
              </button>
              <button 
                onClick={this.handleReset}
                style={styles.secondaryButton}
              >
                ลองใหม่
              </button>
            </div>
          </div>
        </div>
      );
    }

    // If no error, render children normally
    return this.props.children;
  }
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  content: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '48px',
    maxWidth: '500px',
    textAlign: 'center',
  },
  icon: {
    fontSize: '64px',
    marginBottom: '16px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 12px 0',
  },
  message: {
    color: '#666',
    fontSize: '16px',
    lineHeight: '1.5',
    margin: '0 0 24px 0',
  },
  details: {
    textAlign: 'left',
    marginBottom: '24px',
    padding: '12px',
    backgroundColor: '#f5f5f5',
    borderRadius: '8px',
    fontSize: '12px',
  },
  summary: {
    cursor: 'pointer',
    fontWeight: '500',
    marginBottom: '8px',
  },
  pre: {
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontSize: '11px',
    color: '#dc2626',
    margin: 0,
  },
  buttons: {
    display: 'flex',
    gap: '12px',
    justifyContent: 'center',
  },
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  secondaryButton: {
    padding: '12px 24px',
    backgroundColor: 'white',
    color: '#666',
    border: '1px solid #ddd',
    borderRadius: '8px',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
};

export default ErrorBoundary;
