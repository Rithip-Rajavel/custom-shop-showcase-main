import { useState, useEffect, useMemo } from 'react';
import {
  Search,
  HardHat,
  ChevronDown,
  ChevronUp,
  MapPin,
  Users,
  FileText,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Wallet,
  Filter,
  X,
  Gift,
  Eye,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
} from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCustomers } from '@/hooks/useCustomers';
import { useInvoices } from '@/hooks/useInvoices';
import { useCommissions } from '@/hooks/useCommissions';
import { useBonuses } from '@/hooks/useBonuses';
import { Customer, Invoice } from '@/types';
import { formatCurrency, formatDate } from '@/lib/utils';
import { apiGet } from '@/lib/api';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ContractorWithData extends Customer {
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  totalCommission: number;
  totalBonus: number;
  linkedCustomers: LinkedCustomer[];
  invoiceCount: number;
}

interface LinkedCustomer {
  id: string;
  name: string;
  phone: string;
  email?: string;
  city?: string;
  totalBilled: number;
  totalPaid: number;
  totalPending: number;
  invoices: Invoice[];
}

type SortOption = 'billed-high-low' | 'billed-low-high' | 'commission-high-low' | 'commission-low-high' | 'name-az' | 'name-za';
type FilterActivity = 'all' | 'active' | 'inactive';
type FilterBonus = 'all' | 'with-bonus' | 'without-bonus';

