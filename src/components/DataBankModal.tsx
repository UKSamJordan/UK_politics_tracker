import React, { useState } from 'react';
import { X, Database, Zap, ShieldCheck, Cloud, Key, RefreshCw, CheckCircle2 } from 'lucide-react';
import { getStoredApiKey, setStoredApiKey } from '../services/liveUpdater';

interface DataBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSyncAll?: () => Promise<void>;
}

export const DataBankModal: React.FC<DataBankModalProps> = ({ isOpen, onClose, onSyncAll }) => {
  const [apiKey, setApiKey] = useState(getStoredApiKey());
  const [isSaved, setIsSaved] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSaveKey = () => {
    setStoredApiKey(apiKey);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Live Data Bank & Verification Engine</h3>
              <p className="text-xs text-slate-500">Real-time HTTP updates + Optional Gemini 3.8 Flash query</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Browser API Key Configuration */}
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-rose-600" />
              <h4 className="text-xs font-bold text-slate-900">Your Private Gemini 3.8 Flash Key (Optional)</h4>
            </div>
            <span className="text-[10px] text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded">
              Saved locally in browser only
            </span>
          </div>
          <p className="text-xs text-slate-600">
            When provided, clicking <strong>"Update [Section]"</strong> queries Gemini 3.8 Flash directly from your browser with search grounding to discover real-time political reshuffles and new polling.
          </p>
          <div className="flex items-center space-x-2">
            <input
              type="password"
              placeholder="AIzaSy... (leave blank to use CDN Data Bank)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-slate-900"
            />
            <button
              onClick={handleSaveKey}
              className="px-3.5 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-all cursor-pointer"
            >
              {isSaved ? 'Saved!' : 'Save Key'}
            </button>
          </div>
        </div>

        {/* 3 Architecture Pillars */}
        <div className="space-y-2.5">
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Cloud className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">100% Free Edge CDN Delivery</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                By default, all visitors load verified JSON from Cloudflare’s CDN edge in &lt;100ms with zero server cost and zero API bills.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-950">Cache-Busting Live HTTP Updates</h4>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Pressing "Update" on any section bypasses browser caches with a real HTTP request (<code className="bg-emerald-100/60 px-1 py-0.5 rounded text-[11px]">/data/cabinets.json?_t=timestamp</code>) to pull fresh data into React state.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Zap className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">Local Persistence</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Updates retrieved by clicking the button are saved into your browser's local cache so your customised or refreshed state remains intact on future visits.
              </p>
            </div>
          </div>
        </div>

        {/* Force Sync All Button */}
        {onSyncAll && (
          <div className="pt-2 flex items-center justify-between border-t border-slate-100">
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center space-x-2 px-3.5 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'Syncing all data...' : syncSuccess ? 'All Data Synced!' : 'Force Sync All from CDN'}</span>
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
