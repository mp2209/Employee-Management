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
    const [errorMessage, setErrorMessage] = useState('');
    const { userId } = useAuth();

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
        const date = today.toLocaleDateString('en-GB', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
        setCurrentDate(date);

        // Restore today's check-in / check-out times
        const storedCheckInTime = localStorage.getItem('checkInTime');
        const storedCheckOutTime = localStorage.getItem('checkOutTime');
        const storedDate = localStorage.getItem('checkDate');

        // The state resets at 07:00 the next day
        const resetTime = new Date(today);
        resetTime.setDate(today.getDate() + 1);
        resetTime.setHours(7, 0, 0, 0);

        // A different day (or past the reset time): start fresh
        if (storedDate !== today.toDateString() || today >= resetTime) {
            localStorage.removeItem('checkInTime');
            localStorage.removeItem('checkOutTime');
            setCheckInTime('');
            setCheckOutTime('');
        } else {
            // Same day: keep the stored times
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
                    localStorage.setItem('checkInTime', timeString);
                    localStorage.setItem('checkDate', new Date().toDateString());
                    setErrorMessage('');
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
            setErrorMessage('Please check in before checking out.');
        } else if (!checkOutTime && userId) {
            try {
                const response = await employeeApi.post('/checkout', null, {
                    params: { userId }
                });
                if (response.status === 200) {
                    const timeString = getCurrentTime();
                    setCheckOutTime(timeString);
                    localStorage.setItem('checkOutTime', timeString);
                    setErrorMessage('');
                } else {
                    setErrorMessage('Error during check-out');
                }
            } catch (error) {
                setErrorMessage('Error during check-out: ' + error.message);
            }
        }
    };

    // Remember (once) that today's check-out has been recorded
    useEffect(() => {
        if (checkOutTime !== '' && !hasLoggedInfo) {
            setHasLoggedInfo(true);
        }
    }, [checkOutTime, hasLoggedInfo, setHasLoggedInfo]);

    return (
        <React.Fragment>
            <div className='checkin-checkout'>
                <div className='title'>
                    Working day:
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