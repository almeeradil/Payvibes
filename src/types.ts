export type UserRole = 'Admin' | 'Employee' | 'Staff Manager' | 'Accountant' | 'Cashier' | 'Store Manager';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  branchId: string;
}

export interface Branch {
  id: string;
  name: string;
  code: string;
  city: string;
  address: string;
  phone: string;
  manager: string;
  gstinNtn: string;
  isHq: boolean;
  status: 'Active' | 'Inactive';
}

export interface Customer {
  id: string;
  name: string;
  owner?: string;
  contact: string;
  email?: string;
  category: 'Retailer' | 'Wholesaler' | 'Corporate' | 'Individual' | string;
  address: string;
  province?: string;
  ntnCnic?: string;
  ntnGst?: string;
  drugLicenseNo?: string;
  credit?: number;
  balance?: number;
  creditLimit?: number;
  loyaltyPoints?: number;
  walletBalance?: number;
  tier?: 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  birthDate?: string;
  anniversaryDate?: string;
  branchId?: string;
  createdAt?: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  contact: string;
  email?: string;
  category?: string;
  address: string;
  ntnTax?: string;
  ntnGst?: string;
  credit?: number;
  balance?: number;
  bankDetails?: string;
  bankAccount?: string;
  branchId?: string;
  rating?: number;
  directRetailerEnabled?: boolean;
}

export interface InventoryItem {
  id: string;
  name: string;
  batch: string;
  barcode?: string;
  stock: number;
  unit?: string;
  expiry?: string;
  expiryDate?: string;
  purchasePrice?: number;
  costPrice?: number;
  salePrice?: number;
  price?: number;
  category: string;
  hsCode?: string;
  hsnCode?: string;
  minStockLevel?: number;
  minStockAlert?: number;
  branchId?: string;
}

export interface InvoiceItemRow {
  id?: string;
  prodId?: string;
  name?: string;
  prodName?: string;
  hsCode?: string;
  hsnCode?: string;
  batch?: string;
  expiryDate?: string;
  packSize?: string;
  bonusQty?: number;
  manufacturer?: string;
  unit?: string;
  qty: number;
  rate?: number;
  price?: number;
  taxPct?: number;
  taxPercent?: number;
  discount?: number;
  amount?: number;
  total?: number;
}

export type InvoiceItem = InvoiceItemRow;

export interface InvoiceHistoryEntry {
  id: string;
  timestamp: string;
  action: 'Created' | 'Updated' | 'Payment Recorded' | 'Status Changed' | 'E-Way Bill Generated' | 'Printed' | 'Reminder Sent' | string;
  userName: string;
  userRole?: string;
  details: string;
  changes?: { field: string; oldValue: string; newValue: string }[];
}

export interface SalesInvoice {
  id: string;
  inv: string;
  date: string;
  dueDate?: string;
  branchId?: string;
  branchName?: string;
  customerId?: string;
  custName: string;
  partyType?: string;
  custNtnCnic?: string;
  customerNtnGst?: string;
  custAddress?: string;
  custPhone?: string;
  contact?: string;
  custProvince?: string;
  items: InvoiceItemRow[];
  subtotal: number;
  taxPct?: number;
  taxAmount?: number;
  totalTax?: number;
  cgst?: number;
  sgst?: number;
  discount?: number;
  tdsRate?: number;
  tdsAmount?: number;
  tcsRate?: number;
  tcsAmount?: number;
  loyaltyPointsUsed?: number;
  loyaltyDiscount?: number;
  walletUsed?: number;
  amount: number;
  paidAmount?: number;
  status: 'Paid' | 'Partial' | 'Overdue' | 'Unpaid' | string;
  paymentMode: 'Cash' | 'Bank Transfer' | 'Digital Wallet' | 'Cheque' | 'Credit' | 'Credit / Pay Later' | 'Split' | string;
  
  // E-Invoicing & E-Way Bill
  irn?: string;
  ackNo?: string;
  ackDate?: string;
  qrCodeUrl?: string;
  eWayBillNo?: string;
  eWayValidTill?: string;
  vehicleNo?: string;
  
  // Reminders tracking
  remindersSentCount?: number;
  lastReminderDate?: string;
  loyaltyPointsEarned?: number;
  cashbackEarned?: number;
  history?: InvoiceHistoryEntry[];
}

export interface PurchaseInvoice {
  id: string;
  ref: string;
  date: string;
  dueDate?: string;
  branchId: string;
  supplierId?: string;
  supplier: string;
  supplierNtn?: string;
  item: string;
  qty: number;
  rate: number;
  taxPct?: number;
  tdsDeducted?: number;
  amt: number;
  paidAmount?: number;
  status?: 'Paid' | 'Pending' | 'Partial';
}

export interface PurchaseOrder {
  id: string;
  ref: string;
  supplier: string;
  item: string;
  amt: number;
  qty?: number;
  date: string;
  branchId: string;
  status: 'Pending' | 'Dispatched' | 'Received' | 'Cancelled';
  directVendorOrder?: boolean;
}

