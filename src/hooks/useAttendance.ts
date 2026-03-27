import { useState, useEffect, useCallback } from 'react';
import { Attendance, AttendanceRequest, PayrollSummary } from '@/types';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api';

export function useAttendance() {
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAttendance = useCallback(async (params?: {
    date?: string; // for daily attendance
    employeeId?: string;
    fromDate?: string;
    toDate?: string;
  }) => {
    setIsLoading(true);
    setError(null);
    try {
      let data: Attendance[] = [];

      // Use specific endpoints based on parameters
      if (params?.date && !params?.employeeId) {
        // Get all employees' attendance for a specific date
        data = await apiGet<Attendance[]>('/api/attendance/daily', { date: params.date });
      } else if (params?.employeeId && params?.fromDate && params?.toDate) {
        // Get attendance records for an employee in a date range
        data = await apiGet<Attendance[]>(`/api/attendance/employee/${params.employeeId}`, {
          from: params.fromDate,
          to: params.toDate
        });
      } else {
        // No valid parameters, set empty array
        data = [];
      }

      setAttendance(data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load attendance');
      setAttendance([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttendance();
  }, [fetchAttendance]);

  const markAttendance = async (
    attendanceData: AttendanceRequest
  ): Promise<Attendance> => {
    const newAttendance = await apiPost<Attendance>('/api/attendance/mark', attendanceData);
    setAttendance((prev) => {
      // Remove existing attendance for same employee+date if exists (upsert behavior)
      const filtered = prev.filter(att =>
        !(att.employeeId === attendanceData.employeeId && att.attendanceDate === attendanceData.attendanceDate)
      );
      return [newAttendance, ...filtered];
    });
    return newAttendance;
  };

  const deleteAttendance = async (id: string): Promise<void> => {
    await apiDelete(`/api/attendance/${id}`);
    setAttendance((prev) => prev.filter((att) => att.id !== id));
  };

  const getAttendanceByEmployee = (employeeId: string): Attendance[] => {
    return attendance
      .filter((att) => att.employeeId === employeeId)
      .sort((a, b) => new Date(b.attendanceDate).getTime() - new Date(a.attendanceDate).getTime());
  };

  const getAttendanceByDate = (date: string): Attendance[] => {
    return attendance.filter((att) => att.attendanceDate === date);
  };

  const getPayrollSummary = async (employeeId: string, year: number, month: number): Promise<PayrollSummary> => {
    return await apiGet<PayrollSummary>(`/api/attendance/payroll/${employeeId}`, { year, month });
  };

  // New specific API functions
  const getDailyAttendance = async (date: string): Promise<Attendance[]> => {
    return await apiGet<Attendance[]>('/api/attendance/daily', { date });
  };

  const getEmployeeAttendanceRange = async (employeeId: string, fromDate: string, toDate: string): Promise<Attendance[]> => {
    return await apiGet<Attendance[]>(`/api/attendance/employee/${employeeId}`, { fromDate, toDate });
  };

  return {
    attendance,
    isLoading,
    error,
    fetchAttendance,
    markAttendance,
    deleteAttendance,
    getAttendanceByEmployee,
    getAttendanceByDate,
    getPayrollSummary,
    getDailyAttendance,
    getEmployeeAttendanceRange,
  };
}
