// Posvibe Data Layer — default state + report/scanner/marketing handlers
// This file MUST load before app.js (app.js reads window.userData).

(function () {
  const today = new Date();
  const d = (offset) => {
    const x = new Date(today);
    x.setDate(x.getDate() - offset);
    return x.toISOString().split('T')[0];
  };

  const defaults = {
    currentUserRole: 'Admin',
    currentBranchId: 'ALL_HQ',
    branches: [
      { id: 'b-hq', name: 'Head Office', city: 'Lahore' },
      { id: 'b-2', name: 'Branch 2', city: 'Karachi' }
    ],
    settings: {
      company: 'Posvibe Traders',
      tagline: 'Retail & Distribution',
      address: 'Main Boulevard, Lahore',
      phone: '+92 3086707676',
      email: 'info@posvibe.pk',
      ntn: '1234567-8',
      strn: '32-77-8899-001',
      currency: 'Rs',
      tax: 18,
      bank: 'Meezan Bank — Posvibe Traders — PK00MEZN0000000001',
      footer: 'Goods once sold will not be taken back. Payment due in 7 days.',
      companyLogo: '',
      inventoryReorderPoint: 20
    },
    counters: { inv: 1, pinv: 1, po: 1, pv: 1, quo: 1, dn: 1, exp: 1, inc: 1, cb: 1 },
    orders: [
      { id: 'o-1', inv: 'INV-0001', date: d(1), custName: 'Al-Madina Store', custPhone: '03001234567', custNtnCnic: '35202-1234567-1', prodName: 'Panadol 500mg', qty: 20, uom: 'Pcs', rate: 250, taxPct: 18, amount: 5900, branchId: 'b-hq' },
      { id: 'o-2', inv: 'INV-0002', date: d(3), custName: 'City Pharmacy', custPhone: '03007654321', prodName: 'Surf Excel 1kg', qty: 10, uom: 'Pcs', rate: 850, taxPct: 18, amount: 10030, branchId: 'b-hq' },
      { id: 'o-3', inv: 'INV-0003', date: d(5), custName: 'Walk-in Customer', prodName: 'Nestle Milk Pack', qty: 48, uom: 'Pcs', rate: 220, taxPct: 18, amount: 12460, branchId: 'b-2' }
    ],
    quotations: [],
    debitnotes: [],
    purchaseinvoices: [
      { id: 'pi-1', ref: 'PINV-0001', date: d(6), supName: 'Unilever Distributors', item: 'Surf Excel 1kg', qty: 50, rate: 700, amt: 41300, branchId: 'b-hq' }
    ],
    purchases: [],
    payouts: [
      { id: 'pv-1', voucher: 'PV-0001', date: d(2), party: 'Unilever Distributors', mode: 'Bank', amount: 25000, branchId: 'b-hq' }
    ],
    expenses: [
      { id: 'e-1', ref: 'EXP-0001', date: d(4), category: 'HQ Rent Lease', description: 'Shop rent', amount: 75000, paidFrom: 'Bank Account', branchId: 'b-hq' },
      { id: 'e-2', ref: 'EXP-0002', date: d(4), category: 'Utility LESCO', description: 'Electricity bill', amount: 32400, paidFrom: 'Cash in Hand', branchId: 'b-hq' }
    ],
    otherincome: [],
    inventory: [
      { id: 'i-1', name: 'Panadol 500mg', barcode: '8964000112233', batch: 'B-1001', stock: 120, unit: 'Pcs', expiry: '2027-05-31', purchasePrice: 190, salePrice: 250, minStockAlert: 20, branchId: 'b-hq' },
      { id: 'i-2', name: 'Surf Excel 1kg', barcode: '8964000445566', batch: 'B-1002', stock: 8, unit: 'Pcs', expiry: '2028-01-31', purchasePrice: 700, salePrice: 850, minStockAlert: 15, branchId: 'b-hq' },
      { id: 'i-3', name: 'Nestle Milk Pack', barcode: '8964000778899', batch: 'B-1003', stock: 240, unit: 'Pcs', expiry: '2026-12-31', purchasePrice: 190, salePrice: 220, minStockAlert: 30, branchId: 'b-2' }
    ],
    stockTransfers: [],
    customers: [
      { id: 'c-1', name: 'Al-Madina Store', contact: '03001234567', address: 'Shalimar Road, Lahore', ntnCnic: '35202-1234567-1', category: 'Retailer', loyaltyPoints: 120, credit: 5900 },
      { id: 'c-2', name: 'City Pharmacy', contact: '03007654321', address: 'Saddar, Karachi', ntnCnic: '42101-7654321-3', category: 'Wholesaler', loyaltyPoints: 60, credit: 0 }
    ],
    suppliers: [
      { id: 's-1', name: 'Unilever Distributors', contact: '04235678900', address: 'Gulberg, Lahore', ntn: '0987654-3', payable: 16300 }
    ],
    patients: [],
    attendance: [],
    payrolls: [],
    cashbank: [
      { id: 'cb-1', ref: 'CB-0001', date: d(1), type: 'Cash In', account: 'Cash in Hand', description: 'Opening balance', amount: 150000 },
      { id: 'cb-2', ref: 'CB-0002', date: d(1), type: 'Bank In', account: 'Bank Account', description: 'Opening balance', amount: 500000 },
      { id: 'cb-3', ref: 'CB-0003', date: d(2), type: 'Bank Out', account: 'Bank Account', description: 'Supplier payout', amount: 25000 }
    ],
    gstFilings: [],
    tdsEntries: [],
    tcsEntries: [],
    ewayBills: [],
    bankStatements: [],
    auditLogs: [],
    scanLog: [],
    grow: { gpName: '', gpCat: '' },
    subscription: null
  };

  // Deep-ish merge: keep saved values, fill in anything missing.
  window.userData = window.userData || {};
  Object.keys(defaults).forEach((key) => {
    if (window.userData[key] === undefined || window.userData[key] === null) {
      window.userData[key] = defaults[key];
    } else if (
      key === 'settings' || key === 'counters' || key === 'grow'
    ) {
      window.userData[key] = Object.assign({}, defaults[key], window.userData[key]);
    }
  });

  const fmt = (n) => 'Rs ' + Number(n || 0).toLocaleString();
  const persist = () => {
    if (typeof window.persistData === 'function') window.persistData(true);
  };

  /* ---------------- Reports ---------------- */

  const REPORTS = {
    sales: {
      title: 'Sales Register',
      subtitle: 'All GST sales invoices',
      head: ['Invoice', 'Date', 'Customer', 'Item', 'Qty', 'Amount'],
      rows: () => (window.userData.orders || []).map((o) => ({
        date: o.date,
        search: [o.inv, o.custName, o.prodName].join(' '),
        amount: Number(o.amount || 0),
        cells: [o.inv, o.date, o.custName, o.prodName, o.qty, fmt(o.amount)]
      }))
    },
    purchases: {
      title: 'Purchase Register',
      subtitle: 'All purchase invoices',
      head: ['Ref', 'Date', 'Supplier', 'Item', 'Qty', 'Amount'],
      rows: () => (window.userData.purchaseinvoices || []).map((p) => ({
        date: p.date,
        search: [p.ref, p.supName, p.item].join(' '),
        amount: Number(p.amt || p.amount || 0),
        cells: [p.ref, p.date, p.supName || '-', p.item || '-', p.qty || 0, fmt(p.amt || p.amount)]
      }))
    },
    expenses: {
      title: 'Expense Report',
      subtitle: 'Business expenses by category',
      head: ['Ref', 'Date', 'Category', 'Description', 'Paid From', 'Amount'],
      rows: () => (window.userData.expenses || []).map((e) => ({
        date: e.date,
        search: [e.ref, e.category, e.description].join(' '),
        amount: Number(e.amount || 0),
        cells: [e.ref || '-', e.date, e.category, e.description || '-', e.paidFrom || '-', fmt(e.amount)]
      }))
    },
    stock: {
      title: 'Stock Summary',
      subtitle: 'Current inventory valuation',
      head: ['Item', 'Batch', 'Stock', 'Unit', 'Expiry', 'Stock Value'],
      rows: () => (window.userData.inventory || []).map((i) => ({
        date: i.expiry,
        search: [i.name, i.batch, i.barcode].join(' '),
        amount: Number(i.stock || 0) * Number(i.purchasePrice || 0),
        cells: [i.name, i.batch, i.stock, i.unit, i.expiry, fmt(Number(i.stock || 0) * Number(i.purchasePrice || 0))]
      }))
    },
    receivables: {
      title: 'Receivables (Customer Credit)',
      subtitle: 'Outstanding balances by customer',
      head: ['Customer', 'Contact', 'Category', 'Loyalty', 'Outstanding'],
      rows: () => (window.userData.customers || []).map((c) => ({
        date: '',
        search: [c.name, c.contact].join(' '),
        amount: Number(c.credit || 0),
        cells: [c.name, c.contact || '-', c.category || '-', (c.loyaltyPoints || 0) + ' pts', fmt(c.credit)]
      }))
    },
    cashbank: {
      title: 'Cash & Bank Ledger',
      subtitle: 'All treasury movements',
      head: ['Ref', 'Date', 'Type', 'Account', 'Description', 'Amount'],
      rows: () => (window.userData.cashbank || []).map((c) => ({
        date: c.date,
        search: [c.ref, c.account, c.description].join(' '),
        amount: Number(c.amount || 0),
        cells: [c.ref || '-', c.date, c.type, c.account, c.description || '-', fmt(c.amount)]
      }))
    }
  };

  let currentReport = 'sales';

  function renderReportsNav() {
    const nav = document.getElementById('reportsNav');
    if (!nav) return;
    nav.innerHTML = Object.keys(REPORTS).map((key) => `
      <button data-report="${key}" onclick="openReport('${key}')"
        class="w-full text-left px-3 py-2 rounded-lg text-[11px] font-bold text-slate-600 hover:bg-slate-100 transition">
        <i class="fa-solid fa-file-lines mr-2 text-orange-500"></i>${REPORTS[key].title}
      </button>
    `).join('');
  }

  function openReport(key) {
    currentReport = key in REPORTS ? key : 'sales';
    if (typeof window.showTab === 'function') window.showTab('reports');
    renderReport();
  }

  function renderReport() {
    const def = REPORTS[currentReport];
    if (!def) return;
    const titleEl = document.getElementById('reportTitle');
    const subEl = document.getElementById('reportSubtitle');
    const headEl = document.getElementById('reportHead');
    const bodyEl = document.getElementById('reportBody');
    const sumEl = document.getElementById('reportSummary');
    if (titleEl) titleEl.innerText = def.title;
    if (subEl) subEl.innerText = def.subtitle;

    const from = (document.getElementById('repFrom') || {}).value || '';
    const to = (document.getElementById('repTo') || {}).value || '';
    const q = (((document.getElementById('repSearch') || {}).value) || '').toLowerCase().trim();

    let rows = def.rows();
    if (from) rows = rows.filter((r) => !r.date || r.date >= from);
    if (to) rows = rows.filter((r) => !r.date || r.date <= to);
    if (q) rows = rows.filter((r) => (r.search || '').toLowerCase().includes(q));

    if (headEl) {
      headEl.innerHTML = def.head.map((h) => `<th class="p-3 text-left font-bold">${h}</th>`).join('');
    }
    if (bodyEl) {
      bodyEl.innerHTML = rows.length
        ? rows.map((r) => `<tr class="hover:bg-slate-50">${r.cells.map((c) => `<td class="p-3">${c}</td>`).join('')}</tr>`).join('')
        : `<tr><td colspan="${def.head.length}" class="p-4 text-center text-slate-400">No records for the selected filters.</td></tr>`;
    }
    if (sumEl) {
      const total = rows.reduce((s, r) => s + Number(r.amount || 0), 0);
      const avg = rows.length ? total / rows.length : 0;
      const card = (label, value, color) => `
        <div class="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div class="text-[10px] font-bold uppercase text-slate-400">${label}</div>
          <div class="text-lg font-black ${color} mt-1">${value}</div>
        </div>`;
      sumEl.innerHTML = [
        card('Records', rows.length, 'text-slate-900'),
        card('Total Value', fmt(total), 'text-orange-600'),
        card('Average', fmt(Math.round(avg)), 'text-cyan-600'),
        card('Period', from || to ? `${from || 'start'} → ${to || 'today'}` : 'All time', 'text-slate-700')
      ].join('');
    }
  }

  function clearReportFilters() {
    ['repFrom', 'repTo', 'repSearch'].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = '';
    });
    renderReport();
  }

  function printReport() {
    const def = REPORTS[currentReport];
    const table = document.getElementById('reportTable');
    if (!def || !table) return;
    const s = window.userData.settings || {};
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`
      <html><head><title>${def.title}</title>
      <style>
        body{font-family:Arial,Helvetica,sans-serif;padding:24px;color:#0f172a}
        h1{font-size:18px;margin:0}
        p{font-size:12px;color:#475569;margin:4px 0 16px}
        table{width:100%;border-collapse:collapse;font-size:12px}
        th,td{border:1px solid #cbd5e1;padding:6px 8px;text-align:left}
        th{background:#f1f5f9}
      </style></head><body>
      <h1>${s.company || 'Posvibe'} — ${def.title}</h1>
      <p>${s.address || ''} • ${s.phone || ''} • Printed ${new Date().toLocaleString()}</p>
      ${table.outerHTML}
      </body></html>`);
    win.document.close();
    win.focus();
    win.print();
  }

  /* ---------------- Barcode scanner ---------------- */

  function renderScanLog() {
    const tbody = document.getElementById('scanTableBody');
    if (!tbody) return;
    const log = window.userData.scanLog || [];
    tbody.innerHTML = log.length
      ? log.map((s) => `
        <tr class="border-b border-slate-100">
          <td class="p-3">${s.time}</td>
          <td class="p-3 font-mono">${s.code}</td>
          <td class="p-3 font-bold">${s.item}</td>
          <td class="p-3">${s.stock}</td>
          <td class="p-3 font-bold text-orange-600">${s.price === '-' ? '-' : fmt(s.price)}</td>
        </tr>`).join('')
      : '<tr><td colspan="5" class="p-4 text-center text-slate-400">No scans yet.</td></tr>';
  }

  function handleBarcodeScan() {
    const input = document.getElementById('barcodeInput');
    const result = document.getElementById('barcodeResult');
    const code = input ? input.value.trim() : '';
    if (!code) {
      if (result) result.innerHTML = '<div class="text-rose-600 font-bold">Please scan or type a barcode / item name.</div>';
      return;
    }
    const lower = code.toLowerCase();
    const item = (window.userData.inventory || []).find(
      (i) => String(i.barcode || '').toLowerCase() === lower ||
             String(i.batch || '').toLowerCase() === lower ||
             String(i.name || '').toLowerCase().includes(lower)
    );

    if (result) {
      result.innerHTML = item
        ? `<div class="p-4 rounded-xl border border-emerald-200 bg-emerald-50">
             <div class="font-black text-slate-900 text-sm">${item.name}</div>
             <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 text-[11px]">
               <div><span class="text-slate-500 block">Batch</span><b>${item.batch || '-'}</b></div>
               <div><span class="text-slate-500 block">Stock</span><b class="${Number(item.stock) < 10 ? 'text-rose-600' : ''}">${item.stock}</b> ${item.unit || ''}</div>
               <div><span class="text-slate-500 block">Sale Price</span><b class="text-orange-600">${fmt(item.salePrice)}</b></div>
               <div><span class="text-slate-500 block">Expiry</span><b>${item.expiry || '-'}</b></div>
             </div>
           </div>`
        : `<div class="p-4 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 font-bold">No item found for "${code}".</div>`;
    }

    if (!window.userData.scanLog) window.userData.scanLog = [];
    window.userData.scanLog.unshift({
      time: new Date().toLocaleTimeString(),
      code: code,
      item: item ? item.name : 'Not found',
      stock: item ? item.stock : '-',
      price: item ? item.salePrice : '-'
    });
    window.userData.scanLog = window.userData.scanLog.slice(0, 25);
    persist();
    renderScanLog();
    if (input) {
      input.value = '';
      input.focus();
    }
  }

  function clearScanLog() {
    window.userData.scanLog = [];
    persist();
    renderScanLog();
    const result = document.getElementById('barcodeResult');
    if (result) result.innerHTML = '';
  }

  /* ---------------- Grow / marketing ---------------- */

  function saveGrowSettings() {
    const name = (document.getElementById('gpName') || {}).value || '';
    const cat = (document.getElementById('gpCat') || {}).value || '';
    window.userData.grow = { gpName: name, gpCat: cat };
    persist();
    if (typeof window.logAuditEvent === 'function') {
      window.logAuditEvent('UPDATE', 'Google Profile', `Profile saved: ${name}`);
    }
    alert('Google Business profile saved.');
  }

  function shareMarketing(channel) {
    const msg = ((document.getElementById('mkMsg') || {}).value || '').trim();
    if (!msg) {
      alert('Please write a message first.');
      return;
    }
    const numbers = (window.userData.customers || [])
      .map((c) => String(c.contact || '').replace(/[^0-9]/g, ''))
      .filter(Boolean);
    if (numbers.length === 0) {
      alert('No customer contact numbers found.');
      return;
    }
    const first = numbers[0].replace(/^0/, '92');
    const url = channel === 'sms'
      ? `sms:${numbers.join(',')}?body=${encodeURIComponent(msg)}`
      : `https://wa.me/${first}?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
    if (typeof window.logAuditEvent === 'function') {
      window.logAuditEvent('SEND', 'Marketing', `${channel} broadcast to ${numbers.length} customers`);
    }
  }

  /* ---------------- Expose + boot ---------------- */

  window.openReport = openReport;
  window.renderReport = renderReport;
  window.clearReportFilters = clearReportFilters;
  window.printReport = printReport;
  window.handleBarcodeScan = handleBarcodeScan;
  window.clearScanLog = clearScanLog;
  window.renderScanLog = renderScanLog;
  window.saveGrowSettings = saveGrowSettings;
  window.shareMarketing = shareMarketing;

  function boot() {
    renderReportsNav();
    renderScanLog();
    const grow = window.userData.grow || {};
    const gpName = document.getElementById('gpName');
    const gpCat = document.getElementById('gpCat');
    if (gpName) gpName.value = grow.gpName || '';
    if (gpCat) gpCat.value = grow.gpCat || '';
    const input = document.getElementById('barcodeInput');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          handleBarcodeScan();
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
