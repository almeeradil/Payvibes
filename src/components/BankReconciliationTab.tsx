import React, { useState } from 'react';
import { 
  Landmark, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  FileSpreadsheet, 
  Plus, 
  ArrowRightLeft,
  Sparkles,
  Eye
} from 'lucide-react';
import { BankStatementRow, CashBankTransaction, SystemSettings } from '../types';
import { RowActionsMenu } from './RowActionsMenu';

interface BankReconciliationTabProps {
  bankStatements: BankStatementRow[];
  cashbank: CashBankTransaction[];
  settings: SystemSettings;
  onUpdateStatements: (rows: BankStatementRow[]) => void;
  onAddTransaction: (txn: CashBankTransaction) => void;
}

export const BankReconciliationTab: React.FC<BankReconciliationTabProps> = ({
  bankStatements,
  cashbank,
  settings,
  onUpdateStatements,
  onAddTransaction,
}) => {
  const [activeFilter, setActiveFilter] = useState<'All' | 'Matched' | 'Unmatched'>('All');
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconNotice, setReconNotice] = useState<string | null>(null);

  // Bank transactions vs software book transactions
  const bankCredits = bankStatements.filter(s => s.type === 'Credit').reduce((sum, s) => sum + s.amount, 0);
  const bankDebits = bankStatements.filter(s => s.type === 'Debit').reduce((sum, s) => sum + s.amount, 0);
  const bankClosingBalance = bankCredits - bankDebits;

  const bookBankTxns = cashbank.filter(c => c.account === 'Bank Account');
  const bookCredits = bookBankTxns.filter(c => c.type === 'Deposit / In').reduce((sum, c) => sum + c.amount, 0);
  const bookDebits = bookBankTxns.filter(c => c.type === 'Withdraw / Out').reduce((sum, c) => sum + c.amount, 0);
  const bookClosingBalance = bookCredits - bookDebits;

  const reconciliationDifference = Math.abs(bankClosingBalance - bookClosingBalance);

  const handleAutoReconcile = () => {
    setIsReconciling(true);
    setTimeout(() => {
      let matchedCount = 0;
      const updated = bankStatements.map(row => {
        if (row.matchStatus === 'Matched') return row;
        
        // Match rule: Check if amount matches any software bank transaction
        const matchedTxn = bookBankTxns.find(b => 
          Math.abs(b.amount - row.amount) < 0.5 && 
          ((row.type === 'Credit' && b.type === 'Deposit / In') || (row.type === 'Debit' && b.type === 'Withdraw / Out'))
        );

        if (matchedTxn) {
          matchedCount++;
          return {
            ...row,
            matchStatus: 'Matched' as const,
            matchedTxnId: matchedTxn.id,
            notes: `Auto-reconciled with entry ${matchedTxn.ref} (${matchedTxn.desc})`,
          };
        }
        return row;
      });

      onUpdateStatements(updated);
      setIsReconciling(false);
      setReconNotice(`Automated Reconciliation Complete! Matched ${matchedCount} bank transaction(s) against General Ledger.`);
      setTimeout(() => setReconNotice(null), 4000);
    }, 900);
  };

  const handleCreateAdjustmentEntry = (row: BankStatementRow) => {
    const newTxn: CashBankTransaction = {
      id: 'cb-' + Math.random().toString(36).substr(2, 9),
      ref: 'CB-RECON-' + Math.floor(100 + Math.random() * 900),
      date: row.date,
      account: 'Bank Account',
      type: row.type === 'Credit' ? 'Deposit / In' : 'Withdraw / Out',
      desc: `Bank Reconciliation Adjustment: ${row.description}`,
      amount: row.amount,
      branchId: 'b-hq',
      reconciled: true,
    };

    onAddTransaction(newTxn);

    // Mark as matched
    const updated = bankStatements.map(s => s.id === row.id ? { ...s, matchStatus: 'Matched' as const, matchedTxnId: newTxn.id, notes: 'Adjusted into software bank ledger' } : s);
    onUpdateStatements(updated);
  };

  const filteredRows = bankStatements.filter(s => {
    if (activeFilter === 'Matched') return s.matchStatus === 'Matched';
    if (activeFilter === 'Unmatched') return s.matchStatus === 'Unmatched';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Bank Statement Balance</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {settings.currency} {bankClosingBalance.toLocaleString()}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">As per verified e-statement</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Software Book Balance</div>
          <div className="text-2xl font-black text-cyan-600 mt-1">
            {settings.currency} {bookClosingBalance.toLocaleString()}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-0.5">General Ledger Bank A/C</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Reconciliation Difference</div>
          <div className={`text-2xl font-black mt-1 ${reconciliationDifference < 1 ? 'text-emerald-600' : 'text-amber-600'}`}>
            {settings.currency} {reconciliationDifference.toFixed(2)}
          </div>
          <div className="text-[10px] font-bold mt-0.5">
            {reconciliationDifference < 1 ? '✅ Fully Balanced' : '⚠️ Discrepancy Pending'}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div className="text-[10px] font-bold uppercase text-slate-400">Matching Engine</div>
          <button
            type="button"
            disabled={isReconciling}
            onClick={handleAutoReconcile}
            className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            {isReconciling ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Auto-Matching...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>1-Click Auto Reconcile</span>
              </>
            )}
          </button>
        </div>
      </div>

      {reconNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{reconNotice}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex space-x-2">
          {(['All', 'Matched', 'Unmatched'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveFilter(tab)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeFilter === tab ? 'bg-slate-900 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
              }`}
            >
              {tab} Entries
            </button>
          ))}
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-semibold">
          Showing {filteredRows.length} bank transaction rows
        </div>
      </div>

      {/* Bank Statement Reconciliation Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
            <tr>
              <th className="p-3">Date</th>
              <th className="p-3">Bank Narration / Description</th>
              <th className="p-3">Ref / UTR #</th>
              <th className="p-3">Type</th>
              <th className="p-3 text-right">Amount ({settings.currency})</th>
              <th className="p-3 text-center">Match Status</th>
              <th className="p-3">Reconciliation Audit Note</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredRows.map(row => (
              <tr key={row.id} className="hover:bg-slate-50 dark:bg-slate-800">
                <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{row.date}</td>
                <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{row.description}</td>
                <td className="p-3 font-mono font-bold text-slate-600 dark:text-slate-400">{row.refNo}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    row.type === 'Credit' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {row.type}
                  </span>
                </td>
                <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                  {settings.currency} {row.amount.toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded-full font-bold text-[10px] ${
                    row.matchStatus === 'Matched' 
                      ? 'bg-emerald-100 text-emerald-800' 
                      : 'bg-amber-100 text-amber-800'
                  }`}>
                    {row.matchStatus === 'Matched' ? '✓ Matched' : '● Unmatched'}
                  </span>
                </td>
                <td className="p-3 text-[11px] text-slate-500 dark:text-slate-400 italic">
                  {row.notes || 'Pending reconciliation'}
                </td>
                <td className="p-3 text-right">
                  <RowActionsMenu
                    actions={[
                      {
                        label: 'Sync into Ledger',
                        icon: <Plus className="w-3.5 h-3.5 text-cyan-600" />,
                        onClick: () => handleCreateAdjustmentEntry(row),
                        disabled: row.matchStatus === 'Matched',
                        variant: 'primary',
                      },
                      {
                        label: 'View Audit Details',
                        icon: <Eye className="w-3.5 h-3.5" />,
                        onClick: () => {
                          alert(`Ref/UTR: ${row.refNo}\nDescription: ${row.description}\nAmount: ${settings.currency} ${row.amount.toFixed(2)}\nStatus: ${row.matchStatus}\nNotes: ${row.notes || 'None'}`);
                        },
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
