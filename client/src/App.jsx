import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';

import Layout from './components/Layout';
import LoginPage from './containers/Login/LoginPage';
import HomePage from './containers/HomePages/HomePage';
import Profile from './containers/Profile/Profile';
import EditProfile from './containers/EditProfile/EditProfile';
import Voucher from './containers/Voucher/Voucher';
import Leave from './containers/Leave/Leave';
import WorkFromHome from './containers/WorkFromHome/WorkFromHome';
import UpdateTimeSheet from './containers/UpdateTimeSheet/UpdateTimeSheet';
import Approve from './containers/Approve/Approve';
import GivePoint from './containers/GivePoint/GivePoint';
import Activities from './containers/Activities/Activities';
import CreateAccount from './containers/CreateAccount/CreateAccount';
import ProtectedRoute from './services/ProtectedRoute';
import { useAuth } from './services/auth';

const managerOnly = (element) => <ProtectedRoute roles={['Manager']} element={element} />;
const employeeOnly = (element) => <ProtectedRoute roles={['Employee']} element={element} />;

function App() {
    const { isLoggedIn } = useAuth();

    if (!isLoggedIn) {
        return <LoginPage />;
    }

    return (
        <Routes>
            <Route element={<Layout />}>
                <Route index element={<HomePage />} />
                <Route path="profile" element={<Profile />} />
                <Route path="edit-profile" element={<EditProfile />} />
                <Route path="voucher" element={<Voucher />} />
                <Route path="leave" element={employeeOnly(<Leave />)} />
                <Route path="work-from-home" element={employeeOnly(<WorkFromHome />)} />
                <Route path="update-time-sheet" element={employeeOnly(<UpdateTimeSheet />)} />
                <Route path="approve" element={managerOnly(<Approve />)} />
                <Route path="give-point" element={managerOnly(<GivePoint />)} />
                <Route path="activities" element={managerOnly(<Activities />)} />
                <Route path="create-account" element={managerOnly(<CreateAccount />)} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
        </Routes>
    );
}

export default App;
