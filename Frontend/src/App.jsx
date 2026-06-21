import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import ReportMissing from './pages/ReportMissing';
import SubmitSighting from './pages/SubmitSighting';
import Dashboard from './pages/Dashboard';
import PublicDatabase from './pages/PublicDatabase';
import MapDashboard from './pages/MapDashboard';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';
import ForcePasswordChange from './pages/ForcePasswordChange';

import AdminLayout from './components/AdminLayout';
import SubAdminLayout from './components/SubAdminLayout';
import Overview from './pages/admin/Overview';
import VerificationCenter from './pages/admin/VerificationCenter';
import CaseManagement from './pages/admin/CaseManagement';
import TeamManagement from './pages/shared/TeamManagement';

import PoliceLayout from './components/PoliceLayout';
import SubPoliceLayout from './components/SubPoliceLayout';
import PoliceOverview from './pages/police/PoliceOverview';

import SuperAdminLayout from './components/SuperAdminLayout';
import SuperAdminOverview from './pages/superadmin/SuperAdminOverview';
import UserManagement from './pages/superadmin/UserManagement';
import SystemLogs from './pages/superadmin/SystemLogs';
import ActivityWidget from './components/ActivityWidget';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="login" element={<Login />} />
          <Route path="forgot-password" element={<ForgotPassword />} />
          <Route path="force-change-password" element={<ForcePasswordChange />} />
          <Route path="register" element={<Register />} />
          <Route path="report-missing" element={<ReportMissing />} />
          <Route path="submit-sighting" element={<SubmitSighting />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="database" element={<PublicDatabase />} />
          <Route path="heatmap" element={<MapDashboard />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="matches" element={<VerificationCenter />} />
          <Route path="cases" element={<CaseManagement />} />
          <Route path="team" element={<TeamManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/subadmin" element={<SubAdminLayout />}>
          <Route index element={<Overview />} />
          <Route path="matches" element={<VerificationCenter />} />
          <Route path="cases" element={<CaseManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/police" element={<PoliceLayout />}>
          <Route index element={<PoliceOverview />} />
          <Route path="cases" element={<CaseManagement />} />
          <Route path="matches" element={<VerificationCenter />} />
          <Route path="team" element={<TeamManagement />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/subpolice" element={<SubPoliceLayout />}>
          <Route index element={<PoliceOverview />} />
          <Route path="cases" element={<CaseManagement />} />
          <Route path="matches" element={<VerificationCenter />} />
          <Route path="settings" element={<Settings />} />
        </Route>

        <Route path="/superadmin" element={<SuperAdminLayout />}>
          <Route index element={<SuperAdminOverview />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="cases" element={<CaseManagement />} />
          <Route path="matches" element={<VerificationCenter />} />
          <Route path="settings" element={<Settings />} />
        </Route>
      </Routes>
      <ActivityWidget />
      <Toaster theme="dark" position="top-right" richColors />
    </BrowserRouter>
  );
}

export default App;
