import React, { useState, useRef } from 'react';
import { 
  ShieldCheck, 
  Upload, 
  KeyRound, 
  AlertCircle, 
  Building2, 
  CheckCircle2, 
  FileJson,
  RotateCcw,
  Sparkles,
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

    if (cleanEmail === 'admin@gmail.com' && cleanPass === 'aefdef') {
      triggerLogin('Admin', cleanEmail);
    } else if ((cleanEmail === 'employ@gmail.com' || cleanEmail === 'employee@gmail.com') && cleanPass === 'aefaef') {
      triggerLogin('Employee', cleanEmail);
    } else if (cleanEmail === 'staff@gmail.com' && cleanPass === 'aefaef') {
      triggerLogin('Staff Manager', cleanEmail);
    } else if (cleanEmail === 'accountant@gmail.com' && cleanPass === 'aefaef') {
      triggerLogin('Accountant', cleanEmail);
    } else if (cleanEmail === 'cashier@gmail.com' && cleanPass === 'aefaef') {
      triggerLogin('Cashier', cleanEmail);
    } else if (cleanEmail === 'store@gmail.com' && cleanPass === 'aefaef') {
      triggerLogin('Store Manager', cleanEmail);
    } else {
      setError('Invalid enterprise credentials. Please check your email or password.');
    }
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
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-50 flex items-center justify-center p-4">
      {/* Decorative background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-cyan-600/15 rounded-full blur-3xl"></div>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md p-8 relative z-10 text-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-600/30 overflow-hidden p-1">
              <img
                src="https://zuraizadil32-cyber.github.io/Payvubes/logo.png"
                alt="Posvibe logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-white">Posvibe</h1>
              <p className="text-[11px] text-slate-400 font-medium">Enterprise Management Suite</p>
            </div>
          </div>
          
          <button
            onClick={() => setShowRestoreModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-cyan-400 border border-cyan-900/50 transition cursor-pointer"
            title="Disaster Recovery / Reset Protection"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Backup</span>
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Corporate Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-100 text-xs font-medium outline-none transition"
              placeholder="operator@company.com"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-lg bg-slate-950 border border-slate-800 focus:border-orange-500 focus:ring-1 focus:ring-orange-500 text-slate-100 text-xs font-medium outline-none transition"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2 cursor-pointer mt-2"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Authenticate Secure Login</span>
          </button>
        </form>
      </div>

      {/* Restore Backup Modal */}
      {showRestoreModal && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-slate-100 shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <FileJson className="w-5 h-5" />
                <span>Disaster Recovery: Restore Database</span>
              </div>
              <button 
                onClick={() => setShowRestoreModal(false)}
                className="text-slate-400 hover:text-slate-200 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              If your device crashed, reset, or cleared browser local storage, upload your exported <strong>.json</strong> database backup file to restore all sales invoices, GST filings, inventory batches, and employee records instantly.
            </p>

            {restoreMessage && (
              <div className={`p-3 rounded-lg text-xs mb-4 flex items-center gap-2 ${
                restoreMessage.success ? 'bg-emerald-950/70 border border-emerald-700 text-emerald-300' : 'bg-rose-950/70 border border-rose-700 text-rose-300'
              }`}>
                {restoreMessage.success ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />}
                <span>{restoreMessage.text}</span>
              </div>
            )}

            <div className="border-2 border-dashed border-slate-700 hover:border-cyan-500 rounded-xl p-6 text-center transition cursor-pointer bg-slate-950/50"
                 onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="w-8 h-8 mx-auto text-cyan-400 mb-2 animate-pulse" />
              <div className="text-xs font-bold text-slate-200">Click to Browse JSON Backup File</div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">Accepts posvibe_backup_*.json files</div>
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
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 font-semibold text-slate-300"
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
