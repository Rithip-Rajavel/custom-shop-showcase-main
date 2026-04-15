import { useState, useEffect } from 'react';
import { UserPlus, Search, User, AlertTriangle, HardHat, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Customer } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';

interface CustomerSelectProps {
  customers: Customer[];
  selectedCustomer: Customer | null;
  onSelectCustomer: (customer: Customer) => void;
  onAddCustomer: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => Customer;
  getCustomerBalance?: (customerId: string) => { pendingBalance: number } | null;
  contractors?: Customer[]; // List of contractors to link customer to
}

export function CustomerSelect({
  customers,
  selectedCustomer,
  onSelectCustomer,
  onAddCustomer,
  getCustomerBalance,
  contractors = [],
}: CustomerSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'customer' | 'contractor'>('all');
  const [newCustomer, setNewCustomer] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    type: 'customer' as 'customer' | 'contractor',
    contractorId: '',
  });

  const filteredCustomers = customers.filter((c) => {
    const matchesSearch = !searchQuery ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery);
    const matchesType = filterType === 'all' || c.type === filterType || c.id === 'walk-in';
    return matchesSearch && matchesType;
  });

  const handleAddCustomer = () => {
    if (!newCustomer.name) return;
    const customerData = {
      ...newCustomer,
      contractorId: newCustomer.contractorId || undefined,
    };
    const customer = onAddCustomer(customerData);
    onSelectCustomer(customer);
    setNewCustomer({ name: '', phone: '', email: '', address: '', type: 'customer', contractorId: '' });
    setIsAddingNew(false);
    setIsOpen(false);
  };

  const selectedCustomerBalance = selectedCustomer && getCustomerBalance
    ? getCustomerBalance(selectedCustomer.id)
    : null;

  const getTypeIcon = (type?: string) => {
    if (type === 'contractor') return <HardHat className="w-4 h-4 text-amber-500" />;
    return <User className="w-4 h-4 text-muted-foreground" />;
  };

  const getTypeBadge = (type?: string) => {
    if (type === 'contractor') {
      return <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 font-medium">Contractor</span>;
    }
    return <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600 font-medium">Customer</span>;
  };

  return (
    <div className="space-y-2">
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="w-full justify-start h-12 text-left">
            {selectedCustomer ? getTypeIcon(selectedCustomer.type) : <User className="w-5 h-5 text-muted-foreground" />}
            <div className="ml-3 flex-1">
              {selectedCustomer ? (
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{selectedCustomer.name}</span>
                    {selectedCustomer.id !== 'walk-in' && getTypeBadge(selectedCustomer.type)}
                  </div>
                  {selectedCustomer.phone && (
                    <div className="text-xs text-muted-foreground">{selectedCustomer.phone}</div>
                  )}
                </div>
              ) : (
                <span className="text-muted-foreground">Select Customer / Contractor</span>
              )}
            </div>
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{isAddingNew ? 'Add New' : 'Select Customer / Contractor'}</DialogTitle>
          </DialogHeader>

          {isAddingNew ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={newCustomer.type}
                  onValueChange={(v) => setNewCustomer({ ...newCustomer, type: v as 'customer' | 'contractor', contractorId: '' })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="contractor">Contractor</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Show contractor selection only for customers (not contractors) */}
              {newCustomer.type === 'customer' && contractors.length > 0 && (
                <div className="space-y-2">
                  <Label>Link to Contractor (Optional)</Label>
                  <Select
                    value={newCustomer.contractorId || '_none_'}
                    onValueChange={(v) => setNewCustomer({ ...newCustomer, contractorId: v === '_none_' ? '' : v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a contractor (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none_">No Contractor</SelectItem>
                      {contractors.map((contractor) => (
                        <SelectItem key={contractor.id} value={contractor.id}>
                          {contractor.name} ({contractor.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Link this customer to a contractor for contractor-managed billing
                  </p>
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={newCustomer.name}
                  onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
                  placeholder={newCustomer.type === 'contractor' ? 'Contractor name' : 'Customer name'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={newCustomer.phone}
                  onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
                  placeholder="Phone number"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setIsAddingNew(false)} className="flex-1">
                  Cancel
                </Button>
                <Button onClick={handleAddCustomer} className="flex-1">
                  Add {newCustomer.type === 'contractor' ? 'Contractor' : 'Customer'}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or phone..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>

              {/* Filter by type */}
              <div className="flex gap-1">
                {(['all', 'customer', 'contractor'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilterType(t)}
                    className={cn(
                      'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                      filterType === t
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted text-muted-foreground hover:bg-muted/80'
                    )}
                  >
                    {t === 'all' ? 'All' : t === 'customer' ? 'Customers' : 'Contractors'}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => setIsAddingNew(true)}
              >
                <UserPlus className="w-4 h-4 mr-2" />
                Add New Customer / Contractor
              </Button>

              <div className="max-h-60 overflow-y-auto space-y-1">
                {filteredCustomers.map((customer) => {
                  const balance = getCustomerBalance ? getCustomerBalance(customer.id) : null;
                  const hasDue = balance && balance.pendingBalance > 0;

                  return (
                    <button
                      key={customer.id}
                      onClick={() => {
                        onSelectCustomer(customer);
                        setIsOpen(false);
                      }}
                      className={cn(
                        'w-full px-3 py-2 text-left rounded-lg hover:bg-muted transition-colors',
                        selectedCustomer?.id === customer.id && 'bg-muted'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(customer.type)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{customer.name}</span>
                              {customer.id !== 'walk-in' && getTypeBadge(customer.type)}
                            </div>
                            {customer.phone && (
                              <div className="text-sm text-muted-foreground">{customer.phone}</div>
                            )}
                          </div>
                        </div>
                        {hasDue && (
                          <div className="flex items-center gap-1 text-destructive">
                            <AlertTriangle size={14} />
                            <span className="text-xs font-medium">
                              {formatCurrency(balance.pendingBalance)}
                            </span>
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Show pending balance alert */}
      {selectedCustomer && selectedCustomerBalance && selectedCustomerBalance.pendingBalance > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-destructive">
              Pending Due: {formatCurrency(selectedCustomerBalance.pendingBalance)}
            </p>
            <p className="text-xs text-muted-foreground">
              This {selectedCustomer.type === 'contractor' ? 'contractor' : 'customer'} has an outstanding balance
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
