# Backend API Documentation - Custom Shop Management System

## Overview

This document provides comprehensive API specifications for the Custom Shop Management System based on the localStorage implementation in the frontend. The system handles hardware shop operations including billing, customer management, inventory, and financial tracking.

## Core Business Concepts

### Customer Types
1. **Regular Customer** - Direct end customers who purchase for personal use
2. **Contractor** - Business customers who purchase for their clients (end customers)
3. **Walk-in Customer** - Default anonymous customer (id: 'walk-in')

### Billing Flow
1. **Rough Bill** - Draft invoice saved as pending, allows price modifications
2. **Final Bill** - Confirmed invoice with stock updates and payment processing
3. **Credit Management** - Track pending balances with FIFO payment application

### Special Pricing
- **Standard Products** - Regular unit-based pricing
- **Area-based Products** - Glass/Plywood priced per sqft or per rft
- **Customer-specific Pricing** - Remember last purchased price per customer

---

## API Endpoints

## 1. Authentication API

### POST /api/auth/login
**Purpose**: Authenticate user and return JWT token
```json
{
  "email": "admin@shivahardwares.com",
  "password": "admin123"
}
```
**Response**:
```json
{
  "success": true,
  "user": {
    "id": "admin-1",
    "name": "Administrator",
    "email": "admin@shivahardwares.com",
    "role": "admin"
  },
  "token": "jwt_token_here",
  "permissions": ["dashboard", "billing", "products", "customers", "invoices", "reports", "admin", "settings"]
}
```

### POST /api/auth/logout
**Purpose**: Invalidate user session
**Headers**: `Authorization: Bearer <token>`

### GET /api/auth/me
**Purpose**: Get current authenticated user
**Headers**: `Authorization: Bearer <token>`

---

## 2. User Management API

### GET /api/users
**Purpose**: Get all users (admin only)
**Response**: `User[]`

### POST /api/users
**Purpose**: Create new user (admin only)
```json
{
  "name": "Staff Member",
  "email": "staff@shivahardwares.com",
  "password": "staff123",
  "role": "staff",
  "phone": "9876543210"
}
```

### PUT /api/users/:id
**Purpose**: Update user details
**Body**: Partial user object

### DELETE /api/users/:id
**Purpose**: Delete user (admin only)

---

## 3. Customer Management API

### GET /api/customers
**Purpose**: Get all customers
**Query Parameters**:
- `type`: Filter by 'customer' or 'contractor'
- `search`: Search by name or phone
**Response**: `Customer[]`

### POST /api/customers
**Purpose**: Add new customer
```json
{
  "name": "John Doe",
  "phone": "9876543210",
  "email": "john@example.com",
  "address": "123 Main St",
  "type": "customer"
}
```

### GET /api/customers/:id
**Purpose**: Get customer by ID
**Response**: `Customer`

### PUT /api/customers/:id
**Purpose**: Update customer details

### DELETE /api/customers/:id
**Purpose**: Delete customer (cannot delete walk-in)

### GET /api/customers/:id/balance
**Purpose**: Get customer balance summary
**Response**:
```json
{
  "totalBilled": 15000,
  "totalPaid": 10000,
  "pendingBalance": 5000,
  "invoiceCount": 5
}
```

---

## 4. Product Management API

### GET /api/products
**Purpose**: Get all products
**Query Parameters**:
- `category`: Filter by category
- `search`: Search by name, code, or barcode
- `lowStock`: Set to 'true' to get low stock items (stock <= 5)
**Response**: `Product[]`

### POST /api/products
**Purpose**: Add new product
```json
{
  "name": "Door Hinges (Stainless Steel)",
  "code": "HNG001",
  "barcode": "8901234567890",
  "price": 150,
  "stock": 50,
  "unit": "pair",
  "gstPercentage": 18,
  "category": "Hardware",
  "description": "Premium stainless steel door hinges",
  "pricingType": "standard"
}
```

### GET /api/products/:id
**Purpose**: Get product by ID

### PUT /api/products/:id
**Purpose**: Update product details

### DELETE /api/products/:id
**Purpose**: Delete product

### PUT /api/products/:id/stock
**Purpose**: Update product stock (used during billing)
```json
{
  "quantity": 5,
  "operation": "subtract" // or "add"
}
```

