import React, { useContext, useEffect, useState } from 'react';
import { useAuth } from '../../services/auth';
import { employeeApi } from '../../services/apiClient';
import { CheckInContext } from '../../services/CheckInProvider';
import { CheckOutContext } from '../../services/CheckOutProvider';
import { Button } from 'react-bootstrap';
import './RightSidebar.scss';

const RightSidebar = () => {
    const [currentDate, setCurrentDate] = useState('');
    const { checkInTime, setCheckInTime } = useContext(CheckInContext);
    const { checkOutTime, setCheckOutTime, hasLoggedInfo, setHasLoggedInfo } = useContext(CheckOutContext);
    const [timeStart, setTimeStart] = useState('');
    const [timeEnd, setTimeEnd] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const { userId } = useAuth();

    const checkInInfo = {
        "Mã nhân viên": "123",
        "Họ tên": "Nguyễn Văn A",
        "Bộ phận": "Phòng kế toán",
        "Phone": "0123456789",
        "Loại yêu cầu": "Check-in, Check-out",
        "Time_start": timeStart,
        "Time_end": timeEnd
    };

    const formatDateTime = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    useEffect(() => {
        const today = new Date();
        const date = today.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        setCurrentDate(date);

        // Lấy dữ liệu từ localStorage
        const storedCheckInTime = localStorage.getItem('checkInTime');
        const storedCheckOutTime = localStorage.getItem('checkOutTime');
        const storedDate = localStorage.getItem('checkDate');

        // Tạo thời gian 07:00 của ngày hôm sau
        const resetTime = new Date(today);
        resetTime.setDate(today.getDate() + 1); // Tăng ngày lên 1
        resetTime.setHours(7, 0, 0, 0);

        // Nếu ngày hiện tại đã qua 07:00 của ngày hôm sau, reset trạng thái
        if (storedDate !== today.toDateString() || today >= resetTime) {
            // Đã qua 07:00, reset trạng thái
            localStorage.removeItem('checkInTime');
            localStorage.removeItem('checkOutTime');
            setCheckInTime('');
            setCheckOutTime('');
        } else {
            // Nếu trong ngày hiện tại, giữ nguyên trạng thái
            if (storedCheckInTime) setCheckInTime(storedCheckInTime);
            if (storedCheckOutTime) setCheckOutTime(storedCheckOutTime);
        }
    }, [setCheckInTime, setCheckOutTime]);

    const getCurrentTime = () => {
        const now = new Date();
        return formatDateTime(now);
    };

    const handleCheckIn = async () => {
        if (!checkInTime && userId) {
            try {
                const response = await employeeApi.post('/checkin', null, {
                    params: { userId }
                });
                if (response.status === 200) {
                    const timeString = getCurrentTime();
                    setCheckInTime(timeString);
                    setTimeStart(timeString);
                    localStorage.setItem('checkInTime', timeString);
                    localStorage.setItem('checkDate', new Date().toDateString());
                    setErrorMessage(''); // Reset thông báo lỗi nếu có
                } else {
                    setErrorMessage('Error during check-in');
                }
            } catch (error) {
                setErrorMessage('Error during check-in: ' + error.message);
            }
        }
    };

    const handleCheckOut = async () => {
        if (!checkInTime) {
            setErrorMessage('Bạn phải Check-in trước khi Check-out!');
        } else if (!checkOutTime && userId) {
            try {
                const response = await employeeApi.post('/checkout', null, {
                    params: { userId }
                });
                if (response.status === 200) {
                    const timeString = getCurrentTime();
                    setCheckOutTime(timeString);
                    setTimeEnd(timeString);
                    localStorage.setItem('checkOutTime', timeString);
                    setErrorMessage(''); // Reset thông báo lỗi nếu có
                } else {
                    setErrorMessage('Error during check-out');
                }
            } catch (error) {
                setErrorMessage('Error during check-out: ' + error.message);
            }
        }
    };

    // Kiểm soát việc in ra console chỉ 1 lần duy nhất
    useEffect(() => {
        if (checkOutTime !== '' && !hasLoggedInfo) {
            setHasLoggedInfo(true); // Đánh dấu là đã log
        }
    }, [checkOutTime, hasLoggedInfo, setHasLoggedInfo]);

    return (
        <React.Fragment>
            <div className='checkin-checkout'>
                <div className='title'>
                    Thời gian làm việc:
                    <span> {currentDate}</span>
                </div>
                <div className='py-3 ps-3'>
                    <div className='d-flex align-items-center text-center pb-3'>
                        <Button onClick={handleCheckIn} disabled={checkInTime !== ''}>Check-in</Button>
                        <div className={`ps-2 fs-5 ${checkInTime ? '' : 'd-none'}`}>
                            {checkInTime}
                        </div>
                    </div>
                    <div className='d-flex align-items-center text-center pb-3'>
                        <Button onClick={handleCheckOut} disabled={checkOutTime !== ''}>Check-out</Button>
                        <div className={`ps-2 fs-5 ${checkOutTime ? '' : 'd-none'}`}>
                            {checkOutTime}
                        </div>
                    </div>
                </div>
                {errorMessage && <div className="text-danger ps-3">{errorMessage}</div>}
            </div>
        </React.Fragment>
    );
}

export default RightSidebar;