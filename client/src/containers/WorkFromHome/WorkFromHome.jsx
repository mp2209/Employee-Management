import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../services/auth';
import { employeeApi, requestApi } from '../../services/apiClient';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

import Header from '../Header/Header';
import RightSidebar from '../RightSidebar/RightSidebar';
import Footer from '../Footer/Footer';
import './WorkFromHome.scss';

const WorkFromHome = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [errorTimeStart, setErrorTimeStart] = useState('');
  const [equipment, setEquipment] = useState(false);

  const [userData, setUserData] = useState('');
  const { userId } = useAuth();

  const [wfhData, setWFHData] = useState({
    time_start: today,
    time_end: today,
    reason: '',
    equipmentList: null
  });

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
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

  const handleDateChange = (date, name) => {
    const startDate = new Date(date);
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(date);
    endDate.setHours(23, 59, 59, 999);

    setWFHData({
      ...wfhData,
      time_start: startDate,
      time_end: endDate
    });
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setWFHData({
        ...wfhData,
        [name]: value
    });
  };

  const wfhInfo = {
    "employeeId": userData.id, 
    "managerId": "2", 
    "employeeName": userData.name,
    "requestType": "WFH", 
    "timeStart": formatDateTime(new Date(wfhData.time_start)),
    "timeEnd": formatDateTime(new Date(wfhData.time_end)),
    "reasonRequest": wfhData.reason,
    "device": wfhData.equipmentList,
    "status": "Chưa duyệt",
    "reasonReject": ""
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const timeStart = new Date(wfhData.time_start);
    setErrorTimeStart('');
    if (timeStart < today) {
      setErrorTimeStart('Ngày không được nhỏ hơn ngày hiện tại.');
      return;
    }
    // API gửi request
    try {
      const response = await requestApi.post(`/`, wfhInfo);
      if (response.status === 200) {
          alert('Gửi yêu cầu thành công');
      } else {
          const message = response.data.message || 'An error occurred while login';
          alert(message);
      }
    } catch (error) {
        const message = error.response?.data?.message || 'An error occurred while update';
        alert(message)
    }
  };

  return (
    <React.Fragment>
      <Header />
      <section>
        <div className='content-frame'>
          <div className="d-flex align-items-center justify-content-center m-3 wfh-header">
            <div className="mb-3">
                <h5 className="card-title">Work From Home Form</h5>
            </div>
          </div>
          <form action="#" onSubmit={(e) => handleSubmit(e)}>
            <div className='wfh-info'>
              <div className='wfh-info-content'>
                <Form>
                  <Form.Group className="mb-3">
                    <Form.Label className='fw-bold'>Họ tên:</Form.Label>
                    <Form.Control
                        type="text"
                        value={userData.name}
                        disabled
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className='fw-bold'>Bộ phận:</Form.Label>
                    <Form.Control
                        type="text"
                        value={userData.department}
                        disabled
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className='fw-bold'>Số điện thoại:</Form.Label>
                    <Form.Control
                        type="text"
                        value={userData.phoneNumber}
                        disabled
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="row fw-bold">Ngày:</Form.Label>
                    <DatePicker
                        name = 'time_start'
                        selected={wfhData.time_start}
                        onChange={(date) => handleDateChange(date, 'time_start')}
                        dateFormat="dd/MM/yyyy"
                        className="form-control"
                        required
                    />
                    {errorTimeStart && <div className="text-danger mx-3">{errorTimeStart}</div>}
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="row fw-bold">Lý do:</Form.Label>
                    <Form.Control
                      name = 'reason'
                      as="textarea"
                      rows="3"
                      placeholder="Lý do"
                      onChange={handleChange}
                      required
                      style={{ backgroundColor: '#fff', color: '#000' }}
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="row fw-bold">Thiết bị:</Form.Label>
                    <div className='mb-2'>
                      <input className="form-check-input me-2" type="radio" id="false"
                            onClick={() => setEquipment(false)}
                            checked={equipment === false}/>
                      <label className="form-check-label" htmlFor = "false" onClick={() => setEquipment(false)}>
                        Tôi đã có thiết bị đáp ứng nhu cầu công việc
                      </label>
                    </div>
                    <div className='mt-2'>
                      <input className="form-check-input me-2" type="radio" id="true"
                            onClick={() => setEquipment(true)}
                            checked={equipment === true}/>
                      <label className="form-check-label" htmlFor = "true">
                        Tôi cần công ty hỗ trợ thiết bị
                      </label>
                    </div>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label className="row fw-bold">Loại thiết bị bạn cần cho công việc làm tại nhà:</Form.Label>
                    <Form.Control
                      name = 'equipmentList'
                      as="textarea"
                      rows="3"
                      placeholder="Danh sách thiết bị (các thiết bị ngăn cách bởi dấu ,)"
                      onChange={handleChange}
                      disabled={!equipment}
                      required
                      // style={{ backgroundColor: '#fff', color: '#000' }}
                      style={{
                        backgroundColor: equipment ? '#fff' : '',
                        color: equipment ? '#000' : '#888',
                        cursor: equipment ? 'text' : 'not-allowed'
                      }}
                    />
                  </Form.Group>
                </Form>
                <Button type='submit'>Gửi</Button>
              </div>
          </div>
        </form>
        </div>
        <RightSidebar />
      </section>
      <Footer />
    </React.Fragment>
  );
}

export default WorkFromHome;