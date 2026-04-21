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
import { Product, UpdateStockRequest, UpdatePriceRequest } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface ProductUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onUpdateStock: (productId: string, stockData: UpdateStockRequest) => void;
  onUpdatePrice: (productId: string, priceData: UpdatePriceRequest) => void;
}

export function ProductUpdateModal({ isOpen, onClose, product, onUpdateStock, onUpdatePrice }: ProductUpdateModalProps) {
  // Stock state
  const [quantity, setQuantity] = useState('');
  const [operation, setOperation] = useState<'add' | 'subtract'>('add');
  const [cashAmount, setCashAmount] = useState('');
  const [stockNotes, setStockNotes] = useState('');

  // Price state
  const [priceOption, setPriceOption] = useState<'same' | 'new'>('same');
  const [newPrice, setNewPrice] = useState('');
  const [priceNotes, setPriceNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    // Update stock if quantity is provided
    if (quantity) {
      const stockData: UpdateStockRequest = {
        quantity: parseFloat(quantity),
        operation,
        cashAmount: operation === 'subtract' && cashAmount ? parseFloat(cashAmount) : undefined,
        notes: stockNotes || undefined,
      };
      onUpdateStock(product.id, stockData);
    }

    // Update price if "new" is selected and price is provided
    if (priceOption === 'new' && newPrice) {
      const priceData: UpdatePriceRequest = {
        newPrice: parseFloat(newPrice),
        notes: priceNotes || undefined,
      };
      onUpdatePrice(product.id, priceData);
    }

    handleClose();
  };

  const handleClose = () => {
    // Reset all state
    setQuantity('');
    setOperation('add');
    setCashAmount('');
    setStockNotes('');
    setPriceOption('same');
    setNewPrice('');
    setPriceNotes('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Update Product - {product?.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Stock Section */}
          <div className="space-y-3 border-b border-border pb-4">
            <h4 className="font-medium text-sm text-muted-foreground">Stock Update</h4>
            
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
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                step="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Enter quantity"
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
              <Label htmlFor="stockNotes">Stock Notes (Optional)</Label>
              <Textarea
                id="stockNotes"
                value={stockNotes}
                onChange={(e) => setStockNotes(e.target.value)}
                placeholder="Reason for stock change"
                rows={2}
              />
            </div>
          </div>

          {/* Price Section */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm text-muted-foreground">Price Update</h4>
            
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
              <Label htmlFor="priceOption">Price Option</Label>
              <Select
                value={priceOption}
                onValueChange={(v) => setPriceOption(v as 'same' | 'new')}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="same">Same as always (no change)</SelectItem>
                  <SelectItem value="new">New price</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {priceOption === 'new' && (
              <>
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
                    required={priceOption === 'new'}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priceNotes">Price Notes (Optional)</Label>
                  <Textarea
                    id="priceNotes"
                    value={priceNotes}
                    onChange={(e) => setPriceNotes(e.target.value)}
                    placeholder="Reason for price change"
                    rows={2}
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Update Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
