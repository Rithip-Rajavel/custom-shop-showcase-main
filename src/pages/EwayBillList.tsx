import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { getEwayBills, getEwayBillsByStatus, deleteEwayBill } from '@/lib/api';
import { Eye, Edit, Trash2, Search, Filter } from 'lucide-react';
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

interface EwayBill {
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
}

export default function EwayBillList() {
  const navigate = useNavigate();
  const [ewayBills, setEwayBills] = useState<EwayBill[]>([]);
  const [filteredBills, setFilteredBills] = useState<EwayBill[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'generated' | 'cancelled'>('all');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [billToDelete, setBillToDelete] = useState<string | null>(null);

  useEffect(() => {
    fetchEwayBills();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [ewayBills, searchTerm, statusFilter]);

  const fetchEwayBills = async () => {
    try {
      setLoading(true);
      const data = await getEwayBills({ page: 0, limit: 100 });
      setEwayBills(data || []);
    } catch (error) {
      console.error('Failed to fetch E-way bills:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...ewayBills];

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(bill => bill.status === statusFilter);
    }

    // Apply search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(bill =>
        bill.ewayBillNo.toLowerCase().includes(term) ||
        bill.invoiceId.toLowerCase().includes(term)
      );
    }

    setFilteredBills(filtered);
  };

  const handlePreview = (id: string) => {
    navigate(`/eway-bills/${id}/preview`);
  };

  const handleEdit = (id: string, invoiceId: string) => {
    navigate(`/invoices/${invoiceId}/ebay-bill`);
  };

  const handleDeleteClick = (id: string) => {
    setBillToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (billToDelete) {
      try {
        await deleteEwayBill(billToDelete);
        setEwayBills(ewayBills.filter(bill => bill.id !== billToDelete));
        setDeleteDialogOpen(false);
        setBillToDelete(null);
      } catch (error) {
        console.error('Failed to delete E-way bill:', error);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      draft: 'bg-yellow-100 text-yellow-800',
      generated: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800'
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${styles[status as keyof typeof styles]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
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
      <PageHeader title="E-Way Bills" description="Manage your E-Way bills" />

      <div className="bg-white border border-gray-300 rounded-lg p-6">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by E-way bill no or invoice ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="generated">Generated</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
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
                <th className="border border-gray-300 p-3 text-left">E-Way Bill No</th>
                <th className="border border-gray-300 p-3 text-left">Invoice ID</th>
                <th className="border border-gray-300 p-3 text-left">Generated Date</th>
                <th className="border border-gray-300 p-3 text-left">Valid Upto</th>
                <th className="border border-gray-300 p-3 text-left">Status</th>
                <th className="border border-gray-300 p-3 text-right">Grand Total</th>
                <th className="border border-gray-300 p-3 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={7} className="border border-gray-300 p-8 text-center text-gray-500">
                    No E-Way bills found
                  </td>
                </tr>
              ) : (
                filteredBills.map((bill) => (
                  <tr key={bill.id} className="hover:bg-gray-50">
                    <td className="border border-gray-300 p-3 font-medium">{bill.ewayBillNo}</td>
                    <td className="border border-gray-300 p-3">{bill.invoiceId}</td>
                    <td className="border border-gray-300 p-3">
                      {new Date(bill.generatedDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="border border-gray-300 p-3">
                      {bill.validUpto ? new Date(bill.validUpto).toLocaleDateString('en-IN') : '-'}
                    </td>
                    <td className="border border-gray-300 p-3">{getStatusBadge(bill.status)}</td>
                    <td className="border border-gray-300 p-3 text-right font-medium">
                      ₹{bill.grandTotal.toFixed(2)}
                    </td>
                    <td className="border border-gray-300 p-3">
                      <div className="flex justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(bill.id)}
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
    </MainLayout>
  );
}
