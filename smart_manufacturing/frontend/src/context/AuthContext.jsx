import React, { createContext, useState, useEffect } from 'react';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });
    
    const [selectedPlant, setSelectedPlant] = useState(() => {
        const savedPlant = localStorage.getItem('selectedPlant');
        return savedPlant ? JSON.parse(savedPlant) : null;
    });

    // Global theme: 'light' or 'dark', default to 'light' (clean factory floor standard)
    const [theme, setTheme] = useState(() => {
        return localStorage.getItem('factory_theme') || 'light';
    });

    useEffect(() => {
        if (user) {
            localStorage.setItem('user', JSON.stringify(user));
        } else {
            localStorage.removeItem('user');
            localStorage.removeItem('selectedPlant');
            setSelectedPlant(null);
        }
    }, [user]);

    useEffect(() => {
        if (selectedPlant) {
            localStorage.setItem('selectedPlant', JSON.stringify(selectedPlant));
        } else {
            localStorage.removeItem('selectedPlant');
        }
    }, [selectedPlant]);

    useEffect(() => {
        localStorage.setItem('factory_theme', theme);
        document.documentElement.setAttribute('data-theme', theme);
    }, [theme]);

    const toggleTheme = () => {
        setTheme(prev => prev === 'light' ? 'dark' : 'light');
    };

    const login = (userData) => {
        setUser(userData);
    };

    const logout = () => {
        setUser(null);
    };

    const selectPlant = (plant) => {
        setSelectedPlant(plant);
    };

    return (
        <AuthContext.Provider value={{ 
            user, 
            selectedPlant, 
            login, 
            logout, 
            selectPlant,
            theme,
            toggleTheme
        }}>
            {children}
        </AuthContext.Provider>
    );
};
