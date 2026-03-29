import { useState, useRef, useCallback } from 'react';
import { Printer, Save, Trash2, CreditCard, Banknote, Smartphone, Clock, HardHat, User, FileText } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { ProductSearch } from '@/components/billing/ProductSearch';
import { BillItemRow } from '@/components/billing/BillItemRow';
import { CustomerSelect } from '@/components/billing/CustomerSelect';
import { AddProductModal } from '@/components/billing/AddProductModal';
import { InvoiceReceipt } from '@/components/billing/InvoiceReceipt';
import { RecentProducts } from '@/components/billing/RecentProducts';
import { OriginalPriceList } from '@/components/billing/OriginalPriceList';
import { PendingBillsDrawer } from '@/components/billing/PendingBillsDrawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useProducts } from '@/hooks/useProducts';
import { useCustomers } from '@/hooks/useCustomers';
import { useInvoices } from '@/hooks/useInvoices';
import { usePayments } from '@/hooks/usePayments';
import { useSettings } from '@/hooks/useSettings';
import { usePriceMapping } from '@/hooks/usePriceMapping';
import { useCommissions } from '@/hooks/useCommissions';
import { usePendingBills, PendingBill } from '@/hooks/usePendingBills';
import { useLastPaymentValues } from '@/hooks/useLastPaymentValues';
import { BillItem, Customer, Product, PaymentMethod, Invoice } from '@/types';
import { generateId, formatCurrency, calculateDiscountPercentage } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { useReactToPrint } from 'react-to-print';