export interface Quotation {
  id: string;
  qno: string;
  customer: string;
  product: string;
  rate: number;
  discount: string;
  date: string;
  validTill?: string;
  branchId: string;
}

export interface DebitNote {
  id: string;
  ref: string;
  date: string;
  party: string;
  partyType: 'Customer' | 'Supplier';
  origInv: string;
  item: string;
  qty: number;
  rate: number;
  tax: number;
  amt: number;
  reason: string;
  branchId: string;
}

export interface ExpenseVoucher {
  id: string;
  ref?: string;
  cat?: string;
  category?: string;
  desc: string;
  amt?: number;
  amount?: number;
  date: string;
  branchId?: string;
  paymentMode?: string;
  paidTo?: string;
  mode?: string;
  taxDeductible?: boolean;
  payrollRefId?: string;
  linkedPayrollId?: string;
}

export type ExpenseRecord = ExpenseVoucher;

export interface CashBankTransaction {
  id: string;
  ref: string;
  date: string;
  account: 'Cash in Hand' | 'Bank Account' | 'Digital Merchant Account' | string;
  type: 'Deposit / In' | 'Withdraw / Out' | 'Transfer';
  desc: string;
  amount: number;
  branchId: string;
  reconciled?: boolean;
}

export interface OtherIncome {
  id: string;
  ref: string;
  date: string;
  source: string;
  desc: string;
  account: string;
  amount: number;
  branchId: string;
}

// ----------------- Stock Transfer -----------------
export interface StockTransfer {
  id: string;
  transferNo: string;
  date: string;
  fromBranchId: string;
  fromBranchName: string;
  toBranchId: string;
  toBranchName: string;
  itemId: string;
  itemName: string;
  batch: string;
  qty: number;
  status: 'Pending' | 'In-Transit' | 'Received' | 'Rejected';
  notes?: string;
  initiatedBy: string;
  receivedBy?: string;
  receivedDate?: string;
}

// ----------------- TDS & TCS -----------------
export interface TdsEntry {
  id: string;
  section: string; // '194C' | '194J' | '194Q' | '194I' | 'Section 153'
  partyName: string;
  partyPanNtn: string;
  partyType: 'Vendor' | 'Contractor' | 'Professional' | 'Landlord';
  invoiceRef: string;
  date: string;
  transactionAmount: number;
  tdsRate: number;
  tdsAmount: number;
  status: 'Deducted' | 'Deposited' | 'Certificate Issued';
  challanNo?: string;
  depositDate?: string;
}

export interface TcsEntry {
  id: string;
  section: string; // '206C(1H)' | '206C(1)'
  customerName: string;
  customerNtnGst: string;
  invoiceRef: string;
  date: string;
  saleAmount: number;
  tcsRate: number;
  tcsAmount: number;
  status: 'Collected' | 'Deposited';
}

// ----------------- Bank Reconciliation -----------------
export interface BankStatementRow {
  id: string;
  date: string;
  description: string;
  refNo: string;
  type: 'Credit' | 'Debit';
  amount: number;
  matchedTxnId?: string;
  matchStatus: 'Matched' | 'Unmatched' | 'Partial' | 'Adjusted';
  notes?: string;
}

// ----------------- GST Compliance -----------------
export interface GstFilingRecord {
  id: string;
  returnType: 'GSTR-1' | 'GSTR-3B' | 'GSTR-9' | 'E-Way Portal';
  periodMonth: string;
  periodYear: number;
  filingDate: string;
  arn: string;
  status: 'Validated' | 'Submitted' | 'Error' | 'Draft';
  totalTaxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  errorsDetected: string[];
  submittedBy: string;
  jsonPayload?: string;
}

// ----------------- Loyalty & Digital Wallet -----------------
export interface WalletTransaction {
  id: string;
  customerId: string;
  customerName: string;
  date: string;
  type: 'Cashback Credit' | 'Reward Points Converted' | 'Wallet Spend' | 'Manual Bonus' | string;
  pointsChange: number;
  walletAmountChange: number;
  invoiceRef?: string;
  note: string;
}

export interface LoyaltyCampaign {
  id: string;
  title: string;
  type: 'Birthday Special' | 'Anniversary Discount' | 'Points Multiplier' | 'Flash Sale' | string;
  discountPct: number;
  discountCode?: string;
  active: boolean;
  messageTemplate: string;
}

// ----------------- HR & Payroll -----------------
export interface Employee {
  id: string;
  employeeCode: string;
  name: string;
  designation: string;
  department: string;
  phone: string;
  email: string;
  cnic: string;
  joinDate: string;
  branchId: string;
  baseSalary: number;
  hourlyRate: number;
  shiftHoursPerDay: number;
  status: 'Active' | 'On Leave' | 'Terminated';
  biometricId?: string;
}

