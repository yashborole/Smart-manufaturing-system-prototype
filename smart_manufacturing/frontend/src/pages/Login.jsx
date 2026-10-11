import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, Moon, Sun, Sparkles } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
    const { login, theme, toggleTheme } = useContext(AuthContext);
    const navigate = useNavigate();

    const fillDemoCredentials = () => {
        setUsername('demo_user');
        setPassword('demo123');
        setError('');
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const response = await fetch(`${API_BASE_URL}/users/login?user_name=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
                method: 'POST',
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.detail || 'Wrong username or password. Please try again.');
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
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--bg-app)',
            padding: '20px',
            position: 'relative'
        }}>
            {/* Top theme switcher button */}
            <div style={{ position: 'absolute', top: 20, right: 20 }}>
                <button 
                    onClick={toggleTheme}
                    className="theme-toggle-btn"
                >
                    {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                    <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                </button>
            </div>

            <div style={{
                background: 'var(--bg-surface)',
                padding: '36px',
                width: '100%',
                maxWidth: '400px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                boxShadow: 'var(--shadow-card)'
            }}>
                <div style={{ marginBottom: '24px', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '44px',
                        height: '44px',
                        borderRadius: '8px',
                        background: 'var(--status-running-bg)',
                        color: 'var(--status-running)',
                        marginBottom: '12px'
                    }}>
                        <LogIn size={22} />
                    </div>
                    <h1 style={{ 
                        fontSize: '20px', 
                        fontWeight: '700', 
                        color: 'var(--text-main)',
                        marginBottom: '6px'
                    }}>
                        Factory Management System
                    </h1>
                    <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                        Please enter your username and password to log in
                    </p>
                </div>

                {error && (
                    <div style={{ 
                        background: 'var(--status-stopped-bg)', 
                        border: '1px solid var(--status-stopped-border)',
                        color: 'var(--status-stopped)', 
                        padding: '10px 12px', 
                        borderRadius: '6px',
                        marginBottom: '16px',
                        fontSize: '13px',
                        fontWeight: '500'
                    }}>
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                        <label style={{ 
                            display: 'block', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: 'var(--text-main)', 
                            marginBottom: '6px' 
                        }}>
                            Username
                        </label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="e.g. operator_1 or admin"
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                fontSize: '14px',
                                color: 'var(--text-main)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <div>
                        <label style={{ 
                            display: 'block', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: 'var(--text-main)', 
                            marginBottom: '6px' 
                        }}>
                            Password
                        </label>
                        <input 
                            type="password" 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            required
                            style={{
                                width: '100%',
                                padding: '10px 12px',
                                background: 'var(--bg-input)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '6px',
                                fontSize: '14px',
                                color: 'var(--text-main)',
                                outline: 'none'
                            }}
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        className="btn btn-primary"
                        style={{
                            marginTop: '8px',
                            padding: '11px',
                            fontSize: '14px'
                        }}
                    >
                        {isLoading ? 'Checking credentials...' : 'Log In to System'}
                    </button>
                </form>

                {/* Demo Access Card */}
                <div style={{
                    marginTop: '20px',
                    padding: '12px 14px',
                    background: 'var(--bg-subtle)',
                    borderRadius: '8px',
                    border: '1px dashed var(--border-subtle)',
                    fontSize: '13px'
                }}>
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'space-between',
                        marginBottom: '8px'
                    }}>
                        <div style={{ 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '6px', 
                            fontWeight: '600', 
                            color: 'var(--text-main)',
                            fontSize: '13px'
                        }}>
                            <Sparkles size={14} color="var(--primary)" />
                            <span>Quick Demo Access</span>
                        </div>
                        <button
                            type="button"
                            onClick={fillDemoCredentials}
                            style={{
                                background: 'transparent',
                                border: '1px solid var(--primary)',
                                color: 'var(--primary)',
                                borderRadius: '4px',
                                padding: '3px 8px',
                                fontSize: '11px',
                                fontWeight: '600',
                                cursor: 'pointer',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px'
                            }}
                        >
                            ⚡ Auto-fill
                        </button>
                    </div>
                    <div style={{ 
                        display: 'flex', 
                        flexDirection: 'column', 
                        gap: '4px', 
                        color: 'var(--text-muted)',
                        fontSize: '12px'
                    }}>
                        <div>
                            <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>Username: </span>
                            <code style={{ 
                                background: 'var(--bg-surface)', 
                                padding: '1px 6px', 
                                borderRadius: '4px', 
                                border: '1px solid var(--border-color)', 
                                color: 'var(--text-main)',
                                fontFamily: 'monospace'
                            }}>
                                demo_user
                            </code>
                        </div>
                        <div>
                            <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>Password: </span>
                            <code style={{ 
                                background: 'var(--bg-surface)', 
                                padding: '1px 6px', 
                                borderRadius: '4px', 
                                border: '1px solid var(--border-color)', 
                                color: 'var(--text-main)',
                                fontFamily: 'monospace'
                            }}>
                                demo123
                            </code>
                        </div>
                        <div style={{ marginTop: '2px' }}>
                            <span style={{ color: 'var(--text-main)', fontWeight: '500' }}>Plant: </span>
                            <span style={{ color: 'var(--text-muted)' }}>Mumbai Plant (Demo)</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
