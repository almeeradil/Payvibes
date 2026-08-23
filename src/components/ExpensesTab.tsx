import React, { useState } from 'react';
import { 
  DollarSign, 
  Plus, 
  Search, 
  CheckCircle2, 
  FileText, 
  Building, 
  Calendar,
  Layers,
  Printer,
  Eye,
  Trash2
} from 'lucide-react';
import { ExpenseVoucher, SystemSettings } from '../types';
import { RowActionsMenu } from './RowActionsMenu';

interface ExpensesTabProps {
  expenses: ExpenseVoucher[];
  settings: SystemSettings;
  userRole: string;
  onAddExpense: (expense: ExpenseVoucher) => void;
  onDeleteExpense?: (id: string) => void;
}

export const ExpensesTab: React.FC<ExpensesTabProps> = ({
  expenses,
  settings,
  userRole,
  onAddExpense,
  onDeleteExpense,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form
  const [cat, setCat] = useState('Rent & Utilities');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [payMode, setPayMode] = useState('Bank Transfer');
  const [taxDeduct, setTaxDeduct] = useState(true);

  const totalExpense = expenses.reduce((s, e) => s + e.amt, 0);

  const handleSaveExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const newExp: ExpenseVoucher = {
      id: 'exp-' + Math.random().toString(36).substr(2, 9),
      cat,
      desc,
      amt: parseFloat(amount) || 0,
      date: new Date().toISOString().split('T')[0],
      branchId: 'b-hq',
      paymentMode: payMode,
      taxDeductible: taxDeduct,
    };

    onAddExpense(newExp);
    setShowAddModal(false);
    setDesc('');
    setAmount('');
  };

  const filteredExpenses = expenses.filter(e => 
    e.desc.toLowerCase().includes(searchTerm.toLowerCase()) ||
    e.cat.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-rose-600" />
            <span>Expense Vouchers &amp; Operational Costs</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Log store operating overheads, electricity bills, pharmacy packaging, and auto-synced employee payroll vouchers.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Expense Voucher</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total Operating Expenses</div>
          <div className="text-2xl font-black text-rose-600 mt-1">
            {settings.currency} {totalExpense.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{expenses.length} Logged Vouchers</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Tax Deductible Expenses</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {settings.currency} {expenses.filter(e => e.taxDeductible).reduce((s, e) => s + e.amt, 0).toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Eligible for Corporate Tax Relief</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search expenses by category or note..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* Expenses Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Category</th>
              <th className="p-3">Expense Description</th>
              <th className="p-3">Payment Channel</th>
              <th className="p-3 text-center">Tax Relieved</th>
              <th className="p-3 text-right">Amount ({settings.currency})</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredExpenses.map(exp => (
              <tr key={exp.id} className="hover:bg-slate-50 dark:bg-slate-800">
                <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{exp.date}</td>
                <td className="p-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded text-[11px]">
                    {exp.cat}
                  </span>
                </td>
                <td className="p-3 font-medium text-slate-900 dark:text-slate-100">{exp.desc}</td>
                <td className="p-3 text-slate-600 dark:text-slate-400">{exp.paymentMode || 'Bank Transfer'}</td>
                <td className="p-3 text-center">
                  {exp.taxDeductible ? (
                    <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded">
                      ✓ Tax Deductible
                    </span>
                  ) : (
                    <span className="text-slate-400 text-[10px]">Non-deductible</span>
                  )}
                </td>
                <td className="p-3 text-right font-black text-rose-600">
                  {settings.currency} {exp.amt.toFixed(2)}
                </td>
                <td className="p-3 text-right">
                  <RowActionsMenu
                    actions={[
                      {
                        label: 'View Expense Details',
                        icon: <Eye className="w-3.5 h-3.5" />,
                        onClick: () => {
                          alert(`Category: ${exp.cat}\nDescription: ${exp.desc}\nAmount: ${settings.currency} ${exp.amt.toFixed(2)}\nPayment: ${exp.paymentMode || 'Bank Transfer'}\nTax Status: ${exp.taxDeductible ? 'Tax Deductible' : 'Non-deductible'}`);
                        },
                      },
                      {
                        label: 'Print Voucher',
                        icon: <Printer className="w-3.5 h-3.5" />,
                        onClick: () => window.print(),
                      },
                      ...(onDeleteExpense ? [{
                        label: 'Delete Expense',
                        icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
                        onClick: () => onDeleteExpense(exp.id),
                        variant: 'danger' as const,
                      }] : []),
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Add Expense Voucher</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSaveExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Expense Category *</label>
                <select
                  value={cat}
                  onChange={(e) => setCat(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 font-bold"
                >
                  <option value="Staff Salaries & Wages">Staff Salaries &amp; Wages</option>
                  <option value="Rent & Utilities">Store Rent &amp; Electricity</option>
                  <option value="Logistics & Delivery">Logistics &amp; Courier Delivery</option>
                  <option value="Marketing & Loyalty">Marketing &amp; Loyalty Rewards</option>
                  <option value="IT & Software">IT Cloud &amp; Software Licenses</option>
                  <option value="Office & Packaging">Packaging &amp; Supplies</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Description / Purpose *</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                  placeholder="e.g. Branch Monthly Electricity Bill - LESCO"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Amount ({settings.currency}) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Payment Channel</label>
                  <select
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                  >
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Petty Cash">Petty Cash</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={taxDeduct}
                    onChange={(e) => setTaxDeduct(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="font-semibold text-slate-700 dark:text-slate-300">Tax Deductible Operational Overhead</span>
                </label>
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-xs shadow"
                >
                  Record Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
