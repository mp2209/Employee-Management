import React, { useEffect, useState } from 'react';
import { useAuth } from '../../services/auth';
import { employeeApi, pointApi } from '../../services/apiClient';
import { Form, Button, Modal } from "react-bootstrap";

import Header from '../Header/Header';
import RightSidebar from '../RightSidebar/RightSidebar';
import Footer from '../Footer/Footer';
import './GivePoint.scss';

const GivePoint = () => {
    const [employees, setEmployees] = useState([]);
    const [show, setShow] = useState(false);
    const [curEmp, setCurEmp] = useState({ userId: 0, name: '', point: 0 });
    const { userId } = useAuth();

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    const [formData, setFormData] = useState({ point: '', message: '' });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [employeeResponse, pointResponse] = await Promise.all([
                    employeeApi.get(''),
                    pointApi.get(''),
                ]);
                if (cancelled) return;
                const points = pointResponse.data;
                // Wallets are keyed by the owner's user id, not by the employee profile id.
                const others = employeeResponse.data
                    .filter((employee) => employee.userId !== Number(userId))
                    .map((employee) => {
                        const wallet = points.find((point) => point.uid === employee.userId);
                        return { ...employee, point: wallet ? wallet.totalPoint : 0 };
                    });
                setEmployees(others);
            } catch (error) {
                if (!cancelled) {
                    alert(`Error fetching data: ${error.message}`);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [userId]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        try {
            const { data } = await pointApi.post('/send', null, {
                params: {
                    managerId: userId,
                    employeeId: curEmp.userId,
                    points: formData.point,
                    message: formData.message
                }
            });
            setEmployees((prev) => prev.map((employee) =>
                employee.userId === curEmp.userId ? { ...employee, point: data.totalPoint } : employee));
            alert('Points sent');
        } catch (error) {
            alert(error.message || 'An error occurred while sending points');
        }
        handleClose();
    };

    return (
        <React.Fragment>
            <Header />
            <section>
                <div className='content-frame'>
                    <div className="d-flex align-items-center m-3 update-timesheet-header">
                        <div className="col-md-6">
                            <div className="mb-3">
                                <h5 className="card-title">Employees</h5>
                            </div>
                        </div>
                    </div>
                    <div className="list-frame">
                        <div className="col-lg-12">
                            <div className="update-timesheet-history">
                                <table className="table uts-table table-nowrap align-middle table-borderless">
                                    <thead className='sticky-header'>
                                    <tr>
                                        <th scope="col">Name</th>
                                        <th scope="col">Date of birth</th>
                                        <th scope="col">Address</th>
                                        <th scope="col">Position</th>
                                        <th scope="col">Department</th>
                                        <th scope="col">Points</th>
                                        <th scope="col"></th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {employees.length > 0 ? (
                                        employees.map((employee) => (
                                            <tr key={employee.id}>
                                                <td>{employee.name}</td>
                                                <td>{employee.birthDate}</td>
                                                <td>{employee.address}</td>
                                                <td>{employee.position}</td>
                                                <td>{employee.department}</td>
                                                <td className="point">{employee.point}</td>
                                                <td>
                                                    <Button variant="primary" onClick={() => {
                                                        setCurEmp({
                                                            userId: employee.userId,
                                                            name: employee.name,
                                                            point: employee.point
                                                        });
                                                        setFormData({ point: '', message: '' });
                                                        handleShow();
                                                    }}>
                                                        Give points
                                                    </Button>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="7">No data</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <RightSidebar />
            </section>
            <Footer />

            <Modal show={show} onHide={handleClose}>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header>
                        <Modal.Title className="row modal-add-point">
                            <div className="col">
                                {curEmp.name}
                            </div>
                            <div className="col" align="right">
                                Points: <b>{curEmp.point}</b>
                            </div>
                        </Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="givePointAmount">
                            <Form.Label className='fw-bold'>Points to give: </Form.Label>
                            <Form.Control
                                type="number"
                                name="point"
                                min="1"
                                value={formData.point}
                                onChange={handleChange}
                                required
                            />
                        </Form.Group>

                        <Form.Group className="mb-3" controlId="givePointMessage">
                            <Form.Label className='fw-bold'>Message: </Form.Label>
                            <Form.Control
                                as="textarea"
                                name="message"
                                rows={3}
                                value={formData.message}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleClose}>
                            Close
                        </Button>
                        <Button variant="primary" type="submit">
                            Confirm
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </React.Fragment>
    );
}

export default GivePoint;
