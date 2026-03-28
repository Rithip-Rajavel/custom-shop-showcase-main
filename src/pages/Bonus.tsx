import { useState, useEffect } from 'react';
import { DollarSign, Plus, Calendar, Users, TrendingUp, Award, Edit, Trash2, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bonus } from '@/types/bonus';
import { formatCurrency, formatDate } from '@/lib/utils';
import { useBonuses } from '@/hooks/useBonuses';
import { useCustomers } from '@/hooks/useCustomers';
import { useToast } from '@/hooks/use-toast';
import { BonusForm } from '@/components/bonus/BonusForm';
import { MainLayout } from '@/components/layout/MainLayout';

export default function BonusPage() {
  const { customers } = useCustomers();
  const {
    bonuses,
    isLoading,
    createBonus,
    updateBonus,
    deleteBonus,
    getAllBonuses,
    getBonusesByCustomer,
    getBonusesByMonthAndYear,
    getTotalBonusByCustomerAndMonth,
    getTotalBonusByCustomerAndYear
  } = useBonuses();
  const { toast } = useToast();

  const [showBonusForm, setShowBonusForm] = useState(false);
  const [editingBonus, setEditingBonus] = useState<Bonus | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'all' | 'customer' | 'month'>('all');
  const [totalBonus, setTotalBonus] = useState(0);
  const [displayedBonuses, setDisplayedBonuses] = useState<Bonus[]>([]);

  // Generate months for dropdown
  const generateMonths = () => {
    const months = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ];
    return months.map((month, index) => ({
      value: index + 1,
      label: month,
    }));
  };

  // Generate years for dropdown
  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 2; i++) {
      years.push({
        value: i,
        label: i.toString(),
      });
    }
    return years;
  };

  // Load bonuses based on filters
  useEffect(() => {
    const loadBonuses = async () => {
      try {
        let bonusData: Bonus[] = [];

        if (viewMode === 'customer' && selectedCustomer) {
          bonusData = await getBonusesByCustomer(selectedCustomer);
        } else if (viewMode === 'month') {
          bonusData = await getBonusesByMonthAndYear(selectedMonth, selectedYear);
        } else {
          // For 'all' mode, load all bonuses including employee bonuses
          bonusData = await getAllBonuses();
        }

        // Apply search filter
        if (searchTerm) {
          bonusData = bonusData.filter(bonus =>
            bonus.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            bonus.reason.toLowerCase().includes(searchTerm.toLowerCase())
          );
        }

        setDisplayedBonuses(bonusData);
        // Calculate total
        const total = bonusData.reduce((sum, bonus) => sum + bonus.bonusAmount, 0);
        setTotalBonus(total);
      } catch (error) {
        toast({ title: 'Error', description: 'Failed to load bonuses', variant: 'destructive' });
      }
    };

    loadBonuses();
  }, [viewMode, selectedCustomer, selectedMonth, selectedYear, searchTerm]);

  const handleAddBonus = () => {
    setEditingBonus(null);
    setShowBonusForm(true);
  };

  const handleEditBonus = (bonus: Bonus) => {
    setEditingBonus(bonus);
    setShowBonusForm(true);
  };

  const handleDeleteBonus = async (bonusId: string) => {
    try {
      await deleteBonus(bonusId);
      toast({ title: 'Success', description: 'Bonus deleted successfully' });
      // Reload bonuses
      const bonusData = await getAllBonuses();
      setDisplayedBonuses(bonusData);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete bonus', variant: 'destructive' });
    }
  };

  const handleBonusSubmit = async (data: {
    customerId: string;
    bonusAmount: number;
    bonusMonth: number;
    bonusYear: number;
    reason: string;
  }) => {
    try {
      if (editingBonus) {
        await updateBonus(editingBonus.id, data.customerId, data.bonusAmount, data.bonusMonth, data.bonusYear, data.reason);
        toast({ title: 'Success', description: 'Bonus updated successfully' });
      } else {
        await createBonus(data.customerId, data.bonusAmount, data.bonusMonth, data.bonusYear, data.reason);
        toast({ title: 'Success', description: 'Bonus added successfully' });
      }
      // Reload bonuses
      const bonusData = await getAllBonuses();
      setDisplayedBonuses(bonusData);
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save bonus', variant: 'destructive' });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Bonus Management</h1>
              <p className="text-muted-foreground">Manage customer bonuses and commissions</p>
            </div>
          </div>
          <Button
            onClick={handleAddBonus}
            className="flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Bonus
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Bonus</p>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(totalBonus)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Total Bonuses</p>
                  <p className="text-lg font-semibold text-blue-600">
                    {displayedBonuses.length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-purple-500" />
                <div>
                  <p className="text-sm text-muted-foreground">Recipients</p>
                  <p className="text-lg font-semibold text-purple-600">
                    {new Set(displayedBonuses.map(b => b.customerId)).size}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Label>View:</Label>
                <Select value={viewMode} onValueChange={(value: 'all' | 'customer' | 'month') => setViewMode(value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="customer">By Customer</SelectItem>
                    <SelectItem value="month">By Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {viewMode === 'customer' && (
                <div className="flex items-center gap-2">
                  <Label>Customer:</Label>
                  <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="Select customer" />
                    </SelectTrigger>
                    <SelectContent>
                      {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {(viewMode === 'month' || viewMode === 'all') && (
                <div className="flex items-center gap-2">
                  <Label>Month:</Label>
                  <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateMonths().map((month) => (
                        <SelectItem key={month.value} value={month.value.toString()}>
                          {month.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Label>Year:</Label>
                  <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
                    <SelectTrigger className="w-24">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {generateYears().map((year) => (
                        <SelectItem key={year.value} value={year.value.toString()}>
                          {year.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2 flex-1">
                <Search className="w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer or reason..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="flex-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bonuses List */}
        <Card>
          <CardHeader>
            <CardTitle>All Bonuses</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Loading bonuses...</div>
            ) : displayedBonuses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No bonuses found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {displayedBonuses.map((bonus) => (
                  <Card key={bonus.id}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-medium">{bonus.customerName}</h4>
                            <Badge variant="secondary">
                              {new Date(bonus.bonusYear, bonus.bonusMonth - 1).toLocaleDateString('en-US', {
                                month: 'short',
                                year: 'numeric'
                              })}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{bonus.reason}</p>
                          <div className="flex items-center gap-4 text-sm">
                            <span className="font-semibold text-green-600">
                              {formatCurrency(bonus.bonusAmount)}
                            </span>
                            <span className="text-muted-foreground">
                              {formatDate(bonus.createdAt)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditBonus(bonus)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteBonus(bonus.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bonus Form Modal */}
        <BonusForm
          isOpen={showBonusForm}
          onClose={() => setShowBonusForm(false)}
          bonus={editingBonus}
          customers={customers}
          onSubmit={handleBonusSubmit}
        />
      </div>
    </MainLayout>
  );
}
