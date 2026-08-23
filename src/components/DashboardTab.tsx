import React from 'react';
import { 
  DollarSign, 
  Package, 
  Users, 
  ArrowUpRight, 
  AlertTriangle, 
  Clock, 
  Store, 
  Percent, 
  Landmark, 
  HeartHandshake, 
  UserCheck, 
  ShieldCheck,
  TrendingUp,
  FileCheck2,
  ArrowRightLeft,
  Boxes,
  CheckCircle2,
  ShoppingCart,
  Layers,
  Eye
} from 'lucide-react';
import { AppStateData } from '../types';
import { RowActionsMenu } from './RowActionsMenu';

interface DashboardTabProps {
  data: AppStateData;
  onNavigateTab: (tab: string) => void;
  onOpenNewInvoice: () => void;
  onOpenStockTransfer: () => void;
  onOpenGstFiling: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  data,
  onNavigateTab,
  onOpenNewInvoice,
  onOpenStockTransfer,
  onOpenGstFiling,
}) => {
  const isHQ = data.currentBranchId === 'ALL_HQ';
  
  // Filter records by active branch
  const filteredOrders = isHQ 
    ? data.orders 
    : data.orders.filter(o => o.branchId === data.currentBranchId);
    
  const filteredInventory = isHQ 
    ? data.inventory 
    : data.inventory.filter(i => i.branchId === data.currentBranchId);

  const filteredPurchases = isHQ 
    ? data.purchaseinvoices 
    : data.purchaseinvoices.filter(p => p.branchId === data.currentBranchId);

  const filteredExpenses = isHQ 
    ? data.expenses 
    : data.expenses.filter(e => e.branchId === data.currentBranchId);

  const totalSalesRevenue = filteredOrders.reduce((s, o) => s + (o.amount || 0), 0);
  const totalPurchaseExpenses = filteredPurchases.reduce((s, p) => s + (p.amt || 0), 0);
  const totalOtherExpenses = filteredExpenses.reduce((s, e) => s + (e.amount || 0), 0);
  const totalStockUnits = filteredInventory.reduce((s, i) => s + (i.stock || 0), 0);
  const totalStockValue = filteredInventory.reduce((s, i) => s + (i.stock * i.purchasePrice), 0);
  
  // Global Reorder Point configuration from settings
  const defaultReorderPoint = data.settings.inventoryReorderPoint ?? 20;
  const criticalThreshold = data.settings.criticalStockThreshold ?? 5;

  // Filter items with stock levels below or equal to their reorder point
  const lowStockItems = filteredInventory.filter(i => {
    const threshold = i.minStockAlert ?? i.minStockLevel ?? defaultReorderPoint;
    return (i.stock || 0) <= threshold;
  });

  const criticalLowCount = lowStockItems.filter(i => (i.stock || 0) <= criticalThreshold).length;
  const totalRestockDeficit = lowStockItems.reduce((acc, i) => {
    const threshold = i.minStockAlert ?? i.minStockLevel ?? defaultReorderPoint;
    return acc + Math.max(0, threshold - (i.stock || 0));
  }, 0);

  const today = new Date();
  const nearExpiryItems = filteredInventory.filter(i => {
    if (!i.expiry) return false;
    const exp = new Date(i.expiry);
    const diff = (exp.getTime() - today.getTime()) / (1000 * 3600 * 24);
    return diff <= 60 && diff >= 0;
  });

  const pendingReminders = filteredOrders.filter(o => o.status === 'Unpaid' || o.status === 'Overdue');
  const activeStaffCount = data.employees.filter(e => isHQ || e.branchId === data.currentBranchId).length;

  return (
    <div className="space-y-6">
      {/* Top Banner Alert for Items Below Reorder Point */}
      {lowStockItems.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 text-rose-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-rose-100 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-rose-600 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xs text-rose-950">Inventory Reorder Warning:</span>
                <span className="bg-rose-200 text-rose-900 text-[10px] font-bold px-2 py-0.2 rounded-full">
                  {lowStockItems.length} SKU{lowStockItems.length > 1 ? 's' : ''} Below Reorder Point
                </span>
                {criticalLowCount > 0 && (
                  <span className="bg-rose-700 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full animate-pulse">
                    {criticalLowCount} Critical
                  </span>
                )}
              </div>
              <p className="text-xs font-medium text-rose-800 mt-0.5">
                {lowStockItems.length} item(s) have dropped to or below the safety threshold (Configured Reorder Point: {defaultReorderPoint} units). Total replenishment needed: <strong className="font-bold">{totalRestockDeficit} units</strong>.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onNavigateTab('settings')}
              className="px-2.5 py-1 text-rose-700 hover:bg-rose-100 rounded-lg text-xs font-semibold transition"
            >
              Configure Settings
            </button>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5" />
              <span>Restock Inventory</span>
            </button>
          </div>
        </div>
      )}

      {/* Near Expiry Banner */}
      {nearExpiryItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-3 rounded-xl flex items-center justify-between shadow-xs">
          <div className="flex items-center space-x-2.5">
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="font-extrabold text-xs">Near Expiry Warning: </span>
              <span className="text-xs font-semibold">
                {nearExpiryItems.length} medicine batch(es) expire within 60 days!
              </span>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('inventory')}
            className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition shrink-0"
          >
            Review Batches
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Sales */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-orange-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Sales Turnover</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {data.settings.currency} {totalSalesRevenue.toLocaleString()}
          </div>
          <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>{filteredOrders.length} Invoices Generated</span>
          </div>
        </div>

        {/* Stock Inventory Value & Reorder Indicator */}
        <div className={`bg-white dark:bg-slate-900 p-5 rounded-xl border transition ${lowStockItems.length > 0 ? 'border-rose-200 hover:border-rose-300 ring-1 ring-rose-100' : 'border-slate-200 dark:border-slate-700 hover:border-cyan-300'} shadow-xs`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Live Inventory Value</span>
            <div className={`w-8 h-8 rounded-lg ${lowStockItems.length > 0 ? 'bg-rose-50 text-rose-600' : 'bg-cyan-50 text-cyan-600'} flex items-center justify-center font-bold`}>
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {data.settings.currency} {totalStockValue.toLocaleString()}
          </div>
          <div className="flex items-center justify-between mt-1 text-[11px]">
            <span className="text-slate-500 dark:text-slate-400">{totalStockUnits} Units ({filteredInventory.length} SKUs)</span>
            {lowStockItems.length > 0 ? (
              <span className="font-bold text-rose-600 flex items-center gap-1 bg-rose-50 px-1.5 py-0.2 rounded">
                <AlertTriangle className="w-3 h-3" />
                {lowStockItems.length} Under Reorder Pt
              </span>
            ) : (
              <span className="font-bold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Stock Optimal
              </span>
            )}
          </div>
        </div>

        {/* Total Items & Low Stock Count */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-amber-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total &amp; Low Stock Items</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {filteredInventory.length} Total Items
          </div>
          <div className={`text-[11px] font-bold mt-1 flex items-center gap-1 ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Low Stock Items: {lowStockItems.length}</span>
          </div>
        </div>

        {/* Multi-Store Active Branches */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-purple-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Multi-Store Network</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Store className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-2">
            {data.branches.length} Store Chains
          </div>
          <div className="text-[11px] font-semibold text-purple-600 mt-1">
            {activeStaffCount} Active On-Duty Staff
          </div>
        </div>

        {/* Total Outflow & Expenses */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-rose-300 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase text-slate-400">Total Purchases &amp; Exp</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-rose-600 mt-2">
            {data.settings.currency} {(totalPurchaseExpenses + totalOtherExpenses).toLocaleString()}
          </div>
          <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mt-1">
            Purchases: {data.settings.currency} {totalPurchaseExpenses.toLocaleString()} | Exp: {data.settings.currency} {totalOtherExpenses.toLocaleString()}
          </div>
        </div>
      </div>

      {/* DEDICATED VISUAL DASHBOARD INDICATOR: LOW STOCK & REORDER POINT MONITOR */}
      <div className={`p-5 rounded-xl border shadow-xs transition ${
        lowStockItems.length > 0 
          ? 'bg-gradient-to-br from-white via-rose-50/20 to-white border-rose-300 ring-1 ring-rose-200/60' 
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700'
      }`}>
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs ${
              lowStockItems.length > 0 ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'
            }`}>
              {lowStockItems.length > 0 ? <AlertTriangle className="w-5 h-5" /> : <Boxes className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-black text-slate-900 dark:text-slate-100">
                  Stock Level &amp; Reorder Point Visual Indicator
                </h4>
                {lowStockItems.length > 0 ? (
                  <span className="bg-rose-100 text-rose-800 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-ping"></span>
                    {lowStockItems.length} Item{lowStockItems.length > 1 ? 's' : ''} Below Reorder Point
                  </span>
                ) : (
                  <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    All Stocks Healthy
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automated threshold monitoring against Inventory Settings reorder baseline (Global Target: <strong className="text-slate-800 dark:text-slate-200">{defaultReorderPoint} units</strong>, Critical: <strong className="text-rose-600">{criticalThreshold} units</strong>).
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onNavigateTab('settings')}
              className="text-xs font-bold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <span>Adjust Reorder Settings</span>
            </button>
            <button
              onClick={() => onNavigateTab('inventory')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1 cursor-pointer"
            >
              <span>Open Stock Inventory</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Summary Badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Total Under-Stock SKUs</div>
              <div className={`text-lg font-black ${lowStockItems.length > 0 ? 'text-rose-600' : 'text-slate-900 dark:text-slate-100'} mt-0.5`}>
                {lowStockItems.length} Products
              </div>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              lowStockItems.length > 0 ? 'bg-rose-100 text-rose-700' : 'bg-slate-200 text-slate-600 dark:text-slate-400'
            }`}>
              <Boxes className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Critical Emergency Stock (&le; {criticalThreshold} units)</div>
              <div className={`text-lg font-black ${criticalLowCount > 0 ? 'text-rose-700' : 'text-slate-900 dark:text-slate-100'} mt-0.5`}>
                {criticalLowCount} Products
              </div>
            </div>
            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold ${
              criticalLowCount > 0 ? 'bg-rose-600 text-white animate-pulse' : 'bg-slate-200 text-slate-600 dark:text-slate-400'
            }`}>
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-bold uppercase text-slate-400">Replenishment Units Needed</div>
              <div className="text-lg font-black text-indigo-600 mt-0.5">
                +{totalRestockDeficit} Units Target
              </div>
            </div>
            <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
              <ShoppingCart className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Breakdown of items below reorder point */}
        {lowStockItems.length > 0 ? (
          <div className="overflow-x-auto rounded-xl border border-rose-200 bg-white dark:bg-slate-900">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-rose-50/70 text-rose-900 uppercase border-b border-rose-200 font-bold text-[10px]">
                <tr>
                  <th className="p-3">Product / Medicine Item</th>
                  <th className="p-3">Category</th>
                  <th className="p-3">Batch &amp; Expiry</th>
                  <th className="p-3 text-center">In-Stock vs Reorder Point</th>
                  <th className="p-3 text-right">Units Deficit</th>
                  <th className="p-3 text-center">Urgency Level</th>
                  <th className="p-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rose-100">
                {lowStockItems.map(item => {
                  const targetPoint = item.minStockAlert ?? item.minStockLevel ?? defaultReorderPoint;
                  const currentStock = item.stock || 0;
                  const deficit = Math.max(0, targetPoint - currentStock);
                  const stockPct = Math.min(100, Math.round((currentStock / Math.max(1, targetPoint)) * 100));
                  
                  const isOutOfStock = currentStock === 0;
                  const isCritical = currentStock <= criticalThreshold;

                  return (
                    <tr key={item.id} className="hover:bg-rose-50/40 transition">
                      <td className="p-3">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                          <AlertTriangle className={`w-3.5 h-3.5 ${isOutOfStock ? 'text-rose-900' : isCritical ? 'text-rose-600' : 'text-amber-600'}`} />
                          <span>{item.name}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">HSN/HS: {item.hsCode || item.hsnCode || '3004.9090'}</div>
                      </td>
                      <td className="p-3">
                        <span className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold px-2 py-0.5 rounded text-[10px]">
                          {item.category || 'General'}
                        </span>
                      </td>
                      <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">
                        <div className="font-bold text-slate-800 dark:text-slate-200">{item.batch || 'BT-LIVE'}</div>
                        <div className="text-[10px] text-slate-400">{item.expiry || item.expiryDate || 'N/A'}</div>
                      </td>
                      <td className="p-3 min-w-[160px]">
                        <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                          <span className={`${isCritical ? 'text-rose-600 font-black' : 'text-amber-700'}`}>
                            {currentStock} {item.unit || 'units'} in stock
                          </span>
                          <span className="text-slate-400 text-[10px]">
                            Target: {targetPoint}
                          </span>
                        </div>
                        {/* Visual Progress Bar */}
                        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isOutOfStock 
                                ? 'w-0' 
                                : isCritical 
                                ? 'bg-rose-600' 
                                : 'bg-amber-500'
                            }`}
                            style={{ width: `${Math.max(4, stockPct)}%` }}
                          ></div>
                        </div>
                      </td>
                      <td className="p-3 text-right font-black text-rose-600 text-xs">
                        +{deficit} {item.unit || 'units'}
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full font-black text-[10px] inline-flex items-center gap-1 ${
                          isOutOfStock
                            ? 'bg-rose-900 text-white'
                            : isCritical
                            ? 'bg-rose-100 text-rose-800 ring-1 ring-rose-300'
                            : 'bg-amber-100 text-amber-900 ring-1 ring-amber-300'
                        }`}>
                          {isOutOfStock ? 'OUT OF STOCK' : isCritical ? 'CRITICAL REORDER' : 'BELOW REORDER POINT'}
                        </span>
                      </td>
                      <td className="p-3 text-right">
                        <RowActionsMenu
                          actions={[
                            {
                              label: 'Restock Product',
                              icon: <ShoppingCart className="w-3.5 h-3.5 text-indigo-600" />,
                              onClick: () => onNavigateTab('inventory'),
                              variant: 'primary',
                            },
                            {
                              label: 'View Stock Metrics',
                              icon: <Eye className="w-3.5 h-3.5" />,
                              onClick: () => {
                                alert(`Item: ${item.name}\nIn Stock: ${currentStock}\nTarget: ${targetPoint}\nDeficit: ${deficit}`);
                              },
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 bg-emerald-50/60 border border-emerald-200 rounded-xl text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-8 h-8 text-emerald-600 mb-2" />
            <h5 className="font-black text-emerald-950 text-sm">All Inventory Stocks Are Optimal</h5>
            <p className="text-xs text-emerald-800 max-w-md mt-1">
              Zero SKUs currently fall below the configured safety reorder point of <span className="font-bold">{defaultReorderPoint} units</span>.
            </p>
          </div>
        )}
      </div>

      {/* Multi-Store Chain Live Branch Monitoring Table */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Store className="w-4 h-4 text-purple-600" />
              <span>Multi-Store &amp; Franchise Live Branch Monitor</span>
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">Live aggregated sales, stock levels, and staff status across store network.</p>
          </div>
          <button
            onClick={() => onNavigateTab('multistore')}
            className="text-xs font-bold text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition flex items-center gap-1"
          >
            <span>Branch Controller</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
              <tr>
                <th className="p-3">Store Branch</th>
                <th className="p-3">Location / Code</th>
                <th className="p-3">Branch Manager</th>
                <th className="p-3 text-right">Sales Revenue</th>
                <th className="p-3 text-right">Stock Value</th>
                <th className="p-3 text-center">Staff Count</th>
                <th className="p-3 text-center">Status</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.branches.map(b => {
                const bSales = data.orders.filter(o => o.branchId === b.id).reduce((s, o) => s + o.amount, 0);
                const bStockVal = data.inventory.filter(i => i.branchId === b.id).reduce((s, i) => s + (i.stock * i.purchasePrice), 0);
                const bStaff = data.employees.filter(e => e.branchId === b.id).length;
                return (
                  <tr key={b.id} className="hover:bg-slate-50 dark:bg-slate-800 transition">
                    <td className="p-3 font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                      <Store className="w-3.5 h-3.5 text-purple-500" />
                      <span>{b.name}</span>
                      {b.isHq && <span className="bg-purple-100 text-purple-800 text-[9px] px-1.5 py-0.2 rounded font-bold">HQ</span>}
                    </td>
                    <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{b.city} ({b.code})</td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{b.manager}</td>
                    <td className="p-3 text-right font-black text-emerald-600">
                      {data.settings.currency} {bSales.toLocaleString()}
                    </td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                      {data.settings.currency} {bStockVal.toLocaleString()}
                    </td>
                    <td className="p-3 text-center font-bold text-slate-700 dark:text-slate-300">{bStaff} Staff</td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-bold">
                        {b.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <RowActionsMenu
                        actions={[
                          {
                            label: 'Manage Branch',
                            icon: <Store className="w-3.5 h-3.5 text-purple-600" />,
                            onClick: () => onNavigateTab('multistore'),
                            variant: 'primary',
                          },
                          {
                            label: 'View Branch Details',
                            icon: <Eye className="w-3.5 h-3.5" />,
                            onClick: () => {
                              alert(`Branch: ${b.name} (${b.code})\nLocation: ${b.city}\nManager: ${b.manager}\nStaff Count: ${bStaff}\nSales: ${data.settings.currency} ${bSales.toLocaleString()}\nStock Value: ${data.settings.currency} ${bStockVal.toLocaleString()}`);
                            },
                          },
                        ]}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Access Modules Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* GST & Tax Compliance Widget */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase text-slate-400">GST &amp; Tax Compliance</span>
              <FileCheck2 className="w-4 h-4 text-emerald-600" />
            </div>
            <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Automated 1-Click Tax Filing</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              GSTR-1, GSTR-3B &amp; E-Way Bill validation engine with pre-submission error checking.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('gstfiling')}
            className="mt-4 w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Open GST Compliance Center</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Inter-Store Stock Transfer Widget */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase text-slate-400">Logistics &amp; Stock</span>
              <ArrowRightLeft className="w-4 h-4 text-purple-600" />
            </div>
            <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Inter-Store Stock Transfer</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Transfer items seamlessly between store branches with real-time transit status tracking.
            </p>
          </div>
          <button
            onClick={onOpenStockTransfer}
            className="mt-4 w-full py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>New Stock Transfer Order</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* HR & Biometric Attendance Widget */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold uppercase text-slate-400">HR &amp; Payroll</span>
              <UserCheck className="w-4 h-4 text-indigo-600" />
            </div>
            <h5 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Biometric Attendance &amp; Payroll</h5>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Punch-in tracking, automated working hours salary calculation, and 1-Click Sync to Expenses.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('hrpayroll')}
            className="mt-4 w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-lg text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <span>Manage HR &amp; Payroll</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
