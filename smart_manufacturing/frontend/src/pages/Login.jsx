import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Lock, User, AlertCircle, Cpu, Radio, ShieldCheck } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const Login = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    
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
                throw new Error(data.detail || 'Authentication failed. Please verify operator credentials.');
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
            background: 'radial-gradient(ellipse at top, #111827, #070a0f)',
            padding: '24px',
            position: 'relative',
            overflow: 'hidden'
        }}>
            {/* Background SCADA grid backdrop */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `linear-gradient(rgba(31, 41, 55, 0.4) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(31, 41, 55, 0.4) 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
                pointerEvents: 'none',
                opacity: 0.6
            }} />

            <div style={{
                background: '#111827',
                padding: '36px',
                width: '100%',
                maxWidth: '420px',
                borderRadius: '8px',
                border: '1px solid #1f2937',
                boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(255, 255, 255, 0.05)',
                position: 'relative',
                zIndex: 1
            }}>
                {/* Industrial Header Banner */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    paddingBottom: '16px',
                    borderBottom: '1px solid #1f2937',
                    marginBottom: '28px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px',
                            height: '32px',
                            borderRadius: '6px',
                            background: 'rgba(6, 182, 212, 0.12)',
                            border: '1px solid rgba(6, 182, 212, 0.3)',
                            color: '#06b6d4',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            <Cpu size={18} />
                        </div>
                        <div>
                            <div style={{ fontSize: '13px', fontWeight: '800', color: '#f3f4f6', letterSpacing: '0.04em' }}>
                                FACTORY OS
                            </div>
                            <div style={{ fontSize: '9px', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace', letterSpacing: '0.08em' }}>
                                MES GATEWAY • V2.4
                            </div>
                        </div>
                    </div>

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        background: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.25)',
                        padding: '3px 8px',
                        borderRadius: '4px'
                    }}>
                        <Radio size={10} color="#10b981" />
                        <span style={{ fontSize: '9px', color: '#34d399', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>
                            ONLINE
                        </span>
                    </div>
                </div>

                <div style={{ marginBottom: '24px' }}>
                    <h1 style={{ 
                        fontSize: '18px', 
                        fontWeight: '700', 
                        color: '#f9fafb',
                        marginBottom: '4px',
                        letterSpacing: '-0.01em'
                    }}>
                        Operator Authentication
                    </h1>
                    <p style={{ color: '#9ca3af', fontSize: '12.5px', margin: 0 }}>
                        Provide certified operator credentials to enter the control room.
                    </p>
                </div>

                {error && (
                    <div style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171', 
                        padding: '10px 12px', 
                        borderRadius: '6px',
                        marginBottom: '20px',
                        fontSize: '12px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '500'
                    }}>
                        <AlertCircle size={15} style={{ flexShrink: 0 }} />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ 
                            display: 'block', 
                            fontSize: '11px', 
                            fontWeight: '600', 
                            color: '#9ca3af', 
                            marginBottom: '6px',
                            fontFamily: 'JetBrains Mono, monospace',
                            textTransform: 'uppercase',
                            letterSpacing: '0.04em'
                        }}>
                            Operator ID / Username
                        </label>
                        <div style={{ position: 'relative' }}>
                            <div style={{ 
                                position: 'absolute', 
                                left: '12px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                color: '#6b7280',
                                display: 'flex'
                            }}>
                                <User size={15} />
                            </div>
                            <input 
                                type="text" 
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="operator_1"
                                required
                                style={{
                                    width: '100%',
                                    padding: '9px 12px 9px 36px',
                                    background: '#0b0f17',
                                    border: '1px solid #1f2937',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    color: '#f3f4f6',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                                onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                            />
                        </div>
                    </div>

                    <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                            <label style={{ 
                                fontSize: '11px', 
                                fontWeight: '600', 
                                color: '#9ca3af',
                                fontFamily: 'JetBrains Mono, monospace',
                                textTransform: 'uppercase',
                                letterSpacing: '0.04em'
                            }}>
                                Security Passcode
                            </label>
                        </div>
                        <div style={{ position: 'relative' }}>
                            <div style={{ 
                                position: 'absolute', 
                                left: '12px', 
                                top: '50%', 
                                transform: 'translateY(-50%)', 
                                color: '#6b7280',
                                display: 'flex'
                            }}>
                                <Lock size={15} />
                            </div>
                            <input 
                                type="password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                style={{
                                    width: '100%',
                                    padding: '9px 12px 9px 36px',
                                    background: '#0b0f17',
                                    border: '1px solid #1f2937',
                                    borderRadius: '6px',
                                    fontSize: '13px',
                                    color: '#f3f4f6',
                                    fontFamily: 'inherit',
                                    transition: 'all 0.15s ease'
                                }}
                                onFocus={(e) => e.target.style.borderColor = '#06b6d4'}
                                onBlur={(e) => e.target.style.borderColor = '#1f2937'}
                            />
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        disabled={isLoading}
                        style={{
                            marginTop: '8px',
                            background: 'linear-gradient(135deg, #0284c7, #0369a1)',
                            color: '#ffffff',
                            padding: '10px 16px',
                            borderRadius: '6px',
                            border: '1px solid #38bdf8',
                            fontSize: '13px',
                            fontWeight: '600',
                            letterSpacing: '0.02em',
                            cursor: isLoading ? 'not-allowed' : 'pointer',
                            opacity: isLoading ? 0.7 : 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'all 0.15s ease'
                        }}
                    >
                        {isLoading ? (
                            <>
                                <span className="spinner" style={{ width: '16px', height: '16px', borderWidth: '2px' }} />
                                Authenticating...
                            </>
                        ) : (
                            <>
                                <ShieldCheck size={16} />
                                Verify & Authorize Access
                            </>
                        )}
                    </button>
                </form>

                {/* Footer security stamp */}
                <div style={{
                    marginTop: '28px',
                    paddingTop: '16px',
                    borderTop: '1px solid #1f2937',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '10px',
                    color: '#6b7280',
                    fontFamily: 'JetBrains Mono, monospace'
                }}>
                    <span>SECURITY TIER 2</span>
                    <span>RESTRICTED ACCESS</span>
                </div>
            </div>
        </div>
    );
};

export default Login;