export default function Billing() {
  const { products, addProduct, updateStock } = useProducts();
  const { customers, addCustomer } = useCustomers();
  const { addInvoice, getCustomerBalance } = useInvoices();
  const { addBillingTransaction } = usePayments();
  const { settings } = useSettings();
  const { getLastPrice, updatePriceMappingsFromInvoice } = usePriceMapping();
  const { addCommission } = useCommissions();
  const { pendingBills, savePendingBill, removePendingBill } = usePendingBills();
  const { getLastPaymentValue, saveLastPaymentValuesForInvoice } = useLastPaymentValues();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);

  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    customers.find((c) => c.id === 'walk-in') || null
  );
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [billDiscount, setBillDiscount] = useState(0);
  const [amountPaid, setAmountPaid] = useState(0);
  const [invoiceForPrint, setInvoiceForPrint] = useState<Invoice | null>(null);
  const [isRoughDraft, setIsRoughDraft] = useState(false);
  const [activePendingBillId, setActivePendingBillId] = useState<string | undefined>();
  // Contractor-specific fields
  const [endCustomerName, setEndCustomerName] = useState('');
  const [commission, setCommission] = useState(0);
  const [billNotes, setBillNotes] = useState('');

  const handleAddCustomer = (customerData: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>) => {
    return addCustomer(customerData) as unknown as Customer;
  };

  const handleAddProduct = (productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => {
    return addProduct(productData) as unknown as Product;
  };

  const isContractor = selectedCustomer?.type === 'contractor';

  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: invoiceForPrint?.invoiceNumber || 'Rough-Bill',
  });

  const handleSelectCustomer = async (customer: Customer) => {
    setSelectedCustomer(customer);

    // Update prices for existing items based on customer's last payment values
    const updatedItems = await Promise.all(
      billItems.map(async (item) => {
        if (customer.id === 'walk-in') {
          // Reset to original price for walk-in customers
          const price = item.originalPrice;
          const baseAmount = calculateItemBaseAmount(item, price);
          const gstAmount = item.withTax ? (baseAmount * item.gstPercentage) / 100 : 0;
          return {
            ...item,
            price,
            lastPurchasedPrice: undefined,
            gstAmount,
            subtotal: baseAmount,
            total: baseAmount + gstAmount,
          };
        } else {
          // Try to get last payment value for this customer
          try {
            const lastPaymentValue = await getLastPaymentValue(customer.id, item.productId);
            const lastPrice = lastPaymentValue?.lastUnitPrice;
            const price = lastPrice ?? item.originalPrice;
            const baseAmount = calculateItemBaseAmount(item, price);
            const gstAmount = item.withTax ? (baseAmount * item.gstPercentage) / 100 : 0;
            return {
              ...item,
              price,
              lastPurchasedPrice: lastPrice,
              gstAmount,
              subtotal: baseAmount,
              total: baseAmount + gstAmount,
            };
          } catch (error) {
            // Fallback to original price if fetch fails
            const price = item.originalPrice;
            const baseAmount = calculateItemBaseAmount(item, price);
            const gstAmount = item.withTax ? (baseAmount * item.gstPercentage) / 100 : 0;
            return {
              ...item,
              price,
              lastPurchasedPrice: undefined,
              gstAmount,
              subtotal: baseAmount,
              total: baseAmount + gstAmount,
            };
          }
        }
      })
    );

    setBillItems(updatedItems);
  };

  const calculateItemBaseAmount = (item: BillItem, price?: number) => {
    const usePrice = price ?? item.price;
    if (item.pricingType && item.pricingType !== 'standard' && item.area !== undefined) {
      // Use direct area value for glass products instead of calculating from height × width
      return item.area * usePrice; // For area-based pricing, quantity is always 1
    }
    return item.quantity * usePrice;
  };

  // Get effective total for an item (respects customTotal)
  const getEffectiveTotal = (item: BillItem) => item.customTotal !== undefined ? item.customTotal : item.total;

  const addProductToBill = async (product: Product) => {
    const existingItem = billItems.find((item) => item.productId === product.id);

    if (existingItem) {
      updateBillItem(existingItem.id, { quantity: existingItem.quantity + 1 });
    } else {
      // Get last payment value for this customer and product
      let lastPrice: number | undefined;
      if (selectedCustomer && selectedCustomer.id !== 'walk-in') {
        try {
          const lastPaymentValue = await getLastPaymentValue(selectedCustomer.id, product.id);
          console.log('Last payment value:', lastPaymentValue);
          lastPrice = lastPaymentValue?.lastUnitPrice;
        } catch (error) {
          console.log('Failed to fetch last payment value:', error);
          // Continue with original price if last payment value fetch fails
        }
      }

      const usePrice = lastPrice ?? product.price;
      const isGlass = product.category?.toLowerCase() === 'glass';
      const pricingType = isGlass ? (product.pricingType || 'per_sqft') : 'standard';
      const baseAmount = pricingType !== 'standard' ? 0 : (usePrice * 1); // For standard pricing, quantity * price
      const gstAmount = 0; // Default to 0 since withTax is false by default
      const total = baseAmount + gstAmount;

      const newItem: BillItem = {
        id: generateId(),
        productId: product.id,
        productName: product.name,
        productCode: product.code,
        quantity: isGlass ? 1 : 1, // Start with 1 for all products
        price: usePrice,
        originalPrice: product.price,
        lastPurchasedPrice: lastPrice,
        gstPercentage: product.gstPercentage,
        withTax: false,
        gstAmount,
        discount: 0,
        discountPercentage: 0,
        subtotal: baseAmount,
        total,
        pricingType,
        height: undefined,
        width: undefined,
        area: undefined,
      };
      setBillItems([...billItems, newItem]);
    }
  };

  const updateBillItem = (id: string, updates: Partial<BillItem>) => {
    setBillItems((items) =>
      items.map((item) => {
        if (item.id !== id) return item;
        const updatedItem = { ...item, ...updates };

        if (updatedItem.pricingType && updatedItem.pricingType !== 'standard') {
          // Calculate area from height × width if both are provided
          // But allow manual area override if area is directly set
          if (updatedItem.height && updatedItem.width && updatedItem.area === undefined) {
            updatedItem.area = updatedItem.pricingType === 'per_sqft'
              ? updatedItem.height * updatedItem.width
              : updatedItem.height + updatedItem.width;
          } else if (updatedItem.area === undefined) {
            updatedItem.area = 0;
          }
          // If area is directly set (manual input), keep that value
        }

        const baseAmount = calculateItemBaseAmount(updatedItem);
        const gstAmount = updatedItem.withTax
          ? (baseAmount * updatedItem.gstPercentage) / 100
          : 0;
        const total = baseAmount + gstAmount;
        return { ...updatedItem, gstAmount, subtotal: baseAmount, total };
      })
    );
  };

  const removeBillItem = (id: string) => {
    setBillItems((items) => items.filter((item) => item.id !== id));
  };

  const clearBill = async () => {
    // Save current bill as pending bill before clearing
    if (billItems.length > 0 && selectedCustomer && selectedCustomer.id !== 'walk-in') {
      try {
        await savePendingBill(
          billItems,
          selectedCustomer,
          paymentMethod,
          billDiscount,
          amountPaid,
          endCustomerName,
          commission,
          '', // notes
          activePendingBillId // existingId to update existing pending bill
        );
        console.log('Saved pending bill before clearing bill');
      } catch (error) {
        console.warn('Failed to save pending bill:', error);
      }
    }

    // Clear the bill
    setBillItems([]);
    setSelectedCustomer(customers.find((c) => c.id === 'walk-in') || null);
    setPaymentMethod('cash');
    setBillDiscount(0);
    setAmountPaid(0);
    setEndCustomerName('');
    setCommission(0);
    setActivePendingBillId(undefined);
  };

  const handleAddNewProduct = (name: string) => {
    setNewProductName(name);
    setShowAddProductModal(true);
  };

  const calculateTotals = useCallback(() => {
    console.log('Calculating totals for billItems:', billItems);
    const subtotal = billItems.reduce((sum, item) => {
      if (item.customTotal !== undefined) return sum + item.customTotal;
      const baseAmount = calculateItemBaseAmount(item);
      console.log(`Item ${item.productName}: baseAmount = ${baseAmount}, total = ${item.total}`);
      return sum + baseAmount;
    }, 0);
    const totalGst = billItems.reduce((sum, item) => {
      if (item.customTotal !== undefined) return sum; // GST included in custom total
      return sum + item.gstAmount;
    }, 0);
    const afterGst = subtotal + totalGst;
    const effectiveDiscount = Math.min(billDiscount, afterGst);
    const grandTotal = Math.max(0, afterGst - effectiveDiscount);
    const discountPercentage = calculateDiscountPercentage(afterGst, effectiveDiscount);
    console.log('Final totals:', { subtotal, totalGst, grandTotal });
    return { subtotal, totalDiscount: effectiveDiscount, discountPercentage, totalGst, grandTotal, maxDiscount: afterGst };
  }, [billItems, billDiscount]);

  // Print rough bill WITHOUT saving - just print and keep the page
  const handlePrintRoughBill = async () => {
    if (billItems.length === 0) {
      toast({ title: 'Error', description: 'Please add items to the bill', variant: 'destructive' });
      return;
    }

    // Auto-save as pending bill
    const pending = await savePendingBill(
      billItems, selectedCustomer, paymentMethod, billDiscount, amountPaid,
      endCustomerName, commission, billNotes, activePendingBillId
    );
    setActivePendingBillId(pending.id);

    const totals = calculateTotals();
    // Create a temporary invoice object for printing (not saved to invoices)
    const roughInvoice: Invoice = {
      id: 'rough-' + generateId(),
      invoiceNumber: 'ROUGH',
      customerId: selectedCustomer?.id || 'walk-in',
      customerName: selectedCustomer?.name || 'Walk-in Customer',
      customerPhone: selectedCustomer?.phone || '',
      customerType: selectedCustomer?.type || 'customer',
      endCustomerName: isContractor ? endCustomerName.trim() : undefined,
      commission: isContractor && commission > 0 ? commission : undefined,
      items: billItems,
      ...totals,
      amountPaid: 0,
      balance: totals.grandTotal,
      paymentMethod,
      status: 'pending',
      billType: 'rough',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setIsRoughDraft(true);
    setInvoiceForPrint(roughInvoice);
    setTimeout(() => { handlePrint(); }, 100);

    toast({ title: 'Rough Bill Printed', description: 'Bill saved as pending. You can update prices and print final bill later.' });
  };

  const handleSaveInvoice = useCallback(async () => {
    if (billItems.length === 0) {
      toast({ title: 'Error', description: 'Please add items to the bill', variant: 'destructive' });
      return null;
    }
    if (!selectedCustomer) {
      toast({ title: 'Error', description: 'Please select a customer', variant: 'destructive' });
      return null;
    }
    if (isContractor && !endCustomerName.trim()) {
      toast({ title: 'Error', description: 'Please enter the end customer name for contractor billing', variant: 'destructive' });
      return null;
    }

    const totals = calculateTotals();
    const finalAmountPaid = amountPaid > 0 ? amountPaid : totals.grandTotal;
    const balance = totals.grandTotal - finalAmountPaid;

    let invoice;
    try {
      invoice = await addInvoice(
        {
          customerId: selectedCustomer.id,
          customerName: selectedCustomer.name,
          customerPhone: selectedCustomer.phone,
          customerType: selectedCustomer.type || 'customer',
          endCustomerName: isContractor ? endCustomerName.trim() : undefined,
          commission: isContractor && commission > 0 ? commission : undefined,
          items: billItems,
          ...totals,
          amountPaid: finalAmountPaid,
          balance: Math.max(0, balance),
          paymentMethod,
          status: balance > 0 ? 'pending' : 'paid',
          billType: 'final_bill',
        },
        settings.invoicePrefix
      );
    } catch (error: any) {
      // Handle specific business errors
      if (error?.error?.code === 'BUSINESS_ERROR') {
        if (error.error.message.includes('Insufficient stock')) {
          toast({
            title: 'Stock Error',
            description: error.error.message || 'Insufficient stock for one or more items',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Business Error',
            description: error.error.message || 'Cannot complete this transaction',
            variant: 'destructive'
          });
        }
      } else {
        toast({
          title: 'Error',
          description: 'Failed to create invoice. Please try again.',
          variant: 'destructive'
        });
      }
      return null;
    }

    // Save last payment values for all items (except walk-in customers)
    if (selectedCustomer && selectedCustomer.id !== 'walk-in') {
      const lastPaymentData = billItems.map(item => ({
        customerId: selectedCustomer.id,
        productId: item.productId,
        productName: item.productName,
        productCode: item.productCode,
        lastAmount: item.total,
        lastQuantity: item.quantity,
        lastUnitPrice: item.price,
      }));

      await saveLastPaymentValuesForInvoice(lastPaymentData);
    }

    // Update price mappings (legacy support)
    updatePriceMappingsFromInvoice(
      selectedCustomer.id,
      billItems.map((item) => ({ productId: item.productId, price: item.price }))
    );

    if (isContractor && commission > 0) {
      await addCommission(
        selectedCustomer.id,
        selectedCustomer.name,
        invoice.id,
        invoice.invoiceNumber,
        endCustomerName.trim(),
        commission
      );
    }

    if (selectedCustomer.id !== 'walk-in') {
      const newBalance = Math.max(0, balance);
      await addBillingTransaction(
        selectedCustomer.id,
        selectedCustomer.name,
        invoice.id,
        invoice.invoiceNumber,
        totals.grandTotal,
        finalAmountPaid,
        newBalance,
        paymentMethod
      );
    }

    billItems.forEach((item) => {
      updateStock(item.productId, item.quantity);
    });

    // Remove from pending bills if it was loaded from there
    if (activePendingBillId) {
      removePendingBill(activePendingBillId);
    }

    toast({ title: 'Invoice Saved', description: `Invoice ${invoice.invoiceNumber} has been created` });
    clearBill();
    return invoice;
  }, [billItems, selectedCustomer, paymentMethod, calculateTotals, addInvoice, addBillingTransaction, settings.invoicePrefix, updateStock, toast, endCustomerName, commission, isContractor, updatePriceMappingsFromInvoice, addCommission, amountPaid, activePendingBillId, removePendingBill]);

  const handleSaveOnly = async () => { await handleSaveInvoice(); };

  const handlePrintFinalBill = async () => {
    const invoice = await handleSaveInvoice();
    if (invoice) {
      setIsRoughDraft(false);
      setInvoiceForPrint(invoice);
      setTimeout(() => { handlePrint(); }, 100);
    }
  };

  // Load a pending bill back into the billing page
  const handleLoadPendingBill = (bill: PendingBill) => {
    const customer = customers.find(c => c.id === bill.customerId) || null;
    setSelectedCustomer(customer);
    setBillItems(bill.items);
    setPaymentMethod(bill.paymentMethod);
    setBillDiscount(bill.billDiscount);
    setAmountPaid(bill.amountPaid);
    setEndCustomerName(bill.endCustomerName);
    setCommission(bill.commission);
    setBillNotes(bill.notes || '');
    setActivePendingBillId(bill.id);
    toast({ title: 'Bill Loaded', description: `Loaded pending bill for ${bill.customerName}. Update prices and print final bill.` });
  };

  const handleUpdatePendingNotes = (id: string, notes: string) => {
    const bill = pendingBills.find(b => b.id === id);
    if (bill) {
      savePendingBill(bill.items, customers.find(c => c.id === bill.customerId) || null, bill.paymentMethod, bill.billDiscount, bill.amountPaid, bill.endCustomerName, bill.commission, notes, id);
    }
  };

  const handleDeletePendingBill = (id: string) => {
    removePendingBill(id);
    if (activePendingBillId === id) {
      setActivePendingBillId(undefined);
    }
    toast({ title: 'Deleted', description: 'Pending bill removed' });
  };

  const totals = calculateTotals();

  const paymentMethods: { value: PaymentMethod; label: string; icon: React.ComponentType<any> }[] = [
    { value: 'cash', label: 'Cash', icon: Banknote },
    { value: 'card', label: 'Card', icon: CreditCard },
    { value: 'upi', label: 'UPI', icon: Smartphone },
    { value: 'credit', label: 'Credit', icon: Clock },
  ];

  return (
    <MainLayout>
      <div className="flex items-center justify-between mb-2">
        <PageHeader title="New Bill" description="Create a new invoice for customers and contractors" />
        <PendingBillsDrawer
          pendingBills={pendingBills}
          onLoadBill={handleLoadPendingBill}
          onDeleteBill={handleDeletePendingBill}
          onUpdateNotes={handleUpdatePendingNotes}
        />
      </div>

      {activePendingBillId && (
        <div className="mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-2 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-500" />
          <span className="text-sm text-amber-700 dark:text-amber-400">
            Editing a pending bill. Update prices and click "Save & Print Final Bill" when ready.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Bill Items Section */}
        <div className="lg:col-span-2 space-y-4">
          {/* Customer/Contractor Selection */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              {isContractor ? <HardHat className="w-4 h-4 text-amber-500" /> : <User className="w-4 h-4" />}
              {isContractor ? 'Contractor' : 'Customer'}
            </h3>
            <CustomerSelect
              customers={customers}
              selectedCustomer={selectedCustomer}
              onSelectCustomer={handleSelectCustomer}
              onAddCustomer={handleAddCustomer}
            />

            {isContractor && (
              <div className="mt-3 space-y-2">
                <Label htmlFor="endCustomer" className="text-sm font-medium">
                  Purchasing for (End Customer Name) *
                </Label>
                <Input
                  id="endCustomer"
                  value={endCustomerName}
                  onChange={(e) => setEndCustomerName(e.target.value)}
                  placeholder="Enter end customer name (e.g., Raj, Rahul)"
                  className="h-10"
                />
                <p className="text-xs text-muted-foreground">
                  The customer this contractor is purchasing goods for
                </p>
              </div>
            )}
          </div>

          {/* Recent Products */}
          <RecentProducts products={products} onSelectProduct={addProductToBill} />

          {/* Product Search */}
          <div className="bg-card border border-border rounded-xl p-4">
            <ProductSearch
              products={products}
              onSelectProduct={addProductToBill}
              onAddNewProduct={handleAddNewProduct}
            />
          </div>

          {/* Bill Items Table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            {billItems.length > 0 ? (
              <>
                <div className="flex items-center justify-between p-3 border-b border-border bg-muted/30">
                  <span className="text-sm font-medium text-muted-foreground">{billItems.length} item(s)</span>
                  <OriginalPriceList items={billItems} />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Product</th>
                        <th className="text-center p-3 text-sm font-medium text-muted-foreground">Qty</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">Price</th>
                        <th className="text-center p-3 text-sm font-medium text-muted-foreground">GST</th>
                        <th className="text-right p-3 text-sm font-medium text-muted-foreground">Total</th>
                        <th className="p-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {billItems.map((item) => (
                        <BillItemRow key={item.id} item={item} onUpdate={updateBillItem} onRemove={removeBillItem} />
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <p className="text-lg">No items added</p>
                <p className="text-sm">Search for products above to add them to the bill</p>
              </div>
            )}
          </div>
        </div>

        {/* Bill Summary Section */}
        <div className="space-y-4">
          {/* Payment Method */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-medium mb-3">Payment Method</h3>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => (
                <button
                  key={method.value}
                  onClick={() => setPaymentMethod(method.value)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-colors ${paymentMethod === method.value
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background border-border hover:bg-muted'
                    }`}
                >
                  <method.icon size={18} />
                  <span className="text-sm font-medium">{method.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Contractor Commission */}
          {isContractor && (
            <div className="bg-card border border-amber-500/20 rounded-xl p-4">
              <h3 className="font-medium mb-3 flex items-center gap-2">
                <HardHat className="w-4 h-4 text-amber-500" />
                Commission
              </h3>
              <div className="space-y-2">
                <Label htmlFor="commission" className="text-sm text-muted-foreground">
                  Commission Amount (₹)
                </Label>
                <Input
                  id="commission"
                  type="number"
                  min="0"
                  step="0.01"
                  value={commission}
                  onChange={(e) => setCommission(parseFloat(e.target.value) || 0)}
                  className="h-9"
                  placeholder="0"
                />
                <p className="text-xs text-muted-foreground">
                  Commission for {selectedCustomer?.name} on this bill
                </p>
              </div>
            </div>
          )}

          {/* Bill Summary */}
          <div className="bg-card border border-border rounded-xl p-4">
            <h3 className="font-medium mb-4">Bill Summary</h3>
            <div className="space-y-3">
              {isContractor && endCustomerName && (
                <div className="flex justify-between text-sm pb-2 border-b border-border">
                  <span className="text-muted-foreground">End Customer</span>
                  <span className="font-medium">{endCustomerName}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Subtotal</span>
                <span>{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">GST</span>
                <span>{formatCurrency(totals.totalGst)}</span>
              </div>

              {/* Discount */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Label htmlFor="billDiscount" className="text-sm text-muted-foreground">Discount (₹)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="billDiscount"
                    type="number"
                    min="0"
                    step="0.01"
                    value={billDiscount}
                    onChange={(e) => {
                      const value = parseFloat(e.target.value) || 0;
                      if (value < 0) return;
                      const maxDiscount = totals.subtotal + totals.totalGst;
                      if (value > maxDiscount) { setBillDiscount(maxDiscount); return; }
                      setBillDiscount(value);
                    }}
                    className="h-9"
                    placeholder="0"
                  />
                  {billDiscount > 0 && (
                    <span className="text-sm text-muted-foreground whitespace-nowrap">
                      ({totals.discountPercentage.toFixed(1)}%)
                    </span>
                  )}
                </div>
              </div>

              <div className="border-t border-border pt-3">
                <div className="flex justify-between">
                  <span className="font-semibold">Grand Total</span>
                  <span className="text-xl font-bold text-primary">{formatCurrency(totals.grandTotal)}</span>
                </div>
              </div>

              {/* Amount Paid */}
              <div className="space-y-2 pt-2 border-t border-border">
                <Label htmlFor="amountPaid" className="text-sm text-muted-foreground">Amount Paid (₹)</Label>
                <Input
                  id="amountPaid"
                  type="number"
                  min="0"
                  step="0.01"
                  value={amountPaid || totals.grandTotal}
                  onChange={(e) => {
                    const value = parseFloat(e.target.value) || 0;
                    if (value < 0) { setAmountPaid(0); return; }
                    if (value > totals.grandTotal) { setAmountPaid(totals.grandTotal); return; }
                    setAmountPaid(value);
                  }}
                  className="h-9"
                  placeholder={totals.grandTotal.toString()}
                />
                {amountPaid > 0 && amountPaid < totals.grandTotal && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balance Due</span>
                    <span className="text-destructive font-medium">{formatCurrency(totals.grandTotal - amountPaid)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button onClick={handleSaveOnly} className="w-full gap-2" size="lg">
              <Save size={18} />
              Save Invoice
            </Button>
            <Button onClick={handlePrintFinalBill} variant="outline" className="w-full gap-2" size="lg">
              <Printer size={18} />
              Save & Print Final Bill
            </Button>
            <Button onClick={handlePrintRoughBill} variant="outline" className="w-full gap-2 border-dashed" size="lg">
              <FileText size={18} />
              Print Rough Bill
            </Button>
            <Button onClick={clearBill} variant="ghost" className="w-full gap-2 text-destructive hover:text-destructive">
              <Trash2 size={18} />
              Clear Bill
            </Button>
          </div>
        </div>
      </div>

      <AddProductModal
        isOpen={showAddProductModal}
        onClose={() => setShowAddProductModal(false)}
        productName={newProductName}
        onAddProduct={handleAddProduct}
        onSelectProduct={addProductToBill}
      />

      <div style={{ display: 'none' }}>
        <div ref={printRef}>
          {invoiceForPrint && <InvoiceReceipt invoice={invoiceForPrint} settings={settings} isRoughDraft={isRoughDraft} />}
        </div>
      </div>
    </MainLayout>
  );
}
