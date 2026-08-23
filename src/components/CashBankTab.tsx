import React, { useState } from 'react';
import { 
  Landmark, 
  Wallet, 
  Plus, 
  Search, 
  ArrowRightLeft, 
  CheckCircle2, 
  Printer, 
  FileText,
  Eye
} from 'lucide-react';
import { CashBankTransaction, SystemSettings } from '../types';
import { RowActionsMenu } from './RowActionsMenu';

interface CashBankTabProps {
  transactions: CashBankTransaction[];
  settings: SystemSettings;
  userRole: string;
  onAddTransaction: (txn: CashBankTransaction) => void;
  onNavigateToRecon: () => void;
}

export const CashBankTab: React.FC<CashBankTabProps> = ({
  transactions,
  settings,
  userRole,
  onAddTransaction,
  onNavigateToRecon,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [accountFilter, setAccountFilter] = useState<'All' | 'Cash in Hand' | 'Bank Account'>('All');

  // Form State
  const [acc, setAcc] = useState<'Cash in Hand' | 'Bank Account'>('Bank Account');
  const [type, setType] = useState<'Deposit / In' | 'Withdraw / Out'>('Deposit / In');
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');

  const cashBalance = transactions.filter(t => t.account === 'Cash in Hand').reduce((s, t) => t.type === 'Deposit / In' ? s + t.amount : s - t.amount, 0);
  const bankBalance = transactions.filter(t => t.account === 'Bank Account').reduce((s, t) => t.type === 'Deposit / In' ? s + t.amount : s - t.amount, 0);

  const handleSaveTxn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc || !amount) return;

    const newTxn: CashBankTransaction = {
      id: 'cb-' + Math.random().toString(36).substr(2, 9),
      ref: 'CB-' + Math.floor(1000 + Math.random() * 9000),
      date: new Date().toISOString().split('T')[0],
      account: acc,
      type,
      desc,
      amount: parseFloat(amount) || 0,
      branchId: 'b-hq',
      reconciled: false,
    };

    onAddTransaction(newTxn);
    setShowAddModal(false);
    setDesc('');
    setAmount('');
  };

  const filteredTxns = transactions.filter(t => accountFilter === 'All' || t.account === accountFilter);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-cyan-600" />
            <span>Cash &amp; Bank Treasury General Ledger</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time cash-in-hand drawer, corporate bank clearing accounts, and transaction audit entries.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onNavigateToRecon}
            className="px-3.5 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Bank Reconciliation</span>
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Cash/Bank Txn</span>
          </button>
        </div>
      </div>

      {/* Account Balances */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total Bank Ledger Balance</div>
          <div className="text-2xl font-black text-cyan-600 mt-1">
            {settings.currency} {bankBalance.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Meezan / HBL Corporate Accounts</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total Cash in Hand (Drawers)</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {settings.currency} {cashBalance.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Physical Cash Across Branches</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Net Liquid Treasury</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {settings.currency} {(bankBalance + cashBalance).toLocaleString()}
          </div>
          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">✓ Reconciled Solvency</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-2 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        {(['All', 'Cash in Hand', 'Bank Account'] as const).map(accTab => (
          <button
            key={accTab}
            onClick={() => setAccountFilter(accTab)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
              accountFilter === accTab ? 'bg-cyan-600 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            {accTab} Ledger
          </button>
        ))}
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
            <tr>
              <th className="p-3">Voucher Ref #</th>
              <th className="p-3">Date</th>
              <th className="p-3">Account</th>
              <th className="p-3">Transaction Description</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">Amount ({settings.currency})</th>
              <th className="p-3 text-center">Bank Recon</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredTxns.map(t => (
              <tr key={t.id} className="hover:bg-slate-50 dark:bg-slate-800">
                <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{t.ref}</td>
                <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{t.date}</td>
                <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{t.account}</td>
                <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{t.desc}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    t.type === 'Deposit / In' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {t.type}
                  </span>
                </td>
                <td className={`p-3 text-right font-black ${
                  t.type === 'Deposit / In' ? 'text-emerald-600' : 'text-rose-600'
                }`}>
                  {t.type === 'Deposit / In' ? '+' : '-'}{settings.currency} {t.amount.toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    t.reconciled ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                  }`}>
                    {t.reconciled ? '✓ Matched' : 'Pending'}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <RowActionsMenu
                    actions={[
                      {
                        label: 'View Voucher',
                        icon: <Eye className="w-3.5 h-3.5" />,
                        onClick: () => {
                          alert(`Voucher #: ${t.ref}\nAccount: ${t.account}\nDescription: ${t.desc}\nAmount: ${settings.currency} ${t.amount.toFixed(2)}\nReconciled: ${t.reconciled ? 'Yes' : 'No'}`);
                        },
                      },
                      {
                        label: 'Go to Reconciliation Portal',
                        icon: <ArrowRightLeft className="w-3.5 h-3.5 text-cyan-600" />,
                        onClick: () => onNavigateToRecon(),
                        variant: 'primary',
                      },
                      {
                        label: 'Print Receipt Slip',
                        icon: <Printer className="w-3.5 h-3.5" />,
                        onClick: () => window.print(),
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Record Txn Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Record Treasury Transaction</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSaveTxn} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Account</label>
                  <select
                    value={acc}
                    onChange={(e) => setAcc(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 font-bold"
                  >
                    <option value="Bank Account">Bank Account</option>
                    <option value="Cash in Hand">Cash in Hand</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Direction</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 font-bold"
                  >
                    <option value="Deposit / In">Deposit / Cash In</option>
                    <option value="Withdraw / Out">Withdraw / Cash Out</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Narration / Description *</label>
                <input
                  type="text"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  required
                  placeholder="e.g. Daily cash collection deposit into Meezan Bank"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

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
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-xs shadow"
                >
                  Record Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
