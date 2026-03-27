import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Users, FileText, ArrowRight, Wallet, HardHat, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { CustomerForm } from '@/components/customers/CustomerForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useCustomers } from '@/hooks/useCustomers';
import { useInvoices } from '@/hooks/useInvoices';
import { useCommissions } from '@/hooks/useCommissions';
import { Customer } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { apiGet } from '@/lib/api';

export default function Customers() {
  const { customers, addCustomer, updateCustomer, deleteCustomer } = useCustomers();
  const { getInvoicesByCustomer, getCustomerBalance } = useInvoices();
  const { getTotalCommission } = useCommissions();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [deletingCustomer, setDeletingCustomer] = useState<Customer | null>(null);
  const [activeTab, setActiveTab] = useState<string>('customers');
  const [formDefaultType, setFormDefaultType] = useState<'customer' | 'contractor'>('customer');
  const [customerBalances, setCustomerBalances] = useState<Record<string, any>>({});
  const [customerCommissions, setCustomerCommissions] = useState<Record<string, number>>({});

  // Fetch all customer balances and commissions from API
  useEffect(() => {
    const fetchAllData = async () => {
      const balances: Record<string, any> = {};
      const commissions: Record<string, number> = {};

      for (const customer of customers) {
        if (customer.id !== 'walk-in') {
          try {
            // Fetch balance
            const balance = await apiGet(`/api/customers/${customer.id}/balance`);
            balances[customer.id] = balance;
          } catch (error) {
            console.error(`Failed to fetch balance for ${customer.name}:`, error);
            // Fallback to localStorage
            const fallbackBalance = getCustomerBalance(customer.id);
            balances[customer.id] = fallbackBalance;
          }

          // Fetch commission for contractors
          if (customer.type === 'contractor') {
            try {
              const commission = await getTotalCommission(customer.id);
              commissions[customer.id] = commission;
            } catch (error) {
              console.error(`Failed to fetch commission for ${customer.name}:`, error);
              commissions[customer.id] = 0;
            }
          }
        }
      }

      setCustomerBalances(balances);
      setCustomerCommissions(commissions);
    };

    fetchAllData();
  }, [customers]);

  const filterByType = (type: 'customer' | 'contractor') => {
    return customers.filter((c) => {
      if (type === 'customer' && c.id === 'walk-in') return true;
      return (c.type || 'customer') === type;
    });
  };

  const filterBySearch = (list: Customer[]) => {
    if (!searchQuery) return list;
    return list.filter(
      (c) =>
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.includes(searchQuery)
    );
  };

  const handleAddCustomer = (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    addCustomer(customer);
    toast({ title: `${customer.type === 'contractor' ? 'Contractor' : 'Customer'} Added`, description: `${customer.name} has been added successfully` });
  };

  const handleUpdateCustomer = (id: string, updates: Partial<Customer>) => {
    updateCustomer(id, updates);
    toast({ title: 'Updated', description: 'Record has been updated successfully' });
  };

  const handleDeleteCustomer = () => {
    if (deletingCustomer) {
      deleteCustomer(deletingCustomer.id);
      toast({ title: 'Deleted', description: `${deletingCustomer.name} has been deleted` });
      setDeletingCustomer(null);
    }
  };

  const openAddForm = (type: 'customer' | 'contractor') => {
    setFormDefaultType(type);
    setEditingCustomer(null);
    setIsFormOpen(true);
  };

  const openEditForm = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormDefaultType(customer.type || 'customer');
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingCustomer(null);
  };

  const getCustomerStats = (customerId: string) => {
    const customerInvoices = getInvoicesByCustomer(customerId);
    const balance = customerBalances[customerId] || { totalBilled: 0, pendingBalance: 0 };
    return {
      totalInvoices: customerInvoices.length,
      totalSpent: balance.totalBilled || 0,
      pendingBalance: balance.pendingBalance || 0,
      lastPurchase: customerInvoices[0]?.createdAt,
    };
  };

  const renderList = (list: Customer[], type: 'customer' | 'contractor') => {
    const filtered = filterBySearch(list);

    if (filtered.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          {type === 'contractor' ? <HardHat className="w-16 h-16 mb-4" /> : <Users className="w-16 h-16 mb-4" />}
          <p className="text-lg">No {type === 'contractor' ? 'contractors' : 'customers'} found</p>
          <p className="text-sm">
            {searchQuery ? 'Try a different search term' : `Add your first ${type} to get started`}
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {filtered.map((customer) => {
          const stats = getCustomerStats(customer.id);
          const isWalkIn = customer.id === 'walk-in';
          const totalCommission = type === 'contractor' ? customerCommissions[customer.id] || 0 : 0;

          return (
            <div key={customer.id} className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${type === 'contractor' ? 'bg-amber-500/10' : 'bg-primary/10'
                    }`}>
                    {type === 'contractor' ? (
                      <HardHat className="w-6 h-6 text-amber-500" />
                    ) : (
                      <User className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{customer.name}</h3>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${type === 'contractor' ? 'bg-amber-500/10 text-amber-600' : 'bg-blue-500/10 text-blue-600'
                        }`}>
                        {type === 'contractor' ? 'Contractor' : 'Customer'}
                      </span>
                    </div>
                    {customer.phone && <p className="text-sm text-muted-foreground">{customer.phone}</p>}
                    {customer.email && <p className="text-sm text-muted-foreground">{customer.email}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  <div className="text-sm">
                    <p className="text-muted-foreground">Invoices</p>
                    <p className="font-semibold">{stats.totalInvoices}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Total Billed</p>
                    <p className="font-semibold text-primary">{formatCurrency(stats.totalSpent)}</p>
                  </div>
                  {stats.pendingBalance > 0 && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Pending</p>
                      <p className="font-semibold text-destructive">{formatCurrency(stats.pendingBalance)}</p>
                    </div>
                  )}
                  {type === 'contractor' && totalCommission > 0 && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Commission</p>
                      <p className="font-semibold text-amber-600">{formatCurrency(totalCommission)}</p>
                    </div>
                  )}
                  {stats.lastPurchase && (
                    <div className="text-sm">
                      <p className="text-muted-foreground">Last Purchase</p>
                      <p className="font-semibold">{formatDate(stats.lastPurchase)}</p>
                    </div>
                  )}

                  <div className="flex gap-1 ml-auto">
                    {stats.totalInvoices > 0 && (
                      <Link to={`/customers/${customer.id}`}>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Wallet size={16} />
                          <span className="hidden sm:inline">Ledger</span>
                        </Button>
                      </Link>
                    )}
                    {stats.totalInvoices > 0 && (
                      <Link to={`/invoices?customer=${customer.id}`}>
                        <Button variant="ghost" size="sm" className="gap-1">
                          <FileText size={16} />
                          <span className="hidden sm:inline">Invoices</span>
                          <ArrowRight size={14} />
                        </Button>
                      </Link>
                    )}
                    {!isWalkIn && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => openEditForm(customer)} className="h-8 w-8 p-0">
                          <Edit2 size={16} />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => setDeletingCustomer(customer)} className="h-8 w-8 p-0 text-destructive hover:text-destructive">
                          <Trash2 size={16} />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <MainLayout>
      <PageHeader
        title="Customers & Contractors"
        description="Manage your customers and contractors"
      />

      {/* Search */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="customers" className="gap-2">
              <User size={16} />
              Customers ({filterByType('customer').length})
            </TabsTrigger>
            <TabsTrigger value="contractors" className="gap-2">
              <HardHat size={16} />
              Contractors ({filterByType('contractor').length})
            </TabsTrigger>
          </TabsList>

          <Button onClick={() => openAddForm(activeTab === 'contractors' ? 'contractor' : 'customer')} className="gap-2">
            <Plus size={18} />
            Add {activeTab === 'contractors' ? 'Contractor' : 'Customer'}
          </Button>
        </div>

        <TabsContent value="customers">
          {renderList(filterByType('customer'), 'customer')}
        </TabsContent>

        <TabsContent value="contractors">
          {renderList(filterByType('contractor'), 'contractor')}
        </TabsContent>
      </Tabs>

      {/* Form Modal */}
      <CustomerForm
        isOpen={isFormOpen}
        onClose={closeForm}
        customer={editingCustomer}
        defaultType={formDefaultType}
        onSave={handleAddCustomer}
        onUpdate={handleUpdateCustomer}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingCustomer} onOpenChange={() => setDeletingCustomer(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deletingCustomer?.type === 'contractor' ? 'Contractor' : 'Customer'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingCustomer?.name}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteCustomer} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
