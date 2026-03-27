import { Trash2, History, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BillItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface BillItemRowProps {
  item: BillItem;
  onUpdate: (id: string, updates: Partial<BillItem>) => void;
  onRemove: (id: string) => void;
}

export function BillItemRow({ item, onUpdate, onRemove }: BillItemRowProps) {
  const [isCustomTotal, setIsCustomTotal] = useState(item.customTotal !== undefined);

  const handleQuantityChange = (value: string) => {
    const quantity = parseInt(value) || 1;
    onUpdate(item.id, { quantity, customTotal: undefined });
    setIsCustomTotal(false);
  };

  const handlePriceChange = (value: string) => {
    const price = parseFloat(value) || 0;
    onUpdate(item.id, { price, customTotal: undefined });
    setIsCustomTotal(false);
  };

  const handleGstChange = (value: string) => {
    const gstPercentage = parseFloat(value) || 0;
    onUpdate(item.id, { gstPercentage });
  };

  const handleTaxToggle = (value: string) => {
    onUpdate(item.id, { withTax: value === 'with' });
  };

  const handleHeightChange = (value: string) => {
    const height = parseFloat(value) || 0;
    onUpdate(item.id, { height, customTotal: undefined });
    setIsCustomTotal(false);
  };

  const handleWidthChange = (value: string) => {
    const width = parseFloat(value) || 0;
    onUpdate(item.id, { width, customTotal: undefined });
    setIsCustomTotal(false);
  };

  const handleCustomTotalChange = (value: string) => {
    const customTotal = parseFloat(value) || 0;
    onUpdate(item.id, { customTotal });
  };

  const toggleCustomTotal = () => {
    if (isCustomTotal) {
      onUpdate(item.id, { customTotal: undefined });
      setIsCustomTotal(false);
    } else {
      onUpdate(item.id, { customTotal: item.total });
      setIsCustomTotal(true);
    }
  };

  const isAreaBased = item.pricingType && item.pricingType !== 'standard';
  const displayTotal = item.customTotal !== undefined ? item.customTotal : item.total;

  return (
    <tr className="border-b border-border hover:bg-muted/30 transition-colors">
      <td className="p-3">
        <div className="font-medium text-foreground">{item.productName}</div>
        <div className="text-xs text-muted-foreground">{item.productCode}</div>
        {item.lastPurchasedPrice !== undefined && (
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1 mt-1">
                <History className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-amber-600 font-medium">
                  Last: {formatCurrency(item.lastPurchasedPrice)}
                </span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Last purchased price for this customer/contractor</p>
            </TooltipContent>
          </Tooltip>
        )}
        {isAreaBased && (
          <div className="mt-2 space-y-1">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">H(ft)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.height || ''}
                  onChange={(e) => handleHeightChange(e.target.value)}
                  className="w-16 h-7 text-xs"
                  placeholder="0"
                />
              </div>
              <span className="text-xs text-muted-foreground">×</span>
              <div className="flex items-center gap-1">
                <Label className="text-xs text-muted-foreground">W(ft)</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={item.width || ''}
                  onChange={(e) => handleWidthChange(e.target.value)}
                  className="w-16 h-7 text-xs"
                  placeholder="0"
                />
              </div>
            </div>
            {item.area !== undefined && item.area > 0 && (
              <div className="text-xs text-muted-foreground">
                = {item.area.toFixed(2)} {item.pricingType === 'per_sqft' ? 'sqft' : 'rft'}
                {' '}× {formatCurrency(item.price)} = {formatCurrency(item.area * item.price)}
              </div>
            )}
          </div>
        )}
      </td>
      <td className="p-3">
        <Input
          type="number"
          min="1"
          value={item.quantity}
          onChange={(e) => handleQuantityChange(e.target.value)}
          className="w-20 h-8 text-center"
        />
      </td>
      <td className="p-3">
        <Input
          type="number"
          min="0"
          step="0.01"
          value={item.price}
          onChange={(e) => handlePriceChange(e.target.value)}
          className="w-24 h-8 text-right"
        />
        {isAreaBased && (
          <div className="text-xs text-muted-foreground mt-1 text-right">
            per {item.pricingType === 'per_sqft' ? 'sqft' : 'rft'}
          </div>
        )}
      </td>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <Select
            value={item.withTax ? 'with' : 'without'}
            onValueChange={handleTaxToggle}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="with">With Tax</SelectItem>
              <SelectItem value="without">No Tax</SelectItem>
            </SelectContent>
          </Select>
          {item.withTax && (
            <Input
              type="number"
              min="0"
              max="100"
              value={item.gstPercentage}
              onChange={(e) => handleGstChange(e.target.value)}
              className="w-16 h-8"
            />
          )}
        </div>
      </td>
      <td className="p-3">
        <div className="flex items-center gap-1">
          {isCustomTotal ? (
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.customTotal ?? item.total}
              onChange={(e) => handleCustomTotalChange(e.target.value)}
              className="w-24 h-8 text-right border-amber-500 focus-visible:ring-amber-500"
            />
          ) : (
            <span className="font-semibold text-primary">{formatCurrency(displayTotal)}</span>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleCustomTotal}
                className="h-7 w-7 p-0"
              >
                {isCustomTotal ? <Unlock size={14} className="text-amber-500" /> : <Lock size={14} className="text-muted-foreground" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isCustomTotal ? 'Revert to calculated total' : 'Edit total (after bargaining)'}</p>
            </TooltipContent>
          </Tooltip>
        </div>
        {isCustomTotal && item.customTotal !== undefined && item.customTotal !== item.total && (
          <div className="text-xs text-muted-foreground mt-0.5">
            Was: {formatCurrency(item.total)}
          </div>
        )}
      </td>
      <td className="p-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemove(item.id)}
          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
        >
          <Trash2 size={16} />
        </Button>
      </td>
    </tr>
  );
}
