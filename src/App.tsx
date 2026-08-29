import React, { useState, useEffect, createContext, useContext } from 'react';

type Theme = 'light' | 'dark';
interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextType>({ theme: 'light', toggleTheme: () => {} });

export function useTheme() {
  return useContext(ThemeContext);
}

import {
  AppStateData, 
  UserRole, 
  SalesInvoice, 
  Quotation,
  PurchaseOrder, 
  ExpenseVoucher, 
  InventoryItem, 
  Customer, 
  Supplier, 
  Employee, 
  AttendancePunch, 
  PayrollRun, 
  GstFilingRecord, 
  TdsEntry, 
  TcsEntry, 
  BankStatementRow, 
  CashBankTransaction, 
  StockTransfer, 
  CommunicationLog, 
  LoyaltyCampaign, 
  Branch, 
  SystemSettings 
} from './types';
import { 
  getStoredData, 
  saveStoredData, 
  createAuditEntry, 
  restoreBackupFromJson, 
  exportBackupJson 
} from './services/storage';

import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { DashboardTab } from './components/DashboardTab';
import { TaxFilingTab } from './components/TaxFilingTab';
import { TdsTcsTab } from './components/TdsTcsTab';
import { BankReconciliationTab } from './components/BankReconciliationTab';
import { MultiStoreTab } from './components/MultiStoreTab';
import { LoyaltyProgramTab } from './components/LoyaltyProgramTab';
import { HrPayrollTab } from './components/HrPayrollTab';
import { CommunicationTab } from './components/CommunicationTab';
import { QuotationsTab } from './components/QuotationsTab';
import { SalesTab } from './components/SalesTab';
import { PurchasesTab } from './components/PurchasesTab';
import { ExpensesTab } from './components/ExpensesTab';
import { InventoryTab } from './components/InventoryTab';
import { PartiesTab } from './components/PartiesTab';
import { CashBankTab } from './components/CashBankTab';
import { ReportsTab } from './components/ReportsTab';
import { SettingsTab } from './components/SettingsTab';

import { ClientPortalModal } from './components/ClientPortalModal';
import { EwayBillModal } from './components/EwayBillModal';
import { StockTransferModal } from './components/StockTransferModal';

