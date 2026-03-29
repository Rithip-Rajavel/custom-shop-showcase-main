import { Trash2, History, Lock, Unlock, Edit } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BillItem } from '@/types';
import { formatCurrency } from '@/lib/utils';
import { ChangePriceModal } from './ChangePriceModal';

interface BillItemRowProps {
  item: BillItem;
  onUpdate: (id: string, updates: Partial<BillItem>) => void;
  onRemove: (id: string) => void;
}

export function BillItemRow({ item, onUpdate, onRemove }: BillItemRowProps) {
  const [isCustomTotal, setIsCustomTotal] = useState(item.customTotal !== undefined);
  const [showChangePriceModal, setShowChangePriceModal] = useState(false);

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

  const handlePriceModalChange = (newPrice: number) => {
    onUpdate(item.id, { price: newPrice, customTotal: undefined });
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
    const width = item.width || 0;
    const calculatedArea = height * width;
    onUpdate(item.id, { height, area: calculatedArea, customTotal: undefined });
    setIsCustomTotal(false);
  };

  const handleWidthChange = (value: string) => {
    const width = parseFloat(value) || 0;
    const height = item.height || 0;
    const calculatedArea = height * width;
    onUpdate(item.id, { width, area: calculatedArea, customTotal: undefined });
    setIsCustomTotal(false);
  };

  const handleAreaChange = (value: string) => {
    const area = parseFloat(value) || 0;
    // Don't clear height and width when area is manually entered
    // Allow users to override the calculated area
    onUpdate(item.id, { area, customTotal: undefined });
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
    <>
      <tr className="border-b border-border hover:bg-muted/30 transition-colors">
        <td className="p-3">
          <div className="font-medium text-foreground">{item.productName}</div>
          <div className="text-xs text-muted-foreground">{item.productCode}</div>
          {item.lastPurchasedPrice !== undefined && (
            <div className="flex flex-col gap-1 mt-1">
              <div className="flex items-center gap-1">
                <History className="w-3 h-3 text-amber-500" />
                <span className="text-xs text-amber-600 font-medium">
                  Last: {formatCurrency(item.lastPurchasedPrice)}
                </span>
              </div>
              {item.price !== item.lastPurchasedPrice && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate(item.id, {
                    price: item.lastPurchasedPrice,
                    customTotal: undefined
                  })}
                  className="h-5 px-2 text-xs text-amber-600 hover:text-amber-700 hover:bg-amber-50"
                >
                  Use Last Price
                </Button>
              )}
            </div>
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
                <span className="text-xs text-muted-foreground">=</span>
                <div className="flex items-center gap-1">
                  <Label className="text-xs text-muted-foreground">Sqft</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.area || ''}
                    onChange={(e) => handleAreaChange(e.target.value)}
                    className="w-20 h-7 text-xs"
                    placeholder="0"
                  />
                </div>
              </div>
              {item.area !== undefined && item.area > 0 && (
                <div className="text-xs text-muted-foreground">
                  = {item.area.toFixed(2)} sqft
                  {' '}× {formatCurrency(item.price)} = {formatCurrency(item.area * item.price)}
                </div>
              )}
            </div>
          )}
        </td>
        <td className="p-3 text-center">
          {isAreaBased ? (
            <div className="text-center">
              <div className="font-medium text-sm">
                {item.area && item.area > 0 ? item.area.toFixed(2) : '0'}
              </div>
              <div className="text-xs text-muted-foreground">
                {item.pricingType === 'per_sqft' ? 'sqft' : 'rft'}
              </div>
            </div>
          ) : (
            <Input
              type="number"
              min="1"
              value={item.quantity}
              onChange={(e) => handleQuantityChange(e.target.value)}
              className="w-20 h-8 text-center mx-auto"
            />
          )}
        </td>
        <td className="p-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <Input
              type="number"
              min="0"
              step="0.01"
              value={item.price}
              onChange={(e) => handlePriceChange(e.target.value)}
              className="w-20 h-8 text-right"
            />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowChangePriceModal(true)}
                  className="h-6 w-6 p-0"
                >
                  <Edit size={12} className="text-muted-foreground" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Change price with details</p>
              </TooltipContent>
            </Tooltip>
          </div>
          {isAreaBased && (
            <div className="text-xs text-muted-foreground mt-1 text-right">
              per {item.pricingType === 'per_sqft' ? 'sqft' : 'rft'}
            </div>
          )}
        </td>
        <td className="p-3 text-center">
          <div className="flex items-center justify-center gap-1">
            <Select
              value={item.withTax ? 'with' : 'without'}
              onValueChange={handleTaxToggle}
            >
              <SelectTrigger className="w-20 h-8 text-xs">
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
                className="w-14 h-8 text-xs"
              />
            )}
          </div>
        </td>
        <td className="p-3 text-right">
          <div className="flex items-center justify-end gap-1">
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
            <div className="text-xs text-muted-foreground mt-0.5 text-right">
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

      {/* Change Price Modal */}
      <ChangePriceModal
        isOpen={showChangePriceModal}
        onClose={() => setShowChangePriceModal(false)}
        item={item}
        onPriceChange={handlePriceModalChange}
      />
    </>
  );
}
