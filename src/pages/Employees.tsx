import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, Calendar, DollarSign, Phone, Mail, Building } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageHeader } from '@/components/layout/PageHeader';
import { EmployeeForm } from '@/components/employees/EmployeeForm';
import { EmployeeBonusModal, EmployeeBonusData } from '@/components/employees/EmployeeBonusModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEmployees } from '@/hooks/useEmployees';
import { useBonuses } from '@/hooks/useBonuses';
import { Employee, EmployeeRequest } from '@/types';
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

export default function Employees() {
  const { employees, addEmployee, updateEmployee, deleteEmployee, isLoading } = useEmployees();
  const { bonuses, createBonus, deleteBonus, getAllBonuses } = useBonuses();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(null);
  const [isBonusModalOpen, setIsBonusModalOpen] = useState(false);
  const [isAddingBonus, setIsAddingBonus] = useState(false);

  // Fetch all bonuses for employees
  useState(() => {
    getAllBonuses();
  });

  const handleAddEmployee = (employee: EmployeeRequest) => {
    addEmployee(employee);
    toast({
      title: 'Employee Added',
      description: `${employee.name} has been added successfully`
    });
    setIsFormOpen(false);
  };

  const handleUpdateEmployee = (id: string, updates: Partial<EmployeeRequest>) => {
    updateEmployee(id, updates);
    toast({
      title: 'Updated',
      description: 'Employee record has been updated successfully'
    });
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const handleDeleteEmployee = () => {
    if (deletingEmployee) {
      deleteEmployee(deletingEmployee.id);
      toast({
        title: 'Deleted',
        description: `${deletingEmployee.name} has been deleted`
      });
      setDeletingEmployee(null);
    }
  };

  const openAddForm = () => {
    setEditingEmployee(null);
    setIsFormOpen(true);
  };

  const openEditForm = (employee: Employee) => {
    setEditingEmployee(employee);
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEmployee(null);
  };

  const handleEmployeeBonusSubmit = async (bonusData: EmployeeBonusData) => {
    setIsAddingBonus(true);
    try {
      const bonusDate = new Date(bonusData.date);
      const month = bonusDate.getMonth() + 1;
      const year = bonusDate.getFullYear();

      await createBonus(
        bonusData.employeeId,
        bonusData.amount,
        month,
        year,
        bonusData.reason + (bonusData.notes ? ` (${bonusData.notes})` : '')
      );

      toast({
        title: 'Success',
        description: 'Employee bonus added successfully!',
      });
      setIsBonusModalOpen(false);
    } catch (error) {
      console.error('Failed to add employee bonus:', error);
      toast({
        title: 'Error',
        description: 'Failed to add employee bonus',
        variant: 'destructive'
      });
    } finally {
      setIsAddingBonus(false);
    }
  };

  const handleDeleteBonus = async (bonusId: string) => {
    if (!confirm('Are you sure you want to delete this bonus?')) return;

    try {
      await deleteBonus(bonusId);
      toast({
        title: 'Deleted',
        description: 'Bonus record has been removed',
      });
    } catch (error) {
      console.error('Failed to delete bonus:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete bonus',
        variant: 'destructive'
      });
    }
  };

  const handleAddEmployeeBonus = () => {
    console.log('Opening employee bonus modal');
    setIsBonusModalOpen(true);
  };

  const filteredEmployees = employees.filter((employee) =>
    employee.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    employee.phone.includes(searchQuery)
  );

  const activeEmployees = filteredEmployees.filter(emp => emp.active);
  const inactiveEmployees = filteredEmployees.filter(emp => !emp.active);

  const renderEmployeeCard = (employee: Employee) => (
    <Card key={employee.id} className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${employee.active ? 'bg-primary/10' : 'bg-muted/50'
              }`}>
              <Users className={`w-6 h-6 ${employee.active ? 'text-primary' : 'text-muted-foreground'}`} />
            </div>
            <div>
              <CardTitle className="text-lg">{employee.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{employee.code}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={employee.active ? 'default' : 'secondary'}>
              {employee.active ? 'Active' : 'Inactive'}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => openEditForm(employee)}
                className="h-8 w-8 p-0"
              >
                <Edit2 size={16} />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setDeletingEmployee(employee)}
                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
              >
                <Trash2 size={16} />
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{employee.designation}</span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span className="font-medium">{formatCurrency(employee.monthlySalary)}/month</span>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <span>{employee.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <span>{employee.phone}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-muted-foreground" />
            <span>Joined: {formatDate(employee.dateOfJoining)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-muted-foreground" />
            <span>{employee.department}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <MainLayout>
      <PageHeader
        title="Employee Management"
        description="Manage your staff and track their information"
      />

      {/* Search and Add */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Search employees..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button onClick={openAddForm} className="gap-2">
          <Plus size={16} />
          Add Employee
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Employees</p>
                <p className="text-xl font-bold">{employees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-xl font-bold text-green-600">{activeEmployees.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-amber-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monthly Payroll</p>
                <p className="text-xl font-bold text-amber-600">
                  {formatCurrency(activeEmployees.reduce((sum, emp) => sum + emp.monthlySalary, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Employee Lists with Tabs */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-muted-foreground">Loading employees...</div>
        </div>
      ) : filteredEmployees.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Users className="w-16 h-16 mb-4" />
          <p className="text-lg">No employees found</p>
          <p className="text-sm">
            {searchQuery ? 'Try a different search term' : 'Add your first employee to get started'}
          </p>
        </div>
      ) : (
        <Tabs defaultValue="employees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="employees" className="gap-2">
              <Users size={16} />
              Employees
            </TabsTrigger>
            <TabsTrigger value="bonus" className="gap-2">
              <DollarSign size={16} />
              Bonus Management
            </TabsTrigger>
          </TabsList>

          <TabsContent value="employees">
            <div className="space-y-6">
              {activeEmployees.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Active Employees ({activeEmployees.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {activeEmployees.map(renderEmployeeCard)}
                  </div>
                </div>
              )}

              {inactiveEmployees.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-4">Inactive Employees ({inactiveEmployees.length})</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {inactiveEmployees.map(renderEmployeeCard)}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="bonus">
            <div className="bg-card border border-green-500/20 rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-500" />
                    Employee Bonus Management
                  </h3>
                  <Button size="sm" className="gap-2" onClick={handleAddEmployeeBonus}>
                    <Plus className="w-4 h-4" />
                    Add Bonus
                  </Button>
                </div>
              </div>

              {bonuses.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Employee</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Period</th>
                        <th className="text-left p-4 text-sm font-medium text-muted-foreground">Reason</th>
                        <th className="text-right p-4 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-center p-4 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bonuses.map((bonus) => {
                        const employee = employees.find(e => e.id === bonus.customerId); // Employee bonuses reuse customerId for storage if unified
                        return (
                          <tr key={bonus.id} className="border-t border-border hover:bg-muted/30">
                            <td className="p-4">
                              <div className="font-medium">{employee?.name || 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground">{employee?.code}</div>
                            </td>
                            <td className="p-4 text-sm text-muted-foreground">
                              {new Date(bonus.bonusYear, bonus.bonusMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })}
                            </td>
                            <td className="p-4 text-sm">{bonus.reason}</td>
                            <td className="p-4 text-right font-bold text-green-600">{formatCurrency(bonus.bonusAmount)}</td>
                            <td className="p-4 text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 w-8 p-0 text-destructive"
                                onClick={() => handleDeleteBonus(bonus.id)}
                              >
                                <Trash2 size={16} />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-8">
                  <div className="flex flex-col items-center justify-center text-muted-foreground">
                    <DollarSign className="w-12 h-12 mb-4" />
                    <p className="text-lg font-medium mb-2">No bonus payments recorded yet</p>
                    <p className="text-sm">Add bonus payments for exceptional performance, festivals, or special occasions</p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      )}

      {/* Employee Form Modal */}
      <EmployeeForm
        isOpen={isFormOpen}
        onClose={closeForm}
        onSubmit={editingEmployee ? (data) => handleUpdateEmployee(editingEmployee.id, data) : handleAddEmployee}
        employee={editingEmployee}
      />

      {/* Employee Bonus Modal */}
      <EmployeeBonusModal
        isOpen={isBonusModalOpen}
        onClose={() => setIsBonusModalOpen(false)}
        onSubmit={handleEmployeeBonusSubmit}
        employees={employees}
        isLoading={isAddingBonus}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingEmployee} onOpenChange={() => setDeletingEmployee(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Employee</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {deletingEmployee?.name}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteEmployee} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
