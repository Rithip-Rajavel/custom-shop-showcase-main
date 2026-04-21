import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, FileText, TrendingUp, TrendingDown, Wallet, Plus, CreditCard, Receipt, Clock, HardHat, Eye, DollarSign, Trash2, History, RefreshCw, ChevronRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomers } from '@/hooks/useCustomers';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { useCommissions } from '@/hooks/useCommissions';
import { useBonuses } from '@/hooks/useBonuses';
import { useInvoiceAudit } from '@/hooks/useInvoiceAudit';
import { useReturns } from '@/hooks/useReturns';
import { AddPaymentModal } from '@/components/customers/AddPaymentModal';
import { BonusModal, BonusData } from '@/components/customers/BonusModal';
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils';
import { PaymentMethod } from '@/types';
import { toast } from 'sonner';
import { apiGet, apiPost } from '@/lib/api';

export default function CustomerLedger() {
  const { customerId } = useParams<{ customerId: string }>();
  const { customers } = useCustomers();
  const { getInvoicesByCustomer, getCustomerBalance, applyPaymentToInvoices, invoices } = useInvoices();
  const { getCustomerTransactions, addPaymentTransaction } = usePayments();
  const { getContractorCommissions, getTotalCommission } = useCommissions();
  const { bonuses, createBonus, deleteBonus, getBonusesByCustomer, getTotalBonusByCustomerAndYear } = useBonuses();
  const { getInvoiceAudit, getCustomerAudit } = useInvoiceAudit();
  const { getReturnsForCustomer } = useReturns();

  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentForInvoiceId, setPaymentForInvoiceId] = useState<string | null>(null);
  const [customerBalance, setCustomerBalance] = useState<any>(null);
  const [totalCommission, setTotalCommission] = useState<number>(0);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [isAddingBonus, setIsAddingBonus] = useState(false);
  const [totalBonus, setTotalBonus] = useState<number>(0);
  const [auditLogs, setAuditLogs] = useState<any>(null);
  const [selectedInvoiceAudit, setSelectedInvoiceAudit] = useState<any>(null);
  const [customerReturns, setCustomerReturns] = useState<any[]>([]);

  const customer = customers.find((c) => c.id === customerId);
  const isContractor = customer?.type === 'contractor';
  const customerInvoices = customerId ? getInvoicesByCustomer(customerId) : [];
  const transactions = customerId ? getCustomerTransactions(customerId) : [];
  const commissions = customerId && isContractor ? getContractorCommissions(customerId) : [];

  // Fetch customer balance, bonuses, and returns from API
  useEffect(() => {
    if (customerId) {
      // Fetch balance
      apiGet(`/api/customers/${customerId}/balance`)
        .then((data) => {
          setCustomerBalance(data);
        })
        .catch((error) => {
          console.error('Failed to fetch customer balance:', error);
          // Fallback to localStorage if API fails
          const fallbackBalance = getCustomerBalance(customerId);
          setCustomerBalance(fallbackBalance);
        });

      // Fetch bonuses
      getBonusesByCustomer(customerId);

      // Fetch annual total bonus
      getTotalBonusByCustomerAndYear(customerId, new Date().getFullYear())
        .then(setTotalBonus)
        .catch(console.error);

      // Fetch returns
      getReturnsForCustomer(customerId)
        .then((returns) => {
          setCustomerReturns(returns);
        })
        .catch((error) => {
          console.error('Failed to fetch returns:', error);
          setCustomerReturns([]);
        });
    }
  }, [customerId]);

  const handleBonusSubmit = async (bonusData: BonusData) => {
    if (!customerId) return;

    setIsAddingBonus(true);
    try {
      const bonusDate = new Date(bonusData.date);
      const month = bonusDate.getMonth() + 1;
      const year = bonusDate.getFullYear();

      await createBonus(
        customerId,
        bonusData.amount,
        month,
        year,
        bonusData.reason + (bonusData.notes ? ` (${bonusData.notes})` : '')
      );

      // Refresh total bonus
      const total = await getTotalBonusByCustomerAndYear(customerId, new Date().getFullYear());
      setTotalBonus(total);

      toast.success('Bonus added successfully!');
      setIsBonusModalOpen(false);
    } catch (error) {
      console.error('Failed to add bonus:', error);
      toast.error('Failed to add bonus');
    } finally {
      setIsAddingBonus(false);
    }
  };

  const handleDeleteBonus = async (bonusId: string) => {
    if (!confirm('Are you sure you want to delete this bonus?')) return;

    try {
      await deleteBonus(bonusId);
      // Refresh total bonus
      if (customerId) {
        const total = await getTotalBonusByCustomerAndYear(customerId, new Date().getFullYear());
        setTotalBonus(total);
      }
      toast.success('Bonus deleted successfully');
    } catch (error) {
      console.error('Failed to delete bonus:', error);
      toast.error('Failed to delete bonus');
    }
  };

  const handleAddBonus = () => {
    console.log('Opening bonus modal for:', customer?.name);
    setIsBonusModalOpen(true);
  };

  useEffect(() => {
    if (customerId && isContractor) {
      getTotalCommission(customerId)
        .then((commission) => {
          setTotalCommission(commission);
        })
        .catch((error) => {
          console.error('Failed to fetch total commission:', error);
          setTotalCommission(0);
        });
    }
  }, [customerId, isContractor]);

  const fetchCustomerAuditLogs = async () => {
    if (!customerId) return;
    try {
      const logs = await getCustomerAudit(customerId);
      setAuditLogs(logs);
    } catch (error) {
      console.error('Failed to fetch audit logs:', error);
    }
  };

  const fetchInvoiceAudit = async (invoiceId: string) => {
    try {
      const audit = await getInvoiceAudit(invoiceId);
      setSelectedInvoiceAudit(audit);
    } catch (error) {
      console.error('Failed to fetch invoice audit:', error);
    }
  };

  // Use API data if available, otherwise fallback to localStorage
  const displayBalance = customerBalance?.pendingBalance ?? 0;
  const totalBilled = customerBalance?.totalBilled ?? 0;
  const totalPaid = customerBalance?.totalPaid ?? 0;

  const handlePaymentSubmit = async (amount: number, paymentMethod: PaymentMethod, notes?: string, nextPayDate?: string) => {
    console.log('Payment submit:', { amount, paymentMethod, notes, nextPayDate, customerId, paymentForInvoiceId });

    if (!customer) {
      toast.error('Customer not found');
      return;
    }

    if (paymentForInvoiceId) {
      // Per-invoice payment - use invoice payment endpoint
      try {
        console.log('Making invoice payment to:', `/api/invoices/${paymentForInvoiceId}/pay`);

        await apiPost(`/api/invoices/${paymentForInvoiceId}/pay`, {
          amount,
          paymentMethod,
          notes: notes || `Payment for invoice`,
          nextPayDate
        });

        // Refresh customer balance after payment
        const updatedBalance = await apiGet(`/api/customers/${customerId}/balance`);
        setCustomerBalance(updatedBalance);

        toast.success(`Payment of ${formatCurrency(amount)} recorded successfully`);
        setPaymentForInvoiceId(null);
        setIsPaymentModalOpen(false);
      } catch (error) {
        console.error('Payment error:', error);
        toast.error(error instanceof Error ? error.message : 'Payment failed');
      }
    } else {
      // General customer payment - use applyPaymentToInvoices with a dummy invoiceId
      try {
        await applyPaymentToInvoices(customer.id, amount, paymentMethod);

        // Refresh customer balance after payment
        const updatedBalance = await apiGet(`/api/customers/${customerId}/balance`);
        setCustomerBalance(updatedBalance);

        toast.success(`Payment of ${formatCurrency(amount)} recorded successfully`);
      } catch (error) {
        console.error('Payment error:', error);
        toast.error(error instanceof Error ? error.message : 'Payment failed');
      }
    }
  };

  const handlePayForInvoice = (invoiceId: string) => {
    setPaymentForInvoiceId(invoiceId);
    setIsPaymentModalOpen(true);
  };

  if (!customer) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16">
          <p className="text-lg text-muted-foreground">Not found</p>
          <Link to="/customers">
            <Button variant="outline" className="mt-4 gap-2">
              <ArrowLeft size={18} />
              Back
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  const selectedInvoiceForPayment = paymentForInvoiceId
    ? invoices.find((inv) => inv.id === paymentForInvoiceId)
    : null;

  return (
    <MainLayout>
      <div className="mb-6">
        <Link to="/customers">
          <Button variant="ghost" size="sm" className="gap-2 mb-4">
            <ArrowLeft size={16} />
            Back to Customers & Contractors
          </Button>
        </Link>
        <PageHeader
          title={
            <span className="flex items-center gap-3">
              {customer.name}
              <span className={`text-xs px-2 py-1 rounded font-medium ${isContractor ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'
                }`}>
                {isContractor ? 'Contractor' : 'Customer'}
              </span>
            </span>
          }
          description={`${customer.phone || 'No phone'} • ${customer.email || 'No email'}`}
          action={
            displayBalance > 0 ? (
              <Button onClick={() => { setPaymentForInvoiceId(null); setIsPaymentModalOpen(true); }} className="gap-2">
                <Plus size={18} />
                Record Payment
              </Button>
            ) : undefined
          }
        />
      </div>

      {/* Summary Cards */}
      <div className={`grid grid-cols-1 gap-4 mb-6 ${isContractor ? 'md:grid-cols-6' : 'md:grid-cols-5'}`}>
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Invoices</p>
              <p className="text-xl font-bold">{customerInvoices.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Billed</p>
              <p className="text-xl font-bold">{formatCurrency(totalBilled)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalPaid)}</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${displayBalance > 0 ? 'bg-destructive/10' : 'bg-green-500/10'
              }`}>
              <TrendingDown className={`w-5 h-5 ${displayBalance > 0 ? 'text-destructive' : 'text-green-500'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pending Balance</p>
              <p className={`text-xl font-bold ${displayBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                {formatCurrency(displayBalance)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-green-500/20 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Bonus</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(totalBonus || 0)}</p>
            </div>
          </div>
        </div>

        {isContractor && (
          <div className="bg-card border border-amber-500/20 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Commission</p>
                <p className="text-xl font-bold text-amber-600">{formatCurrency(totalCommission || 0)}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices" className="gap-2">
            <Receipt size={16} />
            Invoices
          </TabsTrigger>
          <TabsTrigger value="transactions" className="gap-2">
            <Clock size={16} />
            Payment History
          </TabsTrigger>
          <TabsTrigger value="returns" className="gap-2">
            <RefreshCw size={16} />
            Returns
          </TabsTrigger>
          <TabsTrigger value="audit" className="gap-2" onClick={fetchCustomerAuditLogs}>
            <History size={16} />
            Audit Trail
          </TabsTrigger>
          {isContractor && (
            <TabsTrigger value="commissions" className="gap-2">
              <DollarSign size={16} />
              Commissions
            </TabsTrigger>
          )}
          <TabsTrigger value="bonus" className="gap-2">
            <TrendingUp size={16} />
            Bonus
          </TabsTrigger>
        </TabsList>

        {/* Invoices Tab - with per-invoice payment */}
        <TabsContent value="invoices">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold">Invoice History</h3>
            </div>

            {customerInvoices.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Invoice #</th>
                      {isContractor && (
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">End Customer</th>
                      )}
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Bill Amount</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Paid</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Balance</th>
                      <th className="text-center p-3 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-center p-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerInvoices.map((invoice) => (
                      <tr key={invoice.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-3 text-sm">
                          <div>{formatDate(invoice.createdAt)}</div>
                          <div className="text-xs text-muted-foreground">
                            {formatDateTime(invoice.createdAt).split(',')[1]}
                          </div>
                        </td>
                        <td className="p-3 text-sm font-mono">{invoice.invoiceNumber}</td>
                        {isContractor && (
                          <td className="p-3 text-sm font-medium">{invoice.endCustomerName || '-'}</td>
                        )}
                        <td className="p-3 text-sm text-right font-medium">{formatCurrency(invoice.grandTotal)}</td>
                        <td className="p-3 text-sm text-right text-green-600 font-medium">
                          {formatCurrency(invoice.amountPaid || invoice.grandTotal)}
                        </td>
                        <td className={`p-3 text-sm text-right font-medium ${(invoice.balance || 0) > 0 ? 'text-destructive' : 'text-muted-foreground'
                          }`}>
                          {formatCurrency(invoice.balance || 0)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${invoice.status === 'paid'
                            ? 'bg-green-500/10 text-green-600'
                            : invoice.status === 'pending'
                              ? 'bg-amber-500/10 text-amber-600'
                              : 'bg-destructive/10 text-destructive'
                            }`}>
                            {invoice.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <Link to={`/invoices?customer=${customer.id}`}>
                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                                <Eye size={14} />
                              </Button>
                            </Link>
                            {(invoice.balance || 0) > 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => handlePayForInvoice(invoice.id)}
                              >
                                <CreditCard size={12} />
                                Pay
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <FileText className="w-12 h-12 mb-4" />
                <p>No invoices found</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Payment History Tab */}
        <TabsContent value="transactions">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border flex items-center justify-between">
              <h3 className="font-semibold">Payment Transaction History</h3>
              {displayBalance > 0 && (
                <Button size="sm" onClick={() => { setPaymentForInvoiceId(null); setIsPaymentModalOpen(true); }} className="gap-2">
                  <Plus size={16} />
                  Add Payment
                </Button>
              )}
            </div>

            {transactions.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date & Time</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Type</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Reference</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-center p-3 text-sm font-medium text-muted-foreground">Method</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Balance After</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-3 text-sm">
                          <div>{formatDate(transaction.createdAt)}</div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(transaction.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${transaction.type === 'billing' ? 'bg-blue-500/10 text-blue-600' : 'bg-green-500/10 text-green-600'
                            }`}>
                            {transaction.type === 'billing' ? <Receipt size={12} /> : <CreditCard size={12} />}
                            {transaction.type === 'billing' ? 'Invoice' : 'Payment'}
                          </span>
                        </td>
                        <td className="p-3 text-sm font-mono">{transaction.invoiceNumber || '-'}</td>
                        <td className={`p-3 text-sm text-right font-medium ${transaction.type === 'payment' ? 'text-green-600' : ''}`}>
                          {transaction.type === 'payment' ? '-' : ''}{formatCurrency(transaction.amount)}
                        </td>
                        <td className="p-3 text-sm text-center capitalize">{transaction.paymentMethod}</td>
                        <td className={`p-3 text-sm text-right font-bold ${transaction.balanceAfter > 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {formatCurrency(transaction.balanceAfter)}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground max-w-[200px] truncate">{transaction.notes || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <Clock className="w-12 h-12 mb-4" />
                <p>No payment transactions recorded yet</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Commissions Tab (Contractors only) */}
        {isContractor && (
          <TabsContent value="commissions">
            <div className="bg-card border border-amber-500/20 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <HardHat className="w-4 h-4 text-amber-500" />
                    Commission History
                  </h3>
                  <span className="text-sm font-bold text-amber-600">
                    Total: {formatCurrency(totalCommission)}
                  </span>
                </div>
              </div>

              {commissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Invoice #</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">End Customer</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {commissions.map((c) => (
                        <tr key={c.id} className="border-t border-border hover:bg-muted/30">
                          <td className="p-3 text-sm">{formatDate(c.createdAt)}</td>
                          <td className="p-3 text-sm font-mono">{c.invoiceNumber}</td>
                          <td className="p-3 text-sm font-medium">{c.endCustomerName}</td>
                          <td className="p-3 text-sm text-right font-bold text-amber-600">{formatCurrency(c.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <DollarSign className="w-12 h-12 mb-4" />
                  <p>No commissions recorded yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        )}

        {/* Returns Tab */}
        <TabsContent value="returns">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold flex items-center gap-2">
                <RefreshCw className="w-4 h-4 text-primary" />
                Return History
              </h3>
            </div>

            {customerReturns.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Return #</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Invoice #</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Date</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Items</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Return Amount</th>
                      <th className="text-center p-3 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customerReturns.map((ret) => (
                      <tr key={ret.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-3 text-sm font-mono">{ret.returnNumber}</td>
                        <td className="p-3 text-sm font-mono">{ret.invoiceNumber}</td>
                        <td className="p-3 text-sm">{formatDate(ret.createdAt)}</td>
                        <td className="p-3 text-sm">{ret.totalReturnQuantity} items</td>
                        <td className="p-3 text-sm text-right font-medium text-destructive">
                          {formatCurrency(ret.totalReturnAmount)}
                        </td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${ret.status === 'refunded' ? 'bg-green-500/10 text-green-600' :
                            ret.status === 'processed' ? 'bg-blue-500/10 text-blue-600' :
                              ret.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                                'bg-destructive/10 text-destructive'
                            }`}>
                            {ret.status.charAt(0).toUpperCase() + ret.status.slice(1)}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">{ret.reason || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <RefreshCw className="w-12 h-12 mb-4" />
                <p className="text-lg">No returns found</p>
                <p className="text-sm">Returns will appear here when items are returned from invoices</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Audit Trail Tab */}
        <TabsContent value="audit">
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Invoice Audit Trail
                </h3>
                <Button size="sm" variant="outline" className="gap-2" onClick={fetchCustomerAuditLogs}>
                  <RefreshCw className="w-4 h-4" />
                  Refresh
                </Button>
              </div>
            </div>

            {selectedInvoiceAudit ? (
              <div className="p-4 space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-muted/30 rounded-lg p-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Invoice Number</p>
                    <p className="font-semibold">{selectedInvoiceAudit.invoiceNumber}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Original Total</p>
                    <p className="font-semibold">{formatCurrency(selectedInvoiceAudit.originalGrandTotal)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Current Balance</p>
                    <p className={`font-semibold ${selectedInvoiceAudit.currentBalance > 0 ? 'text-destructive' : 'text-green-600'}`}>
                      {formatCurrency(selectedInvoiceAudit.currentBalance)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Total Paid</p>
                    <p className="font-semibold text-green-600">{formatCurrency(selectedInvoiceAudit.totalPaid)}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium mb-3 text-muted-foreground">Payment History</h4>
                  {selectedInvoiceAudit.paymentHistory && selectedInvoiceAudit.paymentHistory.length > 0 ? (
                    <div className="space-y-2">
                      {selectedInvoiceAudit.paymentHistory.map((payment: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between bg-card rounded-lg p-3 border border-border">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
                              <DollarSign className="w-4 h-4 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{formatCurrency(payment.amount)}</p>
                              <p className="text-xs text-muted-foreground">{payment.paymentMethod} - {payment.notes || 'No notes'}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{formatDate(payment.timestamp)}</p>
                            <p className="text-xs text-muted-foreground">{formatDateTime(payment.timestamp).split(',')[1]}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground text-sm">No payment history recorded</div>
                  )}
                </div>

                <Button variant="outline" onClick={() => setSelectedInvoiceAudit(null)} className="w-full">
                  Back to All Audit Logs
                </Button>
              </div>
            ) : (
              <div className="p-4">
                {auditLogs && auditLogs.length > 0 ? (
                  <div className="space-y-2">
                    {auditLogs.map((audit: any) => (
                      <div key={audit.id || audit.invoiceId} className="bg-card rounded-lg p-3 border border-border hover:bg-muted/30 cursor-pointer" onClick={() => fetchInvoiceAudit(audit.invoiceId)}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                              <Receipt className="w-4 h-4 text-primary" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{audit.invoiceNumber}</p>
                              <p className="text-xs text-muted-foreground">
                                {audit.totalTransactions || 0} transactions • Total: {formatCurrency(audit.totalPaid || 0)}
                              </p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                    <History className="w-12 h-12 mb-4" />
                    <p className="text-lg">No audit logs found</p>
                    <p className="text-sm">Audit logs will appear here when invoices are created or payments are made</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>

        {/* Bonus Tab (All Customers) */}
        <TabsContent value="bonus">
          <div className="bg-card border border-green-500/20 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-500" />
                  Bonus Management
                </h3>
                <Button size="sm" className="gap-2" onClick={handleAddBonus}>
                  <Plus className="w-4 h-4" />
                  Add Bonus
                </Button>
              </div>
            </div>

            {bonuses.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Period</th>
                      <th className="text-left p-3 text-sm font-medium text-muted-foreground">Reason</th>
                      <th className="text-right p-3 text-sm font-medium text-muted-foreground">Amount</th>
                      <th className="text-center p-3 text-sm font-medium text-muted-foreground">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bonuses.map((bonus) => (
                      <tr key={bonus.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-3 text-sm">
                          {new Date(bonus.bonusYear, bonus.bonusMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                        </td>
                        <td className="p-3 text-sm">{bonus.reason}</td>
                        <td className="p-3 text-sm text-right font-bold text-green-600">{formatCurrency(bonus.bonusAmount)}</td>
                        <td className="p-3 text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-destructive"
                            onClick={() => handleDeleteBonus(bonus.id)}
                          >
                            <Trash2 size={14} />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="p-8">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <TrendingUp className="w-12 h-12 mb-4" />
                  <p className="text-lg font-medium mb-2">No bonus payments recorded yet</p>
                  <p className="text-sm">
                    {isContractor
                      ? "Add bonus payments for exceptional performance or special occasions"
                      : "Add bonus payments for loyal customers or special occasions"
                    }
                  </p>
                </div>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Payment Modal */}
      <AddPaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => { setIsPaymentModalOpen(false); setPaymentForInvoiceId(null); }}
        customerName={`${customer.name}${selectedInvoiceForPayment?.endCustomerName ? ` → ${selectedInvoiceForPayment.endCustomerName}` : ''}`}
        currentBalance={selectedInvoiceForPayment ? (selectedInvoiceForPayment.balance || 0) : displayBalance}
        onSubmit={handlePaymentSubmit}
      />

      {/* Bonus Modal */}
      <BonusModal
        isOpen={isBonusModalOpen}
        onClose={() => setIsBonusModalOpen(false)}
        onSubmit={handleBonusSubmit}
        customerName={customer?.name}
        isLoading={isAddingBonus}
      />
    </MainLayout>
  );
}
