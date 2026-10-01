import React, { useState } from 'react';
import { 
  Scale, 
  Compass,
  ShieldCheck, 
  Users, 
  BarChart3, 
  CheckCircle2, 
  HelpCircle, 
  Database,
  Menu,
  X,
  Radio,
  Sun,
  Moon
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenDataBankModal: () => void;
  onOpenSystemHealthModal?: () => void;
  isDark?: boolean;
  onToggleTheme?: () => void;
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
  onOpenDataBankModal,
  onOpenSystemHealthModal,
  isDark = false,
  onToggleTheme
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'compare', label: 'Compare Policies', icon: Scale },
    { id: 'matrix', label: 'Political Matrix', icon: Compass },
    { id: 'cabinets', label: 'Cabinets & Leaders', icon: Users },
    { id: 'polls', label: 'Polls & Public Opinion', icon: BarChart3 },
    { id: 'live', label: 'Live Policy Tracker', icon: Radio, badge: 'Live' },
    { id: 'factchecks', label: 'Fact Checkers', icon: CheckCircle2 },
    { id: 'quiz', label: 'Where Do You Stand?', icon: HelpCircle },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs w-full max-w-full overflow-x-hidden transition-colors">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer min-w-0" onClick={() => setActiveTab('compare')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-700 via-rose-600 to-red-600 flex items-center justify-center shadow-sm text-white font-black text-base sm:text-lg shrink-0">
              🇬🇧
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-bold text-slate-900 dark:text-white text-base sm:text-lg tracking-tight truncate">UK Politics</span>
                <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-semibold bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 rounded shrink-0">Comparator</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Parties • Policies • Polling • Fact-Checks</p>
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
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 dark:border dark:border-slate-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 dark:text-slate-300 dark:hover:text-white dark:hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-rose-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="ml-1 text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Action buttons */}
          <div className="hidden sm:flex items-center space-x-2">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}

            {onOpenSystemHealthModal && (
              <button
                onClick={onOpenSystemHealthModal}
                className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer"
                title="View Universal Party Integrity & Roster Health"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>8/8 Parties Verified</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              </button>
            )}

            <button
              onClick={onOpenDataBankModal}
              className="flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title="How the Data Bank and Live Intelligence work"
            >
              <Database className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Data Bank</span>
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="lg:hidden flex items-center space-x-1.5 shrink-0">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
              </button>
            )}
            {onOpenSystemHealthModal && (
              <button
                onClick={onOpenSystemHealthModal}
                className="flex items-center space-x-1 text-xs font-bold px-2 py-1 rounded-lg border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>8/8</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-1.5 sm:p-2 rounded-md text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 focus:outline-hidden cursor-pointer shrink-0"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-4 pt-2 pb-4 space-y-1 shadow-lg">
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
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-base font-medium cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-800 dark:text-slate-100 dark:border dark:border-slate-700'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className={`w-5 h-5 ${isActive ? 'text-rose-400' : 'text-slate-500 dark:text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-400">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex flex-col space-y-2">
            {onToggleTheme && (
              <button
                onClick={onToggleTheme}
                className="w-full flex items-center justify-between px-3 py-2 text-sm text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 rounded-lg font-medium cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-500 dark:text-slate-400" />}
                  <span>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</span>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold">
                  {isDark ? '🌙 Dark Active' : '☀️ Light Active'}
                </span>
              </button>
            )}
            {onOpenSystemHealthModal && (
              <button
                onClick={() => {
                  onOpenSystemHealthModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 rounded-lg font-bold"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <span>8/8 Parties Integrity & Health Inspector</span>
              </button>
            )}
            <button
              onClick={() => {
                onOpenDataBankModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg"
            >
              <Database className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Data Bank & Live Intelligence Architecture</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
