import React, { useCallback, useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useAuth } from '../../services/auth';
import { requestApi } from '../../services/apiClient';
import { useToast } from '../../services/toast';
import { requestPeriod } from '../../services/requestStatus';
import { startOfToday, toApiDateTime } from '../../services/format';
import PageHeader from '../../components/PageHeader';
import StatusBadge from '../../components/StatusBadge';
import EmptyState from '../../components/EmptyState';
import RequestInfoModal from '../../components/RequestInfoModal';

const endOfDay = (date) => {
    const end = new Date(date);
    end.setHours(23, 59, 59, 0);
    return end;
};

const Leave = () => {
    const { userId } = useAuth();
    const { employee } = useOutletContext();
    const toast = useToast();

    const [mode, setMode] = useState('single');
    const [form, setForm] = useState(() => ({ start: startOfToday(), end: startOfToday(), reason: '' }));
    const [errors, setErrors] = useState({});
    const [submitting, setSubmitting] = useState(false);
    const [requests, setRequests] = useState([]);
    const [detail, setDetail] = useState({ show: false, request: null });

    const loadRequests = useCallback(async () => {
        try {
            const { data } = await requestApi.get('/leave');
            setRequests(data.filter((request) => request.employeeId === userId).reverse());
        } catch (error) {
            toast.error(`Could not load your leave requests: ${error.message}`);
        }
    }, [userId, toast]);

    useEffect(() => {
        loadRequests();
    }, [loadRequests]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        const start = form.start;
        const end = mode === 'single' ? form.start : form.end;
        if (!start || start < startOfToday()) {
            setErrors({ start: 'The start date cannot be in the past.' });
            return;
        }
        if (!end || end < start) {
            setErrors({ end: 'The end date must be on or after the start date.' });
            return;
        }
        setErrors({});
        setSubmitting(true);
        try {
            await requestApi.post('', {
                employeeId: String(userId),
                employeeName: employee?.name,
                requestType: 'Leave',
                timeStart: toApiDateTime(start),
                timeEnd: toApiDateTime(endOfDay(end)),
                reasonRequest: form.reason.trim(),
                device: null,
            });
            toast.success('Leave request submitted');
            setForm((prev) => ({ ...prev, reason: '' }));
            loadRequests();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <PageHeader title="Leave" subtitle="Request time off and follow its approval." />

            <div className="row g-4">
                <div className="col-lg-5">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">New request</h2>
                        </div>
                        <div className="card-body">
                            <Form onSubmit={handleSubmit}>
                                <div className="segmented mb-4" role="group" aria-label="Leave length">
                                    <input type="radio" className="btn-check" name="leave-mode" id="leave-single"
                                           checked={mode === 'single'} onChange={() => setMode('single')} />
                                    <label className="btn" htmlFor="leave-single">Single day</label>
                                    <input type="radio" className="btn-check" name="leave-mode" id="leave-multiple"
                                           checked={mode === 'multiple'} onChange={() => setMode('multiple')} />
                                    <label className="btn" htmlFor="leave-multiple">Multiple days</label>
                                </div>

                                {mode === 'single' ? (
                                    <Form.Group className="mb-3">
                                        <Form.Label htmlFor="leave-date">Date</Form.Label>
                                        <DatePicker id="leave-date" selected={form.start} minDate={startOfToday()}
                                                    onChange={(date) => setForm((prev) => ({ ...prev, start: date }))}
                                                    dateFormat="dd/MM/yyyy" className="form-control" required />
                                        {errors.start && <div className="invalid-feedback d-block">{errors.start}</div>}
                                    </Form.Group>
                                ) : (
                                    <div className="row g-3 mb-3">
                                        <Form.Group className="col-sm-6">
                                            <Form.Label htmlFor="leave-from">From</Form.Label>
                                            <DatePicker id="leave-from" selected={form.start} minDate={startOfToday()}
                                                        onChange={(date) => setForm((prev) => ({ ...prev, start: date }))}
                                                        dateFormat="dd/MM/yyyy" className="form-control" required />
                                            {errors.start && <div className="invalid-feedback d-block">{errors.start}</div>}
                                        </Form.Group>
                                        <Form.Group className="col-sm-6">
                                            <Form.Label htmlFor="leave-to">To</Form.Label>
                                            <DatePicker id="leave-to" selected={form.end} minDate={form.start || startOfToday()}
                                                        onChange={(date) => setForm((prev) => ({ ...prev, end: date }))}
                                                        dateFormat="dd/MM/yyyy" className="form-control" required />
                                            {errors.end && <div className="invalid-feedback d-block">{errors.end}</div>}
                                        </Form.Group>
                                    </div>
                                )}

                                <Form.Group className="mb-4" controlId="leave-reason">
                                    <Form.Label>Reason</Form.Label>
                                    <Form.Control as="textarea" rows={3} required placeholder="e.g. Family event"
                                                  value={form.reason}
                                                  onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} />
                                </Form.Group>

                                <Button type="submit" disabled={submitting || !employee}>
                                    {submitting ? 'Submitting…' : 'Submit request'}
                                </Button>
                            </Form>
                        </div>
                    </div>
                </div>

                <div className="col-lg-7">
                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">My leave requests</h2>
                        </div>
                        {requests.length === 0 ? (
                            <EmptyState title="No leave requests yet">Requests you submit will appear here.</EmptyState>
                        ) : (
                            <div className="table-responsive">
                                <table className="table table-hover">
                                    <thead>
                                        <tr>
                                            <th>Dates</th>
                                            <th>Status</th>
                                            <th aria-label="Actions" />
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {requests.map((request) => (
                                            <tr key={request.id}>
                                                <td>
                                                    <div className="fw-medium text-body-emphasis text-nowrap">
                                                        {requestPeriod(request)}
                                                    </div>
                                                    <div className="small text-body-secondary text-truncate" style={{ maxWidth: 280 }}>
                                                        {request.reasonRequest || 'No reason given'}
                                                    </div>
                                                </td>
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
                </div>
            </div>

            <RequestInfoModal show={detail.show} request={detail.request}
                              onHide={() => setDetail((prev) => ({ ...prev, show: false }))} />
        </>
    );
};

export default Leave;
