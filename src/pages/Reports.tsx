import { useState, useMemo, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BarChart3,
  Calendar,
  TrendingUp,
  TrendingDown,
  Users,
  IndianRupee,
  AlertTriangle,
  ArrowUpRight
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { useCustomers } from '@/hooks/useCustomers';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiGet } from '@/lib/api';

type DateRange = 'today' | 'week' | 'month';

export default function Reports() {
  const [dateRange, setDateRange] = useState<DateRange>('today');
  const { invoices, getCustomerBalance } = useInvoices();
  const { transactions } = usePayments();
  const { customers } = useCustomers();
  const [customerBalances, setCustomerBalances] = useState<Record<string, any>>({});

  // Fetch all customer balances from API
  useEffect(() => {
    const fetchAllBalances = async () => {
      const balances: Record<string, any> = {};

      for (const customer of customers) {
        if (customer.id !== 'walk-in') {
          try {
            const balance = await apiGet(`/api/customers/${customer.id}/balance`);
            balances[customer.id] = balance;
          } catch (error) {
            console.error(`Failed to fetch balance for ${customer.name}:`, error);
            // Fallback to localStorage
            const fallbackBalance = getCustomerBalance(customer.id);
            balances[customer.id] = fallbackBalance;
          }
        }
      }

      setCustomerBalances(balances);
    };

    fetchAllBalances();
  }, [customers]);

  const getDateRangeStart = (range: DateRange): Date => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    switch (range) {
      case 'today':
        return now;
      case 'week':
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 7);
        return weekStart;
      case 'month':
        const monthStart = new Date(now);
        monthStart.setDate(now.getDate() - 30);
        return monthStart;
      default:
        return now;
    }
  };

  const collectionStats = useMemo(() => {
    const rangeStart = getDateRangeStart(dateRange);
    const now = new Date();

    // Filter invoices in date range
    const rangeInvoices = invoices.filter((inv) => {
      const invDate = new Date(inv.createdAt);
      return invDate >= rangeStart && invDate <= now;
    });

    // Filter payment transactions in date range (only payments, not billing)
    const rangePayments = transactions.filter((t) => {
      const tDate = new Date(t.createdAt);
      return t.type === 'payment' && tDate >= rangeStart && tDate <= now;
    });

    const totalBilled = rangeInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const paidAtBilling = rangeInvoices.reduce((sum, inv) => sum + inv.amountPaid, 0);
    const laterPayments = rangePayments.reduce((sum, t) => sum + t.amount, 0);
    const totalCollected = paidAtBilling + laterPayments;
    const creditGiven = rangeInvoices.reduce((sum, inv) => sum + (inv.balance || 0), 0);

    return {
      totalBilled,
      totalCollected,
      creditGiven,
      invoiceCount: rangeInvoices.length,
      paymentCount: rangePayments.length,
    };
  }, [invoices, transactions, dateRange]);

  // Get all customers with pending balances
  const customersWithDues = useMemo(() => {
    return customers
      .filter((c) => c.id !== 'walk-in')
      .map((customer) => {
        const balance = customerBalances[customer.id] || { totalBilled: 0, totalPaid: 0, pendingBalance: 0, invoiceCount: 0 };
        return {
          ...customer,
          ...balance,
        };
      })
      .filter((c) => c.pendingBalance > 0)
      .sort((a, b) => b.pendingBalance - a.pendingBalance);
  }, [customers, customerBalances]);

  const totalPendingBalance = customersWithDues.reduce(
    (sum, c) => sum + c.pendingBalance,
    0
  );

  const dateRangeLabels: Record<DateRange, string> = {
    today: "Today's",
    week: 'Last 7 Days',
    month: 'Last 30 Days',
  };

  return (
    <MainLayout>
      <PageHeader
        title="Reports"
        description="Collection summaries and pending balances"
      />

      {/* Date Range Tabs */}
      <Tabs value={dateRange} onValueChange={(v) => setDateRange(v as DateRange)} className="mb-6">
        <TabsList>
          <TabsTrigger value="today" className="gap-2">
            <Calendar size={16} />
            Today
          </TabsTrigger>
          <TabsTrigger value="week" className="gap-2">
            <Calendar size={16} />
            Week
          </TabsTrigger>
          <TabsTrigger value="month" className="gap-2">
            <Calendar size={16} />
            Month
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Collection Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dateRangeLabels[dateRange]} Billed</p>
              <p className="text-xl font-bold">{formatCurrency(collectionStats.totalBilled)}</p>
              <p className="text-xs text-muted-foreground">{collectionStats.invoiceCount} invoices</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dateRangeLabels[dateRange]} Collected</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(collectionStats.totalCollected)}</p>
              <p className="text-xs text-muted-foreground">
                {collectionStats.paymentCount > 0 && `+${collectionStats.paymentCount} payments`}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
              <TrendingDown className="w-5 h-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{dateRangeLabels[dateRange]} Credit Given</p>
              <p className="text-xl font-bold text-amber-600">{formatCurrency(collectionStats.creditGiven)}</p>
              <p className="text-xs text-muted-foreground">Pending from sales</p>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-destructive" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pending</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(totalPendingBalance)}</p>
              <p className="text-xs text-muted-foreground">{customersWithDues.length} customers</p>
            </div>
          </div>
        </div>
      </div>

      {/* Pending Balances by Customer */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-muted-foreground" />
            <h3 className="font-semibold">Pending Balances by Customer</h3>
          </div>
          <span className="text-sm text-muted-foreground">
            {customersWithDues.length} customer{customersWithDues.length !== 1 ? 's' : ''} with dues
          </span>
        </div>

        {customersWithDues.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-3 text-sm font-medium text-muted-foreground">Customer</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Total Billed</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Total Paid</th>
                  <th className="text-right p-3 text-sm font-medium text-muted-foreground">Pending Balance</th>
                  <th className="text-center p-3 text-sm font-medium text-muted-foreground">Invoices</th>
                  <th className="p-3 w-12"></th>
                </tr>
              </thead>
              <tbody>
                {customersWithDues.map((customer) => (
                  <tr key={customer.id} className="border-t border-border hover:bg-muted/30">
                    <td className="p-3">
                      <div className="font-medium">{customer.name}</div>
                      {customer.phone && (
                        <div className="text-sm text-muted-foreground">{customer.phone}</div>
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {formatCurrency(customer.totalBilled)}
                    </td>
                    <td className="p-3 text-right text-green-600">
                      {formatCurrency(customer.totalPaid)}
                    </td>
                    <td className="p-3 text-right">
                      <span className="font-bold text-destructive">
                        {formatCurrency(customer.pendingBalance)}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-muted">
                        {customer.invoiceCount}
                      </span>
                    </td>
                    <td className="p-3">
                      <Link to={`/customers/${customer.id}`}>
                        <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                          <ArrowUpRight size={16} className="text-muted-foreground" />
                        </button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-muted/50 border-t border-border">
                <tr>
                  <td className="p-3 font-semibold">Total</td>
                  <td className="p-3 text-right font-semibold">
                    {formatCurrency(customersWithDues.reduce((sum, c) => sum + c.totalBilled, 0))}
                  </td>
                  <td className="p-3 text-right font-semibold text-green-600">
                    {formatCurrency(customersWithDues.reduce((sum, c) => sum + c.totalPaid, 0))}
                  </td>
                  <td className="p-3 text-right font-bold text-destructive">
                    {formatCurrency(totalPendingBalance)}
                  </td>
                  <td className="p-3 text-center font-semibold">
                    {customersWithDues.reduce((sum, c) => sum + c.invoiceCount, 0)}
                  </td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <IndianRupee className="w-12 h-12 mb-4" />
            <p className="text-lg">No pending balances</p>
            <p className="text-sm">All customers have cleared their dues</p>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
