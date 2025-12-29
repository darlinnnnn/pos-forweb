import React, { useState, useEffect } from 'react';
import { Product, OptionGroup, ProductOption, SelectedOption } from '../types';
import { X, Check, Minus, Plus, ShoppingBag, ArrowRight, ArrowLeft, AlignLeft, ChevronDown, CheckCircle2, Settings2, PlusCircle } from 'lucide-react';

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
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-slate-950/90 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in duration-300">
      <div className="absolute inset-0" onClick={onClose}></div>
      
      <div className="relative bg-slate-900 border-t sm:border border-slate-800 rounded-t-[2.5rem] sm:rounded-[2.5rem] w-full max-w-xl shadow-2xl animate-in slide-in-from-bottom duration-500 flex flex-col h-[94vh] sm:h-auto sm:max-h-[85vh] overflow-hidden transform-gpu">
        
        {/* Header - Fixed height */}
        <div className="shrink-0 pt-6 sm:pt-8 px-6 sm:px-8 pb-4 bg-slate-900/80 border-b border-slate-800/50">
            <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-4">
                    <div className="size-12 sm:size-14 rounded-2xl bg-cover bg-center border border-slate-700" style={{ backgroundImage: `url('${product.image}')` }}></div>
                    <div className="min-w-0">
                        <h2 className="text-lg sm:text-xl font-bold text-white leading-tight tracking-tight truncate pr-2">{product.name}</h2>
                        <span className="text-primary-500 font-black text-sm tabular-nums">{formatCurrency(product.price)}</span>
                    </div>
                </div>
                <button onClick={onClose} className="size-10 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all flex items-center justify-center active:scale-90"><X size={20} /></button>
            </div>

            {/* Steps Indicator */}
            <div className="flex items-center gap-3">
                <div className="flex-1 flex gap-1.5 h-1.5">
                    {Array.from({ length: totalSteps }).map((_, idx) => (
                        <div key={idx} className={`flex-1 rounded-full transition-all duration-500 ${idx <= currentStep ? 'bg-primary-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-slate-800'}`}></div>
                    ))}
                </div>
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest tabular-nums">{currentStep + 1} / {totalSteps}</span>
            </div>
        </div>

        {/* Content Body - Scrollable */}
        <div className="flex-1 overflow-y-auto px-6 sm:px-8 py-6 no-scrollbar pb-32 scroll-container transform-gpu">
            {!isFinalStep ? (
                <div key={activeGroup.id} className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-white tracking-tight">{activeGroup.name}</h3>
                            <div className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${activeGroup.min > 0 ? 'bg-primary-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}>
                                {activeGroup.min > 0 ? 'REQUIRED' : 'OPTIONAL'}
                            </div>
                        </div>
                        <p className="text-xs text-slate-500 font-medium">
                            {activeGroup.min > 0 ? `Please select at least ${activeGroup.min}` : 'Enhance your selection'}
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        {activeGroup.options.map(option => {
                            const isSelected = selections[activeGroup.id]?.some(s => s.id === option.id);
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleToggleOption(activeGroup, option)}
                                    className={`
                                        relative p-4 rounded-2xl border-2 text-center transition-all flex flex-col items-center justify-center gap-1 active:scale-95 min-h-[90px]
                                        ${isSelected 
                                            ? 'bg-primary-500/10 border-primary-500 shadow-lg shadow-primary-500/5' 
                                            : 'bg-slate-850/40 border-slate-800 hover:border-slate-700 hover:bg-slate-800'}
                                    `}
                                >
                                    <span className={`text-sm font-bold leading-tight ${isSelected ? 'text-white' : 'text-slate-400'}`}>{option.name}</span>
                                    {option.price > 0 && (
                                        <span className={`text-[10px] font-black tabular-nums ${isSelected ? 'text-primary-400' : 'text-slate-600'}`}>
                                            + {formatCurrency(option.price)}
                                        </span>
                                    )}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 text-primary-500 animate-in zoom-in duration-300">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in slide-in-from-right-4 fade-in duration-300 pb-8">
                    {/* Summary Card */}
                    <div className="bg-slate-850/50 rounded-3xl p-6 border border-slate-800 space-y-4 shadow-inner">
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Base Unit Price</span>
                                <span className="text-slate-300 tabular-nums">{formatCurrency(product.price)}</span>
                            </div>
                            {Object.entries(selections).map(([groupId, selectedOps]: [string, ProductOption[]]) => {
                                return selectedOps.map(op => (
                                     <div key={op.id} className="flex justify-between text-xs animate-in fade-in">
                                        <span className="text-slate-200 border-l-2 border-primary-500 pl-3 font-medium">{op.name}</span>
                                        <span className="text-slate-500 tabular-nums">+{formatCurrency(op.price)}</span>
                                     </div>
                                ));
                            })}
                        </div>
                        <div className="border-t border-slate-800 pt-4 flex justify-between items-center">
                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Unit Calculated</span>
                            <span className="text-2xl font-black text-primary-500 tracking-tighter tabular-nums">{formatCurrency(calculateBaseTotal())}</span>
                        </div>
                    </div>

                    {/* Quantity Selector */}
                    <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Quantity</span>
                            <span className="text-white font-bold">Items to add</span>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-800 p-1 rounded-xl border border-slate-700">
                            <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="size-10 flex items-center justify-center text-slate-400 hover:text-white rounded-lg active:scale-90 transition-all"><Minus size={18} /></button>
                            <span className="w-8 text-center text-xl font-black text-white tabular-nums">{quantity}</span>
                            <button onClick={() => setQuantity(quantity + 1)} className="size-10 flex items-center justify-center text-slate-400 hover:text-white rounded-lg active:scale-90 transition-all"><Plus size={18} /></button>
                        </div>
                    </div>

                    {/* Order Notes Accordion */}
                    <div className={`rounded-2xl border transition-all ${isNotesOpen ? 'bg-slate-800/40 border-slate-700' : 'bg-slate-900 border-slate-800'}`}>
                        <button onClick={() => setIsNotesOpen(!isNotesOpen)} className="w-full flex items-center justify-between p-5">
                            <div className="flex items-center gap-3">
                                <div className={`size-10 rounded-xl flex items-center justify-center ${notes ? 'bg-primary-500 text-slate-950 shadow-lg' : 'bg-slate-800 text-slate-500'}`}>
                                    <AlignLeft size={18} />
                                </div>
                                <div className="text-left">
                                    <span className="block text-sm font-bold text-white">Order Notes</span>
                                    <p className="text-[10px] text-slate-500 font-medium uppercase truncate w-40">{notes ? 'Notes added' : 'Special requests...'}</p>
                                </div>
                            </div>
                            <ChevronDown size={18} className={`text-slate-600 transition-transform ${isNotesOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isNotesOpen && (
                            <div className="px-5 pb-5 animate-in slide-in-from-top-1">
                                <textarea 
                                    autoFocus 
                                    value={notes} 
                                    onChange={(e) => setNotes(e.target.value)} 
                                    className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary-500 h-24 resize-none font-medium" 
                                    placeholder="e.g. Less ice, separate sugar..."
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

        {/* Action Footer - Sticky and Safe Area Ready */}
        <div className="shrink-0 p-6 sm:p-8 border-t border-slate-800 bg-slate-900/95 backdrop-blur-lg flex gap-3 pb-safe z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
           {currentStep > 0 && (
               <button onClick={handleBack} className="size-14 rounded-2xl border border-slate-800 text-slate-400 hover:text-white transition-all flex items-center justify-center shrink-0 active:scale-95 bg-slate-900"><ArrowLeft size={24} /></button>
           )}

           {!isFinalStep ? (
               <button 
                 onClick={handleNext} 
                 disabled={!isCurrentStepValid()} 
                 className={`
                    flex-1 h-14 rounded-2xl text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-[0.98]
                    ${isCurrentStepValid() 
                        ? 'bg-white text-slate-950 shadow-xl' 
                        : 'bg-slate-800 text-slate-600 opacity-50 cursor-not-allowed'}
                 `}
               >
                   Next <ArrowRight size={20} />
               </button>
           ) : (
               <button 
                 onClick={handleAddToCart} 
                 className="flex-1 h-14 rounded-2xl font-black text-sm flex items-center justify-between px-6 transition-all bg-primary-500 hover:bg-primary-400 text-slate-950 shadow-xl shadow-primary-500/20 active:scale-[0.98]"
               >
                   <span className="flex items-center gap-3"><ShoppingBag size={20} /> Add to Order</span>
                   <div className="flex flex-col items-end border-l border-slate-950/20 pl-4">
                        <span className="text-[8px] font-black uppercase opacity-60 leading-none mb-0.5">Total Bill</span>
                        <span className="text-base font-black tabular-nums tracking-tighter leading-none">{formatCurrency(calculateFinalTotal())}</span>
                   </div>
               </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default VariantModal;