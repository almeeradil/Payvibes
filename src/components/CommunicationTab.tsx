import React, { useState } from 'react';
import { 
  MessageSquare, 
  Send, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Smartphone, 
  Bell, 
  PhoneCall, 
  ExternalLink,
  Users,
  Search,
  Filter,
  Eye
} from 'lucide-react';
import { CommunicationLog, PaymentReminderSchedule, SalesInvoice, Customer, SystemSettings } from '../types';
import { RowActionsMenu } from './RowActionsMenu';

interface CommunicationTabProps {
  logs: CommunicationLog[];
  reminders: PaymentReminderSchedule[];
  orders: SalesInvoice[];
  customers: Customer[];
  settings: SystemSettings;
  onSendManualMessage: (log: CommunicationLog) => void;
  onTriggerPaymentReminder: (invoice: SalesInvoice, channel: 'WhatsApp' | 'SMS' | 'Both') => void;
}

export const CommunicationTab: React.FC<CommunicationTabProps> = ({
  logs,
  reminders,
  orders,
  customers,
  settings,
  onSendManualMessage,
  onTriggerPaymentReminder,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'reminders' | 'logs' | 'compose'>('reminders');
  const [selectedChannel, setSelectedChannel] = useState<'WhatsApp' | 'SMS' | 'Both'>('WhatsApp');
  const [composeParty, setComposeParty] = useState(customers[0]?.name || '');
  const [composePhone, setComposePhone] = useState(customers[0]?.contact || '0300-1234567');
  const [composeMessage, setComposeMessage] = useState('Dear Customer, your invoice is generated. Thank you for your business!');
  const [notice, setNotice] = useState<string | null>(null);

  // Unpaid invoices eligible for automated reminders
  const unpaidInvoices = orders.filter(o => o.status === 'Unpaid');

  const handleComposeSend = (e: React.FormEvent) => {
    e.preventDefault();
    const newLog: CommunicationLog = {
      id: 'comm-' + Math.random().toString(36).substr(2, 9),
      channel: selectedChannel === 'Both' ? 'WhatsApp' : selectedChannel,
      type: 'General Notification',
      recipientName: composeParty,
      recipientPhone: composePhone,
      message: composeMessage,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Delivered',
    };

    onSendManualMessage(newLog);

    if (selectedChannel === 'WhatsApp' || selectedChannel === 'Both') {
      const cleanPhone = composePhone.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(composeMessage);
      window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    }

    setNotice(`Direct ${selectedChannel} message dispatched to ${composeParty}!`);
    setTimeout(() => setNotice(null), 4000);
  };

  const handleRemindClick = (inv: SalesInvoice, channel: 'WhatsApp' | 'SMS' | 'Both') => {
    onTriggerPaymentReminder(inv, channel);
    
    if (channel === 'WhatsApp' || channel === 'Both') {
      const msg = `Dear ${inv.custName}, this is a gentle reminder that Invoice #${inv.inv} for ${settings.currency} ${inv.amount.toFixed(2)} is overdue (Due: ${inv.dueDate || inv.date}). Kindly clear the dues at your earliest. Thank you - ${settings.company}`;
      const cust = customers.find(c => c.name === inv.custName);
      const cleanPhone = (cust?.contact || '03001234567').replace(/[^0-9]/g, '');
      window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
    }

    setNotice(`Automated Payment Reminder triggered via ${channel} for Invoice #${inv.inv}!`);
    setTimeout(() => setNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Communication &amp; Automated Payment Reminders
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Direct WhatsApp &amp; SMS messaging, automated overdue debt collection alerts, and dispatch logs.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">WhatsApp Gateway:</span>
          <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-800 font-bold text-xs px-2.5 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Cloud API Active
          </span>
        </div>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{notice}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('reminders')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === 'reminders' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Automated Overdue Payment Reminders ({unpaidInvoices.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('compose')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === 'compose' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Direct WhatsApp / SMS Broadcaster</span>
        </button>
        <button
          onClick={() => setActiveSubTab('logs')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === 'logs' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Message Dispatch Logs ({logs.length})</span>
        </button>
      </div>

      {/* Automated Reminders View */}
      {activeSubTab === 'reminders' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-xs font-extrabold uppercase text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Pending Invoices Eligible for Automated Collection Reminders</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                Clicking WhatsApp will open the official WhatsApp web client with pre-filled debt details and payment link.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Customer Name</th>
                  <th className="p-3">Invoice Date</th>
                  <th className="p-3">Due Date</th>
                  <th className="p-3 text-right">Outstanding Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">1-Click Dispatch Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {unpaidInvoices.length > 0 ? (
                  unpaidInvoices.map(inv => (
                    <tr key={inv.id} className="hover:bg-slate-50 dark:bg-slate-800">
                      <td className="p-3 font-mono font-bold text-orange-600">{inv.inv}</td>
                      <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{inv.custName}</td>
                      <td className="p-3 text-slate-600 dark:text-slate-400">{inv.date}</td>
                      <td className="p-3 font-semibold text-rose-600">{inv.dueDate || 'Immediate'}</td>
                      <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                        {settings.currency} {inv.amount.toFixed(2)}
                      </td>
                      <td className="p-3 text-center">
                        <span className="bg-rose-100 text-rose-800 font-bold px-2 py-0.5 rounded text-[10px]">
                          Unpaid Overdue
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <div className="flex justify-end items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleRemindClick(inv, 'WhatsApp')}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                          >
                            <MessageSquare className="w-3 h-3" />
                            <span>WhatsApp</span>
                          </button>
                          <RowActionsMenu
                            actions={[
                              {
                                label: 'Dispatch WhatsApp Reminder',
                                icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />,
                                onClick: () => handleRemindClick(inv, 'WhatsApp'),
                                variant: 'success',
                              },
                              {
                                label: 'Send SMS Alert',
                                icon: <Smartphone className="w-3.5 h-3.5 text-slate-700" />,
                                onClick: () => handleRemindClick(inv, 'SMS'),
                              },
                              {
                                label: 'View Debt Details',
                                icon: <Eye className="w-3.5 h-3.5" />,
                                onClick: () => {
                                  alert(`Invoice #: ${inv.inv}\nCustomer: ${inv.custName}\nDue Date: ${inv.dueDate || 'Immediate'}\nOutstanding: ${settings.currency} ${inv.amount.toFixed(2)}`);
                                },
                              },
                            ]}
                          />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-slate-400 font-semibold">
                      All invoices are fully paid! No overdue collection reminders needed.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Compose View */}
      {activeSubTab === 'compose' && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs max-w-2xl">
          <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Send className="w-4 h-4 text-emerald-600" />
            <span>Send Direct WhatsApp / SMS Message</span>
          </h4>
          <form onSubmit={handleComposeSend} className="space-y-4 text-xs">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Communication Channel</label>
              <div className="flex gap-4">
                {(['WhatsApp', 'SMS', 'Both'] as const).map(ch => (
                  <label key={ch} className="flex items-center gap-2 cursor-pointer font-bold text-slate-700 dark:text-slate-300">
                    <input
                      type="radio"
                      name="channel"
                      checked={selectedChannel === ch}
                      onChange={() => setSelectedChannel(ch)}
                      className="text-emerald-600"
                    />
                    <span>{ch}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Customer / Recipient</label>
                <select
                  value={composeParty}
                  onChange={(e) => {
                    const c = customers.find(cust => cust.name === e.target.value);
                    setComposeParty(e.target.value);
                    if (c) setComposePhone(c.contact);
                  }}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 font-medium"
                >
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.contact})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Phone Number *</label>
                <input
                  type="text"
                  value={composePhone}
                  onChange={(e) => setComposePhone(e.target.value)}
                  required
                  className="w-full px-3 py-2 border rounded-lg font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Message Body *</label>
              <textarea
                rows={4}
                value={composeMessage}
                onChange={(e) => setComposeMessage(e.target.value)}
                required
                className="w-full px-3 py-2 border rounded-lg text-xs"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-2 cursor-pointer"
              >
                <Send className="w-4 h-4" />
                <span>Send Message Via {selectedChannel}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Logs Table */}
      {activeSubTab === 'logs' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
              <tr>
                <th className="p-3">Timestamp</th>
                <th className="p-3">Channel</th>
                <th className="p-3">Notification Type</th>
                <th className="p-3">Recipient</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Message Snippet</th>
                <th className="p-3 text-center">Delivery Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.map(l => (
                <tr key={l.id} className="hover:bg-slate-50 dark:bg-slate-800">
                  <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{l.timestamp}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      l.channel === 'WhatsApp' ? 'bg-emerald-100 text-emerald-800' : 'bg-cyan-100 text-cyan-800'
                    }`}>
                      {l.channel}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{l.type}</td>
                  <td className="p-3 font-semibold text-slate-800 dark:text-slate-200">{l.recipientName}</td>
                  <td className="p-3 font-mono text-slate-600 dark:text-slate-400">{l.recipientPhone}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate">{l.message}</td>
                  <td className="p-3 text-center">
                    <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                      ✓ {l.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'View Full Message Body',
                          icon: <Eye className="w-3.5 h-3.5" />,
                          onClick: () => {
                            alert(`Recipient: ${l.recipientName} (${l.recipientPhone})\nChannel: ${l.channel}\nTimestamp: ${l.timestamp}\nStatus: ${l.status}\n\nMessage:\n${l.message}`);
                          },
                        },
                        {
                          label: 'Resend via WhatsApp',
                          icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />,
                          onClick: () => {
                            const url = `https://wa.me/${l.recipientPhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(l.message)}`;
                            window.open(url, '_blank');
                          },
                          variant: 'success',
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
    </div>
  );
};
