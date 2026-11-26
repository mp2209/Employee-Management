import React, { useEffect, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { employeeApi, requestApi } from '../../services/apiClient';
import { useToast } from '../../services/toast';
import { REQUEST_STATUS, requestPeriod, requestTypeLabel } from '../../services/requestStatus';
import StatusBadge from '../../components/StatusBadge';
import Avatar from '../../components/Avatar';

/** Manager's review dialog: request details plus Approve / Reject. */
const RequestDetail = ({ show, id, onHide, onDecided }) => {
    const toast = useToast();
    const [request, setRequest] = useState(null);
    const [loadError, setLoadError] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [reasonError, setReasonError] = useState('');
    const [busy, setBusy] = useState(false);

    useEffect(() => {
        if (!show || !id) return undefined;
        let cancelled = false;
        setRequest(null);
        setLoadError('');
        setRejectionReason('');
        setReasonError('');
        requestApi.get(`/${id}`)
            .then(({ data }) => !cancelled && setRequest(data))
            .catch((error) => !cancelled && setLoadError(error.message));
        return () => { cancelled = true; };
    }, [show, id]);

    const isPending = request?.status === REQUEST_STATUS.PENDING;
    const typeLabel = requestTypeLabel(request?.requestType);

    const approve = async () => {
        setBusy(true);
        try {
            if (request.requestType === 'Update') {
                // An approved timesheet correction rewrites that day's attendance.
                await employeeApi.put('/update-checkin-checkout', null, {
                    params: {
                        userId: request.employeeId,
                        day: request.day,
                        checkIn: request.timeStart,
                        checkOut: request.timeEnd,
                    },
                });
            }
            await requestApi.put(`/${id}/approve`);
            toast.success(`Approved ${typeLabel.toLowerCase()} request from ${request.employeeName}`);
            onDecided();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setBusy(false);
        }
    };

    const reject = async () => {
        if (!rejectionReason.trim()) {
            setReasonError('Please enter a reason for rejecting this request.');
            return;
        }
        setBusy(true);
        try {
            await requestApi.put(`/${id}/reject`, null, { params: { reasonReject: rejectionReason.trim() } });
            toast.success(`Rejected ${typeLabel.toLowerCase()} request from ${request.employeeName}`);
            onDecided();
        } catch (error) {
            toast.error(error.message);
        } finally {
            setBusy(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Modal.Header closeButton>
                <Modal.Title>{isPending ? 'Review request' : 'Request details'}</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {!request ? (
                    loadError
                        ? <Alert variant="danger" className="mb-0">{loadError}</Alert>
                        : <div className="text-center py-4"><Spinner animation="border" size="sm" /></div>
                ) : (
                    <>
                        <div className="d-flex align-items-center gap-3 mb-4">
                            <Avatar name={request.employeeName} />
                            <div>
                                <div className="fw-semibold text-body-emphasis">{request.employeeName}</div>
                                <div className="small text-body-secondary">{typeLabel}</div>
                            </div>
                            <div className="ms-auto"><StatusBadge status={request.status} /></div>
                        </div>
                        <dl className="detail-list">
                            <dt>{request.requestType === 'Update' ? 'Date and time' : 'Dates'}</dt>
                            <dd>{requestPeriod(request)}</dd>
                            {request.reasonRequest && (
                                <>
                                    <dt>Reason</dt>
                                    <dd>{request.reasonRequest}</dd>
                                </>
                            )}
                            {request.device && (
                                <>
                                    <dt>Equipment needed</dt>
                                    <dd>{request.device}</dd>
                                </>
                            )}
                            {!isPending && request.reasonReject && (
                                <>
                                    <dt>Rejection reason</dt>
                                    <dd>{request.reasonReject}</dd>
                                </>
                            )}
                        </dl>
                        {isPending && (
                            <Form.Group className="mt-4" controlId="rejection-reason">
                                <Form.Label>
                                    Rejection reason <span className="fw-normal text-body-secondary">(only if rejecting)</span>
                                </Form.Label>
                                <Form.Control as="textarea" rows={2} value={rejectionReason} isInvalid={!!reasonError}
                                              onChange={(e) => {
                                                  setRejectionReason(e.target.value);
                                                  setReasonError('');
                                              }} />
                                <Form.Control.Feedback type="invalid">{reasonError}</Form.Control.Feedback>
                            </Form.Group>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onHide}>Close</Button>
                {isPending && (
                    <>
                        <Button variant="outline-danger" onClick={reject} disabled={busy}>Reject</Button>
                        <Button onClick={approve} disabled={busy || rejectionReason.trim() !== ''}>Approve</Button>
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default RequestDetail;
