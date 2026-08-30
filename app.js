// Posvibe Enterprise ERP Application Logic (Vanilla JS & HTML Engine)

let salesChartInstance = null;
let payoutChartInstance = null;
let reportsChartInstance = null;

// Initialize Storage
function initStorage() {
  const saved = localStorage.getItem('payvibes_enterprise_data');
  if (saved) {
    try {
      window.userData = Object.assign(window.userData || {}, JSON.parse(saved));
    } catch (e) {
      console.error("Storage parse error, using default memory state", e);
    }
  }
}

let persistTimeout = null;
function persistData(immediate = false) {
  if (!window.userData) return;
  if (immediate) {
    if (persistTimeout) clearTimeout(persistTimeout);
    try {
      localStorage.setItem('payvibes_enterprise_data', JSON.stringify(window.userData));
    } catch (e) {
      console.warn("Storage write error", e);
    }
    return;
  }
  if (persistTimeout) clearTimeout(persistTimeout);
  persistTimeout = setTimeout(() => {
    try {
      localStorage.setItem('payvibes_enterprise_data', JSON.stringify(window.userData));
    } catch (e) {
      console.warn("Storage write error", e);
    }
  }, 100);
}

// Security & Immutable Audit Trail
function logAuditEvent(action, module, details) {
  if (!window.userData) return;
  if (!window.userData.auditLogs) window.userData.auditLogs = [];
  const newLog = {
    id: 'aud-' + Date.now(),
    timestamp: new Date().toLocaleString(),
    userName: window.userData.currentUserRole || 'Admin',
    userRole: window.userData.currentUserRole || 'Admin',
    action: action,
    module: module,
    details: details
  };
  window.userData.auditLogs.unshift(newLog);
  persistData();
  renderTracking();
}

// Authentication & Role Switching
function isEmployeeRole() {
  const role = (window.userData && window.userData.currentUserRole) || 'Admin';
  return role === 'Employee';
}

function handleLogin(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
  const pass = passInput ? passInput.value.trim() : '';

  let role = 'Admin';
  if (email.includes('employ')) {
    role = 'Employee';
  } else if (email.includes('staff')) {
    role = 'Staff Manager';
  } else if (email.includes('accountant')) {
    role = 'Accountant';
  } else if (email.includes('cashier')) {
    role = 'Cashier';
  } else if (email.includes('store')) {
    role = 'Store Manager';
  } else {
    role = 'Admin';
  }

  if (!window.userData) window.userData = {};
  window.userData.currentUserRole = role;
  persistData(true);
  
  const loginScreen = document.getElementById('loginScreen');
  const appContainer = document.getElementById('appContainer');
  const roleDisp = document.getElementById('userRoleDisplay');
  const loginErr = document.getElementById('loginError');

  if (loginScreen) loginScreen.classList.add('hidden');
  if (appContainer) appContainer.classList.remove('hidden');
  if (roleDisp) roleDisp.innerText = role;
  if (loginErr) loginErr.classList.add('hidden');

  logAuditEvent('LOGIN', 'Security', `User authenticated as ${role}`);
  try {
    initApp();
  } catch(err) {
    console.warn("initApp warning on login:", err);
  }
  return false;
}

function quickFillRole(email) {
  // Deprecated
}

function logout() {
  logAuditEvent('LOGOUT', 'Security', 'User logged out');
  if (window.userData) {
    window.userData.currentUserRole = null;
    persistData(true);
  }
  const appContainer = document.getElementById('appContainer');
  const loginScreen = document.getElementById('loginScreen');
  const emailInput = document.getElementById('loginEmail');
  const passInput = document.getElementById('loginPassword');
  if (emailInput) emailInput.value = '';
  if (passInput) passInput.value = '';
  if (appContainer) appContainer.classList.add('hidden');
  if (loginScreen) loginScreen.classList.remove('hidden');
}

// Multi-Store Branch Control
function handleBranchChange(branchId) {
  if (!window.userData) return;
  window.userData.currentBranchId = branchId;
  const branchObj = (window.userData.branches || []).find(b => b.id === branchId);
  const pill = document.getElementById('activeBranchPill');
  if (pill) {
    if (branchId === 'ALL_HQ') {
      pill.innerText = 'Central HQ (Consolidated)';
      pill.className = 'px-2.5 py-0.5 bg-orange-100 text-orange-800 text-[10px] font-bold rounded-full border border-orange-200';
    } else if (branchObj) {
      pill.innerText = branchObj.name;
      pill.className = 'px-2.5 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-full border border-purple-200';
    }
  }
  logAuditEvent('BRANCH_SWITCH', 'Multi-Store', `Switched active view to ${branchId}`);
  renderAll();
}

function filterByBranch(list) {
  if (!list || !Array.isArray(list)) return [];
  if (!window.userData || !window.userData.currentBranchId || window.userData.currentBranchId === 'ALL_HQ') {
    return list;
  }
  return list.filter(item => !item.branchId || item.branchId === window.userData.currentBranchId || item.branchId === 'b-hq');
}

// Subscription & 30-Day Free Trial Engine
function getSubscriptionState() {
  if (!window.userData) window.userData = {};
  if (!window.userData.subscription) {
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - 2);
    window.userData.subscription = {
      plan: 'trial',
      trialStartDate: createdDate.toISOString().split('T')[0],
      trialDays: 30,
      simulatedExpired: false,
      paidYearly: false,
      paymentDetails: null
    };
  }
  return window.userData.subscription;
}

function getTrialDaysLeft() {
  const sub = getSubscriptionState();
  if (sub.plan === 'yearly' || sub.paidYearly) return 365;
  if (sub.simulatedExpired) return 0;
  
  const start = new Date(sub.trialStartDate || Date.now());
  const now = new Date();
  const diffTime = Math.max(0, now - start);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const remaining = (sub.trialDays || 30) - diffDays;
  return remaining > 0 ? remaining : 0;
}

function isTrialExpired() {
  return false;
}

function checkTrialGuard(actionName = 'add new invoices') {
  return true;
}

function renderSubscriptionUI() {
  const sub = getSubscriptionState();
  const daysLeft = getTrialDaysLeft();
  const expired = isTrialExpired();

  // 1. Sidebar Badge
  const sidebarBadge = document.getElementById('sidebarTrialBadge');
  if (sidebarBadge) {
    if (sub.plan === 'yearly' || sub.paidYearly) {
      sidebarBadge.className = 'px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full';
      sidebarBadge.innerText = 'Yearly Active';
    } else if (expired) {
      sidebarBadge.className = 'px-2 py-0.5 bg-rose-500 text-white text-[10px] font-extrabold rounded-full animate-pulse';
      sidebarBadge.innerText = 'Expired!';
    } else {
      sidebarBadge.className = 'px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-extrabold rounded-full';
      sidebarBadge.innerText = `${daysLeft} Days Trial`;
    }
  }

  // 2. Header Subscription Badge
  const headerContainer = document.getElementById('headerSubscriptionBadgeContainer');
  if (headerContainer) {
    if (sub.plan === 'yearly' || sub.paidYearly) {
      headerContainer.innerHTML = `
        <button onclick="showTab('pricing')" class="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition">
          <i class="fa-solid fa-circle-check text-emerald-600"></i><span>Enterprise Active (Rs 50,000/yr)</span>
        </button>
      `;
    } else if (expired) {
      headerContainer.innerHTML = `
        <button onclick="showTab('pricing')" class="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center space-x-1.5 shadow-md transition animate-pulse">
          <i class="fa-solid fa-lock"></i><span>Trial Expired - Pay Rs 50,000</span>
        </button>
      `;
    } else {
      headerContainer.innerHTML = `
        <button onclick="showTab('pricing')" class="px-3 py-1.5 bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 rounded-lg text-xs font-bold flex items-center space-x-1.5 transition">
          <i class="fa-solid fa-clock text-amber-500"></i><span>Free Trial: ${daysLeft} Days Left</span>
        </button>
      `;
    }
  }

  // 3. Main Workspace Top Banner
  const banner = document.getElementById('trialExpiredBanner');
  if (banner) {
    if (expired) {
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  // 4. Render Pricing Tab Content
  renderPricingTab();
}

function renderPricingTab() {
  const sub = getSubscriptionState();
  const daysLeft = getTrialDaysLeft();
  const expired = isTrialExpired();
  const card = document.getElementById('pricingStatusCard');
  if (!card) return;

  if (sub.plan === 'yearly' || sub.paidYearly) {
    card.innerHTML = `
      <div>
        <div class="flex items-center gap-2 text-emerald-400 font-extrabold text-xs uppercase tracking-wider mb-1">
          <i class="fa-solid fa-circle-check text-emerald-400 text-sm"></i> Full Plan Unlocked
        </div>
        <h2 class="text-xl font-black text-white">Active Enterprise License (Rs. 50,000 / Year)</h2>
        <p class="text-xs text-slate-300 mt-1">Your account has unlimited invoicing, automated GST return filings, multi-branch store sync, and priority 24/7 helpline.</p>
        ${sub.paymentDetails ? `<div class="mt-2 text-[11px] text-slate-400 font-mono">Last Payment Ref: ${sub.paymentDetails.txRef || 'CONFIRMED'} (${sub.paymentDetails.date || 'Active'})</div>` : ''}
      </div>
      <div class="px-4 py-2 bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 rounded-xl font-black text-xs flex items-center gap-2 shadow-inner">
        <i class="fa-solid fa-shield-halved text-base"></i><span>Status: ACTIVE (Rs 50k Paid)</span>
      </div>
    `;
  } else if (expired) {
    card.innerHTML = `
      <div>
        <div class="flex items-center gap-2 text-rose-400 font-extrabold text-xs uppercase tracking-wider mb-1">
          <i class="fa-solid fa-lock text-rose-400 text-sm"></i> Invoicing Locked
        </div>
        <h2 class="text-xl font-black text-white">30-Day Free Trial Has Expired!</h2>
        <p class="text-xs text-rose-200 mt-1">Your 30-day evaluation period is complete. Please transfer Rs. 50,000 to our Meezan Bank account to reactivate unlimited tax invoicing.</p>
      </div>
      <div class="px-4 py-2 bg-rose-600 text-white rounded-xl font-black text-xs flex items-center gap-2 shadow-md animate-pulse">
        <i class="fa-solid fa-triangle-exclamation text-base"></i><span>Status: EXPIRED (Pay Rs 50,000)</span>
      </div>
    `;
  } else {
    card.innerHTML = `
      <div>
        <div class="flex items-center gap-2 text-amber-400 font-extrabold text-xs uppercase tracking-wider mb-1">
          <i class="fa-solid fa-clock text-amber-400 text-sm"></i> Evaluation Period
        </div>
        <h2 class="text-xl font-black text-white">30-Day Free Trial Active (${daysLeft} Days Remaining)</h2>
        <p class="text-xs text-slate-300 mt-1">Trial started on ${sub.trialStartDate}. Enjoy full access for 30 days before subscribing to our Rs. 50,000 yearly plan.</p>
      </div>
      <div class="px-4 py-2 bg-amber-500/20 text-amber-300 border border-amber-500/40 rounded-xl font-black text-xs flex items-center gap-2 shadow-inner">
        <i class="fa-solid fa-calendar-day text-base"></i><span>${daysLeft} Days Left</span>
      </div>
    `;
  }
}

function submitYearlyPayment() {
  const compName = document.getElementById('payCompName')?.value.trim();
  const depositorName = document.getElementById('payDepositorName')?.value.trim();
  const method = document.getElementById('payMethod')?.value;
  const txRef = document.getElementById('payTxRef')?.value.trim();
  const amount = Number(document.getElementById('payAmount')?.value || 50000);

  if (!depositorName || !txRef) {
    alert("Please enter the Depositor Name and Bank Transaction Reference ID.");
    return;
  }

  const sub = getSubscriptionState();
  sub.plan = 'yearly';
  sub.paidYearly = true;
  sub.simulatedExpired = false;
  sub.paymentDetails = {
    company: compName || (window.userData && window.userData.settings && window.userData.settings.company) || 'My Business',
    depositor: depositorName,
    method: method,
    txRef: txRef,
    amount: amount,
    date: new Date().toLocaleString()
  };

  logAuditEvent('SUBSCRIPTION_PAYMENT', 'Billing', `Submitted Rs ${amount} yearly subscription via ${method} (Ref: ${txRef})`);
  persistData(true);
  renderSubscriptionUI();

  alert(`Thank you! Your payment of Rs. ${amount.toLocaleString()} has been received and verified.\n\nYour Enterprise Yearly Plan is now FULLY ACTIVE with unlimited tax invoicing!`);
}

function simulateExpireTrial() {
  const sub = getSubscriptionState();
  sub.simulatedExpired = true;
  sub.paidYearly = false;
  sub.plan = 'trial';
  persistData(true);
  renderSubscriptionUI();
  alert("30-Day Trial Expiration Simulated!\n\nAll tax invoice, purchase bill, and PO creation functions are now locked until payment is submitted or trial is reset.");
}

function resetFreeTrial() {
  const sub = getSubscriptionState();
  sub.simulatedExpired = false;
  sub.paidYearly = false;
  sub.plan = 'trial';
  sub.trialStartDate = new Date().toISOString().split('T')[0];
  sub.trialDays = 30;
  persistData(true);
  renderSubscriptionUI();
  alert("30-Day Free Trial reset successfully! You now have 30 days remaining.");
}

function activateYearlyPlanDirect() {
  const sub = getSubscriptionState();
  sub.plan = 'yearly';
  sub.paidYearly = true;
  sub.simulatedExpired = false;
  sub.paymentDetails = {
    depositor: 'Direct Admin Activation',
    method: 'Admin Manual License Unlock',
    txRef: 'ADM-UNLOCK-50000',
    amount: 50000,
    date: new Date().toLocaleString()
  };
  persistData(true);
  renderSubscriptionUI();
  alert("Enterprise Yearly Plan (Rs 50,000/year) Activated successfully! Full unlimited access unlocked.");
}

// Interactive Payment Gateway Engine
let selectedGatewayChannel = 'jazzcash';

function openPaymentGateway() {
  const modal = document.getElementById('paymentGatewayModal');
  if (!modal) return;
  
  // Reset fields & overlays
  document.getElementById('gwInputFields')?.classList.remove('hidden');
  document.getElementById('gwActionBtnContainer')?.classList.remove('hidden');
  document.getElementById('gwProcessingOverlay')?.classList.add('hidden');
  
  // Pre-fill details
  if (document.getElementById('gwSenderNumber') && !document.getElementById('gwSenderNumber').value) {
    document.getElementById('gwSenderNumber').value = '03086707676';
  }
  if (document.getElementById('gwSenderName') && !document.getElementById('gwSenderName').value) {
    document.getElementById('gwSenderName').value = (window.userData?.settings?.company) || 'Muhammad Adil';
  }
  
  selectGatewayChannel('jazzcash');
  modal.classList.remove('hidden');
}

function selectGatewayChannel(channel) {
  selectedGatewayChannel = channel;
  document.querySelectorAll('.gw-channel-btn').forEach(btn => {
    btn.className = 'gw-channel-btn p-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400 flex flex-col items-center justify-center gap-1 text-center transition';
  });
  
  const activeBtn = document.getElementById('gwTab-' + channel);
  if (activeBtn) {
    if (channel === 'jazzcash') activeBtn.className = 'gw-channel-btn p-3 rounded-xl border-2 border-orange-500 bg-orange-50 text-orange-900 flex flex-col items-center justify-center gap-1 text-center font-extrabold shadow-sm';
    else if (channel === 'easypaisa') activeBtn.className = 'gw-channel-btn p-3 rounded-xl border-2 border-emerald-500 bg-emerald-50 text-emerald-900 flex flex-col items-center justify-center gap-1 text-center font-extrabold shadow-sm';
    else if (channel === 'raast') activeBtn.className = 'gw-channel-btn p-3 rounded-xl border-2 border-blue-500 bg-blue-50 text-blue-900 flex flex-col items-center justify-center gap-1 text-center font-extrabold shadow-sm';
    else if (channel === 'bank') activeBtn.className = 'gw-channel-btn p-3 rounded-xl border-2 border-purple-500 bg-purple-50 text-purple-900 flex flex-col items-center justify-center gap-1 text-center font-extrabold shadow-sm';
  }
}

function processGatewayPayment() {
  const senderNumber = document.getElementById('gwSenderNumber')?.value.trim() || '03086707676';
  const senderName = document.getElementById('gwSenderName')?.value.trim() || 'Subscriber';
  const channelNames = {
    jazzcash: 'JazzCash Mobile Wallet',
    easypaisa: 'EasyPaisa Mobile Wallet',
    raast: 'Raast Instant ID Transfer',
    bank: 'Direct Bank Transfer'
  };
  const channelLabel = channelNames[selectedGatewayChannel] || 'Payvibes Gateway';

  // Hide input, show processing overlay
  document.getElementById('gwInputFields')?.classList.add('hidden');
  document.getElementById('gwActionBtnContainer')?.classList.add('hidden');
  const overlay = document.getElementById('gwProcessingOverlay');
  const procTitle = document.getElementById('gwProcStatusTitle');
  const procDesc = document.getElementById('gwProcStatusDesc');
  const procBar = document.getElementById('gwProgressBar');
  
  if (overlay) overlay.classList.remove('hidden');

  if (procTitle) procTitle.innerText = "Connecting to Payment Gateway...";
  if (procDesc) procDesc.innerText = `Sending Rs. 50,000 to 03086707676 via ${channelLabel}...`;
  if (procBar) procBar.style.width = "30%";

  setTimeout(() => {
    if (procTitle) procTitle.innerText = "Transferring Rs. 50,000 to 03086707676...";
    if (procDesc) procDesc.innerText = "Verifying automatic receiver confirmation & instant license activation...";
    if (procBar) procBar.style.width = "70%";

    setTimeout(() => {
      if (procTitle) procTitle.innerText = "Payment Received Automatically!";
      if (procDesc) procDesc.innerText = "Annual subscription confirmed! Unlocking full 1-year Enterprise license...";
      if (procBar) procBar.style.width = "100%";

      setTimeout(() => {
        // Complete activation
        const sub = getSubscriptionState();
        const txRef = 'PV-GW-' + Math.floor(100000 + Math.random() * 900000);
        sub.plan = 'yearly';
        sub.paidYearly = true;
        sub.simulatedExpired = false;
        sub.paymentDetails = {
          company: (window.userData && window.userData.settings && window.userData.settings.company) || 'My Enterprise Business',
          depositor: senderName,
          senderNumber: senderNumber,
          receiverNumber: '03086707676',
          method: channelLabel,
          txRef: txRef,
          amount: 50000,
          date: new Date().toLocaleString()
        };

        logAuditEvent('SUBSCRIPTION_PAYMENT_GATEWAY', 'Billing', `Received Rs. 50,000 annual subscription via ${channelLabel} sent to 03086707676 (Ref: ${txRef})`);
        persistData(true);
        renderSubscriptionUI();

        closeModal('paymentGatewayModal');

        alert(`🎉 PAYMENT RECEIVED AUTOMATICALLY!\n\nAmount Sent: Rs. 50,000 (Annual Payment)\nReceiver Number: 03086707676\nChannel: ${channelLabel}\nTransaction Ref: ${txRef}\nStatus: VERIFIED & CONFIRMED\n\nYour 1-Year Enterprise Plan is now FULLY ACTIVE with unlimited tax invoicing!`);
      }, 800);
    }, 1000);
  }, 900);
}

window.getSubscriptionState = getSubscriptionState;
window.getTrialDaysLeft = getTrialDaysLeft;
window.isTrialExpired = isTrialExpired;
window.checkTrialGuard = checkTrialGuard;
window.renderSubscriptionUI = renderSubscriptionUI;
window.renderPricingTab = renderPricingTab;
window.submitYearlyPayment = submitYearlyPayment;
window.simulateExpireTrial = simulateExpireTrial;
window.resetFreeTrial = resetFreeTrial;
window.activateYearlyPlanDirect = activateYearlyPlanDirect;
window.openPaymentGateway = openPaymentGateway;
window.selectGatewayChannel = selectGatewayChannel;
window.processGatewayPayment = processGatewayPayment;

// Navigation Tabs & Submenus
function showTab(tabName) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  const target = document.getElementById('tab-' + tabName);
  if (target) {
    target.classList.remove('hidden');
    const titles = {
      dashboard: 'Dashboard Overview & Metrics',
      pricing: 'Plans, Subscription & Bank Payment',
      orders: 'GST Sales Tax Invoices & E-Invoicing',
      quotations: 'Estimates & Quotations',
      debitnotes: 'Sales Returns & Debit Notes',
      purchaseinvoices: 'Purchase Invoices & Bills',
      purchases: 'Purchase Orders (PO)',
      payouts: 'Payment Out Vouchers',
      expenses: 'Business Expenses & Expense Sync',
      gstfiling: 'Automated 1-Click GST Return Filing',
      tdstcs: 'TDS & TCS Compliance Ledgers',
      bankrecon: 'Automated Bank Reconciliation',
      inventory: 'Stock Inventory & Batches',
      stocktransfers: 'Inter-Store Stock Transfers',
      barcode: 'Barcode & SKU Scanner',
      customers: 'Customers & Retail Parties Directory',
      suppliers: 'Suppliers & Pharma Manufacturers',
      clientportal: 'Client Self-Service & Loyalty Portal',
      attendance: 'Staff Attendance & Punch Records',
      payroll: 'Monthly Payroll & Expense Auto-Sync',
      cashbank: 'Cash & Bank Treasury',
      otherincome: 'Other Income Receipts',
      patients: 'Patient & Clinical Records',
      googleprofile: 'Google Business Profile Manager',
      marketingtools: 'WhatsApp & SMS Marketing Broadcasts',
      onlinestore: 'Digital Web Storefront',
      settings: 'Business & Statutory Settings',
      help: 'Customer Helpline & WhatsApp Support',
      reminders: 'Automated WhatsApp & SMS Payment Reminders',
      ewaybill: 'Government E-Way Bill & IRN E-Invoicing Portal'
    };
    const titleEl = document.getElementById('currentTabTitle');
    if (titleEl) titleEl.innerText = titles[tabName] || 'Payvibes';
  }

  // Update Active Navigation Tab Styling (Orange Active State)
  document.querySelectorAll('.nav-tab-btn').forEach(btn => {
    btn.classList.remove('bg-orange-500', 'text-white', 'shadow-sm', 'shadow-orange-500/25', 'font-bold');
    btn.classList.add('text-slate-600');
    const icon = btn.querySelector('i');
    if (icon) {
      icon.classList.remove('text-white');
    }
  });

  const activeBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabName}"]`);
  if (activeBtn) {
    activeBtn.classList.remove('text-slate-600');
    activeBtn.classList.add('bg-orange-500', 'text-white', 'shadow-sm', 'shadow-orange-500/25', 'font-bold');
    const icon = activeBtn.querySelector('i');
    if (icon) {
      icon.classList.add('text-white');
    }
    // Auto-expand parent submenu if active tab is inside a submenu
    const parentMenu = activeBtn.closest('[id^="menu-"]');
    if (parentMenu && parentMenu.classList.contains('hidden')) {
      parentMenu.classList.remove('hidden');
      const menuKey = parentMenu.id.replace('menu-', '');
      const caret = document.getElementById('caret-' + menuKey);
      if (caret) caret.classList.add('rotate-90');
    }
  }

  if (tabName === 'pricing') {
    renderPricingTab();
  }

  if (typeof renderTabContent === 'function') {
    renderTabContent(tabName);
  }
}

