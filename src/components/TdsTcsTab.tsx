import React, { useState } from 'react';
import { 
  Percent, 
  Plus, 
  FileText, 
  Printer, 
  CheckCircle2, 
  AlertCircle, 
  Building, 
  Download,
  Receipt,
  Eye
} from 'lucide-react';
import { TdsEntry, TcsEntry, SystemSettings } from '../types';
import { printHtmlDirectly } from '../services/printSlip';
import { RowActionsMenu } from './RowActionsMenu';

interface TdsTcsTabProps {
  tdsEntries: TdsEntry[];
  tcsEntries: TcsEntry[];
  settings: SystemSettings;
  onAddTds: (entry: TdsEntry) => void;
  onAddTcs: (entry: TcsEntry) => void;
}

export const TdsTcsTab: React.FC<TdsTcsTabProps> = ({
  tdsEntries,
  tcsEntries,
  settings,
  onAddTds,
  onAddTcs,
}) => {
  const [activeSection, setActiveSection] = useState<'tds' | 'tcs'>('tds');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State for TDS
  const [tdsParty, setTdsParty] = useState('');
  const [tdsPanNtn, setTdsPanNtn] = useState('');
  const [tdsSection, setTdsSection] = useState('194Q (Goods Purchase >= 50L)');
  const [tdsPartyType, setTdsPartyType] = useState<'Vendor' | 'Contractor' | 'Professional' | 'Landlord'>('Vendor');
  const [tdsInvRef, setTdsInvRef] = useState('');
  const [tdsTxnAmount, setTdsTxnAmount] = useState('');
  const [tdsRate, setTdsRate] = useState('2');

  const totalTdsDeducted = tdsEntries.reduce((s, t) => s + (t.tdsAmount || 0), 0);
  const totalTcsCollected = tcsEntries.reduce((s, t) => s + (t.tcsAmount || 0), 0);

  const handleSaveTds = (e: React.FormEvent) => {
    e.preventDefault();
    const txnAmt = parseFloat(tdsTxnAmount) || 0;
    const rate = parseFloat(tdsRate) || 0;
    const tdsAmt = (txnAmt * rate) / 100;

    const newEntry: TdsEntry = {
      id: 'tds-' + Math.random().toString(36).substr(2, 9),
      section: tdsSection,
      partyName: tdsParty,
      partyPanNtn: tdsPanNtn || 'NTN-0899123-1',
      partyType: tdsPartyType,
      invoiceRef: tdsInvRef || 'PINV-' + Math.floor(100 + Math.random() * 900),
      date: new Date().toISOString().split('T')[0],
      transactionAmount: txnAmt,
      tdsRate: rate,
      tdsAmount: tdsAmt,
      status: 'Deducted',
    };

    onAddTds(newEntry);
    setShowAddModal(false);
    setTdsParty('');
    setTdsTxnAmount('');
  };

  const handlePrintCertificate = (entry: TdsEntry) => {
    const html = `<!DOCTYPE html><html><head><title>Form 16A TDS Certificate - ${entry.partyName}</title>
    <style>
      body{font-family:sans-serif;padding:24px;font-size:11px;color:#0f172a;}
      .box{max-width:700px;margin:0 auto;border:2px solid #0284c7;padding:24px;border-radius:8px;}
      .hdr{text-align:center;border-bottom:2px solid #0284c7;padding-bottom:12px;margin-bottom:16px;}
      table{width:100%;border-collapse:collapse;margin:16px 0;}
      th,td{border:1px solid #cbd5e1;padding:6px 10px;}
      th{background:#f1f5f9;text-align:left;}
    </style></head><body><div class="box">
      <div class="hdr">
        <h2 style="margin:0;color:#0284c7;">${settings.company}</h2>
        <h4 style="margin:4px 0;">FORM 16A / SECTION 153 TDS CERTIFICATE</h4>
        <p style="margin:0;color:#64748b;">Certificate of Tax Deducted at Source under Income Tax Rules</p>
      </div>
      <table>
        <tr><td><strong>Deductor (Company):</strong></td><td>${settings.company}</td><td><strong>NTN:</strong></td><td>${settings.ntn}</td></tr>
        <tr><td><strong>Deductee (Party):</strong></td><td>${entry.partyName}</td><td><strong>PAN/NTN:</strong></td><td>${entry.partyPanNtn}</td></tr>
        <tr><td><strong>Section Code:</strong></td><td>${entry.section}</td><td><strong>Nature:</strong></td><td>${entry.partyType}</td></tr>
        <tr><td><strong>Invoice Ref:</strong></td><td>${entry.invoiceRef}</td><td><strong>Date:</strong></td><td>${entry.date}</td></tr>
      </table>
      <table>
        <thead><tr><th>Gross Payment (${settings.currency})</th><th>TDS Rate</th><th>Tax Deducted (${settings.currency})</th><th>Challan Status</th></tr></thead>
        <tbody>
          <tr>
            <td>${entry.transactionAmount.toFixed(2)}</td>
            <td>${entry.tdsRate}%</td>
            <td><strong>${entry.tdsAmount.toFixed(2)}</strong></td>
            <td>${entry.challanNo || 'Challan In Progress / Deposited'}</td>
          </tr>
        </tbody>
      </table>
      <div style="margin-top:40px;display:flex;justify-content:space-between;">
        <div>Verified by Tax Officer: __________________</div>
        <div>Authorized Seal &amp; Signature: __________________</div>
      </div>
    </div></body></html>`;
    printHtmlDirectly(html);
  };

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total TDS Deducted (Payable)</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {settings.currency} {totalTdsDeducted.toLocaleString()}
          </div>
          <div className="text-[10px] font-semibold text-cyan-600 mt-1">
            {tdsEntries.length} Vendor &amp; Contractor Deductions
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total TCS Collected</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {settings.currency} {totalTcsCollected.toLocaleString()}
          </div>
          <div className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Under Section 206C(1H) / Sales Tax Surcharge
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-bold uppercase text-slate-400">Challan Deposit Due</div>
            <div className="text-lg font-black text-rose-600 mt-1">7th of Next Month</div>
            <div className="text-[10px] text-slate-400">Electronic Bank Portal Deposit</div>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record TDS</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveSection('tds')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSection === 'tds' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>TDS Register (Vendor &amp; Rent Deductions)</span>
        </button>
        <button
          onClick={() => setActiveSection('tcs')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSection === 'tcs' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <Receipt className="w-4 h-4" />
          <span>TCS Register (Sales Collections)</span>
        </button>
      </div>

      {/* TDS Table */}
      {activeSection === 'tds' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Party Name</th>
                <th className="p-3">Section Code</th>
                <th className="p-3">Party NTN/PAN</th>
                <th className="p-3">Inv Ref</th>
                <th className="p-3 text-right">Payment Amount</th>
                <th className="p-3 text-right">TDS Rate</th>
                <th className="p-3 text-right">TDS Amount ({settings.currency})</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tdsEntries.length > 0 ? (
                tdsEntries.map(t => (
                  <tr key={t.id} className="hover:bg-slate-50 dark:bg-slate-800">
                    <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{t.date}</td>
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{t.partyName}</td>
                    <td className="p-3 font-mono text-[11px] text-emerald-700 bg-emerald-50/60 px-2 py-0.5 rounded font-bold">
                      {t.section}
                    </td>
                    <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{t.partyPanNtn}</td>
                    <td className="p-3 font-mono text-slate-700 dark:text-slate-300">{t.invoiceRef}</td>
                    <td className="p-3 text-right font-black text-slate-800 dark:text-slate-200">
                      {settings.currency} {t.transactionAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-bold text-cyan-600">{t.tdsRate}%</td>
                    <td className="p-3 text-right font-black text-rose-600">
                      {settings.currency} {t.tdsAmount.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        {t.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <RowActionsMenu
                        actions={[
                          {
                            label: 'Print Form 16A Certificate',
                            icon: <Printer className="w-3.5 h-3.5 text-cyan-600" />,
                            onClick: () => handlePrintCertificate(t),
                            variant: 'primary',
                          },
                          {
                            label: 'View Deduction Summary',
                            icon: <Eye className="w-3.5 h-3.5" />,
                            onClick: () => {
                              alert(`Party: ${t.partyName}\nSection: ${t.section}\nPan/NTN: ${t.partyPanNtn}\nInv Ref: ${t.invoiceRef}\nAmount: ${settings.currency} ${t.transactionAmount.toFixed(2)}\nTDS Rate: ${t.tdsRate}%\nTDS Deducted: ${settings.currency} ${t.tdsAmount.toFixed(2)}`);
                            },
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={10} className="p-6 text-center text-slate-400">
                    No TDS deductions recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* TCS Table */}
      {activeSection === 'tcs' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Customer Name</th>
                <th className="p-3">Section Code</th>
                <th className="p-3">NTN / CNIC</th>
                <th className="p-3">Invoice Ref</th>
                <th className="p-3 text-right">Gross Sales Turnover</th>
                <th className="p-3 text-right">TCS Rate</th>
                <th className="p-3 text-right">TCS Collected ({settings.currency})</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {tcsEntries.map(tc => (
                <tr key={tc.id} className="hover:bg-slate-50 dark:bg-slate-800">
                  <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{tc.date}</td>
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{tc.customerName}</td>
                  <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{tc.section}</td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{tc.customerNtnGst}</td>
                  <td className="p-3 font-mono text-orange-600 font-bold">{tc.invoiceRef}</td>
                  <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                    {settings.currency} {tc.saleAmount.toFixed(2)}
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-600">{tc.tcsRate}%</td>
                  <td className="p-3 text-right font-black text-emerald-700">
                    {settings.currency} {tc.tcsAmount.toFixed(2)}
                  </td>
                  <td className="p-3 text-center">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      {tc.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'View TCS Details',
                          icon: <Eye className="w-3.5 h-3.5" />,
                          onClick: () => {
                            alert(`Customer: ${tc.customerName}\nSection: ${tc.section}\nNTN/GST: ${tc.customerNtnGst}\nInvoice: ${tc.invoiceRef}\nSales Amount: ${settings.currency} ${tc.saleAmount.toFixed(2)}\nTCS Rate: ${tc.tcsRate}%\nTCS Collected: ${settings.currency} ${tc.tcsAmount.toFixed(2)}`);
                          },
                        },
                        {
                          label: 'Print TCS Certificate',
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
      )}

      {/* Record TDS Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Record TDS Deduction Entry</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSaveTds} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Deductee / Vendor Name *</label>
                <input
                  type="text"
                  value={tdsParty}
                  onChange={(e) => setTdsParty(e.target.value)}
                  required
                  placeholder="e.g. Getz Pharma / Contractor Name"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Party PAN / NTN</label>
                  <input
                    type="text"
                    value={tdsPanNtn}
                    onChange={(e) => setTdsPanNtn(e.target.value)}
                    placeholder="NTN-0899441-2"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Section Code</label>
                  <select
                    value={tdsSection}
                    onChange={(e) => setTdsSection(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                  >
                    <option value="194Q (Goods Purchase)">194Q (Purchase of Goods)</option>
                    <option value="194C (Contractor)">194C (Contractor Payment)</option>
                    <option value="194J (Professional / Technical)">194J (Professional Fee)</option>
                    <option value="194I (Rent)">194I (Rent Payment)</option>
                    <option value="Section 153 (Tax Law)">Section 153 (Supplies)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Gross Payment ({settings.currency}) *</label>
                  <input
                    type="number"
                    value={tdsTxnAmount}
                    onChange={(e) => setTdsTxnAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">TDS Rate %</label>
                  <input
                    type="number"
                    value={tdsRate}
                    onChange={(e) => setTdsRate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
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
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow"
                >
                  Save TDS Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
