import React, { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMountain, faPersonRunning, faRoute, faStopwatch } from '@fortawesome/free-solid-svg-icons';
import { activityApi, STRAVA } from '../../services/apiClient';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';

// Strava OAuth: the browser obtains an authorization code, and rewardPoint-service exchanges
// it for an access token (POST /api/activities/strava/token), because the exchange needs the
// client secret, which must never be shipped to the browser.

const TOKEN_STORAGE_KEY = 'strava_access_token';
const TOKEN_EXPIRY_KEY = 'strava_token_expiry';

const stravaAuthUrl =
    `https://www.strava.com/oauth/authorize?client_id=${STRAVA.clientId}` +
    `&response_type=code&redirect_uri=${encodeURIComponent(STRAVA.redirectUri)}` +
    `&scope=${encodeURIComponent(STRAVA.scope)}`;

const configured = Boolean(STRAVA.clientId && STRAVA.clubId);

const formatDistance = (meters) => `${((meters || 0) / 1000).toFixed(1)} km`;

const formatDuration = (seconds = 0) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return hours ? `${hours}h ${String(minutes).padStart(2, '0')}m` : `${minutes} min`;
};

const Stat = ({ icon, label, value }) => (
    <div>
        <div className="small text-body-secondary">
            <FontAwesomeIcon icon={icon} className="me-1" /> {label}
        </div>
        <div className="fw-semibold text-body-emphasis">{value}</div>
    </div>
);

const Activities = () => {
    const [accessToken, setAccessToken] = useState(null);
    const [tokenExpiry, setTokenExpiry] = useState(null);
    const [activities, setActivities] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!configured) return;

        const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
        const storedExpiry = Number(localStorage.getItem(TOKEN_EXPIRY_KEY));
        if (storedToken && storedExpiry && Date.now() < storedExpiry) {
            setAccessToken(storedToken);
            setTokenExpiry(storedExpiry);
            return;
        }
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_EXPIRY_KEY);

        const code = new URLSearchParams(window.location.search).get('code');
        if (!code) {
            window.location.href = stravaAuthUrl;
            return;
        }

        (async () => {
            try {
                const { data } = await activityApi.post('/strava/token', { code });
                const expiry = Date.now() + data.expires_in * 1000;
                setAccessToken(data.access_token);
                setTokenExpiry(expiry);
                localStorage.setItem(TOKEN_STORAGE_KEY, data.access_token);
                localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiry));
                window.history.replaceState({}, document.title, STRAVA.redirectUri);
            } catch (err) {
                setError(err.message);
            }
        })();
    }, []);

    useEffect(() => {
        if (!accessToken || !tokenExpiry || Date.now() >= tokenExpiry) {
            return undefined;
        }
        let cancelled = false;
        (async () => {
            try {
                const response = await fetch(
                    `https://www.strava.com/api/v3/clubs/${STRAVA.clubId}/activities`,
                    { headers: { Authorization: `Bearer ${accessToken}` } }
                );
                const data = await response.json();
                if (!cancelled) setActivities(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            }
        })();
        return () => { cancelled = true; };
    }, [accessToken, tokenExpiry]);

    return (
        <>
            <PageHeader title="Club activities" subtitle="Recent workouts from the company's Strava club." />

            {!configured ? (
                <div className="card">
                    <EmptyState icon={faPersonRunning} title="Strava is not connected">
                        Set <code>STRAVA_CLIENT_ID</code>, <code>STRAVA_CLIENT_SECRET</code> and
                        {' '}<code>STRAVA_CLUB_ID</code> in <code>.env</code> to show club activities.
                    </EmptyState>
                </div>
            ) : (
                <>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {activities.length === 0 && !error ? (
                        <div className="card">
                            <EmptyState icon={faPersonRunning} title="No activities yet">
                                Activities logged by club members will appear here.
                            </EmptyState>
                        </div>
                    ) : (
                        <div className="row g-3">
                            {activities.map((activity, index) => {
                                const athlete = `${activity.athlete?.firstname || ''} ${activity.athlete?.lastname || ''}`.trim();
                                return (
                                    <div className="col-md-6 col-xl-4" key={activity.id ?? index}>
                                        <div className="card h-100">
                                            <div className="card-body">
                                                <div className="d-flex align-items-center gap-3 mb-3">
                                                    <Avatar name={athlete} />
                                                    <div className="flex-grow-1" style={{ minWidth: 0 }}>
                                                        <div className="fw-semibold text-body-emphasis text-truncate">{athlete || 'Club member'}</div>
                                                        <div className="small text-body-secondary text-truncate">{activity.name}</div>
                                                    </div>
                                                    <span className="badge badge-soft-primary">{activity.type}</span>
                                                </div>
                                                <div className="d-flex justify-content-between">
                                                    <Stat icon={faRoute} label="Distance" value={formatDistance(activity.distance)} />
                                                    <Stat icon={faStopwatch} label="Moving time" value={formatDuration(activity.moving_time)} />
                                                    <Stat icon={faMountain} label="Elevation" value={`${Math.round(activity.total_elevation_gain || 0)} m`} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </>
            )}
        </>
    );
};

export default Activities;