### GET /api/products/search
**Purpose**: Search products by code or barcode
**Query**: `q=HNG001`

---

## 5. Invoice & Billing API

### GET /api/invoices
**Purpose**: Get all invoices
**Query Parameters**:
- `customerId`: Filter by customer
- `status`: Filter by 'paid', 'pending', 'cancelled'
- `billType`: Filter by 'rough', 'final'
- `fromDate`: Filter from date
- `toDate`: Filter to date
- `search`: Search by invoice number or customer name
**Response**: `Invoice[]`

### POST /api/invoices
**Purpose**: Create new invoice (final bill)
```json
{
  "customerId": "customer-123",
  "customerName": "John Doe",
  "customerPhone": "9876543210",
  "customerType": "customer",
  "endCustomerName": "Rahul", // Only for contractors
  "commission": 500, // Only for contractors
  "items": [
    {
      "productId": "product-123",
      "productName": "Door Hinges",
      "productCode": "HNG001",
      "quantity": 2,
      "price": 150,
      "originalPrice": 150,
      "lastPurchasedPrice": 145,
      "gstPercentage": 18,
      "withTax": true,
      "gstAmount": 54,
      "discount": 0,
      "discountPercentage": 0,
      "subtotal": 300,
      "total": 354,
      "customTotal": 340, // Owner can override after bargaining
      "pricingType": "standard",
      "height": null,
      "width": null,
      "area": null
    }
  ],
  "subtotal": 300,
  "totalDiscount": 0,
  "totalGst": 54,
  "grandTotal": 354,
  "amountPaid": 354,
  "balance": 0,
  "paymentMethod": "cash",
  "status": "paid",
  "billType": "final",
  "notes": "Customer requested discount"
}
```

### GET /api/invoices/:id
**Purpose**: Get invoice by ID

### PUT /api/invoices/:id
**Purpose**: Update invoice (limited fields allowed)

### DELETE /api/invoices/:id
**Purpose**: Cancel/delete invoice

### GET /api/invoices/next-number
**Purpose**: Get next invoice number
**Query**: `prefix=INV`
**Response**: `INV25010001`

### POST /api/invoices/:id/pay
**Purpose**: Apply payment to invoice
```json
{
  "amount": 500,
  "paymentMethod": "cash",
  "notes": "Partial payment"
}
```

### GET /api/invoices/stats
**Purpose**: Get invoice statistics
**Query Parameters**:
- `period`: 'today', 'week', 'month', 'year'
**Response**:
```json
{
  "totalInvoices": 150,
  "todayInvoices": 5,
  "todayRevenue": 15000,
  "monthlyRevenue": 250000,
  "pendingAmount": 45000
}
```

---

## 6. Payment Transactions API

### GET /api/payments
**Purpose**: Get all payment transactions
**Query Parameters**:
- `customerId`: Filter by customer
- `type`: Filter by 'billing', 'payment'
- `fromDate`: Filter from date
- `toDate`: Filter to date
**Response**: `PaymentTransaction[]`

### POST /api/payments
**Purpose**: Record payment transaction
```json
{
  "customerId": "customer-123",
  "customerName": "John Doe",
  "invoiceId": "invoice-123",
  "invoiceNumber": "INV25010001",
  "type": "payment",
  "amount": 500,
  "balanceAfter": 2000,
  "paymentMethod": "cash",
  "notes": "Partial payment for invoice"
}
```

### GET /api/payments/customer/:customerId
**Purpose**: Get customer payment history
**Response**: `PaymentTransaction[]`

### DELETE /api/payments/:id
**Purpose**: Delete payment transaction

---

## 7. Price Mapping API

### GET /api/pricing/customer/:customerId
**Purpose**: Get customer-specific pricing
**Response**: `PriceMapping[]`

### POST /api/pricing
**Purpose**: Update price mapping
```json
{
  "customerId": "customer-123",
  "productId": "product-123",
  "lastPrice": 145
}
```

### PUT /api/pricing/:id
**Purpose**: Update existing price mapping

### DELETE /api/pricing/:id
**Purpose**: Delete price mapping

---

## 8. Commission API

