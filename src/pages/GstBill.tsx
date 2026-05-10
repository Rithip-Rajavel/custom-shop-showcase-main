import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Invoice } from '@/types';
import { apiGet } from '@/lib/api';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { Trash2, Plus } from 'lucide-react';

interface GSTItem {
  id: string;
  particulars: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  total: number;
}

export default function GstBill() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const navigate = useNavigate();
  const { settings } = useSettingsContext();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);
  const [printMode, setPrintMode] = useState<'a4' | 'thermal'>('a4');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('001');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState<GSTItem[]>([
    { id: '1', particulars: '19mm Plywood 8x4', hsnCode: '4412', quantity: 1, rate: 35000, total: 35000 },
    { id: '2', particulars: '12mm Plywood 8x4', hsnCode: '4412', quantity: 2, rate: 28000, total: 56000 },
    { id: '3', particulars: 'S.H 50kg', hsnCode: '4412', quantity: 1, rate: 12000, total: 12000 },
    { id: '4', particulars: 'Hardware Fittings', hsnCode: '8480', quantity: 1, rate: 36712, total: 36712 }
  ]);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const data = await apiGet<Invoice>(`/api/invoices/${invoiceId}`);
        setInvoice(data);
        setCustomerName(data.customerName);
        setInvoiceNumber(data.invoiceNumber);
        setInvoiceDate(new Date(data.createdAt).toISOString().split('T')[0]);

        // Convert invoice items to GST items
        if (data.items) {
          const gstItems = data.items.map((item: any) => ({
            id: item.id,
            particulars: item.productName,
            hsnCode: '4412', // Default HSN code
            quantity: item.quantity,
            rate: item.rate || item.subtotal / item.quantity,
            total: item.subtotal
          }));
          setItems(gstItems);
        }
      } catch (error) {
        console.error('Failed to fetch invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    if (invoiceId) {
      fetchInvoice();
    }
  }, [invoiceId]);

  const handlePrint = () => {
    setShowPrintDialog(true);
  };

    const confirmPrint = () => {
      setShowPrintDialog(false);
      // Save data to localStorage for preview page
      localStorage.setItem('gstBillData', JSON.stringify({
        customerName,
        customerAddress,
        invoiceNumber,
        invoiceDate,
        items,
        settings
      }));
      navigate(`/invoices/${invoiceId}/gst-bill/preview/${printMode}`);
    };

    const addItem = () => {
      const newItem: GSTItem = {
        id: Date.now().toString(),
        particulars: '',
        hsnCode: '4412',
        quantity: 1,
        rate: 0,
        total: 0
      };
      setItems([...items, newItem]);
    };

    const removeItem = (id: string) => {
      setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof GSTItem, value: string | number) => {
      setItems(items.map(item => {
        if (item.id === id) {
          const updated = { ...item, [field]: value };
          // Recalculate total if quantity or rate changes
          if (field === 'quantity' || field === 'rate') {
            updated.total = updated.quantity * updated.rate;
          }
          return updated;
        }
        return item;
      }));
    };

    const calculateTotals = () => {
      const subTotal = items.reduce((sum, item) => sum + item.total, 0);
      const sgst = subTotal * 0.09;
      const cgst = subTotal * 0.09;
      const grandTotal = subTotal + sgst + cgst;
      return { subTotal, sgst, cgst, grandTotal };
    };

    const getAmountInWords = (amount: number) => {
      // Simple conversion to words - you might want to use a proper library
      const words = ['Zero', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
      return `${amount.toFixed(2)} Rupees Only`;
    };

    if (loading) {
      return (
        <MainLayout>
          <div className="flex items-center justify-center py-16">
            <p>Loading...</p>
          </div>
        </MainLayout>
      );
    }

    if (!invoice) {
      return (
        <MainLayout>
          <div className="flex flex-col items-center justify-center py-16">
            <p>Invoice not found</p>
            <Button onClick={() => navigate('/invoices')} className="mt-4">
              Back to Invoices
            </Button>
          </div>
        </MainLayout>
      );
    }

    const totals = calculateTotals();

    return (
      <MainLayout>
        <PageHeader title="GST Bill" description={`Invoice ${invoice.invoiceNumber}`} />

        <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-4xl mx-auto" id="gst-bill-content">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="mb-4 text-left">
              <p className="font-bold">GSTIN: {settings.gstNumber || 'N/A'}</p>
              <p className="font-bold">Cell: {settings.phone || 'N/A'}</p>
            </div>
            <h1 className="text-2xl font-bold">{settings.name}</h1>
            {/* <p className="text-lg">PLYWOOD & GLASS</p> */}
            <p className="text-sm">{settings.address}</p>
          </div>

          {/* Customer Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="font-semibold">Customer name</Label>
              <Input
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold">Customer address</Label>
              <Input
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Invoice Details */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <Label className="font-semibold">No.</Label>
              <Input
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
                className="mt-1"
              />
            </div>
            <div>
              <Label className="font-semibold">Date</Label>
              <Input
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          {/* Product Table */}
          <div className="mb-6">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2 text-left">No.</th>
                  <th className="border border-gray-300 p-2 text-left">Particulars</th>
                  <th className="border border-gray-300 p-2 text-left">HSN Code</th>
                  <th className="border border-gray-300 p-2 text-center">Qty.</th>
                  <th className="border border-gray-300 p-2 text-right">Rate</th>
                  <th className="border border-gray-300 p-2 text-right">Total</th>
                  <th className="border border-gray-300 p-2 text-center">Action</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.particulars}
                        onChange={(e) => updateItem(item.id, 'particulars', e.target.value)}
                        className="border-0 p-0"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={item.hsnCode}
                        onChange={(e) => updateItem(item.id, 'hsnCode', e.target.value)}
                        className="border-0 p-0"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                        className="border-0 p-0 text-center"
                      />
                    </td>
                    <td className="border border-gray-300 p-2">
                      <Input
                        type="number"
                        value={item.rate}
                        onChange={(e) => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                        className="border-0 p-0 text-right"
                      />
                    </td>
                    <td className="border border-gray-300 p-2 text-right">₹{item.total.toFixed(2)}</td>
                    <td className="border border-gray-300 p-2 text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeItem(item.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Button
              onClick={addItem}
              variant="outline"
              className="mt-2 w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add row
            </Button>
          </div>

          {/* Summary */}
          <div className="space-y-2 mb-6">
            <div>
              <Label className="font-semibold">TOTAL AMOUNT IN WORDS</Label>
              <div className="mt-1 p-2 bg-gray-100 rounded">
                {getAmountInWords(totals.grandTotal)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="font-semibold">Sub Total</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-right">₹{totals.subTotal.toFixed(2)}</div>
              </div>
              <div>
                <Label className="font-semibold">SGST 9%</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-right">₹{totals.sgst.toFixed(2)}</div>
              </div>
              <div>
                <Label className="font-semibold">CGST 9%</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-right">₹{totals.cgst.toFixed(2)}</div>
              </div>
              <div>
                <Label className="font-semibold">IGST %</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-right">₹0.00</div>
              </div>
              <div className="col-span-2">
                <Label className="font-bold text-lg">Grand Total</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-right font-bold text-lg">₹{totals.grandTotal.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-4 border-t border-gray-300">
            <div className="text-center">
              <p className="font-semibold">For {settings.name}</p>
              <div className="mt-8">
                <p>Authorised Signatory</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 mt-8">
            <Button onClick={handlePrint}>
              Print
            </Button>
            <Button variant="outline" onClick={() => navigate('/invoices')}>
              Back to Invoices
            </Button>
          </div>
        </div>

        {/* Print Dialog */}
        {showPrintDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-bold mb-4">Select Print Mode</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="a4"
                    name="printMode"
                    value="a4"
                    checked={printMode === 'a4'}
                    onChange={(e) => setPrintMode(e.target.value as 'a4' | 'thermal')}
                    className="w-4 h-4"
                  />
                  <label htmlFor="a4" className="text-sm">
                    <span className="font-semibold">A4 Sheet</span>
                    <p className="text-gray-500 text-xs">Standard A4 paper print</p>
                  </label>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    id="thermal"
                    name="printMode"
                    value="thermal"
                    checked={printMode === 'thermal'}
                    onChange={(e) => setPrintMode(e.target.value as 'a4' | 'thermal')}
                    className="w-4 h-4"
                  />
                  <label htmlFor="thermal" className="text-sm">
                    <span className="font-semibold">Thermal Print (4 inch)</span>
                    <p className="text-gray-500 text-xs">For thermal printers (4 inch width)</p>
                  </label>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button onClick={confirmPrint} className="flex-1">
                  Print
                </Button>
                <Button variant="outline" onClick={() => setShowPrintDialog(false)} className="flex-1">
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        )}
      </MainLayout>
    );
  }
