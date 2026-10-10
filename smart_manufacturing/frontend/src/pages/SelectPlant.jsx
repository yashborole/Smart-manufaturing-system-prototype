import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Factory, MapPin, LogOut, ArrowRight, Shield } from 'lucide-react';
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
                    throw new Error('Failed to fetch plants');
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
                background: '#f8fafc', 
                color: '#334155' 
            }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
                    <div style={{ 
                        width: '32px', 
                        height: '32px', 
                        border: '2px solid #e2e8f0', 
                        borderTopColor: '#2563eb', 
                        borderRadius: '50%', 
                        animation: 'spin 1s linear infinite' 
                    }} />
                    <p style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>Loading workspaces...</p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: '#f8fafc',
            color: '#0f172a',
            padding: '48px 24px'
        }}>
            <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
                
                {/* Header */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '40px',
                    borderBottom: '1px solid #e2e8f0',
                    paddingBottom: '20px'
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ background: '#eff6ff', color: '#2563eb', padding: '8px', borderRadius: '6px' }}>
                            <Shield size={20} />
                        </div>
                        <div>
                            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Operator Portal</span>
                            <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Smart Manufacturing</h1>
                        </div>
                    </div>
                    <button 
                        onClick={handleLogout}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            padding: '8px 14px',
                            background: '#ffffff',
                            color: '#ef4444',
                            borderRadius: '6px',
                            border: '1px solid #e2e8f0',
                            fontWeight: '600',
                            fontSize: '13px'
                        }}
                        onMouseOver={(e) => {
                            e.currentTarget.style.background = '#fef2f2';
                            e.currentTarget.style.borderColor = '#fca5a5';
                        }}
                        onMouseOut={(e) => {
                            e.currentTarget.style.background = '#ffffff';
                            e.currentTarget.style.borderColor = '#e2e8f0';
                        }}
                    >
                        <LogOut size={14} />
                        Sign Out
                    </button>
                </div>

                <div style={{ marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '6px' }}>
                        Welcome back, {user?.name}
                    </h2>
                    <p style={{ color: '#64748b', fontSize: '14px' }}>
                        Select a manufacturing plant below to open the operator dashboard.
                    </p>
                </div>

                {error && (
                    <div style={{ 
                        background: '#fef2f2', 
                        border: '1px solid #fee2e2',
                        color: '#b91c1c', 
                        padding: '12px 16px', 
                        borderRadius: '6px', 
                        marginBottom: '24px',
                        fontSize: '14px'
                    }}>
                        {error}
                    </div>
                )}

                {plants.length === 0 ? (
                    <div style={{ 
                        background: '#ffffff', 
                        padding: '48px', 
                        textAlign: 'center', 
                        border: '1px solid #e2e8f0',
                        borderRadius: '8px'
                    }}>
                        <Factory size={40} style={{ color: '#94a3b8', margin: '0 auto 16px' }} />
                        <h3 style={{ fontSize: '18px', color: '#334155', marginBottom: '6px' }}>No Assigned Plants</h3>
                        <p style={{ color: '#64748b', fontSize: '14px' }}>
                            There are no manufacturing plants assigned to your account.
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '24px'
                    }}>
                        {plants.map((plant) => (
                            <div 
                                key={plant.id}
                                onClick={() => handleSelectPlant(plant)}
                                style={{
                                    padding: '24px',
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    background: '#ffffff',
                                    border: '1px solid #e2e8f0',
                                    borderRadius: '8px',
                                    transition: 'all 0.15s ease',
                                    boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = '#cbd5e1';
                                    e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.05)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = '#e2e8f0';
                                    e.currentTarget.style.boxShadow = '0 1px 3px 0 rgba(0, 0, 0, 0.05)';
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                                    <div style={{ 
                                        background: '#eff6ff',
                                        color: '#2563eb',
                                        padding: '8px', 
                                        borderRadius: '6px'
                                    }}>
                                        <Factory size={18} />
                                    </div>
                                    <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>{plant.name}</h2>
                                </div>
                                
                                <p style={{ color: '#475569', fontSize: '13px', lineHeight: '1.5', marginBottom: '20px', flexGrow: 1 }}>
                                    {plant.description || 'No description provided.'}
                                </p>
                                
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    paddingTop: '12px', 
                                    borderTop: '1px solid #f1f5f9' 
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#64748b', fontSize: '12px' }}>
                                        <MapPin size={14} />
                                        <span>{plant.location || 'N/A'}</span>
                                    </div>
                                    <div style={{ 
                                        color: '#2563eb', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        fontSize: '13px',
                                        fontWeight: '600'
                                    }}>
                                        Open
                                        <ArrowRight size={14} />
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
