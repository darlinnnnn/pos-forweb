import React, { useState, useRef, useEffect } from 'react';
import { Store, ChevronDown, XCircle, CheckCircle, Wallet, History, LogOut, User, Settings } from 'lucide-react';
import { ShiftData } from '../types';

interface HeaderProps {
  shiftData: ShiftData;
  onOpenShiftModal: () => void;
  onOpenSettings: () => void;
}

const Header: React.FC<HeaderProps> = ({ shiftData, onOpenShiftModal, onOpenSettings }) => {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  
  const isShiftOpen = shiftData.isOpen;

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleShiftClick = () => {
    onOpenShiftModal();
    setIsProfileOpen(false);
  };

  const handleSettingsClick = () => {
    onOpenSettings();
    setIsProfileOpen(false);
  };

  return (
    <header className="h-16 shrink-0 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 md:px-6 z-30">
      {/* Brand & Status */}
      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 text-slate-900 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white leading-none">ElegantPOS</h1>
            <p className="text-[10px] md:text-[11px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">Retail Manager</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700/50">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isShiftOpen ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isShiftOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider ${isShiftOpen ? 'text-emerald-400' : 'text-red-400'}`}>
            {isShiftOpen ? 'Online' : 'Closed'}
          </span>
        </div>
      </div>

      {/* Right Side: Profile */}
      <div className="flex items-center gap-6">
         {/* Cashier Profile Dropdown */}
         <div className="relative" ref={menuRef}>
             <button 
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className={`flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 rounded-xl transition-all duration-200 outline-none ${isProfileOpen ? 'bg-slate-800/50 ring-1 ring-slate-700' : 'hover:bg-slate-800/30'}`}
             >
                 <div className="p-1.5 bg-slate-800 rounded-lg text-primary-500 border border-slate-700/50">
                    <User size={16} />
                 </div>
                 
                 <div className="text-left hidden sm:block">
                    <p className="text-sm font-bold text-white leading-tight">{isShiftOpen ? shiftData.cashierName : 'No User'}</p>
                    <p className="text-[11px] text-slate-400 font-medium">{isShiftOpen ? 'ID: 8821' : 'Signed Out'}</p>
                 </div>
                 
                 <ChevronDown size={14} className={`text-slate-500 transition-transform duration-200 ml-1 ${isProfileOpen ? 'rotate-180' : ''}`} />
             </button>

             {/* Dropdown Menu */}
             {isProfileOpen && (
                <div className="absolute top-full right-0 mt-3 w-72 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right ring-1 ring-black/50 z-50">
                    {/* Header */}
                    <div className="p-4 bg-slate-800/50 border-b border-slate-700/50">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Register Status</span>
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-300">POS-01</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className={`w-2.5 h-2.5 rounded-full ${isShiftOpen ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`}></div>
                            <div>
                                <p className="text-sm font-bold text-white leading-none">{isShiftOpen ? 'Shift Open' : 'Shift Closed'}</p>
                                {isShiftOpen && <p className="text-[11px] text-slate-500 mt-1 font-medium">Started: Today, 08:00 AM</p>}
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2 space-y-1">
                        {isShiftOpen ? (
                             <button 
                                onClick={handleShiftClick}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all group relative overflow-hidden"
                             >
                                <div className="absolute inset-0 bg-red-500/0 group-hover:bg-red-500/5 transition-colors"></div>
                                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-red-500/20 group-hover:text-red-400 transition-colors z-10 border border-slate-700 group-hover:border-red-500/20">
                                    <XCircle size={18} />
                                </div>
                                <div className="text-left z-10">
                                    <span className="block text-slate-200 group-hover:text-red-400 font-semibold transition-colors">Close Shift</span>
                                    <span className="text-[10px] text-slate-500 group-hover:text-slate-400">End day & print report</span>
                                </div>
                             </button>
                        ) : (
                             <button 
                                onClick={handleShiftClick}
                                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all group relative overflow-hidden"
                             >
                                <div className="absolute inset-0 bg-emerald-500/0 group-hover:bg-emerald-500/5 transition-colors"></div>
                                <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors z-10 border border-slate-700 group-hover:border-emerald-500/20">
                                    <CheckCircle size={18} />
                                </div>
                                <div className="text-left z-10">
                                    <span className="block text-slate-200 group-hover:text-emerald-400 font-semibold transition-colors">Open Shift</span>
                                    <span className="text-[10px] text-slate-500 group-hover:text-slate-400">Start new session</span>
                                </div>
                             </button>
                        )}
                        
                        <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                             <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-primary-500/20 group-hover:text-primary-400 transition-colors border border-slate-700 group-hover:border-primary-500/20">
                                 <Wallet size={18} />
                             </div>
                             <div className="text-left">
                                 <span className="block text-slate-200 group-hover:text-primary-400 font-semibold transition-colors">Cash Drawer</span>
                                 <span className="text-[10px] text-slate-500">Pay in / Pay out</span>
                             </div>
                        </button>

                         <button className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all group">
                             <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-blue-500/20 group-hover:text-blue-400 transition-colors border border-slate-700 group-hover:border-blue-500/20">
                                 <History size={18} />
                             </div>
                             <div className="text-left">
                                 <span className="block text-slate-200 group-hover:text-blue-400 font-semibold transition-colors">Shift History</span>
                                 <span className="text-[10px] text-slate-500">View past summaries</span>
                             </div>
                        </button>
                    </div>

                    <div className="h-px bg-slate-800 mx-4 my-1"></div>

                    <div className="p-2 pb-3 space-y-1">
                        <button 
                            onClick={handleSettingsClick}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-xl transition-all group"
                        >
                            <div className="p-2 rounded-lg bg-slate-800 text-slate-400 group-hover:bg-slate-700 group-hover:text-white transition-colors border border-slate-700">
                                <Settings size={18} />
                            </div>
                            <span>Settings</span>
                        </button>

                        <button className="w-full flex items-center gap-2 px-3 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-xl transition-colors justify-center">
                            <LogOut size={16} />
                            <span>Logout</span>
                        </button>
                    </div>
                </div>
             )}
         </div>
      </div>
    </header>
  );
};

export default Header;