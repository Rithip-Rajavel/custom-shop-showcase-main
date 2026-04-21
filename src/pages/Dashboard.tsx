import { useState, useEffect } from 'react';
import { Package, Users, FileText, TrendingUp, ArrowUpRight, IndianRupee, Clock, Calendar, AlertCircle, Phone } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { useInvoices, InvoiceStats } from '@/hooks/useInvoices';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getPendingInvoicesByDate } from '@/lib/api';
import { Invoice } from '@/types';

export default function Dashboard() {
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { invoices, getInvoiceStats } = useInvoices();

  const [stats, setStats] = useState<InvoiceStats>({
    totalInvoices: 0,
    todayInvoices: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    pendingAmount: 0,
  });

  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [pendingInvoices, setPendingInvoices] = useState<Invoice[]>([]);
  const [loadingPending, setLoadingPending] = useState(false);

  useEffect(() => {
    getInvoiceStats('month').then(setStats).catch(() => { });
  }, [invoices]);

  useEffect(() => {
    fetchPendingInvoicesByDate(selectedDate);
  }, [selectedDate]);

  const fetchPendingInvoicesByDate = async (date: string) => {
    setLoadingPending(true);
    try {
      const data = await getPendingInvoicesByDate(date);
      setPendingInvoices(data || []);
    } catch (error) {
      console.error('Failed to fetch pending invoices:', error);
      setPendingInvoices([]);
    } finally {
      setLoadingPending(false);
    }
  };

  const lowStockProducts = products.filter((p) => p.stock <= 5);
  const recentInvoices = invoices.slice(0, 5);

  const statCards = [
    {
      title: "Today's Revenue",
      value: formatCurrency(stats.todayRevenue),
      icon: IndianRupee,
      change: `${stats.todayInvoices} invoices`,
      color: 'text-primary',
      bgColor: 'bg-primary/10',
    },
    {
      title: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      icon: TrendingUp,
      change: 'This month',
      color: 'text-success',
      bgColor: 'bg-success/10',
    },
    {
      title: 'Total Products',
      value: products.length.toString(),
      icon: Package,
      change: `${lowStockProducts.length} low stock`,
      color: 'text-warning',
      bgColor: 'bg-warning/10',
    },
    {
      title: 'Total Customers',
      value: customers.length.toString(),
      icon: Users,
      change: 'Registered',
      color: 'text-accent',
      bgColor: 'bg-accent/10',
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Dashboard"
        description="Welcome to Sri Sai Shiva Hardwares billing system"
        action={
          <Link to="/billing">
            <Button className="gap-2">
              <FileText size={18} />
              New Bill
            </Button>
          </Link>
        }
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat) => (
          <div key={stat.title} className="stat-card animate-fade-in">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{stat.title}</p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
              </div>
              <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Bills by Date */}
      <div className="bg-card border border-border rounded-xl p-6 mb-6">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold">Pending Bills Due By Date</h2>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-auto h-8"
              />
            </div>
          </div>
          <Link
            to={`/invoices?date=${selectedDate}&status=pending`}
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View all <ArrowUpRight size={14} />
          </Link>
        </div>

        {loadingPending ? (
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Clock className="w-6 h-6 animate-spin mr-2" />
            Loading...
          </div>
        ) : pendingInvoices.length > 0 ? (
          <div className="space-y-3">
            {pendingInvoices.map((invoice) => (
              <Link
                key={invoice.id}
                to={`/billing?editInvoiceId=${invoice.id}`}
                className="flex items-center justify-between p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg hover:bg-amber-500/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-sm">{invoice.customerName}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Phone className="w-3 h-3" />
                      <span>{invoice.customerPhone || 'No phone'}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-mono">{invoice.invoiceNumber}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-sm text-destructive">{formatCurrency(invoice.balance || 0)}</p>
                  <p className="text-xs text-muted-foreground">To Pay</p>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
            <Calendar className="w-10 h-10 mb-2" />
            <p>No pending bills for {formatDate(selectedDate)}</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Recent Invoices</h2>
            <Link to="/invoices" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {recentInvoices.length > 0 ? (
            <div className="space-y-3">
              {recentInvoices.map((invoice) => (
                <div
                  key={invoice.id}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{invoice.invoiceNumber}</p>
                      <p className="text-xs text-muted-foreground">{invoice.customerName}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm">{formatCurrency(invoice.grandTotal)}</p>
                    <p className="text-xs text-muted-foreground">{invoice.status}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Clock className="w-10 h-10 mb-2" />
              <p>No invoices yet</p>
              <Link to="/billing" className="text-primary text-sm hover:underline mt-1">
                Create your first bill
              </Link>
            </div>
          )}
        </div>

        {/* Low Stock Alert */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Low Stock Alert</h2>
            <Link to="/products" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowUpRight size={14} />
            </Link>
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="space-y-3">
              {lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="flex items-center justify-between p-3 bg-destructive/5 border border-destructive/20 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-destructive/10 flex items-center justify-center">
                      <Package className="w-5 h-5 text-destructive" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">Code: {product.code}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-sm text-destructive">
                      {product.stock} {product.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">remaining</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
              <Package className="w-10 h-10 mb-2" />
              <p>All products in stock</p>
            </div>
          )}
        </div>
      </div>
    </MainLayout>
  );
}
