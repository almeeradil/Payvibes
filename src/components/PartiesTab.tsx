import React, { useState } from 'react';
import { 
  Users, 
  Truck, 
  Plus, 
  Search, 
  Phone, 
  MapPin, 
  Wallet, 
  Award, 
  Building, 
  CheckCircle2,
  Receipt,
  FileText,
  MessageSquare,
  Eye,
  Trash2
} from 'lucide-react';
import { Customer, Supplier, SystemSettings } from '../types';
import { RowActionsMenu } from './RowActionsMenu';

interface PartiesTabProps {
  customers: Customer[];
  suppliers: Supplier[];
  settings: SystemSettings;
  onAddCustomer: (customer: Customer) => void;
  onAddSupplier: (supplier: Supplier) => void;
  onDeleteCustomer?: (id: string) => void;
  onDeleteSupplier?: (id: string) => void;
}

export const PartiesTab: React.FC<PartiesTabProps> = ({
  customers,
  suppliers,
  settings,
  onAddCustomer,
  onAddSupplier,
  onDeleteCustomer,
  onDeleteSupplier,
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'suppliers'>('customers');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);

  // Customer Form with Existing Customer Dropdown template selector
  const [existingCustomerTemplate, setExistingCustomerTemplate] = useState('');
  const [cName, setCName] = useState('');
  const [cCategory, setCCategory] = useState('Retail Pharmacy');
  const [cContact, setCContact] = useState('');
  const [cAddress, setCAddress] = useState('');
  const [cNtnGst, setCNtnGst] = useState('');
  const [cCreditLimit, setCCreditLimit] = useState('100000');
  const [cTier, setCTier] = useState<'Silver' | 'Gold' | 'Platinum' | 'Diamond'>('Gold');

  // Supplier Form with Existing Supplier Dropdown template selector
  const [existingSupplierTemplate, setExistingSupplierTemplate] = useState('');
  const [sName, setSName] = useState('');
  const [sCategory, setSCategory] = useState('Pharma Manufacturer');
  const [sContact, setSContact] = useState('');
  const [sAddress, setSAddress] = useState('');
  const [sNtnGst, setSNtnGst] = useState('');
  const [sBankAcount, setSBankAccount] = useState('');

  // Handle template selection for customer
  const handleSelectCustomerTemplate = (custName: string) => {
    setExistingCustomerTemplate(custName);
    const existing = customers.find(c => c.name === custName);
    if (existing) {
      setCName(`${existing.name} (Branch/Sub-party)`);
      setCCategory(existing.category);
      setCContact(existing.contact);
      setCAddress(existing.address);
      setCNtnGst(existing.ntnGst || '');
      setCCreditLimit(existing.creditLimit?.toString() || '100000');
      setCTier(existing.tier || 'Silver');
    }
  };

  // Handle template selection for supplier
  const handleSelectSupplierTemplate = (supName: string) => {
    setExistingSupplierTemplate(supName);
    const existing = suppliers.find(s => s.name === supName);
    if (existing) {
      setSName(`${existing.name} (Regional Hub)`);
      setSCategory(existing.category);
      setSContact(existing.contact);
      setSAddress(existing.address);
      setSNtnGst(existing.ntnGst || '');
      setSBankAccount(existing.bankAccount || '');
    }
  };

  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cName) return;
    const newCust: Customer = {
      id: 'cust-' + Math.random().toString(36).substr(2, 7),
      name: cName,
      category: cCategory,
      contact: cContact || '0300-0000000',
      address: cAddress || 'Commercial Area',
      ntnGst: cNtnGst || 'NTN-0899123-1',
      creditLimit: parseFloat(cCreditLimit) || 50000,
      balance: 0,
      loyaltyPoints: 50,
      walletBalance: 0,
      tier: cTier,
    };
    onAddCustomer(newCust);
    setShowAddCustomerModal(false);
    setCName('');
    setCContact('');
    setCAddress('');
  };

  const handleSaveSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sName) return;
    const newSup: Supplier = {
      id: 'sup-' + Math.random().toString(36).substr(2, 7),
      name: sName,
      category: sCategory,
      contact: sContact || '042-111000222',
      address: sAddress || 'Industrial Zone',
      ntnGst: sNtnGst || 'NTN-1122334-9',
      bankAccount: sBankAcount || 'HBL - 00229871628101',
      balance: 0,
    };
    onAddSupplier(newSup);
    setShowAddSupplierModal(false);
    setSName('');
    setSContact('');
    setSAddress('');
  };

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.contact.includes(searchTerm)
  );

  const filteredSuppliers = suppliers.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Customer &amp; Supplier Directory Management</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Maintain verified customer and vendor books with dropdown templates, loyalty rankings, and tax profiles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddCustomerModal(true)}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Customer</span>
          </button>
          <button
            onClick={() => setShowAddSupplierModal(true)}
            className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-slate-200 dark:border-slate-700 space-x-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('customers')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === 'customers' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Customer Accounts ({customers.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-2.5 flex items-center gap-1.5 transition ${
            activeTab === 'suppliers' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:text-slate-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          <span>Supplier / Vendor Accounts ({suppliers.length})</span>
        </button>
      </div>

      {/* Search Input */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
          />
        </div>
      </div>

      {/* Customers List Table */}
      {activeTab === 'customers' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
              <tr>
                <th className="p-3">Customer / Hospital Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Contact &amp; Location</th>
                <th className="p-3">NTN / GST #</th>
                <th className="p-3 text-center">Loyalty Tier</th>
                <th className="p-3 text-right">Credit Limit</th>
                <th className="p-3 text-right">Ledger Balance</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:bg-slate-800">
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{c.name}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{c.category}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">
                    <div>{c.contact}</div>
                    <div className="text-[10px] text-slate-400">{c.address}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{c.ntnGst || 'N/A'}</td>
                  <td className="p-3 text-center">
                    <span className="bg-purple-100 text-purple-800 font-bold px-2.5 py-0.5 rounded-full text-[10px]">
                      ⭐ {c.tier || 'Silver'} ({c.loyaltyPoints || 0} pts)
                    </span>
                  </td>
                  <td className="p-3 text-right font-semibold text-slate-700 dark:text-slate-300">
                    {settings.currency} {(c.creditLimit || 0).toLocaleString()}
                  </td>
                  <td className={`p-3 text-right font-black ${c.balance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                    {settings.currency} {c.balance.toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'View Customer Ledger',
                          icon: <FileText className="w-3.5 h-3.5" />,
                          onClick: () => {
                            alert(`Customer: ${c.name}\nContact: ${c.contact}\nLedger Balance: ${settings.currency} ${c.balance.toFixed(2)}\nCredit Limit: ${settings.currency} ${(c.creditLimit || 0).toLocaleString()}`);
                          },
                        },
                        {
                          label: 'Send WhatsApp Statement',
                          icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />,
                          onClick: () => {
                            const msg = encodeURIComponent(`Dear ${c.name}, your current ledger balance with Posvibe is ${settings.currency} ${c.balance.toFixed(2)}. Thank you!`);
                            window.open(`https://wa.me/?text=${msg}`, '_blank');
                          },
                          variant: 'success',
                        },
                        {
                          label: 'Print Ledger Statement',
                          icon: <Receipt className="w-3.5 h-3.5" />,
                          onClick: () => window.print(),
                        },
                        ...(onDeleteCustomer ? [{
                          label: 'Delete Customer',
                          icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
                          onClick: () => onDeleteCustomer(c.id),
                          variant: 'danger' as const,
                        }] : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Suppliers List Table */}
      {activeTab === 'suppliers' && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
              <tr>
                <th className="p-3">Supplier / Manufacturer Name</th>
                <th className="p-3">Category</th>
                <th className="p-3">Contact</th>
                <th className="p-3">NTN / Sales Tax</th>
                <th className="p-3">Bank Settlement Account</th>
                <th className="p-3 text-right">Payable Balance</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSuppliers.map(s => (
                <tr key={s.id} className="hover:bg-slate-50 dark:bg-slate-800">
                  <td className="p-3 font-bold text-slate-900 dark:text-slate-100">{s.name}</td>
                  <td className="p-3 text-slate-600 dark:text-slate-400">{s.category}</td>
                  <td className="p-3 text-slate-700 dark:text-slate-300">
                    <div>{s.contact}</div>
                    <div className="text-[10px] text-slate-400">{s.address}</div>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-700 dark:text-slate-300">{s.ntnGst || 'N/A'}</td>
                  <td className="p-3 font-mono text-[11px] text-slate-600 dark:text-slate-400">{s.bankAccount || 'Direct Clearing'}</td>
                  <td className="p-3 text-right font-black text-rose-600">
                    {settings.currency} {s.balance.toFixed(2)}
                  </td>
                  <td className="p-3 text-right">
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'View Supplier Ledger',
                          icon: <FileText className="w-3.5 h-3.5" />,
                          onClick: () => {
                            alert(`Supplier: ${s.name}\nContact: ${s.contact}\nPayable Balance: ${settings.currency} ${s.balance.toFixed(2)}\nBank Acc: ${s.bankAccount || 'N/A'}`);
                          },
                        },
                        {
                          label: 'Print Voucher Statement',
                          icon: <Receipt className="w-3.5 h-3.5" />,
                          onClick: () => window.print(),
                        },
                        ...(onDeleteSupplier ? [{
                          label: 'Delete Supplier',
                          icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
                          onClick: () => onDeleteSupplier(s.id),
                          variant: 'danger' as const,
                        }] : []),
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Customer Modal with Dropdown list of existing customers inside Add Customer fields */}
      {showAddCustomerModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                <span>Add Customer (With Existing Customers Dropdown)</span>
              </h3>
              <button onClick={() => setShowAddCustomerModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSaveCustomer} className="space-y-3 text-xs">
              {/* Drop-down list of existing customers inside Add Customer field */}
              <div className="bg-indigo-50/50 p-3 rounded-lg border border-indigo-100 mb-2">
                <label className="block text-[10px] font-bold uppercase text-indigo-700 mb-1">
                  Existing Customer Quick-Template Dropdown
                </label>
                <select
                  value={existingCustomerTemplate}
                  onChange={(e) => handleSelectCustomerTemplate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-indigo-200 rounded-lg bg-white dark:bg-slate-900 text-indigo-900 font-bold"
                >
                  <option value="">-- Choose Existing Customer To Prefill / Clone --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name} ({c.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Customer / Pharmacy Name *</label>
                <input
                  type="text"
                  value={cName}
                  onChange={(e) => setCName(e.target.value)}
                  required
                  placeholder="e.g. Al-Razi Pharmacy & Store"
                  className="w-full px-3 py-2 border rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Category</label>
                  <select
                    value={cCategory}
                    onChange={(e) => setCCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                  >
                    <option value="Retail Pharmacy">Retail Pharmacy</option>
                    <option value="Hospital Clinic">Hospital / Clinic</option>
                    <option value="Wholesale Distributor">Wholesale Distributor</option>
                    <option value="Walk-in Patient">Walk-in Patient</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Membership Tier</label>
                  <select
                    value={cTier}
                    onChange={(e) => setCTier(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                  >
                    <option value="Silver">Silver Tier</option>
                    <option value="Gold">Gold Tier</option>
                    <option value="Platinum">Platinum VIP</option>
                    <option value="Diamond">Diamond Elite</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Phone Contact *</label>
                  <input
                    type="text"
                    value={cContact}
                    onChange={(e) => setCContact(e.target.value)}
                    required
                    placeholder="0300-1234567"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">NTN / GST Number</label>
                  <input
                    type="text"
                    value={cNtnGst}
                    onChange={(e) => setCNtnGst(e.target.value)}
                    placeholder="NTN-0899214-5"
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Address / Street</label>
                <input
                  type="text"
                  value={cAddress}
                  onChange={(e) => setCAddress(e.target.value)}
                  placeholder="Main Commercial Market, Lahore"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddCustomerModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow"
                >
                  Save Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supplier Modal with Dropdown list of existing suppliers inside Add Supplier fields */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-lg w-full p-6 border border-slate-200 dark:border-slate-700">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                <Truck className="w-4 h-4 text-slate-900 dark:text-slate-100" />
                <span>Add Supplier (With Existing Suppliers Dropdown)</span>
              </h3>
              <button onClick={() => setShowAddSupplierModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3 text-xs">
              {/* Drop-down list of existing suppliers inside Add Supplier field */}
              <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg border border-slate-200 dark:border-slate-700 mb-2">
                <label className="block text-[10px] font-bold uppercase text-slate-600 dark:text-slate-400 mb-1">
                  Existing Supplier Quick-Template Dropdown
                </label>
                <select
                  value={existingSupplierTemplate}
                  onChange={(e) => handleSelectSupplierTemplate(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-bold"
                >
                  <option value="">-- Choose Existing Supplier To Prefill / Clone --</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.name}>{s.name} ({s.category})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Supplier / Vendor Name *</label>
                <input
                  type="text"
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  required
                  placeholder="e.g. Getz Pharma (Pvt) Ltd"
                  className="w-full px-3 py-2 border rounded-lg font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Category</label>
                  <select
                    value={sCategory}
                    onChange={(e) => setSCategory(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                  >
                    <option value="Pharma Manufacturer">Pharma Manufacturer</option>
                    <option value="Surgical Importer">Surgical Importer</option>
                    <option value="Wholesale Distributor">Wholesale Distributor</option>
                    <option value="Packaging Vendor">Packaging Vendor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">NTN / Sales Tax #</label>
                  <input
                    type="text"
                    value={sNtnGst}
                    onChange={(e) => setSNtnGst(e.target.value)}
                    placeholder="NTN-1122334-9"
                    className="w-full px-3 py-2 border rounded-lg font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Phone Contact</label>
                  <input
                    type="text"
                    value={sContact}
                    onChange={(e) => setSContact(e.target.value)}
                    placeholder="042-111000222"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Bank Account / Clearing</label>
                  <input
                    type="text"
                    value={sBankAcount}
                    onChange={(e) => setSBankAccount(e.target.value)}
                    placeholder="Meezan Bank - 010293817"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Factory / Office Address</label>
                <input
                  type="text"
                  value={sAddress}
                  onChange={(e) => setSAddress(e.target.value)}
                  placeholder="Plot 42, Korangi Industrial Zone, Karachi"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>

              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddSupplierModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-bold text-xs shadow"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
