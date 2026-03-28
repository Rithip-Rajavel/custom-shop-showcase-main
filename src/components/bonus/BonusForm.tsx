import { useState, useEffect } from 'react';
import { DollarSign, Plus, Calendar, Users, TrendingUp, Award } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bonus } from '@/types/bonus';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useBonuses } from '@/hooks/useBonuses';
import { useCustomers } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/use-toast';

interface BonusFormProps {
  isOpen: boolean;
  onClose: () => void;
  bonus?: Bonus | null;
  customers: any[];
  onSubmit: (data: {
    customerId: string;
    bonusAmount: number;
    bonusMonth: number;
    bonusYear: number;
    reason: string;
  }) => void;
}

export function BonusForm({ isOpen, onClose, bonus, customers, onSubmit }: BonusFormProps) {
  const { createBonus } = useBonuses();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    customerId: '',
    bonusAmount: 0,
    bonusMonth: new Date().getMonth() + 1,
    bonusYear: new Date().getFullYear(),
    reason: '',
  });

  useEffect(() => {
    if (bonus) {
      setFormData({
        customerId: bonus.customerId,
        bonusAmount: bonus.bonusAmount,
        bonusMonth: bonus.bonusMonth,
        bonusYear: bonus.bonusYear,
        reason: bonus.reason,
      });
    } else {
      setFormData({
        customerId: '',
        bonusAmount: 0,
        bonusMonth: new Date().getMonth() + 1,
        bonusYear: new Date().getFullYear(),
        reason: '',
      });
    }
  }, [bonus]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || formData.bonusAmount <= 0 || !formData.reason.trim()) {
      toast({ title: 'Error', description: 'Please fill all required fields', variant: 'destructive' });
      return;
    }

    onSubmit(formData);
    onClose();
  };

  // Generate months for dropdown (current year and previous/next year)
  const generateMonths = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.map((month, index) => ({
      value: index + 1,
      label: month,
    }));
  };

  // Generate years for dropdown (current year ± 2)
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push({
        value: i,
        label: i.toString(),
      });
    }
    return years;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-green-500" />
            {bonus ? 'Edit Bonus' : 'Add Bonus'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="customer">Customer *</Label>
            <Select
              value={formData.customerId}
              onValueChange={(value) => setFormData({ ...formData, customerId: value })}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select customer" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name} ({customer.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bonusAmount">Bonus Amount (₹) *</Label>
              <Input
                id="bonusAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.bonusAmount}
                onChange={(e) => setFormData({ ...formData, bonusAmount: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bonusMonth">Month *</Label>
              <Select
                value={formData.bonusMonth.toString()}
                onValueChange={(value) => setFormData({ ...formData, bonusMonth: parseInt(value) })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {generateMonths().map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bonusYear">Year *</Label>
            <Select
              value={formData.bonusYear.toString()}
              onValueChange={(value) => setFormData({ ...formData, bonusYear: parseInt(value) })}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {generateYears().map((year) => (
                  <SelectItem key={year.value} value={year.value.toString()}>
                    {year.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">Reason *</Label>
            <Textarea
              id="reason"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              placeholder="Enter reason for bonus..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {bonus ? 'Update Bonus' : 'Add Bonus'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
