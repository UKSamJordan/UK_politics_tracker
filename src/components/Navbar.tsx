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
  Newspaper
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
  shortLabel: string;
  icon: any;
  badge?: string;
  accentColor: string;
}

export const Navbar: React.FC<NavbarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenDataBankModal,
  onOpenSystemHealthModal,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: NavItem[] = [
    { id: 'media', label: 'Media Lens', shortLabel: 'Media Lens', icon: Newspaper, badge: 'Home', accentColor: 'text-sky-400' },
    { id: 'compare', label: 'Compare Policies', shortLabel: 'Policies', icon: Scale, accentColor: 'text-rose-400' },
    { id: 'live', label: 'Live Policy Tracker', shortLabel: 'Live Tracker', icon: Radio, badge: 'Live', accentColor: 'text-amber-400' },
    { id: 'polls', label: 'Polls & Public Opinion', shortLabel: 'Polls', icon: BarChart3, accentColor: 'text-emerald-400' },
    { id: 'cabinets', label: 'Cabinets & Leaders', shortLabel: 'Cabinets', icon: Users, accentColor: 'text-violet-400' },
    { id: 'matrix', label: 'Political Matrix', shortLabel: 'Matrix', icon: Compass, accentColor: 'text-cyan-400' },
    { id: 'factchecks', label: 'Fact Checkers', shortLabel: 'Fact Checks', icon: CheckCircle2, accentColor: 'text-teal-400' },
    { id: 'quiz', label: 'Where Do You Stand?', shortLabel: 'Quiz', icon: HelpCircle, accentColor: 'text-pink-400' },
  ];

  return (
    <header className="sticky top-0 z-50 bg-slate-900/95 backdrop-blur-md border-b border-slate-700 shadow-md w-full max-w-full overflow-x-hidden transition-colors">
      <div className="max-w-[1800px] mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16 gap-2">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-2 sm:space-x-3 cursor-pointer min-w-0" onClick={() => setActiveTab('media')}>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-blue-600 via-indigo-600 to-rose-600 flex items-center justify-center shadow-sm text-white font-black text-base sm:text-lg shrink-0 border border-white/20">
              🇬🇧
            </div>
            <div className="min-w-0">
              <div className="flex items-center space-x-1.5 sm:space-x-2">
                <span className="font-extrabold text-white text-base sm:text-lg tracking-tight truncate">UK Politics</span>
                <span className="px-1.5 py-0.5 text-[10px] sm:text-xs font-bold bg-indigo-500/20 border border-indigo-400/40 text-indigo-200 rounded shrink-0">Comparator</span>
              </div>
              <p className="text-xs text-slate-300 hidden sm:block">Parties • Policies • Media Spin • Polling • Fact-Checks</p>
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
                  className={`flex items-center space-x-2 px-3.5 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-sm ring-1 ring-indigo-400/50'
                      : 'text-slate-200 hover:text-white hover:bg-slate-800'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.accentColor}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`ml-1 text-[10px] uppercase font-extrabold tracking-wider px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-300 border border-amber-400/30'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Desktop Action buttons */}
          <div className="hidden sm:flex items-center space-x-2">
            {onOpenSystemHealthModal && (
              <button
                onClick={onOpenSystemHealthModal}
                className="flex items-center space-x-1.5 text-xs font-bold px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60 transition-colors cursor-pointer"
                title="View Universal Party Integrity & Roster Health"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>8/8 Parties Verified</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </button>
            )}

            <button
              onClick={onOpenDataBankModal}
              className="flex items-center space-x-1.5 text-xs font-semibold px-3 py-1.5 rounded-xl border border-slate-600 bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
              title="How the Data Bank and Live Intelligence work"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>Data Bank</span>
            </button>
          </div>

          {/* Mobile menu button — High-contrast labelled pill so it is impossible to miss on iPhone */}
          <div className="lg:hidden flex items-center space-x-2 shrink-0">
            {onOpenSystemHealthModal && (
              <button
                onClick={onOpenSystemHealthModal}
                className="flex items-center space-x-1 text-[11px] font-bold px-2 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/60 text-emerald-300 shrink-0"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>8/8</span>
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center space-x-1.5 transition-all cursor-pointer shrink-0 shadow-xs border ${
                mobileMenuOpen
                  ? 'bg-rose-600 text-white border-rose-400'
                  : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-400/60'
              }`}
              aria-label="Toggle all sections menu"
            >
              {mobileMenuOpen ? (
                <>
                  <X className="w-4 h-4" />
                  <span>Close</span>
                </>
              ) : (
                <>
                  <Menu className="w-4 h-4" />
                  <span>Sections</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Always-Visible Mobile/Tablet Horizontal Section Switcher Ribbon */}
      <div className="lg:hidden border-t border-slate-700/80 bg-slate-950/80 px-2.5 py-2">
        <div className="flex items-center space-x-1.5 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
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
                className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold whitespace-nowrap transition-all shrink-0 cursor-pointer border ${
                  isActive
                    ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                    : 'bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : item.accentColor}`} />
                <span>{item.shortLabel}</span>
                {item.badge && (
                  <span className={`text-[9px] uppercase font-black px-1 py-0.2 rounded ${
                    isActive ? 'bg-white/25 text-white' : 'bg-amber-500/25 text-amber-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile full menu dropdown */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-slate-700 bg-slate-900 px-4 pt-3 pb-5 space-y-1.5 shadow-2xl">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-400 px-2 pb-1">
            All Platform Sections
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
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
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-bold cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-sm'
                      : 'bg-slate-800/80 text-slate-100 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : item.accentColor}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                      isActive ? 'bg-white/20 text-white' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <div className="pt-3 mt-2 border-t border-slate-700 flex flex-col space-y-2">
            {onOpenSystemHealthModal && (
              <button
                onClick={() => {
                  onOpenSystemHealthModal();
                  setMobileMenuOpen(false);
                }}
                className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-xs text-emerald-300 bg-emerald-950/50 border border-emerald-700/50 rounded-xl font-bold cursor-pointer"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>8/8 Parties Integrity & Health Inspector</span>
              </button>
            )}
            <button
              onClick={() => {
                onOpenDataBankModal();
                setMobileMenuOpen(false);
              }}
              className="w-full flex items-center space-x-2 px-3.5 py-2.5 text-xs text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 rounded-xl font-semibold cursor-pointer"
            >
              <Database className="w-4 h-4 text-emerald-400" />
              <span>Data Bank & Live Intelligence Architecture</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};

