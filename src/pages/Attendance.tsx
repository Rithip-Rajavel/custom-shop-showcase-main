import { useState, useEffect } from 'react';
import { Calendar, CheckCircle, XCircle, Clock, Users, Search, Filter, Plus } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { AttendanceForm } from '@/components/attendance/AttendanceForm';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAttendance } from '@/hooks/useAttendance';
import { useEmployees } from '@/hooks/useEmployees';
import { Attendance, AttendanceRequest } from '@/types';
import { formatCurrency, formatDate, formatTime } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

export default function AttendancePage() {
  const { attendance, markAttendance, deleteAttendance, fetchAttendance, getPayrollSummary } = useAttendance();
  const { employees } = useEmployees();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingAttendance, setEditingAttendance] = useState<Attendance | null>(null);
  const [payrollData, setPayrollData] = useState<any>(null);
  const [payrollMonth, setPayrollMonth] = useState<number>(new Date().getMonth() + 1);
  const [payrollYear, setPayrollYear] = useState<number>(new Date().getFullYear());

  const activeEmployees = employees.filter(emp => emp.active);

  const handleMarkAttendance = (attendanceData: AttendanceRequest) => {
    if (editingAttendance) {
      // For editing, we still use markAttendance (upsert) but with updated data
      markAttendance(attendanceData);
      toast({ title: 'Updated', description: 'Attendance has been updated successfully' });
    } else {
      markAttendance(attendanceData);
      toast({ title: 'Marked', description: 'Attendance has been marked successfully' });
    }
    setIsFormOpen(false);
    setEditingAttendance(null);
  };

  const openMarkForm = () => {
    setEditingAttendance(null);
    setIsFormOpen(true);
  };

  const openEditForm = (attendance: Attendance) => {
    setEditingAttendance(attendance);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingAttendance(null);
  };

  const loadPayrollSummary = async () => {
    if (selectedEmployee !== 'all') {
      try {
        const summary = await getPayrollSummary(selectedEmployee, payrollYear, payrollMonth);
        setPayrollData(summary);
      } catch (error) {
        console.error('Failed to load payroll summary:', error);
        setPayrollData(null);
      }
    }
  };

  // Load attendance when filters change
  useEffect(() => {
    if (selectedDate) {
      if (selectedEmployee === 'all') {
        // Load daily attendance for all employees
        fetchAttendance({ date: selectedDate });
      } else {
        // Load attendance for specific employee (for a range around the selected date)
        const fromDate = selectedDate;
        const toDate = selectedDate;
        fetchAttendance({ employeeId: selectedEmployee, fromDate, toDate });
      }
    }
  }, [selectedDate, selectedEmployee, fetchAttendance]);

  const filteredAttendance = attendance.filter((att) => {
    const matchesSearch = att.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      att.employeeCode.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEmployee = selectedEmployee === 'all' || att.employeeId === selectedEmployee;
    const matchesStatus = selectedStatus === 'all' || att.status === selectedStatus;
    const matchesDate = !selectedDate || att.attendanceDate === selectedDate;

    return matchesSearch && matchesEmployee && matchesStatus && matchesDate;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'absent':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'half_day':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'leave':
        return <Calendar className="w-4 h-4 text-blue-500" />;
      case 'holiday':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      present: { variant: 'default' as const, label: 'Present', className: 'bg-green-500 hover:bg-green-600' },
      absent: { variant: 'destructive' as const, label: 'Absent', className: 'bg-red-500 hover:bg-red-600' },
      half_day: { variant: 'secondary' as const, label: 'Half Day', className: 'bg-yellow-500 hover:bg-yellow-600 text-white' },
      leave: { variant: 'outline' as const, label: 'Leave', className: 'bg-blue-500 hover:bg-blue-600 text-white border-blue-500' },
      holiday: { variant: 'outline' as const, label: 'Holiday', className: 'bg-purple-500 hover:bg-purple-600 text-white border-purple-500' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] ||
      { variant: 'secondary' as const, label: status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()), className: 'bg-gray-500 hover:bg-gray-600 text-white' };

    return (
      <Badge
        variant={config.variant}
        className={cn('capitalize', config.className)}
      >
        {config.label}
      </Badge>
    );
  };

  const getTodayStats = () => {
    const today = new Date().toISOString().split('T')[0];
    const todayAttendance = attendance.filter(att => att.attendanceDate === today);

    return {
      total: activeEmployees.length,
      present: todayAttendance.filter(att => att.status === 'present').length,
      absent: todayAttendance.filter(att => att.status === 'absent').length,
      halfDay: todayAttendance.filter(att => att.status === 'half_day').length,
      leave: todayAttendance.filter(att => att.status === 'leave').length,
    };
  };

  const todayStats = getTodayStats();

  return (
    <MainLayout>
      <PageHeader
        title="Attendance Management"
        description="Track employee attendance and generate payroll reports"
      />

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-xl font-bold">{todayStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Present</p>
                <p className="text-xl font-bold text-green-600">{todayStats.present}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Absent</p>
                <p className="text-xl font-bold text-red-600">{todayStats.absent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Half Day</p>
                <p className="text-xl font-bold text-amber-600">{todayStats.halfDay}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Leave</p>
                <p className="text-xl font-bold text-blue-600">{todayStats.leave}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Attendance</p>
                <p className="text-xl font-bold text-purple-600">
                  {todayStats.total > 0 ? Math.round((todayStats.present / todayStats.total) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="attendance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="attendance" className="gap-2">
            <Calendar size={16} />
            Attendance
          </TabsTrigger>
          <TabsTrigger value="payroll" className="gap-2">
            <Users size={16} />
            Payroll
          </TabsTrigger>
        </TabsList>

        <TabsContent value="attendance" className="space-y-4">
          {/* Filters and Actions */}
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search employees..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Select Employee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Employees</SelectItem>
                  {activeEmployees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.name} ({emp.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="present">Present</SelectItem>
                  <SelectItem value="absent">Absent</SelectItem>
                  <SelectItem value="half_day">Half Day</SelectItem>
                  <SelectItem value="leave">Leave</SelectItem>
                  <SelectItem value="holiday">Holiday</SelectItem>
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full sm:w-40"
              />
            </div>
            <Button onClick={openMarkForm} className="gap-2">
              <Plus size={16} />
              Mark Attendance
            </Button>
          </div>

          {/* Attendance List */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Records</CardTitle>
            </CardHeader>
            <CardContent>
              {filteredAttendance.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Calendar className="w-16 h-16 mb-4" />
                  <p className="text-lg">No attendance records found</p>
                  <p className="text-sm">Try adjusting your filters or mark some attendance</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredAttendance.map((att) => (
                    <div key={att.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex items-center gap-4">
                        {getStatusIcon(att.status)}
                        <div>
                          <p className="font-medium">{att.employeeName}</p>
                          <p className="text-sm text-muted-foreground">{att.employeeCode} • {formatDate(att.attendanceDate)}</p>
                          {att.notes && <p className="text-sm text-muted-foreground mt-1">{att.notes}</p>}
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(att.status)}
                        {(att.checkInTime && att.checkInTime.hour !== undefined) || (att.checkOutTime && att.checkOutTime.hour !== undefined) ? (
                          <div className="text-sm text-muted-foreground">
                            {att.checkInTime && <span>In: {formatTime(att.checkInTime)}</span>}
                            {att.checkInTime && att.checkOutTime && <span> • </span>}
                            {att.checkOutTime && <span>Out: {formatTime(att.checkOutTime)}</span>}
                          </div>
                        ) : null}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditForm(att)}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payroll" className="space-y-4">
          {/* Payroll Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={selectedEmployee} onValueChange={setSelectedEmployee}>
              <SelectTrigger className="w-full sm:w-64">
                <SelectValue placeholder="Select Employee" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Select an employee</SelectItem>
                {activeEmployees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name} ({emp.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={payrollMonth.toString()} onValueChange={(v) => setPayrollMonth(parseInt(v))}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">January</SelectItem>
                <SelectItem value="2">February</SelectItem>
                <SelectItem value="3">March</SelectItem>
                <SelectItem value="4">April</SelectItem>
                <SelectItem value="5">May</SelectItem>
                <SelectItem value="6">June</SelectItem>
                <SelectItem value="7">July</SelectItem>
                <SelectItem value="8">August</SelectItem>
                <SelectItem value="9">September</SelectItem>
                <SelectItem value="10">October</SelectItem>
                <SelectItem value="11">November</SelectItem>
                <SelectItem value="12">December</SelectItem>
              </SelectContent>
            </Select>
            <Select value={payrollYear.toString()} onValueChange={(v) => setPayrollYear(parseInt(v))}>
              <SelectTrigger className="w-full sm:w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2026">2026</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={loadPayrollSummary}>Generate</Button>
          </div>

          {/* Payroll Summary */}
          {payrollData ? (
            <Card>
              <CardHeader>
                <CardTitle>Payroll Summary - {payrollData.employeeName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-muted-foreground">Present Days</p>
                    <p className="text-2xl font-bold text-green-600">{payrollData.presentDays}</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-muted-foreground">Absent Days</p>
                    <p className="text-2xl font-bold text-red-600">{payrollData.absentDays}</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-muted-foreground">Half Days</p>
                    <p className="text-2xl font-bold text-amber-600">{payrollData.halfDays}</p>
                  </div>
                  <div className="text-center p-4 border rounded">
                    <p className="text-sm text-muted-foreground">Leave Days</p>
                    <p className="text-2xl font-bold text-blue-600">{payrollData.leaveDays}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Monthly Salary</p>
                      <p className="text-xl font-bold">{formatCurrency(payrollData.monthlySalary)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Loss of Pay</p>
                      <p className="text-xl font-bold text-red-600">-{formatCurrency(payrollData.lossOfPayAmount)}</p>
                    </div>
                  </div>
                  <div className="border-t mt-4 pt-4">
                    <div className="flex justify-between items-center">
                      <p className="text-lg font-semibold">Net Payable Salary</p>
                      <p className="text-2xl font-bold text-green-600">{formatCurrency(payrollData.netPayableSalary)}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="flex flex-col items-center justify-center text-muted-foreground">
                  <Users className="w-16 h-16 mb-4" />
                  <p className="text-lg">Select an employee to generate payroll</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Attendance Form Modal */}
      <AttendanceForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={handleMarkAttendance}
        attendance={editingAttendance}
        employees={activeEmployees}
      />
    </MainLayout>
  );
}