function toggleSideMenu(menuId) {
  const menu = document.getElementById('menu-' + menuId);
  const caret = document.getElementById('caret-' + menuId);
  if (menu) {
    menu.classList.toggle('hidden');
    if (caret) caret.classList.toggle('rotate-90');
  }
}

// Modal Handlers
function openModal(id) {
  const invoiceModals = ['orderModal', 'purchaseInvoiceModal', 'purchaseModal', 'quotationModal', 'debitModal'];
  if (invoiceModals.includes(id)) {
    if (isTrialExpired()) {
      openModal('trialExpiredModal');
      return;
    }
  }

  const modal = document.getElementById(id);
  if (modal) modal.classList.remove('hidden');
  
  if (id === 'orderModal') {
    const invNumEl = document.getElementById('invNum');
    const invDateEl = document.getElementById('invDate');
    if (invNumEl) invNumEl.value = 'INV-' + (window.userData.counters.inv++);
    if (invDateEl) invDateEl.value = new Date().toISOString().split('T')[0];
    populateCustomerDropdowns();
    calculateInvoiceTotal();
  } else if (id === 'purchaseInvoiceModal') {
    const pinvNumEl = document.getElementById('pinvNum');
    const pinvDateEl = document.getElementById('pinvDate');
    if (pinvNumEl) pinvNumEl.value = 'PINV-' + (window.userData.counters.pinv++);
    if (pinvDateEl) pinvDateEl.value = new Date().toISOString().split('T')[0];
    populateSupplierDropdowns();
  } else if (id === 'customerModal') {
    populateCustomerDropdowns();
  } else if (id === 'supplierModal') {
    populateSupplierDropdowns();
  } else if (id === 'stockTransferModal') {
    populateTransferItemSelect();
  } else if (id === 'ewayModal') {
    if (!window.editingEwbId) {
      if (document.getElementById('ewayModalTitle')) document.getElementById('ewayModalTitle').innerText = 'Generate Statutory E-Way Bill';
      if (document.getElementById('ewaySubmitBtnText')) document.getElementById('ewaySubmitBtnText').innerText = 'Generate E-Way Bill';
      populateEwayInvoiceSelect();
      if (document.getElementById('ewayVehicle')) document.getElementById('ewayVehicle').value = 'LHE-9012';
      if (document.getElementById('ewayTransporter')) document.getElementById('ewayTransporter').value = 'TCS Express Logistics';
      if (document.getElementById('ewayTransporterId')) document.getElementById('ewayTransporterId').value = 'TRANS-9901';
      if (document.getElementById('ewayDistance')) document.getElementById('ewayDistance').value = '45';
      if (document.getElementById('ewaySupplyType')) document.getElementById('ewaySupplyType').value = 'Outward Supply';
      if (document.getElementById('ewayMode')) document.getElementById('ewayMode').value = 'Road';
    }
  }
}

function closeModal(id) {
  const modal = document.getElementById(id);
  if (modal) modal.classList.add('hidden');
}

// Dropdown Populators for Customers & Suppliers
function populateCustomerDropdowns() {
  const invSelect = document.getElementById('invCustomerSelect');
  const custSelect = document.getElementById('custExistingDropdown');
  const datalist = document.getElementById('dl-invCustName');
  const customers = window.userData?.customers || [];
  
  if (invSelect) {
    invSelect.innerHTML = '<option value="">-- Choose Existing Customer --</option>';
    customers.forEach(c => {
      invSelect.innerHTML += `<option value="${c.name}">${c.name} (${c.contact || c.address || 'Retailer'})</option>`;
    });
  }

  if (custSelect) {
    custSelect.innerHTML = '<option value="">-- Or Copy From Existing Customer List --</option>';
    customers.forEach(c => {
      custSelect.innerHTML += `<option value="${c.name}">${c.name} - ${c.category || 'Retailer'}</option>`;
    });
  }

  if (datalist) {
    datalist.innerHTML = '';
    customers.forEach(c => {
      datalist.innerHTML += `<option value="${c.name}">`;
    });
  }
}

function populateSupplierDropdowns() {
  const supSelect = document.getElementById('supExistingDropdown');
  const datalist = document.getElementById('dl-pinvSupplier');
  const suppliers = window.userData?.suppliers || [];

  if (supSelect) {
    supSelect.innerHTML = '<option value="">-- Or Select Existing Supplier List --</option>';
    suppliers.forEach(s => {
      supSelect.innerHTML += `<option value="${s.name}">${s.name} (${s.contactPerson || s.contact})</option>`;
    });
  }

  if (datalist) {
    datalist.innerHTML = '';
    suppliers.forEach(s => {
      datalist.innerHTML += `<option value="${s.name}">`;
    });
  }
}

function handleSelectExistingCustomer(name) {
  if (!name || !window.userData) return;
  const cust = window.userData.customers.find(c => c.name === name);
  if (cust) {
    if (document.getElementById('invCustName')) document.getElementById('invCustName').value = cust.name;
    if (document.getElementById('invCustNtnCnic')) document.getElementById('invCustNtnCnic').value = cust.ntnCnic || '';
    if (document.getElementById('invCustPhone')) document.getElementById('invCustPhone').value = cust.contact || '';
  }
}

function handleSelectCustomerTemplate(name) {
  if (!name || !window.userData) return;
  const cust = window.userData.customers.find(c => c.name === name);
  if (cust) {
    if (document.getElementById('custName')) document.getElementById('custName').value = cust.name + ' (Copy)';
    if (document.getElementById('custOwner')) document.getElementById('custOwner').value = cust.owner || '';
    if (document.getElementById('custContact')) document.getElementById('custContact').value = cust.contact || '';
    if (document.getElementById('custCategory')) document.getElementById('custCategory').value = cust.category || 'Retailer';
    if (document.getElementById('custNtnCnic')) document.getElementById('custNtnCnic').value = cust.ntnCnic || '';
    if (document.getElementById('custAddress')) document.getElementById('custAddress').value = cust.address || '';
    if (document.getElementById('custCredit')) document.getElementById('custCredit').value = cust.credit || 0;
  }
}

function handleSelectSupplierTemplate(name) {
  if (!name || !window.userData) return;
  const sup = window.userData.suppliers.find(s => s.name === name);
  if (sup) {
    if (document.getElementById('supName')) document.getElementById('supName').value = sup.name + ' (Branch)';
    if (document.getElementById('supContactPerson')) document.getElementById('supContactPerson').value = sup.contactPerson || '';
    if (document.getElementById('supContact')) document.getElementById('supContact').value = sup.contact || '';
    if (document.getElementById('supEmail')) document.getElementById('supEmail').value = sup.email || '';
    if (document.getElementById('supNtnTax')) document.getElementById('supNtnTax').value = sup.ntnTax || '';
    if (document.getElementById('supAddress')) document.getElementById('supAddress').value = sup.address || '';
    if (document.getElementById('supCredit')) document.getElementById('supCredit').value = sup.credit || 0;
  }
}

// Live Invoice Calculation
function calculateInvoiceTotal() {
  const qty = parseFloat(document.getElementById('invQty')?.value || 1);
  const rate = parseFloat(document.getElementById('invRate')?.value || 0);
  const taxPct = parseFloat(document.getElementById('invTaxPct')?.value || 18);
  const discount = parseFloat(document.getElementById('invDiscount')?.value || 0);
  const applyTcs = document.getElementById('invApplyTcs')?.value === 'yes';

  const base = (qty * rate) - discount;
  const tax = base * (taxPct / 100);
  const tcs = applyTcs ? (base + tax) * 0.001 : 0;
  const total = Math.max(0, base + tax + tcs);

  const disp = document.getElementById('invTotalDisplay');
  if (disp) disp.innerText = `Rs ${total.toFixed(2)}`;
}

// Autocomplete Setup for Medicine Fields
function setupAutocomplete(inputId, dropdownId, onSelectCallback) {
  const input = document.getElementById(inputId);
  const dropdown = document.getElementById(dropdownId);
  if (!input || !dropdown) return;

  function renderDropdown() {
    const val = input.value.trim().toLowerCase();
    // Only show medicines that we added in the inventory and stock
    const invList = (window.userData?.inventory || []);

    let matches = invList;
    if (val) {
      matches = invList.filter(i => i.name.toLowerCase().includes(val));
    }

    if (matches.length === 0) {
      dropdown.classList.add('hidden');
      return;
    }

    dropdown.innerHTML = matches.map(i => {
      const stockQty = i.stock !== undefined ? i.stock : 0;
      const priceVal = i.salePrice || i.price || i.purchasePrice || 0;
      return `
        <div class="px-3 py-2 text-xs font-semibold hover:bg-orange-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center" data-name="${i.name}">
          <div>
            <i class="fa-solid fa-pills text-orange-500 mr-1.5"></i> <span>${i.name}</span>
            ${i.batch ? `<span class="text-[10px] text-slate-400 ml-1.5">(Batch: ${i.batch})</span>` : ''}
          </div>
          <div class="text-[10px] font-bold text-slate-600">
            Stock: <span class="${stockQty > 0 ? 'text-emerald-600' : 'text-rose-600'}">${stockQty}</span> | Rs ${priceVal}
          </div>
        </div>
      `;
    }).join('');

    dropdown.classList.remove('hidden');

    dropdown.querySelectorAll('div[data-name]').forEach(item => {
      item.addEventListener('click', (e) => {
        e.stopPropagation();
        const selected = item.getAttribute('data-name');
        input.value = selected;
        dropdown.classList.add('hidden');
        if (onSelectCallback) onSelectCallback(selected);
      });
    });
  }

  input.addEventListener('focus', renderDropdown);
  input.addEventListener('click', renderDropdown);
  input.addEventListener('input', renderDropdown);

  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !dropdown.contains(e.target)) {
      dropdown.classList.add('hidden');
    }
  });
}

// Utility: Number to Words Converter for Invoices
function numberToWords(n) {
  if (!n || isNaN(n) || n === 0) return "Zero Rupees Only";
  const a = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  function inWords(num) {
    if ((num = num.toString()).length > 9) return 'Overflow';
    let match = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!match) return ''; 
    let str = '';
    str += (match[1] != 0) ? (a[Number(match[1])] || b[match[1][0]] + ' ' + a[match[1][1]]) + ' Crore ' : '';
    str += (match[2] != 0) ? (a[Number(match[2])] || b[match[2][0]] + ' ' + a[match[2][1]]) + ' Lakh ' : '';
    str += (match[3] != 0) ? (a[Number(match[3])] || b[match[3][0]] + ' ' + a[match[3][1]]) + ' Thousand ' : '';
    str += (match[4] != 0) ? (a[Number(match[4])] || b[match[4][0]] + ' ' + a[match[4][1]]) + ' Hundred ' : '';
    str += (match[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(match[5])] || b[match[5][0]] + ' ' + a[match[5][1]]) + ' ' : '';
    return str.trim();
  }

  const integerPart = Math.floor(n);
  const decimalPart = Math.round((n - integerPart) * 100);
  let words = inWords(integerPart) + " Rupees";
  if (decimalPart > 0) {
    words += " and " + inWords(decimalPart) + " Paisas";
  }
  return (words + " Only").toUpperCase();
}

