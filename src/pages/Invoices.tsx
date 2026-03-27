import { useState, useRef, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, FileText, Printer, Eye, Filter, X } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { InvoiceReceipt } from '@/components/billing/InvoiceReceipt';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useInvoices } from '@/hooks/useInvoices';
import { useCustomers } from '@/hooks/useCustomers';
import { useSettings } from '@/hooks/useSettings';
import { Invoice, ShopSettings } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';
import { useReactToPrint } from 'react-to-print';
import { apiGet } from '@/lib/api';

export default function Invoices() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { invoices } = useInvoices();
  const { customers } = useCustomers();
  const { settings } = useSettings();
  const printRef = useRef<HTMLDivElement>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>(
    searchParams.get('customer') || 'all'
  );
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);
  const [printingInvoice, setPrintingInvoice] = useState<Invoice | null>(null);
  const [apiSettings, setApiSettings] = useState<ShopSettings | null>(null);

  // Fetch settings from API
  useEffect(() => {
    apiGet('/api/settings')
      .then((data: ShopSettings) => {
        setApiSettings(data);
      })
      .catch((error) => {
        console.error('Failed to fetch settings:', error);
        // Fallback to localStorage settings
        if (settings && settings.name) {
          setApiSettings(settings);
        }
      });
  }, []);

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: printingInvoice?.invoiceNumber || 'Invoice',
    onAfterPrint: () => setPrintingInvoice(null),
  });

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const matchesSearch =
        !searchQuery ||
        inv.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inv.customerPhone.includes(searchQuery);

      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter;
      const matchesCustomer = customerFilter === 'all' || inv.customerId === customerFilter;

      return matchesSearch && matchesStatus && matchesCustomer;
    });
  }, [invoices, searchQuery, statusFilter, customerFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setCustomerFilter('all');
    setSearchParams({});
  };

  const hasActiveFilters = searchQuery || statusFilter !== 'all' || customerFilter !== 'all';

  const handlePrintInvoice = (invoice: Invoice) => {
    setPrintingInvoice(invoice);
    setTimeout(() => {
      handlePrint();
    }, 100);
  };

  const getStatusBadge = (status: Invoice['status']) => {
    const styles = {
      paid: 'bg-success/10 text-success',
      pending: 'bg-warning/10 text-warning',
      cancelled: 'bg-destructive/10 text-destructive',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  return (
    <MainLayout>
      <PageHeader title="Invoices" description="View and manage all invoices" />

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by invoice number, customer name, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>

            <Select value={customerFilter} onValueChange={setCustomerFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Customer" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="icon" onClick={clearFilters}>
                <X size={18} />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Invoices List */}
      {filteredInvoices.length > 0 ? (
        <div className="space-y-3">
          {filteredInvoices.map((invoice) => (
            <div
              key={invoice.id}
              className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{invoice.invoiceNumber}</h3>
                      {getStatusBadge(invoice.status)}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {invoice.customerName}
                      {invoice.endCustomerName && (
                        <span className="text-amber-600"> → {invoice.endCustomerName}</span>
                      )}
                      {' • '}{formatDateTime(invoice.createdAt)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {invoice.items.length} items • {invoice.paymentMethod.toUpperCase()}
                      {invoice.customerType === 'contractor' && (
                        <span className="ml-2 text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">Contractor</span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(invoice.grandTotal)}
                    </p>
                    {invoice.totalDiscount > 0 && (
                      <p className="text-xs text-muted-foreground">
                        Discount: {formatCurrency(invoice.totalDiscount)}
                      </p>
                    )}
                  </div>

                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewingInvoice(invoice)}
                      className="h-9 w-9 p-0"
                    >
                      <Eye size={18} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handlePrintInvoice(invoice)}
                      className="h-9 w-9 p-0"
                    >
                      <Printer size={18} />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <FileText className="w-16 h-16 mb-4" />
          <p className="text-lg">No invoices found</p>
          <p className="text-sm">
            {hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Create your first invoice from the billing page'}
          </p>
        </div>
      )}

      {/* View Invoice Modal */}
      <Dialog open={!!viewingInvoice} onOpenChange={() => setViewingInvoice(null)}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice {viewingInvoice?.invoiceNumber}</DialogTitle>
          </DialogHeader>
          {viewingInvoice && <InvoiceReceipt invoice={viewingInvoice} settings={apiSettings || settings} />}
          <div className="flex gap-2 mt-4">
            <Button variant="outline" onClick={() => setViewingInvoice(null)} className="flex-1">
              Close
            </Button>
            <Button
              onClick={() => {
                if (viewingInvoice) {
                  handlePrintInvoice(viewingInvoice);
                  setViewingInvoice(null);
                }
              }}
              className="flex-1 gap-2"
            >
              <Printer size={18} />
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden Print Receipt */}
      {printingInvoice && (
        <div className="hidden print:block">
          <InvoiceReceipt ref={printRef} invoice={printingInvoice} settings={apiSettings || settings} />
        </div>
      )}
    </MainLayout>
  );
}
