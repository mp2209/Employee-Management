import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import { useAuth } from '../../services/auth';
import { requestApi } from '../../services/apiClient';
import { useToast } from '../../services/toast';
import { startOfToday, toApiDateTime } from '../../services/format';
import PageHeader from '../../components/PageHeader';

const emptyForm = () => ({ date: startOfToday(), reason: '', needsEquipment: false, equipment: '' });

const WorkFromHome = () => {
    const { userId } = useAuth();
    const { employee } = useOutletContext();
    const toast = useToast();
    const [form, setForm] = useState(emptyForm);
    const [dateError, setDateError] = useState('');
    const [submitting, setSubmitting] = useState(false);

    const update = (changes) => setForm((prev) => ({ ...prev, ...changes }));

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!form.date || form.date < startOfToday()) {
            setDateError('The date cannot be in the past.');
            return;
        }
        setDateError('');
        const end = new Date(form.date);
        end.setHours(23, 59, 59, 0);

        setSubmitting(true);
        try {
            await requestApi.post('', {
                employeeId: String(userId),
                employeeName: employee?.name,
                requestType: 'WFH',
                timeStart: toApiDateTime(form.date),
                timeEnd: toApiDateTime(end),
                reasonRequest: form.reason.trim(),
                device: form.needsEquipment ? form.equipment.trim() : null,
            });
            toast.success('Work-from-home request submitted');
            setForm(emptyForm());
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <>
            <PageHeader title="Work from home" subtitle="Ask your manager to work remotely for a day." />

            <div className="row">
                <div className="col-lg-8 col-xl-7">
                    <div className="card">
                        <div className="card-body">
                            <Form onSubmit={handleSubmit}>
                                <Form.Group className="mb-3">
                                    <Form.Label htmlFor="wfh-date">Date</Form.Label>
                                    <DatePicker id="wfh-date" selected={form.date} minDate={startOfToday()}
                                                onChange={(date) => update({ date })}
                                                dateFormat="dd/MM/yyyy" className="form-control" required />
                                    {dateError && <div className="invalid-feedback d-block">{dateError}</div>}
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="wfh-reason">
                                    <Form.Label>Reason</Form.Label>
                                    <Form.Control as="textarea" rows={3} required
                                                  placeholder="e.g. Waiting for a delivery at home"
                                                  value={form.reason} onChange={(e) => update({ reason: e.target.value })} />
                                </Form.Group>

                                <Form.Group className="mb-3">
                                    <Form.Label as="div">Equipment</Form.Label>
                                    <Form.Check type="radio" id="wfh-equipment-own" name="wfh-equipment"
                                                label="I already have the equipment I need"
                                                checked={!form.needsEquipment}
                                                onChange={() => update({ needsEquipment: false })} />
                                    <Form.Check type="radio" id="wfh-equipment-need" name="wfh-equipment"
                                                label="I need equipment from the company"
                                                checked={form.needsEquipment}
                                                onChange={() => update({ needsEquipment: true })} />
                                </Form.Group>

                                {form.needsEquipment && (
                                    <Form.Group className="mb-3" controlId="wfh-equipment-list">
                                        <Form.Label>Equipment needed</Form.Label>
                                        <Form.Control as="textarea" rows={2} required
                                                      placeholder="e.g. Laptop stand, external monitor"
                                                      value={form.equipment}
                                                      onChange={(e) => update({ equipment: e.target.value })} />
                                        <Form.Text>Separate items with commas.</Form.Text>
                                    </Form.Group>
                                )}

                                <div className="pt-2">
                                    <Button type="submit" disabled={submitting || !employee}>
                                        {submitting ? 'Submitting…' : 'Submit request'}
                                    </Button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default WorkFromHome;
