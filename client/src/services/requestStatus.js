import { formatDate, formatTime } from './format';

/** Request statuses as stored by request-service. */
export const REQUEST_STATUS = Object.freeze({
    PENDING: 'Pending',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
});

const BADGE_CLASS = {
    [REQUEST_STATUS.PENDING]: 'badge-soft-warning',
    [REQUEST_STATUS.APPROVED]: 'badge-soft-success',
    [REQUEST_STATUS.REJECTED]: 'badge-soft-danger',
};

/** Badge color for a request status (see styles/theme.scss). */
export const statusBadgeClass = (status) => BADGE_CLASS[status] || 'badge-soft-neutral';

const TYPE_LABEL = {
    Leave: 'Leave',
    WFH: 'Work from home',
    Update: 'Timesheet correction',
};

export const requestTypeLabel = (type) => TYPE_LABEL[type] || type;

/** Human-readable period of a request, e.g. "02 Jan 2030" or "02 Jan 2030 · 08:00–17:00". */
export const requestPeriod = (request) => {
    if (!request) return '—';
    if (request.requestType === 'Update') {
        return `${formatDate(request.day)} · ${formatTime(request.timeStart)}–${formatTime(request.timeEnd)}`;
    }
    const start = formatDate(request.timeStart);
    const end = formatDate(request.timeEnd);
    return start === end ? start : `${start} – ${end}`;
};
