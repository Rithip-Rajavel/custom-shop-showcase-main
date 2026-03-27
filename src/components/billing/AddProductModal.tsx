import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Product } from '@/types';
import { useSettings } from '@/hooks/useSettings';

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productName: string;
  onAddProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  onSelectProduct: (product: Product) => void;
}

export function AddProductModal({
  isOpen,
  onClose,
  productName,
  onAddProduct,
  onSelectProduct,
}: AddProductModalProps) {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: productName,
    code: '',
    barcode: '',
    price: 0,
    stock: 0,
    unit: 'piece',
    gstPercentage: settings.defaultGstPercentage,
    category: '',
    description: '',
  });

  // Reset form when modal opens with new product name
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: productName,
        code: '',
        barcode: '',
        price: 0,
        stock: 0,
        unit: 'piece',
        gstPercentage: settings.defaultGstPercentage,
        category: '',
        description: '',
      });
    }
  }, [isOpen, productName, settings.defaultGstPercentage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || formData.price <= 0) return;

    const product = onAddProduct(formData);
    onSelectProduct(product);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 space-y-2">
              <Label htmlFor="name">Product Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code">Product Code *</Label>
              <Input
                id="code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Barcode</Label>
              <Input
                id="barcode"
                value={formData.barcode}
                onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stock">Stock</Label>
              <Input
                id="stock"
                type="number"
                min="0"
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                placeholder="piece, kg, meter, etc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="gst">GST %</Label>
              <Input
                id="gst"
                type="number"
                min="0"
                max="100"
                value={formData.gstPercentage}
                onChange={(e) =>
                  setFormData({ ...formData, gstPercentage: parseFloat(e.target.value) || 0 })
                }
              />
            </div>

            <div className="col-span-2 space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                placeholder="Hardware, Plywood, Glass, etc."
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Add & Select Product
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