### GET /api/commissions
**Purpose**: Get all commission records
**Query Parameters**:
- `contractorId`: Filter by contractor
- `fromDate`: Filter from date
- `toDate`: Filter to date
**Response**: `CommissionRecord[]`

### POST /api/commissions
**Purpose**: Add commission record
```json
{
  "contractorId": "contractor-123",
  "contractorName": "ABC Contractors",
  "invoiceId": "invoice-123",
  "invoiceNumber": "INV25010001",
  "endCustomerName": "Rahul",
  "amount": 500
}
```

### GET /api/commissions/contractor/:contractorId
**Purpose**: Get contractor commission history
**Response**: `CommissionRecord[]`

### GET /api/commissions/contractor/:contractorId/total
**Purpose**: Get total commission for contractor
**Response**: `{ "total": 5000 }`

---

## 9. Pending Bills API

### GET /api/pending-bills
**Purpose**: Get all pending bills (rough drafts)
**Response**: `PendingBill[]`

### POST /api/pending-bills
**Purpose**: Save pending bill
```json
{
  "items": [...], // BillItem array
  "customerId": "customer-123",
  "customerName": "John Doe",
  "customerType": "customer",
  "paymentMethod": "cash",
  "billDiscount": 50,
  "amountPaid": 0,
  "endCustomerName": "",
  "commission": 0,
  "notes": "Will complete tomorrow"
}
```

### GET /api/pending-bills/:id
**Purpose**: Get pending bill by ID

### PUT /api/pending-bills/:id
**Purpose**: Update pending bill

### DELETE /api/pending-bills/:id
**Purpose**: Delete pending bill

---

## 10. Settings API

### GET /api/settings
**Purpose**: Get shop settings
**Response**: `ShopSettings`

### PUT /api/settings
**Purpose**: Update shop settings
```json
{
  "name": "Sri Sai Shiva Hardwares",
  "address": "No 121/12, Tirupattur Main Road...",
  "phone": "9876543210",
  "email": "info@shivahardwares.com",
  "gstNumber": "33AABCS1234C1ZV",
  "bankName": "State Bank of India",
  "accountNumber": "1234567890",
  "ifscCode": "SBIN0001234",
  "upiId": "shivahardwares@paytm",
  "defaultGstPercentage": 18,
  "invoicePrefix": "INV",
  "termsAndConditions": "Goods once sold will not be taken back..."
}
```

---

## 11. Reports API

### GET /api/reports/sales
**Purpose**: Get sales report
**Query Parameters**:
- `period`: 'today', 'week', 'month', 'year'
- `customerId`: Filter by customer
- `category`: Filter by product category
**Response**:
```json
{
  "summary": {
    "totalRevenue": 500000,
    "totalInvoices": 150,
    "averageInvoiceValue": 3333,
    "totalDiscount": 15000
  },
  "byCategory": [
    {
      "category": "Hardware",
      "revenue": 200000,
      "quantity": 500
    }
  ],
  "byCustomer": [
    {
      "customerName": "John Doe",
      "revenue": 50000,
      "invoiceCount": 15
    }
  ]
}
```

### GET /api/reports/ledger/:customerId
**Purpose**: Get customer ledger
**Response**:
```json
{
  "customer": { ... },
  "balance": { ... },
  "transactions": [...],
  "invoices": [...],
  "commissions": [...]
}
```

### GET /api/reports/inventory
**Purpose**: Get inventory report
**Query Parameters**:
- `lowStock`: Set to 'true' for low stock items
- `category`: Filter by category
**Response**:
```json
{
  "summary": {
    "totalProducts": 500,
    "totalStockValue": 1000000,
    "lowStockCount": 25
  },
  "products": [...]
}
```

### GET /api/reports/commissions
**Purpose**: Get commission report
**Query Parameters**:
- `contractorId`: Filter by contractor
- `fromDate`: Filter from date
- `toDate`: Filter to date
**Response**:
```json
{
  "summary": {
    "totalCommission": 25000,
    "contractorCount": 10
  },
  "byContractor": [...]
}
```

---

## Database Schema

### Core Tables

