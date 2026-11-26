import React, { useEffect, useState } from 'react';
import { useAuth } from '../../services/auth';
import { employeeApi, requestApi } from '../../services/apiClient';
import { statusBadgeClass } from '../../services/requestStatus';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Form, Button } from "react-bootstrap";
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import DetailLeave from './DetailLeave';

import Header from '../Header/Header';
import RightSidebar from '../RightSidebar/RightSidebar';
import Footer from '../Footer/Footer';
import './Leave.scss';

const Leave = () => {
  const [leaveMethod, setLeaveMethod] = useState('oneday');
  const [userData, setUserData] = useState('');
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [selectedLeaveRequest, setSelectedLeaveRequest] = useState(null);
  const { userId } = useAuth();
  const today = new Date();

  const [isOpenDetail, setIsOpenDetail] = useState(false);
  const [errorTimeStart, setErrorTimeStart] = useState('');
  const [errorTimeEnd, setErrorTimeEnd] = useState('');
  const [leaveData, setLeaveData] = useState({
    timeStart: today.setHours(0, 0, 0, 0),
    timeEnd: today.setHours(23, 59, 59, 999),
    reason: ''
  });

  const handleShowDetail = (request) => {
    setSelectedLeaveRequest(request);
    setIsOpenDetail(true);
  }

  const handleCloseDetail = () => {
    setIsOpenDetail(false);
  }

  const handleConfirmDetail = () => {
    handleCloseDetail()
  }

  const formatDateTime = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  // Load the employee profile and their leave requests
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

    const fetchLeaveList = async () => {
      try {
        const response = await requestApi.get(`/leave`);
        if (response.status === 200) {
          const filteredLeaveRequests = response.data.filter(request => request.employeeId === userId);
          setLeaveRequests(filteredLeaveRequests);
        } else {
          console.error("Error fetching leave requests");
        }
      } catch (error) {
        console.error("Error during API request:", error);
      }
    };

    fetchData();
    fetchLeaveList();
  }, [userId]);

  const handleDateChange = (date, name) => {
    if (leaveMethod === 'oneday') {
      // A single-day leave runs from 00:00 to 23:59
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      setLeaveData({
        ...leaveData,
        timeStart: startDate,
        timeEnd: endDate
      });
    } else {
      const updatedDate = new Date(date);
      if (name === 'timeStart') {
        updatedDate.setHours(0, 0, 0, 0);
      } else if (name === 'timeEnd') {
        updatedDate.setHours(23, 59, 59, 999);
      }

      setLeaveData({
        ...leaveData,
        [name]: updatedDate
      });
    }
  };

  const handleChange = (event) => {
    const { name, value } = event.target;
    setLeaveData({
      ...leaveData,
      [name]: value
    });
  };

  const leaveInfo = {
    "employeeId": userData.id,
    "employeeName": userData.name,
    "requestType": "Leave",
    "timeStart": formatDateTime(new Date(leaveData.timeStart)),
    "timeEnd": formatDateTime(new Date(leaveData.timeEnd)),
    "reasonRequest": leaveData.reason,
    "device": null
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    const timeStart = new Date(leaveData.timeStart);
    const timeEnd = new Date(leaveData.timeEnd);
    setErrorTimeStart('');
    setErrorTimeEnd('');
    if (timeStart < today.setHours(0, 0, 0, 0)) {
      setErrorTimeStart('The start date cannot be in the past.');
      return;
    }

    if (timeEnd < timeStart) {
      setErrorTimeEnd('The end date must be after the start date.');
      return;
    }

    // API
    try {
      const response = await requestApi.post('', leaveInfo);
      if (response.status === 200) {
        alert('Request submitted');
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
            <div className='leave-check'>
              <div className="form-check">
                <input className="form-check-input" type="radio" id="oneday"
                       onClick={() => setLeaveMethod('oneday')}
                       checked={leaveMethod === 'oneday'}/>
                <label className="form-check-label" htmlFor="oneday" onClick={() => setLeaveMethod('oneday')}>
                  Single day
                </label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" id="severaldays"
                       onClick={() => setLeaveMethod('severaldays')}
                       checked={leaveMethod === 'severaldays'}/>
                <label className="form-check-label" htmlFor="severaldays">
                  Multiple days
                </label>
              </div>
              <div className="form-check">
                <input className="form-check-input" type="radio" id="leaveList"
                       onClick={() => setLeaveMethod('leaveList')}
                       checked={leaveMethod === 'leaveList'}/>
                <label className="form-check-label" htmlFor="leaveList">
                  Leave history
                </label>
              </div>
            </div>
            <div className={`list-frame-leave ${leaveMethod === 'leaveList' ? '' : 'd-none'}`}>
              <div className="col-lg-12">
                <div className="leave-history">
                  <table className="table leave-table table-nowrap align-middle table-borderless">
                    <thead className='sticky-header'>
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">From</th>
                      <th scope="col">To</th>
                      <th scope="col">Status</th>
                      <th scope="col">Details</th>
                    </tr>
                    </thead>
                    <tbody>
                    {leaveRequests.map((request, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{request.timeStart}</td>
                          <td>{request.timeEnd}</td>
                          <td>
                            <span className={`badge ${statusBadgeClass(request.status)} mb-0`}>
                              {request.status}
                            </span>
                          </td>
                          <td>
                            <span className='text-decoration-underline detail'
                                  onClick={() => handleShowDetail(request)}>
                              View
                            </span>
                          </td>
                        </tr>
                    ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            <form action="#" onSubmit={(e) => handleSubmit(e)}>
              <div className={`datepick-frame ${leaveMethod !== 'leaveList' ? '' : 'd-none'}`}>
                <div className='datepick'>
                  <label className='col-sm-3 col-form-label'>Full name:</label>
                  <Container>
                    <Row>
                      <Form.Group>
                        <Form.Control type='text'
                                      value={userData.name}
                                      disabled
                        ></Form.Control>
                      </Form.Group>
                    </Row>
                  </Container>
                </div>
                <div className='datepick'>
                  <label className='col-sm-3 col-form-label'>Department:</label>
                  <Container>
                    <Row>
                      <Form.Group>
                        <Form.Control type='text'
                                      value={userData.department}
                                      disabled
                        ></Form.Control>
                      </Form.Group>
                    </Row>
                  </Container>
                </div>
                <div className='datepick'>
                  <label className='col-sm-3 col-form-label'>Phone number:</label>
                  <Container>
                    <Row>
                      <Form.Group>
                        <Form.Control type='text'
                                      value={userData.phoneNumber}
                                      disabled
                        ></Form.Control>
                      </Form.Group>
                    </Row>
                  </Container>
                </div>
                <div className= {`datepick ${leaveMethod === 'oneday' ? '' : 'd-none'}`}>
                  <label className='col-sm-3 col-form-label'>Date:</label>
                  <DatePicker
                      name = 'timeStart'
                      selected={leaveData.timeStart}
                      onChange={(date) => handleDateChange(date, 'timeStart')}
                      dateFormat="dd/MM/yyyy"
                      className="form-control form-control-lg custom-datepick"
                      required
                  />
                  {errorTimeStart && <div className="text-danger mx-3">{errorTimeStart}</div>}
                </div>
                <div className={`${leaveMethod === 'severaldays' ? '' : 'd-none'}`}>
                  <div className='datepick'>
                    <label className='col-sm-3 col-form-label'>From:</label>
                    <DatePicker
                        name = 'timeStart'
                        selected={leaveData.timeStart}
                        onChange={(date) => handleDateChange(date, 'timeStart')}
                        dateFormat="dd/MM/yyyy"
                        className="form-control form-control-lg custom-datepick"
                        required
                    />
                    {errorTimeStart && <div className="text-danger mx-3">{errorTimeStart}</div>}
                  </div>
                  <div className='datepick'>
                    <label className='col-sm-3 col-form-label'>To:</label>
                    <DatePicker
                        name = 'timeEnd'
                        selected={leaveData.timeEnd}
                        onChange={(date) => handleDateChange(date, 'timeEnd')}
                        dateFormat="dd/MM/yyyy"
                        placeholder = '30/03/2024'
                        className="form-control form-control-lg custom-datepick"
                        required
                    />
                    {errorTimeEnd && <div className="text-danger mx-3">{errorTimeEnd}</div>}
                  </div>
                </div>
                <div className='reason-frame'>
                  <label>Reason:</label>
                  <div className="form-group reason-input">
                    <textarea className="form-control"
                              id="reason"
                              rows="3"
                              name = 'reason'
                              onChange={handleChange}
                              required>
                          </textarea>
                  </div>
                </div>
                <Button type='submit'>Submit</Button>
              </div>
            </form>
          </div>
          <RightSidebar/>
        </section>
        <Footer />
        <DetailLeave show = {isOpenDetail}
                     handleClose = {handleCloseDetail}
                     handleConfirm = {handleConfirmDetail}
                     leaveRequest={selectedLeaveRequest}
        />
      </React.Fragment>
  );
}

export default Leave;