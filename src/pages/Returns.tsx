import { useState, useEffect } from 'react';
import { ArrowLeft, Package, RefreshCw, CheckCircle, XCircle, Clock, DollarSign, Search, Filter, Plus, Minus } from 'lucide-react';
import { Link } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useReturns } from '@/hooks/useReturns';
import { useInvoices } from '@/hooks/useInvoices';
import { useCustomers } from '@/hooks/useCustomers';
import { formatCurrency, formatDate } from '@/lib/utils';
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
import { useToast } from '@/hooks/use-toast';
import { apiGet, getAllReturns } from '@/lib/api';

type ReturnStatus = 'pending' | 'approved' | 'processed' | 'refunded' | 'rejected' | 'cancelled';

export default function Returns() {
  const { toast } = useToast();
  const { getReturnsForCustomer, createReturn, processReturnRequest, refundReturnRequest, deleteReturn, isLoading } = useReturns();
  const { invoices } = useInvoices();
  const { customers } = useCustomers();

  const [returns, setReturns] = useState<any[]>([]);
  const [selectedReturn, setSelectedReturn] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isRefunding, setIsRefunding] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<any[]>([]);
  const [returnReason, setReturnReason] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCustomer, setFilterCustomer] = useState<string>('all');

  useEffect(() => {
    fetchAllReturns();
  }, []);

  const fetchAllReturns = async () => {
    try {
      const data = await getAllReturns();
      setReturns(data || []);
    } catch (error) {
      console.error('Failed to fetch returns:', error);
      toast({ title: 'Error', description: 'Failed to load returns', variant: 'destructive' });
    }
  };

  const handleProcessReturn = async (returnId: string) => {
    console.log('Processing return:', returnId);
    setIsProcessing(true);
    try {
      await processReturnRequest(returnId, 'cash', 'admin');
      toast({ title: 'Success', description: 'Return processed successfully' });
      await fetchAllReturns();
    } catch (error) {
      console.error('Failed to process return:', error);
      toast({ title: 'Error', description: 'Failed to process return', variant: 'destructive' });
    } finally {
      setIsProcessing(false);
      setSelectedReturn(null);
    }
  };

  const handleRefundReturn = async (returnId: string) => {
    console.log('Refunding return:', returnId);
    setIsRefunding(true);
    try {
      await refundReturnRequest(returnId, 'cash', 'admin');
      toast({ title: 'Success', description: 'Return refunded successfully' });
      await fetchAllReturns();
    } catch (error) {
      console.error('Failed to refund return:', error);
      toast({ title: 'Error', description: 'Failed to refund return', variant: 'destructive' });
    } finally {
      setIsRefunding(false);
      setSelectedReturn(null);
    }
  };

  const handleDeleteReturn = async (returnId: string) => {
    console.log('Deleting return:', returnId);
    setIsDeleting(true);
    try {
      await deleteReturn(returnId);
      toast({ title: 'Success', description: 'Return cancelled successfully' });
      await fetchAllReturns();
    } catch (error) {
      console.error('Failed to cancel return:', error);
      toast({ title: 'Error', description: 'Failed to cancel return', variant: 'destructive' });
    } finally {
      setIsDeleting(false);
      setSelectedReturn(null);
    }
  };

  const handleCreateReturn = async () => {
    if (!selectedInvoice || returnItems.length === 0) {
      toast({ title: 'Error', description: 'Please select an invoice and at least one item to return', variant: 'destructive' });
      return;
    }

    setIsCreating(true);
    try {
      const returnData = {
        invoiceId: selectedInvoice.id,
        reason: returnReason,
        items: returnItems.map(item => ({
          invoiceItemId: item.id,
          quantity: item.returnQuantity,
          reason: item.returnReason || ''
        }))
      };

      await createReturn(returnData);
      toast({ title: 'Success', description: 'Return request created successfully' });
      setIsCreateModalOpen(false);
      setSelectedInvoice(null);
      setReturnItems([]);
      setReturnReason('');
      fetchAllReturns();
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to create return request', variant: 'destructive' });
    } finally {
      setIsCreating(false);
    }
  };

  const handleSelectInvoice = (invoiceId: string) => {
    const invoice = invoices.find(inv => inv.id === invoiceId);
    if (invoice) {
      setSelectedInvoice(invoice);
      // Initialize return items with 0 quantity
      setReturnItems(invoice.items.map((item: any) => ({
        ...item,
        returnQuantity: 0,
        returnReason: ''
      })));
    }
  };

  const updateReturnItem = (itemId: string, field: string, value: any) => {
    setReturnItems(prev => prev.map(item =>
      item.id === itemId ? { ...item, [field]: value } : item
    ));
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setSelectedInvoice(null);
    setReturnItems([]);
    setReturnReason('');
  };

  const getStatusBadge = (status: ReturnStatus) => {
    const statusConfig = {
      pending: { label: 'Pending', variant: 'secondary' as const, icon: Clock },
      approved: { label: 'Approved', variant: 'default' as const, icon: CheckCircle },
      processed: { label: 'Processed', variant: 'default' as const, icon: CheckCircle },
      refunded: { label: 'Refunded', variant: 'default' as const, icon: CheckCircle },
      rejected: { label: 'Rejected', variant: 'destructive' as const, icon: XCircle },
      cancelled: { label: 'Cancelled', variant: 'destructive' as const, icon: XCircle },
    };
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="w-3 h-3" />
        {config.label}
      </Badge>
    );
  };

  const filteredReturns = returns.filter((ret) => {
    const matchesSearch =
      !searchQuery ||
      ret.returnNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ret.invoiceNumber?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = filterStatus === 'all' || ret.status === filterStatus;
    const matchesCustomer = filterCustomer === 'all' || ret.customerId === filterCustomer;

    return matchesSearch && matchesStatus && matchesCustomer;
  });

  return (
    <MainLayout>
      <PageHeader
        title="Invoice Returns"
        description="Manage product returns and refunds"
        action={
          <Button onClick={fetchAllReturns} variant="outline" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        }
      />

      {/* Filters */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by return number, customer, or invoice..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-40">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="processed">Processed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterCustomer} onValueChange={setFilterCustomer}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="All Customers" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                {customers.filter(c => c.id !== 'walk-in').map((customer) => (
                  <SelectItem key={customer.id} value={customer.id}>
                    {customer.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={fetchAllReturns} variant="outline" className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Returns List */}
      {filteredReturns.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center text-muted-foreground">
            <Package className="w-16 h-16 mx-auto mb-4" />
            <p className="text-lg">No returns found</p>
            <p className="text-sm">
              {searchQuery || filterStatus !== 'all' || filterCustomer !== 'all'
                ? 'Try adjusting your filters'
                : 'Returns will appear here when created'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredReturns.map((ret) => (
            <Card key={ret.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold text-lg">{ret.returnNumber}</h3>
                      {getStatusBadge(ret.status)}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Customer</p>
                        <p className="font-medium">{ret.customerName}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Invoice</p>
                        <p className="font-medium">{ret.invoiceNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Return Amount</p>
                        <p className="font-semibold text-primary">{formatCurrency(ret.totalReturnAmount)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Date</p>
                        <p className="font-medium">{formatDate(ret.createdAt)}</p>
                      </div>
                    </div>
                    {ret.reason && (
                      <div className="mt-2">
                        <p className="text-muted-foreground text-sm">Reason: {ret.reason}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <Link to={`/invoices/${ret.invoiceId}`}>
                      <Button variant="outline" size="sm">
                        View Invoice
                      </Button>
                    </Link>
                    {ret.status === 'pending' && (
                      <>
                        <Button
                          variant="default"
                          size="sm"
                          onClick={() => setSelectedReturn(ret)}
                          className="gap-1"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Process
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setSelectedReturn({ ...ret, action: 'delete' })}
                          className="gap-1"
                        >
                          <XCircle className="w-4 h-4" />
                          Cancel
                        </Button>
                      </>
                    )}
                    {ret.status === 'processed' && (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setSelectedReturn({ ...ret, action: 'refund' })}
                        className="gap-1"
                      >
                        <DollarSign className="w-4 h-4" />
                        Refund
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Process Return Dialog */}
      <AlertDialog open={selectedReturn?.action === 'process'} onOpenChange={(open) => !open && setSelectedReturn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Process Return</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to process return {selectedReturn?.returnNumber}? This will:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>Update stock (add items back)</li>
                <li>Adjust invoice balance</li>
                <li>Create audit log entry</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReturn && handleProcessReturn(selectedReturn.id)}
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Process Return'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Refund Return Dialog */}
      <AlertDialog open={selectedReturn?.action === 'refund'} onOpenChange={(open) => !open && setSelectedReturn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Refund Return</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to refund {formatCurrency(selectedReturn?.totalReturnAmount)} for return {selectedReturn?.returnNumber}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReturn && handleRefundReturn(selectedReturn.id)}
              disabled={isRefunding}
            >
              {isRefunding ? 'Refunding...' : 'Refund'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Return Dialog */}
      <AlertDialog open={selectedReturn?.action === 'delete'} onOpenChange={(open) => !open && setSelectedReturn(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Return</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel return {selectedReturn?.returnNumber}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedReturn && handleDeleteReturn(selectedReturn.id)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Cancelling...' : 'Cancel Return'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
