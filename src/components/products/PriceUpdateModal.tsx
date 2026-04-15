import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Product, UpdatePriceRequest } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface PriceUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onUpdate: (productId: string, priceData: UpdatePriceRequest) => void;
}

export function PriceUpdateModal({ isOpen, onClose, product, onUpdate }: PriceUpdateModalProps) {
  const [newPrice, setNewPrice] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product || !newPrice) return;

    const priceData: UpdatePriceRequest = {
      newPrice: parseFloat(newPrice),
      notes: notes || undefined,
    };

    onUpdate(product.id, priceData);
    onClose();
    setNewPrice('');
    setNotes('');
  };

  const handleClose = () => {
    onClose();
    setNewPrice('');
    setNotes('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Price - {product?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="currentPrice">Current Price</Label>
            <Input
              id="currentPrice"
              value={formatCurrency(product?.price || 0)}
              disabled
              className="bg-muted"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="newPrice">New Price *</Label>
            <Input
              id="newPrice"
              type="number"
              min="0"
              step="0.01"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              placeholder="Enter new price"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reason for price change (e.g., supplier cost increased, promotional price)"
              rows={3}
            />
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Update Price
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
