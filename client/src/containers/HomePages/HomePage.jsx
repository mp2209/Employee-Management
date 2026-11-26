import React from 'react';

import Header from '../Header/Header';
import RightSidebar from '../RightSidebar/RightSidebar';
import Footer from '../Footer/Footer';
import './HomePage.scss'

const HomePage = () => {
  return (
    <React.Fragment>
        <Header/>
        <section>
          <div className='content-frame'>
            <div className='notification'>
              <ul className='display-listing'>
                <li className='listing-item'>
                  <div className='d-flex justify-content-start'>
                    <div className='item-title'>National Day (Sep 2) holiday schedule</div>
                    <span>27/08/2024</span>
                  </div>
                </li>
                <li className='listing-item'>
                  <div className='d-flex justify-content-start'>
                    <div className='item-title'>Most active employees: July</div>
                    <span>02/08/2024</span>
                  </div>
                </li>
                <li className='listing-item'>
                  <div className='d-flex justify-content-start'>
                    <div className='item-title'>Updated staff lists for all departments</div>
                    <span>01/08/2024</span>
                  </div>
                </li>
                <li className='listing-item'>
                  <div className='d-flex justify-content-start'>
                    <div className='item-title'>Outstanding employee awards: Q2</div>
                    <span>10/07/2024</span>
                  </div>
                </li>
                <li className='listing-item'>
                  <div className='d-flex justify-content-start'>
                    <div className='item-title'>Most active employees: June</div>
                    <span>02/07/2024</span>
                  </div>
                </li>
                <li className='listing-item'>
                  <div className='d-flex justify-content-start'>
                    <div className='item-title'>Company trip plan</div>
                    <span>25/06/2024</span>
                  </div>
                </li>
                <li className='listing-item'>
                  <div className='d-flex justify-content-start'>
                    <div className='item-title'>Talk: lessons learned in project management</div>
                    <span>20/06/2024</span>
                  </div>
                </li>
                <li className='listing-item'>
                  <div className='d-flex justify-content-start'>
                    <div className='item-title'>New activity: running club</div>
                    <span>01/06/2024</span>
                  </div>
                </li>
                <li className='listing-item'>
                  <div className='d-flex justify-content-start'>
                    <div className='item-title'>Guide to the new company intranet</div>
                    <span>15/05/2024</span>
                  </div>
                </li>
                <li className='listing-item'>
                  <div className='d-flex justify-content-start'>
                    <div className='item-title'>Intranet upgrade notice</div>
                    <span>15/05/2024</span>
                  </div>
                </li>
              </ul>
            </div>
          </div>
          <RightSidebar/>
        </section>
        <Footer />
    </React.Fragment>
  );
}

export default HomePage;