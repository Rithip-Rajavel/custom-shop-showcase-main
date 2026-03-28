import { useState } from 'react';
import { Edit, DollarSign } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { BillItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ChangePriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: BillItem;
  onPriceChange: (newPrice: number) => void;
}

export function ChangePriceModal({ isOpen, onClose, item, onPriceChange }: ChangePriceModalProps) {
  const [newPrice, setNewPrice] = useState(item.price.toString());
  const [error, setError] = useState('');

  const handleSubmit = () => {
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
      setError('Please enter a valid price');
      return;
    }

    onPriceChange(price);
    onClose();
  };

  const handleCancel = () => {
    setNewPrice(item.price.toString());
    setError('');
    onClose();
  };

  const priceDifference = parseFloat(newPrice) - item.originalPrice;
  const priceDifferencePercent = item.originalPrice > 0 
    ? (priceDifference / item.originalPrice) * 100 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={handleCancel}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Change Price
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Product Info */}
          <div className="bg-muted/30 rounded-lg p-3">
            <div className="font-medium">{item.productName}</div>
            <div className="text-sm text-muted-foreground">{item.productCode}</div>
            {item.lastPurchasedPrice !== undefined && (
              <div className="text-sm text-amber-600 mt-1">
                Last Price: {formatCurrency(item.lastPurchasedPrice)}
              </div>
            )}
          </div>

          {/* Price Input */}
          <div className="space-y-2">
            <Label htmlFor="newPrice">New Price (₹)</Label>
            <Input
              id="newPrice"
              type="number"
              min="0"
              step="0.01"
              value={newPrice}
              onChange={(e) => {
                setNewPrice(e.target.value);
                setError('');
              }}
              className={error ? 'border-destructive' : ''}
              placeholder="Enter new price"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
          </div>

          {/* Price Comparison */}
          <div className="space-y-2 border-t pt-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Original Price:</span>
              <span>{formatCurrency(item.originalPrice)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Current Price:</span>
              <span>{formatCurrency(item.price)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium">
              <span>New Price:</span>
              <span className="text-primary">{formatCurrency(parseFloat(newPrice) || 0)}</span>
            </div>
            {parseFloat(newPrice) > 0 && (
              <div className="flex justify-between text-sm pt-2 border-t">
                <span className="text-muted-foreground">Difference:</span>
                <span className={priceDifference >= 0 ? 'text-green-600' : 'text-red-600'}>
                  {priceDifference >= 0 ? '+' : ''}{formatCurrency(priceDifference)}
                  {' '}({priceDifferencePercent >= 0 ? '+' : ''}{priceDifferencePercent.toFixed(1)}%)
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={handleCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="flex-1 gap-2">
              <Edit size={16} />
              Change Price
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
