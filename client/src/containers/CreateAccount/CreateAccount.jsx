import React, { useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCopy } from '@fortawesome/free-solid-svg-icons';
import { userApi } from '../../services/apiClient';
import { useToast } from '../../services/toast';
import PageHeader from '../../components/PageHeader';

const EMPTY_FORM = {
    username: '',
    name: '',
    gender: '',
    identifyId: '',
    taxNumber: '',
    position: '',
    department: '',
};

const CreateAccount = () => {
    const toast = useToast();
    const [form, setForm] = useState(EMPTY_FORM);
    const [created, setCreated] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setCreated(null);
        setErrorMessage('');
        setSubmitting(true);
        try {
            const { data } = await userApi.post('', {
                user: { username: form.username.trim(), role: 'Employee', status: 'Active' },
                employee: {
                    name: form.name.trim(),
                    gender: form.gender,
                    identifyId: form.identifyId.trim(),
                    taxNumber: form.taxNumber.trim(),
                    position: form.position.trim(),
                    department: form.department.trim(),
                    status: 'Active',
                },
            });
            // The temporary password is returned only once; the manager hands it to the employee.
            setCreated({ username: data.user.username, password: data.temporaryPassword });
            setForm(EMPTY_FORM);
        } catch (error) {
            setErrorMessage(`Could not create the account: ${error.message}`);
        } finally {
            setSubmitting(false);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    const copyPassword = async () => {
        try {
            await navigator.clipboard.writeText(created.password);
            toast.success('Password copied');
        } catch {
            toast.error('Could not copy; select the password and copy it manually.');
        }
    };

    return (
        <>
            <PageHeader title="Create account"
                        subtitle="Add a new employee. They sign in with a temporary password generated for them." />

            <div className="row">
                <div className="col-xl-9">
                    {created && (
                        <Alert variant="success" onClose={() => setCreated(null)} dismissible>
                            <div className="fw-semibold mb-2">Account created for {created.username}</div>
                            <div className="d-flex flex-wrap align-items-center gap-2">
                                Temporary password:
                                <code className="fs-6 px-2 py-1 bg-white rounded border">{created.password}</code>
                                <Button size="sm" variant="outline-secondary" onClick={copyPassword}>
                                    <FontAwesomeIcon icon={faCopy} /> Copy
                                </Button>
                            </div>
                            <div className="small mt-2">This password is shown only once. Share it with the employee now.</div>
                        </Alert>
                    )}
                    {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}

                    <div className="card">
                        <div className="card-body p-4">
                            <Form onSubmit={handleSubmit}>
                                <div className="form-section-title">Account</div>
                                <div className="row g-3 mb-4">
                                    <Form.Group className="col-md-6" controlId="account-username">
                                        <Form.Label>Username</Form.Label>
                                        <Form.Control name="username" required autoComplete="off"
                                                      value={form.username} onChange={handleChange} />
                                    </Form.Group>
                                </div>

                                <div className="form-section-title">Personal details</div>
                                <div className="row g-3 mb-4">
                                    <Form.Group className="col-md-6" controlId="account-name">
                                        <Form.Label>Full name</Form.Label>
                                        <Form.Control name="name" required value={form.name} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="col-md-6" controlId="account-gender">
                                        <Form.Label>Gender</Form.Label>
                                        <Form.Select name="gender" value={form.gender} onChange={handleChange}>
                                            <option value="">Select…</option>
                                            <option value="Male">Male</option>
                                            <option value="Female">Female</option>
                                        </Form.Select>
                                    </Form.Group>
                                    <Form.Group className="col-md-6" controlId="account-identify-id">
                                        <Form.Label>ID card number</Form.Label>
                                        <Form.Control name="identifyId" required inputMode="numeric"
                                                      value={form.identifyId} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="col-md-6" controlId="account-tax-number">
                                        <Form.Label>Tax number</Form.Label>
                                        <Form.Control name="taxNumber" inputMode="numeric"
                                                      value={form.taxNumber} onChange={handleChange} />
                                    </Form.Group>
                                </div>

                                <div className="form-section-title">Job</div>
                                <div className="row g-3 mb-4">
                                    <Form.Group className="col-md-6" controlId="account-position">
                                        <Form.Label>Position</Form.Label>
                                        <Form.Control name="position" value={form.position} onChange={handleChange} />
                                    </Form.Group>
                                    <Form.Group className="col-md-6" controlId="account-department">
                                        <Form.Label>Department</Form.Label>
                                        <Form.Control name="department" value={form.department} onChange={handleChange} />
                                    </Form.Group>
                                </div>

                                <div className="d-flex justify-content-end gap-2">
                                    <Button variant="outline-secondary" onClick={() => setForm(EMPTY_FORM)}>Clear</Button>
                                    <Button type="submit" disabled={submitting}>
                                        {submitting ? 'Creating…' : 'Create account'}
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateAccount;