export interface AttendancePunch {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  punchInTime: string;
  punchOutTime?: string;
  hoursWorked: number;
  overtimeHours: number;
  method: 'Biometric Scanner' | 'Mobile App Selfie' | 'Manual Punch';
  status: 'Present' | 'Late' | 'Half Day' | 'Absent';
  verificationPhoto?: string;
  notes?: string;
}

export interface PayrollRun {
  id: string;
  month: string;
  year: number;
  dateGenerated: string;
  employeeId: string;
  employeeName: string;
  branchId: string;
  baseSalary: number;
  totalDaysPresent: number;
  totalHoursWorked: number;
  overtimePay: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'Draft' | 'Approved' | 'Disbursed';
  expenseVoucherRef?: string;
  syncedToExpense: boolean;
}

// ----------------- Communication & Reminders -----------------
export interface CommunicationLog {
  id: string;
  date?: string;
  timestamp?: string;
  channel: 'WhatsApp' | 'SMS' | 'Email';
  recipientName: string;
  recipientPhone: string;
  type?: string;
  templateType?: 'Payment Reminder' | 'Invoice Slip' | 'Loyalty Cashback' | 'Birthday Offer' | 'Custom' | string;
  message: string;
  status: 'Sent' | 'Delivered' | 'Failed' | 'Simulated';
  invoiceRef?: string;
}

export interface ReminderSetting {
  autoReminderEnabled: boolean;
  remindBeforeDays: number;
  remindOnDueDate: boolean;
  remindAfterOverdueDays: number;
  defaultChannel: 'WhatsApp' | 'SMS';
  templateText: string;
}

export type PaymentReminderSchedule = ReminderSetting;

// ----------------- Audit Trail -----------------
export interface AuditLog {
  id: string;
  timestamp: string;
  userName: string;
  userRole: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'RESTORE_BACKUP' | 'GST_FILE' | 'SYNC_EXPENSE' | 'STOCK_TRANSFER' | string;
  module: 'Sales' | 'Purchases' | 'Tax & GST' | 'Bank' | 'Stock' | 'HR & Payroll' | 'Settings' | 'Loyalty' | 'Security' | string;
  details: string;
  ipAddress: string;
  device: string;
  changesDiff?: string;
}

export interface SystemSettings {
  company: string;
  tagline: string;
  address: string;
  phone: string;
  email: string;
  ntn: string;
  strn: string;
  currency: string;
  tax: number;
  taxPercent?: number;
  tcsRate?: number;
  eWayBillThreshold?: number;
  autoSendWhatsapp?: boolean;
  enableLoyaltyProgram?: boolean;
  dlNo?: string;
  bank: string;
  footer: string;
  invPrefix: string;
  quoPrefix: string;
  gstinPortalKey?: string;
  eWayPortalKey?: string;
  whatsappApiKey?: string;
  smsGatewayApiKey?: string;
  companyLogo?: string;
  loyaltyPointsRate: number; // e.g. 1 point per 100 Rs
  cashbackPct: number; // e.g. 2% cashback
  autoSyncPayrollToExpense: boolean;
  inventoryReorderPoint?: number; // Global default reorder point threshold (e.g. 20)
  criticalStockThreshold?: number; // Critical emergency stock level (e.g. 5)
}

export interface AppStateData {
  currentUser?: string;
  currentUserRole?: UserRole;
  branches: Branch[];
  currentBranchId: string; // 'ALL_HQ' or specific branch id
  customers: Customer[];
  suppliers: Supplier[];
  inventory: InventoryItem[];
  orders: SalesInvoice[];
  purchaseinvoices: PurchaseInvoice[];
  purchases: PurchaseOrder[];
  quotations: Quotation[];
  debitnotes: DebitNote[];
  expenses: ExpenseRecord[];
  cashbank: CashBankTransaction[];
  otherincome: OtherIncome[];
  stockTransfers: StockTransfer[];
  tdsEntries: TdsEntry[];
  tcsEntries: TcsEntry[];
  bankStatements: BankStatementRow[];
  gstFilings: GstFilingRecord[];
  walletTransactions: WalletTransaction[];
  loyaltyCampaigns: LoyaltyCampaign[];
  paymentReminders?: any[];
  employees: Employee[];
  attendance: AttendancePunch[];
  payrolls: PayrollRun[];
  communicationLogs: CommunicationLog[];
  reminderSetting: ReminderSetting;
  auditLogs: AuditLog[];
  settings: SystemSettings;
  counters: {
    inv: number;
    pinv: number;
    quo: number;
    dn: number;
    po: number;
    pv: number;
    exp: number;
    cb: number;
    inc: number;
    transfer: number;
  };
  grow?: {
    gpName: string;
    gpCat: string;
    gpPhone: string;
    gpWeb: string;
    gpAddr: string;
    gpHours: string;
    mkMsg: string;
    stName: string;
    stLink: string;
    stDesc: string;
  };
  scans: Array<{ time: string; code: string; item: string; stock: string; price: string }>;
}
