import React from 'react';
import { X, Database, Zap, ShieldCheck, Cloud, Terminal, CheckCircle2 } from 'lucide-react';

interface DataBankModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DataBankModal: React.FC<DataBankModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Data Bank & Gemini Architecture</h3>
              <p className="text-xs text-slate-500">Zero-cost edge delivery + On-demand AI updates</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 3 Pillars */}
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Cloud className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">100% Free Cloudflare Edge Hosting</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                When friends and family visit from phones or computers, they load pre-built JSON directly from Cloudflare’s CDN. It takes under 100ms and costs £0.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-emerald-950">Gemini API Cost Protection</h4>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Visitors <strong>never</strong> trigger the Gemini API directly. You will never face unexpected token bills or rate limit spikes from viral traffic.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
            <Zap className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="text-xs font-bold text-slate-900">On-Demand Gemini Flash 3.8 Ingestion</h4>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Whenever a party announces a new policy, reshuffles their shadow cabinet, or a major poll drops, you run the python CLI tool to parse and append it into the local JSON files.
              </p>
            </div>
          </div>
        </div>

        {/* Code snippet */}
        <div className="bg-slate-950 text-slate-200 rounded-xl p-3.5 text-xs font-mono space-y-1 overflow-x-auto">
          <div className="text-slate-500"># Example: Update polls with Gemini Flash</div>
          <div>export GEMINI_API_KEY="your-key-here"</div>
          <div className="text-emerald-400">python scripts/update_databank.py --type poll --input "YouGov: Lab 31, Con 24, Ref 20..."</div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors"
          >
            Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
};
