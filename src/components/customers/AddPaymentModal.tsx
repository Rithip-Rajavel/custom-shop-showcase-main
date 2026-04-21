import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PaymentMethod } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { toast } from 'sonner';

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  customerName: string;
  currentBalance: number;
  onSubmit: (amount: number, paymentMethod: PaymentMethod, notes?: string, nextPayDate?: string) => void;
}

export function AddPaymentModal({
  isOpen,
  onClose,
  customerName,
  currentBalance,
  onSubmit,
}: AddPaymentModalProps) {
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [notes, setNotes] = useState('');
  const [nextPayDate, setNextPayDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const paymentAmount = parseFloat(amount);

    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (paymentAmount > currentBalance) {
      toast.error(`Amount cannot exceed current balance of ${formatCurrency(currentBalance)}`);
      return;
    }

    setIsSubmitting(true);
    onSubmit(paymentAmount, paymentMethod, notes || undefined, nextPayDate || undefined);

    // Reset form
    setAmount('');
    setPaymentMethod('cash');
    setNotes('');
    setNextPayDate('');
    setIsSubmitting(false);
    onClose();
  };

  const handleClose = () => {
    setAmount('');
    setPaymentMethod('cash');
    setNotes('');
    setNextPayDate('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Customer:</span>
              <span className="font-medium">{customerName}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Balance:</span>
              <span className="font-bold text-destructive">{formatCurrency(currentBalance)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Payment Amount *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={currentBalance}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Enter amount"
              autoFocus
              required
            />
            {amount && parseFloat(amount) > 0 && (
              <p className="text-xs text-muted-foreground">
                Balance after payment: {formatCurrency(currentBalance - parseFloat(amount))}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paymentMethod">Payment Method *</Label>
            <Select value={paymentMethod} onValueChange={(v) => setPaymentMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="upi">UPI</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this payment..."
              rows={2}
            />
          </div>

          {amount && parseFloat(amount) < currentBalance && (
            <div className="space-y-2">
              <Label htmlFor="nextPayDate">Next Pay Date</Label>
              <Input
                id="nextPayDate"
                type="date"
                value={nextPayDate}
                onChange={(e) => setNextPayDate(e.target.value)}
                placeholder="Select next payment date"
              />
              <p className="text-xs text-muted-foreground">
                Recommended when payment is not full
              </p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting || !amount} className="flex-1">
              Record Payment
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
