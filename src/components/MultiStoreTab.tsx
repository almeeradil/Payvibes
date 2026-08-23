import React, { useState } from 'react';
import { 
  Store, 
  Building2, 
  ArrowRightLeft, 
  Truck, 
  Users, 
  DollarSign, 
  Plus, 
  CheckCircle2, 
  Clock, 
  ExternalLink,
  Package,
  Boxes,
  Printer,
  Eye
} from 'lucide-react';
import { Branch, StockTransfer, InventoryItem, Supplier, PurchaseOrder, SystemSettings } from '../types';
import { RowActionsMenu } from './RowActionsMenu';

interface MultiStoreTabProps {
  branches: Branch[];
  stockTransfers: StockTransfer[];
  inventory: InventoryItem[];
  suppliers: Supplier[];
  purchases: PurchaseOrder[];
  settings: SystemSettings;
  userRole: string;
  onOpenStockTransferModal: () => void;
  onReceiveStockTransfer: (transferId: string) => void;
  onAddBranch: (branch: Branch) => void;
  onDirectVendorOrder: (po: PurchaseOrder) => void;
}

export const MultiStoreTab: React.FC<MultiStoreTabProps> = ({
  branches,
  stockTransfers,
  inventory,
  suppliers,
  purchases,
  settings,
  userRole,
  onOpenStockTransferModal,
  onReceiveStockTransfer,
  onAddBranch,
  onDirectVendorOrder,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'hq' | 'transfers' | 'vendor'>('hq');
  const [showNewBranchModal, setShowNewBranchModal] = useState(false);
  const [showVendorOrderModal, setShowVendorOrderModal] = useState(false);

  // New Branch Form
  const [bName, setBName] = useState('');
  const [bCity, setBCity] = useState('Multan');
  const [bCode, setBCode] = useState('MLT-05');
  const [bAddress, setBAddress] = useState('');
  const [bPhone, setBPhone] = useState('');
  const [bManager, setBManager] = useState('');

  // Vendor Direct Order Form
  const [vSupplier, setVSupplier] = useState(suppliers[0]?.name || '');
  const [vItem, setVItem] = useState('');
  const [vAmount, setVAmount] = useState('');
  const [vQty, setVQty] = useState('50');
  const [vBranch, setVBranch] = useState(branches[1]?.id || 'b-lhr');

  const handleSaveBranch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!bName) return;
    const newB: Branch = {
      id: 'b-' + Math.random().toString(36).substr(2, 7),
      name: bName,
      code: bCode || 'BR-' + Math.floor(10 + Math.random() * 90),
      city: bCity,
      address: bAddress,
      phone: bPhone,
      manager: bManager,
      gstinNtn: settings.ntn,
      isHq: false,
      status: 'Active',
    };
    onAddBranch(newB);
    setShowNewBranchModal(false);
    setBName('');
    setBAddress('');
  };

  const handleSaveVendorOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const newPo: PurchaseOrder = {
      id: 'po-' + Math.random().toString(36).substr(2, 8),
      ref: 'PO-DIRECT-' + Math.floor(1000 + Math.random() * 9000),
      supplier: vSupplier,
      item: vItem,
      amt: parseFloat(vAmount) || 0,
      qty: parseInt(vQty) || 1,
      date: new Date().toISOString().split('T')[0],
      branchId: vBranch,
      status: 'Pending',
      directVendorOrder: true,
    };
    onDirectVendorOrder(newPo);
    setShowVendorOrderModal(false);
    setVItem('');
    setVAmount('');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 font-bold">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
              Central HQ &amp; Multi-Store Franchise Management
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live monitor store chains, inter-store stock transfers, and direct vendor-to-retailer connections.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenStockTransferModal}
            className="px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Stock Transfer</span>
          </button>
          <button
            onClick={() => setShowNewBranchModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Store Branch</span>
          </button>
        </div>
      </div>

      {/* Sub Navigation */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('hq')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === 'hq' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <Store className="w-4 h-4" />
          <span>Branch Directory &amp; Performance</span>
        </button>
        <button
          onClick={() => setActiveSubTab('transfers')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === 'transfers' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <ArrowRightLeft className="w-4 h-4" />
          <span>Inter-Store Stock Transfer Channel ({stockTransfers.length})</span>
        </button>
        <button
          onClick={() => setActiveSubTab('vendor')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeSubTab === 'vendor' ? 'border-b-2 border-purple-600 text-purple-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Direct Vendor-to-Retailer Channel</span>
        </button>
      </div>

      {/* HQ Branches Overview */}
      {activeSubTab === 'hq' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {branches.map(b => (
            <div key={b.id} className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs hover:border-purple-300 transition">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                  {b.code}
                </span>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                  {b.status}
                </span>
              </div>
              <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">{b.name}</h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{b.address}</p>
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Manager:</span>
                  <span className="font-bold text-slate-700 dark:text-slate-300">{b.manager}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Contact:</span>
                  <span className="font-semibold text-slate-600 dark:text-slate-400">{b.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">HQ Status:</span>
                  <span className="font-bold text-purple-700">{b.isHq ? 'Central Primary HQ' : 'Branch Franchise'}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock Transfers Table */}
      {activeSubTab === 'transfers' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
              <tr>
                <th className="p-3">Transfer #</th>
                <th className="p-3">Date</th>
                <th className="p-3">From Branch (Source)</th>
                <th className="p-3">To Branch (Destination)</th>
                <th className="p-3">Item &amp; Batch</th>
                <th className="p-3 text-right">Transfer Qty</th>
                <th className="p-3 text-center">Transit Status</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stockTransfers.map(st => (
                <tr key={st.id} className="hover:bg-slate-50 dark:bg-slate-800">
                  <td className="p-3 font-bold text-purple-600 font-mono">{st.transferNo}</td>
                  <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{st.date}</td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{st.fromBranchName}</td>
                  <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{st.toBranchName}</td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900 dark:text-slate-100">{st.itemName}</div>
                    <div className="text-[9px] text-slate-400 font-mono">Batch: {st.batch}</div>
                  </td>
                  <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">{st.qty} Units</td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                      st.status === 'Received' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}>
                      {st.status}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'Confirm Receive Stock',
                          icon: <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />,
                          onClick: () => onReceiveStockTransfer(st.id),
                          disabled: st.status === 'Received',
                          variant: 'success',
                        },
                        {
                          label: 'View Transfer Details',
                          icon: <Eye className="w-3.5 h-3.5" />,
                          onClick: () => {
                            alert(`Transfer #: ${st.transferNo}\nFrom: ${st.fromBranchName}\nTo: ${st.toBranchName}\nItem: ${st.itemName} (Batch: ${st.batch})\nQuantity: ${st.qty}\nStatus: ${st.status}`);
                          },
                        },
                        {
                          label: 'Print Gate Pass Slip',
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
      )}

      {/* Direct Vendor-to-Retailer Channel */}
      {activeSubTab === 'vendor' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex items-center justify-between">
            <div>
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Truck className="w-4 h-4 text-emerald-600" />
                <span>Direct Vendor-to-Retailer Connect</span>
              </h4>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Authorized store branches can issue direct purchase orders to certified pharma vendors without HQ intermediate transit.
              </p>
            </div>
            <button
              onClick={() => setShowVendorOrderModal(true)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Direct Vendor Order</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
                <tr>
                  <th className="p-3">PO Ref #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Vendor / Supplier</th>
                  <th className="p-3">Receiving Branch</th>
                  <th className="p-3">Items Ordered</th>
                  <th className="p-3 text-right">Order Value</th>
                  <th className="p-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:bg-slate-800">
                    <td className="p-3 font-bold text-emerald-600 font-mono">{p.ref}</td>
                    <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{p.date}</td>
                    <td className="p-3 font-bold text-slate-800 dark:text-slate-200">{p.supplier}</td>
                    <td className="p-3 font-semibold text-slate-700 dark:text-slate-300">
                      {branches.find(b => b.id === p.branchId)?.name || 'Central HQ'}
                    </td>
                    <td className="p-3 text-slate-700 dark:text-slate-300">{p.item}</td>
                    <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                      {settings.currency} {p.amt.toFixed(2)}
                    </td>
                    <td className="p-3 text-center">
                      <span className="bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded text-[10px]">
                        {p.status || 'Dispatched'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Store Branch Modal */}
      {showNewBranchModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Add New Store Branch</h3>
              <button onClick={() => setShowNewBranchModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSaveBranch} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Branch Name *</label>
                <input
                  type="text"
                  value={bName}
                  onChange={(e) => setBName(e.target.value)}
                  required
                  placeholder="e.g. Multan Cantt Outlet"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">City</label>
                  <input
                    type="text"
                    value={bCity}
                    onChange={(e) => setBCity(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Branch Code</label>
                  <input
                    type="text"
                    value={bCode}
                    onChange={(e) => setBCode(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Branch Address</label>
                <input
                  type="text"
                  value={bAddress}
                  onChange={(e) => setBAddress(e.target.value)}
                  placeholder="Main Commercial Area"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Manager Incharge</label>
                  <input
                    type="text"
                    value={bManager}
                    onChange={(e) => setBManager(e.target.value)}
                    placeholder="Mr. Asad Ali"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Phone</label>
                  <input
                    type="text"
                    value={bPhone}
                    onChange={(e) => setBPhone(e.target.value)}
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewBranchModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold text-xs shadow"
                >
                  Add Store Branch
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Direct Vendor Order Modal */}
      {showVendorOrderModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">Issue Direct Vendor PO</h3>
              <button onClick={() => setShowVendorOrderModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSaveVendorOrder} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Select Supplier *</label>
                <select
                  value={vSupplier}
                  onChange={(e) => setVSupplier(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Destination Branch</label>
                <select
                  value={vBranch}
                  onChange={(e) => setVBranch(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                >
                  {branches.map(b => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Items / Medicine Name *</label>
                <input
                  type="text"
                  value={vItem}
                  onChange={(e) => setVItem(e.target.value)}
                  required
                  placeholder="e.g. Augmentin 625mg & Surbex-Z"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Total Quantity</label>
                  <input
                    type="number"
                    value={vQty}
                    onChange={(e) => setVQty(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Estimated Amount ({settings.currency})</label>
                  <input
                    type="number"
                    value={vAmount}
                    onChange={(e) => setVAmount(e.target.value)}
                    required
                    placeholder="0.00"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowVendorOrderModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow"
                >
                  Dispatch Vendor PO
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