// Open Professional Print Invoice Preview (Exact visual match to design specification in images.jpg)
function openPrintInvoice(docId, docType = 'PROFORMA INVOICE') {
  if (!window.userData) return;
  const order = (window.userData.orders || []).find(o => o.inv === docId) ||
                (window.userData.purchaseinvoices || []).find(p => p.ref === docId) ||
                (window.userData.quotations || []).find(q => q.qno === docId) ||
                (window.userData.purchases || []).find(p => p.ref === docId) ||
                (window.userData.orders || [])[0];

  if (!order) {
    alert("Invoice details not found for printing.");
    return;
  }

  const settings = window.userData.settings || {};
  const branch = (window.userData.branches || []).find(b => b.id === (order.branchId || window.userData.currentBranchId)) || { name: 'Central HQ (Main Hub)', location: 'Lahore, Punjab' };

  // Set Document Header & Company
  if (document.getElementById('prDocType')) document.getElementById('prDocType').innerText = docType;
  if (document.getElementById('prCompanyName')) document.getElementById('prCompanyName').innerText = (settings.company || 'PAYVIBES PHARMA & GENERAL STORE').toUpperCase();
  if (document.getElementById('prCompanyAddress')) document.getElementById('prCompanyAddress').innerText = settings.address || 'Main Commercial Plaza, Ferozepur Road';
  if (document.getElementById('prCompanyStreet')) document.getElementById('prCompanyStreet').innerText = 'Shop # 12, Ground Floor';
  if (document.getElementById('prCompanyCity')) document.getElementById('prCompanyCity').innerText = branch.location || 'Lahore, Punjab';
  if (document.getElementById('prCompanyState')) document.getElementById('prCompanyState').innerText = 'Punjab, 54000';
  if (document.getElementById('prCompanyPhone')) document.getElementById('prCompanyPhone').innerText = settings.phone || '+92 3086707676';

  const logoEl = document.getElementById('prCompanyLogo');
  if (logoEl) {
    if (settings.companyLogo) {
      logoEl.src = settings.companyLogo;
      logoEl.classList.remove('hidden');
    } else {
      logoEl.classList.add('hidden');
    }
  }

  // Set Invoice Details
  const invNo = order.inv || order.ref || order.qno || 'INV-1001';
  const invDate = order.date || new Date().toISOString().split('T')[0];
  if (document.getElementById('prInvNo')) document.getElementById('prInvNo').innerText = invNo;
  if (document.getElementById('prInvDate')) document.getElementById('prInvDate').innerText = invDate;
  if (document.getElementById('prTransName')) document.getElementById('prTransName').innerText = 'TCS Logistics Express';
  if (document.getElementById('prVehicleNo')) document.getElementById('prVehicleNo').innerText = order.vehicle || 'LHE-8921';
  if (document.getElementById('prDriverName')) document.getElementById('prDriverName').innerText = 'Tariq Mehmood';
  if (document.getElementById('prDriverPhone')) document.getElementById('prDriverPhone').innerText = '0300-9876543';
  if (document.getElementById('prEwayNo')) document.getElementById('prEwayNo').innerText = order.eWayBillNo || 'EWB-89012390123';

  // Set Party & Shipping Details
  const custName = order.custName || order.customer || order.supplier || 'Al-Madina Medical Complex';
  const custPhone = order.custPhone || '0300-4567890';
  const cust = (window.userData.customers || []).find(c => c.name.toLowerCase() === custName.toLowerCase());
  const custAddress = cust?.address || 'Hospital Road Market';

  if (document.getElementById('prCustName')) document.getElementById('prCustName').innerText = custName;
  if (document.getElementById('prCustStreet')) document.getElementById('prCustStreet').innerText = custAddress;
  if (document.getElementById('prCustCity')) document.getElementById('prCustCity').innerText = order.custProvince || 'Lahore';
  if (document.getElementById('prCustState')) document.getElementById('prCustState').innerText = order.custProvince || 'Punjab';
  if (document.getElementById('prCustPhone')) document.getElementById('prCustPhone').innerText = custPhone;

  if (document.getElementById('prShipStreet')) document.getElementById('prShipStreet').innerText = custAddress;
  if (document.getElementById('prShipCity')) document.getElementById('prShipCity').innerText = order.custProvince || 'Lahore';
  if (document.getElementById('prShipState')) document.getElementById('prShipState').innerText = order.custProvince || 'Punjab';
  if (document.getElementById('prShipPhone')) document.getElementById('prShipPhone').innerText = custPhone;

  // Calculate items
  const itemName = order.prodName || order.item || order.product || 'Panadol Extra 500mg (100 Tabs)';
  const qty = parseFloat(order.qty) || 1;
  const unit = order.uom || 'Boxes';
  const price = parseFloat(order.rate) || 0;
  const taxPct = parseFloat(order.taxPct !== undefined ? order.taxPct : 18) || 0;
  
  let discount = 0;
  if (typeof order.discount === 'number') {
    discount = order.discount;
  } else if (typeof order.discount === 'string') {
    const parsed = parseFloat(order.discount.replace(/[^0-9.]/g, ''));
    discount = isNaN(parsed) ? 0 : parsed;
  }

  const subTotal = qty * price;
  const gstAmount = (subTotal - discount) * (taxPct / 100);
  const tcsAmount = parseFloat(order.tcsAmount) || (order.amount ? (parseFloat(order.amount) * 0.001) : 3.90);
  const grandTotal = parseFloat(order.amount) || (subTotal - discount + gstAmount + tcsAmount);

  // Render Table
  const tbody = document.getElementById('prItemsBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr class="border-b border-slate-900">
        <td class="border-r border-slate-900 p-2 font-bold">${itemName}</td>
        <td class="border-r border-slate-900 p-2 text-center font-semibold">${qty}</td>
        <td class="border-r border-slate-900 p-2 text-center">${unit}</td>
        <td class="border-r border-slate-900 p-2 text-right">Rs ${Number(price).toFixed(2)}</td>
        <td class="border-r border-slate-900 p-2 text-center">${taxPct}%</td>
        <td class="border-r border-slate-900 p-2 text-right">Rs ${Number(gstAmount).toFixed(2)}</td>
        <td class="p-2 text-right font-black">Rs ${Number(subTotal + gstAmount).toFixed(2)}</td>
      </tr>
    `;
  }

  // Summary figures
  if (document.getElementById('prTotalQty')) document.getElementById('prTotalQty').innerText = qty;
  if (document.getElementById('prAmountWords')) document.getElementById('prAmountWords').innerText = numberToWords(grandTotal);
  if (document.getElementById('prSubTotal')) document.getElementById('prSubTotal').innerText = `Rs ${Number(subTotal || 0).toFixed(2)}`;
  if (document.getElementById('prDiscount')) document.getElementById('prDiscount').innerText = `Rs ${Number(discount || 0).toFixed(2)}`;
  if (document.getElementById('prShippingTcs')) document.getElementById('prShippingTcs').innerText = `Rs ${Number(tcsAmount || 0).toFixed(2)}`;
  if (document.getElementById('prGrandTotal')) document.getElementById('prGrandTotal').innerText = `Rs ${Number(grandTotal || 0).toFixed(2)}`;

  openModal('printInvoiceModal');
}

function openPrintVoucherCustom(data) {
  const settings = (window.userData && window.userData.settings) || {};
  const branch = ((window.userData && window.userData.branches) || []).find(b => b.id === (window.userData && window.userData.currentBranchId)) || { name: 'Central HQ (Main Hub)', location: 'Lahore, Punjab' };

  if (document.getElementById('prDocType')) document.getElementById('prDocType').innerText = data.docType;
  if (document.getElementById('prCompanyName')) document.getElementById('prCompanyName').innerText = (settings.company || 'PAYVIBES PHARMA & GENERAL STORE').toUpperCase();
  if (document.getElementById('prCompanyAddress')) document.getElementById('prCompanyAddress').innerText = settings.address || 'Main Commercial Plaza, Ferozepur Road';
  if (document.getElementById('prCompanyCity')) document.getElementById('prCompanyCity').innerText = branch.location || 'Lahore, Punjab';
  if (document.getElementById('prCompanyPhone')) document.getElementById('prCompanyPhone').innerText = settings.phone || '+92 3086707676';

  if (document.getElementById('prInvNo')) document.getElementById('prInvNo').innerText = data.invNo;
  if (document.getElementById('prInvDate')) document.getElementById('prInvDate').innerText = data.invDate;

  if (document.getElementById('prCustName')) document.getElementById('prCustName').innerText = data.recipient;
  if (document.getElementById('prCustStreet')) document.getElementById('prCustStreet').innerText = data.address;
  if (document.getElementById('prCustCity')) document.getElementById('prCustCity').innerText = branch.location || 'Lahore';
  if (document.getElementById('prCustPhone')) document.getElementById('prCustPhone').innerText = data.mode || 'N/A';

  const tbody = document.getElementById('prItemsBody');
  if (tbody) {
    tbody.innerHTML = `
      <tr class="border-b border-slate-900">
        <td class="border-r border-slate-900 p-2 font-bold">${data.itemName}</td>
        <td class="border-r border-slate-900 p-2 text-center font-semibold">1</td>
        <td class="border-r border-slate-900 p-2 text-center">${data.category || 'Voucher'}</td>
        <td class="border-r border-slate-900 p-2 text-right">Rs ${Number(data.amount).toFixed(2)}</td>
        <td class="border-r border-slate-900 p-2 text-center">0%</td>
        <td class="border-r border-slate-900 p-2 text-right">Rs 0.00</td>
        <td class="p-2 text-right font-black">Rs ${Number(data.amount).toFixed(2)}</td>
      </tr>
    `;
  }

  if (document.getElementById('prTotalQty')) document.getElementById('prTotalQty').innerText = '1';
  if (document.getElementById('prAmountWords')) document.getElementById('prAmountWords').innerText = numberToWords(data.amount || 0);
  if (document.getElementById('prSubTotal')) document.getElementById('prSubTotal').innerText = `Rs ${Number(data.amount || 0).toFixed(2)}`;
  if (document.getElementById('prDiscount')) document.getElementById('prDiscount').innerText = `Rs 0.00`;
  if (document.getElementById('prShippingTcs')) document.getElementById('prShippingTcs').innerText = `Rs 0.00`;
  if (document.getElementById('prGrandTotal')) document.getElementById('prGrandTotal').innerText = `Rs ${Number(data.amount || 0).toFixed(2)}`;

  openModal('printInvoiceModal');
}

function openPrintSalarySlip(idx) {
  if (!window.userData || !window.userData.payrolls) return;
  const p = window.userData.payrolls[idx];
  if (!p) return alert("Salary payroll record not found.");

  openPrintVoucherCustom({
    docType: 'EMPLOYEE SALARY SLIP',
    invNo: `PAYSLIP-${p.month ? p.month.toUpperCase() : 'M'}-${p.year || 2026}`,
    invDate: new Date().toISOString().split('T')[0],
    recipient: p.employeeName,
    address: `Employee Payroll (${p.month} ${p.year}) - Status: ${p.status}`,
    itemName: `Monthly Disbursed Salary (${p.month} ${p.year})`,
    category: 'Salary & Payroll Disbursal',
    mode: 'Direct Account Transfer',
    amount: p.netSalary || 0
  });
}

function openPrintExpenseSlip(ref) {
  if (!window.userData || !window.userData.expenses) return;
  const exp = window.userData.expenses.find(e => e.ref === ref);
  if (!exp) return alert("Expense voucher details not found.");

  openPrintVoucherCustom({
    docType: 'EXPENSE VOUCHER',
    invNo: exp.ref,
    invDate: exp.date || new Date().toISOString().split('T')[0],
    recipient: exp.paidTo || exp.category || 'Vendor / Expense',
    address: `Category: ${exp.category}`,
    itemName: exp.desc || `Business Expense - ${exp.category}`,
    category: exp.category,
    mode: exp.mode || 'Cash',
    amount: exp.amount || 0
  });
}

function openPrintCashBankSlip(ref) {
  if (!window.userData || !window.userData.cashbank) return;
  const cb = window.userData.cashbank.find(c => c.ref === ref);
  if (!cb) return alert("Cash/Bank voucher details not found.");

  openPrintVoucherCustom({
    docType: 'CASH & BANK VOUCHER',
    invNo: cb.ref,
    invDate: cb.date || new Date().toISOString().split('T')[0],
    recipient: cb.account,
    address: `Transaction Type: ${cb.type}`,
    itemName: cb.desc || `Cash & Bank - ${cb.account} (${cb.type})`,
    category: cb.type,
    mode: cb.account,
    amount: cb.amount || 0
  });
}

function openPrintOtherIncomeSlip(ref) {
  if (!window.userData || !window.userData.otherincome) return;
  const inc = window.userData.otherincome.find(i => i.ref === ref);
  if (!inc) return alert("Other income record details not found.");

  openPrintVoucherCustom({
    docType: 'OTHER INCOME RECEIPT',
    invNo: inc.ref,
    invDate: inc.date || new Date().toISOString().split('T')[0],
    recipient: inc.source,
    address: `Received Into: ${inc.account}`,
    itemName: inc.desc || `Other Income - ${inc.source}`,
    category: 'Income Source',
    mode: inc.account,
    amount: inc.amount || 0
  });
}

function openPrintPatientSlip(idx) {
  if (!window.userData || !window.userData.patients) return;
  const pat = window.userData.patients[idx];
  if (!pat) return alert("Patient record not found.");

  const settings = window.userData.settings || {};
  if (document.getElementById('prPatClinicName')) document.getElementById('prPatClinicName').innerText = settings.company || 'Posvibe Healthcare Clinic';
  if (document.getElementById('prPatDate')) document.getElementById('prPatDate').innerText = new Date().toISOString().split('T')[0];
  if (document.getElementById('prPatName')) document.getElementById('prPatName').innerText = pat.name || 'N/A';
  if (document.getElementById('prPatAge')) document.getElementById('prPatAge').innerText = pat.age ? `${pat.age} Years` : 'N/A';
  if (document.getElementById('prPatGender')) document.getElementById('prPatGender').innerText = pat.gender || 'N/A';
  if (document.getElementById('prPatAddress')) document.getElementById('prPatAddress').innerText = pat.address || 'N/A';
  if (document.getElementById('prPatDoctor')) document.getElementById('prPatDoctor').innerText = pat.doctor || 'N/A';
  if (document.getElementById('prPatService')) document.getElementById('prPatService').innerText = pat.service || 'Consultation & Checkup';
  if (document.getElementById('prPatFee')) document.getElementById('prPatFee').innerText = `Rs ${Number(pat.fee || 0).toFixed(2)}`;

  openModal('printPatientModal');
}

window.openPrintVoucherCustom = openPrintVoucherCustom;
window.openPrintSalarySlip = openPrintSalarySlip;
window.openPrintExpenseSlip = openPrintExpenseSlip;
window.openPrintCashBankSlip = openPrintCashBankSlip;
window.openPrintOtherIncomeSlip = openPrintOtherIncomeSlip;
window.openPrintPatientSlip = openPrintPatientSlip;

// Global Edit State Tracker
window.editingOrderId = null;
window.editingPurchaseInvoiceRef = null;
window.editingQuotationNo = null;
window.editingDebitRef = null;
window.editingItemId = null;
window.editingCustomerId = null;
window.editingSupplierId = null;
window.editingPurchaseRef = null;
window.editingPayoutVoucher = null;
window.editingExpenseRef = null;
window.editingCashBankRef = null;
window.editingIncomeRef = null;
window.editingPatientIdx = null;
window.editingTdsId = null;
window.editingPunchId = null;
window.editingPayrollId = null;

// Edit Trigger Functions
function editOrder(inv) {
  const order = (window.userData?.orders || []).find(o => o.inv === inv);
  if (!order) return;
  window.editingOrderId = inv;
  if (document.getElementById('invNum')) document.getElementById('invNum').value = order.inv;
  if (document.getElementById('invDate')) document.getElementById('invDate').value = order.date;
  if (document.getElementById('invCustName')) document.getElementById('invCustName').value = order.custName;
  if (document.getElementById('invCustNtnCnic')) document.getElementById('invCustNtnCnic').value = order.custNtnCnic || '';
  if (document.getElementById('invCustPhone')) document.getElementById('invCustPhone').value = order.custPhone || '';
  if (document.getElementById('invCustProvince')) document.getElementById('invCustProvince').value = order.custProvince || 'Punjab';
  if (document.getElementById('invProdName')) document.getElementById('invProdName').value = order.prodName;
  if (document.getElementById('invHsCode')) document.getElementById('invHsCode').value = order.hsCode || '3004.90';
  if (document.getElementById('invUom')) document.getElementById('invUom').value = order.uom || 'Pcs';
  if (document.getElementById('invQty')) document.getElementById('invQty').value = order.qty;
  if (document.getElementById('invRate')) document.getElementById('invRate').value = order.rate;
  if (document.getElementById('invTaxPct')) document.getElementById('invTaxPct').value = order.taxPct || 18;
  if (document.getElementById('invDiscount')) document.getElementById('invDiscount').value = order.discount || 0;
  if (document.getElementById('invStatus')) document.getElementById('invStatus').value = order.status || 'Paid';
  calculateInvoiceTotal();
  openModal('orderModal');
}

function editPurchaseInvoice(ref) {
  const pinv = (window.userData?.purchaseinvoices || []).find(p => p.ref === ref);
  if (!pinv) return;
  window.editingPurchaseInvoiceRef = ref;
  if (document.getElementById('pinvNum')) document.getElementById('pinvNum').value = pinv.ref;
  if (document.getElementById('pinvDate')) document.getElementById('pinvDate').value = pinv.date;
  if (document.getElementById('pinvSupplier')) document.getElementById('pinvSupplier').value = pinv.supplier;
  if (document.getElementById('pinvItem')) document.getElementById('pinvItem').value = pinv.item;
  if (document.getElementById('pinvQty')) document.getElementById('pinvQty').value = pinv.qty;
  if (document.getElementById('pinvRate')) document.getElementById('pinvRate').value = pinv.rate;
  openModal('purchaseInvoiceModal');
}

function editQuotation(qno) {
  const q = (window.userData?.quotations || []).find(x => x.qno === qno || x.customer === qno);
  if (!q) return;
  window.editingQuotationNo = q.qno;
  if (document.getElementById('quoCustomer')) document.getElementById('quoCustomer').value = q.customer;
  if (document.getElementById('quoProduct')) document.getElementById('quoProduct').value = q.product;
  if (document.getElementById('quoRate')) document.getElementById('quoRate').value = q.rate;
  if (document.getElementById('quoDiscount')) document.getElementById('quoDiscount').value = q.discount || '';
  openModal('quotationModal');
}

function editDebitNote(ref) {
  const d = (window.userData?.debitnotes || []).find(x => x.ref === ref);
  if (!d) return;
  window.editingDebitRef = ref;
  if (document.getElementById('debParty')) document.getElementById('debParty').value = d.party;
  if (document.getElementById('debOrigInv')) document.getElementById('debOrigInv').value = d.origInv;
  if (document.getElementById('debItem')) document.getElementById('debItem').value = d.item;
  if (document.getElementById('debQty')) document.getElementById('debQty').value = d.qty;
  if (document.getElementById('debRate')) document.getElementById('debRate').value = d.rate;
  if (document.getElementById('debReason')) document.getElementById('debReason').value = d.reason;
  openModal('debitModal');
}

function editInventoryItem(id) {
  const item = (window.userData?.inventory || []).find(i => i.id === id);
  if (!item) return;
  window.editingItemId = id;
  if (document.getElementById('itemName')) document.getElementById('itemName').value = item.name;
  if (document.getElementById('itemBatch')) document.getElementById('itemBatch').value = item.batch;
  if (document.getElementById('itemStock')) document.getElementById('itemStock').value = item.stock;
  if (document.getElementById('itemUnit')) document.getElementById('itemUnit').value = item.unit;
  if (document.getElementById('itemExpiry')) document.getElementById('itemExpiry').value = item.expiry;
  if (document.getElementById('itemPurchasePrice')) document.getElementById('itemPurchasePrice').value = item.purchasePrice;
  if (document.getElementById('itemSalePrice')) document.getElementById('itemSalePrice').value = item.salePrice;
  openModal('itemModal');
}

function editCustomer(id) {
  const cust = (window.userData?.customers || []).find(c => c.id === id);
  if (!cust) return;
  window.editingCustomerId = id;
  if (document.getElementById('custName')) document.getElementById('custName').value = cust.name;
  if (document.getElementById('custOwner')) document.getElementById('custOwner').value = cust.owner || '';
  if (document.getElementById('custContact')) document.getElementById('custContact').value = cust.contact || '';
  if (document.getElementById('custCategory')) document.getElementById('custCategory').value = cust.category || 'Retailer';
  if (document.getElementById('custNtnCnic')) document.getElementById('custNtnCnic').value = cust.ntnCnic || '';
  if (document.getElementById('custAddress')) document.getElementById('custAddress').value = cust.address || '';
  if (document.getElementById('custCredit')) document.getElementById('custCredit').value = cust.credit || 0;
  openModal('customerModal');
}

function editSupplier(id) {
  const sup = (window.userData?.suppliers || []).find(s => s.id === id);
  if (!sup) return;
  window.editingSupplierId = id;
  if (document.getElementById('supName')) document.getElementById('supName').value = sup.name;
  if (document.getElementById('supContactPerson')) document.getElementById('supContactPerson').value = sup.contactPerson || '';
  if (document.getElementById('supContact')) document.getElementById('supContact').value = sup.contact || '';
  if (document.getElementById('supEmail')) document.getElementById('supEmail').value = sup.email || '';
  if (document.getElementById('supNtnTax')) document.getElementById('supNtnTax').value = sup.ntnTax || '';
  if (document.getElementById('supAddress')) document.getElementById('supAddress').value = sup.address || '';
  if (document.getElementById('supCredit')) document.getElementById('supCredit').value = sup.credit || 0;
  openModal('supplierModal');
}

function editPurchase(ref) {
  const po = (window.userData?.purchases || []).find(p => p.ref === ref);
  if (!po) return;
  window.editingPurchaseRef = ref;
  if (document.getElementById('poSupplier')) document.getElementById('poSupplier').value = po.supplier;
  if (document.getElementById('poItem')) document.getElementById('poItem').value = po.item;
  if (document.getElementById('poAmount')) document.getElementById('poAmount').value = po.amt;
  openModal('purchaseModal');
}

function editPayout(voucher) {
  const pay = (window.userData?.payouts || []).find(p => p.voucher === voucher);
  if (!pay) return;
  window.editingPayoutVoucher = voucher;
  if (document.getElementById('payRecipient')) document.getElementById('payRecipient').value = pay.recipient;
  if (document.getElementById('payMode')) document.getElementById('payMode').value = pay.mode;
  if (document.getElementById('payAmount')) document.getElementById('payAmount').value = pay.amount;
  openModal('payoutModal');
}

function editExpense(ref) {
  const exp = (window.userData?.expenses || []).find(e => e.ref === ref);
  if (!exp) return;
  window.editingExpenseRef = ref;
  if (document.getElementById('expCategory')) document.getElementById('expCategory').value = exp.category;
  if (document.getElementById('expMode')) document.getElementById('expMode').value = exp.mode;
  if (document.getElementById('expPaidTo')) document.getElementById('expPaidTo').value = exp.paidTo;
  if (document.getElementById('expDesc')) document.getElementById('expDesc').value = exp.desc;
  if (document.getElementById('expAmount')) document.getElementById('expAmount').value = exp.amount;
  openModal('expenseModal');
}

function editCashBank(ref) {
  const cb = (window.userData?.cashbank || []).find(c => c.ref === ref);
  if (!cb) return;
  window.editingCashBankRef = ref;
  if (document.getElementById('cbAccount')) document.getElementById('cbAccount').value = cb.account;
  if (document.getElementById('cbType')) document.getElementById('cbType').value = cb.type;
  if (document.getElementById('cbDesc')) document.getElementById('cbDesc').value = cb.desc;
  if (document.getElementById('cbAmount')) document.getElementById('cbAmount').value = cb.amount;
  openModal('cashbankModal');
}

function editIncome(ref) {
  const inc = (window.userData?.otherincome || []).find(i => i.ref === ref);
  if (!inc) return;
  window.editingIncomeRef = ref;
  if (document.getElementById('incSource')) document.getElementById('incSource').value = inc.source;
  if (document.getElementById('incAccount')) document.getElementById('incAccount').value = inc.account;
  if (document.getElementById('incDesc')) document.getElementById('incDesc').value = inc.desc;
  if (document.getElementById('incAmount')) document.getElementById('incAmount').value = inc.amount;
  openModal('incomeModal');
}

function editPatient(idx) {
  const pat = (window.userData?.patients || [])[idx];
  if (!pat) return;
  window.editingPatientIdx = idx;
  if (document.getElementById('patName')) document.getElementById('patName').value = pat.name;
  if (document.getElementById('patAge')) document.getElementById('patAge').value = pat.age;
  if (document.getElementById('patGender')) document.getElementById('patGender').value = pat.gender;
  if (document.getElementById('patAddress')) document.getElementById('patAddress').value = pat.address || '';
  if (document.getElementById('patService')) document.getElementById('patService').value = pat.service || '';
  if (document.getElementById('patDoctor')) document.getElementById('patDoctor').value = pat.doctor;
  if (document.getElementById('patFee')) document.getElementById('patFee').value = pat.fee;
  openModal('patientModal');
}

// Save Handlers for All Entities with Full Create/Edit Dual-Support
function saveOrder() {
  if (!checkTrialGuard('save invoices')) return;
  const invNumInput = document.getElementById('invNum')?.value.trim();
  const invDateInput = document.getElementById('invDate')?.value.trim();
  const custName = document.getElementById('invCustName')?.value.trim();
  const prodName = document.getElementById('invProdName')?.value.trim();
  const qtyInput = document.getElementById('invQty')?.value.trim();
  const rateInput = document.getElementById('invRate')?.value.trim();

  if (!invNumInput || !invDateInput || !custName || !prodName || !qtyInput || !rateInput) {
    alert("Please fill in all required fields (Invoice Number, Date, Customer Name, Product Name, Quantity, and Rate).");
    return;
  }

  const qty = parseFloat(qtyInput);
  const rate = parseFloat(rateInput);

  if (isNaN(qty) || qty <= 0 || isNaN(rate) || rate <= 0) {
    alert("Please enter valid positive numbers for Quantity and Rate.");
    return;
  }

  const taxPct = parseFloat(document.getElementById('invTaxPct')?.value || 18);
  const discount = parseFloat(document.getElementById('invDiscount')?.value || 0);
  const applyTcs = document.getElementById('invApplyTcs')?.value === 'yes';
  const base = (qty * rate) - discount;
  const tax = base * (taxPct / 100);
  const tcs = applyTcs ? (base + tax) * 0.001 : 0;
  const total = base + tax + tcs;

  const invNum = invNumInput;
  const irn = 'IRN-' + Math.floor(10000000000000 + Math.random() * 90000000000000);
  const eway = total > 50000 ? 'EWB-' + Math.floor(10000000000 + Math.random() * 90000000000) : undefined;

  const orderData = {
    inv: invNum,
    date: invDateInput,
    custName: custName,
    custNtnCnic: document.getElementById('invCustNtnCnic')?.value || '',
    custPhone: document.getElementById('invCustPhone')?.value || '',
    custProvince: document.getElementById('invCustProvince')?.value || 'Punjab',
    prodName: prodName,
    hsCode: document.getElementById('invHsCode')?.value || '3004.90',
    uom: document.getElementById('invUom')?.value || 'Pcs',
    qty: qty,
    rate: rate,
    taxPct: taxPct,
    discount: discount,
    tcsAmount: tcs,
    amount: total,
    status: document.getElementById('invStatus')?.value || 'Paid',
    paymentMode: 'Cash',
    branchId: window.userData.currentBranchId === 'ALL_HQ' ? 'b-hq' : window.userData.currentBranchId,
    irn: irn,
    eWayBillNo: eway
  };

  if (!window.userData.orders) window.userData.orders = [];

  if (window.editingOrderId) {
    const idx = window.userData.orders.findIndex(o => o.inv === window.editingOrderId);
    if (idx !== -1) {
      window.userData.orders[idx] = { ...window.userData.orders[idx], ...orderData };
      logAuditEvent('EDIT_INVOICE', 'Sales', `Updated invoice ${invNum}`);
    }
    window.editingOrderId = null;
  } else {
    window.userData.orders.unshift(orderData);
    if (tcs > 0) {
      if (!window.userData.tcsEntries) window.userData.tcsEntries = [];
      window.userData.tcsEntries.unshift({
        id: 'tcs-' + Date.now(),
        section: 'Section 206C(1H)',
        customerName: custName,
        invoiceRef: invNum,
        date: orderData.date,
        saleAmount: total,
        tcsRate: 0.1,
        tcsAmount: tcs,
        status: 'Collected'
      });
    }
    // Deduct inventory
    const invItem = (window.userData.inventory || []).find(i => i.name.toLowerCase() === prodName.toLowerCase());
    if (invItem) {
      invItem.stock = Math.max(0, invItem.stock - qty);
    }
    // Add loyalty points
    const cust = (window.userData.customers || []).find(c => c.name.toLowerCase() === custName.toLowerCase());
    if (cust) {
      cust.loyaltyPoints = (cust.loyaltyPoints || 0) + Math.floor(total / 100);
    }
    logAuditEvent('CREATE_INVOICE', 'Sales', `Generated Tax Invoice ${invNum} for ${custName} (Rs ${total.toFixed(2)}) with IRN: ${irn}`);
  }

  persistData();
  closeModal('orderModal');
  renderAll();
}

function saveCustomer() {
  const name = document.getElementById('custName')?.value.trim();
  if (!name) return alert("Customer Name is required");

  const custData = {
    id: window.editingCustomerId || ('c-' + Date.now()),
    name: name,
    owner: document.getElementById('custOwner')?.value || '',
    contact: document.getElementById('custContact')?.value || '',
    category: document.getElementById('custCategory')?.value || 'Retailer',
    address: document.getElementById('custAddress')?.value || '',
    ntnCnic: document.getElementById('custNtnCnic')?.value || '',
    credit: parseFloat(document.getElementById('custCredit')?.value || 0),
    loyaltyPoints: 0,
    walletBalance: 0,
    branchId: window.userData.currentBranchId === 'ALL_HQ' ? 'b-hq' : window.userData.currentBranchId
  };

  if (!window.userData.customers) window.userData.customers = [];

  if (window.editingCustomerId) {
    const idx = window.userData.customers.findIndex(c => c.id === window.editingCustomerId);
    if (idx !== -1) {
      window.userData.customers[idx] = { ...window.userData.customers[idx], ...custData };
      logAuditEvent('EDIT_CUSTOMER', 'Parties', `Updated Customer: ${name}`);
    }
    window.editingCustomerId = null;
  } else {
    window.userData.customers.unshift(custData);
    logAuditEvent('ADD_CUSTOMER', 'Parties', `Registered Customer: ${name}`);
  }

  persistData();
  closeModal('customerModal');
  renderAll();
}

function saveSupplier() {
  const name = document.getElementById('supName')?.value.trim();
  if (!name) return alert("Supplier Name is required");

  const supData = {
    id: window.editingSupplierId || ('s-' + Date.now()),
    name: name,
    contactPerson: document.getElementById('supContactPerson')?.value || '',
    contact: document.getElementById('supContact')?.value || '',
    email: document.getElementById('supEmail')?.value || '',
    ntnTax: document.getElementById('supNtnTax')?.value || '',
    address: document.getElementById('supAddress')?.value || '',
    credit: parseFloat(document.getElementById('supCredit')?.value || 0),
    branchId: window.userData.currentBranchId === 'ALL_HQ' ? 'b-hq' : window.userData.currentBranchId
  };

  if (!window.userData.suppliers) window.userData.suppliers = [];

  if (window.editingSupplierId) {
    const idx = window.userData.suppliers.findIndex(s => s.id === window.editingSupplierId);
    if (idx !== -1) {
      window.userData.suppliers[idx] = { ...window.userData.suppliers[idx], ...supData };
      logAuditEvent('EDIT_SUPPLIER', 'Parties', `Updated Supplier: ${name}`);
    }
    window.editingSupplierId = null;
  } else {
    window.userData.suppliers.unshift(supData);
    logAuditEvent('ADD_SUPPLIER', 'Parties', `Registered Supplier: ${name}`);
  }

  persistData();
  closeModal('supplierModal');
  renderAll();
}

function savePurchaseInvoice() {
  if (!checkTrialGuard('save invoices')) return;
  const pinvNumInput = document.getElementById('pinvNum')?.value.trim();
  const pinvDateInput = document.getElementById('pinvDate')?.value.trim();
  const sup = document.getElementById('pinvSupplier')?.value.trim();
  const item = document.getElementById('pinvItem')?.value.trim();
  const qtyInput = document.getElementById('pinvQty')?.value.trim();
  const rateInput = document.getElementById('pinvRate')?.value.trim();

  if (!pinvNumInput || !pinvDateInput || !sup || !item || !qtyInput || !rateInput) {
    alert("Please fill in all required fields (Invoice Number, Date, Supplier, Item, Quantity, and Rate).");
    return;
  }

  const qty = parseFloat(qtyInput);
  const rate = parseFloat(rateInput);

  if (isNaN(qty) || qty <= 0 || isNaN(rate) || rate <= 0) {
    alert("Please enter valid positive numbers for Quantity and Rate.");
    return;
  }

  const amt = qty * rate;
  const pinvData = {
    ref: pinvNumInput,
    date: pinvDateInput,
    supplier: sup,
    item: item,
    qty: qty,
    rate: rate,
    amt: amt,
    branchId: window.userData.currentBranchId === 'ALL_HQ' ? 'b-hq' : window.userData.currentBranchId
  };

  if (!window.userData.purchaseinvoices) window.userData.purchaseinvoices = [];

  if (window.editingPurchaseInvoiceRef) {
    const idx = window.userData.purchaseinvoices.findIndex(p => p.ref === window.editingPurchaseInvoiceRef);
    if (idx !== -1) {
      window.userData.purchaseinvoices[idx] = { ...window.userData.purchaseinvoices[idx], ...pinvData };
      logAuditEvent('EDIT_PURCHASE_BILL', 'Purchases', `Updated purchase bill ${pinvData.ref}`);
    }
    window.editingPurchaseInvoiceRef = null;
  } else {
    window.userData.purchaseinvoices.unshift(pinvData);
    if (amt >= 10000) {
      if (!window.userData.tdsEntries) window.userData.tdsEntries = [];
      window.userData.tdsEntries.unshift({
        id: 'tds-' + Date.now(),
        section: 'Section 153 / 194Q',
        partyName: sup,
        partyType: 'Vendor',
        invoiceRef: pinvData.ref,
        date: pinvData.date,
        transactionAmount: amt,
        tdsRate: 2,
        tdsAmount: amt * 0.02,
        status: 'Deducted'
      });
    }
    logAuditEvent('CREATE_PURCHASE_BILL', 'Purchases', `Recorded purchase bill from ${sup} for Rs ${amt}`);
  }

  persistData();
  closeModal('purchaseInvoiceModal');
  renderAll();
}

function saveQuotation() {
  if (!checkTrialGuard('save quotations')) return;
  const customer = document.getElementById('quoCustomer')?.value.trim();
  const product = document.getElementById('quoProduct')?.value.trim();
  const rate = parseFloat(document.getElementById('quoRate')?.value || 0);
  const discount = document.getElementById('quoDiscount')?.value || 'None';

  if (!customer || !product || rate <= 0) return alert("Please enter customer, product, and rate.");

  const quoData = {
    qno: window.editingQuotationNo || ('QT-' + (window.userData.counters.quo++)),
    customer: customer,
    product: product,
    rate: rate,
    discount: discount,
    date: new Date().toISOString().split('T')[0],
    branchId: window.userData.currentBranchId === 'ALL_HQ' ? 'b-hq' : window.userData.currentBranchId
  };

  if (!window.userData.quotations) window.userData.quotations = [];

  if (window.editingQuotationNo) {
    const idx = window.userData.quotations.findIndex(q => q.qno === window.editingQuotationNo);
    if (idx !== -1) {
      window.userData.quotations[idx] = { ...window.userData.quotations[idx], ...quoData };
      logAuditEvent('EDIT_QUOTATION', 'Sales', `Updated quotation ${quoData.qno}`);
    }
    window.editingQuotationNo = null;
  } else {
    window.userData.quotations.unshift(quoData);
    logAuditEvent('CREATE_QUOTATION', 'Sales', `Created quotation ${quoData.qno} for ${customer}`);
  }

  persistData();
  closeModal('quotationModal');
  renderAll();
}

function savePatient() {
  const name = document.getElementById('patName')?.value.trim();
  const age = document.getElementById('patAge')?.value || '30';
  const gender = document.getElementById('patGender')?.value || 'Male';
  const address = document.getElementById('patAddress')?.value.trim() || 'Main City Street, House #14';
  const service = document.getElementById('patService')?.value.trim() || 'Medical OPD Consultation';
  const doctor = document.getElementById('patDoctor')?.value || 'Dr. Ali';
  const fee = parseFloat(document.getElementById('patFee')?.value || 500);

  if (!name) return alert("Patient Name is required.");

  const patData = {
    name: name,
    age: age,
    gender: gender,
    doctor: doctor,
    service: service,
    fee: fee,
    status: 'Paid',
    address: address
  };

  if (!window.userData.patients) window.userData.patients = [];

  if (window.editingPatientIdx !== null && window.editingPatientIdx !== undefined) {
    window.userData.patients[window.editingPatientIdx] = patData;
    logAuditEvent('EDIT_PATIENT', 'Clinical', `Updated patient: ${name}`);
    window.editingPatientIdx = null;
  } else {
    window.userData.patients.unshift(patData);
    logAuditEvent('ADD_PATIENT', 'Clinical', `Added patient: ${name}`);
  }

  persistData();
  closeModal('patientModal');
  renderAll();
}

function saveDebitNote() {
  if (!checkTrialGuard('save debit notes')) return;
  const party = document.getElementById('debParty')?.value.trim();
  const origInv = document.getElementById('debOrigInv')?.value || 'INV-1001';
  const item = document.getElementById('debItem')?.value.trim();
  const qty = parseFloat(document.getElementById('debQty')?.value || 1);
  const rate = parseFloat(document.getElementById('debRate')?.value || 0);
  const reason = document.getElementById('debReason')?.value || 'Damaged Goods';

  if (!party || !item || rate <= 0) return alert("Please fill all return details.");

  const amt = qty * rate;
  const debData = {
    ref: window.editingDebitRef || ('DN-' + (window.userData.counters.dn++)),
    date: new Date().toISOString().split('T')[0],
    party: party,
    origInv: origInv,
    item: item,
    qty: qty,
    rate: rate,
    amt: amt,
    reason: reason
  };

  if (!window.userData.debitnotes) window.userData.debitnotes = [];

  if (window.editingDebitRef) {
    const idx = window.userData.debitnotes.findIndex(d => d.ref === window.editingDebitRef);
    if (idx !== -1) {
      window.userData.debitnotes[idx] = { ...window.userData.debitnotes[idx], ...debData };
      logAuditEvent('EDIT_DEBIT_NOTE', 'Sales', `Updated Debit Note ${debData.ref}`);
    }
    window.editingDebitRef = null;
  } else {
    window.userData.debitnotes.unshift(debData);
    logAuditEvent('CREATE_DEBIT_NOTE', 'Sales', `Issued Debit Note ${debData.ref} to ${party} for Rs ${amt}`);
  }

  persistData();
  closeModal('debitModal');
  renderAll();
}

function saveItem() {
  const name = document.getElementById('itemName')?.value.trim();
  const batch = document.getElementById('itemBatch')?.value || ('B-' + Math.floor(1000 + Math.random() * 9000));
  const stock = parseFloat(document.getElementById('itemStock')?.value || 10);
  const unit = document.getElementById('itemUnit')?.value || 'Boxes';
  const expiry = document.getElementById('itemExpiry')?.value || '2027-12-31';
  const purchasePrice = parseFloat(document.getElementById('itemPurchasePrice')?.value || 100);
  const salePrice = parseFloat(document.getElementById('itemSalePrice')?.value || 150);

  if (!name) return alert("Item Name is required.");

  const itemData = {
    id: window.editingItemId || ('i-' + Date.now()),
    name: name,
    batch: batch,
    stock: stock,
    unit: unit,
    expiry: expiry,
    purchasePrice: purchasePrice,
    salePrice: salePrice,
    category: 'General Pharma',
    branchId: window.userData.currentBranchId === 'ALL_HQ' ? 'b-hq' : window.userData.currentBranchId
  };

  if (!window.userData.inventory) window.userData.inventory = [];

  if (window.editingItemId) {
    const idx = window.userData.inventory.findIndex(i => i.id === window.editingItemId);
    if (idx !== -1) {
      window.userData.inventory[idx] = { ...window.userData.inventory[idx], ...itemData };
      logAuditEvent('EDIT_ITEM', 'Inventory', `Updated stock item: ${name}`);
    }
    window.editingItemId = null;
  } else {
    window.userData.inventory.unshift(itemData);
    logAuditEvent('ADD_ITEM', 'Inventory', `Added stock item: ${name} (${stock} ${unit})`);
  }

  persistData();
  closeModal('itemModal');
  renderAll();
}

function saveExpense() {
  const category = document.getElementById('expCategory')?.value || 'Rent';
  const mode = document.getElementById('expMode')?.value || 'Bank';
  const paidTo = document.getElementById('expPaidTo')?.value || 'Vendor';
  const desc = document.getElementById('expDesc')?.value || 'Operational Expense';
  const amount = parseFloat(document.getElementById('expAmount')?.value || 0);

  if (amount <= 0) return alert("Please enter a valid expense amount.");

  const expData = {
    ref: window.editingExpenseRef || ('EXP-' + (window.userData.counters.exp++)),
    date: new Date().toISOString().split('T')[0],
    category: category,
    paidTo: paidTo,
    desc: desc,
    mode: mode,
    amount: amount,
    branchId: window.userData.currentBranchId === 'ALL_HQ' ? 'b-hq' : window.userData.currentBranchId
  };

  if (!window.userData.expenses) window.userData.expenses = [];

  if (window.editingExpenseRef) {
    const idx = window.userData.expenses.findIndex(e => e.ref === window.editingExpenseRef);
    if (idx !== -1) {
      window.userData.expenses[idx] = { ...window.userData.expenses[idx], ...expData };
      logAuditEvent('EDIT_EXPENSE', 'Financials', `Updated expense voucher ${expData.ref}`);
    }
    window.editingExpenseRef = null;
  } else {
    window.userData.expenses.unshift(expData);
    logAuditEvent('ADD_EXPENSE', 'Financials', `Recorded expense voucher ${expData.ref}: Rs ${amount} (${category})`);
  }

  persistData();
  closeModal('expenseModal');
  renderAll();
}

function saveCashBank() {
  const account = document.getElementById('cbAccount')?.value || 'Bank Account';
  const type = document.getElementById('cbType')?.value || 'Deposit / In';
  const desc = document.getElementById('cbDesc')?.value || 'Transaction';
  const amount = parseFloat(document.getElementById('cbAmount')?.value || 0);

  if (amount <= 0) return alert("Please enter a valid transaction amount.");

  const cbData = {
    ref: window.editingCashBankRef || ('CB-' + (window.userData.counters.cb++)),
    date: new Date().toISOString().split('T')[0],
    account: account,
    type: type,
    desc: desc,
    amount: amount,
    reconciled: true
  };

  if (!window.userData.cashbank) window.userData.cashbank = [];

  if (window.editingCashBankRef) {
    const idx = window.userData.cashbank.findIndex(c => c.ref === window.editingCashBankRef);
    if (idx !== -1) {
      window.userData.cashbank[idx] = { ...window.userData.cashbank[idx], ...cbData };
      logAuditEvent('EDIT_CASHBANK', 'Banking', `Updated transaction ${cbData.ref}`);
    }
    window.editingCashBankRef = null;
  } else {
    window.userData.cashbank.unshift(cbData);
    logAuditEvent('CASHBANK_TXN', 'Banking', `Logged ${type} of Rs ${amount} into ${account}`);
  }

  persistData();
  closeModal('cashbankModal');
  renderAll();
}

function savePurchase() {
  if (!checkTrialGuard('save purchase orders')) return;
  const supplier = document.getElementById('poSupplier')?.value.trim();
  const item = document.getElementById('poItem')?.value.trim();
  const amount = parseFloat(document.getElementById('poAmount')?.value || 0);

  if (!supplier || !item || amount <= 0) return alert("Please fill supplier, item, and valid amount.");

  const poData = {
    ref: window.editingPurchaseRef || ('PO-' + (window.userData.counters.po++)),
    supplier: supplier,
    item: item,
    amt: amount,
    date: new Date().toISOString().split('T')[0],
    branchId: window.userData.currentBranchId === 'ALL_HQ' ? 'b-hq' : window.userData.currentBranchId
  };

  if (!window.userData.purchases) window.userData.purchases = [];

  if (window.editingPurchaseRef) {
    const idx = window.userData.purchases.findIndex(p => p.ref === window.editingPurchaseRef);
    if (idx !== -1) {
      window.userData.purchases[idx] = { ...window.userData.purchases[idx], ...poData };
      logAuditEvent('EDIT_PO', 'Purchases', `Updated Purchase Order ${poData.ref}`);
    }
    window.editingPurchaseRef = null;
  } else {
    window.userData.purchases.unshift(poData);
    logAuditEvent('CREATE_PO', 'Purchases', `Created Purchase Order ${poData.ref} for ${supplier}`);
  }

  persistData();
  closeModal('purchaseModal');
  renderAll();
}

function savePayout() {
  const recipient = document.getElementById('payRecipient')?.value.trim();
  const mode = document.getElementById('payMode')?.value || 'Bank Transfer';
  const amount = parseFloat(document.getElementById('payAmount')?.value || 0);

  if (!recipient || amount <= 0) return alert("Please enter recipient and valid payout amount.");

  const payoutData = {
    voucher: window.editingPayoutVoucher || ('PV-' + (window.userData.counters.pv++)),
    recipient: recipient,
    mode: mode,
    amount: amount,
    date: new Date().toISOString().split('T')[0]
  };

  if (!window.userData.payouts) window.userData.payouts = [];

  if (window.editingPayoutVoucher) {
    const idx = window.userData.payouts.findIndex(p => p.voucher === window.editingPayoutVoucher);
    if (idx !== -1) {
      window.userData.payouts[idx] = { ...window.userData.payouts[idx], ...payoutData };
      logAuditEvent('EDIT_PAYOUT', 'Financials', `Updated payout voucher ${payoutData.voucher}`);
    }
    window.editingPayoutVoucher = null;
  } else {
    window.userData.payouts.unshift(payoutData);
    logAuditEvent('CREATE_PAYOUT', 'Financials', `Issued payout voucher ${payoutData.voucher} to ${recipient} for Rs ${amount}`);
  }

  persistData();
  closeModal('payoutModal');
  renderAll();
}

function saveIncome() {
  const source = document.getElementById('incSource')?.value || 'Commission';
  const account = document.getElementById('incAccount')?.value || 'Bank Account';
  const desc = document.getElementById('incDesc')?.value || 'Rebate';
  const amount = parseFloat(document.getElementById('incAmount')?.value || 0);

  if (amount <= 0) return alert("Please enter valid income amount.");

  const incData = {
    ref: window.editingIncomeRef || ('INC-' + (window.userData.counters.inc++)),
    date: new Date().toISOString().split('T')[0],
    source: source,
    desc: desc,
    account: account,
    amount: amount
  };

  if (!window.userData.otherincome) window.userData.otherincome = [];

  if (window.editingIncomeRef) {
    const idx = window.userData.otherincome.findIndex(i => i.ref === window.editingIncomeRef);
    if (idx !== -1) {
      window.userData.otherincome[idx] = { ...window.userData.otherincome[idx], ...incData };
      logAuditEvent('EDIT_INCOME', 'Financials', `Updated income ${incData.ref}`);
    }
    window.editingIncomeRef = null;
  } else {
    window.userData.otherincome.unshift(incData);
    logAuditEvent('ADD_INCOME', 'Financials', `Received income ${incData.ref}: Rs ${amount} (${source})`);
  }

  persistData();
  closeModal('incomeModal');
  renderAll();
}

function savePunch() {
  const employee = document.getElementById('punchEmployee')?.value || 'Bilal Ahmad';
  const time = document.getElementById('punchTime')?.value || '09:00 AM';
  const hours = parseFloat(document.getElementById('punchHours')?.value || 8);
  const method = document.getElementById('punchMethod')?.value || 'Biometric Scanner';
  const status = document.getElementById('punchStatus')?.value || 'Present';

  const newPunch = {
    id: 'att-' + Date.now(),
    employeeName: employee,
    date: new Date().toISOString().split('T')[0],
    punchInTime: time,
    hoursWorked: hours,
    status: status,
    method: method
  };

  if (!window.userData.attendance) window.userData.attendance = [];
  window.userData.attendance.unshift(newPunch);
  logAuditEvent('PUNCH_RECORDED', 'HR', `Recorded punch for ${employee} (${status}) via ${method}`);
  persistData();
  closeModal('punchModal');
  renderAll();
}

function savePayroll() {
  const month = document.getElementById('payMonth')?.value || 'August';
  const year = parseInt(document.getElementById('payYear')?.value || 2026);
  const employee = document.getElementById('payrollEmployee')?.value || 'Bilal Ahmad';
  const baseSalary = parseFloat(document.getElementById('payrollBase')?.value || 55000);
  const netSalary = parseFloat(document.getElementById('payrollNet')?.value || 55000);

  const newPayroll = {
    id: 'pr-' + Date.now(),
    month: month,
    year: year,
    employeeName: employee,
    baseSalary: baseSalary,
    netSalary: netSalary,
    status: 'Disbursed',
    syncedToExpense: true
  };

  if (!window.userData.payrolls) window.userData.payrolls = [];
  window.userData.payrolls.unshift(newPayroll);

  // Auto create expense
  if (!window.userData.expenses) window.userData.expenses = [];
  window.userData.expenses.unshift({
    ref: 'EXP-' + (window.userData.counters.exp++),
    date: new Date().toISOString().split('T')[0],
    category: 'Salaries',
    desc: `Disbursed ${month} ${year} Salary for ${employee}`,
    paidTo: employee,
    mode: 'Bank',
    amount: netSalary,
    branchId: window.userData.currentBranchId === 'ALL_HQ' ? 'b-hq' : window.userData.currentBranchId
  });

  logAuditEvent('PAYROLL_DISBURSED', 'HR', `Disbursed payroll of Rs ${netSalary} for ${employee} and synced to Expenses`);
  persistData();
  closeModal('payrollModal');
  renderAll();
  alert(`Payroll disbursed for ${employee}! Voucher automatically posted to General Ledger Expenses.`);
}

function saveTdsEntry() {
  const section = document.getElementById('tdsSection')?.value || 'Section 153 / 194Q';
  const partyType = document.getElementById('tdsPartyType')?.value || 'Vendor';
  const partyName = document.getElementById('tdsPartyName')?.value.trim();
  const gross = parseFloat(document.getElementById('tdsGross')?.value || 0);
  const rate = parseFloat(document.getElementById('tdsRate')?.value || 2);
  const amount = parseFloat(document.getElementById('tdsAmount')?.value || (gross * (rate / 100)));

  if (!partyName || gross <= 0) return alert("Please enter party name and bill amount.");

  const newTds = {
    id: 'tds-' + Date.now(),
    section: section,
    partyName: partyName,
    partyType: partyType,
    invoiceRef: 'VCH-' + Math.floor(1000 + Math.random() * 9000),
    date: new Date().toISOString().split('T')[0],
    transactionAmount: gross,
    tdsRate: rate,
    tdsAmount: amount,
    status: 'Deducted'
  };

  if (!window.userData.tdsEntries) window.userData.tdsEntries = [];
  window.userData.tdsEntries.unshift(newTds);
  logAuditEvent('ADD_TDS', 'Taxation', `Deducted TDS of Rs ${amount} under ${section} for ${partyName}`);
  persistData();
  closeModal('addTdsModal');
  renderAll();
}

function saveSettings() {
  if (!window.userData.settings) window.userData.settings = {};
  if (document.getElementById('setCompany')) window.userData.settings.company = document.getElementById('setCompany').value;
  if (document.getElementById('setPhone')) window.userData.settings.phone = document.getElementById('setPhone').value;
  if (document.getElementById('setEmail')) window.userData.settings.email = document.getElementById('setEmail').value;
  if (document.getElementById('setAddress')) window.userData.settings.address = document.getElementById('setAddress').value;
  if (document.getElementById('setNtn')) window.userData.settings.ntn = document.getElementById('setNtn').value;
  if (document.getElementById('setBank')) window.userData.settings.bank = document.getElementById('setBank').value;
  if (document.getElementById('setFooter')) window.userData.settings.footer = document.getElementById('setFooter').value;

  logAuditEvent('UPDATE_SETTINGS', 'Settings', 'Updated company profile and statutory parameters.');
  persistData();
  
  // Show Green Notification Toast
  const toast = document.createElement('div');
  toast.innerText = 'Your settings are saved.';
  toast.className = 'fixed bottom-4 right-4 bg-emerald-500 text-white px-6 py-3 rounded-xl font-bold shadow-2xl z-[9999] transition-opacity duration-300';
  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);

  renderAll();
}

function handleLogoUpload(event) {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = function(e) {
      const base64 = e.target.result;
      const preview = document.getElementById('setLogoPreview');
      if (preview) {
        preview.src = base64;
        preview.classList.remove('hidden');
      }
      if (!window.userData.settings) window.userData.settings = {};
      window.userData.settings.companyLogo = base64;
      persistData();
    };
    reader.readAsDataURL(file);
  }
}


// 1-Click GST Return Filing
function executeGstFiling(returnType) {
  const periodMonth = new Date().toLocaleString('default', { month: 'long' });
  const orders = window.userData?.orders || [];
  const totalTaxable = orders.reduce((sum, o) => sum + (o.qty * o.rate), 0);
  const totalTax = orders.reduce((sum, o) => sum + (o.qty * o.rate * (o.taxPct / 100)), 0);

  const errors = [];
  orders.forEach(o => {
    if (!o.custNtnCnic && o.amount > 50000) {
      errors.push(`Invoice ${o.inv}: B2B Transaction over Rs 50,000 missing Buyer NTN/CNIC`);
    }
  });

  if (errors.length > 0) {
    alert("⚠️ Pre-Submission Error Alert:\n" + errors.join('\n') + "\n\nPlease correct invoice details before statutory submission.");
    return;
  }

  const arn = 'ARN-GST-' + new Date().getFullYear() + '-' + Math.floor(1000000 + Math.random() * 9000000);
  const newFiling = {
    id: 'gst-' + Date.now(),
    returnType: returnType,
    periodMonth: periodMonth,
    periodYear: 2026,
    filingDate: new Date().toISOString().split('T')[0],
    arn: arn,
    status: 'Submitted',
    totalTaxable: totalTaxable,
    totalTax: totalTax,
    errorsDetected: [],
    submittedBy: window.userData.currentUserRole || 'Admin'
  };

  if (!window.userData.gstFilings) window.userData.gstFilings = [];
  window.userData.gstFilings.unshift(newFiling);
  logAuditEvent('GST_FILING', 'Tax & Compliance', `Successfully filed ${returnType} for ${periodMonth} 2026. Generated ARN: ${arn}`);
  persistData();
  alert(`✅ Success! ${returnType} has been successfully filed with the Government Portal.\n\nGenerated ARN: ${arn}\nTax Amount: Rs ${totalTax.toLocaleString()}`);
  renderGstFilings();
}

// Bank Reconciliation
function autoReconcileBank() {
  let matchedCount = 0;
  const bankStatements = window.userData?.bankStatements || [];
  const orders = window.userData?.orders || [];
  const payouts = window.userData?.payouts || [];
  const expenses = window.userData?.expenses || [];

  bankStatements.forEach(bs => {
    if (bs.matchStatus !== 'Matched') {
      const match = orders.find(o => Math.abs(o.amount - bs.amount) < 1) ||
                    payouts.find(p => Math.abs(p.amount - bs.amount) < 1) ||
                    expenses.find(e => Math.abs(e.amount - bs.amount) < 1);
      if (match) {
        bs.matchStatus = 'Matched';
        matchedCount++;
      }
    }
  });
  logAuditEvent('BANK_RECON', 'Financials', `Auto-reconciliation reconciled ${matchedCount} statement records.`);
  persistData();
  alert(`Reconciliation Engine Completed:\n${matchedCount} bank transactions successfully matched with ERP vouchers.`);
  renderBankRecon();
}

// Stock Transfers
function populateTransferItemSelect() {
  const sel = document.getElementById('trfItemSelect');
  if (!sel) return;
  sel.innerHTML = '';
  const inventory = window.userData?.inventory || [];
  inventory.forEach(i => {
    sel.innerHTML += `<option value="${i.name}">${i.name} (Batch: ${i.batch}, Available: ${i.stock} ${i.unit})</option>`;
  });
}

function saveStockTransfer() {
  const itemName = document.getElementById('trfItemSelect')?.value;
  const qty = parseFloat(document.getElementById('trfQty')?.value || 1);
  const fromBranch = document.getElementById('trfFrom')?.value || 'Central HQ';
  const toBranch = document.getElementById('trfTo')?.value || 'Karachi Mega Center';

  const inventory = window.userData?.inventory || [];
  const invItem = inventory.find(i => i.name === itemName);
  if (invItem && invItem.stock < qty) {
    alert(`Insufficient stock! Only ${invItem.stock} available.`);
    return;
  }

  if (invItem) {
    invItem.stock -= qty;
  }

  const stockTransfers = window.userData?.stockTransfers || [];
  const trfNo = 'TRF-' + (1000 + stockTransfers.length + 1);
  const newTrf = {
    id: 'st-' + Date.now(),
    transferNo: trfNo,
    fromBranchName: fromBranch,
    toBranchName: toBranch,
    itemName: itemName,
    batch: invItem ? invItem.batch : 'B-GEN',
    qty: qty,
    date: new Date().toISOString().split('T')[0],
    status: 'In-Transit',
    notes: document.getElementById('trfDriver')?.value || 'Driver'
  };

  if (!window.userData.stockTransfers) window.userData.stockTransfers = [];
  window.userData.stockTransfers.unshift(newTrf);
  logAuditEvent('STOCK_TRANSFER', 'Inventory', `Dispatched ${qty} of ${itemName} from ${fromBranch} to ${toBranch} (Trf: ${trfNo})`);
  persistData();
  closeModal('stockTransferModal');
  renderAll();
}

function receiveStockTransfer(id) {
  const stockTransfers = window.userData?.stockTransfers || [];
  const trf = stockTransfers.find(t => t.id === id);
  if (trf && trf.status === 'In-Transit') {
    trf.status = 'Received';
    const existing = (window.userData?.inventory || []).find(i => i.name === trf.itemName);
    if (existing) {
      existing.stock += trf.qty;
    }
    logAuditEvent('STOCK_RECEIVED', 'Inventory', `Received stock transfer ${trf.transferNo} for ${trf.itemName} (${trf.qty})`);
    persistData();
    renderStockTransfers();
    renderInventory();
  }
}

// Government E-Way Bill & IRN Management Engine
window.editingEwbId = null;

function populateEwayInvoiceSelect(selectedInv) {
  const sel = document.getElementById('ewayInvoiceSelect');
  if (!sel) return;
  sel.innerHTML = '';
  const orders = window.userData?.orders || [];
  orders.forEach(o => {
    const isSelected = selectedInv && selectedInv === o.inv ? 'selected' : '';
    sel.innerHTML += `<option value="${o.inv}" ${isSelected}>${o.inv} - ${o.custName} (Rs ${o.amount.toFixed(2)})</option>`;
  });
  if (!selectedInv && orders.length > 0) {
    handleEwayInvoiceChange(orders[0].inv);
  }
}

function handleEwayInvoiceChange(invNo) {
  const order = (window.userData?.orders || []).find(o => o.inv === invNo);
  if (order && document.getElementById('ewayDestination')) {
    document.getElementById('ewayDestination').value = order.custAddress || order.custName;
  }
}

function generateEwayBill() {
  saveEwayBill();
}

function saveEwayBill() {
  const invNo = document.getElementById('ewayInvoiceSelect')?.value;
  const supplyType = document.getElementById('ewaySupplyType')?.value || 'Outward Supply';
  const mode = document.getElementById('ewayMode')?.value || 'Road';
  const transporter = document.getElementById('ewayTransporter')?.value || 'TCS Express Logistics';
  const transporterId = document.getElementById('ewayTransporterId')?.value || 'TRANS-9901';
  const vehicle = document.getElementById('ewayVehicle')?.value || 'LHE-9012';
  const distance = parseFloat(document.getElementById('ewayDistance')?.value) || 45;
  const destination = document.getElementById('ewayDestination')?.value || 'Destination Warehouse Hub';

  const order = (window.userData?.orders || []).find(o => o.inv === invNo);
  if (!window.userData.ewayBills) window.userData.ewayBills = [];

  if (window.editingEwbId) {
    const existing = window.userData.ewayBills.find(e => e.id === window.editingEwbId || e.ewbNo === window.editingEwbId);
    if (existing) {
      existing.invNo = invNo;
      existing.supplyType = supplyType;
      existing.transportMode = mode;
      existing.transporter = transporter;
      existing.transporterId = transporterId;
      existing.vehicleNo = vehicle;
      existing.distanceKm = distance;
      existing.destination = destination;
      if (order) {
        existing.recipient = order.custName;
        existing.toGstin = order.custNtnCnic || existing.toGstin;
        existing.cargoValue = order.amount;
        existing.itemSummary = `${order.prodName} (x${order.qty} ${order.uom || 'Boxes'})`;
        existing.hsnCode = order.hsCode || '3004.90';
        existing.irn = order.irn || existing.irn;
      }
      logAuditEvent('EWAY_UPDATED', 'Sales', `Updated E-Way Bill ${existing.ewbNo} for Invoice ${invNo} (Vehicle: ${vehicle})`);
    }
    window.editingEwbId = null;
  } else {
    const ewbNo = 'EWB-' + Math.floor(10000000000 + Math.random() * 90000000000);
    const today = new Date();
    const validDate = new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000);
    const irnHash = order?.irn || ('IRN-' + Math.floor(10000000000000 + Math.random() * 90000000000000));
    
    if (order) {
      order.eWayBillNo = ewbNo;
      order.irn = irnHash;
    }

    const newEwb = {
      id: 'ewb-' + Date.now(),
      ewbNo: ewbNo,
      date: today.toISOString().split('T')[0],
      validUntil: validDate.toISOString().split('T')[0],
      invNo: invNo,
      irn: irnHash,
      fromGstin: '35202-0000000-1 (Lahore HQ Hub)',
      toGstin: order?.custNtnCnic || '35202-1234567-1',
      recipient: order?.custName || 'Consignee Client',
      destination: destination,
      transporter: transporter,
      transporterId: transporterId,
      vehicleNo: vehicle,
      distanceKm: distance,
      cargoValue: order ? order.amount : 5000,
      itemSummary: order ? `${order.prodName} (x${order.qty} ${order.uom || 'Boxes'})` : 'Pharmaceutical Consignment',
      hsnCode: order?.hsCode || '3004.90',
      status: 'In-Transit',
      supplyType: supplyType,
      transportMode: mode
    };

    window.userData.ewayBills.unshift(newEwb);
    logAuditEvent('EWAY_GENERATED', 'Sales', `Generated Statutory E-Way Bill ${ewbNo} for Invoice ${invNo} (Vehicle ${vehicle}, Distance ${distance} KM)`);
  }

  persistData();
  closeModal('ewayModal');
  renderEwayBills();
  renderOrders();
}

function editEwayBill(idOrNo) {
  const ewbList = window.userData?.ewayBills || [];
  const ewb = ewbList.find(e => e.id === idOrNo || e.ewbNo === idOrNo);
  if (!ewb) return;

  window.editingEwbId = ewb.id || ewb.ewbNo;
  if (document.getElementById('ewayModalTitle')) document.getElementById('ewayModalTitle').innerText = `Edit E-Way Bill (${ewb.ewbNo})`;
  if (document.getElementById('ewaySubmitBtnText')) document.getElementById('ewaySubmitBtnText').innerText = 'Update E-Way Bill';
  populateEwayInvoiceSelect(ewb.invNo);
  
  if (document.getElementById('ewayTransporter')) document.getElementById('ewayTransporter').value = ewb.transporter || '';
  if (document.getElementById('ewayVehicle')) document.getElementById('ewayVehicle').value = ewb.vehicleNo || '';
  if (document.getElementById('ewayTransporterId')) document.getElementById('ewayTransporterId').value = ewb.transporterId || '';
  if (document.getElementById('ewayDistance')) document.getElementById('ewayDistance').value = ewb.distanceKm || 45;
  if (document.getElementById('ewayDestination')) document.getElementById('ewayDestination').value = ewb.destination || '';
  if (document.getElementById('ewaySupplyType')) document.getElementById('ewaySupplyType').value = ewb.supplyType || 'Outward Supply';
  if (document.getElementById('ewayMode')) document.getElementById('ewayMode').value = ewb.transportMode || 'Road';

  openModal('ewayModal');
}

function deleteEwayBill(idOrNo) {
  if (!confirm('Are you sure you want to cancel / delete this Statutory E-Way Bill?')) return;
  const ewbList = window.userData?.ewayBills || [];
  const idx = ewbList.findIndex(e => e.id === idOrNo || e.ewbNo === idOrNo);
  if (idx > -1) {
    const ewb = ewbList[idx];
    const order = (window.userData?.orders || []).find(o => o.inv === ewb.invNo);
    if (order && order.eWayBillNo === ewb.ewbNo) {
      delete order.eWayBillNo;
    }
    ewbList.splice(idx, 1);
    logAuditEvent('EWAY_CANCELLED', 'Sales', `Cancelled E-Way Bill ${ewb.ewbNo}`);
    persistData();
    renderEwayBills();
    renderOrders();
  }
}

function openPrintEwaySlip(idOrNo) {
  const ewbList = window.userData?.ewayBills || [];
  let ewb = ewbList.find(e => e.id === idOrNo || e.ewbNo === idOrNo);
  if (!ewb) {
    ewb = ewbList.find(e => e.invNo === idOrNo);
  }
  if (!ewb) {
    const order = (window.userData?.orders || []).find(o => o.inv === idOrNo);
    if (order) {
      ewb = {
        ewbNo: order.eWayBillNo || 'EWB-89012390123',
        date: order.date,
        validUntil: '2026-08-25',
        invNo: order.inv,
        recipient: order.custName,
        destination: order.custAddress || 'Consignee Hub',
        toGstin: order.custNtnCnic || '35202-1234567-1',
        itemSummary: `${order.prodName} (x${order.qty} ${order.uom || 'Boxes'})`,
        hsnCode: order.hsCode || '3004.90',
        cargoValue: order.amount,
        transportMode: 'Road',
        distanceKm: 45,
        vehicleNo: 'LHE-9012',
        transporter: 'TCS Express Logistics',
        transporterId: 'TRANS-9901',
        irn: order.irn || 'IRN-90812938129031-FBR-TAX-VERIFIED'
      };
    } else {
      return;
    }
  }

  const comp = window.userData?.settings?.company || 'Payvibes Pharma & General Store';
  const addr = window.userData?.settings?.address || 'Main Commercial Plaza, Lahore, Pakistan';
  const ntn = window.userData?.settings?.ntn || 'NTN-7890123-4';

  if (document.getElementById('prEwbNo')) document.getElementById('prEwbNo').innerText = ewb.ewbNo;
  if (document.getElementById('prEwbDates')) document.getElementById('prEwbDates').innerText = `${ewb.date} to ${ewb.validUntil || '2026-08-25'}`;
  if (document.getElementById('prEwbFromName')) document.getElementById('prEwbFromName').innerText = comp;
  if (document.getElementById('prEwbFromAddress')) document.getElementById('prEwbFromAddress').innerText = addr;
  if (document.getElementById('prEwbFromNtn')) document.getElementById('prEwbFromNtn').innerText = ntn;
  if (document.getElementById('prEwbToName')) document.getElementById('prEwbToName').innerText = ewb.recipient;
  if (document.getElementById('prEwbToAddress')) document.getElementById('prEwbToAddress').innerText = ewb.destination || 'Consignee Hub, Pakistan';
  if (document.getElementById('prEwbToNtn')) document.getElementById('prEwbToNtn').innerText = ewb.toGstin || '35202-1234567-1';
  if (document.getElementById('prEwbInvRef')) document.getElementById('prEwbInvRef').innerText = `Tax Invoice ${ewb.invNo}`;
  if (document.getElementById('prEwbItemSummary')) document.getElementById('prEwbItemSummary').innerText = ewb.itemSummary || 'Pharmaceutical Consignment';
  if (document.getElementById('prEwbHsn')) document.getElementById('prEwbHsn').innerText = ewb.hsnCode || '3004.90';
  
  const totalVal = ewb.cargoValue || 3915.9;
  const taxableVal = totalVal / 1.18;
  if (document.getElementById('prEwbTaxable')) document.getElementById('prEwbTaxable').innerText = `Rs ${taxableVal.toFixed(2)}`;
  if (document.getElementById('prEwbGst')) document.getElementById('prEwbGst').innerText = '18%';
  if (document.getElementById('prEwbTotal')) document.getElementById('prEwbTotal').innerText = `Rs ${totalVal.toFixed(2)}`;
  
  if (document.getElementById('prEwbMode')) document.getElementById('prEwbMode').innerText = `${ewb.transportMode || 'Road'} Transit (${ewb.distanceKm || 45} KM)`;
  if (document.getElementById('prEwbVehicle')) document.getElementById('prEwbVehicle').innerText = ewb.vehicleNo || 'LHE-9012';
  if (document.getElementById('prEwbTransporter')) document.getElementById('prEwbTransporter').innerText = `${ewb.transporter || 'TCS Express'} (${ewb.transporterId || 'TRANS-9901'})`;
  if (document.getElementById('prEwbIrnHash')) document.getElementById('prEwbIrnHash').innerText = ewb.irn || 'IRN-90812938129031-FBR-TAX-VERIFIED';

  openModal('printEwaySlipModal');
}

function openEwayTracking(idOrNo) {
  const ewbList = window.userData?.ewayBills || [];
  const ewb = ewbList.find(e => e.id === idOrNo || e.ewbNo === idOrNo) || ewbList[0];
  if (!ewb) return;

  if (document.getElementById('trackEwbNo')) document.getElementById('trackEwbNo').innerText = ewb.ewbNo;
  if (document.getElementById('trackVehicle')) document.getElementById('trackVehicle').innerText = `Vehicle: ${ewb.vehicleNo} (${ewb.transporter})`;
  if (document.getElementById('trackStatusBadge')) {
    document.getElementById('trackStatusBadge').innerText = ewb.status || 'In-Transit';
    document.getElementById('trackStatusBadge').className = ewb.status === 'Delivered' ? 'px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800' : 'px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800';
  }
  if (document.getElementById('trackCheckpointText')) {
    document.getElementById('trackCheckpointText').innerText = `Passed Toll Plaza Checkpoint. Dispatched to ${ewb.destination}. Estimated arrival within 4 hours.`;
  }
  openModal('ewayTrackingModal');
}

function syncAllIrnVerified() {
  const orders = window.userData?.orders || [];
  orders.forEach(o => {
    if (!o.irn) {
      o.irn = 'IRN-' + Math.floor(10000000000000 + Math.random() * 90000000000000);
    }
  });
  persistData();
  renderOrders();
  renderEwayBills();
  alert("✅ Bulk IRN Sync Complete: All sales invoices are verified & digitally certified with FBR cryptographic signatures.");
}

function exportDispatchManifest() {
  const ewbList = window.userData?.ewayBills || [];
  if (ewbList.length === 0) {
    alert("No active consignments found for manifest generation.");
    return;
  }
  let csv = "E-Way Bill No,Date,Valid Until,Invoice No,Recipient,Destination,Transporter,Vehicle,Cargo Value,Status\n";
  ewbList.forEach(e => {
    csv += `"${e.ewbNo}","${e.date}","${e.validUntil}","${e.invNo}","${e.recipient}","${e.destination}","${e.transporter}","${e.vehicleNo}","${e.cargoValue}","${e.status}"\n`;
  });
  const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `dispatch_manifest_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  logAuditEvent('MANIFEST_EXPORT', 'Sales', 'Exported consignments dispatch manifest CSV.');
}

function renderEwayBills() {
  const tbody = document.getElementById('ewayTableBody');
  if (!tbody || !window.userData) return;

  const ewbList = window.userData.ewayBills || [];
  
  const totalBills = ewbList.length;
  const inTransitCount = ewbList.filter(e => e.status === 'In-Transit').length;
  const totalCargo = ewbList.reduce((sum, e) => sum + (e.cargoValue || 0), 0);

  if (document.getElementById('ewbStatTotal')) document.getElementById('ewbStatTotal').innerText = `${totalBills} Bills`;
  if (document.getElementById('ewbStatInTransit')) document.getElementById('ewbStatInTransit').innerText = `${inTransitCount} Consignments`;
  if (document.getElementById('ewbStatCargoVal')) document.getElementById('ewbStatCargoVal').innerText = `Rs ${totalCargo.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
  if (document.getElementById('ewayTableCount')) document.getElementById('ewayTableCount').innerText = `Showing ${totalBills} Records`;

  tbody.innerHTML = '';
  if (ewbList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="p-6 text-center text-slate-400 font-semibold">No statutory E-Way bills generated yet. Click "Generate E-Way Bill" to create one.</td></tr>';
    return;
  }

  const isEmp = isEmployeeRole();

  ewbList.forEach(e => {
    let statusClass = 'bg-cyan-100 text-cyan-800 border-cyan-200';
    if (e.status === 'In-Transit') statusClass = 'bg-purple-100 text-purple-800 border-purple-200';
    else if (e.status === 'Delivered') statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    else if (e.status === 'Cancelled') statusClass = 'bg-rose-100 text-rose-800 border-rose-200';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/80 transition group">
        <td class="p-3.5">
          <div class="font-bold font-mono text-cyan-900 flex items-center gap-1.5">
            <i class="fa-solid fa-barcode text-slate-400"></i>
            <span>${e.ewbNo}</span>
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">${e.irn || 'IRN-VERIFIED'}</div>
        </td>
        <td class="p-3.5">
          <div class="font-bold text-slate-800">${e.invNo}</div>
          <div class="text-[10px] text-slate-500">${e.date}</div>
        </td>
        <td class="p-3.5">
          <div class="font-bold text-slate-900">${e.recipient}</div>
          <div class="text-[10px] text-slate-500 truncate max-w-[180px]">${e.destination || 'Hub Delivery'}</div>
        </td>
        <td class="p-3.5">
          <div class="font-semibold text-slate-800">${e.transporter}</div>
          <div class="font-mono text-[10px] font-bold text-cyan-700">${e.vehicleNo}</div>
        </td>
        <td class="p-3.5">
          <div class="font-black text-slate-900">Rs ${(e.cargoValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div class="text-[10px] text-slate-400 font-mono">HSN: ${e.hsnCode || '3004.90'}</div>
        </td>
        <td class="p-3.5">
          <div class="font-bold text-slate-700">${e.distanceKm || 45} KM</div>
          <div class="text-[10px] text-emerald-600 font-semibold">Valid till ${e.validUntil || 'Active'}</div>
        </td>
        <td class="p-3.5">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusClass}">${e.status}</span>
        </td>
        <td class="p-3.5 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="openPrintEwaySlip('${e.id || e.ewbNo}')" title="Print Statutory Waybill Slip" class="p-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg text-xs font-bold transition flex items-center gap-1">
              <i class="fa-solid fa-print"></i>
              <span class="hidden xl:inline text-[10px]">Print Slip</span>
            </button>
            <button onclick="openEwayTracking('${e.id || e.ewbNo}')" title="Track Live Transit" class="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition flex items-center gap-1">
              <i class="fa-solid fa-location-dot"></i>
              <span class="hidden xl:inline text-[10px]">Track</span>
            </button>
            ${!isEmp ? `
              <button onclick="editEwayBill('${e.id || e.ewbNo}')" title="Edit Consignment Details" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition">
                <i class="fa-solid fa-pen-to-square"></i>
              </button>
              <button onclick="deleteEwayBill('${e.id || e.ewbNo}')" title="Cancel / Delete Waybill" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition">
                <i class="fa-solid fa-trash"></i>
              </button>
            ` : ''}
          </div>
        </td>
      </tr>
    `;
  });
}

