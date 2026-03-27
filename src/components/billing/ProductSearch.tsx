import { useState, useRef, useEffect } from 'react';
import { Search, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { cn, formatCurrency } from '@/lib/utils';

interface ProductSearchProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddNewProduct: (name: string) => void;
}

export function ProductSearch({ products, onSelectProduct, onAddNewProduct }: ProductSearchProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const filteredProducts = query
    ? products.filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.code.toLowerCase().includes(query.toLowerCase()) ||
          p.barcode.includes(query)
      )
    : [];

  const showResults = query.length > 0 && isOpen;

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showResults) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightedIndex((prev) =>
          prev < filteredProducts.length ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (highlightedIndex === filteredProducts.length && query) {
          onAddNewProduct(query);
          setQuery('');
          setIsOpen(false);
        } else if (filteredProducts[highlightedIndex]) {
          onSelectProduct(filteredProducts[highlightedIndex]);
          setQuery('');
          setIsOpen(false);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          placeholder="Search by name, code, or barcode..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 200)}
          onKeyDown={handleKeyDown}
          className="pl-10 h-12 text-lg"
        />
      </div>

      {showResults && (
        <div
          ref={listRef}
          className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {filteredProducts.length > 0 ? (
            <>
              {filteredProducts.map((product, index) => (
                <button
                  key={product.id}
                  onClick={() => {
                    onSelectProduct(product);
                    setQuery('');
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full px-4 py-3 text-left flex items-center justify-between hover:bg-muted transition-colors',
                    highlightedIndex === index && 'bg-muted'
                  )}
                >
                  <div>
                    <p className="font-medium text-foreground">{product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Code: {product.code} | Stock: {product.stock} {product.unit}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-primary">{formatCurrency(product.price)}</p>
                    <p className="text-xs text-muted-foreground">GST: {product.gstPercentage}%</p>
                  </div>
                </button>
              ))}
            </>
          ) : null}

          {/* Add new product option */}
          <button
            onClick={() => {
              onAddNewProduct(query);
              setQuery('');
              setIsOpen(false);
            }}
            className={cn(
              'w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-muted transition-colors border-t border-border',
              highlightedIndex === filteredProducts.length && 'bg-muted'
            )}
          >
            <Plus className="w-5 h-5 text-primary" />
            <span className="text-foreground">
              Add new product: <strong>"{query}"</strong>
            </span>
          </button>
        </div>
      )}
    </div>
  );
}
