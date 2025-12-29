
import React, { useState, useEffect, useRef } from 'react';
import { ShiftData } from '../types';
// Fixed: Added ChevronRight and removed non-existent Backspace from lucide-react imports
import { X, DollarSign, User, Clock, CheckCircle2, Receipt, CreditCard, Smartphone, ChevronDown, Check, ArrowLeft, Key, Eye, EyeOff, AlertCircle, Delete, ChevronRight } from 'lucide-react';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: ShiftData;
  onConfirmShift: (data: Partial<ShiftData>) => void;
  isInitial?: boolean;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, shiftData, onConfirmShift, isInitial = false }) => {
  const [step, setStep] = useState<'cashier' | 'pin' | 'cash' | 'summary'>('cashier');
  
  // Settings mock - in real app, these come from DB
  const cashierOptions = [
    { name: 'SARAH J.', id: '8821', pin: '1234', requiresPin: true },
    { name: 'BUDI S.', id: '9912', pin: '', requiresPin: false },
    { name: 'ADMIN', id: 'ADM-001', pin: '1111', requiresPin: true }
  ];

  // Open Shift State
  const [selectedCashier, setSelectedCashier] = useState(cashierOptions[0]);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [startCash, setStartCash] = useState<string>('');
  
  // Dropdown State
  const [isCashierDropdownOpen, setIsCashierDropdownOpen] = useState(false);
  const cashierDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cashierDropdownRef.current && !cashierDropdownRef.current.contains(event.target as Node)) {
        setIsCashierDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Reset on Open
  useEffect(() => {
    if (isOpen) {
      setStep('cashier');
      setStartCash('');
      setPin('');
      setPinError(false);
    }
  }, [isOpen]);

  // Handle PIN input
  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const newPin = pin + num;
      setPin(newPin);
      setPinError(false);
      
      if (newPin.length === 4) {
        if (newPin === selectedCashier.pin) {
          setTimeout(() => setStep('cash'), 300);
        } else {
          setPinError(true);
          setTimeout(() => setPin(''), 800);
        }
      }
    }
  };

  const handleBackspace = () => setPin(prev => prev.slice(0, -1));

  if (!isOpen) return null;

  const isShiftOpen = shiftData.isOpen;
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300 ${isInitial ? '' : 'z-[105]'}`}>
      <div className="bg-slate-900 border-x sm:border border-slate-800 rounded-t-[3rem] sm:rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 flex flex-col h-[90vh] sm:h-auto sm:max-h-[90vh]">
        
        {/* Header */}
        <div className="p-6 sm:p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-white flex items-center gap-3 tracking-tight">
              {!isShiftOpen ? (
                <>
                  <div className="size-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center">
                    <CheckCircle2 size={24} />
                  </div>
                  Terminal Login
                </>
              ) : (
                <>
                  <div className="size-10 bg-red-500/10 text-red-500 rounded-xl flex items-center justify-center">
                    <X size={24} />
                  </div>
                  End Session
                </>
              )}
            </h3>
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px] mt-2">
              {isInitial ? 'Welcome back to work' : 'Shift Management'}
            </p>
          </div>
          
          <button onClick={onClose} className="p-3 bg-slate-800 rounded-xl text-slate-400 hover:text-white transition-all">
             {isInitial ? <ArrowLeft size={24} /> : <X size={24} />}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 space-y-8 no-scrollbar">
          
          {/* STEP 1: Cashier Selection */}
          {step === 'cashier' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="text-center">
                    <div className="size-20 bg-slate-800 rounded-3xl flex items-center justify-center text-primary-500 mx-auto mb-4 shadow-2xl border border-slate-700">
                        <User size={40} />
                    </div>
                    <h4 className="text-white font-black text-lg">Who is operating today?</h4>
                    <p className="text-slate-500 text-sm mt-1 font-medium">Please select your cashier profile</p>
                </div>

                <div className="space-y-4" ref={cashierDropdownRef}>
                    {cashierOptions.map(cashier => (
                        <button 
                            key={cashier.id}
                            onClick={() => {
                                setSelectedCashier(cashier);
                                if (cashier.requiresPin) {
                                    setStep('pin');
                                } else {
                                    setStep('cash');
                                }
                            }}
                            className="w-full bg-slate-850/50 border border-slate-800 rounded-2xl p-5 flex items-center justify-between hover:border-primary-500 hover:bg-slate-800 transition-all group active:scale-[0.98]"
                        >
                            <div className="flex items-center gap-4">
                                <div className="size-12 rounded-xl bg-slate-800 flex items-center justify-center text-slate-500 group-hover:bg-primary-500 group-hover:text-slate-950 transition-colors">
                                    <User size={24} />
                                </div>
                                <div className="text-left">
                                    <p className="text-white font-black">{cashier.name}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">ID: {cashier.id}</p>
                                </div>
                            </div>
                            <ChevronRight size={20} className="text-slate-700 group-hover:text-primary-500 transition-colors" />
                        </button>
                    ))}
                </div>
             </div>
          )}

          {/* STEP 2: Modern PIN Keypad */}
          {step === 'pin' && (
             <div className="space-y-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="text-center">
                    <button 
                        onClick={() => setStep('cashier')}
                        className="mb-4 inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                    >
                        <ArrowLeft size={14} /> Back to Cashiers
                    </button>
                    <h4 className="text-white font-black text-xl">{selectedCashier.name}</h4>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Enter your 4-digit PIN</p>
                </div>

                {/* PIN Dots Display */}
                <div className={`flex justify-center gap-4 ${pinError ? 'animate-shake' : ''}`}>
                    {[0, 1, 2, 3].map(i => (
                        <div key={i} className={`size-5 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-primary-500 border-primary-500 shadow-[0_0_15px_rgba(245,158,11,0.5)]' : 'border-slate-800 bg-slate-950'}`}></div>
                    ))}
                </div>

                {pinError && <p className="text-center text-red-500 text-[10px] font-black uppercase tracking-widest animate-pulse">Incorrect PIN</p>}

                {/* Keypad Grid */}
                <div className="grid grid-cols-3 gap-3 max-w-[280px] mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(num => (
                        <button 
                            key={num} 
                            onClick={() => handleKeyPress(num.toString())}
                            className="size-16 sm:size-20 rounded-full bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 text-white text-2xl font-black transition-all active:scale-90 flex items-center justify-center"
                        >
                            {num}
                        </button>
                    ))}
                    <div className="size-16 sm:size-20"></div>
                    <button 
                        onClick={() => handleKeyPress('0')}
                        className="size-16 sm:size-20 rounded-full bg-slate-800/50 hover:bg-slate-700 border border-slate-700/50 text-white text-2xl font-black transition-all active:scale-90 flex items-center justify-center"
                    >
                        0
                    </button>
                    <button 
                        onClick={handleBackspace}
                        className="size-16 sm:size-20 rounded-full bg-slate-900 border border-slate-800 text-slate-500 hover:text-red-400 transition-all active:scale-90 flex items-center justify-center"
                    >
                        {/* Fixed: Used Delete icon from lucide-react instead of non-existent Backspace icon */}
                        <Delete size={28} />
                    </button>
                </div>
             </div>
          )}

          {/* STEP 3: Starting Cash */}
          {step === 'cash' && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                <div className="text-center">
                    <button 
                        onClick={() => setStep(selectedCashier.requiresPin ? 'pin' : 'cashier')}
                        className="mb-4 inline-flex items-center gap-2 text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                    >
                        <ArrowLeft size={14} /> Back
                    </button>
                    <h4 className="text-white font-black text-xl">Initial Cash Float</h4>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mt-1">Amount currently in drawer</p>
                </div>

                <div className="space-y-4">
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                            <span className="font-black text-2xl tracking-tighter">Rp</span>
                        </div>
                        <input 
                            type="number" 
                            value={startCash}
                            onChange={(e) => setStartCash(e.target.value)}
                            className="w-full bg-slate-950 border-2 border-slate-800 rounded-3xl h-24 pl-16 pr-8 text-4xl font-black text-white focus:outline-none focus:border-emerald-500 focus:ring-8 focus:ring-emerald-500/5 transition-all tabular-nums placeholder:text-slate-900"
                            placeholder="0"
                            autoFocus
                        />
                    </div>
                    
                    <div className="p-4 bg-slate-850/50 rounded-2xl border border-slate-800 flex items-center gap-4">
                        <div className="size-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500">
                            <Clock size={20} />
                        </div>
                        <div>
                            <p className="text-[9px] text-slate-600 font-bold uppercase tracking-widest leading-none mb-1">Session timestamp</p>
                            <p className="text-slate-400 text-sm font-bold tracking-tight">{new Date().toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}</p>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={() => onConfirmShift({ isOpen: true, cashierName: selectedCashier.name, startCash: parseInt(startCash) || 0, startTime: new Date() })}
                    disabled={!startCash}
                    className="w-full h-20 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-lg rounded-3xl shadow-2xl shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                >
                    <span>Activate Terminal</span>
                    <CheckCircle2 size={24} />
                </button>
             </div>
          )}

          {/* CLOSE SHIFT LOGIC (unchanged for stability) */}
          {isShiftOpen && (
             <div className="space-y-6">
                 {/* Summary views and Reconciliation... */}
                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Total Sales</p>
                        <p className="text-2xl font-black text-primary-500 tracking-tighter tabular-nums">{formatCurrency(shiftData.expectedCash)}</p>
                    </div>
                    <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6">
                        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-2">Drawer Start</p>
                        <p className="text-2xl font-black text-slate-400 tracking-tighter tabular-nums">{formatCurrency(shiftData.startCash)}</p>
                    </div>
                 </div>

                 <button 
                    onClick={() => onConfirmShift({ isOpen: false })}
                    className="w-full h-20 bg-red-500 hover:bg-red-400 text-white font-black text-lg rounded-3xl shadow-2xl shadow-red-500/20 active:scale-[0.98] transition-all uppercase tracking-[0.2em] flex items-center justify-center gap-3"
                 >
                    <span>Finalize Session</span>
                    <Receipt size={24} />
                 </button>
             </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-6 text-center border-t border-slate-800 bg-slate-900/50 shrink-0">
             <p className="text-slate-600 text-[9px] font-black uppercase tracking-[0.3em]">
                Secure Session Environment &bull; ElegantPOS v2.4
             </p>
        </div>
      </div>
    </div>
  );
};

export default ShiftModal;
