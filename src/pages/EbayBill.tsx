import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Invoice } from '@/types';
import { apiGet } from '@/lib/api';
import { useSettingsContext } from '@/contexts/SettingsContext';
import { QRCodeSVG } from 'qrcode.react';
import Barcode from 'react-barcode';

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

export default function EbayBill() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
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
    minute: '2-digit'
  }));
  const [validUpto, setValidUpto] = useState('');
  const [portal, setPortal] = useState('1');
  const [printMode, setPrintMode] = useState<'a4' | 'thermal'>('a4');
  const [showPrintDialog, setShowPrintDialog] = useState(false);
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
        setTransportDetails(prev => ({
          ...prev,
          documentNumber: data.invoiceNumber,
          documentDate: new Date(data.createdAt).toISOString().split('T')[0],
          toPlace: data.customerName.split(' ').slice(-2).join(' ') || 'Tirupattur',
          toName: data.customerName,
          toAddress: `${data.customerName.split(' ').slice(-2).join(' ')}, Tirupattur District, Tamil Nadu-635601`
        }));
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
    // Save transport details to localStorage for preview page
    localStorage.setItem('ewayBillTransportDetails', JSON.stringify(transportDetails));
    localStorage.setItem('ewayBillNo', ewayBillNo);
    localStorage.setItem('validUpto', validUpto);
    localStorage.setItem('portal', portal);
    localStorage.setItem('ewayBillHsnCodes', JSON.stringify(hsnCodes));
    navigate(`/invoices/${invoiceId}/ebay-bill/preview/${printMode}`);
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

  const goods = getGoodsDetails();
  const totals = calculateTotals();

  return (
    <MainLayout>
      <PageHeader title="e-Way Bill" description={`Invoice ${invoice.invoiceNumber}`} />

      <div className="bg-white border border-gray-300 rounded-lg p-6 max-w-5xl mx-auto" id="eway-bill-content">
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
            <Label className="font-semibold">eWay Bill No</Label>
            <Input
              value={ewayBillNo}
              onChange={(e) => setEwayBillNo(e.target.value)}
              placeholder="Enter eWay Bill No"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="font-semibold">Generated Date</Label>
            <div className="mt-1 p-2 bg-gray-100 rounded">{generatedDate}</div>
          </div>
          <div>
            <Label className="font-semibold">Generated By</Label>
            <div className="mt-1 p-2 bg-gray-100 rounded">{settings.gstNumber || 'N/A'}</div>
          </div>
          <div>
            <Label className="font-semibold">Valid Upto</Label>
            <Input
              type="date"
              value={validUpto}
              onChange={(e) => setValidUpto(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Transportation Details */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div>
            <Label className="font-semibold">Mode</Label>
            <Select value={transportDetails.mode} onValueChange={(value: any) => setTransportDetails({ ...transportDetails, mode: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="road">Road</SelectItem>
                <SelectItem value="rail">Rail</SelectItem>
                <SelectItem value="air">Air</SelectItem>
                <SelectItem value="ship">Ship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-semibold">Approx Distance (km)</Label>
            <Input
              value={transportDetails.approxDistance}
              onChange={(e) => setTransportDetails({ ...transportDetails, approxDistance: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="font-semibold">Type</Label>
            <Select value={transportDetails.type} onValueChange={(value: any) => setTransportDetails({ ...transportDetails, type: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="outward_supply">Outward - Supply</SelectItem>
                <SelectItem value="inward_supply">Inward - Supply</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-semibold">Document Type</Label>
            <Select value={transportDetails.documentType} onValueChange={(value: any) => setTransportDetails({ ...transportDetails, documentType: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tax_invoice">Tax Invoice</SelectItem>
                <SelectItem value="delivery_challan">Delivery Challan</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-sm">
          <div>
            <Label className="font-semibold">Document No</Label>
            <Input
              value={transportDetails.documentNumber}
              onChange={(e) => setTransportDetails({ ...transportDetails, documentNumber: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="font-semibold">Document Date</Label>
            <Input
              type="date"
              value={transportDetails.documentDate}
              onChange={(e) => setTransportDetails({ ...transportDetails, documentDate: e.target.value })}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="font-semibold">Transaction Type</Label>
            <Select value={transportDetails.transactionType} onValueChange={(value: any) => setTransportDetails({ ...transportDetails, transactionType: value })}>
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="font-semibold">Portal</Label>
            <Input
              value={portal}
              onChange={(e) => setPortal(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        {/* Address Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* From Address */}
          <div className="border border-gray-300 rounded p-4">
            <h3 className="font-bold mb-3 text-lg border-b pb-2">FROM (Supplier)</h3>
            <div className="space-y-2 text-sm">
              <div>
                <Label className="font-semibold">GSTIN</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded">{settings.gstNumber || 'N/A'}</div>
              </div>
              <div>
                <Label className="font-semibold">Name</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded">{settings.name}</div>
              </div>
              <div>
                <Label className="font-semibold">Address</Label>
                <div className="mt-1 p-2 bg-gray-100 rounded">{settings.address}</div>
              </div>
            </div>
          </div>

          {/* To Address */}
          <div className="border border-gray-300 rounded p-4">
            <h3 className="font-bold mb-3 text-lg border-b pb-2">TO (Recipient)</h3>
            <div className="space-y-2 text-sm">
              <div>
                <Label className="font-semibold">GSTIN</Label>
                <Input
                  value={transportDetails.transporterId}
                  onChange={(e) => setTransportDetails({ ...transportDetails, transporterId: e.target.value })}
                  placeholder="Enter Recipient GSTIN"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="font-semibold">Name</Label>
                <Input
                  value={transportDetails.toName}
                  onChange={(e) => setTransportDetails({ ...transportDetails, toName: e.target.value })}
                  placeholder="Enter Recipient Name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="font-semibold">Address</Label>
                <Input
                  value={transportDetails.toAddress}
                  onChange={(e) => setTransportDetails({ ...transportDetails, toAddress: e.target.value })}
                  placeholder="Enter Recipient Address"
                  className="mt-1"
                />
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
                  <th className="border border-gray-300 p-2">Tax Rate (C+S+I+Cess+Cess Non.Advol)</th>
                </tr>
              </thead>
              <tbody>
                {goods.map((item, index) => (
                  <tr key={index}>
                    <td className="border border-gray-300 p-2">
                      <Input
                        value={hsnCodes[invoice?.items[index]?.id] || '4412'}
                        onChange={(e) => {
                          if (invoice?.items[index]?.id) {
                            setHsnCodes(prev => ({
                              ...prev,
                              [invoice.items[index].id]: e.target.value
                            }));
                          }
                        }}
                        className="border-0 p-0 text-sm"
                        placeholder="HSN Code"
                      />
                    </td>
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
                  <td className="border border-gray-300 p-2 font-semibold">CESS Non.Advol Amt</td>
                  <td className="border border-gray-300 p-2 text-right">₹{totals.other.toFixed(2)}</td>
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

        {/* Transportation Details */}
        <div className="mb-6">
          <h3 className="font-bold mb-3 text-lg border-b pb-2">4. Transportation Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-4">
            <div>
              <Label className="font-semibold">Transporter ID & Name</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={transportDetails.transporterId}
                  onChange={(e) => setTransportDetails({ ...transportDetails, transporterId: e.target.value })}
                  placeholder="Enter Transporter ID"
                  className="flex-1"
                />
                <Input
                  value={transportDetails.transporterName}
                  onChange={(e) => setTransportDetails({ ...transportDetails, transporterName: e.target.value })}
                  placeholder="Enter Transporter Name"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label className="font-semibold">Transporter Doc. No & Date</Label>
              <div className="flex gap-2 mt-1">
                <Input
                  value={transportDetails.transporterDocNo}
                  onChange={(e) => setTransportDetails({ ...transportDetails, transporterDocNo: e.target.value })}
                  placeholder="Enter Doc No"
                  className="flex-1"
                />
                <Input
                  type="date"
                  value={transportDetails.transporterDocDate}
                  onChange={(e) => setTransportDetails({ ...transportDetails, transporterDocDate: e.target.value })}
                  className="flex-1"
                />
              </div>
            </div>
          </div>

          {/* Vehicle Details Table */}
          <h3 className="font-bold mb-3 text-lg border-b pb-2">5. Vehicle Details</h3>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border border-gray-300 text-sm">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 p-2">Mode</th>
                  <th className="border border-gray-300 p-2">Vehicle / Trans Doc No & Dt.</th>
                  <th className="border border-gray-300 p-2">From</th>
                  <th className="border border-gray-300 p-2">Entered Date</th>
                  <th className="border border-gray-300 p-2">Entered By</th>
                  <th className="border border-gray-300 p-2">CEWB No. (If any)</th>
                  <th className="border border-gray-300 p-2">Multi Veh.Info (If any)</th>
                  <th className="border border-gray-300 p-2">Portal</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">
                    <Select
                      value={transportDetails.mode}
                      onValueChange={(value: any) => setTransportDetails({ ...transportDetails, mode: value })}
                    >
                      <SelectTrigger className="w-full border-0 p-0 h-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="road">Road</SelectItem>
                        <SelectItem value="rail">Rail</SelectItem>
                        <SelectItem value="air">Air</SelectItem>
                        <SelectItem value="ship">Ship</SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="border border-gray-300 p-2">
                    <div className="flex gap-1">
                      <Input
                        value={transportDetails.vehicleNo}
                        onChange={(e) => setTransportDetails({ ...transportDetails, vehicleNo: e.target.value })}
                        placeholder="Vehicle No"
                        className="flex-1 border-0 p-1"
                      />
                      <Input
                        type="date"
                        value={transportDetails.transporterDocDate}
                        onChange={(e) => setTransportDetails({ ...transportDetails, transporterDocDate: e.target.value })}
                        className="border-0 p-1"
                      />
                    </div>
                  </td>
                  <td className="border border-gray-300 p-2">
                    <Input
                      value={transportDetails.fromPlace}
                      onChange={(e) => setTransportDetails({ ...transportDetails, fromPlace: e.target.value })}
                      placeholder="From"
                      className="border-0 p-1"
                    />
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {generatedDate}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {settings.gstNumber || 'N/A'}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    -
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    -
                  </td>
                  <td className="border border-gray-300 p-2 text-center">
                    {portal}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* GST Barcode */}
        <div className="flex justify-center items-center mb-6">
          <div className="w-64 h-16 bg-white border-2 border-gray-300 flex items-center justify-center">
            {ewayBillNo && (
              <Barcode
                value={ewayBillNo}
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
