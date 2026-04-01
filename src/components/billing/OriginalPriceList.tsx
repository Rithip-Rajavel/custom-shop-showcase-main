import { Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { BillItem } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface OriginalPriceListProps {
  items: BillItem[];
}

export function OriginalPriceList({ items }: OriginalPriceListProps) {
  if (items.length === 0) return null;

  const totalOriginal = items.reduce((sum, item) => sum + item.quantity * (item.originalPrice || 0), 0);
  const totalCurrent = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const difference = totalCurrent - totalOriginal;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Eye size={16} />
          See Original Price List
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Original Price List</DialogTitle>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left p-2 font-medium text-muted-foreground">Product</th>
                <th className="text-center p-2 font-medium text-muted-foreground">Qty</th>
                <th className="text-right p-2 font-medium text-muted-foreground">Original Rate</th>
                <th className="text-right p-2 font-medium text-muted-foreground">Current Rate</th>
                <th className="text-right p-2 font-medium text-muted-foreground">Orig. Total</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const origTotal = item.quantity * item.originalPrice;
                const currTotal = item.quantity * item.price;
                const isLoss = currTotal < origTotal;
                return (
                  <tr key={item.id} className="border-b border-border">
                    <td className="p-2">
                      <div className="font-medium">{item.productName}</div>
                      <div className="text-xs text-muted-foreground">{item.productCode}</div>
                    </td>
                    <td className="text-center p-2">{item.quantity}</td>
                    <td className="text-right p-2">{formatCurrency(item.originalPrice)}</td>
                    <td className={`text-right p-2 font-medium ${isLoss ? 'text-destructive' : 'text-green-600'}`}>
                      {formatCurrency(item.price)}
                    </td>
                    <td className="text-right p-2 font-medium">{formatCurrency(origTotal)}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="border-t-2 border-border">
              <tr>
                <td colSpan={4} className="p-2 text-right font-semibold">Total Original Price:</td>
                <td className="p-2 text-right font-bold text-primary">{formatCurrency(totalOriginal)}</td>
              </tr>
              <tr>
                <td colSpan={4} className="p-2 text-right font-semibold">Total Current Price:</td>
                <td className="p-2 text-right font-bold">{formatCurrency(totalCurrent)}</td>
              </tr>
              <tr>
                <td colSpan={4} className="p-2 text-right font-semibold">
                  {difference >= 0 ? 'Profit Margin:' : 'Loss:'}
                </td>
                <td className={`p-2 text-right font-bold ${difference >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                  {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
