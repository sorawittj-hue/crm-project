import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * Login Page with Email/Password authentication
 */
export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, loading, error } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Basic validation
    if (!email.trim()) {
      setFormError('กรุณากรอกอีเมล');
      return;
    }
    if (!password) {
      setFormError('กรุณากรอกรหัสผ่าน');
      return;
    }

    const { error: signInError } = await signIn(email, password);
    
    if (signInError) {
      setFormError(signInError.message);
      return;
    }

    // Redirect to dashboard on success
    navigate('/command');
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <h1 style={styles.title}>CRM Login</h1>
          <p style={styles.subtitle}>เข้าสู่ระบบเพื่อจัดการลูกค้า</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {formError && (
            <div style={styles.error}>
              {formError}
            </div>
          )}

          <div style={styles.field}>
            <label htmlFor="email" style={styles.label}>
              อีเมล
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <div style={styles.field}>
            <label htmlFor="password" style={styles.label}>
              รหัสผ่าน
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
              disabled={loading}
            />
          </div>

          <button 
            type="submit" 
            style={styles.button}
            disabled={loading}
          >
            {loading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ'}
          </button>
        </form>

        <div style={styles.footer}>
          <p style={styles.hint}>
            💡 ติดต่อผู้ดูแลระบบหากลืมรหัสผ่าน
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    padding: '20px',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: '12px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
    padding: '40px',
    width: '100%',
    maxWidth: '400px',
  },
  header: {
    textAlign: 'center',
    marginBottom: '32px',
  },
  title: {
    fontSize: '28px',
    fontWeight: 'bold',
    color: '#333',
    margin: '0 0 8px 0',
  },
  subtitle: {
    color: '#666',
    margin: 0,
    fontSize: '14px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#333',
  },
  input: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: '1px solid #ddd',
    fontSize: '14px',
    outline: 'none',
    transition: 'border-color 0.2s',
  },
  button: {
    padding: '14px 20px',
    backgroundColor: '#2563eb',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '8px',
    transition: 'background-color 0.2s',
  },
  error: {
    padding: '12px 16px',
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    borderRadius: '8px',
    fontSize: '14px',
    textAlign: 'center',
  },
  footer: {
    marginTop: '24px',
    textAlign: 'center',
  },
  hint: {
    color: '#888',
    fontSize: '13px',
    margin: 0,
  },
};
