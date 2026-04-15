import { useState, useEffect } from 'react';
import { FileText, Plus, Search, Filter, Eye, Edit, Trash2, CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { formatCurrency, generateId } from '@/lib/utils';
import { Quotation, QuotationItem, CreateQuotationRequest, Customer, Product } from '@/types';
import {
  getQuotations,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  confirmQuotation,
  cancelQuotation,
  convertQuotationToInvoice,
  filterQuotations
} from '@/lib/api';

export default function Quotations() {
  const { products } = useProducts();
  const { customers } = useCustomers();
  const { toast } = useToast();

  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [convertingQuotation, setConvertingQuotation] = useState<Quotation | null>(null);
  const [amountPaid, setAmountPaid] = useState(0);

  // Form states for create/edit
  const [formData, setFormData] = useState<CreateQuotationRequest>({
    customerId: '',
    customerName: '',
    customerPhone: '',
    customerType: 'customer',
    endCustomerName: '',
    commission: undefined,
    // Contractor fields for contractor buying for customer scenario
    contractorId: undefined,
    contractorName: undefined,
    items: [],
    validUntil: '',
    notes: '',
    termsConditions: ''
  });

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [quotationItems, setQuotationItems] = useState<QuotationItem[]>([]);
  const [editingQuotation, setEditingQuotation] = useState<Quotation | null>(null);
  const [selectedProductId, setSelectedProductId] = useState('');
  // Selected contractor for filtering customers
  const [selectedContractor, setSelectedContractor] = useState<Customer | null>(null);

  useEffect(() => {
    loadQuotations();
  }, []);

  // Get all contractors for the dropdown
  const contractors = customers.filter(c => c.type === 'contractor');

  // Filter customers based on selected contractor
  const getFilteredCustomers = () => {
    if (selectedContractor) {
      // Show only customers linked to this contractor + walk-in
      return customers.filter(c =>
        c.id === 'walk-in' ||
        c.contractorId === selectedContractor.id ||
        c.id === selectedContractor.id
      );
    }
    // Show all customers when no contractor selected
    return customers;
  };

  const loadQuotations = async () => {
    try {
      setLoading(true);
      const data = await getQuotations();
      setQuotations(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load quotations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredQuotations = quotations.filter(quotation => {
    const matchesSearch = searchTerm === '' ||
      quotation.quotationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      quotation.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || quotation.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const handleCustomerSelect = (customer: Customer) => {
    setSelectedCustomer(customer);

    // If customer has a contractor, include contractor info
    const contractor = customer.contractorId ? customers.find(c => c.id === customer.contractorId) : null;

    setFormData(prev => ({
      ...prev,
      customerId: customer.id,
      customerName: customer.name,
      customerPhone: customer.phone,
      customerType: customer.type,
      // If customer is linked to a contractor, set the contractor fields
      contractorId: customer.contractorId,
      contractorName: contractor?.name
    }));
  };

  const addProductToQuotation = (product: Product) => {
    const newItem: QuotationItem = {
      id: generateId(),
      productId: product.id,
      productName: product.name,
      productCode: product.code,
      unitPrice: product.price,
      quantity: 1,
      unit: product.unit,
      gstPercentage: product.gstPercentage,
      discount: 0,
      description: product.description
    };
    setQuotationItems([...quotationItems, newItem]);
  };

  const updateQuotationItem = (id: string, updates: Partial<QuotationItem>) => {
    setQuotationItems(items => items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    ));
  };

  const removeQuotationItem = (id: string) => {
    setQuotationItems(items => items.filter(item => item.id !== id));
  };

  const calculateTotals = () => {
    const subtotal = quotationItems.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      return sum + itemTotal;
    }, 0);

    const totalDiscount = quotationItems.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      return sum + (itemTotal * item.discount / 100);
    }, 0);

    const totalGst = quotationItems.reduce((sum, item) => {
      const itemTotal = item.unitPrice * item.quantity;
      const discountedTotal = itemTotal - (itemTotal * item.discount / 100);
      return sum + (discountedTotal * item.gstPercentage / 100);
    }, 0);

    const grandTotal = subtotal - totalDiscount + totalGst;

    return { subtotal, totalDiscount, totalGst, grandTotal };
  };

  const handleSaveQuotation = async () => {
    if (!selectedCustomer || quotationItems.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select a customer and add at least one item',
        variant: 'destructive'
      });
      return;
    }

    const totals = calculateTotals();
    const validUntil = formData.validUntil || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const quotationData: CreateQuotationRequest = {
      ...formData,
      items: quotationItems,
      validUntil,
      ...totals
    };

    try {
      if (editingQuotation) {
        await updateQuotation(editingQuotation.id, quotationData);
        toast({
          title: 'Success',
          description: 'Quotation updated successfully'
        });
      } else {
        await createQuotation(quotationData);
        toast({
          title: 'Success',
          description: 'Quotation created successfully'
        });
      }

      resetForm();
      loadQuotations();
      setActiveTab('list');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to save quotation',
        variant: 'destructive'
      });
    }
  };

  const resetForm = () => {
    setFormData({
      customerId: '',
      customerName: '',
      customerPhone: '',
      customerType: 'customer',
      endCustomerName: '',
      commission: undefined,
      contractorId: undefined,
      contractorName: undefined,
      items: [],
      validUntil: '',
      notes: '',
      termsConditions: ''
    });
    setSelectedCustomer(null);
    setQuotationItems([]);
    setEditingQuotation(null);
    setSelectedProductId('');
    setSelectedContractor(null);
  };

  const handleEditQuotation = (quotation: Quotation) => {
    setEditingQuotation(quotation);
    setFormData({
      customerId: quotation.customerId,
      customerName: quotation.customerName,
      customerPhone: quotation.customerPhone,
      customerType: quotation.customerType,
      endCustomerName: quotation.endCustomerName || '',
      commission: quotation.commission,
      // Include contractor fields if they exist
      contractorId: quotation.contractorId,
      contractorName: quotation.contractorName,
      items: quotation.items,
      validUntil: quotation.validUntil,
      notes: quotation.notes || '',
      termsConditions: quotation.termsConditions || ''
    });
    setQuotationItems(quotation.items);
    const customer = customers.find(c => c.id === quotation.customerId);
    setSelectedCustomer(customer || null);
    setActiveTab('create');
  };

  const handleDeleteQuotation = async (id: string) => {
    try {
      await deleteQuotation(id);
      toast({
        title: 'Success',
        description: 'Quotation deleted successfully'
      });
      loadQuotations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete quotation',
        variant: 'destructive'
      });
    }
  };

  const handleConfirmQuotation = async (id: string) => {
    try {
      await confirmQuotation(id);
      toast({
        title: 'Success',
        description: 'Quotation confirmed successfully'
      });
      loadQuotations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to confirm quotation',
        variant: 'destructive'
      });
    }
  };

  const handleCancelQuotation = async (id: string) => {
    try {
      await cancelQuotation(id);
      toast({
        title: 'Success',
        description: 'Quotation cancelled successfully'
      });
      loadQuotations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to cancel quotation',
        variant: 'destructive'
      });
    }
  };

  const handleConvertToInvoice = (quotation: Quotation) => {
    setConvertingQuotation(quotation);
    setAmountPaid(quotation.grandTotal); // Default to full amount
    setShowPaymentDialog(true);
  };

  const handleConfirmConvertToInvoice = async () => {
    if (!convertingQuotation) return;

    try {
      await convertQuotationToInvoice(convertingQuotation.id, amountPaid);
      toast({
        title: 'Success',
        description: `Quotation converted to invoice successfully. Amount paid: ${formatCurrency(amountPaid)}`
      });
      setShowPaymentDialog(false);
      setConvertingQuotation(null);
      loadQuotations();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to convert quotation to invoice',
        variant: 'destructive'
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmed', className: 'bg-green-100 text-green-800' },
      converted: { label: 'Converted', className: 'bg-blue-100 text-blue-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' }
    };

    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  const totals = calculateTotals();

  return (
    <MainLayout>
      <PageHeader
        title="Quotations"
        description="Manage customer quotations and convert them to invoices"
      />

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="list">Quotations List</TabsTrigger>
          <TabsTrigger value="create">
            {editingQuotation ? 'Edit Quotation' : 'Create Quotation'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="w-5 h-5" />
                Filters
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="Search by quotation number or customer name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-48">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Quotations List */}
          <Card>
            <CardHeader>
              <CardTitle>Quotations ({filteredQuotations.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading quotations...</div>
              ) : filteredQuotations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No quotations found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredQuotations.map((quotation) => (
                    <div key={quotation.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{quotation.quotationNumber}</h3>
                            {getStatusBadge(quotation.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {quotation.customerName} ({quotation.customerPhone})
                          </p>
                          {quotation.endCustomerName && (
                            <p className="text-sm text-muted-foreground">
                              End Customer: {quotation.endCustomerName}
                            </p>
                          )}
                          <p className="text-sm text-muted-foreground">
                            Valid until: {new Date(quotation.validUntil).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg">{formatCurrency(quotation.grandTotal)}</p>
                          <p className="text-sm text-muted-foreground">
                            {quotation.items.length} item(s)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Dialog open={showViewDialog && selectedQuotation?.id === quotation.id} onOpenChange={(open) => {
                          setShowViewDialog(open);
                          if (open) setSelectedQuotation(quotation);
                        }}>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>{quotation.quotationNumber}</DialogTitle>
                            </DialogHeader>
                            {selectedQuotation && (
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>Customer</Label>
                                    <p className="font-medium">{selectedQuotation.customerName}</p>
                                  </div>
                                  <div>
                                    <Label>Status</Label>
                                    <div>{getStatusBadge(selectedQuotation.status)}</div>
                                  </div>
                                  <div>
                                    <Label>Valid Until</Label>
                                    <p>{new Date(selectedQuotation.validUntil).toLocaleDateString()}</p>
                                  </div>
                                  <div>
                                    <Label>Total Amount</Label>
                                    <p className="font-semibold">{formatCurrency(selectedQuotation.grandTotal)}</p>
                                  </div>
                                </div>

                                <div>
                                  <Label>Items</Label>
                                  <div className="border rounded-lg overflow-hidden mt-2">
                                    <table className="w-full">
                                      <thead className="bg-muted">
                                        <tr>
                                          <th className="text-left p-2">Product</th>
                                          <th className="text-center p-2">Qty</th>
                                          <th className="text-right p-2">Price</th>
                                          <th className="text-right p-2">Total</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {selectedQuotation.items.map((item) => (
                                          <tr key={item.id} className="border-t">
                                            <td className="p-2">
                                              <div>
                                                <p className="font-medium">{item.productName}</p>
                                                <p className="text-sm text-muted-foreground">{item.productCode}</p>
                                              </div>
                                            </td>
                                            <td className="p-2 text-center">{item.quantity} {item.unit}</td>
                                            <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                                            <td className="p-2 text-right">{formatCurrency(item.unitPrice * item.quantity)}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>

                                {selectedQuotation.notes && (
                                  <div>
                                    <Label>Notes</Label>
                                    <p className="text-sm mt-1">{selectedQuotation.notes}</p>
                                  </div>
                                )}

                                {selectedQuotation.termsConditions && (
                                  <div>
                                    <Label>Terms & Conditions</Label>
                                    <p className="text-sm mt-1 whitespace-pre-line">{selectedQuotation.termsConditions}</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>

                        <Button variant="outline" size="sm" onClick={() => handleEditQuotation(quotation)}>
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </Button>

                        {quotation.status === 'pending' && (
                          <Button variant="outline" size="sm" onClick={() => handleConfirmQuotation(quotation.id)}>
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Confirm
                          </Button>
                        )}

                        {quotation.status === 'confirmed' && (
                          <Button variant="outline" size="sm" onClick={() => handleConvertToInvoice(quotation)}>
                            <ArrowRight className="w-4 h-4 mr-1" />
                            Convert to Invoice
                          </Button>
                        )}

                        {(quotation.status === 'pending' || quotation.status === 'confirmed') && (
                          <Button variant="outline" size="sm" onClick={() => handleCancelQuotation(quotation.id)}>
                            <XCircle className="w-4 h-4 mr-1" />
                            Cancel
                          </Button>
                        )}

                        <Button variant="outline" size="sm" onClick={() => handleDeleteQuotation(quotation.id)}>
                          <Trash2 className="w-4 h-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="create" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {editingQuotation ? 'Edit Quotation' : 'Create New Quotation'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contractor Filter */}
              {contractors.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Filter by Contractor (Optional)</Label>
                  <Select
                    value={selectedContractor?.id || '_none_'}
                    onValueChange={(contractorId) => {
                      if (contractorId && contractorId !== '_none_') {
                        const contractor = contractors.find(c => c.id === contractorId);
                        setSelectedContractor(contractor || null);
                      } else {
                        setSelectedContractor(null);
                      }
                      // Reset selected customer when contractor changes
                      setSelectedCustomer(null);
                      setFormData(prev => ({
                        ...prev,
                        customerId: '',
                        customerName: '',
                        customerPhone: '',
                        customerType: 'customer',
                        contractorId: undefined,
                        contractorName: undefined
                      }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Customers" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="_none_">All Customers</SelectItem>
                      {contractors.map((contractor) => (
                        <SelectItem key={contractor.id} value={contractor.id}>
                          {contractor.name} ({contractor.phone})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a contractor to see only their linked customers
                  </p>
                </div>
              )}

              {/* Customer Selection */}
              <div className="space-y-2">
                <Label>Customer *</Label>
                <Select value={selectedCustomer?.id || ''} onValueChange={(customerId) => {
                  const customer = getFilteredCustomers().find(c => c.id === customerId);
                  if (customer) handleCustomerSelect(customer);
                }}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a customer" />
                  </SelectTrigger>
                  <SelectContent>
                    {getFilteredCustomers().map((customer) => (
                      <SelectItem key={customer.id} value={customer.id}>
                        {customer.name} ({customer.type})
                        {customer.contractorId && ' - Linked to Contractor'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedCustomer?.type === 'contractor' && (
                <div className="space-y-2">
                  <Label>End Customer Name</Label>
                  <Input
                    value={formData.endCustomerName}
                    onChange={(e) => setFormData(prev => ({ ...prev, endCustomerName: e.target.value }))}
                    placeholder="Enter end customer name"
                  />
                </div>
              )}

              {/* Valid Until */}
              <div className="space-y-2">
                <Label>Valid Until *</Label>
                <Input
                  type="datetime-local"
                  value={formData.validUntil ? new Date(formData.validUntil).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, validUntil: e.target.value }))}
                />
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Add any notes for this quotation"
                  rows={3}
                />
              </div>

              {/* Terms & Conditions */}
              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={formData.termsConditions}
                  onChange={(e) => setFormData(prev => ({ ...prev, termsConditions: e.target.value }))}
                  placeholder="Enter terms and conditions"
                  rows={4}
                />
              </div>

              {/* Items */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Items</Label>
                  <span className="text-sm text-muted-foreground">
                    {quotationItems.length} item(s)
                  </span>
                </div>

                {/* Product Search */}
                <div className="space-y-2">
                  <Label>Add Products</Label>
                  <Select value={selectedProductId} onValueChange={(productId) => {
                    if (productId) {
                      const product = products.find(p => p.id === productId);
                      if (product) {
                        addProductToQuotation(product);
                        setSelectedProductId(''); // Reset the dropdown after adding
                      }
                    }
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Search and select products" />
                    </SelectTrigger>
                    <SelectContent>
                      {products.map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name} - {formatCurrency(product.price)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Items Table */}
                {quotationItems.length > 0 && (
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-muted">
                        <tr>
                          <th className="text-left p-2">Product</th>
                          <th className="text-center p-2">Qty</th>
                          <th className="text-right p-2">Price</th>
                          <th className="text-center p-2">Discount %</th>
                          <th className="text-right p-2">Total</th>
                          <th className="p-2 w-12"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {quotationItems.map((item) => (
                          <tr key={item.id} className="border-t">
                            <td className="p-2">
                              <div>
                                <p className="font-medium">{item.productName}</p>
                                <p className="text-sm text-muted-foreground">{item.productCode}</p>
                              </div>
                            </td>
                            <td className="p-2">
                              <Input
                                type="number"
                                min="1"
                                value={item.quantity}
                                onChange={(e) => updateQuotationItem(item.id, { quantity: parseInt(e.target.value) || 1 })}
                                className="w-20 text-center"
                              />
                            </td>
                            <td className="p-2 text-right">{formatCurrency(item.unitPrice)}</td>
                            <td className="p-2">
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={item.discount}
                                onChange={(e) => updateQuotationItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                                className="w-20 text-center"
                              />
                            </td>
                            <td className="p-2 text-right">
                              {formatCurrency(item.unitPrice * item.quantity * (1 - item.discount / 100))}
                            </td>
                            <td className="p-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeQuotationItem(item.id)}
                                className="text-destructive hover:text-destructive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Summary */}
              {quotationItems.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Quotation Summary</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{formatCurrency(totals.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Discount</span>
                      <span>{formatCurrency(totals.totalDiscount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>GST</span>
                      <span>{formatCurrency(totals.totalGst)}</span>
                    </div>
                    <div className="border-t pt-3">
                      <div className="flex justify-between">
                        <span className="font-semibold">Grand Total</span>
                        <span className="text-xl font-bold text-primary">{formatCurrency(totals.grandTotal)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Actions */}
              <div className="flex gap-4">
                <Button onClick={handleSaveQuotation} disabled={!selectedCustomer || quotationItems.length === 0}>
                  {editingQuotation ? 'Update Quotation' : 'Create Quotation'}
                </Button>
                <Button variant="outline" onClick={resetForm}>
                  Clear Form
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payment Amount Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert Quotation to Invoice</DialogTitle>
          </DialogHeader>
          {convertingQuotation && (
            <div className="space-y-4">
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-medium mb-2">{convertingQuotation.quotationNumber}</h4>
                <p className="text-sm text-muted-foreground">{convertingQuotation.customerName}</p>
                <div className="mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>Quotation Total:</span>
                    <span className="font-medium">{formatCurrency(convertingQuotation.grandTotal)}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amountPaid">Amount Paid</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  min="0"
                  step="0.01"
                  max={convertingQuotation.grandTotal}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  placeholder="Enter amount paid"
                />
                <p className="text-xs text-muted-foreground">
                  Enter the amount the customer has paid. Maximum: {formatCurrency(convertingQuotation.grandTotal)}
                </p>
                {amountPaid < convertingQuotation.grandTotal && (
                  <div className="text-sm text-amber-600">
                    Balance due: {formatCurrency(convertingQuotation.grandTotal - amountPaid)}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={handleConfirmConvertToInvoice}
                  disabled={amountPaid <= 0 || amountPaid > convertingQuotation.grandTotal}
                  className="flex-1"
                >
                  Convert to Invoice
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowPaymentDialog(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
