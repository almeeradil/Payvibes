// Posvibe Enterprise ERP Engine (Full Featured Vanilla JS)

const masterMedicinesList = [
  "Panadol Tablet 500mg", "Panadol CF", "Panadol Extra", "Panadol Extend", "Brufen Tablet 400mg", "Brufen Syrup", "Calpol Syrup",
  "Augmentin Tablet 625mg", "Augmentin Tablet 1g", "Augmentin Syrup 457mg", "Amoxil Capsule 500mg", "Amoxil Syrup",
  "Flagyl Tablet 400mg", "Flagyl Syrup", "Risek Capsule 20mg", "Risek Capsule 40mg", "Omega Capsule 20mg", "Nexum 40mg",
  "Gaviscon Syrup", "Gaviscon Liquid 120ml", "Gravinate Tablet", "Gravinate Syrup", "Buscopan Tablet", "Ponstan Forte Tablet",
  "Nuberol Forte Tablet", "Voveran Tablet 50mg", "Voveran Injection", "Dicloran SR", "Voltaren Emulgel", "Arinac Tablet",
  "Velosef Capsule 500mg", "Velosef Syrup", "Cefspan Tablet 200mg", "Cefspan Suspension", "Cefixime Tablet 400mg",
  "Zithromax Tablet 250mg", "Azomax Tablet 500mg", "Klaricid Tablet 500mg", "Ciproxin Tablet 500mg", "Lomotil Tablet",
  "Imodium Capsule", "Entamizole Tablet", "Motilium Tablet", "Motilium Syrup", "Avil Tablet", "Avil Injection", "Rigix Tablet",
  "Zyrtec Tablet", "Telfast Tablet 120mg", "Telfast Tablet 180mg", "Montiget Tablet 10mg", "Singulair Tablet 10mg",
  "Ventolin Inhaler", "Seretide Inhaler 250", "Symbicort Inhaler", "Glucophage Tablet 500mg", "Glucophage XR 1000mg",
  "Getryl 2mg", "Getryl 4mg", "Galvus 50mg", "Janumet 50/500", "Atorvastatin 20mg", "Rosuvas Tablet 10mg", "Concor Tablet 5mg",
  "Norvasc Tablet 5mg", "Plavix Tablet 75mg", "Loprin 75mg", "Disprin Tablet", "Surbex-Z Tablet", "Cac-1000 Plus", "Neurobion Injection",
  "Polyfax Skin Ointment", "Betnovate-N Cream", "Dermovate Cream", "Fucidin Ointment", "Canesten Cream", "Quinine Sulfate"
];

const INITIAL_BRANCHES = [
  { id: 'b-hq', name: 'Central HQ (Main Hub)', code: 'HQ-01', city: 'Lahore', isHq: true },
  { id: 'b-khi', name: 'Karachi Mega Center', code: 'BR-KHI', city: 'Karachi', isHq: false },
  { id: 'b-isb', name: 'Islamabad Federal Express', code: 'BR-ISB', city: 'Islamabad', isHq: false }
];

