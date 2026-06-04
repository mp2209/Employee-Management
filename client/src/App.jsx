import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import './App.scss';

import Profile from './containers/Profile/Profile';
import EditProfile from './containers/EditProfile/EditProfile';
import CreateAccount from './containers/CreateAccount/CreateAccount'
import HomePage from './containers/HomePages/HomePage';
import Leave from './containers/Leave/Leave';
import UpdateTimeSheet from './containers/UpdateTimeSheet/UpdateTimeSheet' ;
import WorkFromHome from './containers/WorkFromHome/WorkFromHome';
import Approve from './containers/Approve/Approve';
import Activities from './containers/Activities/Activities';
import GivePoint from './containers/GivePoint/GivePoint';
import Voucher from './containers/Voucher/Voucher';
import ProtectedRoute from './services/ProtectedRoute';
import ErrorBoundary from './services/ErrorBoundary';

const withBoundary = (element) => <ErrorBoundary>{element}</ErrorBoundary>;


function App() {
  return (
    <Routes>
      <Route path="/" element={withBoundary(<HomePage />)} />
      <Route path="/profile" element={withBoundary(<Profile />)} />
      <Route path="/edit-profile" element={withBoundary(<EditProfile />)} />
      <Route path="/voucher" element={withBoundary(<Voucher />)} />
      <Route
        path="/create-account"
        element={
          <ProtectedRoute roles={['Manager']} element={withBoundary(<CreateAccount />)} />
        }
      />
      <Route
        path="/approve"
        element={<ProtectedRoute roles={['Manager']} element={withBoundary(<Approve />)} />}
      />
      <Route
        path="/activities"
        element={<ProtectedRoute roles={['Manager']} element={withBoundary(<Activities />)} />}
      />
      <Route
        path="/leave"
        element={<ProtectedRoute roles={['Employee']} element={withBoundary(<Leave />)} />}
      />
      <Route
        path="/update-time-sheet"
        element={
          <ProtectedRoute roles={['Employee']} element={withBoundary(<UpdateTimeSheet />)} />
        }
      />
      <Route
        path="/work-from-home"
        element={<ProtectedRoute roles={['Employee']} element={withBoundary(<WorkFromHome />)} />}
      />
      <Route
        path="/give-point"
        element={<ProtectedRoute roles={['Manager']} element={withBoundary(<GivePoint />)} />}
      />

      <Route path="*" element={<Navigate to="/" replace />} />

    </Routes>
  );
}

export default App;
