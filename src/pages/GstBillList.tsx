import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getGstBills, deleteGstBill } from '@/lib/api';
import { Eye, Edit, Trash2, Search } from 'lucide-react';
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

interface GstBill {
  id: string;
  invoiceId: string;
  customerName: string;
  customerAddress: string;
  invoiceNumber: string;
  invoiceDate: string;
  subtotal: number;
  sgstAmount: number;
  cgstAmount: number;
  igstAmount: number;
  grandTotal: number;
  amountInWords: string;
  createdAt: string;
  updatedAt: string;
}

export default function GstBillList() {
  const navigate = useNavigate();
  const [gstBills, setGstBills] = useState<GstBill[]>([]);
  const [filteredBills, setFilteredBills] = useState<GstBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchGstBills();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [gstBills, searchTerm]);

  const fetchGstBills = async () => {
    try {
      setLoading(true);
      const data = await getGstBills({ page: 0, limit: 100 });
      setGstBills(data || []);
    } catch (error) {
      console.error('Failed to fetch GST bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...gstBills];

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(bill =>
        bill.customerName.toLowerCase().includes(term) ||
        bill.invoiceNumber.toLowerCase().includes(term) ||
        bill.invoiceId.toLowerCase().includes(term)
      );
    }

    setFilteredBills(filtered);
  };

  const handlePreview = (id: string, invoiceId: string) => {
    navigate(`/invoices/${invoiceId}/gst-bill/preview/a4?billId=${id}`);
  };

  const handleEdit = (id: string, invoiceId: string) => {
    navigate(`/invoices/${invoiceId}/gst-bill?billId=${id}`);
  };

  const handleDeleteClick = (id: string) => {
    setBillToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (billToDelete) {
      try {
        await deleteGstBill(billToDelete);
        setGstBills(gstBills.filter(bill => bill.id !== billToDelete));
        setDeleteDialogOpen(false);
        setBillToDelete(null);
      } catch (error) {
        console.error('Failed to delete GST bill:', error);
      }
    }
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

  return (
    <MainLayout>
      <PageHeader title="GST Bills" description="Manage your GST bills" />

      <div className="bg-white border border-gray-300 rounded-lg p-6">
        {/* Search */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by customer name, invoice no, or invoice ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="text-right text-sm text-gray-500">
            Total: {filteredBills.length} bills
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-3 text-left">Invoice No</th>
                <th className="border border-gray-300 p-3 text-left">Customer Name</th>
                <th className="border border-gray-300 p-3 text-left">Invoice Date</th>
                <th className="border border-gray-300 p-3 text-left">Customer Address</th>
                <th className="border border-gray-300 p-3 text-right">Grand Total</th>
                <th className="border border-gray-300 p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={6} className="border border-gray-300 p-8 text-center text-gray-500">
                    No GST bills found
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">{bill.invoiceNumber}</td>
                    <td className="border border-gray-300 p-3">{bill.customerName}</td>
                    <td className="border border-gray-300 p-3">
                      {new Date(bill.invoiceDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="border border-gray-300 p-3 text-sm max-w-xs truncate">
                      {bill.customerAddress}
                    </td>
                    <td className="border border-gray-300 p-3 text-right font-medium">
                      ₹{bill.grandTotal.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(bill.id, bill.invoiceId)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(bill.id, bill.invoiceId)}
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(bill.id)}
                          title="Delete"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete GST Bill</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this GST bill? This action cannot be undone.
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
    </MainLayout>
  );
}