export default function ContractorBilling() {
  const { customers, isLoading: customersLoading } = useCustomers();
  const { invoices, isLoading: invoicesLoading } = useInvoices();
  const { getTotalCommission } = useCommissions();
  const { getTotalBonusByCustomerAndYear } = useBonuses();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('billed-high-low');
  const [filterCity, setFilterCity] = useState<string>('all');
  const [filterActivity, setFilterActivity] = useState<FilterActivity>('all');
  const [filterBonus, setFilterBonus] = useState<FilterBonus>('all');
  const [minBilledAmount, setMinBilledAmount] = useState<string>('');
  const [collapsedContractors, setCollapsedContractors] = useState<Set<string>>(new Set());
  const [contractorData, setContractorData] = useState<ContractorWithData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Get all contractors
  const contractors = useMemo(() => {
    return customers.filter((c) => c.type === 'contractor');
  }, [customers]);

  // Get all unique cities from contractors
  const availableCities = useMemo(() => {
    const cities = new Set<string>();
    contractors.forEach((c) => {
      if (c.city) cities.add(c.city);
    });
    return Array.from(cities).sort();
  }, [contractors]);

  // Fetch contractor data with linked customers and invoices
  useEffect(() => {
    const fetchContractorData = async () => {
      if (contractors.length === 0) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      const data: ContractorWithData[] = [];

      for (const contractor of contractors) {
        try {
          // Fetch contractor pending bills data from API
          const pendingBillsData = await apiGet<any>(`/api/contractors/${contractor.id}/pending-bills`).catch(() => null);
          console.log(`Contractor ${contractor.name} pending bills data:`, pendingBillsData);

          // Fetch total commission
          let totalCommission = 0;
          try {
            const commissionResult = await apiGet<{ total: number }>(`/api/commissions/contractor/${contractor.id}/total`);
            totalCommission = commissionResult?.total || 0;
          } catch {
            totalCommission = 0;
          }

          // Fetch total bonus for current year
          let totalBonus = 0;
          try {
            totalBonus = await getTotalBonusByCustomerAndYear(contractor.id, new Date().getFullYear());
          } catch {
            totalBonus = 0;
          }

          // Build linked customers data
          const linkedCustomers: LinkedCustomer[] = [];

          if (pendingBillsData?.linkedCustomers && pendingBillsData.linkedCustomers.length > 0) {
            for (const linkedCust of pendingBillsData.linkedCustomers) {
              const customerInvoices = invoices.filter(
                (inv) => inv.customerId === linkedCust.customerId || inv.contractorId === contractor.id
              );

              linkedCustomers.push({
                id: linkedCust.customerId,
                name: linkedCust.customerName,
                phone: linkedCust.customerPhone || '',
                email: linkedCust.customerEmail,
                city: linkedCust.customerCity,
                totalBilled: linkedCust.totalBilled || 0,
                totalPaid: linkedCust.totalPaid || 0,
                totalPending: linkedCust.totalPending || 0,
                invoices: customerInvoices.filter((inv) => inv.customerId === linkedCust.customerId),
              });
            }
          }

          // Calculate totals - use API data if available, otherwise calculate from linked customers
          let totalBilled = 0;
          let totalPaid = 0;
          let totalPending = 0;

          if (pendingBillsData?.grandTotalBilled !== undefined) {
            totalBilled = pendingBillsData.grandTotalBilled || 0;
            totalPaid = pendingBillsData.grandTotalPaid || 0;
            totalPending = pendingBillsData.grandTotalPending || 0;
          } else {
            // Fallback: calculate from linked customers
            totalBilled = linkedCustomers.reduce((sum, c) => sum + c.totalBilled, 0);
            totalPaid = linkedCustomers.reduce((sum, c) => sum + c.totalPaid, 0);
            totalPending = linkedCustomers.reduce((sum, c) => sum + c.totalPending, 0);
          }

          // If still no data, try to get from customer balance API
          if (totalBilled === 0 && totalPaid === 0 && totalPending === 0) {
            try {
              const balanceData = await apiGet<any>(`/api/customers/${contractor.id}/balance`);
              console.log(`Contractor ${contractor.name} balance data:`, balanceData);
              if (balanceData) {
                totalBilled = balanceData.totalBilled || 0;
                totalPaid = balanceData.totalPaid || 0;
                totalPending = balanceData.pendingBalance || 0;
              }
            } catch (e) {
              console.log(`Failed to fetch balance for contractor ${contractor.name}:`, e);
            }
          }

          data.push({
            ...contractor,
            totalBilled,
            totalPaid,
            totalPending,
            totalCommission,
            totalBonus,
            linkedCustomers,
            invoiceCount: linkedCustomers.reduce((sum, c) => sum + c.invoices.length, 0),
          });
        } catch (error) {
          console.error(`Failed to fetch data for contractor ${contractor.name}:`, error);
          // Add contractor with basic data
          data.push({
            ...contractor,
            totalBilled: 0,
            totalPaid: 0,
            totalPending: 0,
            totalCommission: 0,
            totalBonus: 0,
            linkedCustomers: [],
            invoiceCount: 0,
          });
        }
      }

      setContractorData(data);
      setIsLoading(false);
    };

    fetchContractorData();
  }, [contractors, invoices]);

  // Toggle contractor collapse
  const toggleContractorCollapse = (contractorId: string) => {
    setCollapsedContractors((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(contractorId)) {
        newSet.delete(contractorId);
      } else {
        newSet.add(contractorId);
      }
      return newSet;
    });
  };

  // Expand all
  const expandAll = () => {
    setCollapsedContractors(new Set());
  };

  // Collapse all
  const collapseAll = () => {
    setCollapsedContractors(new Set(filteredAndSortedContractors.map((c) => c.id)));
  };

  // Filter and sort contractors
  const filteredAndSortedContractors = useMemo(() => {
    let filtered = contractorData.filter((contractor) => {
      // Search filter
      const matchesSearch =
        !searchQuery ||
        contractor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        contractor.phone.includes(searchQuery) ||
        contractor.city?.toLowerCase().includes(searchQuery.toLowerCase());

      // City filter
      const matchesCity = filterCity === 'all' || contractor.city === filterCity;

      // Activity filter
      const matchesActivity =
        filterActivity === 'all' ||
        (filterActivity === 'active' && contractor.isActive !== false) ||
        (filterActivity === 'inactive' && contractor.isActive === false);

      // Bonus filter
      const matchesBonus =
        filterBonus === 'all' ||
        (filterBonus === 'with-bonus' && contractor.totalBonus > 0) ||
        (filterBonus === 'without-bonus' && contractor.totalBonus === 0);

      // Min billed amount filter
      const matchesMinBilled =
        !minBilledAmount || contractor.totalBilled >= parseFloat(minBilledAmount);

      return matchesSearch && matchesCity && matchesActivity && matchesBonus && matchesMinBilled;
    });

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'billed-high-low':
          return b.totalBilled - a.totalBilled;
        case 'billed-low-high':
          return a.totalBilled - b.totalBilled;
        case 'commission-high-low':
          return b.totalCommission - a.totalCommission;
        case 'commission-low-high':
          return a.totalCommission - b.totalCommission;
        case 'name-az':
          return a.name.localeCompare(b.name);
        case 'name-za':
          return b.name.localeCompare(a.name);
        default:
          return 0;
      }
    });

    return filtered;
  }, [contractorData, searchQuery, filterCity, filterActivity, filterBonus, minBilledAmount, sortBy]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSortBy('billed-high-low');
    setFilterCity('all');
    setFilterActivity('all');
    setFilterBonus('all');
    setMinBilledAmount('');
  };

  // Calculate totals
  const totals = useMemo(() => {
    return filteredAndSortedContractors.reduce(
      (acc, contractor) => ({
        count: acc.count + 1,
        totalBilled: acc.totalBilled + contractor.totalBilled,
        totalPaid: acc.totalPaid + contractor.totalPaid,
        totalPending: acc.totalPending + contractor.totalPending,
        totalCommission: acc.totalCommission + contractor.totalCommission,
        totalBonus: acc.totalBonus + contractor.totalBonus,
        linkedCustomers: acc.linkedCustomers + contractor.linkedCustomers.length,
      }),
      {
        count: 0,
        totalBilled: 0,
        totalPaid: 0,
        totalPending: 0,
        totalCommission: 0,
        totalBonus: 0,
        linkedCustomers: 0,
      }
    );
  }, [filteredAndSortedContractors]);

  if (isLoading || customersLoading || invoicesLoading) {
    return (
      <MainLayout>
        <PageHeader title="Contractor Billing" description="View all contractors with their linked customers and bills" />
        <div className="flex items-center justify-center py-20">
          <div className="text-muted-foreground">Loading contractor data...</div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <PageHeader
        title="Contractor Billing"
        description="View all contractors with their linked customers and bills"
      />

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Contractors</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold">{totals.count}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Billed</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-primary">{formatCurrency(totals.totalBilled)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-green-600">{formatCurrency(totals.totalPaid)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totals.totalPending)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Commission</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-amber-600">{formatCurrency(totals.totalCommission)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Bonus</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-2xl font-bold text-purple-600">{formatCurrency(totals.totalBonus)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader className="p-4 pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Filters & Sorting
            </CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={expandAll}>
                Expand All
              </Button>
              <Button variant="outline" size="sm" onClick={collapseAll}>
                Collapse All
              </Button>
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search contractors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Sort By */}
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full">
                <ArrowUpDown className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Sort by..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="billed-high-low">
                  <span className="flex items-center gap-2">
                    <ArrowDown className="w-3 h-3" />
                    Billed: High to Low
                  </span>
                </SelectItem>
                <SelectItem value="billed-low-high">
                  <span className="flex items-center gap-2">
                    <ArrowUp className="w-3 h-3" />
                    Billed: Low to High
                  </span>
                </SelectItem>
                <SelectItem value="commission-high-low">
                  <span className="flex items-center gap-2">
                    <ArrowDown className="w-3 h-3" />
                    Commission: High to Low
                  </span>
                </SelectItem>
                <SelectItem value="commission-low-high">
                  <span className="flex items-center gap-2">
                    <ArrowUp className="w-3 h-3" />
                    Commission: Low to High
                  </span>
                </SelectItem>
                <SelectItem value="name-az">Name: A to Z</SelectItem>
                <SelectItem value="name-za">Name: Z to A</SelectItem>
              </SelectContent>
            </Select>

            {/* City Filter */}
            <Select value={filterCity} onValueChange={setFilterCity}>
              <SelectTrigger className="w-full">
                <MapPin className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by city..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {availableCities.map((city) => (
                  <SelectItem key={city} value={city}>
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Activity Filter */}
            <Select value={filterActivity} onValueChange={(v) => setFilterActivity(v as FilterActivity)}>
              <SelectTrigger className="w-full">
                <Building2 className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by status..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active Only</SelectItem>
                <SelectItem value="inactive">Inactive Only</SelectItem>
              </SelectContent>
            </Select>

            {/* Bonus Filter */}
            <Select value={filterBonus} onValueChange={(v) => setFilterBonus(v as FilterBonus)}>
              <SelectTrigger className="w-full">
                <Gift className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Filter by bonus..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Contractors</SelectItem>
                <SelectItem value="with-bonus">With Bonus</SelectItem>
                <SelectItem value="without-bonus">Without Bonus</SelectItem>
              </SelectContent>
            </Select>

            {/* Min Billed Amount */}
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="number"
                placeholder="Min billed amount"
                value={minBilledAmount}
                onChange={(e) => setMinBilledAmount(e.target.value)}
                className="pl-9"
                min="0"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contractors List */}
      {filteredAndSortedContractors.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <HardHat className="w-16 h-16 mb-4" />
          <p className="text-lg">No contractors found</p>
          <p className="text-sm">
            {searchQuery || filterCity !== 'all' || filterActivity !== 'all' || filterBonus !== 'all' || minBilledAmount
              ? 'Try adjusting your filters'
              : 'Add contractors to see them here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredAndSortedContractors.map((contractor) => {
            const isCollapsed = collapsedContractors.has(contractor.id);

            return (
              <div
                key={contractor.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                {/* Contractor Header */}
                <button
                  onClick={() => toggleContractorCollapse(contractor.id)}
                  className="w-full px-4 py-4 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                      <HardHat className="w-6 h-6 text-amber-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">{contractor.name}</h3>
                        <Badge variant={contractor.isActive !== false ? 'default' : 'secondary'}>
                          {contractor.isActive !== false ? 'Active' : 'Inactive'}
                        </Badge>
                        {contractor.totalBonus > 0 && (
                          <Badge variant="outline" className="border-purple-500 text-purple-600">
                            <Gift className="w-3 h-3 mr-1" />
                            Bonus: {formatCurrency(contractor.totalBonus)}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span>{contractor.phone}</span>
                        {contractor.city && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {contractor.city}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {contractor.linkedCustomers.length} linked customers
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-6 text-sm">
                      <div className="text-right">
                        <p className="text-muted-foreground">Total Billed</p>
                        <p className="font-semibold text-primary">{formatCurrency(contractor.totalBilled)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Paid</p>
                        <p className="font-semibold text-green-600">{formatCurrency(contractor.totalPaid)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Pending</p>
                        <p className={`font-semibold ${contractor.totalPending > 0 ? 'text-destructive' : 'text-green-600'}`}>
                          {formatCurrency(contractor.totalPending)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-muted-foreground">Commission</p>
                        <p className="font-semibold text-amber-600">{formatCurrency(contractor.totalCommission)}</p>
                      </div>
                    </div>
                    {isCollapsed ? (
                      <ChevronDown className="w-5 h-5 text-muted-foreground" />
                    ) : (
                      <ChevronUp className="w-5 h-5 text-muted-foreground" />
                    )}
                  </div>
                </button>

                {/* Contractor Details (Collapsible) */}
                {!isCollapsed && (
                  <div className="border-t border-border">
                    {contractor.linkedCustomers.length === 0 ? (
                      <div className="p-8 text-center text-muted-foreground">
                        <Users className="w-12 h-12 mx-auto mb-4" />
                        <p>No linked customers found</p>
                      </div>
                    ) : (
                      <div className="divide-y divide-border">
                        {contractor.linkedCustomers.map((customer) => (
                          <div key={customer.id} className="p-4">
                            {/* Customer Header */}
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                  <Users className="w-4 h-4 text-blue-500" />
                                </div>
                                <div>
                                  <h4 className="font-medium">{customer.name}</h4>
                                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                    <span>{customer.phone}</span>
                                    {customer.city && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {customer.city}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4 text-sm">
                                <div className="text-right">
                                  <p className="text-muted-foreground">Billed</p>
                                  <p className="font-medium">{formatCurrency(customer.totalBilled)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-muted-foreground">Paid</p>
                                  <p className="font-medium text-green-600">{formatCurrency(customer.totalPaid)}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-muted-foreground">Pending</p>
                                  <p className={`font-medium ${customer.totalPending > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                    {formatCurrency(customer.totalPending)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            {/* Customer Invoices Table */}
                            {customer.invoices.length > 0 ? (
                              <div className="overflow-x-auto bg-muted/20 rounded-lg">
                                <table className="w-full">
                                  <thead className="bg-muted/50">
                                    <tr>
                                      <th className="text-left p-2 text-xs font-medium text-muted-foreground">Date</th>
                                      <th className="text-left p-2 text-xs font-medium text-muted-foreground">Invoice #</th>
                                      <th className="text-right p-2 text-xs font-medium text-muted-foreground">Amount</th>
                                      <th className="text-right p-2 text-xs font-medium text-muted-foreground">Paid</th>
                                      <th className="text-right p-2 text-xs font-medium text-muted-foreground">Balance</th>
                                      <th className="text-center p-2 text-xs font-medium text-muted-foreground">Status</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {customer.invoices.map((invoice) => (
                                      <tr key={invoice.id} className="border-t border-border/50">
                                        <td className="p-2 text-sm">
                                          {formatDate(invoice.createdAt)}
                                        </td>
                                        <td className="p-2 text-sm font-mono">
                                          {invoice.invoiceNumber}
                                        </td>
                                        <td className="p-2 text-sm text-right">
                                          {formatCurrency(invoice.grandTotal)}
                                        </td>
                                        <td className="p-2 text-sm text-right text-green-600">
                                          {formatCurrency(invoice.amountPaid || 0)}
                                        </td>
                                        <td className={`p-2 text-sm text-right ${(invoice.balance || 0) > 0 ? 'text-destructive' : 'text-green-600'}`}>
                                          {formatCurrency(invoice.balance || 0)}
                                        </td>
                                        <td className="p-2 text-center">
                                          <Badge
                                            variant="outline"
                                            className={`text-xs ${invoice.status === 'paid'
                                              ? 'border-green-500 text-green-600'
                                              : invoice.status === 'pending'
                                                ? 'border-amber-500 text-amber-600'
                                                : 'border-destructive text-destructive'
                                              }`}
                                          >
                                            {invoice.status}
                                          </Badge>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="py-4 text-center text-sm text-muted-foreground bg-muted/20 rounded-lg">
                                <FileText className="w-6 h-6 mx-auto mb-2" />
                                No invoices for this customer
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </MainLayout>
  );
}
