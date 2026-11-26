import React from 'react';
import { NavLink } from 'react-router-dom';

const Footer = () => {
    return (
       <React.Fragment>
           <div className="container">
                <footer className="pt-3 mt-3">
                    <ul className="nav justify-content-center border-bottom pb-3 mb-3">
                        <li className="nav-item">
                            <NavLink to = '/' className="nav-link px-2 text-muted">
                                Home
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to = '/leave' className="nav-link px-2 text-muted">
                                Leave
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to = '/update-time-sheet' className="nav-link px-2 text-muted">
                                Update Time-sheet
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to = '/work-from-home' className="nav-link px-2 text-muted">
                                WFH
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink to = '/activities' className="nav-link px-2 text-muted">
                                Activities
                            </NavLink>
                        </li>
                    </ul>
                    <p className="text-center text-muted">© 2024 Company, Inc</p>
                </footer>
            </div>
       </React.Fragment>
     );
}

export default Footer;