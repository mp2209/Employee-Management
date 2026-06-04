import React, { useState, useEffect } from "react";
import { requestApi } from '../../services/apiClient';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';

import './DetailUpdate.scss';

export function DetailUpdate({ show, id, handleClose, handleConfirm }) {
    const [updateInfo, setUpdateInfo] = useState({});

    useEffect(() => {
        const fetchData = async () => {
            if (id) {
                try {
                    const response = await requestApi.get(`/${id}`);
                    if (response.status === 200) {
                        setUpdateInfo(response.data);
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

    return (
        <Modal show={show} onHide={handleClose}>
            <Modal.Header closeButton>
                <Modal.Title>Thêm thời gian làm việc</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Form>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                        <Form.Label>Mã nhân viên:</Form.Label>
                        <Form.Control
                            type="text"
                            value={updateInfo.employeeId || ''}
                            autoFocus
                            disabled
                            style={{ backgroundColor: '#fff', color: '#000' }}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput1">
                        <Form.Label>Họ tên:</Form.Label>
                        <Form.Control
                            type="text"
                            value={updateInfo.employeeName || ''}
                            autoFocus
                            disabled
                            style={{ backgroundColor: '#fff', color: '#000' }}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput2">
                        <Form.Label>Cập nhật ngày:</Form.Label>
                        <Form.Control
                            type="text"
                            value={updateInfo.day || ''}
                            disabled
                            style={{ backgroundColor: '#fff', color: '#000' }}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput2">
                        <Form.Label>Bắt đầu:</Form.Label>
                        <Form.Control
                            type="text"
                            value={updateInfo.timeStart || ''}
                            disabled
                            style={{ backgroundColor: '#fff', color: '#000' }}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput2">
                        <Form.Label>Kết thúc:</Form.Label>
                        <Form.Control
                            type="text"
                            value={updateInfo.timeEnd || ''}
                            disabled
                            style={{ backgroundColor: '#fff', color: '#000' }}
                        />
                    </Form.Group>
                    <Form.Group className="mb-3 d-none" controlId="exampleForm.ControlInput2">
                        <Form.Label>Lý do từ chối:</Form.Label>
                        <Form.Control
                            as="textarea"
                            value={updateInfo.reasonReject || ''}
                            disabled
                            style={{ backgroundColor: '#fff', color: '#000' }}
                        />
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Thoát
                </Button>
                <Button variant="primary" onClick={handleConfirm}>
                    Xác nhận
                </Button>
            </Modal.Footer>
        </Modal>
    );
}

export default DetailUpdate;