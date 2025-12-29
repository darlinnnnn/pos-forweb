import React, { useState, useEffect } from 'react';
import { Product, OptionGroup, ProductOption, SelectedOption } from '../types';
import { X, Check, Minus, Plus, ShoppingBag, ArrowRight, ArrowLeft, AlignLeft, ChevronDown, CheckCircle2, Settings2, PlusCircle, Layers } from 'lucide-react';

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (product: Product, selectedOptions: SelectedOption[], quantity: number, notes: string) => void;
}

const VariantModal: React.FC<VariantModalProps> = ({ isOpen, onClose, product, onAddToCart }) => {
  const [selections, setSelections] = useState<Record<string, ProductOption[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  const optionGroups = product?.optionGroups || [];
  const totalSteps = optionGroups.length + 1;
  const isFinalStep = currentStep === optionGroups.length;
  const activeGroup = optionGroups[currentStep];

  useEffect(() => {
    if (isOpen && product) {
      const initialSelections: Record<string, ProductOption[]> = {};
      product.optionGroups?.forEach(group => {
         if (group.min === 1 && group.max === 1 && group.options.length > 0) {
            initialSelections[group.id] = [group.options[0]];
         } else {
            initialSelections[group.id] = [];
         }
      });
      setSelections(initialSelections);
      setQuantity(1);
      setNotes('');
      setCurrentStep(0);
      setIsNotesOpen(false);
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleToggleOption = (group: OptionGroup, option: ProductOption) => {
    setSelections(prev => {
        const currentSelected = prev[group.id] || [];
        const isSelected = currentSelected.some(item => item.id === option.id);
        
        if (group.max === 1) {
            return { ...prev, [group.id]: [option] };
        } else {
            if (isSelected) {
                return { ...prev, [group.id]: currentSelected.filter(item => item.id !== option.id) };
            } else {
                if (group.max > 0 && currentSelected.length >= group.max) return prev;
                return { ...prev, [group.id]: [...currentSelected, option] };
            }
        }
    });
  };

  const calculateBaseTotal = () => {
    const basePrice = product.price;
    let addonsPrice = 0;
    Object.values(selections).forEach((options: ProductOption[]) => {
        options.forEach(opt => addonsPrice += opt.price);
    });
    return basePrice + addonsPrice;
  };

  const calculateFinalTotal = () => calculateBaseTotal() * quantity;

  const isCurrentStepValid = () => {
      if (isFinalStep) return true;
      const group = optionGroups[currentStep];
      const selectedCount = selections[group.id]?.length || 0;
      return selectedCount >= group.min;
  };

  const handleNext = () => {
      if (isCurrentStepValid()) {
          setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
      }
  };

  const handleBack = () => {
      setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleAddToCart = () => {
    const flattenedOptions: SelectedOption[] = [];
    product.optionGroups?.forEach(group => {
        const groupSelections = selections[group.id] || [];
        groupSelections.forEach(opt => {
            flattenedOptions.push({ ...opt, groupId: group.id, groupName: group.name });
        });
    });
    onAddToCart(product, flattenedOptions, quantity, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/80 backdrop-blur-md p-0 sm:p-4 animate-in fade-in duration-300">
      {/* Background overlay click handler */}
      <div className="absolute inset-0" onClick={onClose}></div>
      
      {/* Container: Bottom Sheet on Mobile, Modal on Tablet/Desktop */}
      <div className="relative bg-slate-900 border-x sm:border border-slate-800 rounded-t-[3rem] sm:rounded-[2.5rem] w-full max-w-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom duration-500 flex flex-col h-[92vh] sm:h-auto sm:max-h-[85vh]">
        
        {/* Drag Handle (Mobile Only) */}
        <div className="w-full flex justify-center pt-3 pb-1 sm:hidden shrink-0">
          <div className="w-12 h-1.5 bg-slate-800 rounded-full"></div>
        </div>

        {/* Progress Header */}
        <div className="shrink-0 pt-4 sm:pt-8 px-6 sm:px-8 pb-4 bg-slate-900/50 border-b border-slate-800/50 backdrop-blur-md">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-4">
                    <div className="size-12 sm:size-14 rounded-2xl bg-cover bg-center border border-slate-700 shadow-xl" style={{ backgroundImage: `url('${product.image}')` }}></div>
                    <div>
                        <h2 className="text-lg sm:text-xl font-black text-white leading-tight tracking-tight">{product.name}</h2>
                        <span className="text-primary-500 font-black font-mono text-xs">{formatCurrency(product.price)}</span>
                    </div>
                </div>
                <button onClick={onClose} className="size-10 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center active:scale-90"><X size={20} /></button>
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center gap-3">
                <div className="flex-1 flex gap-1.5 h-1.5">
                    {Array.from({ length: totalSteps }).map((_, idx) => (
                        <div key={idx} className={`flex-1 rounded-full transition-all duration-700 ${idx <= currentStep ? 'bg-primary-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-800'}`}></div>
                    ))}
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">{currentStep + 1} / {totalSteps}</span>
            </div>
        </div>

        {/* Paginated Content Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 scroll-smooth no-scrollbar pb-32">
            
            {!isFinalStep ? (
                /* STEP PAGE: Selection Group */
                <div key={activeGroup.id} className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-500">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className={`p-2.5 rounded-xl ${activeGroup.min > 0 ? 'bg-primary-500 text-slate-950 shadow-lg shadow-primary-500/20' : 'bg-slate-800 text-slate-400'}`}>
                                {activeGroup.min > 0 ? <Settings2 size={20} /> : <PlusCircle size={20} />}
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">{activeGroup.name}</h3>
                        </div>
                        <p className="text-sm text-slate-500 font-bold uppercase tracking-wider ml-12">
                            {activeGroup.min > 0 ? `Must select at least ${activeGroup.min}` : 'Enhance your order (Optional)'}
                        </p>
                    </div>

                    {activeGroup.min > 0 ? (
                        /* VARIANT GRID: For core choices */
                        <div className="grid grid-cols-2 gap-3">
                            {activeGroup.options.map(option => {
                                const isSelected = selections[activeGroup.id]?.some(s => s.id === option.id);
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => handleToggleOption(activeGroup, option)}
                                        className={`
                                            relative p-5 rounded-[2rem] border-2 text-center transition-all duration-300 flex flex-col items-center justify-center gap-2 active:scale-95 min-h-[120px]
                                            ${isSelected 
                                                ? 'bg-primary-500/10 border-primary-500 ring-4 ring-primary-500/10 shadow-lg shadow-primary-500/5' 
                                                : 'bg-slate-850/40 border-slate-800 hover:border-slate-600 hover:bg-slate-800/60'}
                                        `}
                                    >
                                        <span className={`text-base font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-400'}`}>{option.name}</span>
                                        <span className={`text-[10px] font-black font-mono tracking-tighter ${isSelected ? 'text-primary-400' : 'text-slate-600'}`}>
                                            {option.price === 0 ? 'INCLUDED' : `+ ${formatCurrency(option.price)}`}
                                        </span>
                                        {isSelected && (
                                            <div className="absolute top-4 right-4 text-primary-500 animate-in zoom-in duration-300">
                                                <CheckCircle2 size={18} strokeWidth={3} />
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ) : (
                        /* ADD-ON LIST: For extras */
                        <div className="space-y-3">
                            {activeGroup.options.map(option => {
                                const isSelected = selections[activeGroup.id]?.some(s => s.id === option.id);
                                return (
                                    <button
                                        key={option.id}
                                        onClick={() => handleToggleOption(activeGroup, option)}
                                        className={`
                                            w-full p-5 rounded-[1.75rem] border-2 text-left transition-all duration-300 flex items-center justify-between group active:scale-[0.98]
                                            ${isSelected 
                                                ? 'bg-primary-500/5 border-primary-500 shadow-xl shadow-primary-500/5' 
                                                : 'bg-slate-950/40 border-slate-800 hover:border-slate-700'}
                                        `}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={`size-11 rounded-2xl flex items-center justify-center transition-all ${isSelected ? 'bg-primary-500 text-slate-950 scale-110' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>
                                                {isSelected ? <Check size={20} strokeWidth={4} /> : <Plus size={20} />}
                                            </div>
                                            <div>
                                                <span className={`block font-bold text-base ${isSelected ? 'text-white' : 'text-slate-400'}`}>{option.name}</span>
                                                <span className={`text-[11px] font-black font-mono tracking-tighter ${isSelected ? 'text-primary-400' : 'text-slate-600'}`}>
                                                    {option.price === 0 ? 'FREE' : `+ ${formatCurrency(option.price)}`}
                                                </span>
                                            </div>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>
            ) : (
                /* FINAL STEP: Review & Quantity */
                <div className="space-y-8 animate-in slide-in-from-right-8 fade-in duration-500">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <div className="p-2.5 rounded-xl bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20">
                                <CheckCircle2 size={20} />
                            </div>
                            <h3 className="text-2xl font-black text-white tracking-tight">Review Order</h3>
                        </div>
                        
                        <div className="bg-slate-800/40 rounded-[2.5rem] p-6 sm:p-8 border border-slate-800 space-y-4 shadow-inner">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-slate-800 pb-3">Selection Details</h4>
                            <div className="space-y-3">
                                <div className="flex justify-between text-sm">
                                    <span className="text-slate-400 font-medium italic">Base Unit Price</span>
                                    <span className="text-slate-200 font-mono">{formatCurrency(product.price)}</span>
                                </div>
                                {Object.entries(selections).map(([groupId, selectedOps]: [string, ProductOption[]]) => {
                                    return selectedOps.map(op => (
                                         <div key={op.id} className="flex justify-between text-sm animate-in fade-in duration-300">
                                            <span className="text-slate-300 pl-4 border-l-2 border-primary-500/40 font-bold">{op.name}</span>
                                            <span className="text-slate-500 font-mono">+{formatCurrency(op.price)}</span>
                                         </div>
                                    ));
                                })}
                            </div>
                            <div className="border-t border-slate-800 pt-5 flex justify-between font-black text-white items-center">
                                <span className="text-xs uppercase tracking-widest text-slate-500">Unit Calculated</span>
                                <span className="text-2xl text-primary-400 tracking-tighter tabular-nums">{formatCurrency(calculateBaseTotal())}</span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-5">
                        <div className="flex items-center justify-between px-2">
                            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Quantity</h4>
                            <div className="flex items-center bg-slate-950 rounded-2xl border border-slate-800 p-2 shadow-inner">
                                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="size-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all active:scale-90"><Minus size={20} /></button>
                                <span className="w-16 text-center text-2xl font-black text-white tabular-nums">{quantity}</span>
                                <button onClick={() => setQuantity(quantity + 1)} className="size-11 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all active:scale-90"><Plus size={20} /></button>
                            </div>
                        </div>

                        <div className={`rounded-[2.25rem] border transition-all duration-500 ${isNotesOpen ? 'bg-slate-800/40 border-slate-700 shadow-lg' : 'bg-slate-900 border-slate-800'}`}>
                            <button onClick={() => setIsNotesOpen(!isNotesOpen)} className="w-full flex items-center justify-between p-6 group">
                                <div className="flex items-center gap-4 text-left">
                                    <div className={`size-11 rounded-2xl flex items-center justify-center transition-all ${notes ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 scale-110' : 'bg-slate-800 text-slate-500'}`}>
                                        <AlignLeft size={20} />
                                    </div>
                                    <div>
                                        <span className="block text-sm font-black text-white tracking-tight uppercase">Order Notes</span>
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5">{notes ? 'Request recorded' : 'Allergies? Less ice? Let us know.'}</span>
                                    </div>
                                </div>
                                <ChevronDown size={20} className={`text-slate-600 transition-transform duration-500 ${isNotesOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isNotesOpen && (
                                <div className="px-6 pb-6 animate-in slide-in-from-top-2 duration-300">
                                    <textarea 
                                        autoFocus 
                                        value={notes} 
                                        onChange={(e) => setNotes(e.target.value)} 
                                        className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-primary-500 transition-all h-32 resize-none placeholder:text-slate-800 font-medium" 
                                        placeholder="Add instructions for the kitchen..."
                                    />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>

        {/* Action Footer Navigation - Sticky at bottom */}
        <div className="absolute bottom-0 inset-x-0 p-6 sm:p-8 border-t border-slate-800 bg-slate-900/95 backdrop-blur-xl flex gap-4 z-20">
           {currentStep > 0 && (
               <button onClick={handleBack} className="size-16 rounded-3xl border border-slate-800 text-slate-400 hover:text-white hover:border-slate-600 transition-all flex items-center justify-center shrink-0 active:scale-90 bg-slate-900 shadow-xl"><ArrowLeft size={28} /></button>
           )}

           {!isFinalStep ? (
               <button 
                 onClick={handleNext} 
                 disabled={!isCurrentStepValid()} 
                 className={`
                    flex-1 h-16 rounded-3xl text-base font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-[0.98]
                    ${isCurrentStepValid() 
                        ? 'bg-white text-slate-950 shadow-2xl shadow-white/5' 
                        : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed'}
                 `}
               >
                   Next Stage <ArrowRight size={22} />
               </button>
           ) : (
               <button 
                 onClick={handleAddToCart} 
                 className="flex-1 h-16 rounded-3xl font-black text-base flex items-center justify-between px-8 transition-all bg-primary-500 hover:bg-primary-400 text-slate-950 shadow-2xl shadow-primary-500/30 active:scale-[0.98]"
               >
                   <span className="flex items-center gap-4"><ShoppingBag size={24} /> Add to Order</span>
                   <div className="flex flex-col items-end border-l border-slate-950/20 pl-6">
                        <span className="text-[10px] font-black uppercase opacity-60 tracking-widest leading-none mb-1">Total Bill</span>
                        <span className="text-xl font-mono tracking-tighter leading-none">{formatCurrency(calculateFinalTotal())}</span>
                   </div>
               </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default VariantModal;