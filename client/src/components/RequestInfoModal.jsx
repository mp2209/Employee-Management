import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import StatusBadge from './StatusBadge';
import { requestPeriod, requestTypeLabel } from '../services/requestStatus';

/** Read-only details of one of the employee's own requests. */
const RequestInfoModal = ({ show, request, onHide }) => (
    <Modal show={show} onHide={onHide} centered>
        <Modal.Header closeButton>
            <Modal.Title>{request ? `${requestTypeLabel(request.requestType)} request` : 'Request'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
            {request && (
                <dl className="detail-list">
                    <dt>Status</dt>
                    <dd><StatusBadge status={request.status} /></dd>
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
                    {request.reasonReject && (
                        <>
                            <dt>Rejection reason</dt>
                            <dd>{request.reasonReject}</dd>
                        </>
                    )}
                </dl>
            )}
        </Modal.Body>
        <Modal.Footer>
            <Button variant="outline-secondary" onClick={onHide}>Close</Button>
        </Modal.Footer>
    </Modal>
);

export default RequestInfoModal;
