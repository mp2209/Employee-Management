import React, { useState } from 'react';
import { userApi } from '../../services/apiClient';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import RightSidebar from '../RightSidebar/RightSidebar';
import './CreateAccount.scss';

const EMPTY_FORM = {
    username: '',
    name: '',
    gender: '',
    taxNumber: '',
    identifyId: '',
    position: '',
    department: ''
};

const CreateAccount = () => {
    const [formData, setFormData] = useState(EMPTY_FORM);
    const [created, setCreated] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setCreated(null);
        setErrorMessage('');
        const data = {
            user: {
                status: 'Active',
                role: 'Employee',
                username: formData.username
            },
            employee: {
                name: formData.name,
                birthDate: '',
                avatar: '',
                gender: formData.gender,
                taxNumber: formData.taxNumber,
                identifyId: formData.identifyId,
                address: '',
                phoneNumber: '',
                bankNumber: '',
                position: formData.position,
                department: formData.department,
                status: 'Active'
            }
        };

        try {
            const { data: response } = await userApi.post('', data);
            // The temporary password is returned only once; the manager hands it to the employee.
            setCreated({ username: response.user.username, password: response.temporaryPassword });
            setFormData(EMPTY_FORM);
        } catch (error) {
            setErrorMessage(`Could not create the account: ${error.message}`);
        }
        // The result banner sits above the form; make sure it is visible.
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <React.Fragment>
            <Header />
            <section>
                <div className='content-frame'>
                    <div className="d-flex align-items-center justify-content-center m-3 wfh-header">
                        <div className="mb-3">
                            <h5 className="card-title">Create Account</h5>
                        </div>
                    </div>
                    <div className='wfh-info'>
                        <div className='wfh-info-content'>
                            {created && (
                                <Alert variant="success" onClose={() => setCreated(null)} dismissible>
                                    <Alert.Heading>Account created</Alert.Heading>
                                    <p className="mb-1">Username: <b>{created.username}</b></p>
                                    <p className="mb-1">Temporary password: <code className="fs-5">{created.password}</code></p>
                                    <small>This password is shown only once. Share it with the employee now.</small>
                                </Alert>
                            )}
                            {errorMessage && <Alert variant="danger">{errorMessage}</Alert>}
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formUsername">
                                    <Form.Label className='fw-bold'>Username:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formName">
                                    <Form.Label className='fw-bold'>Full name:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formGender">
                                    <Form.Label className="fw-bold">Gender:</Form.Label>
                                    <div>
                                        <Form.Check
                                            type="radio"
                                            label="Male"
                                            name="gender"
                                            value="Male"
                                            checked={formData.gender === 'Male'}
                                            onChange={handleChange}
                                        />
                                        <Form.Check
                                            type="radio"
                                            label="Female"
                                            name="gender"
                                            value="Female"
                                            checked={formData.gender === 'Female'}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formTaxNumber">
                                    <Form.Label className='fw-bold'>Tax number:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="taxNumber"
                                        value={formData.taxNumber}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formIdentifyId">
                                    <Form.Label className='fw-bold'>ID card number:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="identifyId"
                                        value={formData.identifyId}
                                        onChange={handleChange}
                                        required
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formPosition">
                                    <Form.Label className='fw-bold'>Position:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formDepartment">
                                    <Form.Label className='fw-bold'>Department:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                                <Button type="submit">Create</Button>
                            </Form>
                        </div>
                    </div>
                </div>
                <RightSidebar />
            </section>
            <Footer />
        </React.Fragment>
    );
};

export default CreateAccount;
