import React, { useState } from 'react';
import { X, Database, Zap, ShieldCheck, Cloud, Key, RefreshCw } from 'lucide-react';

interface DataBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncAll?: () => Promise<void>;
}

export const DataBankModal: React.FC<DataBankModalProps> = ({ isOpen, onClose, onSyncAll }) => {
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSync = async () => {
    if (!onSyncAll || isSyncing) return;
    setIsSyncing(true);
    setSyncSuccess(false);
    try {
      await onSyncAll();
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to sync all:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 dark:bg-black/75 backdrop-blur-xs">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 dark:text-slate-100">Live Data Bank & Verification Engine</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Real-time HTTP updates + Server-Side Cloud Intelligence</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Server-Side Cloud Function Intelligence Status */}
        <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Server-Side Parliamentary Intelligence</h4>
            </div>
            <span className="text-[10px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 rounded font-bold">
              ✓ Cloud Functions Active
            </span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Clicking <strong>"Update [Section]"</strong> executes secure server-side Cloud Functions with Google Search grounding to discover real-time political reshuffles, new polling, and fact checks without exposing any API credentials to the browser.
          </p>
        </div>

        {/* 3 Architecture Pillars */}
        <div className="space-y-2.5">
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <Cloud className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">100% Free Edge CDN Delivery</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                By default, all visitors load verified JSON from Firebase Hosting’s global CDN edge in &lt;100ms with zero client credentials exposed.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/60">
            <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-950 dark:text-emerald-200">Cache-Busting Live HTTP Updates</h4>
              <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-0.5 leading-relaxed">
                Pressing "Update" on any section bypasses browser caches with a real HTTP request (<code className="bg-emerald-100/60 dark:bg-emerald-900/60 dark:text-emerald-200 px-1 py-0.5 rounded text-[11px]">/data/cabinets.json?_t=timestamp</code>) to pull fresh data into React state.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
            <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">Local Persistence</h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 leading-relaxed">
                Updates retrieved by clicking the button are saved into your browser's local cache so your customised or refreshed state remains intact on future visits.
              </p>
            </div>
          </div>
        </div>

        {/* Force Sync All Button */}
        {onSyncAll && (
          <div className="pt-2 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing all data...' : syncSuccess ? 'All Data Synced!' : 'Force Sync All from CDN'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 dark:bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-slate-800 dark:hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
