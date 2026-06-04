/**
 * Centralized API client.
 *
 * All HTTP traffic to the backend goes through the API Gateway at the URL
 * configured via `REACT_APP_API_GATEWAY_URL`. Every backend service has a
 * dedicated axios instance so that base paths and timeouts can be tuned
 * independently.
 */
import axios from 'axios';

const GATEWAY_URL =
    process.env.REACT_APP_API_GATEWAY_URL || 'http://localhost:8080';

// Optional Vouchery API key (passed as Bearer token from the browser).
// In production the Vouchery integration should live behind the gateway.
const VOUCHERY_KEY =
    process.env.REACT_APP_VOUCHERY_API_KEY || '';
const VOUCHERY_URL =
    process.env.REACT_APP_VOUCHERY_API_URL || 'https://university-of-science.sandbox.vouchery.app';

const buildClient = (baseURL, timeoutMs = 15000) => {
    const client = axios.create({ baseURL, timeout: timeoutMs });

    // Attach JWT if present so the gateway can forward it.
    client.interceptors.request.use((config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });

    // Surface API error messages consistently.
    client.interceptors.response.use(
        (response) => response,
        (error) => {
            const message =
                error.response?.data?.message || error.message || 'Network error';
            return Promise.reject(new Error(message));
        }
    );

    return client;
};

// Each "service" is just a thin wrapper around a baseURL — every call
// still flows through the gateway so the frontend never needs to know
// the per-service ports.
export const userApi = buildClient(`${GATEWAY_URL}/api/users`);
export const employeeApi = buildClient(`${GATEWAY_URL}/api/employees`);
export const requestApi = buildClient(`${GATEWAY_URL}/api/requests`);
export const activityApi = buildClient(`${GATEWAY_URL}/api/activities`);
export const pointApi = buildClient(`${GATEWAY_URL}/api/points`);

// Vouchery (external) — uses its own base URL and Bearer key.
export const voucherApi = axios.create({
    baseURL: VOUCHERY_URL,
    timeout: 15000,
    headers: {
        Authorization: VOUCHERY_KEY ? `Bearer ${VOUCHERY_KEY}` : '',
    },
});

// Strava — kept client-side because Strava's OAuth requires a redirect.
// The client_id is non-secret; the client_secret must NEVER be embedded
// in the browser; it should be exchanged via the gateway.
export const STRAVA = {
    clientId: process.env.REACT_APP_STRAVA_CLIENT_ID || '',
    redirectUri: process.env.REACT_APP_STRAVA_REDIRECT_URI || 'http://localhost:3000/activities',
    scope: 'activity:read',
};
