import React from 'react';

/** Title, optional description and actions at the top of every page. */
const PageHeader = ({ title, subtitle, actions }) => (
    <div className="page-header">
        <div>
            <h1 className="page-title">{title}</h1>
            {subtitle && <p className="page-subtitle">{subtitle}</p>}
        </div>
        {actions && <div className="d-flex flex-wrap gap-2">{actions}</div>}
    </div>
);

export default PageHeader;
