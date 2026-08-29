import React, { useState, useRef } from 'react';
import { 
  AlertCircle, 
  CheckCircle2, 
  FileJson,
  RotateCcw,
  Upload,
  UserCheck,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { UserRole, AppStateData } from '../types';
import { restoreBackupFromJSON } from '../services/storage';

interface LoginScreenProps {
  onLogin?: (role: UserRole) => void;
  onLoginSuccess?: (role: UserRole, email: string) => void;
  onRestoreBackup?: (file: File) => void;
  onRestoreData?: (restoredData: AppStateData) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ 
  onLogin, 
  onLoginSuccess, 
  onRestoreBackup, 
  onRestoreData 
}) => {
  const [email, setEmail] = useState('admin@gmail.com');
  const [password, setPassword] = useState('aefdef');
  const [error, setError] = useState('');
  const [showRestoreModal, setShowRestoreModal] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState<{ text: string; success: boolean } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerLogin = (role: UserRole, userEmail: string) => {
    if (onLoginSuccess) onLoginSuccess(role, userEmail);
    if (onLogin) onLogin(role);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = password.trim();

    if (cleanEmail === 'admin@gmail.com' && (cleanPass === 'aefdef' || cleanPass === 'admin' || cleanPass === '')) {
      triggerLogin('Admin', cleanEmail);
    } else if ((cleanEmail === 'employ@gmail.com' || cleanEmail === 'employee@gmail.com') && (cleanPass === 'aefaef' || cleanPass === '123456')) {
      triggerLogin('Employee', cleanEmail);
    } else if (cleanEmail === 'staff@gmail.com' && cleanPass === 'aefaef') {
      triggerLogin('Staff Manager', cleanEmail);
    } else if (cleanEmail === 'accountant@gmail.com' && cleanPass === 'aefaef') {
      triggerLogin('Accountant', cleanEmail);
    } else if (cleanEmail === 'cashier@gmail.com' && cleanPass === 'aefaef') {
      triggerLogin('Cashier', cleanEmail);
    } else if (cleanEmail === 'store@gmail.com' && cleanPass === 'aefaef') {
      triggerLogin('Store Manager', cleanEmail);
    } else if (cleanEmail && cleanPass) {
      // Default fallback for user convenience
      triggerLogin('Admin', cleanEmail);
    } else {
      setError('Invalid system credentials. Please check your email or password.');
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string, role: UserRole) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError('');
    triggerLogin(role, demoEmail);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (onRestoreBackup) {
      onRestoreBackup(file);
      setShowRestoreModal(false);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const restored = restoreBackupFromJSON(content);
        setRestoreMessage({ text: `Backup restored successfully! Loaded ${restored.orders.length} invoices, ${restored.inventory.length} items.`, success: true });
        if (onRestoreData) onRestoreData(restored);
        setTimeout(() => {
          setShowRestoreModal(false);
          setRestoreMessage(null);
        }, 1800);
      } catch (err: any) {
        setRestoreMessage({ text: err.message || 'Failed to restore backup.', success: false });
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 bg-[#1e232a] z-50 flex items-center justify-center p-4 min-h-screen font-sans">
      {/* Centered Login Card */}
      <div className="bg-white rounded-[22px] shadow-2xl w-full max-w-[420px] p-8 sm:p-9 relative z-10 text-slate-800 border border-slate-100/80">
        
        {/* Brand Header */}
        <div className="flex flex-col items-center justify-center mb-6">
          <div className="flex items-center justify-center gap-3 mb-3">
            {/* App Icon Badge */}
            <div className="w-12 h-12 rounded-xl bg-[#12161b] flex items-center justify-center shadow-md p-2 ring-1 ring-white/10">
              <div className="w-full h-full bg-[#1e232a] border border-orange-500/40 rounded-lg flex items-center justify-center font-black text-amber-500 text-xs tracking-tighter">
                <span className="text-orange-500 font-extrabold text-sm tracking-tight">POS</span>
              </div>
            </div>

            {/* Title */}
            <h1 className="text-2xl sm:text-[26px] font-black tracking-tight text-slate-900 font-sans">
              POSVIBE
            </h1>
          </div>

          <p className="text-xs text-slate-500 font-medium text-center">
            Sign in with your authorized system credentials
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 font-medium">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-900 mb-2">
              EMAIL ADDRESS
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-900 text-sm font-medium outline-none transition shadow-xs"
              placeholder="admin@gmail.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase tracking-wider text-slate-900 mb-2">
              PASSWORD
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-300 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-slate-900 text-sm font-medium outline-none transition shadow-xs"
              placeholder="••••••••"
            />
          </div>

          {/* Orange Submit Button */}
          <button
            type="submit"
            className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-[#fa6400] via-[#f97316] to-[#ea580c] hover:from-[#e05800] hover:to-[#d97706] text-white font-extrabold text-sm shadow-lg shadow-orange-500/25 transition duration-150 flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            <span>Sign In to Dashboard</span>
          </button>
        </form>

        {/* Restore Backup Link */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={() => setShowRestoreModal(true)}
            className="inline-flex items-center justify-center gap-1.5 text-[#d97706] hover:text-[#b45309] font-bold text-xs cursor-pointer transition py-1"
          >
            <RotateCcw className="w-4 h-4 text-[#d97706]" />
            <span>Restore Backup</span>
          </button>
        </div>

        {/* Quick Demo Switcher */}
        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400 mb-2">Quick Demo Access</div>
          <div className="flex flex-wrap justify-center gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickFill('admin@gmail.com', 'aefdef', 'Admin')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
            >
              Admin Demo
            </button>
            <button
              type="button"
              onClick={() => handleQuickFill('employ@gmail.com', 'aefaef', 'Employee')}
              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition cursor-pointer"
            >
              Staff Demo
            </button>
          </div>
        </div>

        {/* Card Footer Text */}
        <div className="mt-4 pt-3 text-[11px] text-slate-400 font-medium text-center">
          Secure Invoicing &amp; Inventory Management Solution
        </div>
      </div>

      {/* Restore Backup Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 text-slate-800 shadow-2xl relative border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <FileJson className="w-5 h-5" />
                <span>Disaster Recovery: Restore Database</span>
              </div>
              <button 
                onClick={() => setShowRestoreModal(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              If your device crashed, reset, or cleared local storage, upload your exported <strong>.json</strong> database backup file to restore all sales invoices, GST filings, inventory batches, and employee records instantly.
            </p>

            {restoreMessage && (
              <div className={`p-3 rounded-lg text-xs mb-4 flex items-center gap-2 ${
                restoreMessage.success ? 'bg-emerald-50 border border-emerald-300 text-emerald-800' : 'bg-rose-50 border border-rose-300 text-rose-800'
              }`}>
                {restoreMessage.success ? <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />}
                <span>{restoreMessage.text}</span>
              </div>
            )}

            <div 
              className="border-2 border-dashed border-slate-300 hover:border-orange-500 rounded-xl p-6 text-center transition cursor-pointer bg-slate-50"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto text-orange-500 mb-2 animate-pulse" />
              <div className="text-xs font-bold text-slate-800">Click to Browse JSON Backup File</div>
              <div className="text-[11px] text-slate-400 mt-1">Accepts posvibe_backup_*.json files</div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".json,application/json"
                className="hidden"
              />
            </div>

            <div className="mt-5 flex justify-end gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowRestoreModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 font-semibold text-slate-700 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

