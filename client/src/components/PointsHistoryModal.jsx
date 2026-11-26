import React from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import EmptyState from './EmptyState';
import { formatDate } from '../services/format';

/** Credits and debits of a points wallet, newest first. */
const PointsHistoryModal = ({ show, onHide, history = [] }) => {
    const entries = [...history].reverse();
    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Points history</Modal.Title>
            </Modal.Header>
            <Modal.Body className="p-0">
                {entries.length === 0 ? (
                    <EmptyState title="No activity yet">Points you receive or spend will show up here.</EmptyState>
                ) : (
                    <div className="table-responsive">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Date</th>
                                    <th>Description</th>
                                    <th className="text-end">Points</th>
                                </tr>
                            </thead>
                            <tbody>
                                {entries.map((entry, index) => (
                                    <tr key={entry.id ?? index}>
                                        <td className="text-nowrap text-body-secondary">{formatDate(entry.dateSent)}</td>
                                        <td>{entry.message || '—'}</td>
                                        <td className={`text-end ${entry.pointsSent < 0 ? 'amount-negative' : 'amount-positive'}`}>
                                            {entry.pointsSent > 0 ? `+${entry.pointsSent}` : entry.pointsSent}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Modal.Body>
            <Modal.Footer>
                <Button variant="outline-secondary" onClick={onHide}>Close</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default PointsHistoryModal;