export default function App() {
  const [data, setData] = useState<AppStateData>(() => getStoredData());
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [theme, setTheme] = useState<Theme>('light');

  // Sync theme
  useEffect(() => {
    const saved = localStorage.getItem('erp-theme') as Theme;
    if (saved) {
      setTheme(saved);
      if (saved === 'dark') document.documentElement.classList.add('dark');
      else document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('erp-theme', next);
    if (next === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  };
  
  // Modals
  const [showClientPortal, setShowClientPortal] = useState(false);
  const [showEwayModal, setShowEwayModal] = useState(false);
  const [selectedEwayInvoice, setSelectedEwayInvoice] = useState<SalesInvoice | undefined>();
  const [showStockTransferModal, setShowStockTransferModal] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Sync state to local storage on changes
  useEffect(() => {
    saveStoredData(data);
  }, [data]);

  const handleLogout = () => {
    setActiveTab('dashboard');
  };

  const handleRoleChange = (role: UserRole) => {
    const updatedLogs = createAuditEntry(
      data.auditLogs,
      data.currentUser,
      role,
      'ROLE_SWITCH',
      'Security',
      `Active operator switched authorization role to ${role}.`
    );
    setData(prev => ({
      ...prev,
      currentUserRole: role,
      auditLogs: updatedLogs,
    }));
  };

  const handleBranchChange = (branchId: string) => {
    setData(prev => ({
      ...prev,
      currentBranchId: branchId,
    }));
  };

  // Restore backup from JSON file
  const handleRestoreBackupFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const restored = restoreBackupFromJson(text, data.currentUser, data.currentUserRole);
        setData(restored);
        alert('Disaster recovery completed! All invoices, tax filings, and ERP ledgers have been restored.');
      } catch (err) {
        alert('Invalid or corrupted backup JSON file.');
      }
    };
    reader.readAsText(file);
  };

  // Sales Invoice Handlers
  const handleSaveInvoice = (invoice: SalesInvoice) => {
    const updatedLogs = createAuditEntry(
      data.auditLogs,
      data.currentUser,
      data.currentUserRole,
      'CREATE_INVOICE',
      'Sales',
      `Generated Invoice #${invoice.inv} for ${invoice.custName} valued at ${data.settings.currency} ${invoice.amount.toFixed(2)}.`
    );

    // Update customer loyalty points (1 point per 100 spent)
    const pointsEarned = Math.floor(invoice.amount / 100);
    const updatedCustomers = data.customers.map(c => {
      if (c.name === invoice.custName) {
        return {
          ...c,
          loyaltyPoints: (c.loyaltyPoints || 0) + pointsEarned,
          balance: invoice.status === 'Unpaid' ? c.balance + invoice.amount : c.balance,
        };
      }
      return c;
    });

    setData(prev => ({
      ...prev,
      orders: [invoice, ...prev.orders],
      customers: updatedCustomers,
      auditLogs: updatedLogs,
    }));
  };

  const handleSaveQuotation = (q: Quotation) => {
    const updatedLogs = createAuditEntry(
      data.auditLogs,
      data.currentUser,
      data.currentUserRole,
      'CREATE_QUOTATION',
      'Sales',
      `Generated Quotation #${q.qno} for ${q.customer}.`
    );

    setData(prev => ({
      ...prev,
      quotations: [q, ...(prev.quotations || [])],
      auditLogs: updatedLogs,
    }));
  };

  const handleDeleteDocument = (collection: keyof AppStateData, id: string, docName: string) => {
    if (window.confirm("Are you sure you want to delete this document?")) {
      const updatedLogs = createAuditEntry(
        data.auditLogs,
        data.currentUser,
        data.currentUserRole,
        'DELETE_DOC',
        'System',
        `Deleted ${docName} (ID: ${id})`
      );

      setData(prev => ({
        ...prev,
        [collection]: (prev[collection] as any[]).filter((item: any) => item.id !== id),
        auditLogs: updatedLogs,
      }));
    }
  };

  // Tax Filing Handlers
  const handleSaveFiling = (filing: GstFilingRecord) => {
    const updatedLogs = createAuditEntry(
      data.auditLogs,
      data.currentUser,
      data.currentUserRole,
      'GST_FILING',
      'Taxation',
      `Filed ${filing.returnType} for ${filing.periodMonth} ${filing.periodYear}. ARN: ${filing.arn}.`
    );

    setData(prev => ({
      ...prev,
      gstFilings: [filing, ...prev.gstFilings],
      auditLogs: updatedLogs,
    }));
  };

  // TDS / TCS Handlers
  const handleAddTds = (entry: TdsEntry) => {
    const updatedLogs = createAuditEntry(
      data.auditLogs,
      data.currentUser,
      data.currentUserRole,
      'TDS_DEDUCT',
      'Taxation',
      `Deducted TDS of ${data.settings.currency} ${entry.tdsAmount.toFixed(2)} under ${entry.section} for ${entry.partyName}.`
    );
    setData(prev => ({
      ...prev,
      tdsEntries: [entry, ...prev.tdsEntries],
      auditLogs: updatedLogs,
    }));
  };

  const handleAddTcs = (entry: TcsEntry) => {
    setData(prev => ({
      ...prev,
      tcsEntries: [entry, ...prev.tcsEntries],
    }));
  };

  // Bank Reconciliation Handlers
  const handleUpdateStatements = (rows: BankStatementRow[]) => {
    const updatedLogs = createAuditEntry(
      data.auditLogs,
      data.currentUser,
      data.currentUserRole,
      'BANK_RECONCILE',
      'Banking',
      `Executed Automated Bank Reconciliation engine.`
    );
    setData(prev => ({
      ...prev,
      bankStatements: rows,
      auditLogs: updatedLogs,
    }));
  };

  const handleAddCashBankTxn = (txn: CashBankTransaction) => {
    setData(prev => ({
      ...prev,
      cashbank: [txn, ...prev.cashbank],
    }));
  };

  // Multi-Store & Stock Transfer Handlers
  const handleDispatchStockTransfer = (transfer: StockTransfer) => {
    const updatedLogs = createAuditEntry(
      data.auditLogs,
      data.currentUser,
      data.currentUserRole,
      'STOCK_TRANSFER',
      'Inventory',
      `Dispatched Stock Transfer #${transfer.transferNo}: ${transfer.qty} units of ${transfer.itemName} from ${transfer.fromBranchName} to ${transfer.toBranchName}.`
    );

    // Deduct stock from source branch
    const updatedInventory = data.inventory.map(item => {
      if (item.id === transfer.itemId) {
        return {
          ...item,
          stock: Math.max(0, item.stock - transfer.qty),
        };
      }
      return item;
    });

    setData(prev => ({
      ...prev,
      stockTransfers: [transfer, ...prev.stockTransfers],
      inventory: updatedInventory,
      auditLogs: updatedLogs,
    }));
  };

  const handleReceiveStockTransfer = (transferId: string) => {
    const transfer = data.stockTransfers.find(t => t.id === transferId);
    if (!transfer) return;

    const updatedLogs = createAuditEntry(
      data.auditLogs,
      data.currentUser,
      data.currentUserRole,
      'STOCK_RECEIVE',
      'Inventory',
      `Confirmed receipt of Stock Transfer #${transfer.transferNo} at ${transfer.toBranchName}.`
    );

    const updatedTransfers = data.stockTransfers.map(t => 
      t.id === transferId ? { ...t, status: 'Received' as const } : t
    );

    setData(prev => ({
      ...prev,
      stockTransfers: updatedTransfers,
      auditLogs: updatedLogs,
    }));
  };

  const handleAddBranch = (branch: Branch) => {
    setData(prev => ({
      ...prev,
      branches: [...prev.branches, branch],
    }));
  };

  const handleDirectVendorOrder = (po: PurchaseOrder) => {
    setData(prev => ({
      ...prev,
      purchases: [po, ...prev.purchases],
    }));
  };

  // Loyalty Program Handlers
  const handleAddWalletBonus = (customerId: string, points: number, walletAmt: number, note: string) => {
    const cust = data.customers.find(c => c.id === customerId);
    if (!cust) return;

    const newTxn = {
      id: 'wt-' + Math.random().toString(36).substr(2, 9),
      customerId,
      customerName: cust.name,
      date: new Date().toISOString().split('T')[0],
      type: 'Direct Bonus / Campaign Credit' as const,
      pointsChange: points,
      walletAmountChange: walletAmt,
      note,
    };

    const updatedCustomers = data.customers.map(c => {
      if (c.id === customerId) {
        return {
          ...c,
          loyaltyPoints: (c.loyaltyPoints || 0) + points,
          walletBalance: (c.walletBalance || 0) + walletAmt,
        };
      }
      return c;
    });

    setData(prev => ({
      ...prev,
      customers: updatedCustomers,
      walletTransactions: [newTxn, ...prev.walletTransactions],
    }));
  };

  const handleSendCampaignMessage = (campaign: LoyaltyCampaign, customer: Customer) => {
    const newLog: CommunicationLog = {
      id: 'comm-' + Math.random().toString(36).substr(2, 9),
      channel: 'WhatsApp',
      type: campaign.type === 'Birthday' ? 'Birthday Discount Offer' : 'Anniversary Special Promo',
      recipientName: customer.name,
      recipientPhone: customer.contact,
      message: `Happy ${campaign.type} ${customer.name}! Enjoy ${campaign.discountPct}% OFF with voucher code ${campaign.discountCode}. ${data.settings.company}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Delivered',
    };

    const cleanPhone = customer.contact.replace(/[^0-9]/g, '');
    window.open(`https://wa.me/${cleanPhone}?text=${encodeURIComponent(newLog.message)}`, '_blank');

    setData(prev => ({
      ...prev,
      communicationLogs: [newLog, ...prev.communicationLogs],
    }));
  };

  // HR & Payroll Handlers
  const handleAddAttendance = (punch: AttendancePunch) => {
    setData(prev => ({
      ...prev,
      attendance: [punch, ...prev.attendance],
    }));
  };

  const handleGeneratePayroll = (payroll: PayrollRun) => {
    setData(prev => ({
      ...prev,
      payrolls: [payroll, ...prev.payrolls],
    }));
  };

  const handleSyncPayrollToExpense = (payrollId: string) => {
    const payroll = data.payrolls.find(p => p.id === payrollId);
    if (!payroll) return;

    const newExpense: ExpenseVoucher = {
      id: 'exp-' + Math.random().toString(36).substr(2, 9),
      cat: 'Staff Salaries & Wages',
      desc: `Salary Disbursement for ${payroll.employeeName} (${payroll.month} ${payroll.year})`,
      amt: payroll.netSalary,
      date: new Date().toISOString().split('T')[0],
      branchId: payroll.branchId,
      paymentMode: 'Bank Transfer',
      taxDeductible: true,
      payrollRefId: payroll.id,
    };

    const updatedPayrolls = data.payrolls.map(p => 
      p.id === payrollId ? { ...p, syncedToExpense: true } : p
    );

    const updatedLogs = createAuditEntry(
      data.auditLogs,
      data.currentUser,
      data.currentUserRole,
      'EXPENSE_SYNC',
      'Payroll',
      `Auto-synced salary voucher of ${data.settings.currency} ${payroll.netSalary.toFixed(2)} for ${payroll.employeeName} into General Ledger expenses.`
    );

    setData(prev => ({
      ...prev,
      payrolls: updatedPayrolls,
      expenses: [newExpense, ...prev.expenses],
      auditLogs: updatedLogs,
    }));

    alert(`Salary for ${payroll.employeeName} (${data.settings.currency} ${payroll.netSalary.toFixed(2)}) successfully synced to Expense ledger!`);
  };

  const handleAddEmployee = (employee: Employee) => {
    setData(prev => ({
      ...prev,
      employees: [...prev.employees, employee],
    }));
  };

  // Communication & Reminders Handlers
  const handleSendManualMessage = (log: CommunicationLog) => {
    setData(prev => ({
      ...prev,
      communicationLogs: [log, ...prev.communicationLogs],
    }));
  };

  const handleTriggerPaymentReminder = (invoice: SalesInvoice, channel: 'WhatsApp' | 'SMS' | 'Both') => {
    const newLog: CommunicationLog = {
      id: 'comm-' + Math.random().toString(36).substr(2, 9),
      channel: channel === 'Both' ? 'WhatsApp' : channel,
      type: 'Payment Overdue Reminder',
      recipientName: invoice.custName,
      recipientPhone: invoice.contact || '0300-1234567',
      message: `Dear ${invoice.custName}, gentle reminder that Invoice #${invoice.inv} for ${data.settings.currency} ${invoice.amount.toFixed(2)} is overdue. Kindly clear dues to maintain credit limit.`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      status: 'Delivered',
    };

    setData(prev => ({
      ...prev,
      communicationLogs: [newLog, ...prev.communicationLogs],
    }));
  };

  // General Handlers
  const handleAddPurchase = (po: PurchaseOrder) => {
    setData(prev => ({
      ...prev,
      purchases: [po, ...prev.purchases],
    }));
  };

  const handleAddExpense = (expense: ExpenseVoucher) => {
    setData(prev => ({
      ...prev,
      expenses: [expense, ...prev.expenses],
    }));
  };

  const handleAddItem = (item: InventoryItem) => {
    setData(prev => ({
      ...prev,
      inventory: [item, ...prev.inventory],
    }));
  };

  const handleAddCustomer = (customer: Customer) => {
    setData(prev => ({
      ...prev,
      customers: [...prev.customers, customer],
    }));
  };

  const handleAddSupplier = (supplier: Supplier) => {
    setData(prev => ({
      ...prev,
      suppliers: [...prev.suppliers, supplier],
    }));
  };

  const handleSaveSettings = (settings: SystemSettings) => {
    setData(prev => ({
      ...prev,
      settings,
    }));
  };

  const handleGenerateEwayBill = (invoiceId: string, ewayNumber: string, vehicleNo: string, validTill: string) => {
    const updatedOrders = data.orders.map(o => {
      if (o.id === invoiceId) {
        return {
          ...o,
          eWayBillNo: ewayNumber,
          vehicleNo,
          eWayValidTill: validTill,
        };
      }
      return o;
    });

    const updatedLogs = createAuditEntry(
      data.auditLogs,
      data.currentUser,
      data.currentUserRole,
      'EWAY_GENERATED',
      'Logistics',
      `Generated E-Way Bill ${ewayNumber} for Invoice ID ${invoiceId}. Vehicle: ${vehicleNo}.`
    );

    setData(prev => ({
      ...prev,
      orders: updatedOrders,
      auditLogs: updatedLogs,
    }));
  };

  // Calculate inventory items with stock at or below configured reorder point
  const defaultReorderPoint = data.settings.inventoryReorderPoint ?? 20;
  const lowStockCount = data.inventory.filter(i => {
    const threshold = i.minStockAlert ?? i.minStockLevel ?? defaultReorderPoint;
    return (i.stock || 0) <= threshold;
  }).length;

  const unreconciledCount = data.bankStatements.filter(s => !s.reconciled).length;
  const pendingRemindersCount = data.orders.filter(o => o.status === 'Unpaid' || o.status === 'Overdue').length;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 flex flex-col text-slate-900 dark:text-slate-100 transition-colors duration-200">
        {/* Top Main Navigation Header */}
        <Header
        currentTabTitle={activeTab.charAt(0).toUpperCase() + activeTab.slice(1).replace('_', ' ')}
        branches={data.branches}
        currentBranchId={data.currentBranchId}
        onBranchChange={handleBranchChange}
        currentUserRole={data.currentUserRole}
        onRoleChange={handleRoleChange}
        onOpenNewInvoice={() => {}}
        onOpenBarcode={() => {}}
        onOpenClientPortal={() => setShowClientPortal(true)}
        onQuickRefresh={() => {}}
        searchTerm={globalSearchTerm}
        onSearchChange={setGlobalSearchTerm}
      />

      {/* Main Content Layout with Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          currentTab={activeTab}
          userRole={data.currentUserRole}
          onTabChange={setActiveTab}
          onLogout={handleLogout}
          lowStockCount={lowStockCount}
          unreconciledCount={unreconciledCount}
          pendingRemindersCount={pendingRemindersCount}
        />

        {/* Dynamic Tab Body */}
        <main className="flex-1 p-6 overflow-y-auto max-w-7xl mx-auto w-full">
          {activeTab === 'dashboard' && (
            <DashboardTab
              data={data}
              onNavigateTab={setActiveTab}
              onOpenStockTransfer={() => setShowStockTransferModal(true)}
              onOpenEwayModal={() => {
                setSelectedEwayInvoice(data.orders[0]);
                setShowEwayModal(true);
              }}
            />
          )}

          {activeTab === 'tax_filing' && (
            <TaxFilingTab
              orders={data.orders}
              gstFilings={data.gstFilings}
              settings={data.settings}
              userRole={data.currentUserRole}
              onSaveFiling={handleSaveFiling}
              onOpenEwayModal={(inv) => {
                setSelectedEwayInvoice(inv);
                setShowEwayModal(true);
              }}
            />
          )}

          {activeTab === 'tds_tcs' && (
            <TdsTcsTab
              tdsEntries={data.tdsEntries}
              tcsEntries={data.tcsEntries}
              settings={data.settings}
              onAddTds={handleAddTds}
              onAddTcs={handleAddTcs}
            />
          )}

          {activeTab === 'bank_reconciliation' && (
            <BankReconciliationTab
              bankStatements={data.bankStatements}
              cashbank={data.cashbank}
              settings={data.settings}
              onUpdateStatements={handleUpdateStatements}
              onAddTransaction={handleAddCashBankTxn}
            />
          )}

          {activeTab === 'multi_store' && (
            <MultiStoreTab
              branches={data.branches}
              stockTransfers={data.stockTransfers}
              inventory={data.inventory}
              suppliers={data.suppliers}
              purchases={data.purchases}
              settings={data.settings}
              userRole={data.currentUserRole}
              onOpenStockTransferModal={() => setShowStockTransferModal(true)}
              onReceiveStockTransfer={handleReceiveStockTransfer}
              onAddBranch={handleAddBranch}
              onDirectVendorOrder={handleDirectVendorOrder}
            />
          )}

          {activeTab === 'loyalty' && (
            <LoyaltyProgramTab
              customers={data.customers}
              walletTransactions={data.walletTransactions}
              loyaltyCampaigns={data.loyaltyCampaigns}
              settings={data.settings}
              onAddWalletBonus={handleAddWalletBonus}
              onSendCampaignMessage={handleSendCampaignMessage}
            />
          )}

          {activeTab === 'hr_payroll' && (
            <HrPayrollTab
              employees={data.employees}
              attendance={data.attendance}
              payrolls={data.payrolls}
              settings={data.settings}
              userRole={data.currentUserRole}
              onAddAttendance={handleAddAttendance}
              onGeneratePayroll={handleGeneratePayroll}
              onSyncPayrollToExpense={handleSyncPayrollToExpense}
              onAddEmployee={handleAddEmployee}
            />
          )}

          {activeTab === 'communication' && (
            <CommunicationTab
              logs={data.communicationLogs}
              reminders={data.paymentReminders}
              orders={data.orders}
              customers={data.customers}
              settings={data.settings}
              onSendManualMessage={handleSendManualMessage}
              onTriggerPaymentReminder={handleTriggerPaymentReminder}
            />
          )}

          {activeTab === 'orders' && (
            <SalesTab
              orders={data.orders}
              customers={data.customers}
              inventory={data.inventory}
              settings={data.settings}
              userRole={data.currentUserRole}
              onSaveInvoice={handleSaveInvoice}
              onOpenEwayModal={(inv) => {
                setSelectedEwayInvoice(inv);
                setShowEwayModal(true);
              }}
              onDeleteOrder={(id) => handleDeleteDocument('orders', id, 'Sales Invoice')}
            />
          )}

          {activeTab === 'quotations' && (
            <QuotationsTab
              quotations={data.quotations || []}
              customers={data.customers}
              inventory={data.inventory}
              settings={data.settings}
              userRole={data.currentUserRole}
              onSaveQuotation={handleSaveQuotation}
              onDeleteQuotation={(id) => handleDeleteDocument('quotations', id, 'Quotation')}
            />
          )}

          {activeTab === 'purchases' && (
            <PurchasesTab
              purchases={data.purchases}
              suppliers={data.suppliers}
              branches={data.branches}
              settings={data.settings}
              userRole={data.currentUserRole}
              onAddPurchase={handleAddPurchase}
              onDeletePurchase={(id) => handleDeleteDocument('purchases', id, 'Purchase Order')}
            />
          )}

          {activeTab === 'expenses' && (
            <ExpensesTab
              expenses={data.expenses}
              settings={data.settings}
              userRole={data.currentUserRole}
              onAddExpense={handleAddExpense}
              onDeleteExpense={(id) => handleDeleteDocument('expenses', id, 'Expense Voucher')}
            />
          )}

          {activeTab === 'inventory' && (
            <InventoryTab
              inventory={data.inventory}
              settings={data.settings}
              userRole={data.currentUserRole}
              onAddItem={handleAddItem}
              onOpenStockTransferModal={() => setShowStockTransferModal(true)}
            />
          )}

          {activeTab === 'parties' && (
            <PartiesTab
              customers={data.customers}
              suppliers={data.suppliers}
              settings={data.settings}
              onAddCustomer={handleAddCustomer}
              onAddSupplier={handleAddSupplier}
              onDeleteCustomer={(id) => handleDeleteDocument('customers', id, 'Customer Profile')}
              onDeleteSupplier={(id) => handleDeleteDocument('suppliers', id, 'Supplier Profile')}
            />
          )}

          {activeTab === 'cash_bank' && (
            <CashBankTab
              transactions={data.cashbank}
              settings={data.settings}
              userRole={data.currentUserRole}
              onAddTransaction={handleAddCashBankTxn}
              onNavigateToRecon={() => setActiveTab('bank_reconciliation')}
            />
          )}

          {activeTab === 'reports' && (
            <ReportsTab
              orders={data.orders}
              purchases={data.purchases}
              expenses={data.expenses}
              inventory={data.inventory}
              customers={data.customers}
              settings={data.settings}
              userRole={data.currentUserRole}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsTab
              settings={data.settings}
              onSaveSettings={handleSaveSettings}
            />
          )}
        </main>
      </div>

      {/* Global Modals */}
      {showClientPortal && (
        <ClientPortalModal
          customers={data.customers}
          orders={data.orders}
          walletTransactions={data.walletTransactions}
          settings={data.settings}
          onClose={() => setShowClientPortal(false)}
        />
      )}

      {showEwayModal && (
        <EwayBillModal
          invoice={selectedEwayInvoice}
          settings={data.settings}
          onClose={() => {
            setShowEwayModal(false);
            setSelectedEwayInvoice(undefined);
          }}
          onGenerateEway={handleGenerateEwayBill}
        />
      )}

      {showStockTransferModal && (
        <StockTransferModal
          branches={data.branches}
          inventory={data.inventory}
          onClose={() => setShowStockTransferModal(false)}
          onDispatchTransfer={handleDispatchStockTransfer}
        />
      )}
      </div>
    </ThemeContext.Provider>
  );
}
