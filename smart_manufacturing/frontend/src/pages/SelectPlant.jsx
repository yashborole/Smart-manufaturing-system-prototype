import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Factory, MapPin, LogOut, ArrowRight, Sun, Moon, Cpu, Layers, RefreshCw } from 'lucide-react';
import { API_BASE_URL } from '../api/config';

/**
 * Enterprise Production Plant Directory
 * - Information-dense facilities directory for operations supervisors
 * - Clean neutral industrial canvas (no stock photography)
 * - Clear facility IDs, status badges, location tags, and direct launch actions
 */
export default function SelectPlant() {
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const { user, selectPlant, logout, theme, toggleTheme } = useContext(AuthContext);
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const fetchPlants = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE_URL}/plants/user/${user.user_id}`);
      if (!response.ok) {
        throw new Error('Failed to retrieve user facilities');
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
      setError(err.message || 'Error communicating with facilities registry.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      background: 'var(--bg-app)',
      color: 'var(--text-main)'
    }}>
      {/* Top Industrial Header */}
      <header style={{
        height: '48px',
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--border-color)',
        background: 'var(--bg-surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
            src="/factory-logo.svg"
            alt="PlantOps MES Logo"
            style={{ width: '26px', height: '26px', borderRadius: '4px' }}
          />
          <span style={{ fontSize: '13px', fontWeight: '800', color: 'var(--text-main)', letterSpacing: '-0.2px' }}>
            PlantOps MES
          </span>
          <span style={{ color: 'var(--text-muted)', fontSize: '11px' }}>| Facility Registry</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
            Operator: <strong style={{ color: 'var(--text-main)' }}>{user?.name}</strong>
          </div>

          <button
            onClick={toggleTheme}
            className="btn btn-secondary"
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            {isDark ? <Sun size={13} /> : <Moon size={13} />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>

          <button
            onClick={handleLogout}
            className="btn btn-outline-danger"
            style={{ padding: '4px 8px', fontSize: '11px' }}
          >
            <LogOut size={12} />
            Sign Out
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{
        padding: '32px 24px',
        maxWidth: '1040px',
        width: '100%',
        margin: '0 auto',
        flexGrow: 1
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          marginBottom: '20px',
          borderBottom: '1px solid var(--border-color)',
          paddingBottom: '12px'
        }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.2px' }}>
              Select Operational Facility
            </h1>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>
              Choose an active production plant to open the dispatch & telemetry console
            </p>
          </div>

          <button
            onClick={fetchPlants}
            disabled={loading}
            className="btn btn-secondary"
            style={{ fontSize: '11px' }}
          >
            <RefreshCw size={12} style={{ animation: loading ? 'spin 1s linear infinite' : 'none' }} />
            Refresh List
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--status-stopped-bg)',
            border: '1px solid var(--status-stopped-border)',
            color: 'var(--status-stopped)',
            padding: '10px 12px',
            borderRadius: '4px',
            marginBottom: '20px',
            fontSize: '12px',
            fontWeight: '600'
          }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', margin: '0 auto 12px', animation: 'ping 1s cubic-bezier(0, 0, 0.2, 1) infinite' }} />
            <div style={{ fontSize: '12px', fontWeight: '600' }}>Querying Plant Registry...</div>
          </div>
        ) : plants.length === 0 ? (
          <div className="mes-card" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <Factory size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <h2 style={{ fontSize: '15px', color: 'var(--text-main)', marginBottom: '4px' }}>No Facilities Assigned</h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '12px' }}>
              There are currently no manufacturing facilities mapped to your operator account.
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
            gap: '16px'
          }}>
            {plants.map((plant) => (
              <div
                key={plant.id}
                onClick={() => handleSelectPlant(plant)}
                className="mes-card"
                style={{
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  padding: '16px',
                  transition: 'border-color 0.15s ease, box-shadow 0.15s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-dropdown)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.boxShadow = 'var(--shadow-card)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{
                      fontSize: '10px',
                      fontWeight: '700',
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px'
                    }}>
                      FACILITY #PLT-{String(plant.id).padStart(3, '0')}
                    </span>
                    <span className="badge badge-running" style={{ fontSize: '10px' }}>
                      ONLINE
                    </span>
                  </div>

                  <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: '0 0 6px 0', letterSpacing: '-0.2px' }}>
                    {plant.name}
                  </h2>

                  <p style={{ color: 'var(--text-muted)', fontSize: '12px', lineHeight: 1.45, marginBottom: '16px' }}>
                    {plant.description || 'Standard machining, automated assembly, and dispatch production plant.'}
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingTop: '12px',
                  borderTop: '1px solid var(--border-subtle)',
                  fontSize: '12px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--text-muted)' }}>
                    <MapPin size={13} />
                    <span>{plant.location || 'Factory Floor'}</span>
                  </div>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: 'var(--primary)',
                    fontWeight: '700',
                    fontSize: '12px'
                  }}>
                    <span>Open Facility</span>
                    <ArrowRight size={13} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
