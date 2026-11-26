import React, { useState, useEffect } from "react";
import { employeeApi, requestApi } from '../../services/apiClient';
import { REQUEST_STATUS, statusBadgeClass } from '../../services/requestStatus';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import './RequestDetail.scss';

export function RequestDetail({show, id, handleClose, handleConfirm}) {

    const [rejectionReason, setRejectionReason] = useState('');
    const [error, setError] = useState('');
    const [requestData, setRequestData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                try {
                    // Load the request details
                    const response = await requestApi.get(`/${id}`);
                    if (response.status === 200) {
                        setRequestData(response.data);
                        setRejectionReason(response.data.reasonReject ?? '');
                    } else {
                        console.error("Error fetching user data");
                    }
                } catch (error) {
                    console.error("Error during API request:", error);
                }
            }
        };
        fetchData();
    }, [id]);

    const handleSubmit = async (event) => {
        try {
            if (requestData.requestType === "Update") {
                // Call the /update-checkin-checkout API
                const updateResponse = await employeeApi.put('/update-checkin-checkout', null, {
                    params: {
                        userId: requestData.employeeId,
                        checkIn: requestData.timeStart,
                        checkOut: requestData.timeEnd,
                        day: requestData.day
                    }
                });
                if (updateResponse.status !== 200) {
                    const message = updateResponse.data.message || 'An error occurred while updating worktime';
                    alert(message);
                    return;
                }
            }

            const response = await requestApi.put(`/${id}/approve`);
            if (response.status === 200) {
                alert('Updated successfully');
            } else {
                const message = response.data.message || 'An error occurred while updating';
                alert(message);
            }
        } catch (error) {
            const message = error.response?.data?.message || 'An error occurred while updating';
            alert(message);
        }
        handleConfirm();
    };

    const handleReject = async (event) => {
        if (rejectionReason.trim() === '') {
            setError('Please enter a rejection reason.');
        } else {
            setError('');
            try {
                const response = await requestApi.put(`/${id}/reject`, null, {
                    params: {
                        reasonReject: rejectionReason
                    }
                });
                if (response.status === 200) {
                    alert('Updated successfully');
                } else {
                    const message = response.data.message || 'An error occurred while updating';
                    alert(message);
                }
            } catch (error) {
                const message = error.response?.data?.message || 'An error occurred while updating';
                alert(message);
            }
            handleClose();
        }
    };


    return (
        <Modal show={show} onHide={handleClose} size='lg'>
            <Modal.Header closeButton>
                <Modal.Title>Request details</Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex flex-column">
                <div className="first-info">
                    <Form className="d-flex justify-content-between flex-wrap">
                        <Form.Group className="mb-3 custom-width">
                            <Form.Label>Employee ID:</Form.Label>
                            <Form.Control
                                type="text"
                                value={requestData.employeeId}
                                autoFocus
                                disabled
                                // style={{ backgroundColor: '#fff', color: '#000' }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 custom-width">
                            <Form.Label>Full name:</Form.Label>
                            <Form.Control
                                type="text"
                                value={requestData.employeeName}
                                autoFocus
                                disabled
                                // style={{ backgroundColor: '#fff', color: '#000' }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 custom-width">
                            <Form.Label>Request type:</Form.Label>
                            <Form.Control
                                type="text"
                                value={requestData.requestType}
                                disabled
                                // style={{ backgroundColor: '#fff', color: '#000' }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 custom-width">
                            <Form.Label>Status:</Form.Label>
                            <Form.Control
                                type="text"
                                value={requestData.status}
                                disabled
                                className={statusBadgeClass(requestData.status)}
                            />
                        </Form.Group>
                    </Form>
                </div>
                <div>
                    <Form className="d-flex justify-content-between flex-wrap">
                        {requestData.requestType !== 'Update' ? (
                        <>
                            <Form.Group className="mb-3 custom-width">
                                <Form.Label>Start:</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={requestData.timeStart}
                                    autoFocus
                                    disabled
                                    style={{ backgroundColor: '#fff', color: '#000' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3 custom-width">
                                <Form.Label>End:</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={requestData.timeEnd}
                                    autoFocus
                                    disabled
                                    style={{ backgroundColor: '#fff', color: '#000' }}
                                />
                            </Form.Group>
                        </>
                        ) : (
                        <>
                            <Form.Group className="mb-3 w-25">
                                <Form.Label>Date:</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={requestData.day}
                                    autoFocus
                                    disabled
                                    style={{ backgroundColor: '#fff', color: '#000' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3 w-25">
                                <Form.Label>Start:</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={requestData.timeStart}
                                    autoFocus
                                    disabled
                                    style={{ backgroundColor: '#fff', color: '#000' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3 w-25">
                                <Form.Label>End:</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={requestData.timeEnd}
                                    autoFocus
                                    disabled
                                    style={{ backgroundColor: '#fff', color: '#000' }}
                                />
                            </Form.Group>
                        </>
                        )}
                        <Form.Group className="mb-3 w-75">
                            <Form.Label>Reason:</Form.Label>
                            <Form.Control
                                as="textarea"
                                value={requestData.reasonRequest}
                                disabled
                                style={{ backgroundColor: '#fff', color: '#000' }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 w-75">
                            <Form.Label>Requested equipment:</Form.Label>
                            <Form.Control
                                as="textarea"
                                value={requestData.device}
                                disabled
                                style={{ backgroundColor: '#fff', color: '#000' }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 w-75">
                            <Form.Label>Rejection reason:</Form.Label>
                            <Form.Control
                                as="textarea"
                                placeholder="Rejection reason"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                disabled={requestData.status !== REQUEST_STATUS.PENDING}
                                style={{
                                    backgroundColor: requestData.status !== REQUEST_STATUS.PENDING ? '' : '#fff',
                                    color: requestData.status !== REQUEST_STATUS.PENDING ? '#000' : '#888',
                                    cursor: requestData.status !== REQUEST_STATUS.PENDING ? 'not-allowed' : 'text'
                                }}
                            />
                        </Form.Group>
                        {error && <div className="text-danger">{error}</div>}
                    </Form>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Close
                </Button>
                <Button variant="danger" className={`${requestData.status !== REQUEST_STATUS.PENDING ? 'd-none' : ''}`} onClick={handleReject}>
                    Reject
                </Button>
                <Button variant="primary" className={`${requestData.status !== REQUEST_STATUS.PENDING ? 'd-none' : ''}`} onClick={handleSubmit} disabled={rejectionReason !== ''}>
                    Approve
                </Button>
            </Modal.Footer>
        </Modal>
     );
}

export default RequestDetail;