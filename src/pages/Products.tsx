import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Package, ChevronDown, ChevronUp, History, Box } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductForm } from '@/components/products/ProductForm';
import { ExcelImport } from '@/components/products/ExcelImport';
import { ProductUpdateModal } from '@/components/products/ProductUpdateModal';
import { AuditHistoryModal } from '@/components/products/AuditHistoryModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useProducts } from '@/hooks/useProducts';
import { Product, UpdateStockRequest, UpdatePriceRequest } from '@/types';
import { formatCurrency } from '@/lib/utils';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { updateProductStock, updateProductPrice } from '@/lib/api';

export default function Products() {
  const { products, addProduct, updateProduct, deleteProduct, fetchProducts } = useProducts();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [selectedProductForUpdate, setSelectedProductForUpdate] = useState<Product | null>(null);
  const [auditProduct, setAuditProduct] = useState<Product | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  const filteredProducts = searchQuery
    ? products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery) ||
        p.category.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : products;

  const handleAddProduct = (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    addProduct(product);
    toast({
      title: 'Product Added',
      description: `${product.name} has been added successfully`,
    });
  };

  const handleImportProducts = (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => {
    products.forEach((product) => addProduct(product));
  };

  const handleUpdateProduct = (id: string, updates: Partial<Product>) => {
    updateProduct(id, updates);
    toast({
      title: 'Product Updated',
      description: 'Product has been updated successfully',
    });
  };

  const handleDeleteProduct = () => {
    if (deletingProduct) {
      deleteProduct(deletingProduct.id);
      toast({
        title: 'Product Deleted',
        description: `${deletingProduct.name} has been deleted`,
      });
      setDeletingProduct(null);
    }
  };

  const openEditForm = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingProduct(null);
  };

  const handleUpdateStock = async (productId: string, stockData: UpdateStockRequest) => {
    try {
      await updateProductStock(productId, stockData);
      // Refresh products from API to get updated stock
      await fetchProducts();
      toast({
        title: 'Stock Updated',
        description: 'Product stock has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update stock',
        variant: 'destructive',
      });
    }
  };

  const handleUpdatePrice = async (productId: string, priceData: UpdatePriceRequest) => {
    try {
      await updateProductPrice(productId, priceData);
      // Refresh products from API to get updated price
      await fetchProducts();
      toast({
        title: 'Price Updated',
        description: 'Product price has been updated successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update price',
        variant: 'destructive',
      });
    }
  };

  const toggleCategoryCollapse = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(category)) {
        newSet.delete(category);
      } else {
        newSet.add(category);
      }
      return newSet;
    });
  };

  // Group products by category
  const productsByCategory = filteredProducts.reduce((acc, product) => {
    const category = product.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {} as Record<string, Product[]>);

  return (
    <MainLayout>
      <PageHeader
        title="Products"
        description="Manage your product inventory"
        action={
          <div className="flex gap-2">
            <ExcelImport onImport={handleImportProducts} />
            <Button onClick={() => setIsFormOpen(true)} className="gap-2">
              <Plus size={18} />
              Add Product
            </Button>
          </div>
        }
      />

      {/* Search */}
      <div className="bg-card border border-border rounded-xl p-4 mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search by name, code, barcode, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Products by Category */}
      {Object.keys(productsByCategory).length > 0 ? (
        <div className="space-y-6">
          {Object.entries(productsByCategory).map(([category, categoryProducts]) => {
            const isCollapsed = collapsedCategories.has(category);
            return (
              <div key={category} className="bg-card border border-border rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleCategoryCollapse(category)}
                  className="w-full px-4 py-3 flex items-center justify-between bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <Package className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold">{category}</h3>
                    <span className="text-sm text-muted-foreground">({categoryProducts.length} items)</span>
                  </div>
                  {isCollapsed ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
                </button>

                {!isCollapsed && (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3 text-sm font-medium text-muted-foreground">Product</th>
                          <th className="text-right p-3 text-sm font-medium text-muted-foreground">Selling Price</th>
                          <th className="text-right p-3 text-sm font-medium text-muted-foreground">Cost Price</th>
                          <th className="text-right p-3 text-sm font-medium text-muted-foreground">Stock</th>
                          <th className="text-right p-3 text-sm font-medium text-muted-foreground">GST</th>
                          <th className="text-center p-3 text-sm font-medium text-muted-foreground">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {categoryProducts.map((product) => (
                          <tr key={product.id} className="border-t border-border hover:bg-muted/30">
                            <td className="p-3">
                              <div>
                                <div className="font-medium">{product.name}</div>
                                <div className="text-xs text-muted-foreground">Code: {product.code}</div>
                              </div>
                            </td>
                            <td className="p-3 text-right font-semibold text-green-600">
                              {formatCurrency(product.price)}
                            </td>
                            <td className="p-3 text-right font-semibold text-amber-600">
                              {formatCurrency(product.originalAmount)}
                            </td>
                            <td className="p-3 text-right">
                              <span className={product.stock <= 5 ? 'text-destructive font-medium' : 'text-foreground'}>
                                {product.stock} {product.unit}
                              </span>
                            </td>
                            <td className="p-3 text-right">{product.gstPercentage}%</td>
                            <td className="p-3">
                              <div className="flex items-center justify-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedProductForUpdate(product)}
                                  className="h-8 w-8 p-0"
                                  title="Update Stock & Price"
                                >
                                  <Box size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setAuditProduct(product)}
                                  className="h-8 w-8 p-0"
                                  title="View Audit History"
                                >
                                  <History size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => openEditForm(product)}
                                  className="h-8 w-8 p-0"
                                  title="Edit"
                                >
                                  <Edit2 size={16} />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setDeletingProduct(product)}
                                  className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                                  title="Delete"
                                >
                                  <Trash2 size={16} />
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="w-16 h-16 mb-4" />
          <p className="text-lg">No products found</p>
          <p className="text-sm">
            {searchQuery ? 'Try a different search term' : 'Add your first product to get started'}
          </p>
        </div>
      )}

      {/* Product Form Modal */}
      <ProductForm
        isOpen={isFormOpen}
        onClose={closeForm}
        product={editingProduct}
        onSave={handleAddProduct}
        onUpdate={handleUpdateProduct}
      />

      {/* Product Update Modal (Stock & Price) */}
      <ProductUpdateModal
        isOpen={!!selectedProductForUpdate}
        onClose={() => setSelectedProductForUpdate(null)}
        product={selectedProductForUpdate}
        onUpdateStock={handleUpdateStock}
        onUpdatePrice={handleUpdatePrice}
      />

      {/* Audit History Modal */}
      <AuditHistoryModal
        isOpen={!!auditProduct}
        onClose={() => setAuditProduct(null)}
        product={auditProduct}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingProduct} onOpenChange={() => setDeletingProduct(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deletingProduct?.name}"? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteProduct}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
