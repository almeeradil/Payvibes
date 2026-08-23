import React, { useState } from 'react';
import { 
  UserCheck, 
  Clock, 
  DollarSign, 
  Printer, 
  CheckCircle2, 
  Camera, 
  Fingerprint, 
  Plus, 
  Calendar, 
  FileText,
  Building,
  ArrowRightLeft,
  Eye,
  Copy
} from 'lucide-react';
import { Employee, AttendancePunch, PayrollRun, SystemSettings } from '../types';
import { printSalarySlip } from '../services/printSlip';
import { RowActionsMenu } from './RowActionsMenu';

interface HrPayrollTabProps {
  employees: Employee[];
  attendance: AttendancePunch[];
  payrolls: PayrollRun[];
  settings: SystemSettings;
  userRole: string;
  onAddAttendance: (punch: AttendancePunch) => void;
  onGeneratePayroll: (payroll: PayrollRun) => void;
  onSyncPayrollToExpense: (payrollId: string) => void;
  onAddEmployee: (employee: Employee) => void;
}

export const HrPayrollTab: React.FC<HrPayrollTabProps> = ({
  employees,
  attendance,
  payrolls,
  settings,
  userRole,
  onAddAttendance,
  onGeneratePayroll,
  onSyncPayrollToExpense,
  onAddEmployee,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'payroll' | 'attendance' | 'staff'>('payroll');
  const [showPunchModal, setShowPunchModal] = useState(false);
  const [showNewStaffModal, setShowNewStaffModal] = useState(false);
  const [showGeneratePayrollModal, setShowGeneratePayrollModal] = useState(false);

  // Punch modal state
  const [punchEmpId, setPunchEmpId] = useState(employees[0]?.id || '');
  const [punchMethod, setPunchMethod] = useState<'Biometric Scanner' | 'Mobile App Selfie' | 'Manual Punch'>('Biometric Scanner');
  const [punchStatus, setPunchStatus] = useState<'Present' | 'Late' | 'Half Day' | 'Absent'>('Present');
  const [punchHours, setPunchHours] = useState('8.0');
  const [punchOvertime, setPunchOvertime] = useState('0.0');

  // New Staff modal state
  const [empName, setEmpName] = useState('');
  const [empDesignation, setEmpDesignation] = useState('');
  const [empDepartment, setEmpDepartment] = useState('Pharmacy');
  const [empSalary, setEmpSalary] = useState('50000');
  const [empPhone, setEmpPhone] = useState('');
  const [empCnic, setEmpCnic] = useState('');

  // Payroll generation state
  const [payMonth, setPayMonth] = useState('August');
  const [payYear, setPayYear] = useState(2026);
  const [payTargetEmpId, setPayTargetEmpId] = useState(employees[0]?.id || '');
  const [payAllowances, setPayAllowances] = useState('2000');
  const [payDeductions, setPayDeductions] = useState('1000');

  const totalMonthlyPayroll = payrolls.reduce((s, p) => s + (p.netSalary || 0), 0);
  const totalHoursLogged = attendance.reduce((s, a) => s + (a.hoursWorked || 0), 0);

  const handleSavePunch = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === punchEmpId) || employees[0];
    const newPunch: AttendancePunch = {
      id: 'att-' + Math.random().toString(36).substr(2, 9),
      employeeId: emp.id,
      employeeName: emp.name,
      date: new Date().toISOString().split('T')[0],
      punchInTime: new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
      punchOutTime: '05:00 PM',
      hoursWorked: parseFloat(punchHours) || 8,
      overtimeHours: parseFloat(punchOvertime) || 0,
      method: punchMethod,
      status: punchStatus,
      notes: `${punchMethod} verified attendance check-in`,
    };

    onAddAttendance(newPunch);
    setShowPunchModal(false);
  };

  const handleSaveStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (!empName) return;
    const base = parseFloat(empSalary) || 40000;
    const newEmp: Employee = {
      id: 'emp-' + Math.random().toString(36).substr(2, 7),
      employeeCode: 'EMP-' + Math.floor(100 + Math.random() * 900),
      name: empName,
      designation: empDesignation || 'Operations Staff',
      department: empDepartment,
      phone: empPhone,
      email: `${empName.toLowerCase().replace(/\s+/g, '')}@payvibes.com`,
      cnic: empCnic || '35201-0000000-0',
      joinDate: new Date().toISOString().split('T')[0],
      branchId: 'b-lhr',
      baseSalary: base,
      hourlyRate: Math.round(base / 200),
      shiftHoursPerDay: 8,
      status: 'Active',
      biometricId: 'BIO-' + Math.floor(100 + Math.random() * 900),
    };

    onAddEmployee(newEmp);
    setShowNewStaffModal(false);
    setEmpName('');
    setEmpDesignation('');
  };

  const handleGeneratePayrollSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === payTargetEmpId) || employees[0];
    
    // Auto-calculate from attendance records
    const empAtt = attendance.filter(a => a.employeeId === emp.id);
    const totalDaysPresent = empAtt.filter(a => a.status === 'Present' || a.status === 'Late').length || 24;
    const totalHoursWorked = empAtt.reduce((sum, a) => sum + (a.hoursWorked || 8), 0) || 192;
    const totalOvertimeHrs = empAtt.reduce((sum, a) => sum + (a.overtimeHours || 0), 0);
    const overtimePay = Math.round(totalOvertimeHrs * emp.hourlyRate);

    const allow = parseFloat(payAllowances) || 0;
    const deduct = parseFloat(payDeductions) || 0;
    const netSalary = emp.baseSalary + overtimePay + allow - deduct;

    const newPayroll: PayrollRun = {
      id: 'pay-' + Math.random().toString(36).substr(2, 9),
      month: payMonth,
      year: payYear,
      dateGenerated: new Date().toISOString().split('T')[0],
      employeeId: emp.id,
      employeeName: emp.name,
      branchId: emp.branchId,
      baseSalary: emp.baseSalary,
      totalDaysPresent,
      totalHoursWorked,
      overtimePay,
      allowances: allow,
      deductions: deduct,
      netSalary,
      status: 'Approved',
      syncedToExpense: false,
    };

    onGeneratePayroll(newPayroll);
    setShowGeneratePayrollModal(false);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total Active Staff</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {employees.length} Employees
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Biometric &amp; App Enrolled</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Hours Logged This Month</div>
          <div className="text-2xl font-black text-indigo-600 mt-1">
            {totalHoursLogged.toFixed(1)} hrs
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Across all store branches</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Monthly Payroll Disbursed</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {settings.currency} {totalMonthlyPayroll.toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-700 font-bold mt-0.5">Auto-Synced to Expenses</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between gap-2">
          <button
            onClick={() => setShowPunchModal(true)}
            className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <Fingerprint className="w-4 h-4" />
            <span>Punch In/Out</span>
          </button>
          <button
            onClick={() => setShowGeneratePayrollModal(true)}
            className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow transition flex items-center justify-center gap-1 cursor-pointer"
          >
            <DollarSign className="w-4 h-4" />
            <span>Calc Salary</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('payroll')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === 'payroll' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          <span>Payroll Slips &amp; Expense Sync ({payrolls.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('attendance')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === 'attendance' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Biometric &amp; App Attendance Logs ({attendance.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('staff')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === 'staff' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>Staff Directory ({employees.length})</span>
        </button>
      </div>

      {/* Payroll Table */}
      {activeSubTab === 'payroll' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-indigo-600" />
                <span>Automated Payroll Run &amp; Direct Expense Voucher Synchronization</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Salaries are calculated from working hours and can be synchronized into Expense Vouchers with 1-click.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                <tr>
                  <th className="p-3">Period</th>
                  <th className="p-3">Employee Name</th>
                  <th className="p-3">Days / Hours</th>
                  <th className="p-3 text-right">Base Salary</th>
                  <th className="p-3 text-right">Overtime Pay</th>
                  <th className="p-3 text-right">Allowances</th>
                  <th className="p-3 text-right">Net Payable ({settings.currency})</th>
                  <th className="p-3 text-center">Expense Sync</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payrolls.map(p => {
                  const emp = employees.find(e => e.id === p.employeeId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 dark:bg-slate-800">
                      <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{p.month} {p.year}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{p.employeeName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{p.totalDaysPresent} Days ({p.totalHoursWorked} hrs)</td>
                      <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                        {settings.currency} {p.baseSalary.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-bold text-cyan-600">
                        +{settings.currency} {p.overtimePay.toFixed(2)}
                      </td>
                      <td className="p-3 text-right text-slate-600 dark:text-slate-400">
                        +{settings.currency} {p.allowances.toFixed(2)}
                      </td>
                      <td className="p-3 text-right font-black text-emerald-600">
                        {settings.currency} {p.netSalary.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        {p.syncedToExpense ? (
                          <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                            ✓ Synced in Expenses
                          </span>
                        ) : (
                          <button
                            onClick={() => onSyncPayrollToExpense(p.id)}
                            className="px-2.5 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded font-bold text-[10px] transition"
                          >
                            Sync to Expense
                          </button>
                        )}
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end items-center gap-1">
                          <button
                            type="button"
                            onClick={() => printSalarySlip(p, emp, settings)}
                            className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 rounded font-bold text-[10px] inline-flex items-center gap-1 transition cursor-pointer"
                            title="Print Payslip"
                          >
                            <Printer className="w-3 h-3" />
                            <span>Payslip</span>
                          </button>
                          <RowActionsMenu
                            actions={[
                              {
                                label: 'Print Salary Slip',
                                icon: <Printer className="w-3.5 h-3.5" />,
                                onClick: () => printSalarySlip(p, emp, settings),
                              },
                              {
                                label: 'Sync to Expense Voucher',
                                icon: <DollarSign className="w-3.5 h-3.5 text-indigo-600" />,
                                onClick: () => onSyncPayrollToExpense(p.id),
                                disabled: p.syncedToExpense,
                                variant: 'primary',
                              },
                              {
                                label: 'View Breakdown',
                                icon: <Eye className="w-3.5 h-3.5" />,
                                onClick: () => {
                                  alert(`Employee: ${p.employeeName}\nMonth: ${p.month} ${p.year}\nBase: ${settings.currency} ${p.baseSalary.toFixed(2)}\nOvertime: ${settings.currency} ${p.overtimePay.toFixed(2)}\nAllowances: ${settings.currency} ${p.allowances.toFixed(2)}\nNet Salary: ${settings.currency} ${p.netSalary.toFixed(2)}`);
                                },
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Attendance Table */}
      {activeSubTab === 'attendance' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Employee Name</th>
                <th className="p-3">Check In</th>
                <th className="p-3">Check Out</th>
                <th className="p-3 text-right">Hours Worked</th>
                <th className="p-3 text-right">Overtime</th>
                <th className="p-3">Method</th>
                <th className="p-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {attendance.map(a => (
                <tr key={a.id} className="hover:bg-slate-50 dark:bg-slate-800">
                  <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{a.date}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{a.employeeName}</td>
                  <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{a.punchInTime}</td>
                  <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{a.punchOutTime || '-'}</td>
                  <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">{a.hoursWorked} hrs</td>
                  <td className="p-3 text-right font-bold text-cyan-600">+{a.overtimeHours} hrs</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 flex items-center gap-1.5 mt-1">
                    {a.method === 'Biometric Scanner' ? <Fingerprint className="w-3.5 h-3.5 text-indigo-600" /> : <Camera className="w-3.5 h-3.5 text-cyan-600" />}
                    <span>{a.method}</span>
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      a.status === 'Present' ? 'bg-emerald-100 text-emerald-800' :
                      a.status === 'Late' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {a.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Staff Directory Table */}
      {activeSubTab === 'staff' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase">Staff &amp; Human Resource Profiles</h4>
            <button
              onClick={() => setShowNewStaffModal(true)}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Employee</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {employees.map(emp => (
              <div key={emp.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-indigo-300 transition">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {emp.employeeCode}
                  </span>
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                    {emp.status}
                  </span>
                </div>
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{emp.name}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">{emp.designation}</p>
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Department:</span>
                    <span className="font-bold text-slate-700 dark:text-slate-300">{emp.department}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Base Salary:</span>
                    <span className="font-black text-emerald-600">{settings.currency} {emp.baseSalary.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 font-semibold">Contact:</span>
                    <span className="text-slate-600 dark:text-slate-400 font-semibold">{emp.phone}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Punch Attendance Modal */}
      {showPunchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Fingerprint className="w-4 h-4 text-indigo-600" />
                <span>Staff Biometric &amp; App Attendance Terminal</span>
              </h3>
              <button onClick={() => setShowPunchModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSavePunch} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Select Employee *</label>
                <select
                  value={punchEmpId}
                  onChange={(e) => setPunchEmpId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} ({e.designation})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Punch Mode</label>
                  <select
                    value={punchMethod}
                    onChange={(e) => setPunchMethod(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                  >
                    <option value="Biometric Scanner">Biometric Scanner</option>
                    <option value="Mobile App Selfie">Mobile App Selfie</option>
                    <option value="Manual Punch">Manual Punch</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Attendance Status</label>
                  <select
                    value={punchStatus}
                    onChange={(e) => setPunchStatus(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                  >
                    <option value="Present">Present</option>
                    <option value="Late">Late Check-in</option>
                    <option value="Half Day">Half Day</option>
                    <option value="Absent">Absent</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Hours Worked</label>
                  <input
                    type="number"
                    step="0.25"
                    value={punchHours}
                    onChange={(e) => setPunchHours(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Overtime Hours</label>
                  <input
                    type="number"
                    step="0.25"
                    value={punchOvertime}
                    onChange={(e) => setPunchOvertime(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowPunchModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow"
                >
                  Confirm Punch Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Generate Payroll Modal */}
      {showGeneratePayrollModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Calculate &amp; Disburse Salary</h3>
              <button onClick={() => setShowGeneratePayrollModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
            </div>
            <form onSubmit={handleGeneratePayrollSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Select Employee *</label>
                <select
                  value={payTargetEmpId}
                  onChange={(e) => setPayTargetEmpId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.name} - Base: {settings.currency} {e.baseSalary}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Month</label>
                  <select
                    value={payMonth}
                    onChange={(e) => setPayMonth(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                  >
                    {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Year</label>
                  <select
                    value={payYear}
                    onChange={(e) => setPayYear(parseInt(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                  >
                    <option value={2025}>2025</option>
                    <option value={2026}>2026</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Special Allowances ({settings.currency})</label>
                  <input
                    type="number"
                    value={payAllowances}
                    onChange={(e) => setPayAllowances(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Tax / Deductions ({settings.currency})</label>
                  <input
                    type="number"
                    value={payDeductions}
                    onChange={(e) => setPayDeductions(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowGeneratePayrollModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow"
                >
                  Generate Payroll Slip
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {showNewStaffModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Add New Staff Employee</h3>
              <button onClick={() => setShowNewStaffModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSaveStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Full Name *</label>
                <input
                  type="text"
                  value={empName}
                  onChange={(e) => setEmpName(e.target.value)}
                  required
                  placeholder="e.g. Asim Riaz"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Designation</label>
                  <input
                    type="text"
                    value={empDesignation}
                    onChange={(e) => setEmpDesignation(e.target.value)}
                    placeholder="Pharmacist"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Department</label>
                  <input
                    type="text"
                    value={empDepartment}
                    onChange={(e) => setEmpDepartment(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Monthly Base Salary ({settings.currency})</label>
                  <input
                    type="number"
                    value={empSalary}
                    onChange={(e) => setEmpSalary(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={empPhone}
                    onChange={(e) => setEmpPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewStaffModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
