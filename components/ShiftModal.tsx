import React, { useState, useEffect, useRef } from 'react';
import { ShiftData } from '../types';
import { X, DollarSign, User, Clock, Calculator, AlertCircle, CheckCircle2, Receipt, CreditCard, Smartphone, Wallet, ChevronDown, Check, Tag } from 'lucide-react';

interface ShiftModalProps {
  isOpen: boolean;
  onClose: () => void;
  shiftData: ShiftData;
  onConfirmShift: (data: Partial<ShiftData>) => void;
}

const ShiftModal: React.FC<ShiftModalProps> = ({ isOpen, onClose, shiftData, onConfirmShift }) => {
  const [step, setStep] = useState<'input' | 'summary'>('input');
  
  // Open Shift State
  const [selectedCashier, setSelectedCashier] = useState('Sarah J.');
  const [startCash, setStartCash] = useState<string>('');
  
  // Dropdown State
  const [isCashierDropdownOpen, setIsCashierDropdownOpen] = useState(false);
  const cashierDropdownRef = useRef<HTMLDivElement>(null);
  
  const cashierOptions = [
    { name: 'Sarah J.', id: '8821' },
    { name: 'Budi S.', id: '9912' },
    { name: 'Admin', id: 'ADM-001' }
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (cashierDropdownRef.current && !cashierDropdownRef.current.contains(event.target as Node)) {
        setIsCashierDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);
  
  // Close Shift State
  const [actualCash, setActualCash] = useState<string>('');
  const [expenses, setExpenses] = useState<string>(''); // New: Operational Expenses
  const [notes, setNotes] = useState('');

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setStartCash('');
      setActualCash('');
      setExpenses('');
      setNotes('');
      // Pre-fill existing data if needed
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const isShiftOpen = shiftData.isOpen;
  
  // Mock Payment Breakdown for Closing Shift
  const paymentBreakdown = [
    { method: 'Cash', count: 12, total: shiftData.expectedCash, icon: <DollarSign size={16} /> },
    { method: 'Debit/Credit Card', count: 8, total: 2450000, icon: <CreditCard size={16} /> },
    { method: 'QRIS / E-Wallet', count: 15, total: 1850000, icon: <Smartphone size={16} /> },
  ];

  const totalRevenue = paymentBreakdown.reduce((acc, curr) => acc + curr.total, 0);
  
  // Calculation Logic
  const expenseAmount = parseInt(expenses) || 0;
  // Expected Cash in Drawer = (Start Cash + Cash Sales) - Expenses
  // Assuming shiftData.expectedCash represents (Start Cash + Cash Sales) as per previous context
  const netExpectedCash = shiftData.expectedCash - expenseAmount;
  const cashDifference = (parseInt(actualCash) || 0) - netExpectedCash;

  // Mock Discount Statistic for Owner View
  const mockTotalDiscount = 450000;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleConfirm = () => {
    if (!isShiftOpen) {
      // Opening Shift Logic
      onConfirmShift({
        isOpen: true,
        cashierName: selectedCashier,
        startCash: parseInt(startCash) || 0,
        startTime: new Date(),
      });
    } else {
      // Closing Shift Logic
      onConfirmShift({
        isOpen: false,
        cashExpenses: expenseAmount,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50">
          <div>
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              {!isShiftOpen ? (
                <>
                  <CheckCircle2 size={22} className="text-emerald-500" />
                  Open Register Shift
                </>
              ) : (
                <>
                  <X size={22} className="text-red-500" />
                  Close Register Shift
                </>
              )}
            </h3>
            <p className="text-sm text-slate-400 mt-1">
              {!isShiftOpen ? 'Start a new sales session' : 'Reconcile cash and end session'}
            </p>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* ================= OPEN SHIFT VIEW ================= */}
          {!isShiftOpen && (
            <>
              {/* Cashier Selection (Custom Dropdown) */}
              <div className="space-y-2 relative" ref={cashierDropdownRef}>
                <label className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Select Cashier</label>
                
                <button 
                    onClick={() => setIsCashierDropdownOpen(!isCashierDropdownOpen)}
                    className={`
                        w-full bg-slate-950 border rounded-xl h-12 pl-3 pr-4 text-white flex items-center justify-between transition-all focus:outline-none focus:ring-1 focus:ring-primary-500
                        ${isCashierDropdownOpen ? 'border-primary-500 ring-1 ring-primary-500' : 'border-slate-700 hover:border-slate-600'}
                    `}
                >
                    <div className="flex items-center gap-3">
                        <div className="text-slate-500">
                            <User size={18} />
                        </div>
                        <span className="font-medium">{selectedCashier}</span>
                    </div>
                    <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${isCashierDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {isCashierDropdownOpen && (
                    <div className="absolute z-20 w-full mt-1 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <ul className="py-1">
                            {cashierOptions.map((cashier) => (
                                <li key={cashier.id}>
                                    <button
                                        onClick={() => {
                                            setSelectedCashier(cashier.name);
                                            setIsCashierDropdownOpen(false);
                                        }}
                                        className={`w-full text-left px-4 py-3 text-sm flex items-center justify-between hover:bg-slate-700 hover:text-white transition-colors
                                            ${selectedCashier === cashier.name ? 'bg-slate-700/50 text-emerald-400 font-medium' : 'text-slate-300'}
                                        `}
                                    >
                                        <div className="flex items-center gap-2">
                                            {selectedCashier === cashier.name && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>}
                                            <span>{cashier.name} <span className="text-slate-500 text-xs ml-1">(ID: {cashier.id})</span></span>
                                        </div>
                                        {selectedCashier === cashier.name && <Check size={16} />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
              </div>

              {/* Starting Cash Input */}
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Starting Cash (Float)</label>
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-emerald-500 transition-colors">
                      <span className="font-bold text-lg">Rp</span>
                   </div>
                   <input 
                      type="number" 
                      value={startCash}
                      onChange={(e) => setStartCash(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl h-14 pl-10 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 placeholder:text-slate-700 transition-all"
                      placeholder="0"
                      autoFocus
                   />
                </div>
                <p className="text-xs text-slate-500 flex items-center gap-1">
                  <AlertCircle size={12} />
                  Enter the total amount of cash currently in the drawer.
                </p>
              </div>

              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 flex items-center gap-4">
                 <div className="p-3 bg-slate-800 rounded-lg text-slate-400">
                    <Clock size={20} />
                 </div>
                 <div>
                    <p className="text-xs text-slate-400 font-semibold uppercase">Current Time</p>
                    <p className="text-white font-mono font-medium">{new Date().toLocaleString('id-ID', { dateStyle: 'full', timeStyle: 'short' })}</p>
                 </div>
              </div>
            </>
          )}

          {/* ================= CLOSE SHIFT VIEW ================= */}
          {isShiftOpen && (
            <>
              {/* Summary Cards - Combined for Mobile Efficiency */}
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 grid grid-cols-2 divide-x divide-slate-700">
                 <div className="p-4 flex flex-col justify-center">
                    <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase mb-1">Total Revenue</p>
                    <p className="text-lg sm:text-2xl font-bold text-primary-400 tracking-tight leading-none">{formatCurrency(totalRevenue)}</p>
                 </div>
                 
                 <div className="p-4 flex flex-col justify-center bg-slate-800/30">
                    <div className="flex items-center gap-1.5 mb-1">
                        <Tag size={12} className="text-red-400" />
                        <p className="text-[10px] sm:text-xs text-slate-500 font-bold uppercase">Discounts</p>
                    </div>
                    <p className="text-lg sm:text-xl font-bold text-red-400 tracking-tight leading-none">{formatCurrency(mockTotalDiscount)}</p>
                 </div>
              </div>

               {/* Expenses Input */}
               <div className="space-y-2 pt-2">
                <label className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Cash Drops / Expenses</label>
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500 group-focus-within:text-amber-500 transition-colors">
                      <span className="font-bold text-lg">- Rp</span>
                   </div>
                   <input 
                      type="number" 
                      value={expenses}
                      onChange={(e) => setExpenses(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl h-12 pl-12 pr-4 text-xl font-bold text-amber-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder:text-slate-800 transition-all"
                      placeholder="0"
                   />
                </div>
                 {expenseAmount > 0 && (
                    <div className="flex justify-end">
                         <span className="text-xs text-slate-400">
                            Expected in Drawer: <span className="text-white font-bold">{formatCurrency(netExpectedCash)}</span>
                         </span>
                    </div>
                )}
              </div>

              {/* Actual Cash Input */}
              <div className="space-y-3 pt-2 border-t border-slate-800">
                <label className="text-sm font-semibold text-slate-300 uppercase tracking-wide flex justify-between">
                   <span>Actual Cash Count</span>
                   {parseInt(actualCash) > 0 && (
                     <span className={`text-xs font-bold ${cashDifference === 0 ? 'text-emerald-500' : cashDifference > 0 ? 'text-blue-400' : 'text-red-400'}`}>
                        {cashDifference === 0 ? 'Perfect Match' : cashDifference > 0 ? `+${formatCurrency(cashDifference)}` : formatCurrency(cashDifference)}
                     </span>
                   )}
                </label>
                <div className="relative group">
                   <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-500 transition-colors">
                      <span className="font-bold text-xl">Rp</span>
                   </div>
                   <input 
                      type="number" 
                      value={actualCash}
                      onChange={(e) => setActualCash(e.target.value)}
                      className={`w-full bg-slate-950 border rounded-2xl h-16 pl-12 pr-4 text-3xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 transition-all placeholder:text-slate-800
                        ${cashDifference < 0 && actualCash ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500' : 
                          cashDifference > 0 ? 'border-blue-500/50 focus:border-blue-500 focus:ring-blue-500' : 
                          'border-slate-700 focus:border-primary-500 focus:ring-primary-500'}
                      `}
                      placeholder="0"
                      autoFocus
                   />
                </div>
              </div>

              {/* Payment Method Breakdown */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest border-b border-slate-800 pb-2">Payment Details</h4>
                <div className="space-y-2">
                    {paymentBreakdown.map((payment, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-800/30 hover:bg-slate-800/50 transition-colors border border-transparent hover:border-slate-700">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-slate-800 rounded-md text-slate-400">
                                    {payment.icon}
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-slate-200">{payment.method}</p>
                                    <p className="text-xs text-slate-500">{payment.count} Transactions</p>
                                </div>
                            </div>
                            <p className="font-mono font-medium text-white">{formatCurrency(payment.total)}</p>
                        </div>
                    ))}
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-2">
                 <label className="text-xs font-semibold text-slate-400 uppercase">Shift Notes</label>
                 <textarea 
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary-500 transition-colors h-20 resize-none"
                    placeholder="Reason for expenses or discrepancies..."
                 />
              </div>
            </>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900 z-10">
          <button 
            onClick={handleConfirm}
            disabled={!isShiftOpen && !startCash} 
            className={`w-full h-12 rounded-xl font-bold text-slate-900 shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
              ${!isShiftOpen 
                ? 'bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20' 
                : 'bg-red-500 hover:bg-red-400 shadow-red-500/20'}
            `}
          >
            {!isShiftOpen ? (
                <>
                    <CheckCircle2 size={20} />
                    Start Shift
                </>
            ) : (
                <>
                    <Receipt size={20} />
                    Close Shift & Print Report
                </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};

export default ShiftModal;