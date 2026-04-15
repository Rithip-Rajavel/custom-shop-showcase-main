//const BASE_URL = '/selvahardware';
const BASE_URL = 'http://localhost:5090/selvahardware';
const TOKEN_KEY = 'shiva-jwt-token';

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

function buildHeaders(extra?: Record<string, string>): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...extra,
  };
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse<T>(res: Response): Promise<T> {
  const contentType = res.headers.get('content-type') || '';
  const isJson = contentType.includes('application/json') || contentType.includes('*/*');

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      message = body?.error?.message || body?.message || message;
    } catch {
      // ignore parse errors
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;

  try {
    const body = await res.json();
    // Unwrap ApiResponse envelope { success, data, message, error }
    if (body && typeof body === 'object' && 'data' in body) {
      return body.data as T;
    }
    return body as T;
  } catch {
    return undefined as T;
  }
}

export async function apiGet<T>(path: string, params?: Record<string, string | boolean | number | undefined>): Promise<T> {
  let url = `${BASE_URL}${path}`;
  if (params) {
    const searchParams = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        searchParams.set(k, String(v));
      }
    }
    const qs = searchParams.toString();
    if (qs) url += `?${qs}`;
  }
  const res = await fetch(url, { method: 'GET', headers: buildHeaders() });
  return handleResponse<T>(res);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiPut<T>(path: string, body?: unknown): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  return handleResponse<T>(res);
}

export async function apiDelete<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  return handleResponse<T>(res);
}

// Quotation API endpoints
export async function getQuotations() {
  return apiGet<any[]>('/api/quotations');
}

export async function getQuotationById(id: string) {
  return apiGet<any>(`/api/quotations/${id}`);
}

export async function createQuotation(quotation: any) {
  return apiPost<any>('/api/quotations', quotation);
}

export async function updateQuotation(id: string, quotation: any) {
  return apiPut<any>(`/api/quotations/${id}`, quotation);
}

export async function deleteQuotation(id: string) {
  return apiDelete<any>(`/api/quotations/${id}`);
}

export async function confirmQuotation(id: string) {
  return apiPost<any>(`/api/quotations/${id}/confirm`);
}

export async function cancelQuotation(id: string) {
  return apiPost<any>(`/api/quotations/${id}/cancel`);
}

export async function convertQuotationToInvoice(id: string, amountPaid?: number) {
  let url = `/api/quotations/${id}/convert-to-invoice`;
  if (amountPaid !== undefined) {
    url += `?amountPaid=${amountPaid}`;
  }
  return apiPost<any>(url);
}

export async function getQuotationsByCustomer(customerId: string) {
  return apiGet<any[]>(`/api/quotations/customer/${customerId}`);
}

export async function getQuotationsByStatus(status: string) {
  return apiGet<any[]>(`/api/quotations/status/${status}`);
}

export async function getExpiredQuotations() {
  return apiGet<any[]>('/api/quotations/expired');
}

export async function filterQuotations(filters: any) {
  return apiGet<any[]>('/api/quotations/filter', filters);
}

// Customer API endpoints
export async function getCustomers() {
  return apiGet<any[]>('/api/customers');
}

export async function getCustomerById(id: string) {
  return apiGet<any>(`/api/customers/${id}`);
}

export async function createCustomer(customer: any) {
  return apiPost<any>('/api/customers', customer);
}

export async function updateCustomer(id: string, customer: any) {
  return apiPut<any>(`/api/customers/${id}`, customer);
}

export async function deleteCustomer(id: string) {
  return apiDelete<any>(`/api/customers/${id}`);
}

// Customer-Contractor API endpoints
export async function getCustomersByContractor(contractorId: string) {
  return apiGet<any[]>(`/api/customers/contractor/${contractorId}`);
}

// Invoice API endpoints
export async function getInvoices() {
  return apiGet<any[]>('/api/invoices');
}

export async function getInvoiceById(id: string) {
  return apiGet<any>(`/api/invoices/${id}`);
}

export async function createInvoice(invoice: any) {
  return apiPost<any>('/api/invoices', invoice);
}

export async function updateInvoice(id: string, invoice: any) {
  return apiPut<any>(`/api/invoices/${id}`, invoice);
}

export async function deleteInvoice(id: string) {
  return apiDelete<any>(`/api/invoices/${id}`);
}

export async function getInvoicesByCustomer(customerId: string) {
  return apiGet<any[]>(`/api/invoices/customer/${customerId}`);
}

export async function filterInvoices(filters: any) {
  return apiGet<any[]>('/api/invoices/filter', filters);
}

export async function getNextInvoiceNumber(prefix: string = 'INV') {
  return apiGet<string>('/api/invoices/next-number', { prefix });
}

export async function applyPaymentToInvoice(invoiceId: string, amount: number, paymentMethod: string) {
  return apiPost<any>(`/api/invoices/${invoiceId}/pay`, { amount, paymentMethod });
}

export async function getInvoiceStats(period: string = 'month') {
  return apiGet<any>('/api/invoices/stats', { period });
}

export async function getCustomerBalance(customerId: string) {
  return apiGet<any>(`/api/customers/${customerId}/balance`);
}

// Product Stock and Price Management
export async function updateProductStock(productId: string, stockData: any) {
  return apiPut<any>(`/api/products/${productId}/stock`, stockData);
}

export async function updateProductPrice(productId: string, priceData: any) {
  return apiPut<any>(`/api/products/${productId}/price`, priceData);
}

export async function getProductAudits(productId: string) {
  return apiGet<any[]>(`/api/products/${productId}/audits`);
}

export async function getProductAuditsByAction(productId: string, action: string) {
  return apiGet<any[]>(`/api/products/${productId}/audits/${action}`);
}
