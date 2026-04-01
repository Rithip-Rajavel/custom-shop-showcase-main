import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Billing from "./pages/Billing";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import CustomerLedger from "./pages/CustomerLedger";
import Invoices from "./pages/Invoices";
import Employees from "./pages/Employees";
import Attendance from "./pages/Attendance";
import EmployeeAttendance from "./pages/EmployeeAttendance";
import UserManagement from "./pages/UserManagement";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute requiredPermission="dashboard">
                <Index />
              </ProtectedRoute>
            } />
            <Route path="/billing" element={
              <ProtectedRoute requiredPermission="billing">
                <Billing />
              </ProtectedRoute>
            } />
            <Route path="/products" element={
              <ProtectedRoute requiredPermission="products">
                <Products />
              </ProtectedRoute>
            } />
            <Route path="/customers" element={
              <ProtectedRoute requiredPermission="customers">
                <Customers />
              </ProtectedRoute>
            } />
            <Route path="/customers/:customerId" element={
              <ProtectedRoute requiredPermission="customers">
                <CustomerLedger />
              </ProtectedRoute>
            } />
            <Route path="/invoices" element={
              <ProtectedRoute requiredPermission="invoices">
                <Invoices />
              </ProtectedRoute>
            } />
            <Route path="/employees" element={
              <ProtectedRoute requiredPermission="employees">
                <Employees />
              </ProtectedRoute>
            } />
            <Route path="/attendance" element={
              <ProtectedRoute requiredPermission="attendance">
                <Attendance />
              </ProtectedRoute>
            } />
            <Route path="/employee-attendance" element={
              <ProtectedRoute requiredPermission="attendance">
                <EmployeeAttendance />
              </ProtectedRoute>
            } />
            <Route path="/users" element={
              <ProtectedRoute requiredPermission="admin">
                <UserManagement />
              </ProtectedRoute>
            } />
            <Route path="/reports" element={
              <ProtectedRoute requiredPermission="reports">
                <Reports />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute requiredPermission="settings">
                <Settings />
              </ProtectedRoute>
            } />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
