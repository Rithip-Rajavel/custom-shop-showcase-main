import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { createGstBill } from '@/lib/api';

interface GSTItem {
  id: string;
  particulars: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  total: number;
}

interface GSTBillData {
  customerName: string;
  customerAddress: string;
  invoiceNumber: string;
  invoiceDate: string;
  items: GSTItem[];
  settings: any;
}

export default function GSTBillPreview() {
  const { invoiceId, mode } = useParams<{ invoiceId: string; mode: string }>();
  const navigate = useNavigate();
  const { settings } = useSettingsContext();
  const [billData, setBillData] = useState<GSTBillData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBillData = () => {
      try {
        const savedData = localStorage.getItem('gstBillData');
        if (savedData) {
          const parsedData = JSON.parse(savedData);
          setBillData(parsedData);
        } else {
          setBillData({
            customerName: 'Customer Name',
            customerAddress: 'Customer Address',
            invoiceNumber: '001',
            invoiceDate: new Date().toISOString().split('T')[0],
            items: [
              { id: '1', particulars: '19mm Plywood 8x4', hsnCode: '4412', quantity: 1, rate: 35000, total: 35000 },
              { id: '2', particulars: '12mm Plywood 8x4', hsnCode: '4412', quantity: 2, rate: 28000, total: 56000 },
              { id: '3', particulars: 'S.H 50kg', hsnCode: '4412', quantity: 1, rate: 12000, total: 12000 },
              { id: '4', particulars: 'Hardware Fittings', hsnCode: '8480', quantity: 1, rate: 36712, total: 36712 }
            ],
            settings
          });
        }
      } catch (error) {
        console.error('Failed to load bill data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBillData();
  }, [settings]);

  const handlePrint = () => {
    window.print();
  };

  const handleSave = async () => {
    if (!billData) return;
    try {
      const subTotal = billData.items.reduce((sum, item) => sum + item.total, 0);
      const sgstAmount = Math.round((subTotal * 0.09) * 100) / 100;
      const cgstAmount = Math.round((subTotal * 0.09) * 100) / 100;
      const grandTotal = Math.round((subTotal + sgstAmount + cgstAmount) * 100) / 100;

      const payload = {
        ...billData,
        invoiceId: invoiceId,
        subtotal: subTotal,
        sgstAmount: sgstAmount,
        cgstAmount: cgstAmount,
        igstAmount: 0.01,
        grandTotal: grandTotal,
        items: billData.items.map((item, index) => ({
          ...item,
          itemNumber: index + 1
        }))
      };

      await createGstBill(payload);
      alert('GST Bill saved successfully!');
    } catch (error) {
      console.error('Failed to save GST bill:', error);
      alert('Failed to save GST bill');
    }
  };

  const handleSaveAndPrint = async () => {
    if (!billData) return;
    try {
      const subTotal = billData.items.reduce((sum, item) => sum + item.total, 0);
      const sgstAmount = Math.round((subTotal * 0.09) * 100) / 100;
      const cgstAmount = Math.round((subTotal * 0.09) * 100) / 100;
      const grandTotal = Math.round((subTotal + sgstAmount + cgstAmount) * 100) / 100;

      const payload = {
        ...billData,
        invoiceId: invoiceId,
        subtotal: subTotal,
        sgstAmount: sgstAmount,
        cgstAmount: cgstAmount,
        igstAmount: 0.01,
        grandTotal: grandTotal,
        items: billData.items.map((item, index) => ({
          ...item,
          itemNumber: index + 1
        }))
      };

      await createGstBill(payload);
      alert('GST Bill saved successfully!');
      window.print();
    } catch (error) {
      console.error('Failed to save GST bill:', error);
      alert('Failed to save GST bill');
    }
  };

  const handleCancel = () => {
    navigate(`/invoices/${invoiceId}/gst-bill`);
  };

  const calculateTotals = () => {
    if (!billData) return { subTotal: 0, sgst: 0, cgst: 0, grandTotal: 0 };

    const subTotal = billData.items.reduce((sum, item) => sum + item.total, 0);
    const sgst = subTotal * 0.09;
    const cgst = subTotal * 0.09;
    const grandTotal = subTotal + sgst + cgst;

    return { subTotal, sgst, cgst, grandTotal };
  };

  const getAmountInWords = (amount: number): string => {
    const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine'];
    const teens = ['Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convertLessThanThousand = (n: number): string => {
      if (n === 0) return '';
      if (n < 10) return ones[n];
      if (n < 20) return teens[n - 10];
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
      return ones[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convertLessThanThousand(n % 100) : '');
    };

    const convert = (n: number): string => {
      if (n === 0) return 'Zero';

      let result = '';

      if (n >= 10000000) {
        result += convertLessThanThousand(Math.floor(n / 10000000)) + ' Crore ';
        n %= 10000000;
      }
      if (n >= 100000) {
        result += convertLessThanThousand(Math.floor(n / 100000)) + ' Lakh ';
        n %= 100000;
      }
      if (n >= 1000) {
        result += convertLessThanThousand(Math.floor(n / 1000)) + ' Thousand ';
        n %= 1000;
      }
      if (n > 0) {
        result += convertLessThanThousand(n);
      }

      return result.trim();
    };

    const roundedAmount = Math.round(amount);
    return convert(roundedAmount) + ' Rupees Only';
  };

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'gst-print-styles';

    if (mode === 'thermal') {
      style.textContent = `
        @media print {
          @page {
            size: 4in auto;
            margin: 0.2in;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          #gst-bill-preview {
            width: 100% !important;
          }
          table {
            font-size: 6px !important;
            width: 100% !important;
            table-layout: fixed !important;
          }
          table td, table th {
            padding: 1px !important;
            word-wrap: break-word !important;
            word-break: break-word !important;
            overflow: hidden !important;
          }
          .border {
            border-width: 1px !important;
          }
          .text-2xl {
            font-size: 10px !important;
          }
          .text-lg {
            font-size: 8px !important;
          }
          .p-6 {
            padding: 0.1in !important;
          }
          .p-4 {
            padding: 0.1in !important;
          }
          .mb-4, .mb-6 {
            margin-bottom: 0.1in !important;
          }
          .gap-4 {
            gap: 0.05in !important;
          }
          .gap-6 {
            gap: 0.1in !important;
          }
          .grid-cols-2 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .overflow-x-auto {
            overflow-x: hidden !important;
          }
        }
      `;
    } else {
      style.textContent = `
        @media print {
          @page {
            size: A4;
            margin: 0.5in;
          }
          body {
            margin: 0;
            padding: 0;
          }
          .no-print {
            display: none !important;
          }
          #gst-bill-preview {
            width: 100% !important;
          }
        }
      `;
    }
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('gst-print-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [mode]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <p>Loading...</p>
      </div>
    );
  }

  if (!billData) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p>Bill data not found</p>
        <Button onClick={() => navigate(`/invoices/${invoiceId}/gst-bill`)} className="mt-4">
          Back to GST Bill
        </Button>
      </div>
    );
  }

  const totals = calculateTotals();
  const isThermal = mode === 'thermal';
  const effectiveSettings = billData.settings || settings;

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="bg-white border-b border-gray-300 p-4 flex justify-between items-center no-print">
        <h1 className="text-xl font-bold">GST Bill Preview ({mode === 'thermal' ? 'Thermal 4 inch' : 'A4 Sheet'})</h1>
        <div className="flex gap-3">
          <Button onClick={handlePrint}>
            Print
          </Button>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save
          </Button>
          <Button onClick={handleSaveAndPrint}>
            Save and Print
          </Button>
        </div>
      </div>

      <div className="p-8 flex justify-center">
        <div
          id="gst-bill-preview"
          className={`bg-white border border-gray-300 rounded-lg p-6 ${isThermal ? 'w-[4in]' : 'max-w-4xl'}`}
        >
          <div className="text-center mb-6">
            <div className="mb-4 text-left">
              <p className={`${isThermal ? 'text-xs' : 'text-sm'} font-bold`}>GSTIN: {effectiveSettings.gstNumber || 'N/A'}</p>
              <p className={`${isThermal ? 'text-xs' : 'text-sm'} font-bold`}>Cell: {effectiveSettings.phone || 'N/A'}</p>
            </div>
            <h1 className={`${isThermal ? 'text-sm' : 'text-2xl'} font-bold`}>{effectiveSettings.name}</h1>
            <p className={`${isThermal ? 'text-xs' : 'text-sm'}`}>{effectiveSettings.address}</p>
          </div>

          <div className={`grid ${isThermal ? 'grid-cols-1' : 'grid-cols-2'} gap-4 mb-6`}>
            <div>
              <label className={`${isThermal ? 'text-xs' : 'text-sm'} font-semibold`}>Customer name</label>
              <div className="mt-1 p-2 bg-gray-100 rounded text-xs">{billData.customerName}</div>
            </div>
            <div>
              <label className={`${isThermal ? 'text-xs' : 'text-sm'} font-semibold`}>Customer address</label>
              <div className="mt-1 p-2 bg-gray-100 rounded text-xs">{billData.customerAddress}</div>
            </div>
          </div>

          <div className={`grid ${isThermal ? 'grid-cols-2' : 'grid-cols-2'} gap-4 mb-6`}>
            <div>
              <label className={`${isThermal ? 'text-xs' : 'text-sm'} font-semibold`}>No.</label>
              <div className="mt-1 p-2 bg-gray-100 rounded text-xs">{billData.invoiceNumber}</div>
            </div>
            <div>
              <label className={`${isThermal ? 'text-xs' : 'text-sm'} font-semibold`}>Date</label>
              <div className="mt-1 p-2 bg-gray-100 rounded text-xs">{billData.invoiceDate}</div>
            </div>
          </div>

          <div className="mb-6">
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1 text-xs text-left">No.</th>
                  <th className="border border-gray-300 p-1 text-xs text-left">Particulars</th>
                  <th className="border border-gray-300 p-1 text-xs text-left">HSN</th>
                  <th className="border border-gray-300 p-1 text-xs text-center">Qty.</th>
                  <th className="border border-gray-300 p-1 text-xs text-right">Rate</th>
                  <th className="border border-gray-300 p-1 text-xs text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {billData.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="border border-gray-300 p-1 text-xs text-center">{index + 1}</td>
                    <td className="border border-gray-300 p-1 text-xs truncate">{item.particulars}</td>
                    <td className="border border-gray-300 p-1 text-xs">{item.hsnCode}</td>
                    <td className="border border-gray-300 p-1 text-xs text-center">{item.quantity}</td>
                    <td className="border border-gray-300 p-1 text-xs text-right">₹{item.rate.toFixed(2)}</td>
                    <td className="border border-gray-300 p-1 text-xs text-right">₹{item.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2 mb-6">
            <div>
              <label className={`${isThermal ? 'text-xs' : 'text-sm'} font-semibold`}>TOTAL AMOUNT IN WORDS</label>
              <div className="mt-1 p-2 bg-gray-100 rounded text-xs">
                {getAmountInWords(totals.grandTotal)}
              </div>
            </div>

            <div className={`grid ${isThermal ? 'grid-cols-1' : 'grid-cols-2'} gap-4`}>
              <div>
                <label className={`${isThermal ? 'text-xs' : 'text-sm'} font-semibold`}>Sub Total</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-xs text-right">₹{totals.subTotal.toFixed(2)}</div>
              </div>
              <div>
                <label className={`${isThermal ? 'text-xs' : 'text-sm'} font-semibold`}>SGST 9%</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-xs text-right">₹{totals.sgst.toFixed(2)}</div>
              </div>
              <div>
                <label className={`${isThermal ? 'text-xs' : 'text-sm'} font-semibold`}>CGST 9%</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-xs text-right">₹{totals.cgst.toFixed(2)}</div>
              </div>
              <div>
                <label className={`${isThermal ? 'text-xs' : 'text-sm'} font-semibold`}>IGST %</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-xs text-right">₹0.00</div>
              </div>
              <div className={`${isThermal ? 'col-span-1' : 'col-span-2'}`}>
                <label className={`${isThermal ? 'text-xs' : 'text-sm'} font-bold ${isThermal ? 'text-sm' : 'text-lg'}`}>Grand Total</label>
                <div className="mt-1 p-2 bg-gray-100 rounded text-xs text-right font-bold">₹{totals.grandTotal.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-300">
            <div className="text-center">
              <p className={`${isThermal ? 'text-xs' : 'text-sm'} font-semibold`}>For {effectiveSettings.name}</p>
              <div className="mt-8">
                <p className={`${isThermal ? 'text-xs' : 'text-sm'}`}>Authorised Signatory</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}