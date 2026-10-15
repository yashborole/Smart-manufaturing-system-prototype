import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Sun, Moon, KeyRound, ShieldCheck, Eye, EyeOff, Lock, User as UserIcon } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

/**
 * Enterprise Production Login Console
 * - Restrained, clean industrial layout with zero decorative stock photographs
 * - Compact high-contrast operator authentication card
 * - Show/hide password capability, input validation, and loading indicators
 * - Clearly isolated test credentials access
 */
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, theme, toggleTheme } = useContext(AuthContext);
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const fillDemoCredentials = () => {
    setUsername('demo_user');
    setPassword('demo123');
    setError('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please provide both username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const url = `${API_BASE_URL}/users/login?user_name=${encodeURIComponent(username.trim())}&password=${encodeURIComponent(password)}`;
      const response = await fetch(url, { method: 'POST' });

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        const text = await response.text();
        if (text.includes('<!DOCTYPE') || text.includes('<html')) {
          const isNetlify = typeof window !== 'undefined' && window.location.hostname.includes('netlify.app');
          throw new Error(
            isNetlify
              ? 'Backend API gateway unreachable: Netlify returned HTML instead of API JSON. Ensure VITE_API_URL is properly configured.'
              : 'Backend server not responding. Verify FastAPI service is running on port 8000.'
          );
        }
        throw new Error(`Server returned unexpected response (${response.status})`);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Authentication failed: Invalid operator username or password.');
      }

      login(data);
      navigate('/select-plant');
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-app)',
      padding: '24px 16px',
      position: 'relative'
    }}>
      {/* Top Header Bar */}
      <header style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '48px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img
            src="/factory-logo.svg"
            alt="PlantOps MES Logo"
            style={{ width: '26px', height: '26px', borderRadius: '4px' }}
          />
          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.2px' }}>
            PlantOps MES
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>| Industrial Execution Gateway</span>
        </div>

        <button
          onClick={toggleTheme}
          className="btn btn-secondary"
          style={{ padding: '4px 8px', fontSize: '11px' }}
        >
          {isDark ? <Sun size={13} /> : <Moon size={13} />}
          <span>{isDark ? 'Light' : 'Dark'}</span>
        </button>
      </header>

      {/* Main Login Console Card */}
      <div
        className="mes-card"
        style={{
          width: '100%',
          maxWidth: '380px',
          padding: '28px 24px',
          boxShadow: 'var(--shadow-dropdown)',
          marginTop: '40px'
        }}
      >
        <div style={{ marginBottom: '20px', textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '44px',
            height: '44px',
            borderRadius: '6px',
            background: 'var(--bg-subtle)',
            border: '1px solid var(--border-color)',
            marginBottom: '10px'
          }}>
            <Lock size={20} color="var(--primary)" />
          </div>
          <h1 style={{ fontSize: '17px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.2px', margin: 0 }}>
            Operator Authentication
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '12px', marginTop: '3px' }}>
            Enter your credentials to access factory terminal controls
          </p>
        </div>

        {error && (
          <div style={{
            background: 'var(--status-stopped-bg)',
            border: '1px solid var(--status-stopped-border)',
            color: 'var(--status-stopped)',
            padding: '8px 10px',
            borderRadius: '4px',
            marginBottom: '16px',
            fontSize: '12px',
            fontWeight: '600',
            lineHeight: 1.4
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              color: 'var(--text-secondary)',
              marginBottom: '5px'
            }}>
              Operator Username
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. demo_user"
                required
                autoFocus
                style={{ width: '100%', paddingLeft: '32px' }}
              />
              <UserIcon
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
            </div>
          </div>

          <div>
            <label style={{
              display: 'block',
              fontSize: '11px',
              fontWeight: '700',
              textTransform: 'uppercase',
              letterSpacing: '0.4px',
              color: 'var(--text-secondary)',
              marginBottom: '5px'
            }}>
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                style={{ width: '100%', paddingLeft: '32px', paddingRight: '36px' }}
              />
              <Lock
                size={14}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)'
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(p => !p)}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ marginTop: '6px', padding: '9px 14px', fontSize: '13px' }}
          >
            {isLoading ? 'Verifying Credentials...' : 'Authenticate Operator'}
          </button>
        </form>

        {/* Demo Credentials Box */}
        <div style={{
          marginTop: '20px',
          padding: '10px 12px',
          background: 'var(--bg-subtle)',
          borderRadius: '4px',
          border: '1px solid var(--border-color)',
          fontSize: '11px'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '6px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: '700',
              color: 'var(--text-secondary)',
              textTransform: 'uppercase',
              letterSpacing: '0.4px'
            }}>
              <ShieldCheck size={13} color="var(--primary)" />
              <span>Evaluation Access</span>
            </div>
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="btn btn-secondary"
              style={{ padding: '2px 6px', fontSize: '10px' }}
            >
              Fill Demo
            </button>
          </div>
          <div style={{ display: 'flex', gap: '14px', color: 'var(--text-muted)' }}>
            <div>Username: <strong style={{ color: 'var(--text-main)' }}>demo_user</strong></div>
            <div>Password: <strong style={{ color: 'var(--text-main)' }}>demo123</strong></div>
          </div>
        </div>
      </div>

      {/* Security & Standard Compliance Footnote */}
      <footer style={{
        marginTop: '24px',
        fontSize: '11px',
        color: 'var(--text-muted)',
        textAlign: 'center'
      }}>
        ISA-95 MES Standard • PlantOps Gateway v2.4.1
      </footer>
    </div>
  );
}
