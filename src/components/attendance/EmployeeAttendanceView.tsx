import { useState, useEffect } from 'react';
import { Calendar, User, DollarSign, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp, TrendingDown, Filter, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAttendance } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { Attendance, PayrollSummary, Employee } from '@/types';
import { formatDate, formatCurrency } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export function EmployeeAttendanceView() {
  const { employees } = useEmployees();
  const { fetchMonthlyAttendance, getPayrollSummary, isLoading } = useAttendance();
  const { toast } = useToast();

  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [allowedLeaves, setAllowedLeaves] = useState<number>(2);
  const [attendanceData, setAttendanceData] = useState<Attendance[]>([]);
  const [payrollData, setPayrollData] = useState<PayrollSummary | null>(null);
  const [activeTab, setActiveTab] = useState<'attendance' | 'payroll'>('attendance');

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  useEffect(() => {
    if (selectedEmployee && selectedYear && selectedMonth) {
      loadEmployeeData();
    }
  }, [selectedEmployee, selectedYear, selectedMonth, allowedLeaves]);

  const loadEmployeeData = async () => {
    if (!selectedEmployee) return;

    try {
      // Load monthly attendance
      const attendance = await fetchMonthlyAttendance(selectedEmployee, selectedYear, selectedMonth);
      setAttendanceData(attendance);

      // Load payroll with allowed leaves
      const payroll = await getPayrollSummary(selectedEmployee, selectedYear, selectedMonth, allowedLeaves);
      setPayrollData(payroll);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load employee data',
        variant: 'destructive'
      });
    }
  };

  const formatTime = (time?: { hour: number; minute: number; second: number; nano: number } | string) => {
    if (!time) return '';

    // Handle string format like "09:00:00"
    if (typeof time === 'string') {
      return time.substring(0, 5); // Take "HH:MM" from "HH:MM:SS"
    }

    // Handle object format
    if (typeof time === 'object' && time.hour !== undefined) {
      return `${time.hour.toString().padStart(2, '0')}:${time.minute.toString().padStart(2, '0')}`;
    }

    return '';
  };

  const getStatusIcon = (status: string) => {
    switch (status.toLowerCase()) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'half_day':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'leave':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      present: 'default',
      absent: 'destructive',
      half_day: 'secondary',
      leave: 'outline',
    };

    return (
      <Badge variant={variants[status.toLowerCase()] || 'outline'}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  const getSelectedEmployee = () => {
    return employees.find(emp => emp.id === selectedEmployee);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Calendar className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Employee Attendance & Payroll</h1>
          <p className="text-muted-foreground">View complete attendance records and payroll calculations</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Employee</Label>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger>
                  <SelectValue placeholder="Select employee" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      {employee.name} ({employee.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Month</Label>
              <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map((month) => (
                    <SelectItem key={month.value} value={month.value.toString()}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Year</Label>
              <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Allowed Leaves</Label>
              <Input
                type="number"
                min="0"
                max="30"
                value={allowedLeaves}
                onChange={(e) => setAllowedLeaves(parseInt(e.target.value) || 0)}
                placeholder="Number of allowed leaves"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {selectedEmployee && (
        <>
          {/* Employee Info */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold">{getSelectedEmployee()?.name}</h3>
                  <p className="text-muted-foreground">
                    {getSelectedEmployee()?.code} • {getSelectedEmployee()?.designation} • {getSelectedEmployee()?.department}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Monthly Salary</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(getSelectedEmployee()?.monthlySalary || 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="flex gap-2">
            <Button
              variant={activeTab === 'attendance' ? 'default' : 'outline'}
              onClick={() => setActiveTab('attendance')}
            >
              <Calendar className="w-4 h-4 mr-2" />
              Attendance ({attendanceData.length})
            </Button>
            <Button
              variant={activeTab === 'payroll' ? 'default' : 'outline'}
              onClick={() => setActiveTab('payroll')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Payroll Summary
            </Button>
          </div>

          {/* Attendance Tab */}
          {activeTab === 'attendance' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Monthly Attendance</span>
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">Loading attendance data...</div>
                ) : attendanceData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No attendance records found for this period</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {attendanceData.map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(record.status)}
                          <div>
                            <p className="font-medium">{formatDate(record.attendanceDate)}</p>
                            <p className="text-sm text-muted-foreground">
                              {record.checkInTime && `Check-in: ${formatTime(record.checkInTime)}`}
                              {record.checkOutTime && ` • Check-out: ${formatTime(record.checkOutTime)}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {getStatusBadge(record.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Payroll Tab */}
          {activeTab === 'payroll' && payrollData && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Payroll Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="w-5 h-5" />
                    Payroll Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Salary</p>
                      <p className="text-lg font-semibold">{formatCurrency(payrollData.monthlySalary)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Per Day Salary</p>
                      <p className="text-lg font-semibold">{formatCurrency(payrollData.perDaySalary)}</p>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Working Days</p>
                        <p className="font-medium">{payrollData.totalWorkingDays}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Present Days</p>
                        <p className="font-medium text-green-600">{payrollData.presentDays}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Absent Days</p>
                        <p className="font-medium text-red-600">{payrollData.absentDays}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Allowed Leaves</p>
                        <p className="font-medium text-blue-600">{payrollData.allowedLeaves || 0}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Loss of Pay Days</p>
                        <p className="font-medium text-orange-600">{payrollData.lossOfPayDays}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Loss of Pay Amount</p>
                        <p className="font-medium text-red-600">{formatCurrency(payrollData.lossOfPayAmount)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="border-t pt-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Net Payable Salary</p>
                        <p className="text-2xl font-bold text-green-600">
                          {formatCurrency(payrollData.netPayableSalary)}
                        </p>
                      </div>
                      {payrollData.lossOfPayAmount > 0 ? (
                        <TrendingDown className="w-8 h-8 text-red-500" />
                      ) : (
                        <TrendingUp className="w-8 h-8 text-green-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Attendance Breakdown */}
              <Card>
                <CardHeader>
                  <CardTitle>Attendance Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span>Present Days</span>
                      </div>
                      <span className="font-medium">{payrollData.presentDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <XCircle className="w-4 h-4 text-red-500" />
                        <span>Absent Days</span>
                      </div>
                      <span className="font-medium">{payrollData.absentDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-yellow-500" />
                        <span>Half Days</span>
                      </div>
                      <span className="font-medium">{payrollData.halfDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span>Leave Days</span>
                      </div>
                      <span className="font-medium">{payrollData.leaveDays}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-purple-500" />
                        <span>Holiday Days</span>
                      </div>
                      <span className="font-medium">{payrollData.holidayDays}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}
    </div>
  );
}
