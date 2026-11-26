import React, { useCallback, useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faBars, faClock, faGift, faHouse, faHouseLaptop, faListCheck, faPersonRunning,
    faPlaneDeparture, faRightFromBracket, faTicket, faUser, faUserPlus,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../services/auth';
import { employeeApi } from '../services/apiClient';
import ErrorBoundary from '../services/ErrorBoundary';
import Avatar from './Avatar';

const NAV_SECTIONS = [
    {
        title: 'Overview',
        items: [
            { to: '/', label: 'Dashboard', icon: faHouse, end: true },
            { to: '/voucher', label: 'Vouchers', icon: faTicket },
        ],
    },
    {
        title: 'My requests',
        role: 'Employee',
        items: [
            { to: '/leave', label: 'Leave', icon: faPlaneDeparture },
            { to: '/work-from-home', label: 'Work from home', icon: faHouseLaptop },
            { to: '/update-time-sheet', label: 'Timesheet', icon: faClock },
        ],
    },
    {
        title: 'Management',
        role: 'Manager',
        items: [
            { to: '/approve', label: 'Approvals', icon: faListCheck },
            { to: '/give-point', label: 'Give points', icon: faGift },
            { to: '/activities', label: 'Activities', icon: faPersonRunning },
            { to: '/create-account', label: 'Create account', icon: faUserPlus },
        ],
    },
    {
        title: 'Account',
        items: [{ to: '/profile', label: 'My profile', icon: faUser }],
    },
];

const Brand = ({ withTagline }) => (
    <>
        <span className="app-brand-mark">U</span>
        <span>
            UDPT
            {withTagline && <small>Employee portal</small>}
        </span>
    </>
);

/** App shell: sidebar navigation (a drawer on small screens) and the page content. */
const Layout = () => {
    const { role, userId, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const reloadEmployee = useCallback(async () => {
        if (!userId) return;
        try {
            const { data } = await employeeApi.get(`/${userId}`);
            setEmployee(data);
        } catch {
            setEmployee(null);
        }
    }, [userId]);

    useEffect(() => {
        reloadEmployee();
    }, [reloadEmployee]);

    useEffect(() => {
        setMenuOpen(false);
    }, [location.pathname]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    const sections = NAV_SECTIONS.filter((section) => !section.role || section.role === role);

    return (
        <div className="app-shell">
            <aside className={`app-sidebar${menuOpen ? ' is-open' : ''}`}>
                <div className="app-brand">
                    <Brand withTagline />
                </div>
                <nav className="app-nav" aria-label="Main">
                    {sections.map((section) => (
                        <div key={section.title}>
                            <div className="app-nav-section">{section.title}</div>
                            {section.items.map((item) => (
                                <NavLink key={item.to} to={item.to} end={item.end} className="app-nav-link">
                                    <FontAwesomeIcon icon={item.icon} className="app-nav-icon" fixedWidth />
                                    {item.label}
                                </NavLink>
                            ))}
                        </div>
                    ))}
                </nav>
                <div className="app-user">
                    <Avatar name={employee?.name} image={employee?.avatar} />
                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                        <div className="app-user-name text-truncate">{employee?.name || 'Loading…'}</div>
                        <div className="app-user-role">{role}</div>
                    </div>
                    <button type="button" className="btn btn-icon" title="Log out" aria-label="Log out"
                            onClick={handleLogout}>
                        <FontAwesomeIcon icon={faRightFromBracket} />
                    </button>
                </div>
            </aside>
            {menuOpen && <div className="app-backdrop" onClick={() => setMenuOpen(false)} />}

            <div className="app-main">
                <header className="app-topbar">
                    <button type="button" className="btn btn-icon" aria-label="Open menu" onClick={() => setMenuOpen(true)}>
                        <FontAwesomeIcon icon={faBars} />
                    </button>
                    <Brand />
                </header>
                <main className="app-content">
                    <ErrorBoundary key={location.pathname}>
                        <Outlet context={{ employee, reloadEmployee }} />
                    </ErrorBoundary>
                </main>
            </div>
        </div>
    );
};

export default Layout;
