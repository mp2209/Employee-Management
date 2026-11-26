import React, { useEffect, useMemo, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGift } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../services/auth';
import { employeeApi, pointApi } from '../../services/apiClient';
import { useToast } from '../../services/toast';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';

const GivePoint = () => {
    const { userId } = useAuth();
    const toast = useToast();
    const [employees, setEmployees] = useState([]);
    const [balance, setBalance] = useState(null);
    const [query, setQuery] = useState('');
    const [recipient, setRecipient] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ points: '', message: '' });
    const [sending, setSending] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [employeeRes, pointRes] = await Promise.all([employeeApi.get(''), pointApi.get('')]);
                if (cancelled) return;
                // Wallets are keyed by the owner's user id, not by the employee profile id.
                const wallets = pointRes.data;
                const mine = wallets.find((wallet) => String(wallet.uid) === String(userId));
                setBalance(mine ? mine.totalPoint : 0);
                setEmployees(employeeRes.data
                    .filter((employee) => String(employee.userId) !== String(userId))
                    .map((employee) => {
                        const wallet = wallets.find((w) => w.uid === employee.userId);
                        return { ...employee, points: wallet ? wallet.totalPoint : 0 };
                    }));
            } catch (error) {
                if (!cancelled) toast.error(`Could not load the team: ${error.message}`);
            }
        })();
        return () => { cancelled = true; };
    }, [userId, toast]);

    const filtered = useMemo(() => {
        const needle = query.trim().toLowerCase();
        return needle
            ? employees.filter((employee) => (employee.name || '').toLowerCase().includes(needle))
            : employees;
    }, [employees, query]);

    const openModal = (employee) => {
        setRecipient(employee);
        setForm({ points: '', message: '' });
        setShowModal(true);
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        const points = Number(form.points);
        setSending(true);
        try {
            const { data } = await pointApi.post('/send', null, {
                params: { managerId: userId, employeeId: recipient.userId, points, message: form.message.trim() },
            });
            setEmployees((prev) => prev.map((employee) =>
                employee.userId === recipient.userId ? { ...employee, points: data.totalPoint } : employee));
            setBalance((prev) => (prev ?? 0) - points);
            toast.success(`Sent ${points} points to ${recipient.name}`);
            setShowModal(false);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <>
            <PageHeader title="Give points"
                        subtitle="Recognize great work by sending points from your budget." />

            <div className="row g-4 mb-4">
                <div className="col-sm-6 col-lg-4">
                    <div className="card">
                        <div className="card-body d-flex align-items-center gap-3">
                            <span className="icon-tile"><FontAwesomeIcon icon={faGift} /></span>
                            <div>
                                <div className="stat-label">Your budget</div>
                                <div className="fs-4 fw-semibold text-body-emphasis">{balance ?? '—'} points</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="card-header">
                    <h2 className="card-title">Team members</h2>
                    <Form.Control type="search" size="sm" placeholder="Search by name" aria-label="Search by name"
                                  value={query} onChange={(e) => setQuery(e.target.value)} style={{ maxWidth: 240 }} />
                </div>
                {filtered.length === 0 ? (
                    <EmptyState title={employees.length ? 'No matches' : 'No team members yet'}>
                        {employees.length ? 'Try a different name.' : 'Employees you create will appear here.'}
                    </EmptyState>
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Employee</th>
                                    <th>Department</th>
                                    <th className="text-end">Points</th>
                                    <th aria-label="Actions" />
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((employee) => (
                                    <tr key={employee.id}>
                                        <td>
                                            <div className="d-flex align-items-center gap-3">
                                                <Avatar name={employee.name} image={employee.avatar} />
                                                <div>
                                                    <div className="fw-medium text-body-emphasis">{employee.name || '—'}</div>
                                                    <div className="small text-body-secondary">{employee.position || 'No position'}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td>{employee.department || '—'}</td>
                                        <td className="text-end fw-semibold text-body-emphasis">{employee.points}</td>
                                        <td className="text-end">
                                            <Button size="sm" variant="outline-primary" onClick={() => openModal(employee)}>
                                                Give points
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Form onSubmit={handleSubmit}>
                    <Modal.Header closeButton>
                        <Modal.Title>Give points to {recipient?.name}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="give-points-amount">
                            <Form.Label>Points</Form.Label>
                            <Form.Control type="number" min="1" max={balance ?? undefined} required
                                          value={form.points}
                                          onChange={(e) => setForm((prev) => ({ ...prev, points: e.target.value }))} />
                            <Form.Text>You have {balance ?? 0} points available.</Form.Text>
                        </Form.Group>
                        <Form.Group controlId="give-points-message">
                            <Form.Label>Message</Form.Label>
                            <Form.Control as="textarea" rows={3} placeholder="e.g. Thanks for shipping the release!"
                                          value={form.message}
                                          onChange={(e) => setForm((prev) => ({ ...prev, message: e.target.value }))} />
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button type="submit" disabled={sending}>{sending ? 'Sending…' : 'Send points'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default GivePoint;
