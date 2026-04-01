import { useState, useEffect } from 'react';
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
import { Product } from '@/types';
import { useSettings } from '@/hooks/useSettings';

interface ProductFormProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
  onSave: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onUpdate?: (id: string, updates: Partial<Product>) => void;
}

export function ProductForm({ isOpen, onClose, product, onSave, onUpdate }: ProductFormProps) {
  const { settings } = useSettings();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    barcode: '',
    price: 0, // This will be the selling amount
    sellingAmount: 0, // Selling price - what customers pay
    originalAmount: 0, // Cost price
    stock: 0,
    unit: 'piece',
    gstPercentage: settings.defaultGstPercentage,
    category: '',
    description: '',
    pricingType: 'standard' as 'standard' | 'per_sqft' | 'per_rft',
  });

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        code: product.code,
        barcode: product.barcode,
        price: product.price, // Selling price
        sellingAmount: product.sellingAmount || product.price, // Selling price
        originalAmount: product.originalAmount, // Cost price
        stock: product.stock,
        unit: product.unit,
        gstPercentage: product.gstPercentage,
        category: product.category,
        description: product.description || '',
        pricingType: product.pricingType || 'standard',
      });
    } else {
      setFormData({
        name: '',
        code: '',
        barcode: '',
        price: 0, // Selling price
        sellingAmount: 0,
        originalAmount: 0, // Cost price
        stock: 0,
        unit: 'piece',
        gstPercentage: settings.defaultGstPercentage,
        category: '',
        description: '',
        pricingType: 'standard',
      });
    }
  }, [product, settings.defaultGstPercentage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.code || formData.price <= 0) return;

    if (product && onUpdate) {
      onUpdate(product.id, formData);
    } else {
      onSave(formData);
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit Product' : 'Add New Product'}</DialogTitle>
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
              <Label htmlFor="price">Selling Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => {
                  const val = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, price: val, sellingAmount: val });
                }}
                placeholder="Enter selling price"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="originalAmount">Cost Price (₹)</Label>
              <Input
                id="originalAmount"
                type="number"
                min="0"
                step="0.01"
                value={formData.originalAmount}
                onChange={(e) => setFormData({ ...formData, originalAmount: parseFloat(e.target.value) || 0 })}
                placeholder="Enter cost price (optional)"
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
              <Select
                value={formData.category}
                onValueChange={(value) => {
                  setFormData({
                    ...formData,
                    category: value,
                    pricingType: value.toLowerCase() === 'glass' ? 'per_sqft' : 'standard',
                    unit: value.toLowerCase() === 'glass' ? 'sqft' : formData.unit,
                  });
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Hardware">Hardware</SelectItem>
                  <SelectItem value="Glass">Glass</SelectItem>
                  <SelectItem value="Plywood">Plywood</SelectItem>
                  <SelectItem value="Plastic">Plastic</SelectItem>
                  <SelectItem value="Paint">Paint</SelectItem>
                  <SelectItem value="Electrical">Electrical</SelectItem>
                  <SelectItem value="Plumbing">Plumbing</SelectItem>
                  <SelectItem value="Tools">Tools</SelectItem>
                  <SelectItem value="Fasteners">Fasteners</SelectItem>
                  <SelectItem value="Sanitary">Sanitary</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.category.toLowerCase() === 'glass' && (
              <div className="col-span-2 space-y-2">
                <Label>Pricing Type</Label>
                <Select
                  value={formData.pricingType}
                  onValueChange={(value: 'standard' | 'per_sqft' | 'per_rft') =>
                    setFormData({ ...formData, pricingType: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="per_sqft">Per Square Foot (Height × Width)</SelectItem>
                    <SelectItem value="per_rft">Per Running Foot (Height + Width)</SelectItem>
                    <SelectItem value="standard">Standard (Fixed Price)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {formData.pricingType === 'per_sqft' && 'Price = Rate × Height × Width'}
                  {formData.pricingType === 'per_rft' && 'Price = Rate × (Height + Width)'}
                  {formData.pricingType === 'standard' && 'Fixed price per unit'}
                </p>
              </div>
            )}

            <div className="col-span-2 space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Product description..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {product ? 'Update Product' : 'Add Product'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
