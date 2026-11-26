import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Modal, Button } from 'react-bootstrap';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';

import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { useAuth } from '../../services/auth';
import { employeeApi, pointApi } from '../../services/apiClient';
import './EditProfile.scss';
import avatar from '../../assets/avatar.png';

const EditProfile = () => {
    const { role, userId } = useAuth();
    const today = new Date();
    const [selectedDate, setSelectedDate] = useState(today);
    const [employee, setEmployee] = useState({});
    const [point, setPoint] = useState({});
    const [show, setShow] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    useEffect(() => {
        if (!userId) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const empRes = await employeeApi.get(`/${userId}`);
                if (cancelled) return;
                const data = empRes.data;
                setEmployee(data);
                const parts = data.birthDate?.split('/');
                if (parts?.length === 3) {
                    const [day, month, year] = parts;
                    const parsed = new Date(`${year}-${month}-${day}`);
                    if (!Number.isNaN(parsed.getTime())) setSelectedDate(parsed);
                }
            } catch (err) {
                if (!cancelled) setStatusMessage({ type: 'error', text: err.message });
            }
            try {
                const pointRes = await pointApi.get(`/${userId}`);
                if (!cancelled) setPoint(pointRes.data);
            } catch (err) {
                if (!cancelled) setStatusMessage({ type: 'error', text: err.message });
            }
        })();
        return () => { cancelled = true; };
    }, [userId]);

    const handleUpload = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append('file', file);
        try {
            const { data } = await employeeApi.post(
                `/${userId}/avatar`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            );
            setEmployee((prev) => ({ ...prev, avatar: data.avatar }));
        } catch (err) {
            setStatusMessage({ type: 'error', text: err.message });
        }
    };

    const handleChange = (event) => {
        const { name, value } = event.target;
        setEmployee((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const response = await employeeApi.put(`/${userId}`, employee);
            if (response.status === 200) {
                setStatusMessage({ type: 'success', text: 'Profile updated' });
            } else {
                setStatusMessage({ type: 'error', text: response.data?.message || 'Update failed' });
            }
        } catch (err) {
            setStatusMessage({ type: 'error', text: err.message });
        }
    };

    return (
        <React.Fragment>
            <Header />
            <div className="profile-section">
                <div className="row profile">
                    <div className="col l-widget">
                        <div className="avatar" align="center">
                            {employee.avatar ? (
                                <img src={`data:image/jpeg;base64,${employee.avatar}`} alt="Avatar" />
                            ) : (
                                <img src={avatar} alt="Avatar" />
                            )}
                            <FontAwesomeIcon
                                icon={faPenToSquare}
                                className="edit-avatar"
                                role="button"
                                title="Change avatar"
                                onClick={() => document.getElementById('fileInput').click()}
                            />
                            <input
                                type="file"
                                id="fileInput"
                                className="visually-hidden"
                                accept="image/*"
                                onChange={handleUpload}
                            />
                            <h3>{employee.name}</h3>
                        </div>
                        <div className="point row" align="center">
                            <h5>Points</h5>
                            <h4>{point.totalPoint ?? 0}</h4>

                            <div className="col-6">
                                <Button variant="primary" onClick={handleShow}>
                                    Points history
                                </Button>
                            </div>
                            {role === 'Manager' && (
                                <div className="col">
                                    <NavLink to="/give-point" className="btn btn-success">Give points</NavLink>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="col-8">
                        <div className="row info">
                            <div align="right">
                                <NavLink to="/profile" className="btn btn-secondary">Back</NavLink>
                            </div>
                            <form onSubmit={handleSubmit}>
                                <table className="info-table table table-bordered">
                                    <tbody>
                                        <tr>
                                            <td className="title">Date of birth:</td>
                                            <td>
                                                <DatePicker
                                                    selected={selectedDate}
                                                    onChange={(date) => setSelectedDate(date)}
                                                    dateFormat="dd/MM/yyyy"
                                                    className="form-control"
                                                />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="title">Phone number:</td>
                                            <td>
                                                <input className="form-control" type="text"
                                                    name="phoneNumber" defaultValue={employee.phoneNumber}
                                                    onChange={handleChange} />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="title">Address:</td>
                                            <td>
                                                <input className="form-control" type="text"
                                                    name="address" defaultValue={employee.address}
                                                    onChange={handleChange} />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="title">ID card number:</td>
                                            <td>
                                                <input className="form-control" type="text"
                                                    name="identifyId" defaultValue={employee.identifyId}
                                                    onChange={handleChange} />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="title">Tax number:</td>
                                            <td>
                                                <input className="form-control" type="text"
                                                    name="taxNumber" defaultValue={employee.taxNumber}
                                                    onChange={handleChange} />
                                            </td>
                                        </tr>
                                        <tr>
                                            <td className="title">Bank account:</td>
                                            <td>
                                                <input className="form-control" type="text"
                                                    name="bankNumber" defaultValue={employee.bankNumber}
                                                    onChange={handleChange} />
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                                <div align="right">
                                    <button className="btn btn-primary" type="submit">Save</button>
                                </div>
                            </form>
                            {statusMessage && (
                                <div className={`alert alert-${statusMessage.type === 'error' ? 'danger' : 'success'} mt-2`}>
                                    {statusMessage.text}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
            <Footer />

            <Modal show={show} onHide={handleClose}>
                <Modal.Header>
                    <Modal.Title><b>Points history</b></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <table className="table">
                        <thead>
                            <tr><th>Points</th><th>Message</th></tr>
                        </thead>
                        <tbody>
                            {point.historyPoints && point.historyPoints.length > 0 ? (
                                point.historyPoints.map((pnt) => (
                                    <tr key={pnt.id ?? `${pnt.dateSent}-${pnt.message}`}>
                                        <td>{pnt.pointsSent}</td>
                                        <td>{pnt.message}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="2">No data</td></tr>
                            )}
                        </tbody>
                    </table>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleClose}>Close</Button>
                </Modal.Footer>
            </Modal>
        </React.Fragment>
    );
};

export default EditProfile;
