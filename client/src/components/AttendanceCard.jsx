import React, { useContext, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { useAuth } from '../services/auth';
import { employeeApi } from '../services/apiClient';
import { CheckInContext } from '../services/CheckInProvider';
import { CheckOutContext } from '../services/CheckOutProvider';
import { useToast } from '../services/toast';
import { formatTime, toApiDateTime } from '../services/format';

/** Today's check-in / check-out. Times are remembered in localStorage until 07:00 the next day. */
const AttendanceCard = () => {
    const { userId } = useAuth();
    const toast = useToast();
    const { checkInTime, setCheckInTime } = useContext(CheckInContext);
    const { checkOutTime, setCheckOutTime } = useContext(CheckOutContext);
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        const today = new Date();
        const resetTime = new Date(today);
        resetTime.setDate(today.getDate() + 1);
        resetTime.setHours(7, 0, 0, 0);

        if (localStorage.getItem('checkDate') !== today.toDateString() || today >= resetTime) {
            localStorage.removeItem('checkInTime');
            localStorage.removeItem('checkOutTime');
            setCheckInTime('');
            setCheckOutTime('');
        } else {
            setCheckInTime(localStorage.getItem('checkInTime') || '');
            setCheckOutTime(localStorage.getItem('checkOutTime') || '');
        }
    }, [setCheckInTime, setCheckOutTime]);

    const handleCheckIn = async () => {
        setBusy(true);
        try {
            const { data } = await employeeApi.post('/checkin', null, { params: { userId } });
            const now = toApiDateTime(new Date());
            setCheckInTime(now);
            localStorage.setItem('checkInTime', now);
            localStorage.setItem('checkDate', new Date().toDateString());
            toast.success(data || 'Checked in');
        } catch (error) {
            toast.error(`Check-in failed: ${error.message}`);
        } finally {
            setBusy(false);
        }
    };

    const handleCheckOut = async () => {
        setBusy(true);
        try {
            const { data } = await employeeApi.post('/checkout', null, { params: { userId } });
            const now = toApiDateTime(new Date());
            setCheckOutTime(now);
            localStorage.setItem('checkOutTime', now);
            toast.success(data || 'Checked out');
        } catch (error) {
            toast.error(`Check-out failed: ${error.message}`);
        } finally {
            setBusy(false);
        }
    };

    const today = new Date().toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'short' });

    return (
        <div className="card h-100">
            <div className="card-header">
                <h2 className="card-title">Attendance</h2>
                <span className="card-subtitle">{today}</span>
            </div>
            <div className="card-body d-flex flex-column">
                <div className="d-flex gap-5 mb-4">
                    <div>
                        <div className="stat-label">Check-in</div>
                        <div className="fs-4 fw-semibold text-body-emphasis">{checkInTime ? formatTime(checkInTime) : '—'}</div>
                    </div>
                    <div>
                        <div className="stat-label">Check-out</div>
                        <div className="fs-4 fw-semibold text-body-emphasis">{checkOutTime ? formatTime(checkOutTime) : '—'}</div>
                    </div>
                </div>
                <div className="d-flex gap-2 mt-auto">
                    <Button onClick={handleCheckIn} disabled={busy || !!checkInTime}>Check in</Button>
                    <Button variant="outline-secondary" onClick={handleCheckOut}
                            disabled={busy || !checkInTime || !!checkOutTime}>
                        Check out
                    </Button>
                </div>
            </div>
        </div>
    );
};

export default AttendanceCard;
