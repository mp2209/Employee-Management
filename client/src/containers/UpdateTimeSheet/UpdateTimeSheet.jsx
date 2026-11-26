import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faUserClock } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../services/auth';
import { requestApi } from '../../services/apiClient';
import { useToast } from '../../services/toast';
import { formatDate, formatTime } from '../../services/format';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import RequestInfoModal from '../../components/RequestInfoModal';
import AddNewTimeSheet from './AddNewTimeSheet';

const UpdateTimeSheet = () => {
    const { userId } = useAuth();
    const { employee } = useOutletContext();
    const toast = useToast();
    const [requests, setRequests] = useState([]);
    const [showAdd, setShowAdd] = useState(false);
    const [detail, setDetail] = useState({ show: false, request: null });

    const loadRequests = useCallback(async () => {
        try {
            const { data } = await requestApi.get('/update');
            setRequests(data.filter((request) => request.employeeId === userId).reverse());
        } catch (error) {
            toast.error(`Could not load your corrections: ${error.message}`);
        }
    }, [userId, toast]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    return (
        <>
            <PageHeader
                title="Timesheet corrections"
                subtitle="Fix a missed or wrong check-in / check-out. Your manager approves each correction."
                actions={(
                    <Button onClick={() => setShowAdd(true)}>
                        <FontAwesomeIcon icon={faPlus} /> New correction
                    </Button>
                )}
            />

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">My corrections</h2>
                </div>
                {requests.length === 0 ? (
                    <EmptyState icon={faUserClock} title="No corrections yet">
                        Use “New correction” if a check-in or check-out is missing or wrong.
                    </EmptyState>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Check-in</th>
                                    <th>Check-out</th>
                                    <th>Status</th>
                                    <th aria-label="Actions" />
                                </tr>
                            </thead>
                            <tbody>
                                {requests.map((request) => (
                                    <tr key={request.id}>
                                        <td className="text-nowrap">{formatDate(request.day)}</td>
                                        <td>{formatTime(request.timeStart)}</td>
                                        <td>{formatTime(request.timeEnd)}</td>
                                        <td><StatusBadge status={request.status} /></td>
                                        <td className="text-end">
                                            <Button size="sm" variant="outline-secondary"
                                                    onClick={() => setDetail({ show: true, request })}>
                                                View
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AddNewTimeSheet show={showAdd} employee={employee}
                             onHide={() => setShowAdd(false)}
                             onSubmitted={() => {
                                 setShowAdd(false);
                                 loadRequests();
                             }} />
            <RequestInfoModal show={detail.show} request={detail.request}
                              onHide={() => setDetail((prev) => ({ ...prev, show: false }))} />
        </>
    );
};

export default UpdateTimeSheet;