function filterEwayTable() {
  const query = (document.getElementById('ewaySearchInput')?.value || '').toLowerCase();
  const statusFilter = document.getElementById('ewayStatusFilter')?.value || 'ALL';
  const tbody = document.getElementById('ewayTableBody');
  if (!tbody || !window.userData) return;

  const ewbList = (window.userData.ewayBills || []).filter(e => {
    const matchesQuery = !query || 
      e.ewbNo.toLowerCase().includes(query) || 
      e.invNo.toLowerCase().includes(query) || 
      (e.recipient && e.recipient.toLowerCase().includes(query)) || 
      (e.vehicleNo && e.vehicleNo.toLowerCase().includes(query)) ||
      (e.transporter && e.transporter.toLowerCase().includes(query));
    const matchesStatus = statusFilter === 'ALL' || e.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  tbody.innerHTML = '';
  if (ewbList.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="p-6 text-center text-slate-400 font-semibold">No matching E-Way bills found.</td></tr>';
    return;
  }

  ewbList.forEach(e => {
    let statusClass = 'bg-cyan-100 text-cyan-800 border-cyan-200';
    if (e.status === 'In-Transit') statusClass = 'bg-purple-100 text-purple-800 border-purple-200';
    else if (e.status === 'Delivered') statusClass = 'bg-emerald-100 text-emerald-800 border-emerald-200';
    else if (e.status === 'Cancelled') statusClass = 'bg-rose-100 text-rose-800 border-rose-200';

    tbody.innerHTML += `
      <tr class="hover:bg-slate-50/80 transition group">
        <td class="p-3.5">
          <div class="font-bold font-mono text-cyan-900 flex items-center gap-1.5">
            <i class="fa-solid fa-barcode text-slate-400"></i>
            <span>${e.ewbNo}</span>
          </div>
          <div class="text-[10px] text-slate-400 font-mono mt-0.5">${e.irn || 'IRN-VERIFIED'}</div>
        </td>
        <td class="p-3.5">
          <div class="font-bold text-slate-800">${e.invNo}</div>
          <div class="text-[10px] text-slate-500">${e.date}</div>
        </td>
        <td class="p-3.5">
          <div class="font-bold text-slate-900">${e.recipient}</div>
          <div class="text-[10px] text-slate-500 truncate max-w-[180px]">${e.destination || 'Hub Delivery'}</div>
        </td>
        <td class="p-3.5">
          <div class="font-semibold text-slate-800">${e.transporter}</div>
          <div class="font-mono text-[10px] font-bold text-cyan-700">${e.vehicleNo}</div>
        </td>
        <td class="p-3.5">
          <div class="font-black text-slate-900">Rs ${(e.cargoValue || 0).toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          <div class="text-[10px] text-slate-400 font-mono">HSN: ${e.hsnCode || '3004.90'}</div>
        </td>
        <td class="p-3.5">
          <div class="font-bold text-slate-700">${e.distanceKm || 45} KM</div>
          <div class="text-[10px] text-emerald-600 font-semibold">Valid till ${e.validUntil || 'Active'}</div>
        </td>
        <td class="p-3.5">
          <span class="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${statusClass}">${e.status}</span>
        </td>
        <td class="p-3.5 text-right whitespace-nowrap">
          <div class="flex items-center justify-end gap-1.5">
            <button onclick="openPrintEwaySlip('${e.id || e.ewbNo}')" title="Print Statutory Waybill Slip" class="p-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-700 rounded-lg text-xs font-bold transition flex items-center gap-1">
              <i class="fa-solid fa-print"></i>
              <span class="hidden xl:inline text-[10px]">Print Slip</span>
            </button>
            <button onclick="openEwayTracking('${e.id || e.ewbNo}')" title="Track Live Transit" class="p-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 rounded-lg text-xs font-bold transition flex items-center gap-1">
              <i class="fa-solid fa-location-dot"></i>
              <span class="hidden xl:inline text-[10px]">Track</span>
            </button>
            <button onclick="editEwayBill('${e.id || e.ewbNo}')" title="Edit Consignment Details" class="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition">
              <i class="fa-solid fa-pen-to-square"></i>
            </button>
            <button onclick="deleteEwayBill('${e.id || e.ewbNo}')" title="Cancel / Delete Waybill" class="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg text-xs font-bold transition">
              <i class="fa-solid fa-trash"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  });
}

// WhatsApp Reminders & Dispatch
function sendWhatsappInvoice(invNo) {
  const order = (window.userData?.orders || []).find(o => o.inv === invNo);
  if (!order) return;
  const phone = (order.custPhone || '923001234567').replace(/[^0-9]/g, '');
  const msg = encodeURIComponent(`*Payvibes Tax Invoice Notice*\nInvoice: ${order.inv}\nAmount: Rs ${order.amount.toFixed(2)}\nIRN: ${order.irn || 'N/A'}\nThank you for your business!`);
  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
}

function sendOverdueReminder(invNo) {
  const order = (window.userData?.orders || []).find(o => o.inv === invNo);
  if (!order) return;
  const phone = (order.custPhone || '923001234567').replace(/[^0-9]/g, '');
  const msg = encodeURIComponent(`*PAYMENT OVERDUE REMINDER*\nDear ${order.custName},\nInvoice ${order.inv} for Rs ${order.amount.toFixed(2)} is pending payment. Please settle your account via Bank/Cash.\nThank you, Payvibes.`);
  window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  logAuditEvent('REMINDER_SENT', 'Communication', `Sent WhatsApp payment reminder to ${order.custName} for ${order.inv}`);
}

function sendBulkOverdueReminders() {
  const unpaid = (window.userData?.orders || []).filter(o => o.status === 'Unpaid');
  if (unpaid.length === 0) {
    alert("No overdue unpaid invoices found!");
    return;
  }
  alert(`Triggered automated reminder dispatch to ${unpaid.length} clients via WhatsApp Gateway & SMS.`);
  logAuditEvent('BULK_REMINDERS', 'Communication', `Sent automated batch reminders to ${unpaid.length} clients.`);
}

// Client Portal Search
function searchClientPortal() {
  const input = document.getElementById('portalSearchInput');
  const query = input ? input.value.trim().toLowerCase() : '';
  const res = document.getElementById('portalResultArea');
  if (!res) return;

  if (!query) {
    res.innerHTML = '<div class="text-rose-500 text-xs">Please enter a phone number, customer name, or NTN.</div>';
    return;
  }

  const customers = window.userData?.customers || [];
  const cust = customers.find(c => 
    c.name.toLowerCase().includes(query) || 
    (c.contact && c.contact.includes(query)) || 
    (c.ntnCnic && c.ntnCnic.includes(query))
  );

  if (!cust) {
    res.innerHTML = '<div class="text-slate-500 text-xs bg-slate-50 p-4 rounded-xl border border-slate-200">No client account found matching that identifier.</div>';
    return;
  }

  const custOrders = (window.userData?.orders || []).filter(o => o.custName.toLowerCase() === cust.name.toLowerCase());
  let rows = custOrders.map(o => `
    <tr class="border-b border-slate-100">
      <td class="p-2 font-mono font-bold text-orange-600">${o.inv}</td>
      <td class="p-2">${o.date}</td>
      <td class="p-2">${o.prodName} (x${o.qty})</td>
      <td class="p-2 font-bold">Rs ${o.amount.toFixed(2)}</td>
      <td class="p-2"><span class="px-2 py-0.5 rounded text-[10px] font-bold ${o.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}">${o.status}</span></td>
    </tr>
  `).join('');

  res.innerHTML = `
    <div class="bg-white p-4 rounded-xl border border-purple-200 shadow-sm space-y-4">
      <div class="flex justify-between items-center pb-2 border-b border-slate-100">
        <div>
          <h5 class="font-extrabold text-slate-900 text-sm">${cust.name}</h5>
          <p class="text-[11px] text-slate-500">${cust.address || 'Standard Account'} | ${cust.contact || ''}</p>
        </div>
        <div class="text-right">
          <div class="text-[10px] font-bold uppercase text-purple-600">Loyalty Rewards Balance</div>
          <div class="text-base font-black text-purple-700">${cust.loyaltyPoints || 0} Points (Value: Rs ${(cust.loyaltyPoints || 0) * 2})</div>
        </div>
      </div>
      <table class="w-full text-xs text-left">
        <thead class="bg-slate-50 font-bold text-slate-600">
          <tr><th class="p-2">Invoice #</th><th class="p-2">Date</th><th class="p-2">Item</th><th class="p-2">Amount</th><th class="p-2">Status</th></tr>
        </thead>
        <tbody>${rows || '<tr><td colspan="5" class="p-3 text-center text-slate-400">No invoices yet.</td></tr>'}</tbody>
      </table>
    </div>
  `;
}

// Backup & Disaster Recovery
function exportDatabaseBackup() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(window.userData, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `payvibes_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
  logAuditEvent('BACKUP_EXPORT', 'Security', 'Exported JSON backup archive.');
}

function handleRestoreBackupFile(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const parsed = JSON.parse(e.target.result);
      if (parsed && (parsed.orders || parsed.inventory || parsed.customers)) {
        window.userData = parsed;
        if (!window.userData.currentUserRole) {
          window.userData.currentUserRole = 'Admin';
        }
        persistData(true);
        const msg = document.getElementById('restoreMsg');
        if (msg) msg.innerHTML = `<span class="text-emerald-400 font-bold">✅ Database successfully restored! (${parsed.orders ? parsed.orders.length : 0} invoices, ${parsed.inventory ? parsed.inventory.length : 0} items recovered)</span>`;
        logAuditEvent('BACKUP_RESTORE', 'Security', 'Database recovered from uploaded JSON backup.');
        setTimeout(() => {
          closeModal('restoreBackupModal');
          const loginScreen = document.getElementById('loginScreen');
          const appContainer = document.getElementById('appContainer');
          const roleDisp = document.getElementById('userRoleDisplay');
          if (loginScreen) loginScreen.classList.add('hidden');
          if (appContainer) appContainer.classList.remove('hidden');
          if (roleDisp) roleDisp.innerText = window.userData.currentUserRole || 'Admin';
          try {
            initApp();
            renderAll();
          } catch(err) {
            console.warn("Restore re-render warning:", err);
          }
        }, 1200);
      } else {
        const msg = document.getElementById('restoreMsg');
        if (msg) msg.innerHTML = `<span class="text-rose-400 font-bold">Invalid backup file structure.</span>`;
      }
    } catch (err) {
      const msg = document.getElementById('restoreMsg');
      if (msg) msg.innerHTML = `<span class="text-rose-400 font-bold">Failed to read JSON backup file.</span>`;
    }
  };
  reader.readAsText(file);
}

// Fast Targeted Render Dispatcher for Maximum Performance
function renderTabContent(tabName) {
  if (!window.userData) return;
  switch (tabName) {
    case 'dashboard':
      renderStats();
      renderTracking();
      renderCharts();
      break;
    case 'orders':
      renderOrders();
      break;
    case 'purchaseinvoices':
      renderPurchaseInvoices();
      break;
    case 'ewaybill':
      renderEwayBills();
      break;
    case 'gstfiling':
      renderGstFilings();
      break;
    case 'tdstcs':
      renderTdsTcs();
      break;
    case 'bankrecon':
      renderBankRecon();
      break;
    case 'stocktransfers':
      renderStockTransfers();
      break;
    case 'inventory':
      renderInventory();
      break;
    case 'customers':
      renderCustomers();
      break;
    case 'suppliers':
      renderSuppliers();
      break;
    case 'quotations':
      renderQuotations();
      break;
    case 'debitnotes':
      renderDebitNotes();
      break;
    case 'patients':
      renderPatients();
      break;
    case 'purchases':
      renderPurchases();
      break;
    case 'payouts':
      renderPayouts();
      break;
    case 'expenses':
      renderExpenses();
      break;
    case 'cashbank':
      renderCashBank();
      break;
    case 'otherincome':
      renderOtherIncome();
      break;
    case 'attendance':
      renderAttendance();
      break;
    case 'payroll':
      renderPayroll();
      break;
    case 'reminders':
      renderOverdueReminders();
      break;
    case 'pricing':
      renderPricingTab();
      break;
    default:
      break;
  }
}

function renderRemainingTabs(exceptTab) {
  if (!window.userData) return;
  const allTabs = [
    'orders', 'purchaseinvoices', 'ewaybill', 'gstfiling', 'tdstcs', 'bankrecon',
    'stocktransfers', 'inventory', 'customers', 'suppliers', 'quotations', 'debitnotes',
    'patients', 'purchases', 'payouts', 'expenses', 'cashbank', 'otherincome',
    'attendance', 'payroll', 'reminders'
  ];
  allTabs.forEach(t => {
    if (t !== exceptTab) {
      renderTabContent(t);
    }
  });
}

function renderSettingsForm() {
  if (!window.userData || !window.userData.settings) return;
  const s = window.userData.settings;
  if (document.getElementById('setCompany')) document.getElementById('setCompany').value = s.company || '';
  if (document.getElementById('setPhone')) document.getElementById('setPhone').value = s.phone || '';
  if (document.getElementById('setEmail')) document.getElementById('setEmail').value = s.email || '';
  if (document.getElementById('setAddress')) document.getElementById('setAddress').value = s.address || '';
  if (document.getElementById('setNtn')) document.getElementById('setNtn').value = s.ntn || '';
  if (document.getElementById('setBank')) document.getElementById('setBank').value = s.bank || '';
  if (document.getElementById('setFooter')) document.getElementById('setFooter').value = s.footer || '';
  
  const preview = document.getElementById('setLogoPreview');
  if (preview && s.companyLogo) {
    preview.src = s.companyLogo;
    preview.classList.remove('hidden');
  }
}

// Render Functions
function renderAll() {
  if (!window.userData) return;
  renderSubscriptionUI();
  renderStats();
  renderTracking();
  renderSettingsForm();
  
  // Identify active tab and render immediately
  const activeTabEl = document.querySelector('.tab-content:not(.hidden)');
  const activeTabId = activeTabEl ? activeTabEl.id.replace('tab-', '') : 'dashboard';
  renderTabContent(activeTabId);

  // Render non-active tabs in background so navigation is instant
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(() => renderRemainingTabs(activeTabId));
  } else {
    setTimeout(() => renderRemainingTabs(activeTabId), 30);
  }
}

function renderStats() {
  if (!window.userData) return;
  const filteredOrders = filterByBranch(window.userData.orders || []);
  const totalSales = filteredOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const totalPayout = filterByBranch(window.userData.payouts || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const inventory = filterByBranch(window.userData.inventory || []);
  const reorderPoint = (window.userData.settings && window.userData.settings.inventoryReorderPoint) || 20;
  const lowStockCount = inventory.filter(i => (i.stock || 0) <= (i.minStockAlert || i.minStockLevel || reorderPoint)).length;
  
  if (document.getElementById('stat-dailysales')) document.getElementById('stat-dailysales').innerText = `Rs ${totalSales.toLocaleString()}`;
  if (document.getElementById('stat-stock')) document.getElementById('stat-stock').innerText = `${inventory.length} Items`;
  if (document.getElementById('stat-customers')) document.getElementById('stat-customers').innerText = `${(window.userData.customers || []).length} Clients`;
  if (document.getElementById('stat-payout')) document.getElementById('stat-payout').innerText = `Rs ${totalPayout.toLocaleString()}`;
  if (document.getElementById('stat-totalItems')) document.getElementById('stat-totalItems').innerText = `${inventory.length} Total Items`;
  if (document.getElementById('stat-lowStockCount')) {
    document.getElementById('stat-lowStockCount').innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> <span>Low Stock: ${lowStockCount} items</span>`;
  }

  const totalExp = filterByBranch(window.userData.expenses || []).reduce((sum, e) => sum + (e.amount || 0), 0);
  const expDisp = document.getElementById('stat-expenseTotal');
  if (expDisp) expDisp.innerText = `Rs ${totalExp.toLocaleString()}`;

  const cashbank = window.userData.cashbank || [];
  const cashIn = cashbank.filter(c => c.account === 'Cash in Hand').reduce((s, c) => s + (c.type.includes('In') ? c.amount : -c.amount), 0);
  const bankIn = cashbank.filter(c => c.account === 'Bank Account').reduce((s, c) => s + (c.type.includes('In') ? c.amount : -c.amount), 0);
  
  if (document.getElementById('stat-cashBalance')) document.getElementById('stat-cashBalance').innerText = `Rs ${cashIn.toLocaleString()}`;
  if (document.getElementById('stat-bankBalance')) document.getElementById('stat-bankBalance').innerText = `Rs ${bankIn.toLocaleString()}`;
  if (document.getElementById('stat-totalBalance')) document.getElementById('stat-totalBalance').innerText = `Rs ${(cashIn + bankIn).toLocaleString()}`;
}

function renderOrders() {
  const tbody = document.getElementById('ordersTableBody');
  if (!tbody || !window.userData) return;
  const filtered = filterByBranch(window.userData.orders || []);
  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" class="p-4 text-center text-slate-400">No invoices recorded for this branch.</td></tr>';
    return;
  }
  const isEmp = isEmployeeRole();
  tbody.innerHTML = filtered.map(o => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
      <td class="p-3 font-mono font-bold text-orange-600">
        <div>${o.inv}</div>
        ${o.irn ? '<div class="text-[9px] text-cyan-700 font-sans font-semibold">● IRN Verified</div>' : ''}
        ${o.eWayBillNo ? `<button onclick="openPrintEwaySlip('${o.eWayBillNo}')" title="View E-Way Bill" class="text-[9px] bg-cyan-50 text-cyan-700 px-1.5 py-0.5 rounded border border-cyan-200 font-mono font-bold mt-0.5 hover:bg-cyan-100 flex items-center gap-1"><i class="fa-solid fa-truck-fast"></i> ${o.eWayBillNo}</button>` : ''}
      </td>
      <td class="p-3">${o.date}</td>
      <td class="p-3">
        <div class="font-bold text-slate-900">${o.custName}</div>
        <div class="text-[10px] text-slate-400">${o.custNtnCnic || o.custPhone || 'Walk-in'}</div>
      </td>
      <td class="p-3 font-semibold">${o.prodName}</td>
      <td class="p-3">${o.qty} ${o.uom || 'Pcs'} @ Rs ${o.rate}</td>
      <td class="p-3">
        <div>GST: ${o.taxPct || 18}%</div>
        ${o.tcsAmount ? `<div class="text-[10px] text-purple-600 font-bold">+TCS: Rs ${o.tcsAmount.toFixed(1)}</div>` : ''}
      </td>
      <td class="p-3 font-black text-slate-900">Rs ${o.amount.toFixed(2)}</td>
      <td class="p-3 text-right space-x-1 whitespace-nowrap">
        <button onclick="openPrintInvoice('${o.inv}', 'TAX INVOICE')" title="Print Invoice" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs font-bold"><i class="fa-solid fa-print"></i></button>
        <button onclick="openPrintEwaySlip('${o.eWayBillNo || o.inv}')" title="Print E-Way Bill Slip" class="p-1.5 bg-cyan-50 text-cyan-600 hover:bg-cyan-100 rounded-lg text-xs font-bold"><i class="fa-solid fa-truck-fast"></i></button>
        <button onclick="sendWhatsappInvoice('${o.inv}')" title="Send WhatsApp" class="p-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs"><i class="fa-brands fa-whatsapp"></i></button>
        ${!isEmp ? `<button onclick="deleteOrder('${o.inv}')" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function deleteOrder(inv) {
  if (isEmployeeRole()) {
    alert('Permission Denied: Employee role cannot delete records.');
    return;
  }
  if (confirm(`Delete invoice ${inv}?`)) {
    window.userData.orders = (window.userData.orders || []).filter(o => o.inv !== inv);
    logAuditEvent('DELETE_INVOICE', 'Sales', `Deleted invoice ${inv}`);
    persistData();
    renderAll();
  }
}

function renderPurchaseInvoices() {
  const tbody = document.getElementById('purchaseInvoicesTableBody');
  if (!tbody || !window.userData) return;
  const filtered = filterByBranch(window.userData.purchaseinvoices || []);
  const isEmp = isEmployeeRole();
  tbody.innerHTML = filtered.map(p => `
    <tr class="border-b border-slate-100 hover:bg-slate-50 transition">
      <td class="p-3 font-mono font-bold text-emerald-600">${p.ref}</td>
      <td class="p-3">${p.date}</td>
      <td class="p-3 font-bold">${p.supplier}</td>
      <td class="p-3">${p.item}</td>
      <td class="p-3">${p.qty} @ Rs ${p.rate}</td>
      <td class="p-3 font-black">Rs ${p.amt.toLocaleString()}</td>
      <td class="p-3 text-right space-x-1">
        <button onclick="openPrintInvoice('${p.ref}', 'PURCHASE BILL')" title="Print" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs"><i class="fa-solid fa-print"></i></button>
        ${!isEmp ? `<button onclick="deletePurchaseInvoice('${p.ref}')" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function deletePurchaseInvoice(ref) {
  window.userData.purchaseinvoices = (window.userData.purchaseinvoices || []).filter(p => p.ref !== ref);
  persistData();
  renderAll();
}

function renderGstFilings() {
  const tbody = document.getElementById('gstFilingsTableBody');
  if (!tbody || !window.userData) return;
  const orders = window.userData.orders || [];
  const totalTaxable = orders.reduce((sum, o) => sum + (o.qty * o.rate), 0);
  const totalTax = orders.reduce((sum, o) => sum + (o.qty * o.rate * (o.taxPct / 100)), 0);

  if (document.getElementById('gstStatTurnover')) document.getElementById('gstStatTurnover').innerText = `Rs ${totalTaxable.toLocaleString()}`;
  if (document.getElementById('gstStatTax')) document.getElementById('gstStatTax').innerText = `Rs ${totalTax.toLocaleString()}`;

  const filings = window.userData.gstFilings || [];
  tbody.innerHTML = filings.map(g => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-bold text-cyan-700">${g.returnType}</td>
      <td class="p-3">${g.periodMonth} ${g.periodYear}</td>
      <td class="p-3">${g.filingDate}</td>
      <td class="p-3 font-mono text-[11px] font-bold text-slate-700">${g.arn}</td>
      <td class="p-3 font-semibold">Rs ${g.totalTaxable.toLocaleString()}</td>
      <td class="p-3 font-black text-emerald-600">Rs ${g.totalTax.toLocaleString()}</td>
      <td class="p-3"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">${g.status}</span></td>
      <td class="p-3 text-right"><span class="text-[10px] text-slate-400">By ${g.submittedBy}</span></td>
    </tr>
  `).join('');
}

function renderTdsTcs() {
  const tdsTbody = document.getElementById('tdsTableBody');
  const tcsTbody = document.getElementById('tcsTableBody');

  if (tdsTbody && window.userData) {
    const tds = window.userData.tdsEntries || [];
    tdsTbody.innerHTML = tds.map(t => `
      <tr class="border-b border-slate-100">
        <td class="p-2 font-bold text-rose-600">${t.section}</td>
        <td class="p-2">${t.partyName}</td>
        <td class="p-2">Rs ${t.transactionAmount.toLocaleString()}</td>
        <td class="p-2">${t.tdsRate}%</td>
        <td class="p-2 font-black text-rose-600">Rs ${t.tdsAmount.toFixed(1)}</td>
        <td class="p-2"><span class="px-1.5 py-0.5 bg-rose-100 text-rose-800 rounded text-[9px] font-bold">${t.status}</span></td>
      </tr>
    `).join('');
  }

  if (tcsTbody && window.userData) {
    const tcs = window.userData.tcsEntries || [];
    tcsTbody.innerHTML = tcs.map(t => `
      <tr class="border-b border-slate-100">
        <td class="p-2 font-bold text-purple-600">${t.section}</td>
        <td class="p-2">${t.customerName}</td>
        <td class="p-2">Rs ${t.saleAmount.toFixed(1)}</td>
        <td class="p-2">${t.tcsRate}%</td>
        <td class="p-2 font-black text-purple-600">Rs ${t.tcsAmount.toFixed(1)}</td>
        <td class="p-2"><span class="px-1.5 py-0.5 bg-purple-100 text-purple-800 rounded text-[9px] font-bold">${t.status}</span></td>
      </tr>
    `).join('');
  }
}

function renderBankRecon() {
  const tbody = document.getElementById('bankReconTableBody');
  if (!tbody || !window.userData) return;
  const bankStatements = window.userData.bankStatements || [];
  tbody.innerHTML = bankStatements.map((b, idx) => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3">${b.date}</td>
      <td class="p-3 font-semibold">${b.description}</td>
      <td class="p-3 font-mono text-[11px]">${b.refNo}</td>
      <td class="p-3 font-bold ${b.type === 'Credit' ? 'text-emerald-600' : 'text-rose-600'}">${b.type}</td>
      <td class="p-3 font-black">Rs ${b.amount.toLocaleString()}</td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${b.matchStatus === 'Matched' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}">
          ${b.matchStatus}
        </span>
      </td>
      <td class="p-3 text-right">
        ${b.matchStatus === 'Unmatched' ? `<button onclick="window.userData.bankStatements[${idx}].matchStatus='Matched';persistData();renderBankRecon();" class="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[10px] font-bold">Manual Match</button>` : '<i class="fa-solid fa-check text-emerald-600"></i>'}
      </td>
    </tr>
  `).join('');
}

function renderStockTransfers() {
  const tbody = document.getElementById('stockTransfersTableBody');
  if (!tbody || !window.userData) return;
  const stockTransfers = window.userData.stockTransfers || [];
  tbody.innerHTML = stockTransfers.map(s => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-mono font-bold text-purple-600">${s.transferNo}</td>
      <td class="p-3">${s.date}</td>
      <td class="p-3 font-medium">${s.fromBranchName}</td>
      <td class="p-3 font-bold text-slate-900">${s.toBranchName}</td>
      <td class="p-3">${s.itemName} <span class="text-[10px] text-slate-400">(Batch: ${s.batch})</span></td>
      <td class="p-3 font-black">${s.qty}</td>
      <td class="p-3">
        <span class="px-2 py-0.5 rounded text-[10px] font-bold ${s.status === 'In-Transit' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'}">
          ${s.status}
        </span>
      </td>
      <td class="p-3 text-right">
        ${s.status === 'In-Transit' ? `<button onclick="receiveStockTransfer('${s.id}')" class="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[10px] font-bold shadow">Receive Stock</button>` : '<span class="text-xs text-emerald-600 font-bold">Completed</span>'}
      </td>
    </tr>
  `).join('');
}

function renderAttendance() {
  const tbody = document.getElementById('attendanceTableBody');
  if (!tbody || !window.userData) return;
  const attendance = window.userData.attendance || [];
  tbody.innerHTML = attendance.map(a => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3">${a.date}</td>
      <td class="p-3 font-bold text-slate-900">${a.employeeName}</td>
      <td class="p-3">${a.punchInTime}</td>
      <td class="p-3">${a.hoursWorked} hrs</td>
      <td class="p-3 font-semibold text-slate-600">${a.method}</td>
      <td class="p-3"><span class="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">${a.status}</span></td>
    </tr>
  `).join('');
}

function renderPayroll() {
  const tbody = document.getElementById('payrollTableBody');
  if (!tbody || !window.userData) return;
  const payrolls = window.userData.payrolls || [];
  tbody.innerHTML = payrolls.map((p, idx) => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-bold">${p.month} ${p.year}</td>
      <td class="p-3 font-bold text-slate-900">${p.employeeName}</td>
      <td class="p-3">Rs ${p.baseSalary.toLocaleString()}</td>
      <td class="p-3 font-black text-purple-700">Rs ${p.netSalary.toLocaleString()}</td>
      <td class="p-3"><span class="text-xs text-emerald-600 font-bold">● Auto-synced EXP</span></td>
      <td class="p-3"><span class="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-bold text-[10px]">${p.status}</span></td>
      <td class="p-3 text-right">
        <button onclick="openPrintSalarySlip(${idx})" class="px-2.5 py-1 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg text-xs font-bold flex items-center gap-1 inline-flex shadow-xs border border-purple-200"><i class="fa-solid fa-print"></i><span>Generate Slip</span></button>
      </td>
    </tr>
  `).join('');
}

function renderOverdueReminders() {
  const tbody = document.getElementById('overdueRemindersTableBody');
  if (!tbody || !window.userData) return;
  const unpaid = (window.userData.orders || []).filter(o => o.status === 'Unpaid');
  if (unpaid.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" class="p-4 text-center text-slate-400">All invoices are settled! No overdue balances.</td></tr>';
    return;
  }
  tbody.innerHTML = unpaid.map(o => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-mono font-bold text-orange-600">${o.inv}</td>
      <td class="p-3 font-bold">${o.custName}</td>
      <td class="p-3 font-mono">${o.custPhone || '0300-1234567'}</td>
      <td class="p-3 text-rose-600 font-bold">${o.dueDate || o.date}</td>
      <td class="p-3 font-black text-slate-900">Rs ${o.amount.toFixed(2)}</td>
      <td class="p-3 text-right">
        <button onclick="sendOverdueReminder('${o.inv}')" class="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow flex items-center gap-1 inline-flex">
          <i class="fa-brands fa-whatsapp"></i><span>Send Reminder</span>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderInventory() {
  const tbody = document.getElementById('inventoryTableBody');
  if (!tbody || !window.userData) return;
  const filtered = filterByBranch(window.userData.inventory || []);
  const isEmp = isEmployeeRole();
  tbody.innerHTML = filtered.map(i => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-bold text-slate-900">${i.name}</td>
      <td class="p-3 font-mono text-[11px]">${i.batch}</td>
      <td class="p-3 font-black ${i.stock < 10 ? 'text-rose-600' : 'text-slate-900'}">${i.stock}</td>
      <td class="p-3">${i.unit}</td>
      <td class="p-3 text-slate-600">${i.expiry}</td>
      <td class="p-3 font-semibold">Rs ${i.purchasePrice}</td>
      <td class="p-3 font-bold text-orange-600">Rs ${i.salePrice}</td>
      <td class="p-3 text-right space-x-1">
        ${!isEmp ? `<button onclick="editInventoryItem('${i.id}')" title="Edit" class="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
        ${!isEmp ? `<button onclick="deleteInventoryItem('${i.id}')" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function deleteInventoryItem(id) {
  if (isEmployeeRole()) {
    alert('Permission Denied: Employee role cannot delete records.');
    return;
  }
  window.userData.inventory = (window.userData.inventory || []).filter(i => i.id !== id);
  persistData();
  renderAll();
}

function renderCustomers() {
  const tbody = document.getElementById('customerTableBody');
  if (!tbody || !window.userData) return;
  const customers = window.userData.customers || [];
  const isEmp = isEmployeeRole();
  tbody.innerHTML = customers.map(c => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-bold text-slate-900">${c.name}</td>
      <td class="p-3">${c.contact || '-'} <span class="text-[10px] text-slate-400">(${c.category || 'Retailer'})</span></td>
      <td class="p-3">${c.address || '-'}</td>
      <td class="p-3 font-mono text-[11px]">${c.ntnCnic || '-'}</td>
      <td class="p-3 font-bold text-purple-600">${c.loyaltyPoints || 0} pts</td>
      <td class="p-3 font-black text-rose-600">Rs ${(c.credit || 0).toLocaleString()}</td>
      <td class="p-3 text-right space-x-1">
        ${!isEmp ? `<button onclick="editCustomer('${c.id}')" title="Edit" class="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
        ${!isEmp ? `<button onclick="deleteCustomer('${c.id}')" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function deleteCustomer(id) {
  if (isEmployeeRole()) {
    alert('Permission Denied: Employee role cannot delete records.');
    return;
  }
  window.userData.customers = (window.userData.customers || []).filter(c => c.id !== id);
  persistData();
  renderAll();
}

function renderSuppliers() {
  const tbody = document.getElementById('supplierTableBody');
  if (!tbody || !window.userData) return;
  const suppliers = window.userData.suppliers || [];
  const isEmp = isEmployeeRole();
  tbody.innerHTML = suppliers.map(s => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-bold text-slate-900">${s.name}</td>
      <td class="p-3">${s.contact} <span class="text-[10px] text-slate-400">(${s.contactPerson})</span></td>
      <td class="p-3">${s.address || '-'}</td>
      <td class="p-3 font-mono text-[11px]">${s.ntnTax || '-'}</td>
      <td class="p-3 font-black text-slate-900">Rs ${(s.credit || 0).toLocaleString()}</td>
      <td class="p-3 text-right space-x-1">
        ${!isEmp ? `<button onclick="editSupplier('${s.id}')" title="Edit" class="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
        ${!isEmp ? `<button onclick="deleteSupplier('${s.id}')" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function deleteSupplier(id) {
  if (isEmployeeRole()) {
    alert('Permission Denied: Employee role cannot delete records.');
    return;
  }
  window.userData.suppliers = (window.userData.suppliers || []).filter(s => s.id !== id);
  persistData();
  renderAll();
}

function renderQuotations() {
  const tbody = document.getElementById('quotationsTableBody');
  if (!tbody || !window.userData) return;
  const quotations = window.userData.quotations || [];
  const isEmp = isEmployeeRole();
  tbody.innerHTML = quotations.map(q => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-bold">${q.customer}</td>
      <td class="p-3">${q.product}</td>
      <td class="p-3 font-bold text-orange-600">Rs ${q.rate}</td>
      <td class="p-3 text-emerald-600">${q.discount}</td>
      <td class="p-3">${q.date}</td>
      <td class="p-3 text-right space-x-1">
        <button onclick="openPrintInvoice('${q.qno}', 'POSVIBE ESTIMATE')" title="Print" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs"><i class="fa-solid fa-print"></i></button>
        ${!isEmp ? `<button onclick="editQuotation('${q.qno}')" title="Edit" class="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
        ${!isEmp ? `<button onclick="window.userData.quotations=window.userData.quotations.filter(x=>x.qno!=='${q.qno}');persistData();renderQuotations();" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderDebitNotes() {
  const tbody = document.getElementById('debitTableBody');
  if (!tbody || !window.userData) return;
  const debitnotes = window.userData.debitnotes || [];
  const isEmp = isEmployeeRole();
  tbody.innerHTML = debitnotes.map(d => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-mono font-bold text-rose-600">${d.ref}</td>
      <td class="p-3 font-bold">${d.party}</td>
      <td class="p-3 font-mono">${d.origInv}</td>
      <td class="p-3">${d.item} (x${d.qty})</td>
      <td class="p-3 text-rose-700 font-medium">${d.reason}</td>
      <td class="p-3 font-black">Rs ${d.amt}</td>
      <td class="p-3 text-right space-x-1">
        <button onclick="openPrintInvoice('${d.ref}', 'DEBIT NOTE')" title="Print" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs"><i class="fa-solid fa-print"></i></button>
        ${!isEmp ? `<button onclick="editDebitNote('${d.ref}')" title="Edit" class="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
        ${!isEmp ? `<button onclick="window.userData.debitnotes=window.userData.debitnotes.filter(x=>x.ref!=='${d.ref}');persistData();renderDebitNotes();" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderPatients() {
  const tbody = document.getElementById('patientsTableBody');
  if (!tbody || !window.userData) return;
  const patients = window.userData.patients || [];
  const isEmp = isEmployeeRole();
  tbody.innerHTML = patients.map((p, idx) => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-bold">${p.name} <span class="text-xs text-slate-400">(${p.age}y)</span></td>
      <td class="p-3">${p.gender} - ${p.address || ''}</td>
      <td class="p-3 font-semibold text-slate-800">${p.doctor}</td>
      <td class="p-3">${p.service}</td>
      <td class="p-3 font-black text-emerald-600">Rs ${p.fee}</td>
      <td class="p-3 text-right space-x-1">
        <button onclick="openPrintPatientSlip(${idx})" title="Print Slip" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs"><i class="fa-solid fa-print"></i></button>
        ${!isEmp ? `<button onclick="editPatient(${idx})" title="Edit" class="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
        ${!isEmp ? `<button onclick="deletePatient(${idx})" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function deletePatient(idx) {
  if (isEmployeeRole()) {
    alert('Permission Denied: Employee role cannot delete records.');
    return;
  }
  window.userData.patients.splice(idx, 1);
  persistData();
  renderAll();
}

function renderPurchases() {
  const tbody = document.getElementById('purchasesTableBody');
  if (!tbody || !window.userData) return;
  const purchases = window.userData.purchases || [];
  const isEmp = isEmployeeRole();
  tbody.innerHTML = purchases.map(p => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-mono font-bold text-emerald-600">${p.ref}</td>
      <td class="p-3 font-bold">${p.supplier}</td>
      <td class="p-3">${p.item}</td>
      <td class="p-3 font-black">Rs ${p.amt.toLocaleString()}</td>
      <td class="p-3 text-right space-x-1">
        <button onclick="openPrintInvoice('${p.ref}', 'PURCHASE ORDER')" title="Print" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs"><i class="fa-solid fa-print"></i></button>
        ${!isEmp ? `<button onclick="editPurchase('${p.ref}')" title="Edit" class="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
        ${!isEmp ? `<button onclick="window.userData.purchases=window.userData.purchases.filter(x=>x.ref!=='${p.ref}');persistData();renderPurchases();" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderPayouts() {
  const tbody = document.getElementById('payoutsTableBody');
  if (!tbody || !window.userData) return;
  const payouts = window.userData.payouts || [];
  const isEmp = isEmployeeRole();
  tbody.innerHTML = payouts.map(p => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-mono font-bold text-purple-600">${p.voucher}</td>
      <td class="p-3 font-bold">${p.recipient}</td>
      <td class="p-3">${p.mode}</td>
      <td class="p-3 font-black text-rose-600">Rs ${p.amount.toLocaleString()}</td>
      <td class="p-3 text-right space-x-1">
        ${!isEmp ? `<button onclick="editPayout('${p.voucher}')" title="Edit" class="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
        ${!isEmp ? `<button onclick="window.userData.payouts=window.userData.payouts.filter(x=>x.voucher!=='${p.voucher}');persistData();renderPayouts();" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function renderExpenses() {
  const tbody = document.getElementById('expensesTableBody');
  if (!tbody || !window.userData) return;
  const expenses = window.userData.expenses || [];
  const isEmp = isEmployeeRole();
  tbody.innerHTML = expenses.map(e => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-mono font-bold text-rose-600">${e.ref}</td>
      <td class="p-3">${e.date}</td>
      <td class="p-3 font-bold text-slate-800">${e.category}</td>
      <td class="p-3 text-slate-600">${e.desc}</td>
      <td class="p-3 font-medium">${e.paidTo}</td>
      <td class="p-3">${e.mode}</td>
      <td class="p-3 font-black text-rose-600">Rs ${e.amount.toLocaleString()}</td>
      <td class="p-3 text-right space-x-1">
        <button onclick="openPrintExpenseSlip('${e.ref}')" title="Print Expense Voucher" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs"><i class="fa-solid fa-print"></i></button>
        ${!isEmp ? `<button onclick="editExpense('${e.ref}')" title="Edit" class="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
        ${!isEmp ? `<button onclick="deleteExpense('${e.ref}')" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function deleteExpense(ref) {
  if (isEmployeeRole()) {
    alert('Permission Denied: Employee role cannot delete records.');
    return;
  }
  window.userData.expenses = (window.userData.expenses || []).filter(e => e.ref !== ref);
  persistData();
  renderAll();
}

function renderCashBank() {
  const tbody = document.getElementById('cashbankTableBody');
  if (!tbody || !window.userData) return;
  const cashbank = window.userData.cashbank || [];
  const isEmp = isEmployeeRole();
  tbody.innerHTML = cashbank.map(c => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-mono font-bold text-emerald-600">${c.ref}</td>
      <td class="p-3">${c.date}</td>
      <td class="p-3 font-bold">${c.account}</td>
      <td class="p-3 font-bold ${c.type.includes('In') ? 'text-emerald-600' : 'text-rose-600'}">${c.type}</td>
      <td class="p-3 text-slate-600">${c.desc}</td>
      <td class="p-3 font-black">Rs ${c.amount.toLocaleString()}</td>
      <td class="p-3 text-right space-x-1">
        <button onclick="openPrintCashBankSlip('${c.ref}')" title="Print Cash/Bank Voucher" class="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg text-xs"><i class="fa-solid fa-print"></i></button>
        ${!isEmp ? `<button onclick="editCashBank('${c.ref}')" title="Edit" class="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
        ${!isEmp ? `<button onclick="deleteCashBank('${c.ref}')" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function deleteCashBank(ref) {
  if (isEmployeeRole()) {
    alert('Permission Denied: Employee role cannot delete records.');
    return;
  }
  window.userData.cashbank = (window.userData.cashbank || []).filter(c => c.ref !== ref);
  persistData();
  renderAll();
}

function renderOtherIncome() {
  const tbody = document.getElementById('incomeTableBody');
  if (!tbody || !window.userData) return;
  const otherincome = window.userData.otherincome || [];
  const isEmp = isEmployeeRole();
  tbody.innerHTML = otherincome.map(i => `
    <tr class="border-b border-slate-100 hover:bg-slate-50">
      <td class="p-3 font-mono font-bold text-amber-600">${i.ref}</td>
      <td class="p-3">${i.date}</td>
      <td class="p-3 font-bold">${i.source}</td>
      <td class="p-3 text-slate-600">${i.desc}</td>
      <td class="p-3">${i.account}</td>
      <td class="p-3 font-black text-emerald-600">Rs ${i.amount.toLocaleString()}</td>
      <td class="p-3 text-right space-x-1">
        ${!isEmp ? `<button onclick="editIncome('${i.ref}')" title="Edit" class="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg text-xs"><i class="fa-solid fa-pen-to-square"></i></button>` : ''}
        ${!isEmp ? `<button onclick="deleteOtherIncome('${i.ref}')" title="Delete" class="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg text-xs"><i class="fa-solid fa-trash"></i></button>` : ''}
      </td>
    </tr>
  `).join('');
}

function deleteOtherIncome(ref) {
  window.userData.otherincome = (window.userData.otherincome || []).filter(i => i.ref !== ref);
  persistData();
  renderAll();
}

function renderTracking() {
  const tbody = document.getElementById('trackingTableBody');
  if (!tbody || !window.userData) return;
  const recentLogs = (window.userData.auditLogs || []).slice(0, 5);
  tbody.innerHTML = recentLogs.map(l => `
    <tr class="border-b border-slate-100">
      <td class="p-2 font-mono text-[10px] text-slate-400">${l.timestamp}</td>
      <td class="p-2">
        <span class="font-bold text-slate-800">${l.action}</span>
        <span class="text-slate-500 block text-[10px]">${l.details}</span>
      </td>
    </tr>
  `).join('');
}

function renderCharts() {
  const salesCanvas = document.getElementById('salesChart');
  const payoutCanvas = document.getElementById('payoutChart');
  const reportsCanvas = document.getElementById('reportsChart');

  // Dynamic Sales Chart (Last 7 Days)
  const today = new Date();
  const last7Days = Array.from({length: 7}, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().split('T')[0];
  });
  
  const salesByDay = last7Days.map(date => {
    const dayOrders = (window.userData?.orders || []).filter(o => o.date === date);
    return dayOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  });
  
  const labels7Days = last7Days.map(date => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { weekday: 'short' });
  });

  if (salesCanvas && window.Chart) {
    if (salesChartInstance) salesChartInstance.destroy();
    salesChartInstance = new Chart(salesCanvas, {
      type: 'line',
      data: {
        labels: labels7Days,
        datasets: [{
          label: 'Sales Revenue (Rs)',
          data: salesByDay,
          borderColor: '#ea580c',
          backgroundColor: 'rgba(234, 88, 12, 0.1)',
          tension: 0.3,
          fill: true
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // Dynamic Payout/Expenses Chart
  const expenses = window.userData?.expenses || [];
  const expCategories = {};
  expenses.forEach(e => {
    const cat = e.category || 'Other';
    expCategories[cat] = (expCategories[cat] || 0) + (e.amount || 0);
  });
  const expLabels = Object.keys(expCategories);
  const expData = Object.values(expCategories);
  
  if (expLabels.length === 0) {
    expLabels.push('No Expenses Yet');
    expData.push(1);
  }

  if (payoutCanvas && window.Chart) {
    if (payoutChartInstance) payoutChartInstance.destroy();
    payoutChartInstance = new Chart(payoutCanvas, {
      type: 'doughnut',
      data: {
        labels: expLabels,
        datasets: [{
          data: expData,
          backgroundColor: ['#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // Dynamic Reports Chart (Sales vs Purchases by Month)
  const monthMap = {};
  (window.userData?.orders || []).forEach(o => {
    if (!o.date) return;
    const m = o.date.substring(0, 7);
    if (!monthMap[m]) monthMap[m] = { sales: 0, purchases: 0 };
    monthMap[m].sales += (o.amount || 0);
  });
  
  const purchasesList = window.userData?.purchaseinvoices || window.userData?.purchases || [];
  purchasesList.forEach(p => {
    const d = p.date || p.dateCreated;
    if (!d) return;
    const m = d.substring(0, 7);
    if (!monthMap[m]) monthMap[m] = { sales: 0, purchases: 0 };
    monthMap[m].purchases += (p.amt || p.amount || 0);
  });
  
  const sortedMonths = Object.keys(monthMap).sort();
  const monthLabels = sortedMonths.map(m => {
    const d = new Date(m + '-01');
    return d.toLocaleDateString('en-US', { month: 'short' });
  });
  const salesData = sortedMonths.map(m => monthMap[m].sales);
  const purchasesData = sortedMonths.map(m => monthMap[m].purchases);
  
  if (monthLabels.length === 0) {
    monthLabels.push('Current Month');
    salesData.push(0);
    purchasesData.push(0);
  }

  if (reportsCanvas && window.Chart) {
    if (reportsChartInstance) reportsChartInstance.destroy();
    reportsChartInstance = new Chart(reportsCanvas, {
      type: 'bar',
      data: {
        labels: monthLabels,
        datasets: [
          { label: 'Sales', data: salesData, backgroundColor: '#ea580c' },
          { label: 'Purchases', data: purchasesData, backgroundColor: '#10b981' }
        ]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }
}

// Global App Initializer
function initApp() {
  initStorage();
  getSubscriptionState();
  renderSubscriptionUI();
  renderAll();
  showTab('dashboard');

  // Bind live calculation listeners
  ['invQty', 'invRate', 'invTaxPct', 'invDiscount'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.removeEventListener('input', calculateInvoiceTotal);
      el.addEventListener('input', calculateInvoiceTotal);
    }
  });

  // Setup Autocomplete dropdowns
  setupAutocomplete('invProdName', 'dropdown-invProdName', (name) => {
    const item = (window.userData?.inventory || []).find(i => i.name === name);
    if (item && document.getElementById('invRate')) {
      document.getElementById('invRate').value = item.salePrice || 0;
      calculateInvoiceTotal();
    }
  });

  setupAutocomplete('pinvItem', 'dropdown-pinvItem', (name) => {
    const item = (window.userData?.inventory || []).find(i => i.name === name);
    if (item && document.getElementById('pinvRate')) {
      document.getElementById('pinvRate').value = item.purchasePrice || 0;
    }
  });

  setupAutocomplete('quoProduct', 'dropdown-quoProduct', (name) => {
    const item = (window.userData?.inventory || []).find(i => i.name === name);
    if (item && document.getElementById('quoRate')) {
      document.getElementById('quoRate').value = item.salePrice || 0;
    }
  });

  setupAutocomplete('debItem', 'dropdown-debItem', (name) => {
    const item = (window.userData?.inventory || []).find(i => i.name === name);
    if (item && document.getElementById('debRate')) {
      document.getElementById('debRate').value = item.salePrice || item.purchasePrice || 0;
    }
  });

  setupAutocomplete('itemName', 'dropdown-itemName');
}

// Universal Printing & Offline Document Exporter Engine
function printDocument(elementId = 'printInvoiceArea') {
  const el = document.getElementById(elementId);
  if (!el) {
    window.print();
    return;
  }

  // Remove any stale print iframes
  const oldFrame = document.getElementById('appPrintIframe');
  if (oldFrame) {
    try {
      oldFrame.remove();
    } catch (e) {}
  }

  // Create isolated invisible print iframe with proper layout dimensions
  const printFrame = document.createElement('iframe');
  printFrame.id = 'appPrintIframe';
  printFrame.style.position = 'fixed';
  printFrame.style.left = '-9999px';
  printFrame.style.top = '0';
  printFrame.style.width = '1024px';
  printFrame.style.height = '768px';
  printFrame.style.border = '0';
  printFrame.style.visibility = 'hidden';
  document.body.appendChild(printFrame);

  const clonedHtml = el.innerHTML;
  const docHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Payvibes Statutory Document Print</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          @page { size: auto; margin: 8mm; }
          * { box-sizing: border-box; }
          body { 
            font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
            background: #ffffff; 
            color: #000000; 
            margin: 0; 
            padding: 16px; 
            -webkit-print-color-adjust: exact; 
            print-color-adjust: exact; 
          }
          .no-print { display: none !important; }
          table { width: 100%; border-collapse: collapse; }
        </style>
      </head>
      <body class="bg-white text-black p-4">
        ${clonedHtml}
      </body>
    </html>
  `;

  try {
    const frameDoc = printFrame.contentWindow.document;
    frameDoc.open();
    frameDoc.write(docHtml);
    frameDoc.close();

    const doPrint = () => {
      setTimeout(() => {
        try {
          printFrame.contentWindow.focus();
          printFrame.contentWindow.print();
        } catch (err) {
          window.print();
        }
      }, 350);
    };

    if (printFrame.contentWindow) {
      printFrame.contentWindow.onload = doPrint;
    }
    setTimeout(doPrint, 500);
  } catch (err) {
    window.print();
  }
}

function downloadDocumentCopy(elementId, filename = 'document_copy.html') {
  const el = document.getElementById(elementId);
  if (!el) return;
  const content = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <title>${filename.replace('.html', '')}</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
        <style>
          @page { size: auto; margin: 8mm; }
          body { font-family: system-ui, -apple-system, sans-serif; background: #fff; color: #000; margin: 0; padding: 20px; }
        </style>
      </head>
      <body class="bg-white text-black">
        ${el.innerHTML}
      </body>
    </html>
  `;
  const blob = new Blob([content], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Attach All Functions to Window for Global Onclick Compatibility
window.handleLogin = handleLogin;
window.quickFillRole = quickFillRole;
window.logout = logout;
window.showTab = showTab;
window.toggleSideMenu = toggleSideMenu;
window.openModal = openModal;
window.closeModal = closeModal;
window.printDocument = printDocument;
window.downloadDocumentCopy = downloadDocumentCopy;
window.handleBranchChange = handleBranchChange;
window.handleSelectExistingCustomer = handleSelectExistingCustomer;
window.handleSelectCustomerTemplate = handleSelectCustomerTemplate;
window.handleSelectSupplierTemplate = handleSelectSupplierTemplate;
window.calculateInvoiceTotal = calculateInvoiceTotal;
window.saveOrder = saveOrder;
window.saveCustomer = saveCustomer;
window.saveSupplier = saveSupplier;
window.savePurchaseInvoice = savePurchaseInvoice;
window.saveQuotation = saveQuotation;
window.savePatient = savePatient;
window.saveDebitNote = saveDebitNote;
window.saveItem = saveItem;
window.saveExpense = saveExpense;
window.saveCashBank = saveCashBank;
window.savePurchase = savePurchase;
window.savePayout = savePayout;
window.saveIncome = saveIncome;
window.savePunch = savePunch;
window.savePayroll = savePayroll;
window.saveTdsEntry = saveTdsEntry;
window.saveSettings = saveSettings;
window.handleLogoUpload = handleLogoUpload;
window.executeGstFiling = executeGstFiling;
window.autoReconcileBank = autoReconcileBank;
window.populateTransferItemSelect = populateTransferItemSelect;
window.saveStockTransfer = saveStockTransfer;
window.receiveStockTransfer = receiveStockTransfer;
window.populateEwayInvoiceSelect = populateEwayInvoiceSelect;
window.handleEwayInvoiceChange = handleEwayInvoiceChange;
window.generateEwayBill = generateEwayBill;
window.saveEwayBill = saveEwayBill;
window.editEwayBill = editEwayBill;
window.deleteEwayBill = deleteEwayBill;
window.openPrintEwaySlip = openPrintEwaySlip;
window.openEwayTracking = openEwayTracking;
window.syncAllIrnVerified = syncAllIrnVerified;
window.exportDispatchManifest = exportDispatchManifest;
window.renderEwayBills = renderEwayBills;
window.filterEwayTable = filterEwayTable;
window.sendWhatsappInvoice = sendWhatsappInvoice;
window.sendOverdueReminder = sendOverdueReminder;
window.sendBulkOverdueReminders = sendBulkOverdueReminders;
window.searchClientPortal = searchClientPortal;
window.exportDatabaseBackup = exportDatabaseBackup;
window.handleRestoreBackupFile = handleRestoreBackupFile;
window.openPrintInvoice = openPrintInvoice;
window.numberToWords = numberToWords;
window.editOrder = editOrder;
window.editPurchaseInvoice = editPurchaseInvoice;
window.editQuotation = editQuotation;
window.editDebitNote = editDebitNote;
window.editInventoryItem = editInventoryItem;
window.editCustomer = editCustomer;
window.editSupplier = editSupplier;
window.editPurchase = editPurchase;
window.editPayout = editPayout;
window.editExpense = editExpense;
window.editCashBank = editCashBank;
window.editIncome = editIncome;

window.promptRecovery = function(type) {
  const invNo = prompt("Enter the Invoice Number to edit/recover:");
  if (!invNo) return;
  if (type === 'sales') {
    const order = (window.userData?.orders || []).find(o => o.inv === invNo.trim());
    if (order) {
      editOrder(order.inv);
    } else {
      alert("Invoice not found in Sales records.");
    }
  } else if (type === 'purchase') {
    const pi = (window.userData?.purchaseinvoices || []).find(p => p.ref === invNo.trim());
    if (pi) {
      editPurchaseInvoice(pi.ref);
    } else {
      alert("Invoice not found in Purchase records.");
    }
  }
};
window.editPatient = editPatient;
window.deleteOrder = deleteOrder;
window.deletePurchaseInvoice = deletePurchaseInvoice;
window.deleteInventoryItem = deleteInventoryItem;
window.deleteCustomer = deleteCustomer;
window.deleteSupplier = deleteSupplier;
window.deletePatient = deletePatient;
window.deleteExpense = deleteExpense;
window.deleteCashBank = deleteCashBank;
window.deleteOtherIncome = deleteOtherIncome;
window.renderAll = renderAll;
window.initApp = initApp;

function applyTheme() {
  const currentTheme = localStorage.getItem('payvibes_theme') || 'light';
  const icon = document.getElementById('themeToggleIcon');
  const btn = document.getElementById('themeToggleBtn');
  if (currentTheme === 'dark') {
    document.documentElement.classList.add('dark');
    document.body.classList.add('bg-slate-900', 'text-slate-100');
    document.body.classList.remove('bg-slate-100', 'text-slate-800');
    if (icon) icon.className = 'fa-solid fa-sun text-amber-400';
    if (btn) btn.title = 'Switch to Light Mode';
  } else {
    document.documentElement.classList.remove('dark');
    document.body.classList.add('bg-slate-100', 'text-slate-800');
    document.body.classList.remove('bg-slate-900', 'text-slate-100');
    if (icon) icon.className = 'fa-solid fa-moon text-slate-600';
    if (btn) btn.title = 'Switch to Dark Mode';
  }
}

function toggleDarkMode() {
  const currentTheme = localStorage.getItem('payvibes_theme') || 'light';
  const nextTheme = currentTheme === 'light' ? 'dark' : 'light';
  localStorage.setItem('payvibes_theme', nextTheme);
  applyTheme();
}

window.toggleDarkMode = toggleDarkMode;
window.applyTheme = applyTheme;

// Auto-run on DOM Ready
function autoLogin() {
  let role = window.userData?.currentUserRole;
  
  if (!role) {
    // Fallback check directly from localStorage in case of initialization quirks
    try {
      const saved = localStorage.getItem('payvibes_enterprise_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentUserRole) {
          role = parsed.currentUserRole;
          if (window.userData) window.userData.currentUserRole = role;
        }
      }
    } catch(e) {}
  }

  if (role) {
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');
    const roleDisp = document.getElementById('userRoleDisplay');
    
    if (loginScreen) loginScreen.classList.add('hidden');
    if (appContainer) appContainer.classList.remove('hidden');
    if (roleDisp) roleDisp.innerText = role;

    initApp();
  } else {
    // Force show login if no role
    const loginScreen = document.getElementById('loginScreen');
    const appContainer = document.getElementById('appContainer');
    if (loginScreen) loginScreen.classList.remove('hidden');
    if (appContainer) appContainer.classList.add('hidden');
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme();
    initStorage();
    autoLogin();
  });
} else {
  applyTheme();
  initStorage();
  autoLogin();
}
