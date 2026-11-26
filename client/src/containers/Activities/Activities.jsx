import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import RightSidebar from '../RightSidebar/RightSidebar';
import Footer from '../Footer/Footer';
import { activityApi, STRAVA } from '../../services/apiClient';
import './Activities.scss';

// Strava OAuth: the browser obtains an authorization code, and rewardPoint-service exchanges
// it for an access token (POST /api/activities/strava/token), because the exchange needs the
// client secret, which must never be shipped to the browser.

const TOKEN_STORAGE_KEY = 'strava_access_token';
const TOKEN_EXPIRY_KEY = 'strava_token_expiry';

const stravaAuthUrl =
    `https://www.strava.com/oauth/authorize?client_id=${STRAVA.clientId}` +
    `&response_type=code&redirect_uri=${encodeURIComponent(STRAVA.redirectUri)}` +
    `&scope=${encodeURIComponent(STRAVA.scope)}`;

const Activities = () => {
    const [accessToken, setAccessToken] = useState(null);
    const [tokenExpiry, setTokenExpiry] = useState(null);
    const [activityList, setActivityList] = useState([]);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!STRAVA.clientId) return;

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
        if (!accessToken || !tokenExpiry || Date.now() >= tokenExpiry || !STRAVA.clubId) {
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
                if (!cancelled) setActivityList(Array.isArray(data) ? data : []);
            } catch (err) {
                if (!cancelled) setError(err.message);
            }
        })();
        return () => { cancelled = true; };
    }, [accessToken, tokenExpiry]);

    if (!STRAVA.clientId || !STRAVA.clubId) {
        return (
            <React.Fragment>
                <Header />
                <section>
                    <div className="content-frame p-4">
                        <div className="alert alert-warning">
                            Strava integration is not configured. Set
                            <code> STRAVA_CLIENT_ID </code>, <code> STRAVA_CLIENT_SECRET </code> and
                            <code> STRAVA_CLUB_ID </code> in <code>.env</code> to enable Activities.
                        </div>
                    </div>
                    <RightSidebar />
                </section>
                <Footer />
            </React.Fragment>
        );
    }

    return (
        <React.Fragment>
            <Header />
            <section>
                <div className="content-frame">
                    <div className="d-flex align-items-center m-3 border-bottom border-dark">
                        <h5 className="card-title mb-3">Club Activities</h5>
                    </div>
                    {error && <div className="alert alert-danger m-3">{error}</div>}
                    <div className="activities-list">
                        {activityList.map((item, index) => (
                            <div className="activity-card" key={item.id ?? index}>
                                <div className="d-flex align-items justify-content-between px-2 py-2 border-bottom border-dark">
                                    <span className="card-title">
                                        {item.athlete?.lastname} {item.athlete?.firstname}
                                    </span>
                                </div>
                                <div className="activity-detail">
                                    <div className="activity-info">
                                        <h6>Distance: </h6>
                                        <span>{item.distance} meters</span>
                                    </div>
                                    <div className="activity-info">
                                        <h6>Moving time: </h6>
                                        <span>{item.moving_time} seconds</span>
                                    </div>
                                    <div className="activity-info">
                                        <h6>Elevation gain: </h6>
                                        <span>{item.total_elevation_gain} m</span>
                                    </div>
                                    <div className="activity-info">
                                        <h6>Elapsed time: </h6>
                                        <span>{item.elapsed_time} seconds</span>
                                    </div>
                                    <div className="activity-info">
                                        <h6>Type: </h6>
                                        <span>{item.type}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                <RightSidebar />
            </section>
            <Footer />
        </React.Fragment>
    );
};

export default Activities;
