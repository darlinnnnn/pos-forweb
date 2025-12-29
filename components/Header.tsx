import React from 'react';
import { Store, User } from 'lucide-react';
import { ShiftData } from '../types';

interface HeaderProps {
  shiftData: ShiftData;
  storeName?: string;
  onOpenControlCenter: () => void;
}

const Header: React.FC<HeaderProps> = ({ shiftData, storeName, onOpenControlCenter }) => {
  const isShiftOpen = shiftData.isOpen;

  return (
    <header className="h-16 shrink-0 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 flex items-center justify-between px-4 md:px-6 z-30 transition-colors">
      {/* Brand & Status */}
      <div className="flex items-center gap-3 md:gap-6">
        <div className="flex items-center gap-3">
          <div className="size-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/20 text-slate-950 shrink-0">
            <Store className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-bold tracking-tight text-white leading-none truncate max-w-[120px] sm:max-w-none">
              {storeName || 'ElegantPOS'}
            </h1>
            <p className="text-[10px] md:text-[11px] text-slate-400 font-medium tracking-wide uppercase mt-0.5">Terminal Active</p>
          </div>
        </div>
        
        <div className="hidden md:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800 border border-slate-700/50">
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isShiftOpen ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isShiftOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
          </span>
          <span className={`text-xs font-bold uppercase tracking-wider ${isShiftOpen ? 'text-emerald-400' : 'text-red-400'}`}>
            {isShiftOpen ? 'Shift Active' : 'Shift Closed'}
          </span>
        </div>
      </div>

      {/* Right Side: Profile Button to open Control Center */}
      <div className="flex items-center">
         <button 
            onClick={onOpenControlCenter}
            className="flex items-center gap-2 md:gap-3 px-2 md:px-3 py-1.5 rounded-xl hover:bg-slate-800/50 transition-all duration-200 outline-none border border-transparent hover:border-slate-700 group"
         >
             <div className="p-1.5 bg-slate-800 rounded-lg text-primary-500 border border-slate-700/50 shadow-inner group-hover:scale-110 transition-transform">
                <User size={18} />
             </div>
             
             <div className="text-left hidden sm:block">
                <p className="text-sm font-bold text-white leading-tight">{isShiftOpen ? shiftData.cashierName : 'Manager'}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter">Quick Access</p>
             </div>
         </button>
      </div>
    </header>
  );
};

export default Header;