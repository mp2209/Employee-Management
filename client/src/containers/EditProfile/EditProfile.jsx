import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useOutletContext } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCamera } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../services/auth';
import { employeeApi } from '../../services/apiClient';
import { useToast } from '../../services/toast';
import { fromDayMonthYear, toDayMonthYear } from '../../services/format';
import PageHeader from '../../components/PageHeader';
import Avatar from '../../components/Avatar';

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;

const EditProfile = () => {
    const { userId } = useAuth();
    const { reloadEmployee } = useOutletContext();
    const toast = useToast();
    const navigate = useNavigate();
    const fileInput = useRef(null);
    const [employee, setEmployee] = useState(null);
    const [birthDate, setBirthDate] = useState(null);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        let cancelled = false;
        employeeApi.get(`/${userId}`)
            .then(({ data }) => {
                if (cancelled) return;
                setEmployee(data);
                setBirthDate(fromDayMonthYear(data.birthDate));
            })
            .catch((error) => !cancelled && toast.error(`Could not load your profile: ${error.message}`));
        return () => { cancelled = true; };
    }, [userId, toast]);

    const handleChange = (event) => {
        const { name, value } = event.target;
        setEmployee((prev) => ({ ...prev, [name]: value }));
    };

    const handleUpload = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = '';
        if (!file) return;
        if (file.size > MAX_AVATAR_BYTES) {
            toast.error('Please choose an image under 2 MB.');
            return;
        }
        const formData = new FormData();
        formData.append('file', file);
        setUploading(true);
        try {
            const { data } = await employeeApi.post(`/${userId}/avatar`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            setEmployee((prev) => ({ ...prev, avatar: data.avatar }));
            reloadEmployee();
            toast.success('Photo updated');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (event) => {
        event.preventDefault();
        setSaving(true);
        try {
            await employeeApi.put(`/${userId}`, {
                ...employee,
                birthDate: birthDate ? toDayMonthYear(birthDate) : employee.birthDate,
            });
            reloadEmployee();
            toast.success('Profile updated');
            navigate('/profile');
        } catch (error) {
            toast.error(error.message);
        } finally {
            setSaving(false);
        }
    };

    if (!employee) {
        return (
            <>
                <PageHeader title="Edit profile" />
                <div className="card">
                    <div className="card-body text-center py-5"><Spinner animation="border" size="sm" /></div>
                </div>
            </>
        );
    }

    const field = (name, label, options = {}) => (
        <Form.Group className={options.wide ? 'col-12' : 'col-md-6'} controlId={`profile-${name}`}>
            <Form.Label>{label}</Form.Label>
            <Form.Control name={name} value={employee[name] || ''} onChange={handleChange}
                          readOnly={options.readOnly} inputMode={options.inputMode} />
            {options.hint && <Form.Text>{options.hint}</Form.Text>}
        </Form.Group>
    );

    return (
        <>
            <PageHeader title="Edit profile" subtitle="Keep your personal information up to date." />

            <div className="row">
                <div className="col-xl-9">
                    <div className="card">
                        <div className="card-body p-4">
                            <div className="d-flex align-items-center gap-3 mb-4">
                                <Avatar name={employee.name} image={employee.avatar} size="lg" />
                                <div>
                                    <div className="fw-semibold text-body-emphasis">{employee.name}</div>
                                    <Button size="sm" variant="outline-secondary" className="mt-2" disabled={uploading}
                                            onClick={() => fileInput.current?.click()}>
                                        <FontAwesomeIcon icon={faCamera} /> {uploading ? 'Uploading…' : 'Change photo'}
                                    </Button>
                                    <div className="form-text">JPG or PNG, up to 2 MB.</div>
                                </div>
                                <input ref={fileInput} type="file" accept="image/*" className="d-none" onChange={handleUpload} />
                            </div>

                            <Form onSubmit={handleSubmit}>
                                <div className="row g-3">
                                    <Form.Group className="col-md-6">
                                        <Form.Label htmlFor="profile-birth-date">Date of birth</Form.Label>
                                        <DatePicker id="profile-birth-date" selected={birthDate} onChange={setBirthDate}
                                                    dateFormat="dd/MM/yyyy" placeholderText="dd/mm/yyyy" maxDate={new Date()}
                                                    showYearDropdown showMonthDropdown dropdownMode="select"
                                                    className="form-control" />
                                    </Form.Group>
                                    {field('phoneNumber', 'Phone number', { inputMode: 'tel' })}
                                    {field('address', 'Address', { wide: true })}
                                    {field('identifyId', 'ID card number', { readOnly: true, hint: 'Contact HR to change it.' })}
                                    {field('taxNumber', 'Tax number', { inputMode: 'numeric' })}
                                    {field('bankNumber', 'Bank account', { inputMode: 'numeric' })}
                                </div>
                                <div className="d-flex justify-content-end gap-2 mt-4">
                                    <Link to="/profile" className="btn btn-outline-secondary">Cancel</Link>
                                    <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</Button>
                                </div>
                            </Form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default EditProfile;
