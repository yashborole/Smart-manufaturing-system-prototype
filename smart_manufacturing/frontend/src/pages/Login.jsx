import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Shield, Lock, User, AlertCircle } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(''); // 'username' or 'password' or ''
    
    const { login } = useContext(AuthContext);
    const navigate = useNavigate();

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
                throw new Error(data.detail || 'Invalid username or password');
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
            background: '#f1f5f9',
            padding: '24px'
        }}>
            <div style={{
                background: '#ffffff',
                padding: '40px',
                width: '100%',
                maxWidth: '400px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05)'
            }}>
                <div style={{ marginBottom: '32px', textAlign: 'center' }}>
                    <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        background: '#eff6ff',
                        color: '#2563eb',
                        marginBottom: '16px'
                    }}>
                        <Shield size={24} />
                    </div>
                    <h1 style={{ 
                        fontSize: '22px', 
                        fontWeight: '700', 
                        color: '#0f172a',
                        marginBottom: '6px'
                    }}>
                        MES Dashboard
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                        Sign in with your system credentials
                    </p>
                </div>

                {error && (
                    <div style={{ 
                        background: '#fef2f2', 
                        border: '1px solid #fee2e2',
                        color: '#b91c1c', 
                        padding: '12px 14px', 
                        borderRadius: '6px',
                        marginBottom: '20px',
                        fontSize: '13px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '500'
                    }}>
                        <AlertCircle size={16} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#334155'
                        }}>
                            Username
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <User size={16} style={{
                                position: 'absolute',
                                left: '14px',
                                color: focusedField === 'username' ? '#2563eb' : '#94a3b8'
                            }} />
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onFocus={() => setFocusedField('username')}
                                onBlur={() => setFocusedField('')}
                                required
                                placeholder="Operator name"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px 10px 38px',
                                    borderRadius: '6px',
                                    border: `1px solid ${focusedField === 'username' ? '#2563eb' : '#cbd5e1'}`,
                                    background: '#ffffff',
                                    color: '#0f172a',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxShadow: focusedField === 'username' ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
                                    transition: 'all 0.15s ease'
                                }}
                            />
                        </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <label style={{ 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            color: '#334155'
                        }}>
                            Password
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <Lock size={16} style={{
                                position: 'absolute',
                                left: '14px',
                                color: focusedField === 'password' ? '#2563eb' : '#94a3b8'
                            }} />
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onFocus={() => setFocusedField('password')}
                                onBlur={() => setFocusedField('')}
                                required
                                placeholder="Security key"
                                style={{
                                    width: '100%',
                                    padding: '10px 14px 10px 38px',
                                    borderRadius: '6px',
                                    border: `1px solid ${focusedField === 'password' ? '#2563eb' : '#cbd5e1'}`,
                                    background: '#ffffff',
                                    color: '#0f172a',
                                    fontSize: '14px',
                                    outline: 'none',
                                    boxShadow: focusedField === 'password' ? '0 0 0 3px rgba(37, 99, 235, 0.15)' : 'none',
                                    transition: 'all 0.15s ease'
                                }}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        style={{
                            marginTop: '8px',
                            width: '100%',
                            padding: '10px',
                            borderRadius: '6px',
                            background: '#2563eb',
                            color: 'white',
                            fontWeight: '600',
                            fontSize: '14px',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            textAlign: 'center'
                        }}
                        onMouseOver={(e) => {
                            if (!isLoading) e.currentTarget.style.background = '#1d4ed8';
                        }}
                        onMouseOut={(e) => {
                            if (!isLoading) e.currentTarget.style.background = '#2563eb';
                        }}
                    >
                        {isLoading ? 'Checking Security...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
