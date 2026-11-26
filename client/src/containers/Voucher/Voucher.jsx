import React, { useEffect, useState } from 'react';
import Button from 'react-bootstrap/Button';
import Form from 'react-bootstrap/Form';
import Modal from 'react-bootstrap/Modal';
import Spinner from 'react-bootstrap/Spinner';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCoins, faTicket } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from '../../services/auth';
import { pointApi, voucherApi } from '../../services/apiClient';
import { useToast } from '../../services/toast';
import { formatDate } from '../../services/format';
import PageHeader from '../../components/PageHeader';
import EmptyState from '../../components/EmptyState';

const CODE_PREFIX = 'BILL';

const Voucher = () => {
    const { role, userId } = useAuth();
    const toast = useToast();
    const [campaigns, setCampaigns] = useState([]);
    const [subCampaigns, setSubCampaigns] = useState([]);
    const [activeCampaign, setActiveCampaign] = useState(null);
    const [points, setPoints] = useState(null);
    const [loading, setLoading] = useState(true);
    const [loadError, setLoadError] = useState('');
    const [redeemingId, setRedeemingId] = useState(null);
    const [addTarget, setAddTarget] = useState(null);
    const [showAdd, setShowAdd] = useState(false);
    const [batch, setBatch] = useState({ value: '', quantity: '' });
    const [adding, setAdding] = useState(false);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [mainRes, subRes] = await Promise.all([
                    voucherApi.get('/campaigns?per_page=10'),
                    voucherApi.get('/campaigns/sub?per_page=20'),
                ]);
                if (cancelled) return;
                const mains = mainRes.data.filter((campaign) => campaign.type === 'MainCampaign');
                setCampaigns(mains);
                setSubCampaigns(subRes.data);
                setActiveCampaign(mains[0]?.id ?? null);
            } catch (error) {
                if (cancelled) return;
                setLoadError(error.status === 401 || error.status === 403
                    ? 'The voucher service is not configured. Set VOUCHERY_API_KEY in .env to enable it.'
                    : `Could not load vouchers: ${error.message}`);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        pointApi.get(`/${userId}`)
            .then(({ data }) => !cancelled && setPoints(data.totalPoint ?? 0))
            .catch(() => !cancelled && setPoints(null));
        return () => { cancelled = true; };
    }, [userId]);

    const redeem = async (voucherCampaign) => {
        const cost = voucherCampaign.gift_card_value;
        setRedeemingId(voucherCampaign.id);
        try {
            const { data } = await voucherApi.get(`/campaigns/${voucherCampaign.id}/vouchers?per_page=50`);
            const available = data.filter((voucher) => voucher.status === 'created');
            if (available.length === 0) {
                toast.error('This voucher is out of stock.');
                return;
            }
            const voucher = available[Math.floor(Math.random() * available.length)];
            await voucherApi.put(`/customers/${userId}/vouchers`, { vouchers: [voucher.code] });
            await pointApi.post('/redeem', null, {
                params: { employeeId: userId, points: cost, message: `Redeemed voucher: ${voucherCampaign.name}` },
            });
            setPoints((prev) => (prev ?? 0) - cost);
            toast.success(`Redeemed “${voucherCampaign.name}”. Your code is in your profile.`);
        } catch (error) {
            toast.error(`Could not redeem the voucher: ${error.message}`);
        } finally {
            setRedeemingId(null);
        }
    };

    const openAdd = (voucherCampaign) => {
        setAddTarget(voucherCampaign);
        setBatch({ value: '', quantity: '' });
        setShowAdd(true);
    };

    const addVouchers = async (event) => {
        event.preventDefault();
        setAdding(true);
        try {
            await voucherApi.post(`/campaigns/${addTarget.id}/vouchers/batch`, {
                code_type: 'digits',
                gift_card_value: Number(batch.value),
                prefix: CODE_PREFIX,
                random_part_length: 4,
                size: Number(batch.quantity),
            });
            toast.success(`Adding ${batch.quantity} vouchers to “${addTarget.name}”`);
            setShowAdd(false);
        } catch (error) {
            toast.error(`Could not add vouchers: ${error.message}`);
        } finally {
            setAdding(false);
        }
    };

    const visible = subCampaigns.filter((voucherCampaign) => voucherCampaign.parent_id === activeCampaign);

    let content;
    if (loading) {
        content = <div className="text-center py-5"><Spinner animation="border" size="sm" /></div>;
    } else if (loadError) {
        content = <EmptyState icon={faTicket} title="Voucher catalogue unavailable">{loadError}</EmptyState>;
    } else if (campaigns.length === 0) {
        content = <EmptyState icon={faTicket} title="No campaigns yet">Voucher campaigns will appear here.</EmptyState>;
    } else {
        content = (
            <>
                <div className="tabs-underline">
                    {campaigns.map((campaign) => (
                        <button key={campaign.id} type="button" className={campaign.id === activeCampaign ? 'active' : ''}
                                onClick={() => setActiveCampaign(campaign.id)}>
                            {campaign.name}
                        </button>
                    ))}
                </div>
                {visible.length === 0 ? (
                    <EmptyState icon={faTicket} title="No vouchers in this campaign" />
                ) : (
                    <div className="table-responsive">
                        <table className="table table-hover">
                            <thead>
                                <tr>
                                    <th>Voucher</th>
                                    <th className="text-end">Cost</th>
                                    <th className="text-end">Available</th>
                                    <th>Expires</th>
                                    <th aria-label="Actions" />
                                </tr>
                            </thead>
                            <tbody>
                                {visible.map((voucherCampaign) => {
                                    const left = voucherCampaign.vouchers_count - voucherCampaign.vouchers_distributed_count;
                                    return (
                                        <tr key={voucherCampaign.id}>
                                            <td>
                                                <div className="fw-medium text-body-emphasis">{voucherCampaign.name}</div>
                                                <div className="small text-body-secondary">{voucherCampaign.description}</div>
                                            </td>
                                            <td className="text-end text-nowrap">{voucherCampaign.gift_card_value} pts</td>
                                            <td className="text-end">{left}</td>
                                            <td className="text-nowrap">
                                                {voucherCampaign.expires_at ? formatDate(voucherCampaign.expires_at) : 'No expiry'}
                                            </td>
                                            <td className="text-end">
                                                {role === 'Manager' ? (
                                                    <Button size="sm" variant="outline-primary" onClick={() => openAdd(voucherCampaign)}>
                                                        Add vouchers
                                                    </Button>
                                                ) : (
                                                    <Button size="sm" onClick={() => redeem(voucherCampaign)}
                                                            disabled={redeemingId !== null || left <= 0
                                                                || (points ?? 0) < voucherCampaign.gift_card_value}>
                                                        {redeemingId === voucherCampaign.id ? 'Redeeming…' : 'Redeem'}
                                                    </Button>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </>
        );
    }

    return (
        <>
            <PageHeader
                title="Vouchers"
                subtitle={role === 'Manager' ? 'Manage the voucher catalogue.' : 'Spend your points on vouchers from our partners.'}
                actions={role === 'Employee' && points !== null && (
                    <span className="badge badge-soft-primary fs-6 px-3 py-2">
                        <FontAwesomeIcon icon={faCoins} className="me-2" />{points} points
                    </span>
                )}
            />

            <div className="card">{content}</div>

            <Modal show={showAdd} onHide={() => setShowAdd(false)} centered>
                <Form onSubmit={addVouchers}>
                    <Modal.Header closeButton>
                        <Modal.Title>Add vouchers to {addTarget?.name}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        <Form.Group className="mb-3" controlId="voucher-prefix">
                            <Form.Label>Code prefix</Form.Label>
                            <Form.Control value={CODE_PREFIX} readOnly />
                        </Form.Group>
                        <div className="row g-3">
                            <Form.Group className="col-6" controlId="voucher-value">
                                <Form.Label>Value per voucher</Form.Label>
                                <Form.Control type="number" min="1" required value={batch.value}
                                              onChange={(e) => setBatch((prev) => ({ ...prev, value: e.target.value }))} />
                            </Form.Group>
                            <Form.Group className="col-6" controlId="voucher-quantity">
                                <Form.Label>Quantity</Form.Label>
                                <Form.Control type="number" min="1" required value={batch.quantity}
                                              onChange={(e) => setBatch((prev) => ({ ...prev, quantity: e.target.value }))} />
                            </Form.Group>
                        </div>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="outline-secondary" onClick={() => setShowAdd(false)}>Cancel</Button>
                        <Button type="submit" disabled={adding}>{adding ? 'Adding…' : 'Add vouchers'}</Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </>
    );
};

export default Voucher;
