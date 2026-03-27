import { useState } from 'react';
import { Save, RotateCcw, Store, CreditCard, FileText, Percent } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useSettings } from '@/hooks/useSettings';
import { useToast } from '@/hooks/use-toast';
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

export default function Settings() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const { toast } = useToast();
  const [formData, setFormData] = useState(settings);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSave = () => {
    updateSettings(formData);
    toast({
      title: 'Settings Saved',
      description: 'Your shop settings have been updated successfully',
    });
  };

  const handleReset = () => {
    resetSettings();
    setFormData(settings);
    setShowResetConfirm(false);
    toast({
      title: 'Settings Reset',
      description: 'Shop settings have been reset to defaults',
    });
  };

  const sections = [
    {
      title: 'Shop Information',
      icon: Store,
      fields: [
        { id: 'name', label: 'Shop Name', type: 'text', required: true },
        { id: 'address', label: 'Address', type: 'textarea', required: true },
        { id: 'phone', label: 'Phone Number', type: 'tel' },
        { id: 'email', label: 'Email', type: 'email' },
        { id: 'gstNumber', label: 'GST Number', type: 'text' },
      ],
    },
    {
      title: 'Bank Details',
      icon: CreditCard,
      fields: [
        { id: 'bankName', label: 'Bank Name', type: 'text' },
        { id: 'accountNumber', label: 'Account Number', type: 'text' },
        { id: 'ifscCode', label: 'IFSC Code', type: 'text' },
        { id: 'upiId', label: 'UPI ID', type: 'text' },
      ],
    },
    {
      title: 'Invoice Settings',
      icon: FileText,
      fields: [
        { id: 'invoicePrefix', label: 'Invoice Prefix', type: 'text', placeholder: 'e.g., INV' },
        { id: 'termsAndConditions', label: 'Terms & Conditions', type: 'textarea' },
      ],
    },
    {
      title: 'Tax Settings',
      icon: Percent,
      fields: [
        {
          id: 'defaultGstPercentage',
          label: 'Default GST Percentage',
          type: 'number',
          min: 0,
          max: 100,
        },
      ],
    },
  ];

  return (
    <MainLayout>
      <PageHeader
        title="Settings"
        description="Configure your shop and billing preferences"
        action={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowResetConfirm(true)} className="gap-2">
              <RotateCcw size={18} />
              Reset
            </Button>
            <Button onClick={handleSave} className="gap-2">
              <Save size={18} />
              Save Changes
            </Button>
          </div>
        }
      />

      <div className="space-y-6">
        {sections.map((section) => (
          <div key={section.title} className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-lg font-semibold">{section.title}</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {section.fields.map((field) => (
                <div
                  key={field.id}
                  className={field.type === 'textarea' ? 'md:col-span-2' : ''}
                >
                  <Label htmlFor={field.id}>
                    {field.label}
                    {field.required && <span className="text-destructive ml-1">*</span>}
                  </Label>
                  {field.type === 'textarea' ? (
                    <Textarea
                      id={field.id}
                      value={(formData as any)[field.id] || ''}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.id]: e.target.value })
                      }
                      placeholder={field.placeholder}
                      rows={3}
                      className="mt-1.5"
                    />
                  ) : (
                    <Input
                      id={field.id}
                      type={field.type}
                      value={(formData as any)[field.id] || ''}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          [field.id]:
                            field.type === 'number'
                              ? parseFloat(e.target.value) || 0
                              : e.target.value,
                        })
                      }
                      placeholder={field.placeholder}
                      min={field.min}
                      max={field.max}
                      className="mt-1.5"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Reset Confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset Settings</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to reset all settings to their default values? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReset}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Reset
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
