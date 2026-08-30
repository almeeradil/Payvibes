import React, { useState, useRef } from 'react';
import { 
  ShoppingCart, 
  Plus, 
  Printer, 
  FileText, 
  Trash2, 
  CheckCircle2, 
  Truck, 
  Search,
  Camera,
  Mic,
  Loader2,
  Copy,
  MessageSquare,
  Eye,
  Pill,
  Zap,
  Sparkles,
  CheckSquare,
  Layers,
  Package,
  ShieldAlert,
  Users,
  Building2,
  Receipt,
  Filter,
  Calendar,
  X,
  RotateCcw
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

interface BatchItemConfig {
  selected: boolean;
  qty: number;
  bonusQty: number;
  discount: number;
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
  const [activeViewMode, setActiveViewMode] = useState<'all_invoices' | 'customer_hub'>('customer_hub');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showBatchPickerModal, setShowBatchPickerModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCustomer, setFilterCustomer] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'Paid' | 'Unpaid'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedHubCustomerId, setSelectedHubCustomerId] = useState(customers[0]?.id || '');

  // AI OCR & Voice State
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [aiError, setAiError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Invoice creation form state
  const [selectedCustomerId, setSelectedCustomerId] = useState(customers[0]?.id || '');
  const [paymentMode, setPaymentMode] = useState<'Cash' | 'Credit / Pay Later' | 'Bank Transfer' | 'Digital Wallet' | 'Split'>('Credit / Pay Later');
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceDueDate, setInvoiceDueDate] = useState('');
  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: 'item-1',
      name: inventory[0]?.name || 'Augmentin 625mg Tablet',
      qty: 10,
      bonusQty: 1,
      price: inventory[0]?.price || inventory[0]?.salePrice || 350,
      taxPercent: 5,
      hsnCode: inventory[0]?.hsnCode || '3004.1000',
      batch: inventory[0]?.batch || 'B-9801',
      expiryDate: inventory[0]?.expiryDate || inventory[0]?.expiry || '2027-08-30',
      packSize: '10x10 Strips',
      discount: 100,
      total: ((inventory[0]?.price || 350) * 10 - 100) * 1.05,
    },
    {
      id: 'item-2',
      name: inventory[1]?.name || 'Panadol Extra Tablet',
      qty: 50,
      bonusQty: 5,
      price: inventory[1]?.price || inventory[1]?.salePrice || 55,
      taxPercent: 5,
      hsnCode: inventory[1]?.hsnCode || '3004.9090',
      batch: inventory[1]?.batch || 'B-4412',
      expiryDate: inventory[1]?.expiryDate || inventory[1]?.expiry || '2028-02-15',
      packSize: 'Box of 200',
      discount: 50,
      total: ((inventory[1]?.price || 55) * 50 - 50) * 1.05,
    }
  ]);

  const [applyTcs, setApplyTcs] = useState(false);
  const [vehicleNumber, setVehicleNumber] = useState('');

  // Batch Picker state
  const [pickerSearchTerm, setPickerSearchTerm] = useState('');
  const [selectedBatchItems, setSelectedBatchItems] = useState<Record<string, { selected: boolean; qty: number; bonusQty: number; discount: number }>>({});

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId) || customers[0];
  const hubCustomer = customers.find(c => c.id === selectedHubCustomerId) || customers[0];

  // Invoice Totals Calculation
  const subtotal = items.reduce((sum, item) => sum + (item.qty * (item.price || 0)) - (item.discount || 0), 0);
  const totalTax = items.reduce((sum, item) => {
    const taxable = (item.qty * (item.price || 0)) - (item.discount || 0);
    return sum + (taxable * ((item.taxPercent || 0) / 100));
  }, 0);
  const cgst = totalTax / 2;
  const sgst = totalTax / 2;
  const tcsAmount = applyTcs ? (subtotal * 0.001) : 0;
  const grandTotal = subtotal + totalTax + tcsAmount;
  const totalFreeBonusUnits = items.reduce((sum, it) => sum + (it.bonusQty || 0), 0);

  // Handlers for Invoice Items
  const handleAddItem = () => {
    const defaultInv = inventory[items.length % inventory.length] || inventory[0];
    const newItem: InvoiceItem = {
      id: 'item-' + Math.random().toString(36).substr(2, 7),
      name: defaultInv?.name || 'New Medicine',
      qty: 10,
      bonusQty: 0,
      price: defaultInv?.salePrice || defaultInv?.price || 100,
      taxPercent: 5,
      hsnCode: defaultInv?.hsnCode || defaultInv?.hsCode || '3004.9090',
      batch: defaultInv?.batch || 'BT-' + Math.floor(1000 + Math.random() * 9000),
      expiryDate: defaultInv?.expiryDate || defaultInv?.expiry || '2027-12-31',
      packSize: defaultInv?.unit || 'Box',
      discount: 0,
      total: (defaultInv?.salePrice || defaultInv?.price || 100) * 10 * 1.05,
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleAddMultipleRows = (count: number) => {
    const newRows: InvoiceItem[] = [];
    for (let i = 0; i < count; i++) {
      const invMatch = inventory[(items.length + i) % inventory.length] || inventory[0];
      const price = invMatch?.salePrice || invMatch?.price || 100;
      newRows.push({
        id: 'item-' + Math.random().toString(36).substr(2, 7) + '-' + i,
        name: invMatch?.name || 'Medicine ' + (items.length + i + 1),
        qty: 10,
        bonusQty: 0,
        price,
        taxPercent: 5,
        hsnCode: invMatch?.hsnCode || invMatch?.hsCode || '3004.9090',
        batch: invMatch?.batch || 'BT-' + Math.floor(1000 + Math.random() * 9000),
        expiryDate: invMatch?.expiryDate || invMatch?.expiry || '2027-12-31',
        packSize: invMatch?.unit || 'Box',
        discount: 0,
        total: price * 10 * 1.05,
      });
    }
    setItems(prev => [...prev, ...newRows]);
  };

  const handleOpenInvoiceWithTenRows = () => {
    const newRows: InvoiceItem[] = [];
    for (let i = 0; i < 10; i++) {
      const invMatch = inventory[i % inventory.length] || inventory[0];
      const price = invMatch?.salePrice || invMatch?.price || 100;
      newRows.push({
        id: 'item-' + Math.random().toString(36).substr(2, 7) + '-' + i,
        name: invMatch?.name || 'Medicine ' + (i + 1),
        qty: 10,
        bonusQty: 0,
        price,
        taxPercent: 5,
        hsnCode: invMatch?.hsnCode || invMatch?.hsCode || '3004.9090',
        batch: invMatch?.batch || 'BT-' + Math.floor(1000 + Math.random() * 9000),
        expiryDate: invMatch?.expiryDate || invMatch?.expiry || '2027-12-31',
        packSize: invMatch?.unit || 'Box',
        discount: 0,
        total: price * 10 * 1.05,
      });
    }
    setItems(newRows);
    setSelectedCustomerId(hubCustomer?.id || customers[0]?.id);
    setShowNewModal(true);
  };

  const handleRemoveItem = (idx: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== idx));
  };

  const handleItemChange = (idx: number, field: keyof InvoiceItem, val: any) => {
    const updated = [...items];
    const current = { ...updated[idx], [field]: val };
    
    // If medicine name changed from inventory dropdown, autofill price, batch, expiry, hsn
    if (field === 'name') {
      const invMatch = inventory.find(i => i.name === val);
      if (invMatch) {
        current.price = invMatch.salePrice || invMatch.price || 100;
        current.hsnCode = invMatch.hsnCode || invMatch.hsCode || '3004.9090';
        current.batch = invMatch.batch;
        current.expiryDate = invMatch.expiryDate || invMatch.expiry || '2027-12-31';
        current.unit = invMatch.unit || 'Boxes';
      }
    }

    const price = current.price || current.rate || 0;
    const taxPct = current.taxPercent || current.taxPct || 0;
    const taxable = (current.qty * price) - (current.discount || 0);
    current.total = taxable + (taxable * (taxPct / 100));
    updated[idx] = current;
    setItems(updated);
  };

  // Quick Load Presets for Customer
  const handleLoadCustomerPresets = (customerObj: Customer) => {
    // Pick 4-6 medicines from inventory to form a rich multi-medicine invoice
    const sampleMeds = inventory.slice(0, 6);
    if (sampleMeds.length === 0) return;

    const presetItems: InvoiceItem[] = sampleMeds.map((med, i) => {
      const qty = (i + 1) * 10;
      const bonusQty = Math.floor(qty / 10);
      const price = med.salePrice || med.price || 150;
      const discount = i * 20;
      const taxable = (qty * price) - discount;
      return {
        id: 'preset-' + Math.random().toString(36).substr(2, 7),
        name: med.name,
        batch: med.batch || `B-880${i+1}`,
        expiryDate: med.expiryDate || med.expiry || '2027-10-31',
        packSize: med.unit || 'Boxes',
        qty,
        bonusQty,
        price,
        taxPercent: 5,
        hsnCode: med.hsnCode || med.hsCode || '3004.9090',
        discount,
        total: taxable * 1.05,
      };
    });

    setItems(presetItems);
    setSelectedCustomerId(customerObj.id);
  };

  // Batch Picker confirm
  const handleApplyBatchPicker = () => {
    const newItems: InvoiceItem[] = [];
    (Object.entries(selectedBatchItems) as [string, BatchItemConfig][]).forEach(([invId, config]) => {
      if (config.selected && config.qty > 0) {
        const invItem = inventory.find(i => i.id === invId);
        if (invItem) {
          const price = invItem.salePrice || invItem.price || 100;
          const taxable = (config.qty * price) - (config.discount || 0);
          newItems.push({
            id: 'batch-' + Math.random().toString(36).substr(2, 7),
            name: invItem.name,
            batch: invItem.batch || 'BT-900',
            expiryDate: invItem.expiryDate || invItem.expiry || '2027-12-31',
            packSize: invItem.unit || 'Box',
            qty: config.qty,
            bonusQty: config.bonusQty || 0,
            price,
            taxPercent: 5,
            hsnCode: invItem.hsnCode || invItem.hsCode || '3004.9090',
            discount: config.discount || 0,
            total: taxable * 1.05,
          });
        }
      }
    });

    if (newItems.length > 0) {
      setItems(newItems);
      setShowBatchPickerModal(false);
      setShowNewModal(true);
    } else {
      alert("Please check at least one medicine and specify quantity.");
    }
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
      alert("Please add at least one medicine to the invoice.");
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.name || !item.qty || item.qty <= 0 || !item.price || item.price <= 0) {
        alert(`Please fill in valid medicine name, quantity, and price for line item #${i + 1}.`);
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
      custAddress: selectedCustomer.address,
      custNtnCnic: selectedCustomer.ntnCnic || selectedCustomer.ntnGst,
      custProvince: selectedCustomer.province || 'Punjab',
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
      irn: 'IRN-MZ-DIST-' + Math.floor(100000 + Math.random() * 900000),
    };

    onSaveInvoice(newInvoice);
    setShowNewModal(false);
  };
  
  // OCR Scan Handler
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
              name: item.name || 'Extracted Medicine',
              qty: item.qty || 10,
              bonusQty: 1,
              price: item.rate || 100,
              taxPercent: 5,
              hsnCode: '3004.9090',
              batch: 'OCR-BATCH',
              expiryDate: '2027-12-31',
              packSize: 'Box',
              discount: 0,
              total: (item.qty || 10) * (item.rate || 100) * 1.05,
            }));
            setItems(newItems);
          }
          
          setShowNewModal(true);
        } catch (err: any) {
          setAiError(err.message || 'Error processing OCR scan');
        } finally {
          setIsProcessingAI(false);
          if (fileInputRef.current) fileInputRef.current.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      setIsProcessingAI(false);
      setAiError('Failed to read document');
    }
  };

  // Voice Command Handler
  const handleVoiceCommand = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser.");
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
          qty: result.qty || 10,
          bonusQty: 0,
          price: result.rate || 150,
          taxPercent: 5,
          hsnCode: '3004.9090',
          batch: 'VOICE-BT',
          expiryDate: '2027-12-31',
          packSize: 'Pack',
          discount: 0,
          total: (result.qty || 10) * (result.rate || 150) * 1.05,
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

  // Multi-Filter Search logic for Sales Tax Invoices
  const filteredOrders = orders.filter(o => {
    // 1. Search text filter (Invoice #, Customer name, or Medicine items)
    const searchLower = searchTerm.toLowerCase().trim();
    const matchesSearch = !searchLower ||
      o.inv.toLowerCase().includes(searchLower) ||
      o.custName.toLowerCase().includes(searchLower) ||
      (o.items && o.items.some(i => (i.prodName || i.name || '').toLowerCase().includes(searchLower)));

    // 2. Customer name filter
    const matchesCustomer = filterCustomer === 'all' || 
      o.custName.toLowerCase() === filterCustomer.toLowerCase();

    // 3. Invoice status filter (Paid / Unpaid)
    const matchesStatus = filterStatus === 'all' ||
      (filterStatus === 'Paid' && o.status === 'Paid') ||
      (filterStatus === 'Unpaid' && o.status !== 'Paid');

    // 4. Date range filter
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && o.date >= startDate;
    }
    if (endDate) {
      matchesDate = matchesDate && o.date <= endDate;
    }

    return matchesSearch && matchesCustomer && matchesStatus && matchesDate;
  });

  const isFilterActive = searchTerm !== '' || filterCustomer !== 'all' || filterStatus !== 'all' || startDate !== '' || endDate !== '';

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterCustomer('all');
    setFilterStatus('all');
    setStartDate('');
    setEndDate('');
  };

  const customerHubOrders = orders.filter(o => 
    hubCustomer && o.custName.toLowerCase() === hubCustomer.name.toLowerCase()
  );

  return (
    <div className="space-y-6">
      {/* Feature Header Card */}
      <div className="bg-gradient-to-r from-sky-900 via-slate-900 to-indigo-900 text-white p-5 rounded-2xl shadow-md border border-sky-700/40 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-sky-500/30 text-sky-200 border border-sky-400/30 flex items-center gap-1">
              <Pill className="w-3 h-3 text-sky-300" />
              <span>MZ Medicine Smart Distribution</span>
            </span>
            <span className="text-emerald-400 text-xs font-bold flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Multi-Item Pharma Invoicing Enabled
            </span>
          </div>
          <h3 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>Customer Multi-Medicine Sales &amp; Distribution Invoicing</span>
          </h3>
          <p className="text-xs text-sky-100/80 max-w-2xl">
            Create single consolidated invoices for a customer with multiple medicines, batch numbers, expiry tracking, free scheme bonus units, and statutory tax compliance.
          </p>
          {aiError && <p className="text-xs text-rose-300 font-bold bg-rose-900/50 p-1.5 rounded border border-rose-500/50">{aiError}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleOpenInvoiceWithTenRows}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-black text-xs shadow-lg shadow-orange-500/20 transition flex items-center gap-2 cursor-pointer ring-2 ring-amber-300/40"
            title="Open Invoice Pre-loaded with 10 Medicine Rows"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>➕ Add 10 Medicine Rows Invoice</span>
          </button>

          <button
            onClick={() => {
              handleLoadCustomerPresets(hubCustomer);
              setShowNewModal(true);
            }}
            className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-extrabold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
            title="Load Customer's Favorite Medicines"
          >
            <Zap className="w-4 h-4 text-yellow-300" />
            <span>Load Customer Presets</span>
          </button>

          <button
            onClick={() => {
              // Pre-initialize batch picker state
              const initialBatch: Record<string, { selected: boolean; qty: number; bonusQty: number; discount: number }> = {};
              inventory.forEach(inv => {
                initialBatch[inv.id] = { selected: false, qty: 10, bonusQty: 1, discount: 0 };
              });
              setSelectedBatchItems(initialBatch);
              setShowBatchPickerModal(true);
            }}
            className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <CheckSquare className="w-4 h-4 text-indigo-200" />
            <span>Batch Multi-Select Picker</span>
          </button>

          <button
            onClick={() => {
              setSelectedCustomerId(hubCustomer.id);
              setShowNewModal(true);
            }}
            className="px-4 py-2 bg-sky-500 hover:bg-sky-400 text-white rounded-xl font-extrabold text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Customer Invoice</span>
          </button>
        </div>
      </div>

      {/* Quick Guide: How to add 10+ medicines for a customer */}
      <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800/80 p-4 rounded-xl text-amber-950 dark:text-amber-200 text-xs shadow-xs space-y-2">
        <div className="flex items-center justify-between font-extrabold text-sm">
          <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>یک ہی کسٹمر کی 10 (یا زائد) ادویات ایک ساتھ انوائس میں شامل کرنے کا آسان طریقہ:</span>
          </div>
          <span className="px-2.5 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100 rounded-full text-[10px] uppercase font-black">
            Direct 1-Click Action
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1 text-[11px]">
          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 space-y-1">
            <div className="font-extrabold text-indigo-600 dark:text-indigo-400 flex items-center gap-1">
              <CheckSquare className="w-3.5 h-3.5" />
              <span>1. Batch Multi-Select Picker (سب سے تیز)</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              اوپر <strong>"Batch Multi-Select Picker"</strong> بٹن پر کلک کریں۔ جتنی میڈیسنز چاہیں (10 یا 20) ان پر ٹک لگائیں اور ایک کلک میں کسٹمر کی انوائس میں شامل کر دیں۔
            </p>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 space-y-1">
            <div className="font-extrabold text-sky-600 dark:text-sky-400 flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" />
              <span>2. "+ Add Medicine Rows" 10 Rows Direct</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              برائے راست 10 ادویات والی انوائس کھولنے کے لیے نیچے بٹن پر کلک کریں:
            </p>
            <button
              onClick={handleOpenInvoiceWithTenRows}
              className="w-full py-1.5 px-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-lg text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>👉 Click Here: Open Invoice with 10 Rows</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 p-2.5 rounded-lg border border-amber-200 dark:border-amber-900 space-y-1">
            <div className="font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" />
              <span>3. Load Customer Presets</span>
            </div>
            <p className="text-slate-600 dark:text-slate-400">
              سبز <strong>"Load Customer Presets"</strong> بٹن پر کلک کریں۔ یہ کسٹمر کے لیے خودکار طریقے سے 6 سے 10 ادویات کی لسٹ انوائس میں لوڈ کر دے گا۔
            </p>
          </div>
        </div>
      </div>

      {/* Mode View Switcher & Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveViewMode('customer_hub')}
            className={`px-4 py-2 rounded-lg font-extrabold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeViewMode === 'customer_hub'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-4 h-4" />
            <span>Customer Distribution Hub</span>
          </button>

          <button
            onClick={() => setActiveViewMode('all_invoices')}
            className={`px-4 py-2 rounded-lg font-extrabold text-xs transition flex items-center gap-2 cursor-pointer ${
              activeViewMode === 'all_invoices'
                ? 'bg-sky-600 text-white shadow-xs'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>All Sales Invoices ({orders.length})</span>
          </button>
        </div>

        {/* OCR & Voice Action Quick Bar */}
        <div className="flex items-center gap-2">
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
            className="px-3 py-1.5 bg-sky-50 text-sky-700 hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-300 rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            {isProcessingAI ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
            <span>OCR Scan Paper Slip</span>
          </button>

          <button
            onClick={handleVoiceCommand}
            disabled={isProcessingAI || isListening}
            className={`px-3 py-1.5 ${isListening ? 'bg-red-100 text-red-700 animate-pulse' : 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-950/40 dark:text-purple-300'} rounded-lg font-bold text-xs transition flex items-center gap-1.5 cursor-pointer`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isListening ? 'Listening...' : 'Voice Order'}</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: CUSTOMER DISTRIBUTION HUB */}
      {activeViewMode === 'customer_hub' && (
        <div className="space-y-6">
          {/* Customer Selection Card */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
            <div>
              <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                Select Pharmacy / Customer Account
              </label>
              <select
                value={selectedHubCustomerId}
                onChange={(e) => setSelectedHubCustomerId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl font-bold text-slate-900 dark:text-slate-100 text-sm focus:ring-2 focus:ring-sky-500"
              >
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.category}) - DL: {c.drugLicenseNo || 'DL-LHR-2024'}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Details Badge */}
            {hubCustomer && (
              <div className="md:col-span-2 bg-slate-50 dark:bg-slate-800/80 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm">{hubCustomer.name}</h4>
                    <span className="px-2 py-0.5 bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300 rounded font-bold text-[10px]">
                      {hubCustomer.category}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap gap-x-4 gap-y-1">
                    <span>Contact: <strong className="text-slate-700 dark:text-slate-200">{hubCustomer.contact}</strong></span>
                    <span>Owner: <strong>{hubCustomer.owner || 'N/A'}</strong></span>
                    <span>Drug License: <strong className="text-sky-600 font-mono">{hubCustomer.drugLicenseNo || 'DL-LHR-2024-8891'}</strong></span>
                    <span>Address: {hubCustomer.address}</span>
                  </div>
                </div>

                <div className="text-right border-l pl-4 border-slate-200 dark:border-slate-700">
                  <div className="text-[10px] uppercase font-bold text-slate-400">Ledger Balance</div>
                  <div className="text-base font-black text-slate-900 dark:text-slate-100">
                    {settings.currency} {(hubCustomer.balance || 0).toFixed(2)}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold">
                    Credit Limit: {settings.currency} {(hubCustomer.creditLimit || 150000).toLocaleString()}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Customer's Multi-Medicine Invoices Section */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                  <Pill className="w-4 h-4 text-sky-600" />
                  <span>Multi-Medicine Invoices for {hubCustomer?.name}</span>
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Total {customerHubOrders.length} multi-medicine sales invoice(s) generated for this customer.
                </p>
              </div>

              <button
                onClick={() => {
                  handleLoadCustomerPresets(hubCustomer);
                  setShowNewModal(true);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Multi-Medicine Invoice</span>
              </button>
            </div>

            {customerHubOrders.length === 0 ? (
              <div className="p-10 text-center text-slate-400 space-y-3">
                <Pill className="w-10 h-10 mx-auto text-slate-300" />
                <p className="text-xs font-semibold">No multi-medicine invoices found for {hubCustomer?.name} yet.</p>
                <button
                  onClick={() => {
                    handleLoadCustomerPresets(hubCustomer);
                    setShowNewModal(true);
                  }}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg text-xs font-bold"
                >
                  Create First Multi-Medicine Invoice
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {customerHubOrders.map(order => {
                  const itemCount = order.items?.length || 1;
                  const totalSchemeUnits = (order.items || []).reduce((acc, it) => acc + (it.bonusQty || 0), 0);

                  return (
                    <div key={order.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-wrap items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-black text-sky-600 text-sm">{order.inv}</span>
                          <span className="text-xs font-semibold text-slate-500">{order.date}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            order.status === 'Paid' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                          }`}>
                            {order.status}
                          </span>
                          <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded text-[10px] font-bold">
                            {order.paymentMode || 'Credit'}
                          </span>
                        </div>

                        {/* Line items pills preview */}
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 text-[10px] font-extrabold rounded border border-sky-200 dark:border-sky-800">
                            {itemCount} Medicine Items Included
                          </span>
                          {totalSchemeUnits > 0 && (
                            <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-[10px] font-extrabold rounded border border-emerald-200">
                              +{totalSchemeUnits} Bonus Free Scheme Units
                            </span>
                          )}
                          <div className="text-xs text-slate-600 dark:text-slate-300 font-medium pl-1">
                            {order.items?.map(i => i.prodName || i.name).slice(0, 4).join(', ')}
                            {(order.items?.length || 0) > 4 ? ` +${(order.items?.length || 0) - 4} more` : ''}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-base font-black text-slate-900 dark:text-slate-100">
                            {settings.currency} {order.amount.toFixed(2)}
                          </div>
                          <div className="text-[10px] text-slate-400">
                            GST: {settings.currency} {(order.totalTax || 0).toFixed(2)}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => printSalesInvoice(order, settings)}
                            className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Printer className="w-3.5 h-3.5" />
                            <span>Print MZ Slip</span>
                          </button>
                          
                          <RowActionsMenu
                            actions={[
                              {
                                label: 'Print MZ Pharma Slip',
                                icon: <Printer className="w-3.5 h-3.5 text-sky-600" />,
                                onClick: () => printSalesInvoice(order, settings),
                                variant: 'primary',
                              },
                              {
                                label: 'Generate E-Way Bill',
                                icon: <Truck className="w-3.5 h-3.5 text-purple-600" />,
                                onClick: () => onOpenEwayModal(order),
                                variant: 'default',
                              },
                              {
                                label: 'WhatsApp Dispatch',
                                icon: <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />,
                                onClick: () => {
                                  const msg = encodeURIComponent(
                                    `Dear ${order.custName}, your MZ Medicine Smart Distribution Tax Invoice #${order.inv} for ${settings.currency} ${order.amount.toFixed(
                                      2
                                    )} containing ${order.items?.length || 1} medicine items has been generated. Thank you!`
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
                              ...(onDeleteOrder ? [{
                                label: 'Delete Invoice',
                                icon: <Trash2 className="w-3.5 h-3.5 text-rose-600" />,
                                onClick: () => onDeleteOrder(order.id),
                                variant: 'danger' as const,
                              }] : []),
                            ]}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 2: ALL SALES INVOICES TABLE */}
      {activeViewMode === 'all_invoices' && (
        <div className="space-y-4">
          {/* Multi-Filter Search Control Panel */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-xs space-y-4">
            {/* Header & Reset Button */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-100 dark:bg-sky-950 text-sky-600 dark:text-sky-400 rounded-xl">
                  <Filter className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-black text-slate-900 dark:text-slate-100 text-sm flex items-center gap-2">
                    <span>Sales Tax Invoices Multi-Filter</span>
                    {isFilterActive && (
                      <span className="px-2.5 py-0.5 bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 rounded-full text-[10px] font-black uppercase tracking-wider">
                        Filter Active
                      </span>
                    )}
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Filter by date range, customer name, status (Paid/Unpaid), or keyword search.
                  </p>
                </div>
              </div>

              {isFilterActive && (
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Filters</span>
                </button>
              )}
            </div>

            {/* Filter Inputs Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {/* 1. Keyword Search */}
              <div className="space-y-1 sm:col-span-2 md:col-span-1 lg:col-span-2">
                <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Search className="w-3 h-3 text-sky-600" />
                  <span>Keyword / Invoice # Search</span>
                </label>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search invoice #, customer or item..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-8 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 transition"
                  />
                  {searchTerm && (
                    <button
                      type="button"
                      onClick={() => setSearchTerm('')}
                      className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. Customer Name Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Users className="w-3 h-3 text-indigo-600" />
                  <span>Filter Customer Name</span>
                </label>
                <select
                  value={filterCustomer}
                  onChange={(e) => setFilterCustomer(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="all">All Customers ({customers.length})</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.name}>{c.name}</option>
                  ))}
                </select>
              </div>

              {/* 3. Invoice Status Filter */}
              <div className="space-y-1">
                <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>Invoice Status</span>
                </label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as 'all' | 'Paid' | 'Unpaid')}
                  className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 cursor-pointer"
                >
                  <option value="all">All Statuses (Paid &amp; Unpaid)</option>
                  <option value="Paid">🟢 Paid Invoices Only</option>
                  <option value="Unpaid">🔴 Unpaid / Credit Only</option>
                </select>
              </div>

              {/* 4. Date Range Filters */}
              <div className="space-y-1 sm:col-span-2 md:col-span-1 lg:col-span-1">
                <label className="text-[11px] font-extrabold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-amber-600" />
                  <span>Date Range</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-900 dark:text-slate-100"
                    title="From Start Date"
                  />
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full px-2 py-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-lg text-[11px] font-bold text-slate-900 dark:text-slate-100"
                    title="To End Date"
                  />
                </div>
              </div>
            </div>

            {/* Filter Summary Stats Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950 text-sky-800 dark:text-sky-200 rounded-lg font-extrabold text-[11px] border border-sky-200 dark:border-sky-800">
                  Matching Invoices: <strong>{filteredOrders.length}</strong> of {orders.length}
                </span>
                <span className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-200 rounded-lg font-extrabold text-[11px] border border-emerald-200 dark:border-emerald-800">
                  Paid: <strong>{filteredOrders.filter(o => o.status === 'Paid').length}</strong>
                </span>
                <span className="px-2.5 py-1 bg-rose-50 dark:bg-rose-950 text-rose-800 dark:text-rose-200 rounded-lg font-extrabold text-[11px] border border-rose-200 dark:border-rose-800">
                  Unpaid: <strong>{filteredOrders.filter(o => o.status !== 'Paid').length}</strong>
                </span>
              </div>

              <div className="font-black text-slate-900 dark:text-slate-100 text-xs">
                Total Filtered Value: <span className="text-sky-600 dark:text-sky-400">{settings.currency} {filteredOrders.reduce((acc, o) => acc + (o.amount || 0), 0).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 uppercase border-b border-slate-200 dark:border-slate-800 font-bold text-[10px]">
                <tr>
                  <th className="p-3">Invoice #</th>
                  <th className="p-3">Date</th>
                  <th className="p-3">Customer / Pharmacy</th>
                  <th className="p-3">Items Count</th>
                  <th className="p-3">Payment Mode</th>
                  <th className="p-3 text-right">Taxable Subtotal</th>
                  <th className="p-3 text-right">Tax (GST)</th>
                  <th className="p-3 text-right">Total Amount</th>
                  <th className="p-3 text-center">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-3 font-mono font-bold text-sky-600">{order.inv}</td>
                    <td className="p-3 font-semibold text-slate-600 dark:text-slate-400">{order.date}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900 dark:text-slate-100">{order.custName}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{order.customerNtnGst || order.contact}</div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 bg-sky-50 dark:bg-sky-950 text-sky-700 dark:text-sky-300 font-extrabold rounded text-[10px]">
                        {order.items?.length || 1} Medicines
                      </span>
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
                        >
                          <Printer className="w-3 h-3" />
                          <span>Print</span>
                        </button>
                        <RowActionsMenu
                          actions={[
                            {
                              label: 'Print MZ Pharma Slip',
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
                                  `Dear ${order.custName}, your MZ Medicine Smart Distribution Tax Invoice #${order.inv} for ${settings.currency} ${order.amount.toFixed(
                                    2
                                  )} is generated. Thank you!`
                                );
                                window.open(`https://wa.me/?text=${msg}`, '_blank');
                              },
                              variant: 'success',
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
        </div>
      )}

      {/* CREATE NEW MULTI-MEDICINE INVOICE MODAL */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-5xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-sky-100 dark:bg-sky-950 text-sky-600 rounded-lg">
                  <Pill className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                    Create Multi-Medicine Sales Invoice
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    MZ Medicine Smart Distribution Multi-Item Invoice Builder
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowNewModal(false)} 
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateInvoice} className="space-y-4 text-xs">
              {/* Customer Info Card */}
              <div className="bg-sky-50/70 dark:bg-slate-800/80 p-4 rounded-xl border border-sky-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-black uppercase text-sky-800 dark:text-sky-300 mb-1">
                    Select Customer / Pharmacy *
                  </label>
                  <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500"
                  >
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.category}) - DL: {c.drugLicenseNo || 'DL-LHR-2024'}
                      </option>
                    ))}
                  </select>

                  {selectedCustomer && (
                    <div className="mt-2 text-[10px] text-slate-600 dark:text-slate-300 space-y-0.5">
                      <div>DL #: <strong className="font-mono text-sky-700">{selectedCustomer.drugLicenseNo || 'DL-LHR-2024-8891'}</strong></div>
                      <div>Address: {selectedCustomer.address}</div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                    Invoice Date
                  </label>
                  <input
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg bg-white dark:bg-slate-900 font-medium"
                    required
                  />

                  <div className="mt-2">
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full px-3 py-1.5 border rounded-lg bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200"
                    >
                      <option value="Credit / Pay Later">Credit / Pay Later (Pharma Ledger)</option>
                      <option value="Cash">Cash Settlement</option>
                      <option value="Bank Transfer">Bank Transfer (Direct)</option>
                      <option value="Digital Wallet">Customer Digital Wallet</option>
                    </select>
                  </div>
                </div>

                {/* Presets & Batch Picker Quick Action Box */}
                <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-sky-200 dark:border-slate-700 space-y-2 flex flex-col justify-between">
                  <span className="text-[10px] font-black uppercase text-slate-400">Smart Shortcuts</span>
                  <div className="space-y-1.5">
                    <button
                      type="button"
                      onClick={() => handleLoadCustomerPresets(selectedCustomer)}
                      className="w-full py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 rounded font-extrabold text-[11px] border border-emerald-300 dark:border-emerald-800 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-yellow-500" />
                      <span>Load Frequent Medicines ({selectedCustomer.name})</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const initialBatch: Record<string, { selected: boolean; qty: number; bonusQty: number; discount: number }> = {};
                        inventory.forEach(inv => {
                          initialBatch[inv.id] = { selected: false, qty: 10, bonusQty: 1, discount: 0 };
                        });
                        setSelectedBatchItems(initialBatch);
                        setShowBatchPickerModal(true);
                      }}
                      className="w-full py-1.5 px-2 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 rounded font-extrabold text-[11px] border border-indigo-300 dark:border-indigo-800 flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <CheckSquare className="w-3.5 h-3.5 text-indigo-500" />
                      <span>Open Batch Multi-Select Picker</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Line Items Section */}
              <div className="space-y-2 pt-2">
                <div className="flex flex-wrap justify-between items-center gap-2">
                  <div className="flex items-center gap-2">
                    <h4 className="font-extrabold text-slate-800 dark:text-slate-200 text-xs flex items-center gap-1.5">
                      <Pill className="w-4 h-4 text-sky-600" />
                      <span>Medicine Line Items ({items.length} Medicines Added)</span>
                    </h4>
                    {totalFreeBonusUnits > 0 && (
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded text-[10px]">
                        +{totalFreeBonusUnits} Free Scheme Units
                      </span>
                    )}
                  </div>

                  {/* Multi-Row Add Buttons Header */}
                  <div className="flex flex-wrap gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleAddMultipleRows(5)}
                      className="px-2.5 py-1 bg-sky-50 dark:bg-sky-950/50 hover:bg-sky-100 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800 rounded-lg text-xs font-bold transition cursor-pointer"
                      title="Add 5 medicine rows at once"
                    >
                      + Add 5 Rows
                    </button>

                    <button
                      type="button"
                      onClick={() => handleAddMultipleRows(10)}
                      className="px-2.5 py-1 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-lg text-xs font-black transition cursor-pointer"
                      title="Add 10 medicine rows at once for big pharmacy orders"
                    >
                      ⚡ + Add 10 Rows
                    </button>

                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-3.5 py-1 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer ring-2 ring-sky-500/30"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>+ Add Medicine Row</span>
                    </button>
                  </div>
                </div>

                <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto shadow-xs">
                  <table className="w-full text-xs">
                    <thead className="bg-sky-600 text-white font-black text-[10px] uppercase">
                      <tr>
                        <th className="p-2.5 text-left">#</th>
                        <th className="p-2.5 text-left min-w-[180px]">Medicine / Formulation</th>
                        <th className="p-2.5 text-left min-w-[90px]">Batch #</th>
                        <th className="p-2.5 text-left min-w-[90px]">Expiry</th>
                        <th className="p-2.5 text-right min-w-[65px]">Billed Qty</th>
                        <th className="p-2.5 text-right min-w-[65px]">Bonus Free</th>
                        <th className="p-2.5 text-right min-w-[80px]">Price / Pack</th>
                        <th className="p-2.5 text-right min-w-[65px]">GST %</th>
                        <th className="p-2.5 text-right min-w-[75px]">Disc ({settings.currency})</th>
                        <th className="p-2.5 text-right min-w-[95px]">Total Amount</th>
                        <th className="p-2.5 text-center">Del</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {items.map((item, idx) => {
                        const invMatch = inventory.find(i => i.name === item.name);
                        const isStockLow = invMatch && invMatch.stock < item.qty;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                            <td className="p-2 font-bold text-slate-400 text-center">{idx + 1}</td>
                            <td className="p-2">
                              <select
                                value={item.name}
                                onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                                className="w-full px-2 py-1 border rounded bg-white dark:bg-slate-900 font-bold text-slate-900 dark:text-slate-100 text-xs focus:ring-2 focus:ring-sky-500"
                              >
                                {inventory.map(i => (
                                  <option key={i.id} value={i.name}>
                                    {i.name} (Stock: {i.stock})
                                  </option>
                                ))}
                              </select>
                              {isStockLow && (
                                <div className="text-[9px] text-rose-600 font-bold flex items-center gap-1 mt-0.5">
                                  <ShieldAlert className="w-3 h-3" />
                                  <span>Stock warning: Available {invMatch?.stock}</span>
                                </div>
                              )}
                            </td>
                            <td className="p-2">
                              <input
                                type="text"
                                value={item.batch || ''}
                                onChange={(e) => handleItemChange(idx, 'batch', e.target.value)}
                                className="w-full px-2 py-1 border rounded font-mono text-[11px] font-bold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="date"
                                value={item.expiryDate || '2027-12-31'}
                                onChange={(e) => handleItemChange(idx, 'expiryDate', e.target.value)}
                                className="w-full px-1.5 py-1 border rounded text-[10px]"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="1"
                                value={item.qty}
                                onChange={(e) => handleItemChange(idx, 'qty', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-right font-black text-sky-700 dark:text-sky-300"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.bonusQty || 0}
                                onChange={(e) => handleItemChange(idx, 'bonusQty', parseInt(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-right font-black text-emerald-600"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={item.price}
                                onChange={(e) => handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-right font-medium"
                                required
                              />
                            </td>
                            <td className="p-2">
                              <select
                                value={item.taxPercent || 5}
                                onChange={(e) => handleItemChange(idx, 'taxPercent', parseFloat(e.target.value))}
                                className="w-full px-1 py-1 border rounded text-right font-bold text-emerald-600"
                              >
                                <option value="0">0%</option>
                                <option value="5">5%</option>
                                <option value="12">12%</option>
                                <option value="18">18%</option>
                              </select>
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                min="0"
                                value={item.discount || 0}
                                onChange={(e) => handleItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                                className="w-full px-2 py-1 border rounded text-right text-rose-600 font-bold"
                              />
                            </td>
                            <td className="p-2 text-right font-black text-slate-900 dark:text-slate-100">
                              {(item.total || 0).toFixed(2)}
                            </td>
                            <td className="p-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(idx)}
                                className="text-rose-500 hover:text-rose-700 p-1 cursor-pointer"
                                title="Remove row"
                              >
                                <Trash2 className="w-4 h-4 mx-auto" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Bottom Row Add Control Bar */}
                <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                  <div className="text-xs text-slate-500 font-medium">
                    Need more items for this customer order? Currently {items.length} row(s) added.
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAddMultipleRows(5)}
                      className="px-3 py-1.5 bg-sky-100 hover:bg-sky-200 text-sky-800 dark:bg-sky-950 dark:text-sky-300 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      + Add 5 Rows
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAddMultipleRows(10)}
                      className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200 rounded-lg text-xs font-black transition cursor-pointer"
                    >
                      ⚡ + Add 10 Rows
                    </button>
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="px-4 py-1.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-black flex items-center gap-1.5 shadow-sm transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Add Medicine Row</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Statutory Controls & Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-slate-50 dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
                  <h5 className="font-extrabold text-slate-800 dark:text-slate-200 text-[11px] uppercase tracking-wider">
                    Statutory Compliance &amp; Dispatch Logistics
                  </h5>
                  <label className="flex items-center gap-2 cursor-pointer pt-1">
                    <input
                      type="checkbox"
                      checked={applyTcs}
                      onChange={(e) => setApplyTcs(e.target.checked)}
                      className="rounded text-sky-600"
                    />
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Apply TCS under Section 206C(1H) (0.1%)</span>
                  </label>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-500 dark:text-slate-400 mb-1">
                      Dispatch Transport Vehicle No (For E-Way Bill)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. LES-2024 (Auto E-Way Bill generated if >= Rs 50,000)"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full px-3 py-1.5 border rounded-lg uppercase font-mono font-bold"
                    />
                  </div>
                </div>

                <div className="bg-sky-50/70 dark:bg-slate-800 p-4 rounded-xl border border-sky-200 dark:border-slate-700 space-y-1.5 text-right">
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>Taxable Medicines Subtotal:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">{settings.currency} {subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600 dark:text-slate-400">
                    <span>GST / Sales Tax (Combined):</span>
                    <span className="font-semibold text-emerald-600">+{settings.currency} {totalTax.toFixed(2)}</span>
                  </div>
                  {applyTcs && (
                    <div className="flex justify-between text-emerald-700 font-semibold">
                      <span>TCS (0.1%):</span>
                      <span>+{settings.currency} {tcsAmount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-base font-black text-slate-900 dark:text-slate-100 pt-2 border-t border-sky-200 dark:border-slate-700">
                    <span>Grand Net Payable:</span>
                    <span className="text-sky-600">{settings.currency} {grandTotal.toFixed(2)}</span>
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
                  className="px-6 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg font-black text-xs shadow-md"
                >
                  Confirm &amp; Generate Multi-Medicine Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MULTI-MEDICINE BATCH SELECTOR PICKER MODAL */}
      {showBatchPickerModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-4xl w-full p-6 border border-slate-200 dark:border-slate-800 max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center pb-3 border-b border-slate-200 dark:border-slate-800 mb-4">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-indigo-600" />
                <div>
                  <h3 className="font-black text-slate-900 dark:text-slate-100 text-base">
                    Quick Multi-Medicine Batch Picker
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Check multiple medicines to add them all at once into the customer invoice
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowBatchPickerModal(false)} 
                className="text-slate-400 hover:text-slate-600 text-lg font-bold p-1"
              >
                ✕
              </button>
            </div>

            {/* Search Filter */}
            <div className="mb-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Filter medicines by name, category, or batch..."
                  value={pickerSearchTerm}
                  onChange={(e) => setPickerSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium"
                />
              </div>
            </div>

            {/* Inventory Batch Selection List */}
            <div className="flex-1 overflow-y-auto border border-slate-200 dark:border-slate-800 rounded-xl divide-y divide-slate-100 dark:divide-slate-800 mb-4">
              {inventory
                .filter(inv => inv.name.toLowerCase().includes(pickerSearchTerm.toLowerCase()) || inv.category.toLowerCase().includes(pickerSearchTerm.toLowerCase()))
                .map(inv => {
                  const state = selectedBatchItems[inv.id] || { selected: false, qty: 10, bonusQty: 1, discount: 0 };
                  return (
                    <div 
                      key={inv.id} 
                      className={`p-3 transition flex flex-wrap items-center justify-between gap-3 ${
                        state.selected ? 'bg-indigo-50/70 dark:bg-indigo-950/40' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={state.selected}
                          onChange={(e) => {
                            setSelectedBatchItems({
                              ...selectedBatchItems,
                              [inv.id]: { ...state, selected: e.target.checked }
                            });
                          }}
                          className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                        />
                        <div>
                          <div className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">{inv.name}</div>
                          <div className="text-[10px] text-slate-500 flex items-center gap-2">
                            <span>Batch: <strong className="font-mono text-indigo-600">{inv.batch}</strong></span>
                            <span>Exp: {inv.expiryDate || inv.expiry || '2027-12-31'}</span>
                            <span>Category: {inv.category}</span>
                            <span className="text-emerald-600 font-bold">In Stock: {inv.stock}</span>
                          </div>
                        </div>
                      </div>

                      {state.selected && (
                        <div className="flex items-center gap-3 bg-white dark:bg-slate-900 p-1.5 rounded-lg border border-indigo-200">
                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Billed Qty</span>
                            <input
                              type="number"
                              min="1"
                              value={state.qty}
                              onChange={(e) => {
                                setSelectedBatchItems({
                                  ...selectedBatchItems,
                                  [inv.id]: { ...state, qty: parseInt(e.target.value) || 1 }
                                });
                              }}
                              className="w-16 px-1.5 py-0.5 border rounded text-right font-black text-xs"
                            />
                          </div>

                          <div>
                            <span className="text-[9px] uppercase font-bold text-slate-400 block">Free Bonus</span>
                            <input
                              type="number"
                              min="0"
                              value={state.bonusQty}
                              onChange={(e) => {
                                setSelectedBatchItems({
                                  ...selectedBatchItems,
                                  [inv.id]: { ...state, bonusQty: parseInt(e.target.value) || 0 }
                                });
                              }}
                              className="w-14 px-1.5 py-0.5 border rounded text-right font-black text-xs text-emerald-600"
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>

            <div className="flex justify-between items-center pt-2">
              <span className="text-xs font-bold text-indigo-700 dark:text-indigo-300">
                {(Object.values(selectedBatchItems) as BatchItemConfig[]).filter(s => s.selected).length} Medicine(s) Selected
              </span>
              <div className="space-x-2">
                <button
                  onClick={() => setShowBatchPickerModal(false)}
                  className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-lg text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  onClick={handleApplyBatchPicker}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-black shadow-md"
                >
                  Add Selected Medicines to Invoice
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
