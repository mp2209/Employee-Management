import React, { useState, useEffect, useCallback } from 'react';
import { Button, Modal, Form, Nav } from 'react-bootstrap';
import { useAuth } from '../../services/auth';
import { pointApi, voucherApi } from '../../services/apiClient';

import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import RightSidebar from '../RightSidebar/RightSidebar';
import './Voucher.scss';

const Voucher = () => {
    const { role, userId } = useAuth();
    const [mainCampaigns, setMainCampaigns] = useState([]);
    const [subCampaigns, setSubCampaigns] = useState([]);
    const [activeMainCampaign, setActiveMainCampaign] = useState(null);
    const [employeePoints, setEmployeePoints] = useState(0);

    const [showAddVoucherModal, setShowAddVoucherModal] = useState(false);
    const [voucherFormData, setVoucherFormData] = useState({
        codeType: 'digits',
        giftCardValue: '',
        prefix: 'BILL',
        randomPartLength: 4,
        size: '',
    });
    const [selectedSubCampaignId, setSelectedSubCampaignId] = useState(null);

    const handleAddVoucher = useCallback(async () => {
        const { codeType, giftCardValue, prefix, randomPartLength, size } = voucherFormData;
        const requestBody = {
            code_type: codeType,
            gift_card_value: parseInt(giftCardValue, 10),
            prefix,
            random_part_length: randomPartLength,
            size: parseInt(size, 10),
        };

        if (Number.isNaN(requestBody.gift_card_value) || Number.isNaN(requestBody.size)) {
            alert('Voucher value and size must be numbers.');
            return;
        }

        try {
            const response = await voucherApi.post(
                `/campaigns/${selectedSubCampaignId}/vouchers/batch`,
                requestBody
            );
            if (response.status === 202) {
                alert('Vouchers added successfully!');
                setShowAddVoucherModal(false);
            } else {
                alert('Error adding vouchers. Please try again.');
            }
        } catch (error) {
            alert(`Error adding vouchers: ${error.message}. Please try again.`);
        }
    }, [selectedSubCampaignId, voucherFormData]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const [mainRes, subRes] = await Promise.all([
                    voucherApi.get('/campaigns?per_page=10'),
                    voucherApi.get('/campaigns/sub?per_page=20'),
                ]);
                if (cancelled) return;
                setMainCampaigns(mainRes.data.filter((c) => c.type === 'MainCampaign'));
                setSubCampaigns(subRes.data);
            } catch (error) {
                // Surface to user via alert so it's not silent
                alert(`Failed to load campaigns: ${error.message}`);
            }

            if (userId) {
                try {
                    const { data } = await pointApi.get(`/${userId}`);
                    if (!cancelled) setEmployeePoints(data.totalPoint ?? 0);
                } catch (error) {
                    if (!cancelled) setEmployeePoints(0);
                }
            }
        })();
        return () => {
            cancelled = true;
        };
    }, [userId]);

    const handleSelect = useCallback((selectedKey) => {
        setActiveMainCampaign(selectedKey);
    }, []);

    const handleRedeem = useCallback(async (subCampaignId, voucherCost) => {
        if (employeePoints < voucherCost) {
            alert('Not enough points to redeem this voucher.');
            return;
        }
        try {
            const { data } = await voucherApi.get(
                `/campaigns/${subCampaignId}/vouchers?per_page=50`
            );
            const availableVouchers = data.filter((v) => v.status === 'created');
            if (availableVouchers.length === 0) {
                alert('This voucher is out of stock.');
                return;
            }
            const randomVoucher =
                availableVouchers[Math.floor(Math.random() * availableVouchers.length)];
            const voucherCode = randomVoucher.code;

            try {
                await voucherApi.put(
                    `/customers/${userId}/vouchers`,
                    { vouchers: [voucherCode] }
                );
            } catch (error) {
                alert('Error redeeming voucher. Please try again.');
                return;
            }

            try {
                await pointApi.post('/redeem', null, {
                    params: {
                        employeeId: userId,
                        points: voucherCost,
                        message: `Redeemed voucher: ${randomVoucher.campaign?.name || ''}`,
                    },
                });
            } catch (error) {
                alert('Error updating points. Please try again.');
                return;
            }

            setEmployeePoints((prev) => prev - voucherCost);
            alert('Voucher redeemed successfully!');
        } catch (error) {
            alert('Error redeeming voucher. Please try again.');
        }
    }, [employeePoints, userId]);

    const filteredSubCampaigns = activeMainCampaign
        ? subCampaigns.filter((s) => s.parent_id === parseInt(activeMainCampaign, 10))
        : [];

    return (
        <React.Fragment>
            <Header />
            <section>
                <div className="content-frame">
                    <div className="d-flex align-items-center m-3 update-timesheet-header">
                        <div className="col-md-6">
                            <div className="mb-3">
                                <h5 className="card-title">Vouchers</h5>
                            </div>
                        </div>
                    </div>

                    <Nav variant="tabs" className="voucher-type" defaultActiveKey="link-1" onSelect={handleSelect}>
                        {mainCampaigns.map((campaign) => (
                            <Nav.Item key={campaign.id}>
                                <Nav.Link eventKey={campaign.id}>{campaign.name}</Nav.Link>
                            </Nav.Item>
                        ))}
                    </Nav>

                    <table className="table table-hover">
                        <thead>
                            <tr>
                                <th scope="col">Voucher</th>
                                <th scope="col">Description</th>
                                <th scope="col">Gift card value</th>
                                <th scope="col">Available</th>
                                <th scope="col">Expires</th>
                                {role && <th scope="col">Action</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {filteredSubCampaigns.map((sub) => (
                                <tr key={sub.id}>
                                    <td><b>{sub.name}</b></td>
                                    <td>{sub.description}</td>
                                    <td>{sub.gift_card_value}</td>
                                    <td>{sub.vouchers_count - sub.vouchers_distributed_count}</td>
                                    <td>
                                        {sub.expires_at
                                            ? new Date(sub.expires_at).toLocaleDateString()
                                            : 'N/A'}
                                    </td>
                                    {role === 'Employee' && (
                                        <td>
                                            <Button onClick={() => handleRedeem(sub.id, sub.gift_card_value)}>
                                                Redeem
                                            </Button>
                                        </td>
                                    )}
                                    {role === 'Manager' && (
                                        <td>
                                            <Button
                                                onClick={() => {
                                                    setSelectedSubCampaignId(sub.id);
                                                    setShowAddVoucherModal(true);
                                                }}
                                            >
                                                Add vouchers
                                            </Button>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>

                    <Modal show={showAddVoucherModal} onHide={() => setShowAddVoucherModal(false)}>
                        <Modal.Header closeButton>
                            <Modal.Title>Add vouchers</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <Form>
                                <Form.Group className="mb-3" controlId="voucherCode">
                                    <Form.Label>Code prefix</Form.Label>
                                    <Form.Control
                                        type="text"
                                        value={voucherFormData.prefix}
                                        onChange={(e) =>
                                            setVoucherFormData({ ...voucherFormData, prefix: e.target.value })
                                        }
                                        disabled
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="voucherValue">
                                    <Form.Label>Voucher value</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={voucherFormData.giftCardValue}
                                        onChange={(e) =>
                                            setVoucherFormData({
                                                ...voucherFormData,
                                                giftCardValue: e.target.value,
                                            })
                                        }
                                    />
                                </Form.Group>
                                <Form.Group className="mb-3" controlId="numberOfVouchers">
                                    <Form.Label>Quantity</Form.Label>
                                    <Form.Control
                                        type="number"
                                        value={voucherFormData.size}
                                        onChange={(e) =>
                                            setVoucherFormData({ ...voucherFormData, size: e.target.value })
                                        }
                                    />
                                </Form.Group>
                            </Form>
                        </Modal.Body>
                        <Modal.Footer>
                            <Button variant="secondary" onClick={() => setShowAddVoucherModal(false)}>
                                Close
                            </Button>
                            <Button variant="primary" onClick={handleAddVoucher}>
                                Add vouchers
                            </Button>
                        </Modal.Footer>
                    </Modal>
                </div>
                <RightSidebar />
            </section>
            <Footer />
        </React.Fragment>
    );
};

export default Voucher;
