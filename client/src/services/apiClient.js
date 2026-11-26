/**
 * Centralized API clients.
 *
 * Every request goes through the API Gateway (`REACT_APP_API_GATEWAY_URL`), which verifies
 * the JWT and routes to the right microservice. Third-party APIs (Vouchery, Strava token
 * exchange) are proxied by the backend too, so no API key or client secret ever ships in
 * this bundle.
 */
import axios from 'axios';

const GATEWAY_URL = process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:8080';

/** Fired when the gateway rejects our token (expired or invalid); AuthProvider logs out. */
export const AUTH_EXPIRED_EVENT = 'auth:expired';

/**
 * @param logoutOnUnauthorized treat HTTP 401 as an expired session. Disabled for proxied
 *        third-party APIs, whose 401 means the server-side API key is missing or wrong.
 */
const buildClient = (baseURL, { logoutOnUnauthorized = true, timeoutMs = 15000 } = {}) => {
    const client = axios.create({ baseURL, timeout: timeoutMs });

    client.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    client.interceptors.response.use(
        (response) => response,
        (error) => {
            if (logoutOnUnauthorized && error.response?.status === 401 && localStorage.getItem('token')) {
                window.dispatchEvent(new Event(AUTH_EXPIRED_EVENT));
            }
            const message = error.response?.data?.message || error.message || 'Network error';
            const apiError = new Error(message);
            apiError.status = error.response?.status;
            return Promise.reject(apiError);
        }
    );

    return client;
};

// Call these with '' (not '/') for the collection root: Spring does not match trailing slashes.
export const userApi = buildClient(`${GATEWAY_URL}/api/users`);
export const employeeApi = buildClient(`${GATEWAY_URL}/api/employees`);
export const requestApi = buildClient(`${GATEWAY_URL}/api/requests`);
export const activityApi = buildClient(`${GATEWAY_URL}/api/activities`);
export const pointApi = buildClient(`${GATEWAY_URL}/api/points`);

// Vouchery v2.1 API, proxied by the gateway (which adds the API key).
export const voucherApi = buildClient(`${GATEWAY_URL}/api/vouchery`, { logoutOnUnauthorized: false });

// Strava OAuth: the client id is public; the secret lives in rewardPoint-service.
export const STRAVA = {
    clientId: process.env.REACT_APP_STRAVA_CLIENT_ID || '',
    redirectUri: process.env.REACT_APP_STRAVA_REDIRECT_URI || 'http://localhost:3000/activities',
    clubId: process.env.REACT_APP_STRAVA_CLUB_ID || '',
    scope: 'activity:read',
};
