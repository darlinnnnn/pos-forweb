import React, { useState, useMemo } from 'react';
import { Search, Store, ArrowLeft, ChevronRight, Check } from 'lucide-react';

interface Outlet {
  id: string;
  name: string;
  address: string;
  isOpen: boolean;
  type: string;
}

interface OutletSelectorProps {
  outlets: Outlet[];
  onSelect: (outlet: Outlet) => void;
  onBack: () => void;
  storeName: string;
}

const OutletSelector: React.FC<OutletSelectorProps> = ({ outlets, onSelect, onBack, storeName }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredOutlets = useMemo(() => {
    return outlets.filter(outlet => 
      outlet.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [outlets, searchQuery]);

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-slate-950 p-4 font-sans relative overflow-hidden">
      {/* Subtle background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-[120px] pointer-events-none"></div>
      
      <div className="w-full max-w-[500px] z-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Branding & Back button */}
        <div className="mb-8 text-center">
          <button 
            onClick={onBack}
            className="inline-flex items-center gap-2 text-slate-500 hover:text-primary-500 transition-colors font-black text-[10px] uppercase tracking-widest mb-6"
          >
            <ArrowLeft size={14} /> Change Account
          </button>
          
          <div className="flex flex-col items-center">
            <div className="size-16 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center text-slate-950 shadow-2xl shadow-primary-500/20 mb-4">
              <Store size={32} />
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">{storeName}</h1>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">Select Active Outlet</p>
          </div>
        </div>

        {/* Search & List Container (Flowbite-inspired) */}
        <div className="bg-slate-900/50 backdrop-blur-xl border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
          {/* Search Bar */}
          <div className="p-4 border-b border-slate-800">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-500 transition-colors">
                <Search size={18} />
              </div>
              <input 
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full h-12 bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 text-white placeholder:text-slate-700 focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/5 transition-all font-medium text-sm"
                placeholder="Search outlet name..."
                autoFocus
              />
            </div>
          </div>

          {/* Outlet List */}
          <div className="max-h-[350px] overflow-y-auto no-scrollbar">
            {filteredOutlets.length > 0 ? (
              <div className="divide-y divide-slate-800/50">
                {filteredOutlets.map((outlet) => (
                  <button
                    key={outlet.id}
                    onClick={() => onSelect(outlet)}
                    className="w-full flex items-center justify-between p-5 text-left hover:bg-primary-500/5 transition-all group active:bg-primary-500/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="size-10 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary-500/20 group-hover:text-primary-500 transition-colors">
                        <Store size={20} />
                      </div>
                      <div>
                        <h3 className="text-sm font-black text-white group-hover:text-primary-400 transition-colors">{outlet.name}</h3>
                        <p className="text-[11px] text-slate-500 font-medium truncate max-w-[240px] mt-0.5">{outlet.address}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`size-2 rounded-full ${outlet.isOpen ? 'bg-emerald-500' : 'bg-slate-700'}`}></div>
                      <ChevronRight size={16} className="text-slate-700 group-hover:text-primary-500 transition-colors" />
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <div className="size-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 mx-auto mb-3">
                   <Search size={20} />
                </div>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">No outlet found</p>
              </div>
            )}
          </div>

          {/* List Footer */}
          <div className="p-4 bg-slate-950/50 text-center border-t border-slate-800">
             <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                Showing {filteredOutlets.length} of {outlets.length} available outlets
             </p>
          </div>
        </div>

        <p className="mt-8 text-center text-slate-700 text-[10px] font-black uppercase tracking-[0.2em]">
          &copy; 2025 ElegantPOS System
        </p>
      </div>
    </div>
  );
};

export default OutletSelector;
