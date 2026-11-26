import React from 'react';
import { statusBadgeClass } from '../services/requestStatus';

const StatusBadge = ({ status }) => (
    <span className={`badge ${statusBadgeClass(status)}`}>{status || '—'}</span>
);

export default StatusBadge;
