import React, { useEffect, useState } from "react";
import { useAuth } from '../../services/auth';
import { employeeApi, requestApi } from '../../services/apiClient';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import TimePicker from 'react-bootstrap-time-picker';

import './AddNewTimeSheet.scss';

export function AddNewTimeSheet({show, handleClose, handleConfirm}) {
    const [userData, setUserData] = useState('');
    const { userId } = useAuth();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [sendSuccessful, setSendSuccessful] = useState(false);
    const [errorTimeEnd, setErrorTimeEnd] = useState('');
    const [timeSheetData, setTimeSheetData] = useState({
        date: today,
        time_start: "08:00",
        time_end: "08:00"
    });

    const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const formatTime = (timeString) => {
        if (typeof timeString === 'string') {
            const [hours, minutes] = timeString.split(':');
            const seconds = '00';
            return `${hours}:${minutes}:${seconds}`;
        }
        if (typeof timeString === 'number') {
            const hours = Math.floor(timeString / 3600);
            const minutes = Math.floor((timeString % 3600) / 60);
            return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
        }
        return '00:00:00';
    };

    // API lấy thông tin user :V
    useEffect(() => {
        const fetchData = async () => {
            try {
                const response = await employeeApi.get(`/${userId}`);
                if (response.status === 200) {
                    setUserData(response.data);
                } else {
                    console.error("Error fetching user data");
                }
            } catch (error) {
                console.error("Error during API request:", error);
            }
        };
        fetchData();
    }, []);

    const timeSheetInfo = {
        "employeeId": userData.id, 
        "managerId": "2", 
        "employeeName": userData.name,
        "requestType": "Update", 
        "day": formatDate(timeSheetData.date),
        "timeStart": formatTime(timeSheetData.time_start),
        "timeEnd": formatTime(timeSheetData.time_end),
        "reasonRequest": null,
        "device": null,
        "status": "Chưa duyệt",
        "reasonReject": ""
    };

    const handleDateChange = (date, name) => {
        setTimeSheetData({
          ...timeSheetData,
          [name]: date
        });
    };

    const handleChange = (value, name) => {
        const hours = Math.floor(value / 3600);
        const minutes = Math.floor((value % 3600) / 60);
        const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        setTimeSheetData({
            ...timeSheetData,
            [name]: formattedTime
        });
    };

    const handleSubmit = async (event) => {
        const start = formatTime(timeSheetData.time_start);
        const end = formatTime(timeSheetData.time_end);
        if (end < start) {
            setErrorTimeEnd('Giờ kết thúc phải lớn hơn giờ bắt đầu.');
            return;
        }

        // API gửi yêu cầu update
        try {
            const response = await requestApi.post(`/`, timeSheetInfo);
            if (response.status === 200) {
                alert('Gửi yêu cầu thành công');
                setSendSuccessful(true);
            } else {
                const message = response.data.message || 'An error occurred while login';
                alert(message);
            }
        } catch (error) {
            const message = error.response?.data?.message || 'An error occurred while update';
            alert(message)
        }
    }

    useEffect(() => {
        if (sendSuccessful) {
            handleConfirm();
        }
    }, [sendSuccessful, handleConfirm]);

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
                            value={userData.id}
                            disabled
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput2">
                        <Form.Label>Họ tên:</Form.Label>
                        <Form.Control
                            type="text"
                            value={userData.name}
                            disabled
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput3">
                        <Form.Label className="row">Ngày:</Form.Label>
                        <DatePicker
                            name = 'date'
                            selected={timeSheetData.date}
                            onChange={(date) => handleDateChange(date, 'date')}
                            dateFormat="dd/MM/yyyy"
                            className="form-control"
                            required
                        />
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput4">
                        <Form.Label>Bắt đầu:</Form.Label>
                        <TimePicker name = 'time_start' format = '24' start="08:00" end="21:00" step={30}
                                    value = {timeSheetData.time_start} 
                                    onChange={(value) => handleChange(value, 'time_start')} 
                                    required/>
                    </Form.Group>
                    <Form.Group className="mb-3" controlId="exampleForm.ControlInput5">
                        <Form.Label>Kết thúc:</Form.Label>
                        <TimePicker name = 'time_end' start="08:00" end="21:00" step={30}
                                    value = {timeSheetData.time_end} 
                                    onChange={(value) => handleChange(value, 'time_end')}  
                                    required/>
                        {errorTimeEnd && <div className="text-danger mx-3">{errorTimeEnd}</div>}
                    </Form.Group>
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={handleClose}>
                    Thoát
                </Button>
                <Button variant="primary" onClick={handleSubmit}>
                    Lưu
                </Button>
            </Modal.Footer>
        </Modal>
     );
}

export default AddNewTimeSheet;