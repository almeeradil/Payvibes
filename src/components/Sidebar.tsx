import React, { useState } from 'react';
import {
  LayoutDashboard,
  FileSpreadsheet,
  FileText,
  RotateCcw,
  Receipt,
  ArrowRightLeft,
  Wallet,
  ClipboardList,
  TrendingUp,
  Boxes,
  Users,
  Building,
  Landmark,
  PiggyBank,
  Barcode,
  Settings,
  HelpCircle,
  LogOut,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  Percent,
  Sparkles,
  UserCheck,
  MessageSquareText,
  Layers,
  HeartHandshake,
  Store,
  History,
  FileCheck
} from 'lucide-react';
import { UserRole } from '../types';

interface SidebarProps {
  currentTab?: string;
  activeTab?: string;
  onTabChange: (tab: string) => void;
  userRole: UserRole;
  onLogout?: () => void;
  lowStockCount?: number;
  unreconciledCount?: number;
  pendingRemindersCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  activeTab,
  onTabChange,
  userRole,
  onLogout,
  lowStockCount = 0,
  unreconciledCount = 0,
  pendingRemindersCount = 0,
}) => {
  const [salesOpen, setSalesOpen] = useState(true);
  const [purchOpen, setPurchOpen] = useState(false);
  const [taxFinanceOpen, setTaxFinanceOpen] = useState(false);
  const [multiStoreOpen, setMultiStoreOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  const active = currentTab || activeTab || 'dashboard';
  const isActive = (tab: string) => active === tab;

  return (
    <aside className="w-64 bg-slate-900 dark:bg-slate-950 text-slate-300 flex flex-col shadow-xl z-20 select-none">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-800 flex items-center space-x-3 bg-slate-950/40">
        <img
          src="https://zuraizadil32-cyber.github.io/Payvubes/logo.png"
          alt="Posvibe logo"
          className="h-10 w-auto max-w-[120px] object-contain shadow-sm ring-1 ring-white/10 p-0.5 rounded-lg bg-slate-800"
        />
        <div className="overflow-hidden">
          <h2 className="font-extrabold text-white text-sm tracking-wide flex items-center gap-1.5">
            Posvibe
          </h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[10px] text-orange-400 font-bold uppercase tracking-wider truncate">
              {userRole}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-semibold scrollbar-thin scrollbar-thumb-slate-700">
        {/* Main Dashboard */}
        <button
          onClick={() => onTabChange('dashboard')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition group ${
            isActive('dashboard') ? 'bg-orange-500 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <LayoutDashboard className={`w-4 h-4 ${isActive('dashboard') ? 'text-white' : 'text-orange-500'}`} />
          <span>Dashboard Overview</span>
        </button>

        {/* Multi-Store & Central HQ */}
        <button
          onClick={() => setMultiStoreOpen(!multiStoreOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
        >
          <span className="flex items-center space-x-3">
            <Store className="w-4 h-4 text-purple-400" />
            <span>Multi-Store &amp; HQ</span>
          </span>
          {multiStoreOpen ? <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400" />}
        </button>
        {multiStoreOpen && (
          <div className="pl-7 space-y-0.5 py-1">
            <button
              onClick={() => onTabChange('multistore')}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center transition ${
                isActive('multistore') ? 'bg-slate-800 text-purple-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Store className="w-3.5 h-3.5 mr-2 text-purple-400" />
              Central HQ &amp; Branches
            </button>
            <button
              onClick={() => onTabChange('stocktransfers')}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center transition ${
                isActive('stocktransfers') ? 'bg-slate-800 text-purple-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 mr-2 text-purple-400" />
              Inter-Store Stock Transfer
            </button>
          </div>
        )}

        {/* Sales Menu */}
        <button
          onClick={() => setSalesOpen(!salesOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
        >
          <span className="flex items-center space-x-3">
            <FileSpreadsheet className="w-4 h-4 text-orange-500" />
            <span>Sales &amp; Billing</span>
          </span>
          {salesOpen ? <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400" />}
        </button>
        {salesOpen && (
          <div className="pl-7 space-y-0.5 py-1">
            <button
              onClick={() => onTabChange('orders')}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center transition ${
                isActive('orders') ? 'bg-slate-800 text-orange-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5 mr-2 text-orange-400" />
              Sales Invoices Directory
            </button>
            <button
              onClick={() => onTabChange('quotations')}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center transition ${
                isActive('quotations') ? 'bg-slate-800 text-orange-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5 mr-2 text-orange-400" />
              Estimation and Quotation
            </button>
            <button
              onClick={() => onTabChange('debitnotes')}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center transition ${
                isActive('debitnotes') ? 'bg-slate-800 text-rose-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <RotateCcw className="w-3.5 h-3.5 mr-2 text-rose-400" />
              Debit Notes &amp; Returns
            </button>
          </div>
        )}

        {/* Financial & Tax Management (TDS/TCS, GST, Bank Recon) */}
        <button
          onClick={() => setTaxFinanceOpen(!taxFinanceOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
        >
          <span className="flex items-center space-x-3">
            <Percent className="w-4 h-4 text-emerald-400" />
            <span>Tax &amp; Compliance</span>
          </span>
          {taxFinanceOpen ? <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400" />}
        </button>
        {taxFinanceOpen && (
          <div className="pl-7 space-y-0.5 py-1">
            <button
              onClick={() => onTabChange('gstfiling')}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center transition ${
                isActive('gstfiling') ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <FileCheck className="w-3.5 h-3.5 mr-2 text-emerald-400" />
              Automated GST Filing
            </button>
            <button
              onClick={() => onTabChange('tdstcs')}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center transition ${
                isActive('tdstcs') ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Percent className="w-3.5 h-3.5 mr-2 text-emerald-400" />
              TDS &amp; TCS Management
            </button>
            <button
              onClick={() => onTabChange('bankreconciliation')}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center transition ${
                isActive('bankreconciliation') ? 'bg-slate-800 text-cyan-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Landmark className="w-3.5 h-3.5 mr-2 text-cyan-400" />
              Bank Reconciliation
            </button>
          </div>
        )}

        {/* Purchases Menu */}
        <button
          onClick={() => setPurchOpen(!purchOpen)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition"
        >
          <span className="flex items-center space-x-3">
            <Receipt className="w-4 h-4 text-emerald-400" />
            <span>Purchases &amp; PO</span>
          </span>
          {purchOpen ? <ChevronDown className="w-3 h-3 text-slate-500 dark:text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-500 dark:text-slate-400" />}
        </button>
        {purchOpen && (
          <div className="pl-7 space-y-0.5 py-1">
            <button
              onClick={() => onTabChange('purchaseinvoices')}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center transition ${
                isActive('purchaseinvoices') ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Receipt className="w-3.5 h-3.5 mr-2 text-emerald-400" />
              Purchase Bills
            </button>
            <button
              onClick={() => onTabChange('purchases')}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center transition ${
                isActive('purchases') ? 'bg-slate-800 text-emerald-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5 mr-2 text-emerald-400" />
              Purchase Orders &amp; Vendor
            </button>
            <button
              onClick={() => onTabChange('payouts')}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center transition ${
                isActive('payouts') ? 'bg-slate-800 text-purple-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <ArrowRightLeft className="w-3.5 h-3.5 mr-2 text-purple-400" />
              Outgoing Payments (PV)
            </button>
            <button
              onClick={() => onTabChange('expenses')}
              className={`w-full text-left px-2 py-1.5 rounded-md text-[11px] font-medium flex items-center transition ${
                isActive('expenses') ? 'bg-slate-800 text-rose-400 font-bold' : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 mr-2 text-rose-400" />
              Business Expenses
            </button>
          </div>
        )}

        {/* Customer Loyalty & Digital Wallet */}
        <button
          onClick={() => onTabChange('loyalty')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition group ${
            isActive('loyalty') ? 'bg-pink-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="flex items-center space-x-3">
            <HeartHandshake className={`w-4 h-4 ${isActive('loyalty') ? 'text-white' : 'text-pink-400'}`} />
            <span>Loyalty &amp; Wallet</span>
          </span>
          <span className="text-[9px] bg-pink-500/20 text-pink-300 font-bold px-1.5 py-0.5 rounded">Cashback</span>
        </button>

        {/* HR & Payroll with Biometric Attendance */}
        <button
          onClick={() => onTabChange('hrpayroll')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition group ${
            isActive('hrpayroll') ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="flex items-center space-x-3">
            <UserCheck className={`w-4 h-4 ${isActive('hrpayroll') ? 'text-white' : 'text-indigo-400'}`} />
            <span>HR &amp; Payroll</span>
          </span>
          <span className="text-[9px] bg-indigo-500/20 text-indigo-300 font-bold px-1.5 py-0.5 rounded">Biometric</span>
        </button>

        {/* WhatsApp & SMS Communication + Automated Reminders */}
        <button
          onClick={() => onTabChange('communication')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition group ${
            isActive('communication') ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="flex items-center space-x-3">
            <MessageSquareText className={`w-4 h-4 ${isActive('communication') ? 'text-white' : 'text-emerald-400'}`} />
            <span>WhatsApp &amp; Reminders</span>
          </span>
          {pendingRemindersCount > 0 && (
            <span className="text-[9px] bg-rose-500 text-white font-bold px-1.5 py-0.5 rounded-full">
              {pendingRemindersCount}
            </span>
          )}
        </button>

        {/* Inventory Stock */}
        <button
          onClick={() => onTabChange('inventory')}
          className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition group ${
            isActive('inventory') ? 'bg-orange-500 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span className="flex items-center space-x-3">
            <Boxes className={`w-4 h-4 ${isActive('inventory') ? 'text-white' : 'text-orange-500'}`} />
            <span>Inventory Stock</span>
          </span>
          {lowStockCount > 0 && (
            <span className="text-[10px] bg-rose-600 text-white font-black px-2 py-0.5 rounded-full animate-pulse flex items-center gap-1 shadow-xs border border-rose-400">
              <span className="w-1.5 h-1.5 rounded-full bg-white dark:bg-slate-900 dark:bg-slate-950 dark:bg-slate-900 dark:bg-slate-950 animate-ping"></span>
              <span>{lowStockCount} Low</span>
            </span>
          )}
        </button>

        {/* Customers & Suppliers Directory */}
        <button
          onClick={() => onTabChange('customers')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition group ${
            isActive('customers') ? 'bg-orange-500 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Users className={`w-4 h-4 ${isActive('customers') ? 'text-white' : 'text-orange-500'}`} />
          <span>Customers &amp; Shops</span>
        </button>

        <button
          onClick={() => onTabChange('suppliers')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition group ${
            isActive('suppliers') ? 'bg-orange-500 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Building className={`w-4 h-4 ${isActive('suppliers') ? 'text-white' : 'text-orange-500'}`} />
          <span>Suppliers Directory</span>
        </button>

        <div className="pt-2 mt-2 border-t border-slate-800/80"></div>

        {/* Cash & Bank */}
        <button
          onClick={() => onTabChange('cashbank')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition group ${
            isActive('cashbank') ? 'bg-emerald-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Landmark className={`w-4 h-4 ${isActive('cashbank') ? 'text-white' : 'text-emerald-400'}`} />
          <span>Cash &amp; Bank Ledger</span>
        </button>

        {/* Other Income */}
        <button
          onClick={() => onTabChange('otherincome')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition group ${
            isActive('otherincome') ? 'bg-amber-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <PiggyBank className={`w-4 h-4 ${isActive('otherincome') ? 'text-white' : 'text-amber-400'}`} />
          <span>Other Income</span>
        </button>

        {/* Barcode Scanner */}
        <button
          onClick={() => onTabChange('barcode')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition group ${
            isActive('barcode') ? 'bg-cyan-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Barcode className={`w-4 h-4 ${isActive('barcode') ? 'text-white' : 'text-cyan-400'}`} />
          <span>Barcode Scanner</span>
        </button>

        {/* Comprehensive Reports */}
        <button
          onClick={() => onTabChange('reports')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition group ${
            isActive('reports') ? 'bg-cyan-600 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <TrendingUp className={`w-4 h-4 ${isActive('reports') ? 'text-white' : 'text-cyan-400'}`} />
          <span>Reports &amp; Analytics</span>
        </button>

        {/* Settings */}
        <button
          onClick={() => onTabChange('settings')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition group ${
            isActive('settings') ? 'bg-slate-800 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Settings className={`w-4 h-4 ${isActive('settings') ? 'text-white' : 'text-slate-300'}`} />
          <span>Business Settings</span>
        </button>

        {/* Help & Support */}
        <button
          onClick={() => onTabChange('help')}
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition group ${
            isActive('help') ? 'bg-orange-500 text-white font-bold' : 'hover:bg-slate-800 hover:text-white'
          }`}
        >
          <HelpCircle className={`w-4 h-4 ${isActive('help') ? 'text-white' : 'text-orange-500'}`} />
          <span>Help &amp; Support</span>
        </button>
      </nav>

      {/* Logout Footer */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/50">
        <button
          onClick={onLogout}
          className="w-full flex items-center justify-center space-x-2 px-3 py-2 bg-rose-600 hover:bg-rose-700 active:bg-rose-800 text-white rounded-lg font-bold transition text-xs shadow-xs cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
};
