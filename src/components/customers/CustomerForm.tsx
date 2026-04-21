import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Customer } from '@/types';
import { Search } from 'lucide-react';

interface CustomerFormProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: Customer | null;
  defaultType?: 'customer' | 'contractor';
  onSave: (customer: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate?: (id: string, updates: Partial<Customer>) => void;
  contractors?: Customer[]; // List of contractors to link customer to
}

export function CustomerForm({ isOpen, onClose, customer, defaultType = 'customer', onSave, onUpdate, contractors = [] }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    type: defaultType as 'customer' | 'contractor',
    contractorId: '',
  });
  const [contractorSearchQuery, setContractorSearchQuery] = useState('');

  // Filter contractors by name, phone, or city
  const filteredContractors = useMemo(() => {
    if (!contractorSearchQuery) return contractors;
    const query = contractorSearchQuery.toLowerCase();
    return contractors.filter((contractor) =>
      contractor.name.toLowerCase().includes(query) ||
      contractor.phone.includes(query) ||
      (contractor.city && contractor.city.toLowerCase().includes(query))
    );
  }, [contractors, contractorSearchQuery]);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        phone: customer.phone,
        email: customer.email || '',
        address: customer.address || '',
        city: customer.city || '',
        type: customer.type || 'customer',
        contractorId: customer.contractorId || '',
      });
    } else {
      setFormData({
        name: '',
        phone: '',
        email: '',
        address: '',
        city: '',
        type: defaultType,
        contractorId: '',
      });
    }
  }, [customer, defaultType]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    const customerData = {
      ...formData,
      contractorId: formData.contractorId || undefined,
    };

    if (customer && onUpdate) {
      onUpdate(customer.id, customerData);
    } else {
      onSave(customerData);
    }
    onClose();
  };

  const isContractor = formData.type === 'contractor';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {customer ? `Edit ${isContractor ? 'Contractor' : 'Customer'}` : `Add New ${formData.type === 'contractor' ? 'Contractor' : 'Customer'}`}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(v) => setFormData({ ...formData, type: v as 'customer' | 'contractor', contractorId: '' })}
              disabled={!!customer}
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
          {formData.type === 'customer' && contractors.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="contractorId">Link to Contractor (Optional)</Label>
              {/* Search input for contractors */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, phone, or city..."
                  value={contractorSearchQuery}
                  onChange={(e) => setContractorSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select
                value={formData.contractorId || '_none_'}
                onValueChange={(v) => setFormData({ ...formData, contractorId: v === '_none_' ? '' : v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a contractor (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none_">No Contractor</SelectItem>
                  {filteredContractors.length > 0 ? (
                    filteredContractors.map((contractor) => (
                      <SelectItem key={contractor.id} value={contractor.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{contractor.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {contractor.phone} {contractor.city ? `• ${contractor.city}` : ''}
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      No contractors found
                    </div>
                  )}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Link this customer to a contractor for contractor-managed billing
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="name">{isContractor ? 'Contractor' : 'Customer'} Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Phone number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email address"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Address"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input
              id="city"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              placeholder="City"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {customer ? 'Update' : 'Add'} {formData.type === 'contractor' ? 'Contractor' : 'Customer'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
