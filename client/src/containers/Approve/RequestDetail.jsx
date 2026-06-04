import React, { useState, useEffect, useRef } from "react";
import { employeeApi, requestApi } from '../../services/apiClient';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import './Request_Detail.scss';

export function RequestDetail({show, id, handleClose, handleConfirm}) {

    const [rejectionReason, setRejectionReason] = useState('');
    const [accept, setAccept] = useState('Chưa duyệt');
    const [error, setError] = useState('');
    const [requestData, setRequestData] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                try {
                    // API lấy thông tin chi tiết request
                    const response = await requestApi.get(`/${id}`);
                    if (response.status === 200) {
                        setRequestData(response.data);
                        setRejectionReason(response.data.reasonReject);
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

    const requestInfo = {
        "id": requestData.id,
        "status": accept,
        "reasonReject": rejectionReason
    }

    const handleSubmit = async (event) => {
        setAccept("Chấp thuận");
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

            // API cập nhật trường Status của request thành "Chấp thuận"
            const response = await requestApi.put(`/${id}/approve`, null, {
                params: {
                    status: "Chấp thuận"
                }
            });
            if (response.status === 200) {
                alert('Cập nhật thành công');
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
            setError('Lý do từ chối không được để trống.');
        } else {
            setError('');
            setAccept("Từ chối");
            try {
                const response = await requestApi.put(`/${id}/reject`, null, {
                    params: {
                        status: "Từ chối",
                        reasonReject: rejectionReason
                    }
                });
                if (response.status === 200) {
                    alert('Cập nhật thành công');
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
                <Modal.Title>Chi tiết yêu cầu</Modal.Title>
            </Modal.Header>
            <Modal.Body className="d-flex flex-column">
                <div className="first-info">
                    <Form className="d-flex justify-content-between flex-wrap">
                        <Form.Group className="mb-3 custom-width">
                            <Form.Label>Mã nhân viên:</Form.Label>
                            <Form.Control
                                type="text"
                                value={requestData.employeeId}
                                autoFocus
                                disabled
                                // style={{ backgroundColor: '#fff', color: '#000' }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 custom-width">
                            <Form.Label>Họ tên:</Form.Label>
                            <Form.Control
                                type="text"
                                value={requestData.employeeName}
                                autoFocus
                                disabled
                                // style={{ backgroundColor: '#fff', color: '#000' }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 custom-width">
                            <Form.Label>Loại yêu cầu:</Form.Label>
                            <Form.Control
                                type="text"
                                value={requestData.requestType}
                                disabled
                                // style={{ backgroundColor: '#fff', color: '#000' }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 custom-width">
                            <Form.Label>Trạng thái:</Form.Label>
                            <Form.Control
                                type="text"
                                value={requestData.status}
                                disabled
                                className={
                                    requestData.status === 'Chưa duyệt'
                                      ? 'badge-soft-warning'
                                      : requestData.status === 'Chấp thuận'
                                      ? 'badge-soft-success'
                                      : requestData.status === 'Từ chối'
                                      ? 'badge-soft-danger'
                                      : ''
                                }
                            />
                        </Form.Group>
                    </Form>
                </div>
                <div>
                    <Form className="d-flex justify-content-between flex-wrap">
                        {requestData.requestType !== 'Update' ? (
                        <>
                            <Form.Group className="mb-3 custom-width">
                                <Form.Label>Bắt đầu:</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={requestData.timeStart}
                                    autoFocus
                                    disabled
                                    style={{ backgroundColor: '#fff', color: '#000' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3 custom-width">
                                <Form.Label>Kết thúc:</Form.Label>
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
                                <Form.Label>Ngày:</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={requestData.day}
                                    autoFocus
                                    disabled
                                    style={{ backgroundColor: '#fff', color: '#000' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3 w-25">
                                <Form.Label>Bắt đầu:</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={requestData.timeStart}
                                    autoFocus
                                    disabled
                                    style={{ backgroundColor: '#fff', color: '#000' }}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3 w-25">
                                <Form.Label>Kết thúc:</Form.Label>
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
                            <Form.Label>Lý do yêu cầu:</Form.Label>
                            <Form.Control
                                as="textarea"
                                value={requestData.reasonRequest}
                                disabled
                                style={{ backgroundColor: '#fff', color: '#000' }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 w-75">
                            <Form.Label>Thiết bị yêu cầu:</Form.Label>
                            <Form.Control
                                as="textarea"
                                value={requestData.device}
                                disabled
                                style={{ backgroundColor: '#fff', color: '#000' }}
                            />
                        </Form.Group>
                        <Form.Group className="mb-3 w-75">
                            <Form.Label>Lý do từ chối:</Form.Label>
                            <Form.Control
                                as="textarea"
                                placeholder="Lý do từ chối"
                                value={rejectionReason}
                                onChange={(e) => setRejectionReason(e.target.value)}
                                disabled={requestData.status !== 'Chưa duyệt'}
                                style={{
                                    backgroundColor: requestData.status !== 'Chưa duyệt' ? '' : '#fff',
                                    color: requestData.status !== 'Chưa duyệt' ? '#000' : '#888',
                                    cursor: requestData.status !== 'Chưa duyệt' ? 'not-allowed' : 'text'
                                }}
                            />
                        </Form.Group>
                        {error && <div className="text-danger">{error}</div>}
                    </Form>
                </div>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Thoát
                </Button>
                <Button variant="danger" className={`${requestData.status !== 'Chưa duyệt' ? 'd-none' : ''}`} onClick={handleReject}>
                    Từ chối
                </Button>
                <Button variant="primary" className={`${requestData.status !== 'Chưa duyệt' ? 'd-none' : ''}`} onClick={handleSubmit} disabled={rejectionReason !== ''}>
                    Chấp thuận
                </Button>
            </Modal.Footer>
        </Modal>
     );
}

export default RequestDetail;