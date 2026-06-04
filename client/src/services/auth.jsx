import React, { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEYS = {
    isLoggedIn: 'isLoggedIn',
    role: 'role',
    userid: 'userid',
    token: 'token',
};

const readStorage = () => ({
    isLoggedIn: localStorage.getItem(STORAGE_KEYS.isLoggedIn) === 'true',
    role: localStorage.getItem(STORAGE_KEYS.role) || '',
    userId: localStorage.getItem(STORAGE_KEYS.userid) || '',
    token: localStorage.getItem(STORAGE_KEYS.token) || '',
});

const writeAll = ({ isLoggedIn, role, userId, token }) => {
    localStorage.setItem(STORAGE_KEYS.isLoggedIn, String(isLoggedIn));
    if (role !== undefined) localStorage.setItem(STORAGE_KEYS.role, role);
    if (userId !== undefined) localStorage.setItem(STORAGE_KEYS.userid, userId);
    if (token !== undefined) localStorage.setItem(STORAGE_KEYS.token, token);
};

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState(readStorage);

    useEffect(() => {
        writeAll({
            isLoggedIn: auth.isLoggedIn,
            role: auth.role,
            userId: auth.userId,
            token: auth.token,
        });
    }, [auth]);

    const login = useCallback(({ role, userId, token } = {}) => {
        setAuth((prev) => ({
            ...prev,
            isLoggedIn: true,
            role: role ?? prev.role,
            userId: userId ?? prev.userId,
            token: token ?? prev.token,
        }));
    }, []);

    const logout = useCallback(() => {
        setAuth({ isLoggedIn: false, role: '', userId: '', token: '' });
    }, []);

    const value = useMemo(
        () => ({ ...auth, login, logout }),
        [auth, login, logout]
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an <AuthProvider>');
    }
    return ctx;
};
