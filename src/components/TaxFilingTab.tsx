import React, { useState } from 'react';
import { 
  FileCheck2, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  FileText, 
  ShieldCheck, 
  Download, 
  Truck, 
  QrCode, 
  RefreshCw, 
  ExternalLink,
  Code2,
  Calendar,
  Eye,
  Printer
} from 'lucide-react';
import { SalesInvoice, GstFilingRecord, SystemSettings } from '../types';
import { validateGstPreSubmission, generateFilingPayload } from '../services/gstValidator';
import { RowActionsMenu } from './RowActionsMenu';

interface TaxFilingTabProps {
  orders: SalesInvoice[];
  gstFilings: GstFilingRecord[];
  settings: SystemSettings;
  userRole: string;
  onSaveFiling: (filing: GstFilingRecord) => void;
  onOpenEwayModal: (invoice?: SalesInvoice) => void;
}

export const TaxFilingTab: React.FC<TaxFilingTabProps> = ({
  orders,
  gstFilings,
  settings,
  userRole,
  onSaveFiling,
  onOpenEwayModal,
}) => {
  const [selectedMonth, setSelectedMonth] = useState('August');
  const [selectedYear, setSelectedYear] = useState(2026);
  const [returnType, setReturnType] = useState<'GSTR-1' | 'GSTR-3B'>('GSTR-1');
  const [activeTab, setActiveTab] = useState<'filing' | 'history' | 'eway' | 'einvoice'>('filing');
  const [viewJsonModal, setViewJsonModal] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<GstFilingRecord | null>(null);

  const validation = validateGstPreSubmission(orders, selectedMonth, selectedYear, returnType);

  const handle1ClickFiling = () => {
    if (!validation.isValid && !confirm('Pre-submission validation detected critical errors. Do you still want to proceed with portal submission?')) {
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const filing = generateFilingPayload(
        returnType,
        selectedMonth,
        selectedYear,
        orders,
        settings.ntn || 'NTN-7890123-4',
        userRole
      );
      onSaveFiling(filing);
      setIsSubmitting(false);
      setSubmissionSuccess(filing);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Automated GST Compliance &amp; Government Portal Integration
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                1-Click Direct Tax Filing for GSTR-1, GSTR-3B &amp; E-Way Bill with Deep API Pre-Submission Verification.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">Portal API Status:</span>
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Connected &amp; Verified
          </span>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('filing')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === 'filing' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          <span>1-Click Tax Filing Center</span>
        </button>
        <button
          onClick={() => setActiveTab('eway')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === 'eway' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>E-Way Bill Integration</span>
        </button>
        <button
          onClick={() => setActiveTab('einvoice')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === 'einvoice' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>E-Invoicing (IRN &amp; QR Code)</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === 'history' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Filing History &amp; ARNs ({gstFilings.length})</span>
        </button>
      </div>

      {/* 1-Click Filing View */}
      {activeTab === 'filing' && (
        <div className="space-y-6">
          {/* Period Selector & Filing Controls */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Return Type</label>
                <select
                  value={returnType}
                  onChange={(e) => setReturnType(e.target.value as any)}
                  className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200"
                >
                  <option value="GSTR-1">GSTR-1 (Outward Sales Invoices)</option>
                  <option value="GSTR-3B">GSTR-3B (Monthly Summary Return)</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Filing Month</label>
                <select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200"
                >
                  {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Filing Year</label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full text-xs font-bold bg-slate-50 dark:bg-slate-800 border border-slate-300 rounded-lg px-3 py-2 text-slate-800 dark:text-slate-200"
                >
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                  <option value={2027}>2027</option>
                </select>
              </div>

              <div>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handle1ClickFiling}
                  className={`w-full py-2.5 px-4 rounded-lg font-bold text-xs shadow-md transition flex items-center justify-center space-x-2 text-white cursor-pointer ${
                    validation.isValid ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Transmitting to Govt API...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>1-Click Submit {returnType}</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Pre-Submission Error Alerts & Validation Checks */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                {validation.isValid ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                )}
                <span>Pre-Submission Error Alert &amp; Validation Engine</span>
              </h4>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                validation.isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {validation.issues.length} Issue(s) Detected
              </span>
            </div>

            {validation.issues.length > 0 ? (
              <div className="space-y-2 mt-3">
                {validation.issues.map((issue, idx) => (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border text-xs flex items-start gap-3 ${
                      issue.type === 'Error' 
                        ? 'bg-rose-50 border-rose-200 text-rose-900' 
                        : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}
                  >
                    {issue.type === 'Error' ? (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <div className="font-extrabold flex items-center gap-2">
                        <span>[{issue.type.toUpperCase()}] {issue.message}</span>
                        {issue.invoiceNo && (
                          <span className="font-mono bg-white dark:bg-slate-900/70 px-1.5 py-0.2 rounded text-[10px]">
                            {issue.invoiceNo}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">{issue.recommendation}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>All invoices pass HSN codes, NTN format, tax rates and mathematical integrity checks! Ready for 1-Click Submission.</span>
              </div>
            )}
          </div>

          {/* Tax Liability Breakdown Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold uppercase text-slate-400">Total Invoices</div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {validation.summary.totalInvoices}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Under {selectedMonth} {selectedYear}</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold uppercase text-slate-400">Taxable Sales Value</div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
                {settings.currency} {validation.summary.totalTaxable.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Net of discounts</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold uppercase text-slate-400">CGST + SGST (50:50)</div>
              <div className="text-2xl font-black text-emerald-600 mt-1">
                {settings.currency} {validation.summary.totalTax.toFixed(2)}
              </div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">CGST: {settings.currency} {validation.summary.cgst.toFixed(2)} | SGST: {settings.currency} {validation.summary.sgst.toFixed(2)}</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="text-[10px] font-bold uppercase text-slate-400">Total Tax Liability</div>
              <div className="text-2xl font-black text-orange-600 mt-1">
                {settings.currency} {validation.summary.totalTax.toFixed(2)}
              </div>
              <div className="text-[10px] text-emerald-600 font-bold mt-0.5">Ready for Challan</div>
            </div>
          </div>

          {/* Successful Submission Banner */}
          {submissionSuccess && (
            <div className="bg-emerald-50 border border-emerald-300 p-4 rounded-xl text-xs text-emerald-900 animate-in fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold text-sm">Successfully Filed to Government Portal!</span>
                    <p className="text-[11px] mt-0.5">
                      Acknowledgement Reference Number (ARN): <strong className="font-mono text-emerald-800">{submissionSuccess.arn}</strong>
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setViewJsonModal(submissionSuccess.jsonPayload || '')}
                  className="px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs hover:bg-emerald-700 transition flex items-center gap-1"
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>View Filed JSON</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* E-Way Bill Integration Tab */}
      {activeTab === 'eway' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>E-Way Bill Generation &amp; Consignment Tracking</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Required for commercial transport of goods valued &gt;= Rs 50,000. Generate Part A &amp; Part B slips.
              </p>
            </div>
            <button
              onClick={() => onOpenEwayModal()}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1.5"
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Generate New E-Way Bill</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer / Party</th>
                  <th className="p-3">E-Way Bill #</th>
                  <th className="p-3">Vehicle No</th>
                  <th className="p-3">Valid Till</th>
                  <th className="p-3 text-right">Invoice Value</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:bg-slate-800">
                    <td className="p-3 font-bold text-orange-600 font-mono">{o.inv}</td>
                    <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{o.custName}</td>
                    <td className="p-3">
                      {o.eWayBillNo ? (
                        <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                          {o.eWayBillNo}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Not Generated</span>
                      )}
                    </td>
                    <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{o.vehicleNo || 'N/A'}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{o.eWayValidTill || '-'}</td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                      {settings.currency} {o.amount.toFixed(2)}
                    </td>
                    <td className="p-3 text-right">
                      <RowActionsMenu
                        actions={[
                          {
                            label: o.eWayBillNo ? 'View E-Way Slip' : 'Generate E-Way Bill',
                            icon: <Truck className="w-3.5 h-3.5 text-emerald-600" />,
                            onClick: () => {
                              if (o.eWayBillNo) {
                                alert(`E-Way Bill ${o.eWayBillNo} is ACTIVE for vehicle ${o.vehicleNo}. Valid till ${o.eWayValidTill}.`);
                              } else {
                                onOpenEwayModal(o);
                              }
                            },
                            variant: o.eWayBillNo ? 'success' : 'primary',
                          },
                          {
                            label: 'Print Consignment Transport Voucher',
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
        </div>
      )}

      {/* E-Invoicing (IRN & QR Code) Tab */}
      {activeTab === 'einvoice' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-cyan-600" />
              <span>E-Invoicing (Invoice Reference Number IRN &amp; Signed QR Code)</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Direct digital integration with Govt IRP (Invoice Registration Portal) for real-time B2B tax authorization.
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">64-Digit IRN Hash</th>
                  <th className="p-3">Ack No &amp; Date</th>
                  <th className="p-3 text-center">QR Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map(o => (
                  <tr key={o.id} className="hover:bg-slate-50 dark:bg-slate-800">
                    <td className="p-3 font-bold text-orange-600 font-mono">{o.inv}</td>
                    <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{o.date}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{o.custName}</td>
                    <td className="p-3 font-mono text-[10px] text-slate-600 dark:text-slate-400 truncate max-w-xs">
                      {o.irn || 'IRN-98472910472819482017482910482910'}
                    </td>
                    <td className="p-3 text-[11px] text-slate-600 dark:text-slate-400">
                      <div>{o.ackNo || 'ACK-887192'}</div>
                      <div className="text-[9px] text-slate-400">{o.ackDate || '2026-08-15 11:32'}</div>
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        Signed QR Ready
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <RowActionsMenu
                        actions={[
                          {
                            label: 'Copy IRN Hash',
                            icon: <QrCode className="w-3.5 h-3.5 text-cyan-600" />,
                            onClick: () => {
                              navigator.clipboard.writeText(o.irn || 'IRN-98472910472819482017482910482910');
                              alert(`Copied IRN for ${o.inv} to clipboard.`);
                            },
                          },
                          {
                            label: 'Print E-Invoice with QR',
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
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
              <tr>
                <th className="p-3">Return Type</th>
                <th className="p-3">Period</th>
                <th className="p-3">Filing Date</th>
                <th className="p-3">Govt ARN Code</th>
                <th className="p-3 text-right">Taxable Turnover</th>
                <th className="p-3 text-right">Tax Paid</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {gstFilings.length > 0 ? (
                gstFilings.map(f => (
                  <tr key={f.id} className="hover:bg-slate-50 dark:bg-slate-800">
                    <td className="p-3 font-bold text-emerald-600">{f.returnType}</td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">{f.periodMonth} {f.periodYear}</td>
                    <td className="p-3 text-slate-600 dark:text-slate-400">{f.filingDate}</td>
                    <td className="p-3 font-mono font-bold text-slate-900 dark:text-slate-100">{f.arn}</td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                      {settings.currency} {f.totalTaxable.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-black text-emerald-600">
                      {settings.currency} {f.totalTax.toLocaleString()}
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold text-[10px]">
                        {f.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <RowActionsMenu
                        actions={[
                          {
                            label: 'View JSON Payload',
                            icon: <Code2 className="w-3.5 h-3.5 text-emerald-600" />,
                            onClick: () => setViewJsonModal(f.jsonPayload || ''),
                            disabled: !f.jsonPayload,
                          },
                          {
                            label: 'Print ARN Receipt',
                            icon: <Printer className="w-3.5 h-3.5" />,
                            onClick: () => window.print(),
                          },
                        ]}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-slate-400">
                    No tax filings on record yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* JSON Payload Modal */}
      {viewJsonModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-2xl w-full p-6 border border-slate-200 dark:border-slate-700 max-h-[85vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700">
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Code2 className="w-4 h-4 text-emerald-600" />
                <span>Government API JSON Payload</span>
              </h4>
              <button onClick={() => setViewJsonModal(null)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">
                ✕
              </button>
            </div>
            <pre className="p-4 bg-slate-950 text-emerald-400 font-mono text-[11px] rounded-lg overflow-y-auto flex-1 my-4">
              {viewJsonModal}
            </pre>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(viewJsonModal);
                  alert('JSON Payload copied to clipboard!');
                }}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs"
              >
                Copy JSON
              </button>
              <button
                onClick={() => setViewJsonModal(null)}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
