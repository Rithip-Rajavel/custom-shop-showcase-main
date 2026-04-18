# Selva Hardware - Complete API Documentation

## Table of Contents
1. [Overview](#overview)
2. [Authentication](#authentication)
3. [Customer Management](#customer-management)
4. [Invoice & Billing](#invoice--billing)
5. [Invoice Audit Trail](#invoice-audit-trail)
6. [Invoice Returns (Written Bills)](#invoice-returns-written-bills)
7. [Overdue Bills](#overdue-bills)
8. [Contractor Management](#contractor-management)
9. [Payments](#payments)
10. [Products](#products)
11. [Commissions](#commissions)
12. [Reports](#reports)

---

## Overview

Base URL: `http://localhost:5090/selvahardware/api`

All APIs require Bearer token authentication except the login endpoint.

---

## Authentication

### Login
```http
POST /api/auth/login
```

**Request:**
```json
{
  "email": "admin@shivahardwares.com",
  "password": "admin123"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Administrator",
      "email": "admin@shivahardwares.com",
      "role": "admin"
    }
  },
  "message": "Login successful"
}
```

---

## Customer Management

### Get All Customers
```http
GET /api/customers
```

**Query Parameters:**
- `type` (optional): `customer` | `contractor`
- `search` (optional): Search by name or phone

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "John Doe",
      "phone": "9876543210",
      "email": "john@example.com",
      "address": "123 Main St",
      "city": "Chennai",
      "type": "customer",
      "isActive": true,
      "lastPaymentDate": "2024-01-15T10:30:00",
      "lastInvoiceDate": "2024-01-10T14:20:00",
      "contractorId": null,
      "createdAt": "2024-01-01T00:00:00",
      "updatedAt": "2024-01-15T10:30:00"
    }
  ]
}
```

### Create Customer
```http
POST /api/customers
```

**Request:**
```json
{
  "name": "Jane Smith",
  "phone": "9876543211",
  "email": "jane@example.com",
  "address": "456 Park Ave",
  "city": "Chennai",
  "type": "customer",
  "isActive": true
}
```

### Get Customer by ID
```http
GET /api/customers/{id}
```

### Update Customer
```http
PUT /api/customers/{id}
```

### Get Customer Balance
```http
GET /api/customers/{id}/balance
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalBilled": 50000.00,
    "totalPaid": 30000.00,
    "pendingBalance": 20000.00,
    "invoiceCount": 5
  }
}
```

### Get Customers by Contractor
```http
GET /api/customers/contractor/{contractorId}
```

---

## Invoice & Billing

### Get All Invoices
```http
GET /api/invoices
```

**Query Parameters:**
- `customerId` (optional)
- `status` (optional): `paid` | `pending` | `cancelled`
- `billType` (optional): `final_bill` | `quotation`
- `fromDate` (optional): Format `yyyy-MM-dd`
- `toDate` (optional): Format `yyyy-MM-dd`
- `search` (optional): Search by invoice number or customer name

### Create Invoice
```http
POST /api/invoices
```

**Request:**
```json
{
  "customerId": "550e8400-e29b-41d4-a716-446655440002",
  "customerName": "John Doe",
  "customerPhone": "9876543210",
  "customerType": "customer",
  "contractorId": null,
  "subtotal": 10000.00,
  "totalDiscount": 500.00,
  "totalGst": 1800.00,
  "grandTotal": 11300.00,
  "amountPaid": 3000.00,
  "balance": 8300.00,
  "paymentMethod": "cash",
  "billType": "final_bill",
  "items": [
    {
      "productId": "product-uuid",
      "productName": "Steel Rod",
      "quantity": 10,
      "price": 1000.00,
      "gstPercentage": 18.00,
      "withTax": true,
      "discount": 50.00
    }
  ]
}
```

### Get Invoice by ID
```http
GET /api/invoices/{id}
```

### Pay Invoice
```http
POST /api/invoices/{id}/pay
```

**Request:**
```json
{
  "amount": 5000.00,
  "paymentMethod": "cash",
  "notes": "Partial payment received"
}
```

### Delete Invoice
```http
DELETE /api/invoices/{id}
```

---

## Invoice Audit Trail

### Get Complete Audit Trail for Invoice
```http
GET /api/invoice-audit/invoice/{invoiceId}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "invoiceId": "inv-uuid",
    "invoiceNumber": "INV24010001",
    "customerId": "cust-uuid",
    "customerName": "John Doe",
    "customerPhone": "9876543210",
    "originalGrandTotal": 11300.00,
    "originalBalance": 8300.00,
    "currentStatus": "pending",
    "currentBalance": 3300.00,
    "totalPaid": 8000.00,
    "totalReturned": 0.00,
    "totalTransactions": 3,
    "totalPayments": 2,
    "totalReturns": 0,
    "totalOverdueEvents": 0,
    "timeline": [
      {
        "eventType": "INVOICE_CREATED",
        "description": "Invoice created with total: 11300.00",
        "amount": 11300.00,
        "balanceAfter": 8300.00,
        "notes": null,
        "createdBy": null,
        "timestamp": "2024-01-10T10:00:00"
      },
      {
        "eventType": "PAYMENT_RECEIVED",
        "description": "Payment received: 3000.00",
        "amount": 3000.00,
        "balanceAfter": 5300.00,
        "notes": "Partial payment",
        "createdBy": null,
        "timestamp": "2024-01-12T14:30:00"
      },
      {
        "eventType": "PAYMENT_RECEIVED",
        "description": "Payment received: 2000.00",
        "amount": 2000.00,
        "balanceAfter": 3300.00,
        "notes": "Second payment",
        "createdBy": null,
        "timestamp": "2024-01-15T11:00:00"
      }
    ],
    "paymentHistory": [
      {
        "paymentId": "pay-uuid-1",
        "amount": 3000.00,
        "paymentMethod": "cash",
        "notes": "Partial payment",
        "timestamp": "2024-01-12T14:30:00"
      },
      {
        "paymentId": "pay-uuid-2",
        "amount": 2000.00,
        "paymentMethod": "upi",
        "notes": "Second payment",
        "timestamp": "2024-01-15T11:00:00"
      }
    ],
    "returnHistory": []
  }
}
```

### Get Customer Audit Logs
```http
GET /api/invoice-audit/customer/{customerId}
```

### Get Overdue Payment Logs
```http
GET /api/invoice-audit/overdue-payments
```

---

## Invoice Returns (Written Bills)

### Get Returns by Invoice
```http
GET /api/invoice-returns/invoice/{invoiceId}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "ret-uuid",
      "returnNumber": "RET240115143000",
      "invoiceId": "inv-uuid",
      "invoiceNumber": "INV24010001",
      "customerId": "cust-uuid",
      "customerName": "John Doe",
      "totalReturnAmount": 2000.00,
      "totalReturnQuantity": 2.00,
      "status": "processed",
      "refundAmount": 2000.00,
      "refundMethod": "cash",
      "reason": "Wrong item delivered",
      "processedBy": "admin",
      "processedAt": "2024-01-15T14:35:00",
      "items": [
        {
          "id": "ret-item-uuid",
          "invoiceItemId": "inv-item-uuid",
          "productId": "prod-uuid",
          "productName": "Steel Rod",
          "productCode": "SR001",
          "quantity": 2.00,
          "price": 1000.00,
          "gstPercentage": 18.00,
          "gstAmount": 360.00,
          "discount": 100.00,
          "subtotal": 2000.00,
          "total": 2360.00,
          "reason": "Wrong size",
          "originalInvoiceQuantity": 10.00
        }
      ],
      "createdAt": "2024-01-15T14:30:00",
      "updatedAt": "2024-01-15T14:35:00"
    }
  ]
}
```

### Get Return by ID
```http
GET /api/invoice-returns/{returnId}
```

### Get Returns by Customer
```http
GET /api/invoice-returns/customer/{customerId}
```

### Create Return Request
```http
POST /api/invoice-returns
```

**Request:**
```json
{
  "invoiceId": "inv-uuid",
  "reason": "Wrong item delivered",
  "items": [
    {
      "invoiceItemId": "inv-item-uuid",
      "quantity": 2.00,
      "reason": "Wrong size"
    }
  ]
}
```

### Process Return
```http
POST /api/invoice-returns/{returnId}/process?refundMethod=cash&processedBy=admin
```

**Description:** Processes the return, updates stock, adjusts invoice balance

### Refund Return
```http
POST /api/invoice-returns/{returnId}/refund?refundMethod=cash&processedBy=admin
```

### Cancel Return
```http
DELETE /api/invoice-returns/{returnId}
```

### Get Total Returned Amount by Customer
```http
GET /api/invoice-returns/customer/{customerId}/total-returned
```

---

## Overdue Bills

### Get All Overdue Bills
```http
GET /api/overdue-bills
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "invoiceId": "inv-uuid",
      "invoiceNumber": "INV24010001",
      "customerId": "cust-uuid",
      "customerName": "John Doe",
      "customerPhone": "9876543210",
      "customerType": "customer",
      "grandTotal": 11300.00,
      "amountPaid": 3000.00,
      "balance": 8300.00,
      "totalDue": 8300.00,
      "invoiceDate": "2024-01-10T10:00:00",
      "dueDate": "2024-02-09T10:00:00",
      "daysOverdue": 15,
      "invoiceStatus": "pending",
      "isOverdue": true,
      "overdueAmount": 8300.00,
      "lastPaymentDate": "2024-01-12T14:30:00",
      "lastPaymentAmount": 3000.00,
      "contractorId": null,
      "contractorName": null,
      "totalOverdueInvoicesForCustomer": 2,
      "totalOverdueAmountForCustomer": 15300.00
    }
  ]
}
```

### Get Overdue Summary (Dashboard)
```http
GET /api/overdue-bills/summary
```

**Response:**
```json
{
  "success": true,
  "data": {
    "totalOverdueInvoices": 25,
    "totalOverdueAmount": 150000.00,
    "totalCustomersWithOverdue": 15,
    "totalContractorsWithOverdue": 5,
    "invoicesOverdue1To30Days": 10,
    "invoicesOverdue31To60Days": 8,
    "invoicesOverdue61To90Days": 4,
    "invoicesOverdueMoreThan90Days": 3,
    "amountOverdue1To30Days": 50000.00,
    "amountOverdue31To60Days": 60000.00,
    "amountOverdue61To90Days": 25000.00,
    "amountOverdueMoreThan90Days": 15000.00,
    "topOverdueInvoices": [...],
    "customersWithMostOverdue": [
      {
        "customerId": "cust-uuid",
        "customerName": "John Doe",
        "customerPhone": "9876543210",
        "overdueInvoiceCount": 3,
        "totalOverdueAmount": 25000.00,
        "maxDaysOverdue": 45
      }
    ]
  }
}
```

### Get Overdue Bills by Customer
```http
GET /api/overdue-bills/customer/{customerId}
```

### Check and Mark Invoice as Overdue
```http
POST /api/overdue-bills/check/{invoiceId}
```

---

## Contractor Management

### Get Contractor Pending Bills
```http
GET /api/contractors/{contractorId}/pending-bills
```

**Response:**
```json
{
  "success": true,
  "data": {
    "contractorId": "cont-uuid",
    "contractorName": "ABC Constructions",
    "contractorPhone": "9876543210",
    "contractorEmail": "abc@example.com",
    "contractorAddress": "123 Builder St",
    "contractorCity": "Chennai",
    "isActive": true,
    "lastPaymentDate": "2024-01-15T10:00:00",
    "lastInvoiceDate": "2024-01-10T14:00:00",
    "linkedCustomers": [
      {
        "customerId": "cust-uuid",
        "customerName": "Customer A",
        "customerPhone": "9876543211",
        "customerEmail": "a@example.com",
        "customerAddress": "456 Site A",
        "customerCity": "Chennai",
        "pendingInvoices": [...],
        "totalBilled": 50000.00,
        "totalPaid": 30000.00,
        "totalPending": 20000.00,
        "pendingInvoiceCount": 2
      }
    ],
    "ownPendingBills": {
      "pendingInvoices": [...],
      "totalBilled": 30000.00,
      "totalPaid": 20000.00,
      "totalPending": 10000.00,
      "pendingInvoiceCount": 1
    },
    "grandTotalBilled": 80000.00,
    "grandTotalPaid": 50000.00,
    "grandTotalPending": 30000.00,
    "totalPendingInvoiceCount": 3,
    "totalLinkedCustomers": 2,
    "customersWithPendingBills": 1
  }
}
```

### Get All Contractors Pending Bills
```http
GET /api/contractors/pending-bills
```

---

## Payments

### Get All Payments
```http
GET /api/payments
```

**Query Parameters:**
- `customerId` (optional)
- `type` (optional): `billing` | `payment`
- `fromDate` (optional)
- `toDate` (optional)

### Record Payment
```http
POST /api/payments
```

**Request:**
```json
{
  "customerId": "cust-uuid",
  "customerName": "John Doe",
  "invoiceId": "inv-uuid",
  "invoiceNumber": "INV24010001",
  "type": "payment",
  "amount": 5000.00,
  "balanceAfter": 3300.00,
  "paymentMethod": "cash",
  "notes": "Partial payment"
}
```

### Get Customer Payment History
```http
GET /api/payments/customer/{customerId}
```

---

## Products

### Get All Products
```http
GET /api/products
```

**Query Parameters:**
- `search` (optional)
- `lowStock` (optional): `true` to get only low stock items

### Create Product
```http
POST /api/products
```

### Get Product by ID
```http
GET /api/products/{id}
```

### Update Product
```http
PUT /api/products/{id}
```

### Delete Product
```http
DELETE /api/products/{id}
```

---

## Commissions

### Get All Commissions
```http
GET /api/commissions
```

**Query Parameters:**
- `contractorId` (optional)
- `fromDate` (optional)
- `toDate` (optional)

### Create Commission
```http
POST /api/commissions
```

### Get Commissions by Contractor
```http
GET /api/commissions/contractor/{contractorId}
```

---

## Reports

### Get Sales Report
```http
GET /api/reports/sales
```

**Query Parameters:**
- `fromDate` (required)
- `toDate` (required)

### Get Customer Report
```http
GET /api/reports/customers
```

**Query Parameters:**
- `customerId` (required)

### Get Product Report
```http
GET /api/reports/products
```

**Query Parameters:**
- `productId` (required)

### Get Stock Report
```http
GET /api/reports/stock
```

---

## Automatic Scheduled Jobs

The following scheduled jobs run automatically:

1. **Contractor Status Update** - Daily at 1:00 AM
   - Updates `isActive` status for contractors
   - Deactivates contractors with no bill for 1 month after last payment

2. **Overdue Bills Check** - Daily at 2:00 AM
   - Checks all pending invoices
   - Logs overdue events for invoices past due date (30 days)

---

## Audit Trail Features

### Automatic Audit Logging
The system automatically logs the following events:

1. **Invoice Created** - When a new invoice is created
2. **Payment Received** - When partial or full payment is recorded
3. **Item Returned** - When items are returned via return request
4. **Overdue Payment** - When invoice becomes overdue
5. **Status Changed** - When invoice status changes

### Return/Written Bill Workflow

1. **Create Return Request** (Status: `pending`)
   - Select invoice and items to return
   - Specify quantities and reason

2. **Process Return** (Status: `processed`)
   - Stock is updated (items added back)
   - Invoice balance is adjusted
   - Audit log is created

3. **Refund** (Status: `refunded`)
   - Customer receives refund
   - Final completion of return

---

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "data": null,
  "message": "Error description"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `404` - Not Found
- `500` - Internal Server Error

---

## Data Types

### Enums

**CustomerType:** `customer` | `contractor`

**InvoiceStatus:** `paid` | `pending` | `cancelled`

**BillType:** `final_bill` | `quotation`

**PaymentMethod:** `cash` | `card` | `upi` | `bank_transfer` | `cheque`

**TransactionType:** `billing` | `payment`

**ReturnStatus:** `pending` | `approved` | `processed` | `refunded` | `rejected` | `cancelled`

**AuditActionType:**
- `INVOICE_CREATED`
- `PAYMENT_RECEIVED`
- `PAYMENT_DUE`
- `OVERDUE_PAYMENT`
- `STATUS_CHANGED`
- `ITEM_RETURNED`
- `BILL_WRITTEN_OFF`
- `DISCOUNT_APPLIED`
- `INVOICE_CANCELLED`
- `INVOICE_MODIFIED`
- `OVERDUE_REMINDER_SENT`
- `COMMISSION_PAID`

---

## New Fields Summary

### Customer Entity
- `city`: String - City name
- `isActive`: Boolean - Active status (for contractors auto-updated)
- `lastPaymentDate`: DateTime - Last payment timestamp
- `lastInvoiceDate`: DateTime - Last invoice timestamp

### Invoice Audit
Complete transaction history is now available via `/api/invoice-audit/invoice/{invoiceId}`

### Returns
Full return/written bill functionality with stock management via `/api/invoice-returns`

### Overdue Bills
Comprehensive overdue tracking with aging buckets via `/api/overdue-bills`

---

*Documentation Version: 1.0*
*Last Updated: April 2024*
