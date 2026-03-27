import { forwardRef } from 'react';
import { Invoice, ShopSettings } from '@/types';
import { formatCurrency, formatDateTime } from '@/lib/utils';

interface InvoiceReceiptProps {
  invoice: Invoice;
  settings: ShopSettings;
  isRoughDraft?: boolean;
}

export const InvoiceReceipt = forwardRef<HTMLDivElement, InvoiceReceiptProps>(
  ({ invoice, settings, isRoughDraft = false }, ref) => {
    return (
      <div ref={ref} className="thermal-receipt bg-card p-4 font-mono text-sm">
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="shop-name text-base font-bold uppercase">{settings.name}</h1>
          <p className="text-xs mt-1 whitespace-pre-wrap">{settings.address}</p>
          {settings.phone && <p className="text-xs">Ph: {settings.phone}</p>}
          {settings.gstNumber && <p className="text-xs">GSTIN: {settings.gstNumber}</p>}
        </div>

        {isRoughDraft && (
          <div className="text-center mb-2">
            <p className="text-xs font-bold uppercase border border-foreground/30 inline-block px-3 py-1">
              ROUGH DRAFT / ESTIMATE
            </p>
          </div>
        )}

        <div className="divider border-t border-dashed border-foreground/30 my-2" />

        {/* Invoice Details */}
        <div className="text-xs space-y-1 mb-2">
          <div className="flex justify-between">
            <span>Invoice #:</span>
            <span className="font-medium">{invoice.invoiceNumber}</span>
          </div>
          <div className="flex justify-between">
            <span>Date:</span>
            <span>{formatDateTime(invoice.createdAt)}</span>
          </div>
          {invoice.customerName !== 'Walk-in Customer' && (
            <>
              <div className="flex justify-between">
                <span>{invoice.customerType === 'contractor' ? 'Contractor:' : 'Customer:'}</span>
                <span>{invoice.customerName}</span>
              </div>
              {invoice.customerPhone && (
                <div className="flex justify-between">
                  <span>Phone:</span>
                  <span>{invoice.customerPhone}</span>
                </div>
              )}
              {invoice.endCustomerName && (
                <div className="flex justify-between">
                  <span>End Customer:</span>
                  <span>{invoice.endCustomerName}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="divider border-t border-dashed border-foreground/30 my-2" />

        {/* Items Table */}
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-foreground/30">
              <th className="text-left py-1">Item</th>
              <th className="text-center py-1">Qty</th>
              <th className="text-right py-1">Rate</th>
              <th className="text-right py-1">Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items.map((item, index) => (
              <tr key={index} className="border-b border-foreground/10" style={{ minHeight: isRoughDraft ? '28px' : undefined }}>
                <td className="py-1 product-name max-w-[100px]">
                  <div className="break-words">{item.productName}</div>
                  {item.pricingType && item.pricingType !== 'standard' && item.height && item.width && (
                    <div className="text-xs text-muted-foreground">
                      {item.height}' × {item.width}' = {item.area?.toFixed(2)} {item.pricingType === 'per_sqft' ? 'sqft' : 'rft'}
                    </div>
                  )}
                  {!isRoughDraft && item.discount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Disc: {formatCurrency(item.discount)}
                    </div>
                  )}
                  {!isRoughDraft && item.withTax && item.gstAmount > 0 && (
                    <div className="text-xs text-muted-foreground">
                      GST {item.gstPercentage}%: {formatCurrency(item.gstAmount)}
                    </div>
                  )}
                </td>
                <td className="text-center py-1">{item.quantity}</td>
                {isRoughDraft ? (
                  <>
                    <td className="text-right py-1">
                      <span className="border-b border-dashed border-foreground/30 inline-block w-14">&nbsp;</span>
                    </td>
                    <td className="text-right py-1">
                      <span className="border-b border-dashed border-foreground/30 inline-block w-16">&nbsp;</span>
                    </td>
                  </>
                ) : (
                  <>
                    <td className="text-right py-1">{formatCurrency(item.price)}</td>
                    <td className="text-right py-1">{formatCurrency(item.customTotal ?? item.total)}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div className="divider border-t border-dashed border-foreground/30 my-2" />

        {/* Totals - only for final bill */}
        {!isRoughDraft ? (
          <div className="space-y-1 text-xs">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{formatCurrency(invoice.subtotal)}</span>
            </div>
            {invoice.totalDiscount > 0 && (
              <div className="flex justify-between text-muted-foreground">
                <span>Total Discount:</span>
                <span>-{formatCurrency(invoice.totalDiscount)}</span>
              </div>
            )}
            {invoice.totalGst > 0 && (
              <div className="flex justify-between">
                <span>Total GST:</span>
                <span>{formatCurrency(invoice.totalGst)}</span>
              </div>
            )}
            <div className="divider border-t border-dashed border-foreground/30 my-1" />
            <div className="flex justify-between font-bold text-sm">
              <span>GRAND TOTAL:</span>
              <span>{formatCurrency(invoice.grandTotal)}</span>
            </div>
            {(invoice.balance || 0) > 0 && (
              <>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(invoice.amountPaid)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Balance Due:</span>
                  <span>{formatCurrency(invoice.balance)}</span>
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-xs">
            <div className="flex justify-between font-bold text-sm">
              <span>TOTAL:</span>
              <span className="border-b border-dashed border-foreground/30 w-24 inline-block">&nbsp;</span>
            </div>
            <p className="text-center text-muted-foreground italic">
              This is an estimate / rough draft. Final amounts to be confirmed.
            </p>
          </div>
        )}

        <div className="divider border-t border-dashed border-foreground/30 my-2" />

        {/* Payment Method */}
        {!isRoughDraft && (
          <>
            <div className="text-center text-xs">
              <p>Payment: {invoice.paymentMethod.toUpperCase()}</p>
            </div>

            {(invoice.paymentMethod === 'upi' || invoice.paymentMethod === 'card') && settings.upiId && (
              <div className="mt-2 text-center text-xs">
                <p>UPI: {settings.upiId}</p>
              </div>
            )}

            <div className="divider border-t border-dashed border-foreground/30 my-2" />
          </>
        )}

        {/* Footer */}
        <div className="text-center text-xs mt-2">
          {settings.termsAndConditions && (
            <p className="text-muted-foreground whitespace-pre-wrap mb-2">{settings.termsAndConditions}</p>
          )}
          <p className="font-medium">Thank you for your business!</p>
        </div>
      </div>
    );
  }
);

InvoiceReceipt.displayName = 'InvoiceReceipt';
