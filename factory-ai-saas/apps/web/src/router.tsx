import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Spin } from 'antd';
import { useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import MainLayout from './layouts/MainLayout';

const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Quotations = React.lazy(() => import('./pages/Quotations'));
const QuotationDetail = React.lazy(() => import('./pages/QuotationDetail'));
const Orders = React.lazy(() => import('./pages/Orders'));
const OrderDetail = React.lazy(() => import('./pages/OrderDetail'));
const Cost = React.lazy(() => import('./pages/Cost'));
const Billing = React.lazy(() => import('./pages/Billing'));
const Erp = React.lazy(() => import('./pages/Erp'));
const Settings = React.lazy(() => import('./pages/Settings'));

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function Router() {
  return (
    <React.Suspense fallback={<div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}><Spin size="large" /></div>}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><MainLayout /></PrivateRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="quotations" element={<Quotations />} />
          <Route path="quotations/:id" element={<QuotationDetail />} />
          <Route path="orders" element={<Orders />} />
          <Route path="orders/:id" element={<OrderDetail />} />
          <Route path="cost" element={<Cost />} />
          <Route path="billing" element={<Billing />} />
          <Route path="erp" element={<Erp />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </React.Suspense>
  );
}
