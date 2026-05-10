import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Invoice } from '@/types';
import { apiGet } from '@/lib/api';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';
import { createEwayBill } from '@/lib/api';

interface GoodsItem {
  hsnCode: string;
  productName: string;
  quantity: number;
  taxableAmount: number;
  taxRate: string;
}

interface TransportDetails {
  mode: 'road' | 'rail' | 'air' | 'ship';
  approxDistance: string;
  type: 'outward_supply' | 'inward_supply' | 'others';
  documentType: 'tax_invoice' | 'delivery_challan' | 'others';
  documentNumber: string;
  documentDate: string;
  transactionType: 'regular' | 'others';
  transporterId: string;
  transporterName: string;
  transporterDocNo: string;
  transporterDocDate: string;
  vehicleNo: string;
  vehicleType: string;
  fromPlace: string;
  fromPincode: string;
  fromState: string;
  toPlace: string;
  toPincode: string;
  toState: string;
  toName: string;
  toAddress: string;
}

export default function EbayBillPreview() {
  const { invoiceId, mode } = useParams<{ invoiceId: string; mode: string }>();
  const navigate = useNavigate();
  const { settings } = useSettingsContext();
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // Generate random 12-digit e-way bill number
  const generateRandomEwayBillNo = () => {
    return Math.floor(100000000000 + Math.random() * 900000000000).toString();
  };

  const [ewayBillNo, setEwayBillNo] = useState(generateRandomEwayBillNo());
  const [generatedDate, setGeneratedDate] = useState(new Date().toLocaleString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  }));
  const [validUpto, setValidUpto] = useState('');
  const [portal, setPortal] = useState('1');
  const [hsnCodes, setHsnCodes] = useState<Record<string, string>>({});
  const [transportDetails, setTransportDetails] = useState<TransportDetails>({
    mode: 'road',
    approxDistance: '10',
    type: 'outward_supply',
    documentType: 'tax_invoice',
    documentNumber: '',
    documentDate: new Date().toISOString().split('T')[0],
    transactionType: 'regular',
    transporterId: '',
    transporterName: '',
    transporterDocNo: '',
    transporterDocDate: '',
    vehicleNo: '',
    vehicleType: 'R',
    fromPlace: 'Jolarpet',
    fromPincode: '635851',
    fromState: 'Tamil Nadu',
    toPlace: '',
    toPincode: '',
    toState: '',
    toName: '',
    toAddress: ''
  });

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const data = await apiGet<Invoice>(`/api/invoices/${invoiceId}`);
        setInvoice(data);

        // Read transport details from localStorage if available
        const savedTransportDetails = localStorage.getItem('ewayBillTransportDetails');
        const savedEwayBillNo = localStorage.getItem('ewayBillNo');
        const savedValidUpto = localStorage.getItem('validUpto');
        const savedPortal = localStorage.getItem('portal');
        const savedHsnCodes = localStorage.getItem('ewayBillHsnCodes');

        if (savedEwayBillNo) setEwayBillNo(savedEwayBillNo);
        if (savedValidUpto) setValidUpto(savedValidUpto);
        if (savedPortal) setPortal(savedPortal);
        if (savedHsnCodes) setHsnCodes(JSON.parse(savedHsnCodes));

        if (savedTransportDetails) {
          const parsedTransportDetails = JSON.parse(savedTransportDetails);
          setTransportDetails(prev => ({
            ...prev,
            ...parsedTransportDetails,
            documentNumber: data.invoiceNumber,
            documentDate: new Date(data.createdAt).toISOString().split('T')[0],
            toPlace: data.customerName.split(' ').slice(-2).join(' ') || 'Tirupattur',
            toName: data.customerName,
            toAddress: `${data.customerName.split(' ').slice(-2).join(' ')}, Tirupattur District, Tamil Nadu-635601`
          }));
        } else {
          setTransportDetails(prev => ({
            ...prev,
            documentNumber: data.invoiceNumber,
            documentDate: new Date(data.createdAt).toISOString().split('T')[0],
            toPlace: data.customerName.split(' ').slice(-2).join(' ') || 'Tirupattur',
            toName: data.customerName,
            toAddress: `${data.customerName.split(' ').slice(-2).join(' ')}, Tirupattur District, Tamil Nadu-635601`,
            transporterName: data.customerName
          }));
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
    window.print();
  };

  const handleSave = async () => {
    if (!invoice) return;
    try {
      const subtotal = invoice.items.reduce((sum, item) => sum + item.subtotal, 0);
      const sgstAmount = Math.round((subtotal * 0.09) * 100) / 100;
      const cgstAmount = Math.round((subtotal * 0.09) * 100) / 100;
      const igstAmount = 0.01;
      const grandTotal = Math.round((subtotal + sgstAmount + cgstAmount + igstAmount) * 100) / 100;

      const goodsDetails = invoice.items.map((item, index) => ({
        hsnCode: hsnCodes[item.id] || '4412',
        productName: item.productName,
        quantity: item.quantity,
        taxableAmount: item.subtotal,
        taxRate: '9.000+9.000+NE+NE+0.00'
      }));

      const payload = {
        invoiceId: invoiceId,
        ewayBillNo: ewayBillNo,
        generatedDate: new Date().toISOString(),
        generatedBy: settings.name || 'User',
        validUpto: validUpto,
        status: 'generated',
        subtotal: subtotal,
        sgstAmount: sgstAmount,
        cgstAmount: cgstAmount,
        igstAmount: igstAmount,
        grandTotal: grandTotal,
        mode: transportDetails.mode,
        type: transportDetails.type,
        documentType: transportDetails.documentType,
        documentNumber: transportDetails.documentNumber,
        documentDate: transportDetails.documentDate,
        transactionType: transportDetails.transactionType,
        vehicleType: transportDetails.vehicleType,
        toName: transportDetails.toName,
        toAddress: transportDetails.toAddress,
        vehicleNo: transportDetails.vehicleNo,
        goodsDetails: goodsDetails,
        fromAddress: settings.address || '',
        fromGstin: settings.gstNumber || '',
        fromName: settings.name || ''
      };

      await createEwayBill(payload);
      alert('E-Way Bill saved successfully!');
    } catch (error) {
      console.error('Failed to save E-Way bill:', error);
      alert('Failed to save E-Way bill');
    }
  };

  const handleSaveAndPrint = async () => {
    if (!invoice) return;
    try {
      const subtotal = invoice.items.reduce((sum, item) => sum + item.subtotal, 0);
      const sgstAmount = Math.round((subtotal * 0.09) * 100) / 100;
      const cgstAmount = Math.round((subtotal * 0.09) * 100) / 100;
      const igstAmount = 0.01;
      const grandTotal = Math.round((subtotal + sgstAmount + cgstAmount + igstAmount) * 100) / 100;

      const goodsDetails = invoice.items.map((item, index) => ({
        hsnCode: hsnCodes[item.id] || '4412',
        productName: item.productName,
        quantity: item.quantity,
        taxableAmount: item.subtotal,
        taxRate: '9.000+9.000+NE+NE+0.00'
      }));

      const payload = {
        invoiceId: invoiceId,
        ewayBillNo: ewayBillNo,
        generatedDate: new Date().toISOString(),
        generatedBy: settings.name || 'User',
        validUpto: validUpto,
        status: 'generated',
        subtotal: subtotal,
        sgstAmount: sgstAmount,
        cgstAmount: cgstAmount,
        igstAmount: igstAmount,
        grandTotal: grandTotal,
        mode: transportDetails.mode,
        type: transportDetails.type,
        documentType: transportDetails.documentType,
        documentNumber: transportDetails.documentNumber,
        documentDate: transportDetails.documentDate,
        transactionType: transportDetails.transactionType,
        vehicleType: transportDetails.vehicleType,
        toName: transportDetails.toName,
        toAddress: transportDetails.toAddress,
        vehicleNo: transportDetails.vehicleNo,
        goodsDetails: goodsDetails,
        fromAddress: settings.address || '',
        fromGstin: settings.gstNumber || '',
        fromName: settings.name || ''
      };

      await createEwayBill(payload);
      alert('E-Way Bill saved successfully!');
      window.print();
    } catch (error) {
      console.error('Failed to save E-Way bill:', error);
      alert('Failed to save E-Way bill');
    }
  };

  const handleCancel = () => {
    navigate(`/invoices/${invoiceId}/ebay-bill`);
  };

  const getGoodsDetails = (): GoodsItem[] => {
    if (!invoice) return [];
    return invoice.items.map(item => ({
      hsnCode: hsnCodes[item.id] || '4412',
      productName: item.productName,
      quantity: item.quantity,
      taxableAmount: item.subtotal,
      taxRate: '9.000+9.000+NE+NE+0.00'
    }));
  };

  const calculateTotals = () => {
    if (!invoice) return { taxable: 0, cgst: 0, sgst: 0, igst: 0, cess: 0, other: 0, total: 0 };
    const taxable = invoice.subtotal;
    const cgst = taxable * 0.09;
    const sgst = taxable * 0.09;
    const igst = 0;
    const cess = 0;
    const other = 0;
    const total = taxable + cgst + sgst + igst + cess + other;
    return { taxable, cgst, sgst, igst, cess, other, total };
  };

  useEffect(() => {
    // Apply print styles based on mode
    const style = document.createElement('style');
    style.id = 'print-styles';
    if (mode === 'thermal') {
      style.textContent = `
        @media print {
          @page {
            size: 4in auto;
            margin: 0.1in;
          }
          body {
            margin: 0;
            padding: 0;
            overflow: hidden !important;
          }
          html {
            overflow: hidden !important;
          }
          .no-print {
            display: none !important;
          }
          #eway-bill-preview {
            width: 4in !important;
            max-width: 4in !important;
            font-size: 9px !important;
            padding: 0.1in !important;
            margin: 0 !important;
            overflow: hidden !important;
            box-sizing: border-box !important;
          }
          #eway-bill-preview * {
            font-size: 9px !important;
            overflow: hidden !important;
            word-wrap: break-word !important;
            word-break: break-word !important;
          }
          .bg-white, .bg-gray-100 {
            background-color: white !important;
          }
          table {
            font-size: 7px !important;
            width: 100% !important;
            table-layout: fixed !important;
          }
          table td, table th {
            padding: 2px !important;
            word-wrap: break-word !important;
            word-break: break-word !important;
            overflow: hidden !important;
          }
          .border {
            border-width: 1px !important;
          }
          .text-2xl {
            font-size: 12px !important;
          }
          .text-lg {
            font-size: 10px !important;
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
          .w-24, .h-24 {
            width: 50px !important;
            height: 50px !important;
          }
          .w-64 {
            width: 150px !important;
          }
          .h-16 {
            height: 35px !important;
          }
          .grid-cols-2 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .grid-cols-4 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .grid-cols-3 {
            grid-template-columns: repeat(2, 1fr) !important;
          }
          .overflow-x-auto {
            overflow-x: hidden !important;
          }
          input, select {
            font-size: 9px !important;
            padding: 2px !important;
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
          #eway-bill-preview {
            width: 100% !important;
          }
        }
      `;
    }
    document.head.appendChild(style);

    return () => {
      const existingStyle = document.getElementById('print-styles');
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

  if (!invoice) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <p>Invoice not found</p>
        <Button onClick={() => navigate(`/invoices/${invoiceId}/ebay-bill`)} className="mt-4">
          Back to eBay Bill
        </Button>
      </div>
    );
  }

  const goods = getGoodsDetails();
  const totals = calculateTotals();
  const isThermal = mode === 'thermal';

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Action Bar */}
      <div className="bg-white border-b border-gray-300 p-4 flex justify-between items-center no-print">
        <h1 className="text-xl font-bold">e-Way Bill Preview ({mode === 'thermal' ? 'Thermal 4 inch' : 'A4 Sheet'})</h1>
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
          className={`bg-white border border-gray-300 rounded-lg p-6 ${isThermal ? 'w-[4in]' : 'max-w-5xl'}`}
        >
          {/* e-Way Bill Header with QR Code */}
          <div className="flex justify-between items-start border-b-2 border-gray-800 pb-4 mb-4">
            <div className="flex-1">
              <h1 className={`${isThermal ? 'text-sm' : 'text-2xl'} font-bold text-center`}>e-WAY BILL</h1>
            </div>
            <div className={`${isThermal ? 'w-16 h-16' : 'w-24 h-24'} bg-white border-2 border-gray-300 flex items-center justify-center`}>
              {settings.gstNumber && (
                <QRCodeSVG
                  value={settings.gstNumber}
                  size={isThermal ? 50 : 80}
                  level="M"
                  includeMargin={false}
                />
              )}
            </div>
          </div>

          {/* e-Way Bill Details */}
          <div className={`grid ${isThermal ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4 mb-6 text-sm`}>
            <div>
              <label className="font-semibold">eWay Bill No</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{ewayBillNo}</div>
            </div>
            <div>
              <label className="font-semibold">Generated Date</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{generatedDate}</div>
            </div>
            <div>
              <label className="font-semibold">Generated By</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{settings.gstNumber || 'N/A'}</div>
            </div>
            <div>
              <label className="font-semibold">Valid Upto</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{validUpto || 'N/A'}</div>
            </div>
          </div>

          {/* Transportation Details */}
          <div className={`grid ${isThermal ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4 mb-6 text-sm`}>
            <div>
              <label className="font-semibold">Mode</label>
              <div className="mt-1 p-2 bg-gray-100 rounded capitalize">{transportDetails.mode}</div>
            </div>
            <div>
              <label className="font-semibold">Approx Distance (km)</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{transportDetails.approxDistance}</div>
            </div>
            <div>
              <label className="font-semibold">Type</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{transportDetails.type.replace('_', ' ')}</div>
            </div>
            <div>
              <label className="font-semibold">Document Type</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{transportDetails.documentType.replace('_', ' ')}</div>
            </div>
          </div>

          <div className={`grid ${isThermal ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-4'} gap-4 mb-6 text-sm`}>
            <div>
              <label className="font-semibold">Document No</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{transportDetails.documentNumber}</div>
            </div>
            <div>
              <label className="font-semibold">Document Date</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{transportDetails.documentDate}</div>
            </div>
            <div>
              <label className="font-semibold">Transaction Type</label>
              <div className="mt-1 p-2 bg-gray-100 rounded capitalize">{transportDetails.transactionType}</div>
            </div>
            <div>
              <label className="font-semibold">Portal</label>
              <div className="mt-1 p-2 bg-gray-100 rounded">{portal}</div>
            </div>
          </div>

          {/* Address Details */}
          <div className={`grid ${isThermal ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-6 mb-6`}>
            {/* From Address */}
            <div className="border border-gray-300 rounded p-4">
              <h3 className={`${isThermal ? 'text-sm' : 'text-lg'} font-bold mb-3 border-b pb-2`}>FROM (Supplier)</h3>
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
              <h3 className={`${isThermal ? 'text-sm' : 'text-lg'} font-bold mb-3 border-b pb-2`}>TO (Recipient)</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <label className="font-semibold">GSTIN</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded">{transportDetails.transporterId || 'N/A'}</div>
                </div>
                <div>
                  <label className="font-semibold">Name</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded">{transportDetails.toName}</div>
                </div>
                <div>
                  <label className="font-semibold">Address</label>
                  <div className="mt-1 p-2 bg-gray-100 rounded">{transportDetails.toAddress}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Goods Details Table */}
          <div className="mb-6">
            <h3 className={`${isThermal ? 'text-sm' : 'text-lg'} font-bold mb-3 border-b pb-2`}>Goods Details</h3>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1 text-xs">HSN</th>
                  <th className="border border-gray-300 p-1 text-xs">Product</th>
                  <th className="border border-gray-300 p-1 text-xs">Qty</th>
                  <th className="border border-gray-300 p-1 text-xs">Amount</th>
                  <th className="border border-gray-300 p-1 text-xs">Tax Rate</th>
                </tr>
              </thead>
              <tbody>
                {goods.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-1 text-xs">{item.hsnCode}</td>
                    <td className="border border-gray-300 p-1 text-xs truncate">{item.productName}</td>
                    <td className="border border-gray-300 p-1 text-xs text-right">{item.quantity.toFixed(2)}</td>
                    <td className="border border-gray-300 p-1 text-xs text-right">{item.taxableAmount.toFixed(2)}</td>
                    <td className="border border-gray-300 p-1 text-xs">{item.taxRate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Summary of Amounts */}
          <div className="mb-6">
            <h3 className={`${isThermal ? 'text-sm' : 'text-lg'} font-bold mb-3 border-b pb-2`}>Summary of Amounts</h3>
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-1 text-xs font-semibold">Taxable Amt</td>
                  <td className="border border-gray-300 p-1 text-xs text-right">₹{totals.taxable.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 text-xs font-semibold">CGST Amt</td>
                  <td className="border border-gray-300 p-1 text-xs text-right">₹{totals.cgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 text-xs font-semibold">SGST Amt</td>
                  <td className="border border-gray-300 p-1 text-xs text-right">₹{totals.sgst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 text-xs font-semibold">IGST Amt</td>
                  <td className="border border-gray-300 p-1 text-xs text-right">₹{totals.igst.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 text-xs font-semibold">CESS Amt</td>
                  <td className="border border-gray-300 p-1 text-xs text-right">₹{totals.cess.toFixed(2)}</td>
                </tr>
                <tr>
                  <td className="border border-gray-300 p-1 text-xs font-semibold">Other Amt</td>
                  <td className="border border-gray-300 p-1 text-xs text-right">₹{totals.other.toFixed(2)}</td>
                </tr>
                <tr className="font-bold text-sm">
                  <td className="border border-gray-300 p-1 text-xs">Total Amt</td>
                  <td className="border border-gray-300 p-1 text-xs text-right">₹{totals.total.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Transportation Details */}
          <div className="mb-6">
            <h3 className={`${isThermal ? 'text-sm' : 'text-lg'} font-bold mb-3 border-b pb-2`}>4. Transportation Details</h3>
            <div className={`grid ${isThermal ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'} gap-4 text-sm mb-4`}>
              <div>
                <label className="font-semibold">Transporter ID & Name</label>
                <div className="mt-1 p-2 bg-gray-100 rounded">
                  {transportDetails.transporterId} {transportDetails.transporterName}
                </div>
              </div>
              <div>
                <label className="font-semibold">Transporter Doc. No & Date</label>
                <div className="mt-1 p-2 bg-gray-100 rounded">
                  {transportDetails.transporterDocNo} {transportDetails.transporterDocDate}
                </div>
              </div>
            </div>

            {/* Vehicle Details Table */}
            <h3 className={`${isThermal ? 'text-sm' : 'text-lg'} font-bold mb-3 border-b pb-2`}>5. Vehicle Details</h3>
            <table className="w-full border-collapse border border-gray-300 text-xs">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-1 text-xs">Mode</th>
                  <th className="border border-gray-300 p-1 text-xs">Vehicle/Doc</th>
                  <th className="border border-gray-300 p-1 text-xs">From</th>
                  <th className="border border-gray-300 p-1 text-xs">Date</th>
                  <th className="border border-gray-300 p-1 text-xs">By</th>
                  <th className="border border-gray-300 p-1 text-xs">CEWB</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-1 text-xs capitalize">{transportDetails.mode}</td>
                  <td className="border border-gray-300 p-1 text-xs">{transportDetails.vehicleNo}</td>
                  <td className="border border-gray-300 p-1 text-xs">{transportDetails.fromPlace}</td>
                  <td className="border border-gray-300 p-1 text-xs text-center">{generatedDate}</td>
                  <td className="border border-gray-300 p-1 text-xs text-center">{settings.gstNumber?.substring(0, 10) || 'N/A'}</td>
                  <td className="border border-gray-300 p-1 text-xs text-center">-</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* GST Barcode */}
          <div className="flex justify-center items-center mb-6">
            <div className={`${isThermal ? 'w-48' : 'w-64'} h-16 bg-white border-2 border-gray-300 flex items-center justify-center`}>
              {ewayBillNo && (
                <Barcode
                  value={ewayBillNo}
                  width={isThermal ? 1 : 1.5}
                  height={isThermal ? 40 : 50}
                  format="CODE128"
                  displayValue={true}
                  fontSize={isThermal ? 10 : 12}
                  margin={5}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
