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

/** Badge color for a request status (see App.scss). */
export const statusBadgeClass = (status) => BADGE_CLASS[status] || '';
