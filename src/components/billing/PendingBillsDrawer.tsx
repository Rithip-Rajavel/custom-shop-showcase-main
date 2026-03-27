import { useState } from 'react';
import { Clock, Trash2, ArrowRight, StickyNote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { PendingBill } from '@/hooks/usePendingBills';
import { formatCurrency } from '@/lib/utils';
import { format } from 'date-fns';

interface PendingBillsDrawerProps {
  pendingBills: PendingBill[];
  onLoadBill: (bill: PendingBill) => void;
  onDeleteBill: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

export function PendingBillsDrawer({ pendingBills, onLoadBill, onDeleteBill, onUpdateNotes }: PendingBillsDrawerProps) {
  const [editingNotesId, setEditingNotesId] = useState<string | null>(null);
  const [draftNotes, setDraftNotes] = useState('');

  const startEditing = (bill: PendingBill) => {
    setEditingNotesId(bill.id);
    setDraftNotes(bill.notes || '');
  };

  const saveNotes = (id: string) => {
    onUpdateNotes(id, draftNotes);
    setEditingNotesId(null);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <Clock size={18} />
          Pending Bills
          {pendingBills.length > 0 && (
            <Badge variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {pendingBills.length}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[450px]">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Pending Bills ({pendingBills.length})
          </SheetTitle>
        </SheetHeader>
        <div className="mt-6 space-y-3 overflow-y-auto max-h-[calc(100vh-120px)]">
          {pendingBills.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No pending bills</p>
          ) : (
            pendingBills.map((bill) => {
              const total = bill.items.reduce((sum, item) => sum + item.total, 0);
              const isEditing = editingNotesId === bill.id;
              return (
                <div key={bill.id} className="bg-muted/50 border border-border rounded-lg p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm">{bill.customerName}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(bill.updatedAt), 'dd MMM yyyy, hh:mm a')}
                      </p>
                    </div>
                    <Badge variant="outline">{bill.items.length} items</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground space-y-0.5">
                    {bill.items.slice(0, 3).map((item) => (
                      <p key={item.id}>{item.productName} × {item.quantity}</p>
                    ))}
                    {bill.items.length > 3 && (
                      <p className="italic">+{bill.items.length - 3} more items</p>
                    )}
                  </div>

                  {/* Notes section */}
                  {isEditing ? (
                    <div className="space-y-1.5">
                      <Textarea
                        value={draftNotes}
                        onChange={(e) => setDraftNotes(e.target.value)}
                        placeholder="Add negotiation notes..."
                        className="text-xs min-h-[60px] resize-none"
                        autoFocus
                      />
                      <div className="flex gap-1.5 justify-end">
                        <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setEditingNotesId(null)}>Cancel</Button>
                        <Button size="sm" className="h-6 text-xs" onClick={() => saveNotes(bill.id)}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => startEditing(bill)}
                      className="w-full text-left text-xs rounded px-2 py-1.5 bg-background/50 border border-dashed border-border hover:border-primary/50 transition-colors"
                    >
                      {bill.notes ? (
                        <span className="flex items-start gap-1.5">
                          <StickyNote size={12} className="mt-0.5 text-primary shrink-0" />
                          <span className="text-foreground">{bill.notes}</span>
                        </span>
                      ) : (
                        <span className="text-muted-foreground italic flex items-center gap-1.5">
                          <StickyNote size={12} />
                          Add notes...
                        </span>
                      )}
                    </button>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-border">
                    <span className="font-semibold text-sm text-primary">
                      ~{formatCurrency(total)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteBill(bill.id)}
                        className="h-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 size={14} />
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => onLoadBill(bill)}
                        className="h-8 gap-1"
                      >
                        Load <ArrowRight size={14} />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
