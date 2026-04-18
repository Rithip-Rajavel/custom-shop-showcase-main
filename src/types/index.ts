export interface Product {
  id: string;
  name: string;
  code: string;
  barcode: string;
  originalAmount: number; // Cost price - what we pay to get the product
  sellingAmount: number; // Selling price - what customers pay
  price: number;
  stock: number;
  unit: string;
  gstPercentage: number;
  category: string;
  description?: string;
  // Glass/area-based pricing
  pricingType?: 'standard' | 'per_sqft' | 'per_rft';
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  address?: string;
  city?: string;
  type: 'customer' | 'contractor';
  contractorId?: string; // For customers linked to a contractor
  isActive?: boolean;
  lastPaymentDate?: string;
  lastInvoiceDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRequest {
  name: string;
  phone: string;
  email?: string;
  address?: string;
  type: 'customer' | 'contractor';
  contractorId?: string; // For customers linked to a contractor
}

export interface CustomerFilter {
  type?: 'customer' | 'contractor';
  search?: string;
  contractorId?: string;
}

export interface BillItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  quantity: number;
  price: number;
  originalPrice: number;
  lastPurchasedPrice?: number;
  gstPercentage: number;
  withTax: boolean;
  gstAmount: number;
  discount: number;
  discountPercentage: number;
  subtotal: number;
  total: number;
  customTotal?: number; // Owner can override total after bargaining
  // Glass/area-based fields
  pricingType?: 'standard' | 'per_sqft' | 'per_rft';
  height?: number;
  width?: number;
  area?: number;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerType: 'customer' | 'contractor';
  endCustomerName?: string;
  commission?: number;
  // Contractor fields for contractor buying for customer scenario
  contractorId?: string;
  contractorName?: string;
  items: BillItem[];
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
  amountPaid: number;
  balance: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'credit';
  status: 'paid' | 'pending' | 'cancelled';
  billType?: 'rough' | 'final_bill';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShopSettings {
  name: string;
  address: string;
  phone: string;
  email?: string;
  gstNumber?: string;
  bankName?: string;
  accountNumber?: string;
  ifscCode?: string;
  upiId?: string;
  defaultGstPercentage: number;
  invoicePrefix: string;
  termsAndConditions?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type PaymentMethod = 'cash' | 'card' | 'upi' | 'credit';

export interface PaymentTransaction {
  id: string;
  customerId: string;
  customerName: string;
  invoiceId?: string;
  invoiceNumber?: string;
  type: 'billing' | 'payment';
  amount: number;
  balanceAfter: number;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdAt: string;
}

// Price mapping: stores last purchased price per customer/contractor per product
export interface PriceMapping {
  id?: string;
  customerId: string;
  productId: string;
  lastPrice: number;
  updatedAt: string;
}

// Commission record
export interface CommissionRecord {
  id: string;
  contractorId: string;
  contractorName: string;
  invoiceId: string;
  invoiceNumber: string;
  endCustomerName: string;
  amount: number;
  createdAt: string;
}

// Employee management
export interface Employee {
  id: string;
  name: string;
  code: string;
  phone: string;
  email: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  monthlySalary: number;
  createdAt: string;
  updatedAt: string;
  active: boolean;
}

export interface EmployeeRequest {
  name: string;
  code: string;
  phone: string;
  email: string;
  designation: string;
  department: string;
  dateOfJoining: string;
  monthlySalary: number;
}

// Attendance management
export interface Attendance {
  id: string;
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  attendanceDate: string;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';
  checkInTime?: {
    hour: number;
    minute: number;
    second: number;
    nano: number;
  };
  checkOutTime?: {
    hour: number;
    minute: number;
    second: number;
    nano: number;
  };
  notes?: string;
  createdAt: string;
}

export interface AttendanceRequest {
  employeeId: string;
  attendanceDate: string;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';
  checkInTime?: string;
  checkOutTime?: string;
  notes?: string;
}

// Payroll summary
export interface PayrollSummary {
  employeeId: string;
  employeeName: string;
  employeeCode: string;
  year: number;
  month: number;
  totalWorkingDays: number;
  presentDays: number;
  absentDays: number;
  halfDays: number;
  leaveDays: number;
  holidayDays: number;
  allowedLeaves?: number; // Number of allowed leaves for the month
  monthlySalary: number;
  perDaySalary: number;
  lossOfPayDays: number;
  lossOfPayAmount: number;
  netPayableSalary: number;
  attendanceDetails: Attendance[];
}

// Last Payment Value - tracks customer-specific pricing
export interface LastPaymentValue {
  id: string;
  customerId: string;
  productId: string;
  productName: string;
  productCode: string;
  lastAmount: number;
  lastQuantity: number;
  lastUnitPrice: number;
  createdAt: string;
  updatedAt: string;
}

export interface LastPaymentValueRequest {
  customerId: string;
  productId: string;
  lastAmount: number;
  lastQuantity: number;
  lastUnitPrice: number;
}

// Quotation types
export interface QuotationItem {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  unitPrice: number;
  quantity: number;
  unit: string;
  gstPercentage: number;
  discount: number;
  description?: string;
}

export interface Quotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerType: 'customer' | 'contractor';
  endCustomerName?: string;
  commission?: number;
  // Contractor fields for contractor buying for customer scenario
  contractorId?: string;
  contractorName?: string;
  items: QuotationItem[];
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
  validUntil: string;
  status: 'pending' | 'confirmed' | 'converted' | 'cancelled';
  notes?: string;
  termsConditions?: string;
  createdAt: string;
  updatedAt: string;
  convertedAt?: string;
  convertedToInvoiceId?: string;
}

export interface CreateQuotationRequest {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerType: 'customer' | 'contractor';
  endCustomerName?: string;
  commission?: number;
  // Contractor fields for contractor buying for customer scenario
  contractorId?: string;
  contractorName?: string;
  items: QuotationItem[];
  validUntil: string;
  notes?: string;
  termsConditions?: string;
}

export interface UpdateQuotationRequest extends CreateQuotationRequest {
  id: string;
}

export interface QuotationFilter {
  customerId?: string;
  status?: 'pending' | 'confirmed' | 'converted' | 'cancelled';
  fromDate?: string;
  toDate?: string;
  search?: string;
}

// Invoice Request types
export interface CreateInvoiceRequest {
  customerId: string;
  customerName: string;
  customerPhone: string;
  customerType: 'customer' | 'contractor';
  endCustomerName?: string;
  contractorId?: string;
  contractorName?: string;
  commission?: number;
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
  amountPaid: number;
  balance: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'credit';
  status: 'paid' | 'pending' | 'cancelled';
  billType?: 'rough' | 'final_bill';
  notes?: string;
  items: BillItem[];
}

export interface UpdateInvoiceRequest extends CreateInvoiceRequest {
  id: string;
}

export interface InvoiceFilter {
  customerId?: string;
  status?: 'paid' | 'pending' | 'cancelled';
  billType?: 'rough' | 'final_bill';
  fromDate?: string;
  toDate?: string;
  search?: string;
}

// Product Audit types
export type AuditAction = 'PRODUCT_CREATED' | 'STOCK_INCREASED' | 'STOCK_DECREASED' | 'PRICE_UPDATED' | 'STOCK_AND_PRICE_UPDATED';

export interface ProductAudit {
  id: string;
  productId: string;
  productName: string;
  productCode: string;
  action: AuditAction;
  oldStock?: number;
  newStock?: number;
  stockChange?: number;
  cashAmount?: number;
  oldPrice?: number;
  newPrice?: number;
  priceChange?: number;
  performedBy?: string;
  performedByName?: string;
  notes?: string;
  createdAt: string;
}

export interface UpdateStockRequest {
  quantity: number;
  operation: 'add' | 'subtract';
  cashAmount?: number;
  notes?: string;
}

export interface UpdatePriceRequest {
  newPrice: number;
  notes?: string;
}
