import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/layout/ProtectedRoute";
import AppLayout from "./components/layout/AppLayout";

import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import VerifyOtp from "./pages/auth/VerifyOtp";
import ForgotPassword from "./pages/auth/ForgotPassword";

import CustomerDashboard from "./pages/customer/CustomerDashboard";
import CustomerProfile from "./pages/customer/CustomerProfile";
import BrowsePlans from "./pages/customer/BrowsePlans";
import MyPolicies from "./pages/customer/MyPolicies";
import MyClaims from "./pages/customer/MyClaims";
import FileClaim from "./pages/customer/FileClaim";
import ClaimDetail from "./pages/customer/ClaimDetail";

import AgentDashboard from "./pages/agent/AgentDashboard";
import AgentClaims from "./pages/agent/AgentClaims";
import AgentClaimDetail from "./pages/agent/AgentClaimDetail";
import AllPolicies from "./pages/agent/AllPolicies";
import AllPayments from "./pages/agent/AllPayments";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminProducts from "./pages/admin/AdminProducts";
import AdminPlans from "./pages/admin/AdminPlans";
import AdminClaims from "./pages/admin/AdminClaims";
import AdminClaimDecide from "./pages/admin/AdminClaimDecide";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminBusinessTools from "./pages/admin/AdminBusinessTools";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/verify-otp" element={<VerifyOtp />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Authenticated shell - Navbar + Sidebar + nested role pages */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            {/* Customer */}
            <Route
              path="/customer/dashboard"
              element={
                <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                  <CustomerDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/profile"
              element={
                <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                  <CustomerProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/plans"
              element={
                <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                  <BrowsePlans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/policies"
              element={
                <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                  <MyPolicies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/claims"
              element={
                <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                  <MyClaims />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/claims/new"
              element={
                <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                  <FileClaim />
                </ProtectedRoute>
              }
            />
            <Route
              path="/customer/claims/:claimId"
              element={
                <ProtectedRoute allowedRoles={["CUSTOMER"]}>
                  <ClaimDetail />
                </ProtectedRoute>
              }
            />

            {/* Agent */}
            <Route
              path="/agent/dashboard"
              element={
                <ProtectedRoute allowedRoles={["AGENT"]}>
                  <AgentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/claims"
              element={
                <ProtectedRoute allowedRoles={["AGENT"]}>
                  <AgentClaims />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/claims/:claimId"
              element={
                <ProtectedRoute allowedRoles={["AGENT"]}>
                  <AgentClaimDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/policies"
              element={
                <ProtectedRoute allowedRoles={["AGENT"]}>
                  <AllPolicies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/agent/payments"
              element={
                <ProtectedRoute allowedRoles={["AGENT"]}>
                  <AllPayments />
                </ProtectedRoute>
              }
            />

            {/* Admin */}
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/products"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminProducts />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/plans"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminPlans />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/policies"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AllPolicies />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/claims"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminClaims />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/claims/:claimId"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminClaimDecide />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/payments"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AllPayments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/users"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/business-tools"
              element={
                <ProtectedRoute allowedRoles={["ADMIN"]}>
                  <AdminBusinessTools />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
