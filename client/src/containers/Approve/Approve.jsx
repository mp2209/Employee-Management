import React, { useEffect, useState } from 'react';
import { requestApi } from '../../services/apiClient';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowRight, faArrowLeft } from '@fortawesome/free-solid-svg-icons';

import Header from '../Header/Header';
import RightSidebar from '../RightSidebar/RightSidebar';
import Footer from '../Footer/Footer';
import RequestDetail from './RequestDetail';
import "./Approve.scss";
import "../UpdateTimeSheet/UpdateTimeSheet.scss";

const Approve = () => {
    const [listType, setListType] = useState('requested');
    const [isOpenDetail, setIsOpenDetail] = useState(false);
    const [notApprovedList, setNotApprovedList] = useState([]);
    const [approvedList, setApprovedList] = useState([]);
    const [requestID, setRequestID] = useState('');

    const handleShowDetail = (id) => {
        setRequestID(id);
        setIsOpenDetail(true);
    };

    const handleCloseDetail = () => {
        setIsOpenDetail(false);
    };

    const handleConfirmDetail = () => {
        handleCloseDetail();
    };

    useEffect(() => {
        const fetchNotApprovedData = async () => {
            try {
                const response = await requestApi.get('/not-approved');
                if (response.status === 200) {
                    setNotApprovedList(response.data);
                } else {
                    console.error("Error fetching user data");
                }
            } catch (error) {
                console.error("Error during API request:", error);
            }
        };
        fetchNotApprovedData();
    }, []);

    useEffect(() => {
        const fetchApprovedData = async () => {
            try {
                const response = await requestApi.get('/approved');
                if (response.status === 200) {
                    setApprovedList(response.data);
                } else {
                    console.error("Error fetching user data");
                }
            } catch (error) {
                console.error("Error during API request:", error);
            }
        };
        fetchApprovedData();
    }, []);

    return (
        <React.Fragment>
            <Header />
            <section>
                <div className='content-frame'>
                    <div className="d-flex align-items-center m-3 update-timesheet-header">
                        <div className="col-md-6">
                            <div className="d-flex flex-wrap align-items-center justify-content-start gap-2 mb-3 button-switch">
                                <FontAwesomeIcon icon={faArrowLeft} className={`${listType === 'approved' ? '' : 'd-none'}`} />
                                <span
                                    className={`card-title ${listType === 'requested' ? 'selected' : ''}`}
                                    id="requested"
                                    onClick={() => setListType('requested')}
                                    checked={listType === 'requested'}>
                                    Requested List
                                </span>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="d-flex flex-wrap align-items-center justify-content-end gap-2 mb-3 button-switch">
                                <span
                                    className={`${listType === 'approved' ? 'selected' : ''}`}
                                    id="approved"
                                    onClick={() => setListType('approved')}
                                    checked={listType === 'approved'}>
                                    Approved List
                                </span>
                                <FontAwesomeIcon icon={faArrowRight} className={`${listType === 'requested' ? '' : 'd-none'}`} />
                            </div>
                        </div>
                    </div>
                    <div className={`${listType === 'requested' ? 'list-frame' : 'd-none'}`}>
                        <div className="col-lg-12">
                            <div className="update-timesheet-history">
                                <table className="table uts-table table-nowrap align-middle table-borderless">
                                    <thead className='sticky-header'>
                                    <tr>
                                        <th scope="col">STT</th>
                                        <th scope="col">Nhân viên</th>
                                        <th scope="col">Loại yêu cầu</th>
                                        <th scope="col">Trạng thái</th>
                                        <th scope="col">Chi tiết</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {notApprovedList.length > 0 ? (
                                        notApprovedList.map((request, index) => (
                                            <tr key={request.id}>
                                                <td>{index + 1}</td>
                                                <td>{request.employeeName}</td>
                                                <td>{request.requestType}</td>
                                                <td>
                                                        <span className="badge badge-soft-warning mb-0">
                                                            {request.status}
                                                        </span>
                                                </td>
                                                <td>
                                                        <span className='text-decoration-underline detail'
                                                              onClick={() => handleShowDetail(request.id)}>
                                                            Xem thêm
                                                        </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5">Không có dữ liệu</td>
                                        </tr>
                                    )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    <div className={`${listType === 'approved' ? 'list-frame' : 'd-none'}`}>
                        <div className="col-lg-12">
                            <div className="update-timesheet-history">
                                <table className="table uts-table table-nowrap align-middle table-borderless">
                                    <thead className='sticky-header'>
                                    <tr>
                                        <th scope="col">STT</th>
                                        <th scope="col">Nhân viên</th>
                                        <th scope="col">Loại yêu cầu</th>
                                        <th scope="col">Trạng thái</th>
                                        <th scope="col">Chi tiết</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {approvedList.length > 0 ? (
                                        approvedList.map((request, index) => (
                                            <tr key={request.id}>
                                                <td>{index + 1}</td>
                                                <td>{request.employeeName}</td>
                                                <td>{request.requestType}</td>
                                                <td>
                                                        <span className={`badge ${request.status === 'Chấp thuận' ? 'badge-soft-success' : 'badge-soft-danger'} mb-0`}>
                                                            {request.status}
                                                        </span>
                                                </td>
                                                <td>
                                                        <span className='text-decoration-underline detail'
                                                              onClick={() => handleShowDetail(request.id)}>
                                                            Xem thêm
                                                        </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan="5">Không có dữ liệu</td>
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
            <RequestDetail show={isOpenDetail}
                           id={requestID}
                           handleClose={handleCloseDetail}
                           handleConfirm={handleConfirmDetail}
            />
        </React.Fragment>
    );
}

export default Approve;