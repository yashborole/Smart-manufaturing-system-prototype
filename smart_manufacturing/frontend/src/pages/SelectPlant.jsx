import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Factory, MapPin, LogOut, ArrowRight, Cpu, Radio, Activity } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const SelectPlant = () => {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const { user, selectPlant, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPlants = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/plants/user/${user.user_id}`);
                if (!response.ok) {
                    throw new Error('Failed to fetch assigned plants');
                }
                const data = await response.json();
                
                if (data.length === 0) {
                    const allPlantsRes = await fetch(`${API_BASE_URL}/plants/`);
                    if (allPlantsRes.ok) {
                        const allPlantsData = await allPlantsRes.json();
                        setPlants(allPlantsData);
                    } else {
                        setPlants([]);
                    }
                } else {
                    setPlants(data);
                }
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (user) {
            fetchPlants();
        }
    }, [user]);

    const handleSelectPlant = (plant) => {
        selectPlant(plant);
        navigate('/dashboard');
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    if (loading) {
        return (
            <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                background: '#0b0f17', 
                color: '#f3f4f6' 
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' }}>
                    <div className="spinner" />
                    <p style={{ color: '#9ca3af', fontSize: '12px', fontFamily: 'JetBrains Mono, monospace' }}>
                        INITIALIZING TOPOLOGY...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'radial-gradient(ellipse at top, #111827, #070a0f)',
            color: '#f3f4f6',
            padding: '36px 24px',
            position: 'relative'
        }}>
            {/* Background SCADA grid */}
            <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundImage: `linear-gradient(rgba(31, 41, 55, 0.3) 1px, transparent 1px),
                                  linear-gradient(90deg, rgba(31, 41, 55, 0.3) 1px, transparent 1px)`,
                backgroundSize: '32px 32px',
                pointerEvents: 'none',
                opacity: 0.5
            }} />

            <div style={{ maxWidth: '1100px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
                
                {/* Header */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '36px',
                    borderBottom: '1px solid #1f2937',
                    paddingBottom: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ 
                            background: 'rgba(6, 182, 212, 0.12)', 
                            color: '#06b6d4', 
                            padding: '8px', 
                            borderRadius: '6px',
                            border: '1px solid rgba(6, 182, 212, 0.3)'
                        }}>
                            <Cpu size={20} />
                        </div>
                        <div>
                            <span style={{ fontSize: '10px', color: '#6b7280', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: 'JetBrains Mono, monospace' }}>
                                FACTORY OS • ENTERPRISE FLEET
                            </span>
                            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#f9fafb', margin: 0, letterSpacing: '-0.01em' }}>
                                Plant Topology Selector
                            </h1>
                        </div>
                    </div>
                    
                    <button 
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '7px 12px',
                            background: 'rgba(239, 68, 68, 0.08)',
                            color: '#f87171',
                            borderRadius: '6px',
                            border: '1px solid rgba(239, 68, 68, 0.2)',
                            fontWeight: '600',
                            fontSize: '12px',
                            cursor: 'pointer',
                            transition: 'all 0.15s ease'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)';
                            e.currentTarget.style.borderColor = '#ef4444';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)';
                            e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.2)';
                        }}
                    >
                        <LogOut size={13} />
                        Sign Out
                    </button>
                </div>

                <div style={{ marginBottom: '28px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#06b6d4', fontFamily: 'JetBrains Mono, monospace', fontWeight: '600' }}>
                            OPERATOR: {user?.name?.toUpperCase()}
                        </span>
                        <span style={{ color: '#4b5563' }}>•</span>
                        <span style={{ fontSize: '12px', color: '#9ca3af' }}>Select Active Manufacturing Node</span>
                    </div>
                    <p style={{ color: '#6b7280', fontSize: '13px', margin: 0 }}>
                        Target factory workspace will bind telemetry, machine feeds, and job dispatchers.
                    </p>
                </div>

                {error && (
                    <div style={{ 
                        background: 'rgba(239, 68, 68, 0.1)', 
                        border: '1px solid rgba(239, 68, 68, 0.3)',
                        color: '#f87171', 
                        padding: '10px 14px', 
                        borderRadius: '6px', 
                        marginBottom: '24px',
                        fontSize: '13px'
                    }}>
                        {error}
                    </div>
                )}

                {plants.length === 0 ? (
                    <div style={{ 
                        background: '#111827', 
                        padding: '48px', 
                        textAlign: 'center', 
                        border: '1px solid #1f2937',
                        borderRadius: '8px'
                    }}>
                        <Factory size={36} style={{ color: '#4b5563', margin: '0 auto 12px' }} />
                        <h3 style={{ fontSize: '16px', color: '#e5e7eb', marginBottom: '4px' }}>No Assigned Production Nodes</h3>
                        <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>
                            Please contact system engineering to grant plant workspace access.
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                        gap: '20px'
                    }}>
                        {plants.map((plant) => (
                            <div 
                                key={plant.id}
                                onClick={() => handleSelectPlant(plant)}
                                style={{
                                    padding: '22px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: '#111827',
                                    border: '1px solid #1f2937',
                                    borderRadius: '8px',
                                    transition: 'all 0.15s ease',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = '#06b6d4';
                                    e.currentTarget.style.boxShadow = '0 8px 24px -4px rgba(6, 182, 212, 0.2)';
                                    e.currentTarget.style.transform = 'translateY(-2px)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = '#1f2937';
                                    e.currentTarget.style.boxShadow = 'none';
                                    e.currentTarget.style.transform = 'translateY(0)';
                                }}
                            >
                                <div style={{
                                    position: 'absolute',
                                    top: 0,
                                    left: 0,
                                    right: 0,
                                    height: '2px',
                                    background: 'linear-gradient(90deg, #06b6d4, #3b82f6)'
                                }} />

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{ 
                                            background: 'rgba(6, 182, 212, 0.1)',
                                            color: '#06b6d4',
                                            padding: '8px', 
                                            borderRadius: '6px',
                                            border: '1px solid rgba(6, 182, 212, 0.25)'
                                        }}>
                                            <Factory size={18} />
                                        </div>
                                        <div>
                                            <h2 style={{ fontSize: '16px', fontWeight: '700', color: '#f3f4f6', margin: 0 }}>
                                                {plant.name}
                                            </h2>
                                            <span style={{ fontSize: '10px', color: '#6b7280', fontFamily: 'JetBrains Mono, monospace' }}>
                                                NODE ID: #{plant.id}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '4px',
                                        background: 'rgba(16, 185, 129, 0.1)',
                                        border: '1px solid rgba(16, 185, 129, 0.3)',
                                        padding: '2px 6px',
                                        borderRadius: '4px'
                                    }}>
                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#10b981' }} />
                                        <span style={{ fontSize: '9px', color: '#34d399', fontWeight: '700', fontFamily: 'JetBrains Mono, monospace' }}>
                                            ONLINE
                                        </span>
                                    </div>
                                </div>
                                
                                <p style={{ color: '#9ca3af', fontSize: '12.5px', lineHeight: '1.5', marginBottom: '20px', flexGrow: 1 }}>
                                    {plant.description || 'Full-cycle automated fabrication, telemetry diagnostics and job scheduling enabled.'}
                                </p>
                                
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    paddingTop: '12px', 
                                    borderTop: '1px solid #1f2937' 
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#6b7280', fontSize: '11px', fontFamily: 'JetBrains Mono, monospace' }}>
                                        <MapPin size={13} color="#9ca3af" />
                                        <span>{plant.location || 'SITE-A'}</span>
                                    </div>
                                    <div style={{ 
                                        color: '#38bdf8', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        fontSize: '12px',
                                        fontWeight: '700'
                                    }}>
                                        Access Node
                                        <ArrowRight size={13} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default SelectPlant;
