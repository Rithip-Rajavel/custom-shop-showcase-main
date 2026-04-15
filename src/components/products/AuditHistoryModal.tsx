import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Product, ProductAudit, AuditAction } from '@/types';
import { getProductAudits, getProductAuditsByAction } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Clock, TrendingUp, TrendingDown, RefreshCw, History, Package } from 'lucide-react';

interface AuditHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
}

export function AuditHistoryModal({ isOpen, onClose, product }: AuditHistoryModalProps) {
  const [audits, setAudits] = useState<ProductAudit[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterAction, setFilterAction] = useState<AuditAction | 'ALL'>('ALL');

  useEffect(() => {
    if (isOpen && product) {
      fetchAudits();
    }
  }, [isOpen, product, filterAction]);

  const fetchAudits = async () => {
    if (!product) return;
    setIsLoading(true);
    try {
      const data = filterAction === 'ALL'
        ? await getProductAudits(product.id)
        : await getProductAuditsByAction(product.id, filterAction);
      setAudits(data || []);
    } catch (error) {
      console.error('Failed to fetch audits:', error);
      setAudits([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getActionIcon = (action: AuditAction) => {
    switch (action) {
      case 'STOCK_INCREASED':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'STOCK_DECREASED':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'PRICE_UPDATED':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      case 'PRODUCT_CREATED':
        return <Package className="w-4 h-4 text-purple-500" />;
      case 'STOCK_AND_PRICE_UPDATED':
        return <History className="w-4 h-4 text-amber-500" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const getActionBadge = (action: AuditAction) => {
    switch (action) {
      case 'STOCK_INCREASED':
        return <span className="text-xs px-2 py-1 rounded-full bg-green-500/10 text-green-600">Stock Increased</span>;
      case 'STOCK_DECREASED':
        return <span className="text-xs px-2 py-1 rounded-full bg-red-500/10 text-red-600">Stock Decreased</span>;
      case 'PRICE_UPDATED':
        return <span className="text-xs px-2 py-1 rounded-full bg-blue-500/10 text-blue-600">Price Updated</span>;
      case 'PRODUCT_CREATED':
        return <span className="text-xs px-2 py-1 rounded-full bg-purple-500/10 text-purple-600">Product Created</span>;
      case 'STOCK_AND_PRICE_UPDATED':
        return <span className="text-xs px-2 py-1 rounded-full bg-amber-500/10 text-amber-600">Stock & Price Updated</span>;
      default:
        return <span className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">{action}</span>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Audit History - {product?.name}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Filter */}
          <div className="space-y-2">
            <Label>Filter by Action</Label>
            <Select
              value={filterAction}
              onValueChange={(v) => setFilterAction(v as AuditAction | 'ALL')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Actions</SelectItem>
                <SelectItem value="PRODUCT_CREATED">Product Created</SelectItem>
                <SelectItem value="STOCK_INCREASED">Stock Increased</SelectItem>
                <SelectItem value="STOCK_DECREASED">Stock Decreased</SelectItem>
                <SelectItem value="PRICE_UPDATED">Price Updated</SelectItem>
                <SelectItem value="STOCK_AND_PRICE_UPDATED">Stock & Price Updated</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Audit List */}
          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading audit history...
            </div>
          ) : audits.length > 0 ? (
            <div className="space-y-3">
              {audits.map((audit) => (
                <div
                  key={audit.id}
                  className="bg-muted/50 rounded-lg p-4 border border-border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getActionIcon(audit.action)}
                      <span className="font-medium">{audit.action.replace(/_/g, ' ')}</span>
                    </div>
                    {getActionBadge(audit.action)}
                  </div>

                  <div className="space-y-1 text-sm">
                    {audit.action.includes('STOCK') && (
                      <>
                        {audit.oldStock !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Old Stock:</span>
                            <span>{audit.oldStock}</span>
                          </div>
                        )}
                        {audit.newStock !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">New Stock:</span>
                            <span className="font-medium">{audit.newStock}</span>
                          </div>
                        )}
                        {audit.stockChange !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Change:</span>
                            <span className={audit.stockChange > 0 ? 'text-green-600' : 'text-red-600'}>
                              {audit.stockChange > 0 ? '+' : ''}{audit.stockChange}
                            </span>
                          </div>
                        )}
                        {audit.cashAmount !== undefined && audit.cashAmount > 0 && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Cash Amount:</span>
                            <span className="font-medium">{formatCurrency(audit.cashAmount)}</span>
                          </div>
                        )}
                      </>
                    )}

                    {audit.action.includes('PRICE') && (
                      <>
                        {audit.oldPrice !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Old Price:</span>
                            <span>{formatCurrency(audit.oldPrice)}</span>
                          </div>
                        )}
                        {audit.newPrice !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">New Price:</span>
                            <span className="font-medium">{formatCurrency(audit.newPrice)}</span>
                          </div>
                        )}
                        {audit.priceChange !== undefined && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Change:</span>
                            <span className={audit.priceChange > 0 ? 'text-green-600' : 'text-red-600'}>
                              {audit.priceChange > 0 ? '+' : ''}{formatCurrency(audit.priceChange)}
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {audit.notes && (
                      <div className="pt-2">
                        <span className="text-muted-foreground">Notes: </span>
                        <span>{audit.notes}</span>
                      </div>
                    )}

                    <div className="pt-2 text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {formatDate(audit.createdAt)}
                      {audit.performedByName && (
                        <span> • by {audit.performedByName}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No audit history found
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button onClick={onClose}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
