import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Factory, MapPin, LogOut, ArrowRight, Sun, Moon } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

const SelectPlant = () => {
    const [plants, setPlants] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const { user, selectPlant, logout, theme, toggleTheme } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPlants = async () => {
            try {
                const response = await fetch(`${API_BASE_URL}/plants/user/${user.user_id}`);
                if (!response.ok) {
                    throw new Error('Failed to load plants');
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
                background: 'var(--bg-app)', 
                color: 'var(--text-main)' 
            }}>
                <div style={{ textAlign: 'center' }}>
                    <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '600' }}>
                        Loading available factory plants...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div style={{
            minHeight: '100vh',
            background: 'var(--bg-app)',
            color: 'var(--text-main)',
            padding: '32px 20px'
        }}>
            <div style={{ maxWidth: '960px', margin: '0 auto' }}>
                
                {/* Header */}
                <div style={{ 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center', 
                    marginBottom: '28px',
                    borderBottom: '1px solid var(--border-color)',
                    paddingBottom: '16px'
                }}>
                    <div>
                        <h1 style={{ fontSize: '20px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                            Select Factory Plant
                        </h1>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                            Logged in as: <strong style={{ color: 'var(--text-main)' }}>{user?.name}</strong>
                        </p>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button 
                            onClick={toggleTheme}
                            className="theme-toggle-btn"
                        >
                            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
                            <span>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
                        </button>

                        <button 
                            onClick={handleLogout}
                            className="btn btn-secondary"
                            style={{ color: 'var(--status-stopped)' }}
                        >
                            <LogOut size={14} />
                            Log Out
                        </button>
                    </div>
                </div>

                {error && (
                    <div style={{ 
                        background: 'var(--status-stopped-bg)', 
                        border: '1px solid var(--status-stopped-border)',
                        color: 'var(--status-stopped)', 
                        padding: '10px 14px', 
                        borderRadius: '6px', 
                        marginBottom: '20px',
                        fontSize: '13px'
                    }}>
                        {error}
                    </div>
                )}

                {plants.length === 0 ? (
                    <div className="card" style={{ textAlign: 'center', padding: '40px' }}>
                        <Factory size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px' }} />
                        <h2 style={{ fontSize: '16px', color: 'var(--text-main)', marginBottom: '4px' }}>No Plants Found</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px' }}>
                            There are currently no plants assigned to your user account.
                        </p>
                    </div>
                ) : (
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
                        gap: '16px'
                    }}>
                        {plants.map((plant) => (
                            <div 
                                key={plant.id}
                                onClick={() => handleSelectPlant(plant)}
                                className="card"
                                style={{
                                    cursor: 'pointer',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    transition: 'all 0.15s ease'
                                }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                                    <div style={{ 
                                        background: 'var(--status-running-bg)',
                                        color: 'var(--status-running)',
                                        padding: '10px', 
                                        borderRadius: '8px'
                                    }}>
                                        <Factory size={22} />
                                    </div>
                                    <div>
                                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>
                                            {plant.name}
                                        </h2>
                                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                                            Plant #{plant.id}
                                        </span>
                                    </div>
                                </div>
                                
                                <p style={{ color: 'var(--text-muted)', fontSize: '13px', lineHeight: '1.4', marginBottom: '16px', flexGrow: 1 }}>
                                    {plant.description || 'Active manufacturing and machining facility.'}
                                </p>
                                
                                <div style={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center', 
                                    paddingTop: '12px', 
                                    borderTop: '1px solid var(--border-color)' 
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-muted)', fontSize: '12px' }}>
                                        <MapPin size={13} />
                                        <span>{plant.location || 'Factory Floor'}</span>
                                    </div>
                                    <div style={{ 
                                        color: 'var(--primary)', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        gap: '4px',
                                        fontSize: '13px',
                                        fontWeight: '700'
                                    }}>
                                        Open Plant
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
