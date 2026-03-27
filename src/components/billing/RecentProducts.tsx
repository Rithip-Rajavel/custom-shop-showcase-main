import { Clock } from 'lucide-react';
import { Product } from '@/types';
import { formatCurrency } from '@/lib/utils';

interface RecentProductsProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
}

export function RecentProducts({ products, onSelectProduct }: RecentProductsProps) {
  // Get last 5 products by creation date
  const recentProducts = [...products]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (recentProducts.length === 0) return null;

  return (
    <div className="bg-card border border-border rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <Clock size={16} className="text-muted-foreground" />
        <h3 className="font-medium text-sm">Recent Products</h3>
      </div>
      <div className="flex flex-wrap gap-2">
        {recentProducts.map((product) => (
          <button
            key={product.id}
            onClick={() => onSelectProduct(product)}
            className="flex items-center gap-2 px-3 py-2 bg-muted/50 hover:bg-primary/10 border border-border rounded-lg transition-colors text-left"
          >
            <div>
              <p className="text-sm font-medium line-clamp-1">{product.name}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(product.price)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
