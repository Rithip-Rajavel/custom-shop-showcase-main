import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { getEwayBillById, deleteEwayBill, createEwayBill } from '@/lib/api';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { Eye, Edit, Trash2 } from 'lucide-react';
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

interface GoodsItem {
  hsnCode: string;
  productName: string;
  quantity: number;
  taxableAmount: number;
  taxRate: string;
}

interface EwayBillData {
  id: string;
  invoiceId: string;
  ewayBillNo: string;
  generatedDate: string;
  generatedBy: string;
  validUpto: string;
  status: 'draft' | 'generated' | 'cancelled';
  subtotal: number;
  sgstAmount: number;
  cgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  mode: string;
  type: string;
  documentType: string;
  documentNumber: string;
  documentDate: string;
  transactionType: string;
  vehicleType: string;
  toName: string;
  toAddress: string;
  vehicleNo: string;
  goodsDetails: GoodsItem[];
}

export default function EwayBillPreview() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { settings } = useSettingsContext();
  const [billData, setBillData] = useState<EwayBillData | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  useEffect(() => {
    const fetchBillData = async () => {
      if (!id) return;
      try {
        const data = await getEwayBillById(id);
        setBillData(data);
      } catch (error) {
        console.error('Failed to fetch E-way bill:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBillData();
  }, [id]);

  const handlePrint = () => {
    window.print();
  };

  const handleEdit = () => {
    if (billData) {
      navigate(`/invoices/${billData.invoiceId}/ebay-bill`);
    }
  };

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (id) {
      try {
        await deleteEwayBill(id);
        navigate('/eway-bills');
      } catch (error) {
        console.error('Failed to delete E-way bill:', error);
      }
    }
  };

  const handleSave = async () => {
    if (!billData) return;
    try {
      await createEwayBill(billData);
      alert('E-Way Bill saved successfully!');
    } catch (error) {
      console.error('Failed to save E-Way bill:', error);
      alert('Failed to save E-Way bill');
    }
  };

  const handleSaveAndPrint = async () => {
    if (!billData) return;
    try {
      await createEwayBill(billData);
      alert('E-Way Bill saved successfully!');
      window.print();
    } catch (error) {
      console.error('Failed to save E-Way bill:', error);
      alert('Failed to save E-Way bill');
    }
  };

  const handleCancel = () => {
    navigate('/eway-bills');
  };

  const calculateTotals = () => {
    if (!billData) return { taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, other: 0, total: 0 };
    return {
      taxable: billData.subtotal,
      cgst: billData.cgstAmount,
      sgst: billData.sgstAmount,
      igst: billData.igstAmount,
      cess: 0,
      other: 0,
      total: billData.grandTotal
    };
  };

  useEffect(() => {
    // Apply print styles
    const style = document.createElement('style');
    style.id = 'eway-print-styles';
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
        #eway-bill-preview {
          width: 100% !important;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('eway-print-styles');
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, []);

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
        <p>E-Way Bill not found</p>
        <Button onClick={() => navigate('/eway-bills')} className="mt-4">
          Back to E-Way Bills
        </Button>
      </div>
    );
  }

  const totals = calculateTotals();
  const generatedDate = new Date(billData.generatedDate).toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action Bar */}
      <div className="bg-white border-b border-gray-300 p-4 flex justify-between items-center no-print">
        <h1 className="text-xl font-bold">E-Way Bill Preview</h1>
        <div className="flex gap-3 flex-wrap items-center">
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

      {/* Preview Content */}
      <div className="p-8 flex justify-center">
        <div
          id="eway-bill-preview"
          className="bg-white border border-gray-300 rounded-lg p-6 max-w-5xl"
        >
          {/* e-Way Bill Header with QR Code */}
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-center">e-WAY BILL</h1>
            </div>
            <div className="w-24 h-24 bg-white border-2 border-gray-300 flex items-center justify-center">
              {settings.gstNumber && (
                <QRCodeSVG
                  value={settings.gstNumber}
                  size={80}
                  level="M"
                  includeMargin={false}
                />
              )}
            </div>
          </div>

          {/* e-Way Bill Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <label className="font-semibold">eWay Bill No</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{billData.ewayBillNo}</div>
            </div>
            <div>
              <label className="font-semibold">Generated Date</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{generatedDate}</div>
            </div>
            <div>
              <label className="font-semibold">Generated By</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{billData.generatedBy}</div>
            </div>
            <div>
              <label className="font-semibold">Valid Upto</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">
                {billData.validUpto ? new Date(billData.validUpto).toLocaleDateString('en-IN') : '-'}
              </div>
            </div>
          </div>

          {/* Transportation Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <label className="font-semibold">Mode</label>
              <div className="mt-1 p-2 bg-gray-100 rounded capitalize">{billData.mode}</div>
            </div>
            <div>
              <label className="font-semibold">Type</label>
              <div className="mt-1 p-2 bg-gray-100 rounded capitalize">{billData.type.replace('_', ' ')}</div>
            </div>
            <div>
              <label className="font-semibold">Document Type</label>
              <div className="mt-1 p-2 bg-gray-100 rounded capitalize">{billData.documentType.replace('_', ' ')}</div>
            </div>
            <div>
              <label className="font-semibold">Transaction Type</label>
              <div className="mt-1 p-2 bg-gray-100 rounded capitalize">{billData.transactionType}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
            <div>
              <label className="font-semibold">Document No</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{billData.documentNumber}</div>
            </div>
            <div>
              <label className="font-semibold">Document Date</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">
                {new Date(billData.documentDate).toLocaleDateString('en-IN')}
              </div>
            </div>
            <div>
              <label className="font-semibold">Vehicle Type</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{billData.vehicleType}</div>
            </div>
            <div>
              <label className="font-semibold">Status</label>
              <div className="mt-1 p-2 bg-gray-100 rounded capitalize">{billData.status}</div>
            </div>
          </div>

          {/* Address Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* From Address */}
            <div className="border border-gray-300 rounded p-4">
              <h3 className="font-bold mb-3 text-lg border-b pb-2">FROM (Supplier)</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <label className="font-semibold">GSTIN</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded">{settings.gstNumber || 'N/A'}</div>
                </div>
                <div>
                  <label className="font-semibold">Name</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded">{settings.name}</div>
                </div>
                <div>
                  <label className="font-semibold">Address</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded">{settings.address}</div>
                </div>
              </div>
            </div>

            {/* To Address */}
            <div className="border border-gray-300 rounded p-4">
              <h3 className="font-bold mb-3 text-lg border-b pb-2">TO (Recipient)</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <label className="font-semibold">Name</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded">{billData.toName}</div>
                </div>
                <div>
                  <label className="font-semibold">Address</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded">{billData.toAddress}</div>
                </div>
                <div>
                  <label className="font-semibold">Vehicle No</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded">{billData.vehicleNo}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Goods Details Table */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-lg border-b pb-2">Goods Details</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-2">HSN Code</th>
                    <th className="border border-gray-300 p-2">Product Name & Desc.</th>
                    <th className="border border-gray-300 p-2">Quantity</th>
                    <th className="border border-gray-300 p-2">Taxable Amount (Rs.)</th>
                    <th className="border border-gray-300 p-2">Tax Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {billData.goodsDetails.map((item, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 p-2">{item.hsnCode}</td>
                      <td className="border border-gray-300 p-2">{item.productName}</td>
                      <td className="border border-gray-300 p-2">{item.quantity.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2 text-right">{item.taxableAmount.toFixed(2)}</td>
                      <td className="border border-gray-300 p-2">{item.taxRate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Summary of Amounts */}
          <div className="mb-6">
            <h3 className="font-bold mb-3 text-lg border-b pb-2">Summary of Amounts</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <tbody>
                  <tr>
                    <td className="border border-gray-300 p-2 font-semibold">Tot. Tax'ble Amt</td>
                    <td className="border border-gray-300 p-2 text-right">₹{totals.taxable.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-semibold">CGST Amt</td>
                    <td className="border border-gray-300 p-2 text-right">₹{totals.cgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-semibold">SGST Amt</td>
                    <td className="border border-gray-300 p-2 text-right">₹{totals.sgst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-semibold">IGST Amt</td>
                    <td className="border border-gray-300 p-2 text-right">₹{totals.igst.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-semibold">CESS Amt</td>
                    <td className="border border-gray-300 p-2 text-right">₹{totals.cess.toFixed(2)}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 p-2 font-semibold">Other Amt</td>
                    <td className="border border-gray-300 p-2 text-right">₹{totals.other.toFixed(2)}</td>
                  </tr>
                  <tr className="font-bold text-lg">
                    <td className="border border-gray-300 p-2">Total Inv.Amt</td>
                    <td className="border border-gray-300 p-2 text-right">₹{totals.total.toFixed(2)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* GST Barcode */}
          <div className="flex justify-center items-center mb-6">
            <div className="w-64 h-16 bg-white border-2 border-gray-300 flex items-center justify-center">
              {billData.ewayBillNo && (
                <Barcode
                  value={billData.ewayBillNo}
                  width={1.5}
                  height={50}
                  format="CODE128"
                  displayValue={true}
                  fontSize={12}
                  margin={5}
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete E-Way Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this E-Way bill? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
