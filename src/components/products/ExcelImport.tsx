import { useRef, useState } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle2 } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Product } from '@/types';
import { generateId } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

interface ExcelImportProps {
  onImport: (products: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>[]) => void;
}

interface ParsedProduct {
  name: string;
  code: string;
  barcode: string;
  price: number;
  stock: number;
  unit: string;
  gstPercentage: number;
  category: string;
  isValid: boolean;
  errors: string[];
}

export function ExcelImport({ onImport }: ExcelImportProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [parsedProducts, setParsedProducts] = useState<ParsedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const parsed: ParsedProduct[] = jsonData.map((row: any) => {
        const errors: string[] = [];
        
        const name = String(row['Name'] || row['name'] || row['Product Name'] || row['product_name'] || '').trim();
        const code = String(row['Code'] || row['code'] || row['Product Code'] || row['product_code'] || '').trim();
        const barcode = String(row['Barcode'] || row['barcode'] || '').trim();
        const price = parseFloat(row['Price'] || row['price'] || row['MRP'] || row['mrp'] || 0);
        const stock = parseInt(row['Stock'] || row['stock'] || row['Quantity'] || row['quantity'] || 0);
        const unit = String(row['Unit'] || row['unit'] || 'piece').trim();
        const gstPercentage = parseFloat(row['GST'] || row['gst'] || row['GST%'] || row['Tax'] || row['tax'] || 18);
        const category = String(row['Category'] || row['category'] || '').trim();

        if (!name) errors.push('Name is required');
        if (!code) errors.push('Code is required');
        if (isNaN(price) || price < 0) errors.push('Invalid price');
        if (isNaN(stock) || stock < 0) errors.push('Invalid stock');

        return {
          name,
          code,
          barcode,
          price: isNaN(price) ? 0 : price,
          stock: isNaN(stock) ? 0 : stock,
          unit: unit || 'piece',
          gstPercentage: isNaN(gstPercentage) ? 18 : gstPercentage,
          category,
          isValid: errors.length === 0,
          errors,
        };
      });

      setParsedProducts(parsed);
      setIsOpen(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to read Excel file. Please check the format.',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleImport = () => {
    const validProducts = parsedProducts
      .filter((p) => p.isValid)
      .map(({ isValid, errors, ...product }) => product);

    if (validProducts.length === 0) {
      toast({
        title: 'No Valid Products',
        description: 'No valid products found to import',
        variant: 'destructive',
      });
      return;
    }

    onImport(validProducts);
    toast({
      title: 'Import Successful',
      description: `${validProducts.length} products imported successfully`,
    });
    setIsOpen(false);
    setParsedProducts([]);
  };

  const validCount = parsedProducts.filter((p) => p.isValid).length;
  const invalidCount = parsedProducts.filter((p) => !p.isValid).length;

  return (
    <>
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        onChange={handleFileSelect}
        className="hidden"
      />
      <Button
        variant="outline"
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="gap-2"
      >
        <Upload size={18} />
        {isProcessing ? 'Processing...' : 'Import Excel'}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSpreadsheet size={20} />
              Import Products
            </DialogTitle>
            <DialogDescription>
              Review the products before importing
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 text-sm">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={16} />
              {validCount} valid
            </div>
            {invalidCount > 0 && (
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle size={16} />
                {invalidCount} with errors
              </div>
            )}
          </div>

          <div className="flex-1 overflow-auto border border-border rounded-lg">
            <table className="w-full text-sm">
              <thead className="bg-muted sticky top-0">
                <tr>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Name</th>
                  <th className="text-left p-2">Code</th>
                  <th className="text-right p-2">Price</th>
                  <th className="text-right p-2">Stock</th>
                  <th className="text-right p-2">GST%</th>
                </tr>
              </thead>
              <tbody>
                {parsedProducts.map((product, index) => (
                  <tr
                    key={index}
                    className={product.isValid ? '' : 'bg-destructive/10'}
                  >
                    <td className="p-2">
                      {product.isValid ? (
                        <CheckCircle2 size={16} className="text-green-600" />
                      ) : (
                        <AlertCircle size={16} className="text-destructive" />
                      )}
                    </td>
                    <td className="p-2">
                      <div>{product.name || '-'}</div>
                      {!product.isValid && (
                        <div className="text-xs text-destructive">
                          {product.errors.join(', ')}
                        </div>
                      )}
                    </td>
                    <td className="p-2">{product.code || '-'}</td>
                    <td className="p-2 text-right">₹{product.price}</td>
                    <td className="p-2 text-right">{product.stock}</td>
                    <td className="p-2 text-right">{product.gstPercentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Expected columns: Name, Code, Barcode, Price, Stock, Unit, GST, Category
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleImport} disabled={validCount === 0}>
                Import {validCount} Products
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
