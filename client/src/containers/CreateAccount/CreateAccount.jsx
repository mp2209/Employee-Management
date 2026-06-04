import React, { useState } from 'react';
import { userApi } from '../../services/apiClient';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import RightSidebar from '../RightSidebar/RightSidebar';
import './CreateAccount.scss';

const CreateAccount = () => {
    const [formData, setFormData] = useState({
        username: '',
        name: '',
        gender: '',
        taxNumber: '',
        identifyId: '',
        position: '',
        department: ''
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
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
            const response = await userApi.post('/', data);
            alert("Tạo tài khoản thành công!");
        } catch (error) {
            console.error('Error creating user:', error);
            alert(`Tạo tài khoản thất bại: ${error.response ? error.response.data.message : error.message}`);
        }
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
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3" controlId="formUsername">
                                    <Form.Label className='fw-bold'>Username:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="username"
                                        value={formData.username}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formName">
                                    <Form.Label className='fw-bold'>Họ tên:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formGender">
                                    <Form.Label className="fw-bold">Giới tính:</Form.Label>
                                    <div>
                                        <Form.Check
                                            type="radio"
                                            label="Nam"
                                            name="gender"
                                            value="Nam"
                                            checked={formData.gender === 'Nam'}
                                            onChange={handleChange}
                                        />
                                        <Form.Check
                                            type="radio"
                                            label="Nữ"
                                            name="gender"
                                            value="Nữ"
                                            checked={formData.gender === 'Nữ'}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formTaxNumber">
                                    <Form.Label className='fw-bold'>Mã số thuế:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="taxNumber"
                                        value={formData.taxNumber}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formIdentifyId">
                                    <Form.Label className='fw-bold'>CMND/CCCD:</Form.Label>
                                    <Form.Control
                                        type="number"
                                        name="identifyId"
                                        value={formData.identifyId}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formPosition">
                                    <Form.Label className='fw-bold'>Vị trí:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="position"
                                        value={formData.position}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="formDepartment">
                                    <Form.Label className='fw-bold'>Bộ phận:</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="department"
                                        value={formData.department}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                                <Button type="submit">Tạo</Button>
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