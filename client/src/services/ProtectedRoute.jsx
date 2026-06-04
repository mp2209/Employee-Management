import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from './auth';

const ProtectedRoute = ({ element, roles }) => {
    const { isLoggedIn, role } = useAuth();

    if (!isLoggedIn) {
        return <Navigate to="/" replace />;
    }

    if (Array.isArray(roles) && roles.length > 0 && !roles.includes(role)) {
        return <Navigate to="/" replace />;
    }

    return element;
};

export default ProtectedRoute;
