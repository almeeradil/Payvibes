import React, { useState, useRef } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Printer, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Truck, 
  QrCode, 
  Search,
  Users,
  Percent,
  Download,
  Camera,
  Mic,
  Loader2,
  Copy,
  MessageSquare,
  Eye
} from 'lucide-react';
import { SalesInvoice, InvoiceItem, Customer, InventoryItem, SystemSettings } from '../types';
import { printSalesInvoice } from '../services/printSlip';
import { RowActionsMenu } from './RowActionsMenu';

interface SalesTabProps {
  orders: SalesInvoice[];
  customers: Customer[];
  inventory: InventoryItem[];
  settings: SystemSettings;
  userRole: string;
  onSaveInvoice: (invoice: SalesInvoice) => void;
  onOpenEwayModal: (invoice: SalesInvoice) => void;
  onDeleteOrder?: (id: string) => void;
}

export const SalesTab: React.FC<SalesTabProps> = ({
  orders,
  customers,
  inventory,
  settings,
  userRole,
  onSaveInvoice,
  onOpenEwayModal,
  onDeleteOrder,
}) => {
  const [showNewModal, setShowNewModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invoice creation form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Credit / Pay Later' | 'Bank Transfer' | 'Digital Wallet' | 'Split'>('Cash');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      name: inventory[0]?.name || 'Panadol 500mg Tablets',
      qty: 2,
      price: inventory[0]?.price || 150,
      taxPercent: 18,
      hsnCode: inventory[0]?.hsnCode || '3004.90.99',
      batch: inventory[0]?.batch || 'PAN-9982',
      discount: 0,
      total: (inventory[0]?.price || 150) * 2 * 1.18,
    }
  ]);
  const [applyTcs, setApplyTcs] = useState(false);
  const [applyTds, setApplyTds] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];

  // Calculations
  const subtotal = items.reduce((sum, item) => sum + (item.qty * item.price) - (item.discount || 0), 0);
  const totalTax = items.reduce((sum, item) => {
    const taxable = (item.qty * item.price) - (item.discount || 0);
    return sum + (taxable * (item.taxPercent / 100));
  }, 0);
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const tcsAmount = applyTcs ? (subtotal * 0.001) : 0;
  const grandTotal = subtotal + totalTax + tcsAmount;

  const handleAddItem = () => {
    const defaultInv = inventory[0];
    const newItem: InvoiceItem = {
      id: 'item-' + Math.random().toString(36).substr(2, 7),
      name: defaultInv?.name || 'New Item',
      qty: 1,
      price: defaultInv?.price || 100,
      taxPercent: 18,
      hsnCode: defaultInv?.hsnCode || '3004.90.99',
      batch: defaultInv?.batch || 'BT-100',
      discount: 0,
      total: (defaultInv?.price || 100) * 1.18,
    };
    setItems([...items, newItem]);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...items];
    const current = { ...updated[idx], [field]: val };
    
    // If name changed from inventory dropdown, autofill price, hsn, batch
    if (field === 'name') {
      const invMatch = inventory.find(i => i.name === val);
      if (invMatch) {
        current.price = invMatch.price || invMatch.salePrice || 100;
        current.hsnCode = invMatch.hsnCode || invMatch.hsCode || '3004.90.99';
        current.batch = invMatch.batch;
      }
    }

    const price = current.price || current.rate || 0;
    const taxPct = current.taxPercent || current.taxPct || 0;
    const taxable = (current.qty * price) - (current.discount || 0);
    current.total = taxable + (taxable * (taxPct / 100));
    updated[idx] = current;
    setItems(updated);
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer) {
      alert("Please select a customer.");
      return;
    }
    
    if (!invoiceDate) {
      alert("Please select an invoice date.");
      return;
    }

    if (items.length === 0) {
      alert("Please add at least one item to the invoice.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name || !item.qty || item.qty <= 0 || !item.price || item.price <= 0) {
        alert(`Please fill in valid name, quantity, and price for item #${i + 1}.`);
        return;
      }
    }

    const invNum = 'INV-' + Math.floor(1000 + Math.random() * 9000);
    const newInvoice: SalesInvoice = {
      id: 'inv-' + Math.random().toString(36).substr(2, 9),
      inv: invNum,
      date: invoiceDate,
      dueDate: invoiceDueDate || invoiceDate,
      custName: selectedCustomer.name,
      partyType: 'Customer',
      contact: selectedCustomer.contact,
      customerNtnGst: selectedCustomer.ntnGst || 'NTN-0899214-5',
      items: [...items],
      amount: grandTotal,
      subtotal,
      totalTax,
      cgst,
      sgst,
      tcsAmount: applyTcs ? tcsAmount : undefined,
      tcsRate: applyTcs ? 0.1 : undefined,
      status: paymentMode === 'Credit / Pay Later' ? 'Unpaid' : 'Paid',
      paymentMode,
      branchId: 'b-hq',
      vehicleNo: vehicleNumber || undefined,
      eWayBillNo: grandTotal >= 50000 && vehicleNumber ? 'EWB-' + Math.floor(100000000000 + Math.random() * 900000000000) : undefined,
      irn: 'IRN-' + Math.random().toString(36).substr(2, 12).toUpperCase(),
    };

    onSaveInvoice(newInvoice);
    setShowNewModal(false);
  };
  
  const handleOcrUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessingAI(true);
    setAiError('');

    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        
        try {
          const response = await fetch('/api/gemini/ocr', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              imageBase64: base64String,
              mimeType: file.type
            }),
          });
          
          if (!response.ok) throw new Error('Failed to process image');
          const data = await response.json();
          if (data.error) throw new Error(data.error);
          
          const result = data.result;
          
          // Try to match customer
          if (result.partyName) {
            const matchedCustomer = customers.find(c => 
              c.name.toLowerCase().includes(result.partyName.toLowerCase())
            );
            if (matchedCustomer) {
              setSelectedCustomerId(matchedCustomer.id);
            }
          }
          
          if (result.date) {
            setInvoiceDate(result.date);
          }
          
          if (result.items && result.items.length > 0) {
            const newItems = result.items.map((item: any) => ({
              id: 'item-' + Math.random().toString(36).substr(2, 7),
              name: item.name || 'Extracted Item',
              qty: item.qty || 1,
              price: item.rate || 0,
              taxPercent: 18,
              hsnCode: '3004.90.99',
              batch: 'AI-OCR',
              discount: 0,
              total: (item.qty || 1) * (item.rate || 0) * 1.18,
            }));
            setItems(newItems);
          }
          
          setShowNewModal(true);
        } catch (err: any) {
          setAiError(err.message || 'Error processing OCR');
        } finally {
          setIsProcessingAI(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsProcessingAI(false);
      setAiError('Failed to read file');
    }
  };

  const handleVoiceCommand = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Your browser doesn't support voice recognition.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    setAiError('');

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsListening(false);
      setIsProcessingAI(true);

      try {
        const response = await fetch('/api/gemini/voice-invoice', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: transcript }),
        });
        
        if (!response.ok) throw new Error('Failed to process voice command');
        const data = await response.json();
        if (data.error) throw new Error(data.error);
        
        const result = data.result;
        
        if (result.customerName) {
          const matchedCustomer = customers.find(c => 
            c.name.toLowerCase().includes(result.customerName.toLowerCase())
          );
          if (matchedCustomer) {
            setSelectedCustomerId(matchedCustomer.id);
          }
        }
        
        const newItem: InvoiceItem = {
          id: 'item-' + Math.random().toString(36).substr(2, 7),
          name: result.productName || 'Voice Item',
          qty: result.qty || 1,
          price: result.rate || 0,
          taxPercent: 18,
          hsnCode: '3004.90.99',
          batch: 'AI-VOICE',
          discount: 0,
          total: (result.qty || 1) * (result.rate || 0) * 1.18,
        };
        
        setItems([newItem]);
        setShowNewModal(true);
      } catch (err: any) {
        setAiError(err.message || 'Error processing voice command');
      } finally {
        setIsProcessingAI(false);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      setAiError(`Voice recognition error: ${event.error}`);
    };

    recognition.start();
  };

  const filteredOrders = orders.filter(o => 
    o.inv.toLowerCase().includes(searchTerm.toLowerCase()) ||
    o.custName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Cards */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-orange-600" />
            <span>Sales Invoicing &amp; GST POS Billing</span>
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Generate compliant B2B/B2C tax invoices with customer dropdowns, HSN codes, and instant E-way bill generation.
          </p>
          {aiError && <p className="text-xs text-rose-500 mt-1 font-bold">{aiError}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input 
            type="file" 
            accept="image/*" 
            ref={fileInputRef} 
            onChange={handleOcrUpload} 
            className="hidden" 
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessingAI}
            className="px-3 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg font-bold text-xs transition flex items-center gap-1.5"
          >
            {isProcessingAI ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            <span className="hidden sm:inline">Scan Receipt</span>
          </button>
          
          <button
            onClick={handleVoiceCommand}
            disabled={isProcessingAI || isListening}
            className={`px-3 py-2 ${isListening ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-purple-50 text-purple-700 hover:bg-purple-100'} rounded-lg font-bold text-xs transition flex items-center gap-1.5`}
          >
            {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            <span className="hidden sm:inline">{isListening ? 'Listening...' : 'Voice Invoice'}</span>
          </button>

          <button
            onClick={() => setShowNewModal(true)}
            disabled={isProcessingAI}
            className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs shadow transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Invoice</span>
          </button>
        </div>
      </div>

      {/* Search & Stats Filter */}
      <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search invoices by customer or invoice #..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs"
          />
        </div>
        <div className="text-xs text-slate-500 dark:text-slate-400 font-bold">
          Total Invoices: <span className="text-slate-900 dark:text-slate-100 font-black">{filteredOrders.length}</span>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
        <table className="w-full text-xs text-left border-collapse">
          <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-700 font-bold text-[10px]">
            <tr>
              <th className="p-3">Invoice #</th>
              <th className="p-3">Date</th>
              <th className="p-3">Customer / Party Name</th>
              <th className="p-3">Payment Mode</th>
              <th className="p-3 text-right">Taxable Subtotal</th>
              <th className="p-3 text-right">Tax (GST)</th>
              <th className="p-3 text-right">Total Amount</th>
              <th className="p-3 text-center">Status</th>
              <th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-slate-50 dark:bg-slate-800">
                <td className="p-3 font-mono font-bold text-orange-600">{order.inv}</td>
                <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{order.date}</td>
                <td className="p-3">
                  <div className="font-bold text-slate-900 dark:text-slate-100">{order.custName}</div>
                  <div className="text-[10px] text-slate-400 font-mono">{order.customerNtnGst || order.contact}</div>
                </td>
                <td className="p-3 text-slate-700 dark:text-slate-300 font-medium">{order.paymentMode || 'Cash'}</td>
                <td className="p-3 text-right font-semibold text-slate-800 dark:text-slate-200">
                  {settings.currency} {(order.subtotal || order.amount * 0.85).toFixed(2)}
                </td>
                <td className="p-3 text-right font-semibold text-emerald-600">
                  {settings.currency} {(order.totalTax || order.amount * 0.15).toFixed(2)}
                </td>
                <td className="p-3 text-right font-black text-slate-900 dark:text-slate-100">
                  {settings.currency} {order.amount.toFixed(2)}
                </td>
                <td className="p-3 text-center">
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    order.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {order.status}
                  </span>
                </td>
                <td className="p-3 text-right">
                  <div className="flex justify-end items-center gap-1">
                    <button
                      type="button"
                      onClick={() => printSalesInvoice(order, settings)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded font-bold text-[10px] flex items-center gap-1 transition cursor-pointer"
                      title="Print Invoice Slip"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Print</span>
                    </button>
                    <RowActionsMenu
                      actions={[
                        {
                          label: 'Print Tax Invoice',
                          icon: <Printer className="w-3.5 h-3.5" />,
                          onClick: () => printSalesInvoice(order, settings),
                          variant: 'default',
                        },
                        {
                          label: 'Generate E-Way Bill',
                          icon: <Truck className="w-3.5 h-3.5 text-purple-600" />,
                          onClick: () => onOpenEwayModal(order),
                          variant: 'primary',
                        },
                        {
                          label: 'WhatsApp Dispatch',
                          icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />,
                          onClick: () => {
                            const msg = encodeURIComponent(
                              `Dear ${order.custName}, your Posvibe Tax Invoice #${order.inv} for ${settings.currency} ${order.amount.toFixed(
                                2
                              )} is generated. Thank you!`
                            );
                            window.open(`https://wa.me/?text=${msg}`, '_blank');
                          },
                          variant: 'success',
                        },
                        {
                          label: 'Duplicate Invoice',
                          icon: <Copy className="w-3.5 h-3.5" />,
                          onClick: () => {
                            const dup: SalesInvoice = {
                              ...order,
                              id: `inv-${Date.now()}`,
                              inv: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
                              date: new Date().toISOString().split('T')[0],
                            };
                            onSaveInvoice(dup);
                            alert(`Invoice #${order.inv} duplicated as #${dup.inv}`);
                          },
                          variant: 'default',
                        },
                        {
                          label: 'View Invoice Breakdown',
                          icon: <Eye className="w-3.5 h-3.5" />,
                          onClick: () => {
                            alert(
                              `Invoice: ${order.inv}\nCustomer: ${order.custName}\nTotal Amount: ${settings.currency} ${order.amount.toFixed(
                                2
                              )}\nItems: ${order.items?.length || 1}\nTax: ${settings.currency} ${(order.totalTax || 0).toFixed(
                                2
                              )}`
                            );
                          },
                          variant: 'default',
                        },
                        ...(onDeleteOrder ? [{
                          label: 'Delete Invoice',
                          icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
                          onClick: () => onDeleteOrder(order.id),
                          variant: 'danger' as const,
                        }] : []),
                      ]}
                    />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create New Invoice Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl max-w-4xl w-full p-6 border border-slate-200 dark:border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-700 mb-4">
              <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-orange-600" />
                <span>Create GST / Tax Sales Invoice</span>
              </h3>
              <button onClick={() => setShowNewModal(false)} className="text-slate-400 hover:text-slate-600 dark:text-slate-400 font-bold">✕</button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              {/* Customer Drop-down selection */}
              <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Select Customer (From Existing List) *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.category}) - {c.contact}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Invoice Date</label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">Payment Mode</label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value as any)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 font-semibold"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer (Direct)</option>
                    <option value="Credit / Pay Later">Credit / Pay Later</option>
                    <option value="Digital Wallet">Customer Digital Wallet</option>
                  </select>
                </div>
              </div>

              {/* Line Items Table */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <h4 className="font-bold text-slate-800 dark:text-slate-200 text-xs">Invoice Items &amp; Medicine Details</h4>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="px-3 py-1 bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Item</span>
                  </button>
                </div>

                <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-[10px] uppercase">
                      <tr>
                        <th className="p-2 text-left">Item / Medicine (From Stock)</th>
                        <th className="p-2 text-left">Batch #</th>
                        <th className="p-2 text-left">HSN Code</th>
                        <th className="p-2 text-right">Qty</th>
                        <th className="p-2 text-right">Unit Price</th>
                        <th className="p-2 text-right">Tax %</th>
                        <th className="p-2 text-right">Total ({settings.currency})</th>
                        <th className="p-2 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {items.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-slate-50 dark:bg-slate-800">
                          <td className="p-2">
                            <select
                              value={item.name}
                              onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                              className="w-full px-2 py-1 border rounded bg-white dark:bg-slate-900 font-medium"
                            >
                              {inventory.map(i => (
                                <option key={i.id} value={i.name}>{i.name} (Stock: {i.stock})</option>
                              ))}
                            </select>
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.batch || ''}
                              onChange={(e) => handleItemChange(idx, 'batch', e.target.value)}
                              className="w-20 px-2 py-1 border rounded font-mono text-[11px]"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="text"
                              value={item.hsnCode || ''}
                              onChange={(e) => handleItemChange(idx, 'hsnCode', e.target.value)}
                              className="w-24 px-2 py-1 border rounded font-mono text-[11px]"
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="1"
                              value={item.qty}
                              onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value) || 0)}
                              className="w-16 px-2 py-1 border rounded text-right font-bold"
                              required
                            />
                          </td>
                          <td className="p-2">
                            <input
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.price}
                              onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border rounded text-right"
                              required
                            />
                          </td>
                          <td className="p-2">
                            <select
                              value={item.taxPercent}
                              onChange={(e) => handleItemChange(idx, 'taxPercent', parseFloat(e.target.value))}
                              className="w-16 px-2 py-1 border rounded text-right bg-white dark:bg-slate-900 font-bold text-emerald-600"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="12">12%</option>
                              <option value="18">18%</option>
                            </select>
                          </td>
                          <td className="p-2 text-right font-black text-slate-900 dark:text-slate-100">
                            {(item.total || item.amount || 0).toFixed(2)}
                          </td>
                          <td className="p-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="text-rose-500 hover:text-rose-700"
                            >
                              <Trash2 className="w-4 h-4 mx-auto" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Tax & E-Way Bill Controls */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <h5 className="font-bold text-slate-800 dark:text-slate-200 text-[11px] uppercase">Statutory Compliance &amp; Logistics</h5>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={applyTcs}
                      onChange={(e) => setApplyTcs(e.target.checked)}
                      className="rounded text-emerald-600"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Apply TCS under Section 206C(1H) (0.1%)</span>
                  </label>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Transport Vehicle No (For E-Way Bill)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LES-2024 (Auto generates E-way bill if >= Rs 50k)"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg uppercase font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-1.5 text-right">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Taxable Subtotal:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{settings.currency} {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>CGST (50%):</span>
                    <span className="font-semibold text-emerald-600">{settings.currency} {cgst.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>SGST (50%):</span>
                    <span className="font-semibold text-emerald-600">{settings.currency} {sgst.toFixed(2)}</span>
                  </div>
                  {applyTcs && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>TCS (0.1%):</span>
                      <span>+{settings.currency} {tcsAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm font-black text-slate-900 dark:text-slate-100 pt-2 border-t border-slate-200 dark:border-slate-700">
                    <span>Grand Total:</span>
                    <span className="text-orange-600">{settings.currency} {grandTotal.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end space-x-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold text-xs shadow"
                >
                  Confirm &amp; Generate Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
