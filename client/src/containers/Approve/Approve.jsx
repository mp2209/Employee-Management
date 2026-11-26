import React, { useCallback, useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import { requestApi } from '../../services/apiClient';
import { useToast } from '../../services/toast';
import { requestPeriod, requestTypeLabel } from '../../services/requestStatus';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';
import RequestDetail from './RequestDetail';

const Approve = () => {
    const toast = useToast();
    const [tab, setTab] = useState('pending');
    const [pending, setPending] = useState([]);
    const [reviewed, setReviewed] = useState([]);
    const [review, setReview] = useState({ show: false, id: null });

    const loadRequests = useCallback(async () => {
        try {
            const [pendingRes, reviewedRes] = await Promise.all([
                requestApi.get('/not-approved'),
                requestApi.get('/approved'),
            ]);
            setPending(pendingRes.data);
            setReviewed([...reviewedRes.data].reverse());
        } catch (error) {
            toast.error(`Could not load requests: ${error.message}`);
        }
    }, [toast]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const rows = tab === 'pending' ? pending : reviewed;

    return (
        <>
            <PageHeader title="Approvals"
                        subtitle="Review leave, work-from-home and timesheet requests from your team." />

            <div className="card">
                <div className="tabs-underline">
                    <button type="button" className={tab === 'pending' ? 'active' : ''} onClick={() => setTab('pending')}>
                        Pending
                        {pending.length > 0 && <span className="badge badge-soft-warning ms-2">{pending.length}</span>}
                    </button>
                    <button type="button" className={tab === 'reviewed' ? 'active' : ''} onClick={() => setTab('reviewed')}>
                        Reviewed
                    </button>
                </div>

                {rows.length === 0 ? (
                    tab === 'pending'
                        ? <EmptyState title="All caught up">There are no requests waiting for your review.</EmptyState>
                        : <EmptyState title="Nothing reviewed yet">Approved and rejected requests will appear here.</EmptyState>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Type</th>
                                    <th>Period</th>
                                    <th>Status</th>
                                    <th aria-label="Actions" />
                                </tr>
                            </thead>
                            <tbody>
                                {rows.map((request) => (
                                    <tr key={request.id}>
                                        <td>
                                            <div className="d-flex align-items-center gap-2">
                                                <Avatar name={request.employeeName} />
                                                <span className="fw-medium text-body-emphasis">{request.employeeName || '—'}</span>
                                            </div>
                                        </td>
                                        <td>{requestTypeLabel(request.requestType)}</td>
                                        <td className="text-nowrap">{requestPeriod(request)}</td>
                                        <td><StatusBadge status={request.status} /></td>
                                        <td className="text-end">
                                            <Button size="sm" variant={tab === 'pending' ? 'outline-primary' : 'outline-secondary'}
                                                    onClick={() => setReview({ show: true, id: request.id })}>
                                                {tab === 'pending' ? 'Review' : 'View'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <RequestDetail show={review.show} id={review.id}
                           onHide={() => setReview((prev) => ({ ...prev, show: false }))}
                           onDecided={() => {
                               setReview((prev) => ({ ...prev, show: false }));
                               loadRequests();
                           }} />
        </>
    );
};

export default Approve;