let userData = {
  branches: INITIAL_BRANCHES,
  currentBranchId: 'ALL_HQ',
  currentUserRole: 'Admin',
  orders: [
    {
      inv: 'INV-1001',
      date: '2026-08-18',
      dueDate: '2026-08-25',
      custName: 'Al-Madina Medical Complex',
      custNtnCnic: '35202-1234567-1',
      custAddress: 'Shop # 12, Hospital Road, Lahore',
      custProvince: 'Punjab',
      custPhone: '0300-4567890',
      prodName: 'Augmentin Tablet 625mg',
      hsCode: '3004.90',
      uom: 'Boxes',
      qty: 10,
      rate: 340,
      taxPct: 18,
      discount: 100,
      tdsAmount: 0,
      tcsAmount: 3.9,
      amount: 3915.9,
      status: 'Paid',
      paymentMode: 'Bank Transfer',
      branchId: 'b-hq',
      irn: 'IRN-90812938129031',
      eWayBillNo: 'EWB-89012390123'
    },
    {
      inv: 'INV-1002',
      date: '2026-08-19',
      dueDate: '2026-08-20',
      custName: 'Shifa Pharmacy & Wellness',
      custNtnCnic: '61101-7654321-3',
      custAddress: 'F-7 Markaz, Islamabad',
      custProvince: 'Islamabad',
      custPhone: '0321-9876543',
      prodName: 'Panadol Tablet 500mg',
      hsCode: '3004.90',
      uom: 'Pcs',
      qty: 50,
      rate: 35,
      taxPct: 18,
      discount: 50,
      amount: 2015,
      status: 'Unpaid',
      paymentMode: 'Credit',
      branchId: 'b-isb',
      irn: 'IRN-77881122334455'
    }
  ],
  purchaseinvoices: [
    { ref: 'PINV-5001', date: '2026-08-15', supplier: 'Getz Pharma Ltd', item: 'Augmentin Tablet 625mg', qty: 100, rate: 260, amt: 26000, branchId: 'b-hq' },
    { ref: 'PINV-5002', date: '2026-08-17', supplier: 'GSK Pakistan', item: 'Panadol Tablet 500mg', qty: 500, rate: 22, amt: 11000, branchId: 'b-hq' }
  ],
  quotations: [
    { qno: 'QT-101', customer: 'HealthCare Clinic', product: 'Ventolin Inhaler', rate: 450, discount: '5% Special', date: '2026-08-18', branchId: 'b-hq' }
  ],
  patients: [
    { name: 'Muhammad Usman', age: 34, gender: 'Male', contact: '0300-1122334', address: 'Gulberg III, Lahore', doctor: 'Dr. Shakeel Ahmed', service: 'Consultation & BP Check', fee: 1000, status: 'Paid' }
  ],
  debitnotes: [
    { ref: 'DN-201', date: '2026-08-18', party: 'Getz Pharma Ltd', origInv: 'PINV-5001', item: 'Augmentin Tablet 625mg', qty: 5, rate: 260, tax: 234, amt: 1534, reason: 'Damaged Goods' }
  ],
  inventory: [
    { id: 'i-1', name: 'Augmentin Tablet 625mg', batch: 'AUG-9081', stock: 85, unit: 'Boxes', expiry: '2027-05-15', purchasePrice: 260, salePrice: 340, category: 'Antibiotics', branchId: 'b-hq' },
    { id: 'i-2', name: 'Panadol Tablet 500mg', batch: 'PAN-4402', stock: 450, unit: 'Pcs', expiry: '2028-01-10', purchasePrice: 22, salePrice: 35, category: 'Analgesics', branchId: 'b-hq' },
    { id: 'i-3', name: 'Risek Capsule 20mg', batch: 'RSK-1092', stock: 4, unit: 'Boxes', expiry: '2026-09-30', purchasePrice: 310, salePrice: 420, category: 'Gastroenterology', branchId: 'b-hq' },
    { id: 'i-4', name: 'Ventolin Inhaler', batch: 'VNT-3311', stock: 25, unit: 'Pcs', expiry: '2027-11-20', purchasePrice: 340, salePrice: 450, category: 'Respiratory', branchId: 'b-khi' }
  ],
  customers: [
    { id: 'c-1', name: 'Al-Madina Medical Complex', owner: 'Dr. Shakeel Ahmed', contact: '0300-4567890', email: 'almadina@gmail.com', category: 'Wholesaler', address: 'Shop # 12, Hospital Road, Lahore', ntnCnic: '35202-1234567-1', credit: 45000, loyaltyPoints: 340, walletBalance: 1250, branchId: 'b-hq' },
    { id: 'c-2', name: 'Shifa Pharmacy & Wellness', owner: 'Mr. Kamran Javed', contact: '0321-9876543', email: 'shifa@outlook.com', category: 'Retailer', address: 'F-7 Markaz, Islamabad', ntnCnic: '61101-7654321-3', credit: 2015, loyaltyPoints: 85, walletBalance: 200, branchId: 'b-isb' }
  ],
  suppliers: [
    { id: 's-1', name: 'Getz Pharma Ltd', contactPerson: 'Mr. Bilal Khan', contact: '042-35889900', email: 'orders@getzpharma.com', address: '29-30/27, K.I.A., Karachi', ntnTax: '0711928-4', credit: 65000, branchId: 'b-hq' },
    { id: 's-2', name: 'GSK Pakistan', contactPerson: 'Mr. Tariq Mehmood', contact: '021-111475755', email: 'distribution@gsk.pk', address: 'Dockyard Road, West Wharf, Karachi', ntnTax: '0812394-1', credit: 42000, branchId: 'b-hq' }
  ],
  purchases: [
    { ref: 'PO-1001', supplier: 'Getz Pharma Ltd', item: 'Risek Capsule 20mg', amt: 15500, date: '2026-08-18', branchId: 'b-hq' }
  ],
  payouts: [
    { voucher: 'PV-1001', recipient: 'Getz Pharma Ltd', mode: 'Bank Transfer', amount: 25000, date: '2026-08-18' }
  ],
  expenses: [
    { ref: 'EXP-1', date: '2026-08-01', category: 'Rent', desc: 'HQ Warehouse Lease - August 2026', paidTo: 'Al-Rehman Real Estate', mode: 'Bank', amount: 75000, branchId: 'b-hq' },
    { ref: 'EXP-2', date: '2026-08-05', category: 'Utilities', desc: 'Commercial Electric Bill LESCO', paidTo: 'LESCO Lahore', mode: 'Bank', amount: 32400, branchId: 'b-hq' }
  ],
  cashbank: [
    { ref: 'CB-1', date: '2026-08-01', account: 'Bank Account', type: 'Deposit / In', desc: 'Opening Bank Balance', amount: 450000, reconciled: true },
    { ref: 'CB-2', date: '2026-08-02', account: 'Cash in Hand', type: 'Deposit / In', desc: 'Cash Register Opening', amount: 85000, reconciled: true }
  ],
  otherincome: [
    { ref: 'INC-1', date: '2026-08-10', source: 'Commission', desc: 'Pharma Company Marketing Rebate', account: 'Bank Account', amount: 18500 }
  ],
  // Enterprise Extensions
  tdsEntries: [
    { id: 'tds-1', section: 'Section 153 / 194Q', partyName: 'Getz Pharma Ltd', partyType: 'Vendor', invoiceRef: 'PINV-5001', date: '2026-08-15', transactionAmount: 26000, tdsRate: 2, tdsAmount: 520, status: 'Deducted' }
  ],
  tcsEntries: [
    { id: 'tcs-1', section: 'Section 206C(1H)', customerName: 'Al-Madina Medical Complex', invoiceRef: 'INV-1001', date: '2026-08-18', saleAmount: 3915.9, tcsRate: 0.1, tcsAmount: 3.9, status: 'Collected' }
  ],
  bankStatements: [
    { id: 'bs-1', date: '2026-08-18', description: 'ONLINE FT: AL MADINA MED INV-1001', refNo: 'TXN-901823', type: 'Credit', amount: 3915.9, matchStatus: 'Matched' },
    { id: 'bs-2', date: '2026-08-18', description: 'IBFT OUT: GETZ PHARMA PV-1001', refNo: 'TXN-881290', type: 'Debit', amount: 25000, matchStatus: 'Matched' },
    { id: 'bs-3', date: '2026-08-19', description: 'UNLINKED CASH DEPOSIT OVER COUNTER', refNo: 'DEP-449102', type: 'Credit', amount: 15000, matchStatus: 'Unmatched' }
  ],
  gstFilings: [
    { id: 'gst-1', returnType: 'GSTR-1', periodMonth: 'July', periodYear: 2026, filingDate: '2026-08-11', arn: 'ARN-GST-2026-0789012', status: 'Submitted', totalTaxable: 450000, totalTax: 81000, errorsDetected: [], submittedBy: 'Accountant' }
  ],
  stockTransfers: [
    { id: 'st-1', transferNo: 'TRF-1001', fromBranchName: 'Central HQ', toBranchName: 'Karachi Mega Center', itemName: 'Augmentin Tablet 625mg', batch: 'AUG-9081', qty: 25, date: '2026-08-18', status: 'In-Transit', notes: 'Vehicle LHE-8921 Driver Tariq' }
  ],
  ewayBills: [
    {
      id: 'ewb-1',
      ewbNo: 'EWB-89012390123',
      date: '2026-08-18',
      validUntil: '2026-08-22',
      invNo: 'INV-1001',
      irn: 'IRN-90812938129031',
      fromGstin: '35202-0000000-1 (Lahore HQ Hub)',
      toGstin: '35202-1234567-1 (Punjab)',
      recipient: 'Al-Madina Medical Complex',
      destination: 'Shop # 12, Hospital Road, Lahore',
      transporter: 'TCS Express Logistics',
      transporterId: 'TRANS-9901',
      vehicleNo: 'LHE-9012',
      distanceKm: 45,
      cargoValue: 3915.9,
      itemSummary: 'Augmentin Tablet 625mg (10 Boxes)',
      hsnCode: '3004.90',
      status: 'In-Transit'
    },
    {
      id: 'ewb-2',
      ewbNo: 'EWB-77182903411',
      date: '2026-08-19',
      validUntil: '2026-08-24',
      invNo: 'INV-1002',
      irn: 'IRN-77881122334455',
      fromGstin: '61101-0000000-2 (Islamabad Hub)',
      toGstin: '61101-7654321-3 (Federal)',
      recipient: 'Shifa Pharmacy & Wellness',
      destination: 'F-7 Markaz, Islamabad',
      transporter: 'Leopard Courier & Freight',
      transporterId: 'LEO-4402',
      vehicleNo: 'ISB-4411',
      distanceKm: 18,
      cargoValue: 2015.0,
      itemSummary: 'Panadol Tablet 500mg (50 Pcs)',
      hsnCode: '3004.90',
      status: 'Active'
    }
  ],
  employees: [
    { id: 'emp-1', employeeCode: 'EMP-101', name: 'Bilal Ahmad', designation: 'Store Pharmacist', department: 'Pharmacy Operations', phone: '0301-2233445', baseSalary: 55000, status: 'Active' },
    { id: 'emp-2', employeeCode: 'EMP-102', name: 'Zainab Bibi', designation: 'Head Accountant', department: 'Accounts & Tax', phone: '0322-8899001', baseSalary: 70000, status: 'Active' }
  ],
  attendance: [
    { id: 'att-1', employeeName: 'Bilal Ahmad', date: '2026-08-19', punchInTime: '08:58 AM', hoursWorked: 8.5, status: 'Present', method: 'Biometric Scanner' },
    { id: 'att-2', employeeName: 'Zainab Bibi', date: '2026-08-19', punchInTime: '09:02 AM', hoursWorked: 8.0, status: 'Present', method: 'Mobile App Selfie' }
  ],
  payrolls: [
    { id: 'pr-1', month: 'July', year: 2026, employeeName: 'Bilal Ahmad', baseSalary: 55000, netSalary: 55000, status: 'Disbursed', syncedToExpense: true }
  ],
  communicationLogs: [
    { id: 'log-1', date: '2026-08-19 10:15 AM', channel: 'WhatsApp', recipientName: 'Al-Madina Medical Complex', recipientPhone: '0300-4567890', templateType: 'Invoice Slip', message: 'Dear Customer, your invoice INV-1001 for Rs 3915.90 is generated. View details: https://payvibes.pk/inv/INV-1001', status: 'Delivered' }
  ],
  auditLogs: [
    { id: 'aud-1', timestamp: '2026-08-19 09:00 AM', userName: 'Admin', userRole: 'Admin', action: 'LOGIN', module: 'Security', details: 'Authenticated from HQ Admin Terminal.' },
    { id: 'aud-2', timestamp: '2026-08-19 10:10 AM', userName: 'Cashier', userRole: 'Cashier', action: 'CREATE', module: 'Sales', details: 'Generated Sales Invoice INV-1001 (Amount: Rs 3915.90)' }
  ],
  activities: [],
  scans: [],
  settings: {
    company: 'Payvibes Pharma & General Store',
    tagline: 'Invoicematic & Inventory Management Solution',
    address: 'Main Commercial Plaza, Ferozepur Road, Lahore, Pakistan',
    phone: '+92 3086707676',
    email: 'info@payvibes.pk',
    ntn: 'NTN-7890123-4',
    strn: 'STRN-3200981-5',
    currency: 'Rs',
    tax: 18,
    bank: 'Meezan Bank Ltd | Payvibes Corporate Account | IBAN: PK65MEZN000192837482',
    footer: 'Goods once sold will not be returned without original computer-generated invoice. Subject to Lahore Jurisdiction.',
    invPrefix: 'INV-',
    quoPrefix: 'QT-'
  },
  counters: { inv: 1003, pinv: 5003, quo: 102, dn: 202, po: 1002, pv: 1002, exp: 3, cb: 3, inc: 2 }
};

window.masterMedicinesList = masterMedicinesList;
window.INITIAL_BRANCHES = INITIAL_BRANCHES;
window.userData = userData;
