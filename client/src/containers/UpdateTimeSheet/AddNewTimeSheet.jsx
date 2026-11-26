import React, { useState } from 'react';
import DatePicker from 'react-datepicker';
import TimePicker from 'react-bootstrap-time-picker';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import { useAuth } from '../../services/auth';
import { requestApi } from '../../services/apiClient';
import { useToast } from '../../services/toast';
import { startOfToday, toApiDate } from '../../services/format';

// TimePicker values are seconds since midnight.
const toTime = (seconds) => {
    const hours = String(Math.floor(seconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, '0');
    return `${hours}:${minutes}:00`;
};

const initialForm = () => ({ date: startOfToday(), start: 8 * 3600, end: 17 * 3600 });

/** Modal for a new timesheet correction request. */
const AddNewTimeSheet = ({ show, employee, onHide, onSubmitted }) => {
    const { userId } = useAuth();
    const toast = useToast();
    const [form, setForm] = useState(initialForm);
    const [error, setError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (form.end <= form.start) {
            setError('The check-out time must be after the check-in time.');
            return;
        }
        setError('');
        setSubmitting(true);
        try {
            await requestApi.post('', {
                employeeId: String(userId),
                employeeName: employee?.name,
                requestType: 'Update',
                day: toApiDate(form.date),
                timeStart: toTime(form.start),
                timeEnd: toTime(form.end),
                reasonRequest: null,
                device: null,
            });
            toast.success('Timesheet correction submitted');
            setForm(initialForm());
            onSubmitted();
        } catch (err) {
            toast.error(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal show={show} onHide={onHide} centered>
            <Form onSubmit={handleSubmit}>
                <Modal.Header closeButton>
                    <Modal.Title>New timesheet correction</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Label htmlFor="correction-date">Date</Form.Label>
                        <DatePicker id="correction-date" selected={form.date} maxDate={new Date()}
                                    onChange={(date) => setForm((prev) => ({ ...prev, date }))}
                                    dateFormat="dd/MM/yyyy" className="form-control" required />
                    </Form.Group>
                    <div className="row g-3">
                        <Form.Group className="col-6">
                            <Form.Label htmlFor="correction-start">Check-in</Form.Label>
                            <TimePicker id="correction-start" className="form-select" format={24}
                                        start="06:00" end="22:00" step={30} value={form.start}
                                        onChange={(start) => setForm((prev) => ({ ...prev, start }))} />
                        </Form.Group>
                        <Form.Group className="col-6">
                            <Form.Label htmlFor="correction-end">Check-out</Form.Label>
                            <TimePicker id="correction-end" className="form-select" format={24}
                                        start="06:00" end="22:00" step={30} value={form.end}
                                        onChange={(end) => setForm((prev) => ({ ...prev, end }))} />
                        </Form.Group>
                    </div>
                    {error && <div className="invalid-feedback d-block mt-2">{error}</div>}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="outline-secondary" onClick={onHide}>Cancel</Button>
                    <Button type="submit" disabled={submitting || !employee}>
                        {submitting ? 'Submitting…' : 'Submit correction'}
                    </Button>
                </Modal.Footer>
            </Form>
        </Modal>
    );
};

export default AddNewTimeSheet;
