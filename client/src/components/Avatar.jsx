import React from 'react';
import { initials } from '../services/format';

/** Profile photo (Base64) or the person's initials. size: undefined | 'lg' | 'xl'. */
const Avatar = ({ name, image, size }) => (
    <span className={`avatar${size ? ` avatar-${size}` : ''}`} aria-hidden="true">
        {image ? <img src={`data:image/jpeg;base64,${image}`} alt="" /> : initials(name)}
    </span>
);

export default Avatar;
