import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPen, faTicket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../services/auth';
import { pointApi, voucherApi } from '../../services/apiClient';
import { formatDate } from '../../services/format';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';
import PointsHistoryModal from '../../components/PointsHistoryModal';

const Profile = () => {
    const { role, userId } = useAuth();
    const { employee } = useOutletContext();
    const [wallet, setWallet] = useState(null);
    const [vouchers, setVouchers] = useState(null); // null while loading
    const [voucherError, setVoucherError] = useState(false);
    const [showHistory, setShowHistory] = useState(false);

    useEffect(() => {
        if (!userId) return undefined;
        let cancelled = false;
        (async () => {
            const [walletRes, voucherRes] = await Promise.allSettled([
                pointApi.get(`/${userId}`),
                voucherApi.get(`/customers/${userId}/vouchers`),
            ]);
            if (cancelled) return;
            if (walletRes.status === 'fulfilled') setWallet(walletRes.value.data);
            const ok = voucherRes.status === 'fulfilled' && Array.isArray(voucherRes.value.data);
            setVouchers(ok ? voucherRes.value.data : []);
            setVoucherError(!ok);
        })();
        return () => { cancelled = true; };
    }, [userId]);

    const details = [
        ['Full name', employee?.name],
        ['Date of birth', employee?.birthDate],
        ['Gender', employee?.gender],
        ['Phone number', employee?.phoneNumber],
        ['Address', employee?.address],
        ['ID card number', employee?.identifyId],
        ['Tax number', employee?.taxNumber],
        ['Bank account', employee?.bankNumber],
    ];

    return (
        <>
            <PageHeader
                title="My profile"
                actions={(
                    <Link to="/edit-profile" className="btn btn-outline-secondary">
                        <FontAwesomeIcon icon={faPen} /> Edit profile
                    </Link>
                )}
            />

            <div className="row g-4">
                <div className="col-lg-4">
                    <div className="card mb-4">
                        <div className="card-body text-center py-4">
                            <Avatar name={employee?.name} image={employee?.avatar} size="xl" />
                            <h2 className="h5 mt-3 mb-1">{employee?.name || '—'}</h2>
                            <div className="text-body-secondary">
                                {[employee?.position, employee?.department].filter(Boolean).join(' · ') || 'No position set'}
                            </div>
                            <span className="badge badge-soft-primary mt-3">{role}</span>
                        </div>
                    </div>
                    <div className="card">
                        <div className="card-body">
                            <div className="stat-label">Points balance</div>
                            <div className="stat-value mb-3">{wallet?.totalPoint ?? '—'}</div>
                            <div className="d-flex flex-wrap gap-2">
                                <Button size="sm" variant="outline-secondary" onClick={() => setShowHistory(true)}>
                                    View history
                                </Button>
                                {role === 'Manager' ? (
                                    <Link to="/give-point" className="btn btn-sm btn-outline-primary">Give points</Link>
                                ) : (
                                    <Link to="/voucher" className="btn btn-sm btn-outline-primary">Redeem vouchers</Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="col-lg-8">
                    <div className="card mb-4">
                        <div className="card-header">
                            <h2 className="card-title">Personal information</h2>
                        </div>
                        <div className="card-body">
                            <dl className="detail-list">
                                {details.map(([label, value]) => (
                                    <React.Fragment key={label}>
                                        <dt>{label}</dt>
                                        <dd>{value || <span className="text-body-secondary">—</span>}</dd>
                                    </React.Fragment>
                                ))}
                            </dl>
                        </div>
                    </div>

                    <div className="card">
                        <div className="card-header">
                            <h2 className="card-title">Redeemed vouchers</h2>
                        </div>
                        {vouchers === null ? (
                            <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>
                        ) : vouchers.length === 0 ? (
                            <EmptyState icon={faTicket} title={voucherError ? 'Voucher service unavailable' : 'No vouchers yet'}>
                                {voucherError
                                    ? 'Your vouchers cannot be shown right now.'
                                    : 'Vouchers you redeem will appear here.'}
                            </EmptyState>
                        ) : (
                            <div className="table-responsive">
                                <table className="table">
                                    <thead>
                                        <tr>
                                            <th>Voucher</th>
                                            <th>Code</th>
                                            <th>Expires</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {vouchers.map((voucher) => (
                                            <tr key={voucher.id}>
                                                <td>
                                                    <div className="fw-medium text-body-emphasis">{voucher.campaign?.name}</div>
                                                    <div className="small text-body-secondary">{voucher.campaign?.description}</div>
                                                </td>
                                                <td><code>{voucher.code}</code></td>
                                                <td className="text-nowrap">
                                                    {voucher.expires_at ? formatDate(voucher.expires_at) : 'No expiry'}
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

            <PointsHistoryModal show={showHistory} onHide={() => setShowHistory(false)} history={wallet?.historyPoints} />
        </>
    );
};

export default Profile;
