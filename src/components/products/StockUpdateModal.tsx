import { useState } from 'react';
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
import { Product, UpdateStockRequest } from '@/types';

interface StockUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onUpdate: (productId: string, stockData: UpdateStockRequest) => void;
}

export function StockUpdateModal({ isOpen, onClose, product, onUpdate }: StockUpdateModalProps) {
  const [quantity, setQuantity] = useState('');
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [cashAmount, setCashAmount] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !quantity) return;

    const stockData: UpdateStockRequest = {
      quantity: parseFloat(quantity),
      operation,
      cashAmount: operation === 'subtract' && cashAmount ? parseFloat(cashAmount) : undefined,
      notes: notes || undefined,
    };

    onUpdate(product.id, stockData);
    onClose();
    setQuantity('');
    setCashAmount('');
    setNotes('');
    setOperation('add');
  };

  const handleClose = () => {
    onClose();
    setQuantity('');
    setCashAmount('');
    setNotes('');
    setOperation('add');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Stock - {product?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="operation">Operation</Label>
            <Select
              value={operation}
              onValueChange={(v) => setOperation(v as 'add' | 'subtract')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="add">Add Stock</SelectItem>
                <SelectItem value="subtract">Subtract Stock</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="quantity">Quantity *</Label>
            <Input
              id="quantity"
              type="number"
              min="0"
              step="0.01"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="Enter quantity"
              required
            />
          </div>

          {operation === 'subtract' && (
            <div className="space-y-2">
              <Label htmlFor="cashAmount">Cash Amount (Optional)</Label>
              <Input
                id="cashAmount"
                type="number"
                min="0"
                step="0.01"
                value={cashAmount}
                onChange={(e) => setCashAmount(e.target.value)}
                placeholder="Enter cash amount received"
              />
              <p className="text-xs text-muted-foreground">
                Amount received when stock is sold/decreased
              </p>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for stock change (e.g., production batch, sold to customer)"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Update Stock
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
