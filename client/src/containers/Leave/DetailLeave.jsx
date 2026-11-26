import React from "react";
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import './DetailLeave.scss';

const DetailLeave = ({ show, handleClose, handleConfirm, leaveRequest }) => {
    if (!leaveRequest) return null;

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Leave request</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3" controlId="employeeId">
                        <Form.Label>Employee ID:</Form.Label>
                        <Form.Control
                            type="text"
                            value={leaveRequest.employeeId}
                            disabled
                            style={{ backgroundColor: '#fff', color: '#000' }}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="employeeName">
                        <Form.Label>Full name:</Form.Label>
                        <Form.Control
                            type="text"
                            value={leaveRequest.employeeName}
                            disabled
                            style={{ backgroundColor: '#fff', color: '#000' }}
                        />
                    </Form.Group>
                    {/*<Form.Group className="mb-3" controlId="department">*/}
                    {/*    <Form.Label>Department:</Form.Label>*/}
                    {/*    <Form.Control*/}
                    {/*        type="text"*/}
                    {/*        value={leaveRequest.department}*/}
                    {/*        disabled*/}
                    {/*        style={{ backgroundColor: '#fff', color: '#000' }}*/}
                    {/*    />*/}
                    {/*</Form.Group>*/}
                    <Form.Group className="mb-3" controlId="timeStart">
                        <Form.Label>Start:</Form.Label>
                        <Form.Control
                            type="text"
                            value={leaveRequest.timeStart}
                            disabled
                            style={{ backgroundColor: '#fff', color: '#000' }}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="timeEnd">
                        <Form.Label>End:</Form.Label>
                        <Form.Control
                            type="text"
                            value={leaveRequest.timeEnd}
                            disabled
                            style={{ backgroundColor: '#fff', color: '#000' }}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="reasonRequest">
                        <Form.Label>Reason:</Form.Label>
                        <Form.Control
                            as="textarea"
                            value={leaveRequest.reasonRequest}
                            disabled
                            style={{ backgroundColor: '#fff', color: '#000' }}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="reasonReject">
                        <Form.Label>Rejection reason:</Form.Label>
                        <Form.Control
                            as="textarea"
                            value={leaveRequest.reasonReject}
                            disabled
                            style={{ backgroundColor: '#fff', color: '#000' }}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="primary" onClick={handleConfirm}>
                    OK
                </Button>
            </Modal.Footer>
        </Modal>
    );
};

export default DetailLeave;