import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInbox } from '@fortawesome/free-solid-svg-icons';

const EmptyState = ({ icon = faInbox, title, children }) => (
    <div className="empty-state">
        <FontAwesomeIcon icon={icon} className="empty-state-icon" />
        {title && <div className="empty-state-title">{title}</div>}
        {children && <div className="small">{children}</div>}
    </div>
);

export default EmptyState;
