import React, { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useAuth } from '../../services/auth';
import { userApi } from '../../services/apiClient';

const LoginPage = () => {
    const { login } = useAuth();
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setCredentials((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setError('');
        setSubmitting(true);
        try {
            const { data } = await userApi.post('/login', credentials);
            login({ role: data.role, userId: data.id, token: data.token });
        } catch (err) {
            setError(err.message || 'Could not sign in');
            setSubmitting(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="d-flex align-items-center justify-content-center gap-2 mb-4">
                    <span className="app-brand-mark">U</span>
                    <span className="fs-5 fw-bold text-body-emphasis">UDPT</span>
                </div>
                <div className="card">
                    <div className="card-body p-4">
                        <h1 className="h4 mb-1">Sign in</h1>
                        <p className="text-body-secondary mb-4">Welcome back to the employee portal.</p>
                        {error && <Alert variant="danger" className="py-2">{error}</Alert>}
                        <Form onSubmit={handleSubmit}>
                            <Form.Group className="mb-3" controlId="login-username">
                                <Form.Label>Username</Form.Label>
                                <Form.Control name="username" autoComplete="username" autoFocus required
                                              value={credentials.username} onChange={handleChange} />
                            </Form.Group>
                            <Form.Group className="mb-4" controlId="login-password">
                                <Form.Label>Password</Form.Label>
                                <Form.Control type="password" name="password" autoComplete="current-password" required
                                              value={credentials.password} onChange={handleChange} />
                            </Form.Group>
                            <Button type="submit" className="w-100" disabled={submitting}>
                                {submitting ? 'Signing in…' : 'Sign in'}
                            </Button>
                        </Form>
                    </div>
                </div>
                <div className="demo-accounts mt-3">
                    <div className="fw-semibold text-body mb-1">Demo accounts</div>
                    <div className="d-flex justify-content-between">
                        <span>Manager</span>
                        <span><code>admin</code> / <code>admin123</code></span>
                    </div>
                    <div className="d-flex justify-content-between">
                        <span>Employee</span>
                        <span><code>employee</code> / <code>employee123</code></span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
