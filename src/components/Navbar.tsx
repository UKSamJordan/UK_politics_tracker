import React, { useState } from 'react';
import { 
  Scale, 
  Shield, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  HelpCircle, 
  Database,
  Menu,
  X
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDataBankModal: () => void;
}

interface NavItem {
  id: string;
  label: string;
  icon: any;
  badge?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenDataBankModal 
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'compare', label: 'Compare Policies', icon: Scale },
    { id: 'cabinets', label: 'Cabinets & Leaders', icon: Users },
    { id: 'polls', label: 'Polls & Public Opinion', icon: BarChart3 },
    { id: 'factchecks', label: 'Fact Checkers', icon: CheckCircle2 },
    { id: 'quiz', label: 'Where Do You Stand?', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('compare')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-700 via-rose-600 to-red-600 flex items-center justify-center shadow-sm text-white font-black text-lg">
              🇬🇧
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-slate-900 text-lg tracking-tight">UK Politics</span>
                <span className="px-1.5 py-0.5 text-xs font-semibold bg-rose-100 text-rose-800 rounded">Comparator</span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">Parties • Policies • Polling • Fact-Checks</p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden lg:flex items-center space-x-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action buttons */}
          <div className="hidden sm:flex items-center space-x-2">
            <button
              onClick={onOpenDataBankModal}
              className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 transition-colors"
              title="How the Data Bank and Gemini API work"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600" />
              <span>Data Bank (Gemini Flash)</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-md text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-hidden"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 bg-white px-4 pt-2 pb-4 space-y-1 shadow-lg">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-700 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-rose-400' : 'text-slate-500'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100">
            <button
              onClick={() => {
                onOpenDataBankModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 rounded-lg"
            >
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Data Bank & Gemini Architecture</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
