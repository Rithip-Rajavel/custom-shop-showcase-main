import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import { ProtectedRoute } from "./components/auth/ProtectedRoute";
import Login from "./pages/Login";
import Index from "./pages/Index";
import Billing from "./pages/Billing";
import Quotations from "./pages/Quotations";
import Products from "./pages/Products";
import Customers from "./pages/Customers";
import CustomerLedger from "./pages/CustomerLedger";
import ContractorBilling from "./pages/ContractorBilling";
import Returns from "./pages/Returns";
import Invoices from "./pages/Invoices";
import EbayBill from "./pages/EbayBill";
import EbayBillPreview from "./pages/EbayBillPreview";
import GstBill from "./pages/GstBill";
import GstBillPreview from "./pages/GSTBillPreview";
import GstBillList from "./pages/GstBillList";
import EwayBillList from "./pages/EwayBillList";
import EwayBillPreview from "./pages/EwayBillPreview";
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
        <SettingsProvider>
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
              <Route path="/quotations" element={
                <ProtectedRoute requiredPermission="billing">
                  <Quotations />
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
              <Route path="/contractor-billing" element={
                <ProtectedRoute requiredPermission="customers">
                  <ContractorBilling />
                </ProtectedRoute>
              } />
              <Route path="/returns" element={
                <ProtectedRoute requiredPermission="invoices">
                  <Returns />
                </ProtectedRoute>
              } />
              <Route path="/invoices" element={
                <ProtectedRoute requiredPermission="invoices">
                  <Invoices />
                </ProtectedRoute>
              } />
              <Route path="/gst-bills" element={
                <ProtectedRoute requiredPermission="invoices">
                  <GstBillList />
                </ProtectedRoute>
              } />
              <Route path="/eway-bills" element={
                <ProtectedRoute requiredPermission="invoices">
                  <EwayBillList />
                </ProtectedRoute>
              } />
              <Route path="/invoices/:invoiceId/eway-bill/preview/:mode" element={
                <ProtectedRoute requiredPermission="invoices">
                  <EwayBillPreview />
                </ProtectedRoute>
              } />
              <Route path="/invoices/:invoiceId/ebay-bill" element={
                <ProtectedRoute requiredPermission="invoices">
                  <EbayBill />
                </ProtectedRoute>
              } />
              <Route path="/invoices/:invoiceId/ebay-bill/preview/:mode" element={
                <ProtectedRoute requiredPermission="invoices">
                  <EbayBillPreview />
                </ProtectedRoute>
              } />
              <Route path="/invoices/:invoiceId/gst-bill" element={
                <ProtectedRoute requiredPermission="invoices">
                  <GstBill />
                </ProtectedRoute>
              } />
              <Route path="/invoices/:invoiceId/gst-bill/preview/:mode" element={
                <ProtectedRoute requiredPermission="invoices">
                  <GstBillPreview />
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
        </SettingsProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
