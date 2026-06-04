import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { Form, FormControl, Button } from 'react-bootstrap';
import { useAuth } from '../../services/auth';
import { userApi, employeeApi } from '../../services/apiClient';

import './Header.scss';
import avatar from '../../assets/avatar.png';

const Header = () => {
    const { isLoggedIn, role, userId, login, logout } = useAuth();
    const [fullName, setFullName] = useState('');
    const [formData, setFormData] = useState({ username: '', password: '' });
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const handleChange = useCallback((event) => {
        const { name, value } = event.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    }, []);

    const handleSubmit = async (event) => {
        event.preventDefault();
        setErrorMessage('');
        try {
            const response = await userApi.post('/login', formData);
            if (response.status === 200 && response.data?.token) {
                login({
                    role: response.data.role,
                    userId: response.data.id,
                    token: response.data.token,
                });
                navigate('/');
            } else {
                setErrorMessage(response.data?.message || 'Login failed');
            }
        } catch (error) {
            setErrorMessage(error.message || 'An error occurred while logging in');
        }
    };

    useEffect(() => {
        if (!isLoggedIn || !userId) {
            return undefined;
        }
        let cancelled = false;
        (async () => {
            try {
                const { data } = await employeeApi.get(`/name/${userId}`);
                if (!cancelled) setFullName(data);
            } catch (error) {
                if (!cancelled) setFullName('');
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [isLoggedIn, userId]);

    const handleLogout = useCallback(() => {
        logout();
        navigate('/');
    }, [logout, navigate]);

    const navLinks = useMemo(() => {
        const links = [{ to: '/', label: 'Thông báo' }];
        if (role === 'Employee') {
            links.push(
                { to: '/leave', label: 'Nghỉ phép' },
                { to: '/update-time-sheet', label: 'Update Time-sheet' },
                { to: '/work-from-home', label: 'Work from home' }
            );
        }
        if (role === 'Manager') {
            links.push(
                { to: '/approve', label: 'Approve' },
                { to: '/activities', label: 'Activities' }
            );
        }
        links.push({ to: '/voucher', label: 'Voucher' });
        if (role === 'Manager') {
            links.push({ to: '/create-account', label: 'Create Account' });
        }
        return links;
    }, [role]);

    return (
        <header className="header-homepage">
            <div className="d-flex align-items-center text-center py-3 background-top-nav">
                <div className="header-top-nav">
                    <div className="logo-banner-frame">
                        <NavLink to="/">
                            <h2>Project</h2>
                        </NavLink>
                    </div>
                    {!isLoggedIn ? (
                        <div className="header-login-frame">
                            <Form className="login-form" onSubmit={handleSubmit}>
                                <FormControl
                                    type="text"
                                    name="username"
                                    placeholder="Username"
                                    className="mr-sm-2"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                                <FormControl
                                    type="password"
                                    name="password"
                                    placeholder="Password"
                                    className="mr-sm-2"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                />
                                <Button type="submit" variant="warning">Login</Button>
                                {errorMessage && (
                                    <div className="text-danger mt-2 small">{errorMessage}</div>
                                )}
                            </Form>
                        </div>
                    ) : (
                        <div>
                            <NavLink to="/profile">
                                <div className="btn btn-light">
                                    <p><b>{fullName || 'Loading…'}</b></p>
                                </div>
                            </NavLink>
                            <button type="button" className="btn btn-dark logout-btn" onClick={handleLogout}>
                                Đăng xuất
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className="header-menu">
                {navLinks.map(({ to, label }) => (
                    <NavLink key={to} to={to} className="child-content">
                        {label}
                    </NavLink>
                ))}
            </div>
        </header>
    );
};

export default Header;