#### users
```sql
CREATE TABLE users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  role ENUM('admin', 'staff') NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### customers
```sql
CREATE TABLE customers (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  address TEXT,
  type ENUM('customer', 'contractor') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### products
```sql
CREATE TABLE products (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  barcode VARCHAR(50),
  price DECIMAL(10,2) NOT NULL,
  stock INT DEFAULT 0,
  unit VARCHAR(20) NOT NULL,
  gst_percentage DECIMAL(5,2) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  pricing_type ENUM('standard', 'per_sqft', 'per_rft') DEFAULT 'standard',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### invoices
```sql
CREATE TABLE invoices (
  id VARCHAR(50) PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  customer_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_type ENUM('customer', 'contractor') NOT NULL,
  end_customer_name VARCHAR(255),
  commission DECIMAL(10,2),
  subtotal DECIMAL(10,2) NOT NULL,
  total_discount DECIMAL(10,2) DEFAULT 0,
  total_gst DECIMAL(10,2) NOT NULL,
  grand_total DECIMAL(10,2) NOT NULL,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) DEFAULT 0,
  payment_method ENUM('cash', 'card', 'upi', 'credit') NOT NULL,
  status ENUM('paid', 'pending', 'cancelled') DEFAULT 'pending',
  bill_type ENUM('rough', 'final') DEFAULT 'final',
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

#### invoice_items
```sql
CREATE TABLE invoice_items (
  id VARCHAR(50) PRIMARY KEY,
  invoice_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  product_name VARCHAR(255) NOT NULL,
  product_code VARCHAR(50) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) NOT NULL,
  last_purchased_price DECIMAL(10,2),
  gst_percentage DECIMAL(5,2) NOT NULL,
  with_tax BOOLEAN DEFAULT true,
  gst_amount DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  discount_percentage DECIMAL(5,2) DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  custom_total DECIMAL(10,2),
  pricing_type ENUM('standard', 'per_sqft', 'per_rft') DEFAULT 'standard',
  height DECIMAL(10,2),
  width DECIMAL(10,2),
  area DECIMAL(10,2),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### payments
```sql
CREATE TABLE payments (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  invoice_id VARCHAR(50),
  invoice_number VARCHAR(50),
  type ENUM('billing', 'payment') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  balance_after DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash', 'card', 'upi', 'credit') NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
```

#### price_mapping
```sql
CREATE TABLE price_mapping (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL,
  product_id VARCHAR(50) NOT NULL,
  last_price DECIMAL(10,2) NOT NULL,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_customer_product (customer_id, product_id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (product_id) REFERENCES products(id)
);
```

#### commissions
```sql
CREATE TABLE commissions (
  id VARCHAR(50) PRIMARY KEY,
  contractor_id VARCHAR(50) NOT NULL,
  contractor_name VARCHAR(255) NOT NULL,
  invoice_id VARCHAR(50) NOT NULL,
  invoice_number VARCHAR(50) NOT NULL,
  end_customer_name VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES customers(id),
  FOREIGN KEY (invoice_id) REFERENCES invoices(id)
);
```

#### pending_bills
```sql
CREATE TABLE pending_bills (
  id VARCHAR(50) PRIMARY KEY,
  customer_id VARCHAR(50) NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_type ENUM('customer', 'contractor') NOT NULL,
  payment_method ENUM('cash', 'card', 'upi', 'credit') NOT NULL,
  bill_discount DECIMAL(10,2) DEFAULT 0,
  amount_paid DECIMAL(10,2) DEFAULT 0,
  end_customer_name VARCHAR(255),
  commission DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES customers(id)
);
```

#### pending_bill_items
```sql
CREATE TABLE pending_bill_items (
  id VARCHAR(50) PRIMARY KEY,
  pending_bill_id VARCHAR(50) NOT NULL,
  -- Same structure as invoice_items
  FOREIGN KEY (pending_bill_id) REFERENCES pending_bills(id) ON DELETE CASCADE
);
```

#### settings
```sql
CREATE TABLE settings (
  id INT PRIMARY KEY DEFAULT 1,
  name VARCHAR(255) NOT NULL,
  address TEXT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  gst_number VARCHAR(50),
  bank_name VARCHAR(255),
  account_number VARCHAR(50),
  ifsc_code VARCHAR(20),
  upi_id VARCHAR(100),
  default_gst_percentage DECIMAL(5,2) DEFAULT 18,
  invoice_prefix VARCHAR(10) DEFAULT 'INV',
  terms_and_conditions TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

#### audit_logs
```sql
CREATE TABLE audit_logs (
  id VARCHAR(50) PRIMARY KEY,
  user_id VARCHAR(50),
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id VARCHAR(50),
  old_data JSON,
  new_data JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
```

---

## Business Logic Implementation

### 1. Invoice Number Generation
```javascript
function generateInvoiceNumber(prefix = 'INV') {
  const date = new Date();
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const counter = getNextCounter(); // Get from database counter
  const number = counter.toString().padStart(4, '0');
  return `${prefix}${year}${month}${number}`;
}
```

### 2. FIFO Payment Application
```javascript
function applyPaymentToInvoices(customerId, paymentAmount) {
  const pendingInvoices = getPendingInvoices(customerId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  
  let remainingPayment = paymentAmount;
  
  for (const invoice of pendingInvoices) {
    if (remainingPayment <= 0) break;
    
    const currentBalance = invoice.balance;
    const paymentForThisInvoice = Math.min(remainingPayment, currentBalance);
    const newBalance = currentBalance - paymentForThisInvoice;
    
    updateInvoice(invoice.id, {
      amountPaid: invoice.amountPaid + paymentForThisInvoice,
      balance: newBalance,
      status: newBalance <= 0 ? 'paid' : 'pending'
    });
    
    remainingPayment -= paymentForThisInvoice;
  }
  
  return remainingPayment; // Return excess payment
}
```

### 3. Area-based Pricing Calculation
```javascript
function calculateItemTotal(item) {
  if (item.pricingType === 'per_sqft' && item.height && item.width) {
    const area = item.height * item.width;
    return item.quantity * area * item.price;
  }
  if (item.pricingType === 'per_rft' && item.height && item.width) {
    const runningFeet = item.height + item.width;
    return item.quantity * runningFeet * item.price;
  }
  return item.quantity * item.price;
}
```

### 4. GST Calculation
```javascript
function calculateGST(baseAmount, gstPercentage, withTax) {
  if (!withTax) return 0;
  return (baseAmount * gstPercentage) / 100;
}
```

---

## Security & Validation

### Authentication
- JWT tokens with expiration
- Role-based access control
- Password hashing with bcrypt

### Input Validation
- All monetary values: positive numbers, 2 decimal places
- Phone numbers: Indian format validation
- Email: standard email validation
- GST numbers: Indian GST format validation

### Business Rules
- Stock cannot go negative
- Invoice numbers must be unique
- Walk-in customer cannot be deleted
- Payment amount cannot exceed balance
- Commission only for contractors

### Error Handling
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input data",
    "details": {
      "field": "price",
      "message": "Price must be greater than 0"
    }
  }
}
```

---

## Performance Considerations

### Database Indexing
```sql
CREATE INDEX idx_invoices_customer ON invoices(customer_id);
CREATE INDEX idx_invoices_date ON invoices(created_at);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_price_mapping_customer_product ON price_mapping(customer_id, product_id);
```

### Pagination
```javascript
// GET /api/invoices?page=1&limit=50
const page = parseInt(req.query.page) || 1;
const limit = parseInt(req.query.limit) || 50;
const offset = (page - 1) * limit;
```

### Caching
- Product catalog (frequently accessed)
- Customer list (with TTL)
- Shop settings (rarely changes)

---

## Migration from localStorage

### Data Export Script
```javascript
// Export all localStorage data
const exportData = {
  customers: JSON.parse(localStorage.getItem('shiva-hardware-customers')),
  products: JSON.parse(localStorage.getItem('shiva-hardware-products')),
  invoices: JSON.parse(localStorage.getItem('shiva-hardware-invoices')),
  payments: JSON.parse(localStorage.getItem('shiva-hardware-payment-transactions')),
  // ... other collections
};
```

### Import Script
```javascript
// Import to database
async function importData(data) {
  for (const customer of data.customers) {
    await db.collection('customers').insertOne(customer);
  }
  // ... import other collections
}
```

This documentation provides a complete roadmap for implementing the backend API that matches the frontend localStorage implementation, including all business logic, data structures, and special features like contractor commissions and area-based pricing.
