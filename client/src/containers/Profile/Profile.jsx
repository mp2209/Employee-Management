import React, { useEffect, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import { useAuth } from '../../services/auth';
import { employeeApi, pointApi, voucherApi } from '../../services/apiClient';
import './Profile.scss';

const Profile = () => {
    const { role, userId } = useAuth();
    const [employee, setEmployee] = useState({});
    const [point, setPoint] = useState({});
    const [vouchers, setVouchers] = useState([]);
    const [show, setShow] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) return undefined;
        let cancelled = false;
        (async () => {
            try {
                const [empRes, pointRes, voucherRes] = await Promise.allSettled([
                    employeeApi.get(`/${userId}`),
                    pointApi.get(`/${userId}`),
                    voucherApi.get(`/api/v2.1/customers/${userId}/vouchers`),
                ]);
                if (cancelled) return;
                if (empRes.status === 'fulfilled') setEmployee(empRes.value.data);
                if (pointRes.status === 'fulfilled') setPoint(pointRes.value.data);
                if (voucherRes.status === 'fulfilled') setVouchers(voucherRes.value.data);
            } catch (err) {
                if (!cancelled) setError(err.message);
            }
        })();
        return () => { cancelled = true; };
    }, [userId]);

    const handleClose = () => setShow(false);
    const handleShow = () => setShow(true);

    return (
        <React.Fragment>
            <Header />
            <div className="profile-section">
                <div className="row profile">
                    <div className="col l-widget">
                        <div className="avatar" align="center">
                            {employee.avatar && (
                                <img src={`data:image/jpeg;base64,${employee.avatar}`} alt="Avatar" />
                            )}
                            <h3>{employee.name}</h3>
                        </div>

                        <div className="point row" align="center">
                            <h5> Điểm </h5>
                            <h4>{point.totalPoint ?? 0}</h4>

                            <div className="col-6">
                                <Button variant="primary" onClick={handleShow}>
                                    {role === 'Manager' ? 'Lịch sử cho điểm' : 'Lịch sử nhận điểm'}
                                </Button>
                            </div>
                            {role === 'Manager' && (
                                <div className="col">
                                    <a href="give-point" className="btn btn-success">Cho điểm</a>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="col-8">
                        <div className="row info">
                            <div align="right">
                                <a href="/edit-profile" className="btn btn-primary">Chỉnh sửa</a>
                            </div>

                            <table className="info-table table table-bordered">
                                <tbody>
                                    <tr><td className="title">Ngày sinh:</td><td>{employee.birthDate}</td></tr>
                                    <tr><td className="title">Số điện thoại:</td><td>{employee.phoneNumber}</td></tr>
                                    <tr><td className="title">Địa chỉ:</td><td>{employee.address}</td></tr>
                                    <tr><td className="title">CCCD:</td><td>{employee.identifyId}</td></tr>
                                    <tr><td className="title">Mã số thuế:</td><td>{employee.taxNumber}</td></tr>
                                    <tr><td className="title">STK ngân hàng:</td><td>{employee.bankNumber}</td></tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="voucher-history">
                    <h5>Danh sách voucher đã đổi</h5>
                    <hr />
                    {error && <div className="alert alert-warning">{error}</div>}
                    <table className="table table-hover voucher-table">
                        <thead>
                            <tr>
                                <th scope="col">Tên Voucher</th>
                                <th scope="col">Mã Voucher</th>
                                <th scope="col">Nội dung</th>
                                <th scope="col">Ngày hết hạn</th>
                            </tr>
                        </thead>
                        <tbody>
                            {vouchers.map((voucher) => (
                                <tr key={voucher.id}>
                                    <td><b>{voucher.campaign?.name}</b></td>
                                    <td><i>{voucher.code}</i></td>
                                    <td>{voucher.campaign?.description}</td>
                                    <td>
                                        {voucher.expires_at
                                            ? new Date(voucher.expires_at).toLocaleDateString()
                                            : 'N/A'}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <Footer />

            <Modal show={show} onHide={handleClose}>
                <Modal.Header>
                    <Modal.Title><b>Lịch sử nhận điểm</b></Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Điểm nhận được</th>
                                <th>Lời nhắn</th>
                            </tr>
                        </thead>
                        <tbody>
                            {point.historyPoints && point.historyPoints.length > 0 ? (
                                point.historyPoints.map((pnt) => (
                                    <tr key={pnt.id ?? `${pnt.dateSent}-${pnt.message}`}>
                                        <td>{pnt.pointsSent}</td>
                                        <td>{pnt.message || 'Không có lời nhắn'}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr><td colSpan="2">Không có dữ liệu</td></tr>
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

export default Profile;
