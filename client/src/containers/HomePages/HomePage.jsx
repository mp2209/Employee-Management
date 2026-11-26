import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
    faArrowRight, faBullhorn, faChevronRight, faClock, faCoins, faHouseLaptop, faListCheck, faPlaneDeparture,
} from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../services/auth';
import { pointApi, requestApi } from '../../services/apiClient';
import PageHeader from '../../components/PageHeader';
import AttendanceCard from '../../components/AttendanceCard';

const ANNOUNCEMENTS = [
    { title: 'National Day (Sep 2) holiday schedule', date: '27 Aug 2024' },
    { title: 'Most active employees: July', date: '02 Aug 2024' },
    { title: 'Updated staff lists for all departments', date: '01 Aug 2024' },
    { title: 'Outstanding employee awards: Q2', date: '10 Jul 2024' },
    { title: 'Most active employees: June', date: '02 Jul 2024' },
    { title: 'Company trip plan', date: '25 Jun 2024' },
    { title: 'Talk: lessons learned in project management', date: '20 Jun 2024' },
    { title: 'New activity: running club', date: '01 Jun 2024' },
    { title: 'Guide to the new company intranet', date: '15 May 2024' },
    { title: 'Intranet upgrade notice', date: '15 May 2024' },
];

const QUICK_ACTIONS = [
    { to: '/leave', label: 'Request leave', icon: faPlaneDeparture },
    { to: '/work-from-home', label: 'Work from home', icon: faHouseLaptop },
    { to: '/update-time-sheet', label: 'Fix a timesheet', icon: faClock },
];

const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

const StatCard = ({ icon, label, value, to, linkLabel }) => (
    <div className="card h-100">
        <div className="card-body d-flex flex-column">
            <div className="d-flex align-items-center gap-3 mb-3">
                <span className="icon-tile"><FontAwesomeIcon icon={icon} /></span>
                <span className="stat-label">{label}</span>
            </div>
            <div className="stat-value">{value ?? '—'}</div>
            <div className="mt-auto pt-3">
                <Link to={to} className="small fw-medium">
                    {linkLabel} <FontAwesomeIcon icon={faArrowRight} className="ms-1" />
                </Link>
            </div>
        </div>
    </div>
);

const HomePage = () => {
    const { role, userId } = useAuth();
    const { employee } = useOutletContext();
    const [points, setPoints] = useState(null);
    const [pendingCount, setPendingCount] = useState(null);

    useEffect(() => {
        let cancelled = false;
        pointApi.get(`/${userId}`)
            .then(({ data }) => !cancelled && setPoints(data.totalPoint ?? 0))
            .catch(() => !cancelled && setPoints(null));
        if (role === 'Manager') {
            requestApi.get('/not-approved')
                .then(({ data }) => !cancelled && setPendingCount(data.length))
                .catch(() => !cancelled && setPendingCount(null));
        }
        return () => { cancelled = true; };
    }, [role, userId]);

    const firstName = employee?.name?.split(' ')[0];
    const today = new Date().toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });

    return (
        <>
            <PageHeader title={`${greeting()}${firstName ? `, ${firstName}` : ''}`} subtitle={today} />

            <div className="row g-4 mb-4">
                <div className="col-lg-4">
                    <AttendanceCard />
                </div>
                <div className="col-md-6 col-lg-4">
                    <StatCard icon={faCoins} label="Points balance" value={points}
                              to="/voucher" linkLabel="Redeem vouchers" />
                </div>
                <div className="col-md-6 col-lg-4">
                    {role === 'Manager' ? (
                        <StatCard icon={faListCheck} label="Pending approvals" value={pendingCount}
                                  to="/approve" linkLabel="Review requests" />
                    ) : (
                        <div className="card h-100">
                            <div className="card-header">
                                <h2 className="card-title">Quick actions</h2>
                            </div>
                            {QUICK_ACTIONS.map((action) => (
                                <Link key={action.to} to={action.to} className="list-row list-row-link">
                                    <span className="d-flex align-items-center gap-3">
                                        <FontAwesomeIcon icon={action.icon} fixedWidth className="text-primary" />
                                        {action.label}
                                    </span>
                                    <FontAwesomeIcon icon={faChevronRight} className="text-body-secondary small" />
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Announcements</h2>
                </div>
                {ANNOUNCEMENTS.map((announcement) => (
                    <div key={announcement.title} className="list-row">
                        <span className="d-flex align-items-center gap-3">
                            <FontAwesomeIcon icon={faBullhorn} fixedWidth className="text-body-secondary" />
                            <span className="text-body-emphasis">{announcement.title}</span>
                        </span>
                        <span className="small text-body-secondary text-nowrap">{announcement.date}</span>
                    </div>
                ))}
            </div>
        </>
    );
};

export default HomePage;
