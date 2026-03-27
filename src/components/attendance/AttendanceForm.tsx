import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Attendance, AttendanceRequest, Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AttendanceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AttendanceRequest) => void;
  attendance?: Attendance | null;
  employees: Employee[];
}

// Internal form state type with time objects for UI
interface FormState {
  employeeId: string;
  attendanceDate: string;
  status: 'present' | 'absent' | 'half_day' | 'leave' | 'holiday';
  checkInTime: { hour: number; minute: number; second: number; nano: number };
  checkOutTime: { hour: number; minute: number; second: number; nano: number };
  notes: string;
}

export function AttendanceForm({ isOpen, onClose, onSubmit, attendance, employees }: AttendanceFormProps) {
  const [formData, setFormData] = useState<FormState>({
    employeeId: '',
    attendanceDate: new Date().toISOString().split('T')[0],
    status: 'present',
    checkInTime: { hour: 9, minute: 0, second: 0, nano: 0 },
    checkOutTime: { hour: 18, minute: 0, second: 0, nano: 0 },
    notes: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof AttendanceRequest, string>>>({});

  // Helper function to parse time string to time object
  const parseTimeString = (timeString: string | undefined): { hour: number; minute: number; second: number; nano: number } => {
    if (!timeString) return { hour: 9, minute: 0, second: 0, nano: 0 };
    const [hours, minutes] = timeString.split(':');
    return {
      hour: parseInt(hours) || 0,
      minute: parseInt(minutes) || 0,
      second: 0,
      nano: 0,
    };
  };

  // Helper function to handle API time objects
  const handleApiTimeObject = (timeObj: any): { hour: number; minute: number; second: number; nano: number } => {
    if (!timeObj || typeof timeObj !== 'object') {
      return { hour: 9, minute: 0, second: 0, nano: 0 };
    }
    return {
      hour: timeObj.hour || 0,
      minute: timeObj.minute || 0,
      second: timeObj.second || 0,
      nano: timeObj.nano || 0,
    };
  };

  useEffect(() => {
    if (attendance) {
      setFormData({
        employeeId: attendance.employeeId,
        attendanceDate: attendance.attendanceDate,
        status: attendance.status,
        checkInTime: handleApiTimeObject(attendance.checkInTime),
        checkOutTime: handleApiTimeObject(attendance.checkOutTime),
        notes: attendance.notes || '',
      });
    } else {
      setFormData({
        employeeId: '',
        attendanceDate: new Date().toISOString().split('T')[0],
        status: 'present',
        checkInTime: { hour: 9, minute: 0, second: 0, nano: 0 },
        checkOutTime: { hour: 18, minute: 0, second: 0, nano: 0 },
        notes: '',
      });
    }
    setErrors({});
  }, [attendance, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof AttendanceRequest, string>> = {};

    if (!formData.employeeId) {
      newErrors.employeeId = 'Employee is required';
    }

    if (!formData.attendanceDate) {
      newErrors.attendanceDate = 'Date is required';
    }

    if (!formData.status) {
      newErrors.status = 'Status is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Convert time objects to strings for API
      const submissionData: AttendanceRequest = {
        ...formData,
        checkInTime: (formData.status === 'present' || formData.status === 'half_day')
          ? `${formData.checkInTime?.hour.toString().padStart(2, '0')}:${formData.checkInTime?.minute.toString().padStart(2, '0')}:00`
          : undefined,
        checkOutTime: (formData.status === 'present' || formData.status === 'half_day')
          ? `${formData.checkOutTime?.hour.toString().padStart(2, '0')}:${formData.checkOutTime?.minute.toString().padStart(2, '0')}:00`
          : undefined,
      };
      onSubmit(submissionData);
    }
  };

  const handleInputChange = (field: keyof FormState, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof AttendanceRequest]) {
      setErrors((prev) => ({ ...prev, [field as keyof AttendanceRequest]: undefined }));
    }
  };

  const handleTimeChange = (field: 'checkInTime' | 'checkOutTime', timeField: 'hour' | 'minute', value: string) => {
    const timeValue = parseInt(value) || 0;
    const validValue = timeField === 'hour'
      ? Math.min(23, Math.max(0, timeValue))
      : Math.min(59, Math.max(0, timeValue));

    setFormData((prev) => ({
      ...prev,
      [field]: {
        ...prev[field]!,
        [timeField]: validValue,
        second: 0,
        nano: 0,
      },
    }));
  };

  const formatTimeDisplay = (time: { hour: number; minute: number; second: number; nano: number }) => {
    return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {attendance ? 'Edit Attendance' : 'Mark Attendance'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="employeeId">Employee *</Label>
            <Select
              value={formData.employeeId}
              onValueChange={(value) => handleInputChange('employeeId', value)}
            >
              <SelectTrigger className={errors.employeeId ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select employee" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeeId && (
              <p className="text-sm text-destructive">{errors.employeeId}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="attendanceDate">Date *</Label>
            <Input
              id="attendanceDate"
              type="date"
              value={formData.attendanceDate}
              onChange={(e) => handleInputChange('attendanceDate', e.target.value)}
              className={errors.attendanceDate ? 'border-destructive' : ''}
            />
            {errors.attendanceDate && (
              <p className="text-sm text-destructive">{errors.attendanceDate}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status *</Label>
            <Select
              value={formData.status}
              onValueChange={(value: any) => handleInputChange('status', value)}
            >
              <SelectTrigger className={errors.status ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="present">Present</SelectItem>
                <SelectItem value="absent">Absent</SelectItem>
                <SelectItem value="half_day">Half Day</SelectItem>
                <SelectItem value="leave">Leave</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
              </SelectContent>
            </Select>
            {errors.status && (
              <p className="text-sm text-destructive">{errors.status}</p>
            )}
          </div>

          {(formData.status === 'present' || formData.status === 'half_day') && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Check In Time</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.checkInTime?.hour || 9}
                    onChange={(e) => handleTimeChange('checkInTime', 'hour', e.target.value)}
                    className="w-20"
                  />
                  <span>:</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.checkInTime?.minute || 0}
                    onChange={(e) => handleTimeChange('checkInTime', 'minute', e.target.value)}
                    className="w-20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Check Out Time</Label>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="0"
                    max="23"
                    value={formData.checkOutTime?.hour || 18}
                    onChange={(e) => handleTimeChange('checkOutTime', 'hour', e.target.value)}
                    className="w-20"
                  />
                  <span>:</span>
                  <Input
                    type="number"
                    min="0"
                    max="59"
                    value={formData.checkOutTime?.minute || 0}
                    onChange={(e) => handleTimeChange('checkOutTime', 'minute', e.target.value)}
                    className="w-20"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Add any additional notes..."
              rows={3}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              {attendance ? 'Update Attendance' : 'Mark Attendance'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
