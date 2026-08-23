import React, { useState } from 'react';
import { 
  ShoppingBag, 
  Plus, 
  Search, 
  CheckCircle2, 
  Clock, 
  Printer, 
  Building,
  Truck,
  Eye,
  Copy,
  Trash2
} from 'lucide-react';
import { PurchaseOrder, Supplier, Branch, SystemSettings } from '../types';
import { RowActionsMenu } from './RowActionsMenu';

interface PurchasesTabProps {
  purchases: PurchaseOrder[];
  suppliers: Supplier[];
  branches: Branch[];
  settings: SystemSettings;
  userRole: string;
  onAddPurchase: (po: PurchaseOrder) => void;
}

export const PurchasesTab: React.FC<PurchasesTabProps> = ({
  purchases,
  suppliers,
  branches,
  settings,
  userRole,
  onAddPurchase,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [supplierName, setSupplierName] = useState(suppliers[0]?.name || '');
  const [itemDesc, setItemDesc] = useState('');
  const [qty, setQty] = useState('100');
  const [amount, setAmount] = useState('');
  const [branchId, setBranchId] = useState(branches[0]?.id || 'b-hq');
  const [directVendor, setDirectVendor] = useState(false);

  const totalPurchases = purchases.reduce((s, p) => s + p.amt, 0);

  const handleSavePurchase = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!supplierName) {
      alert("Please select or enter a supplier name.");
      return;
    }
    
    if (!itemDesc) {
      alert("Please enter the item details.");
      return;
    }

    const qtyParsed = parseInt(qty);
    const amtParsed = parseFloat(amount);

    if (isNaN(qtyParsed) || qtyParsed <= 0) {
      alert("Please enter a valid positive quantity.");
      return;
    }

    if (isNaN(amtParsed) || amtParsed <= 0) {
      alert("Please enter a valid positive total order amount.");
      return;
    }

    const newPO: PurchaseOrder = {
      id: 'po-' + Math.random().toString(36).substr(2, 9),
      ref: 'PO-' + Math.floor(1000 + Math.random() * 9000),
      supplier: supplierName,
      item: itemDesc,
      qty: parseInt(qty) || 1,
      amt: parseFloat(amount) || 0,
      date: new Date().toISOString().split('T')[0],
      branchId,
      status: 'Received',
      directVendorOrder: directVendor,
    };

    onAddPurchase(newPO);
    setShowAddModal(false);
    setItemDesc('');
    setAmount('');
  };

  const filteredPurchases = purchases.filter(p => 
    p.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.ref.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.item.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span>Purchases &amp; Vendor Procurement Ledger</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Manage purchase orders, manufacturer direct consignments, and automatic goods receiving notes (GRN).
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </button>
      </div>

      {/* Stats and Filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Total Purchases YTD</div>
          <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">
            {settings.currency} {totalPurchases.toLocaleString()}
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">{purchases.length} Purchase Invoices</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
          <div className="text-[10px] font-bold uppercase text-slate-400">Active Vendor Partners</div>
          <div className="text-2xl font-black text-emerald-600 mt-1">
            {suppliers.length} Vendors
          </div>
          <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5">Pharma Manufacturers &amp; Wholesalers</div>
        </div>

        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search purchases by supplier or PO #..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
            />
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
            <tr>
              <th className="p-3">PO Ref #</th>
              <th className="p-3">Date</th>
              <th className="p-3">Vendor / Supplier</th>
              <th className="p-3">Destination Branch</th>
              <th className="p-3">Items &amp; Details</th>
              <th className="p-3 text-right">Quantity</th>
              <th className="p-3 text-right">Order Amount</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredPurchases.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 dark:bg-slate-800">
                <td className="p-3 font-mono font-bold text-emerald-600">{p.ref}</td>
                <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{p.date}</td>
                <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{p.supplier}</td>
                <td className="p-3 text-slate-700 dark:text-slate-300">
                  {branches.find(b => b.id === p.branchId)?.name || 'Central HQ'}
                </td>
                <td className="p-3 text-slate-800 dark:text-slate-200 font-medium">{p.item}</td>
                <td className="p-3 text-right font-black text-slate-700 dark:text-slate-300">{p.qty}</td>
                <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                  {settings.currency} {p.amt.toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    p.status === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {p.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <RowActionsMenu
                    actions={[
                      {
                        label: 'View Purchase Order',
                        icon: <Eye className="w-3.5 h-3.5" />,
                        onClick: () => {
                          alert(`PO #: ${p.ref}\nSupplier: ${p.supplier}\nItem: ${p.item}\nQuantity: ${p.qty}\nTotal Amount: ${settings.currency} ${p.amt.toFixed(2)}\nStatus: ${p.status}`);
                        },
                      },
                      {
                        label: p.status === 'Received' ? 'Mark Pending' : 'Mark Stock Received',
                        icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
                        onClick: () => {
                          const updated = { ...p, status: p.status === 'Received' ? 'Pending' : 'Received' };
                          alert(`Purchase order ${p.ref} status updated to ${updated.status}.`);
                        },
                        variant: 'success',
                      },
                      {
                        label: 'Print Voucher Slip',
                        icon: <Printer className="w-3.5 h-3.5" />,
                        onClick: () => window.print(),
                      },
                      {
                        label: 'Duplicate PO',
                        icon: <Copy className="w-3.5 h-3.5" />,
                        onClick: () => {
                          const newPo: PurchaseOrder = {
                            ...p,
                            id: `po-${Date.now()}`,
                            ref: `PO-${Math.floor(1000 + Math.random() * 9000)}`,
                            date: new Date().toISOString().split('T')[0],
                          };
                          onAddPurchase(newPo);
                          alert(`Purchase Order ${p.ref} duplicated as ${newPo.ref}`);
                        },
                      },
                    ]}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Create New Purchase Order</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSavePurchase} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Select Supplier *</label>
                <select
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 font-bold"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Destination Branch</label>
                <select
                  value={branchId}
                  onChange={(e) => setBranchId(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Item / Medicine Description *</label>
                <input
                  type="text"
                  value={itemDesc}
                  onChange={(e) => setItemDesc(e.target.value)}
                  required
                  placeholder="e.g. 50 Cartons Augmentin 625mg"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    value={qty}
                    min="1"
                    required
                    onChange={(e) => setQty(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Total Amount ({settings.currency}) *</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg font-bold"
                  />
                </div>
              </div>

              <div className="pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={directVendor}
                    onChange={(e) => setDirectVendor(e.target.checked)}
                    className="rounded text-emerald-600"
                  />
                  <span className="font-bold text-slate-700 dark:text-slate-300">Direct Vendor-to-Retailer Delivery</span>
                </label>
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
                  Save Purchase Order
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
