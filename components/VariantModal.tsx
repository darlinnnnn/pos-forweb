import React, { useState, useEffect } from 'react';
import { Product, OptionGroup, ProductOption, SelectedOption } from '../types';
import { X, Check, Minus, Plus, ShoppingBag, ArrowRight, ArrowLeft, AlignLeft, ChevronDown } from 'lucide-react';

interface VariantModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  onAddToCart: (product: Product, selectedOptions: SelectedOption[], quantity: number, notes: string) => void;
}

const VariantModal: React.FC<VariantModalProps> = ({ isOpen, onClose, product, onAddToCart }) => {
  // Store selections as map: groupId -> array of selected options
  const [selections, setSelections] = useState<Record<string, ProductOption[]>>({});
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');
  
  // Wizard State
  const [currentStep, setCurrentStep] = useState(0);
  
  // UI State
  const [isNotesOpen, setIsNotesOpen] = useState(false);

  // Reset and Initialize state
  useEffect(() => {
    if (isOpen && product) {
      const initialSelections: Record<string, ProductOption[]> = {};
      
      // Auto-select first option for required single-select groups
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

  const optionGroups = product.optionGroups || [];
  const totalSteps = optionGroups.length + 1; // Groups + Final Review Step
  const isFinalStep = currentStep === optionGroups.length;
  const currentGroup = !isFinalStep ? optionGroups[currentStep] : null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const handleToggleOption = (group: OptionGroup, option: ProductOption) => {
    setSelections(prev => {
        const currentSelected = prev[group.id] || [];
        const isSelected = currentSelected.some(item => item.id === option.id);
        
        // Logic for Single Select (Radio behavior)
        if (group.max === 1) {
            return {
                ...prev,
                [group.id]: [option]
            };
        } 
        
        // Logic for Multi Select (Checkbox behavior)
        else {
            if (isSelected) {
                return {
                    ...prev,
                    [group.id]: currentSelected.filter(item => item.id !== option.id)
                };
            } else {
                if (group.max > 0 && currentSelected.length >= group.max) {
                    return prev;
                }
                return {
                    ...prev,
                    [group.id]: [...currentSelected, option]
                };
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

  const calculateFinalTotal = () => {
      return calculateBaseTotal() * quantity;
  }

  // Check if current step is valid to proceed
  const isStepValid = () => {
      if (isFinalStep) return true;
      if (!currentGroup) return true;

      const count = selections[currentGroup.id]?.length || 0;
      return count >= currentGroup.min;
  };

  const handleNext = () => {
      if (isStepValid()) {
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
            flattenedOptions.push({
                ...opt,
                groupId: group.id,
                groupName: group.name
            });
        });
    });

    onAddToCart(product, flattenedOptions, quantity, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header with Progress */}
        <div className="relative bg-slate-800 shrink-0">
             {/* Background Image Blurred */}
             <div className="absolute inset-0 opacity-20 bg-cover bg-center blur-sm" style={{ backgroundImage: `url('${product.image}')` }}></div>
             <div className="absolute inset-0 bg-slate-900/60"></div>

             <div className="relative z-10 p-6 pb-4">
                 <div className="flex justify-between items-start mb-4">
                     <div>
                        <h2 className="text-xl font-bold text-white leading-tight">{product.name}</h2>
                        <p className="text-primary-400 font-bold font-mono text-sm mt-1">{formatCurrency(product.price)}</p>
                     </div>
                     <button 
                        onClick={onClose} 
                        className="p-2 bg-slate-950/50 hover:bg-slate-950 rounded-full text-slate-400 hover:text-white transition-colors"
                     >
                        <X size={20} />
                     </button>
                 </div>

                 {/* Progress Steps */}
                 <div className="flex gap-1.5 h-1.5">
                    {Array.from({ length: totalSteps }).map((_, idx) => (
                        <div 
                            key={idx}
                            className={`flex-1 rounded-full transition-all duration-300 ${idx <= currentStep ? 'bg-primary-500' : 'bg-slate-700'}`}
                        ></div>
                    ))}
                 </div>
                 <div className="flex justify-between items-center mt-2 text-xs font-medium text-slate-400">
                    <span>
                        {isFinalStep ? 'Review & Confirm' : `Step ${currentStep + 1}: ${currentGroup?.name}`}
                    </span>
                    <span>{currentStep + 1} / {totalSteps}</span>
                 </div>
             </div>
        </div>

        {/* Dynamic Content Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-900 relative">
            {!isFinalStep && currentGroup ? (
                <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300" key={currentStep}>
                    <div className="flex flex-col gap-1">
                        <h3 className="text-2xl font-bold text-white">Select {currentGroup.name}</h3>
                        <p className="text-sm text-slate-400">
                            {currentGroup.min === 1 && currentGroup.max === 1 ? 'Please select one option.' : 
                             currentGroup.min > 0 ? `Select at least ${currentGroup.min} option(s).` : 
                             'Optional additions.'}
                        </p>
                    </div>

                    {/* Options List - Uniform Layout for both Single and Multi Select */}
                    <div className="space-y-3">
                        {currentGroup.options.map(option => {
                            const isSelected = selections[currentGroup.id]?.some(s => s.id === option.id);
                            
                            return (
                                <button
                                    key={option.id}
                                    onClick={() => handleToggleOption(currentGroup, option)}
                                    className={`
                                        w-full group relative p-4 rounded-xl border-2 text-left transition-all duration-200 active:scale-[0.98] flex items-center justify-between
                                        ${isSelected 
                                            ? 'bg-slate-800 border-primary-500 shadow-[0_0_15px_rgba(245,158,11,0.15)] z-10' 
                                            : 'bg-slate-900/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800'}
                                    `}
                                >
                                    <div className="flex flex-col gap-1">
                                        <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-300'}`}>
                                            {option.name}
                                        </span>
                                        <span className={`text-xs font-mono ${isSelected ? 'text-primary-400' : 'text-slate-500'}`}>
                                            {option.price === 0 ? 'Free' : `+${formatCurrency(option.price)}`}
                                        </span>
                                    </div>
                                    
                                    {isSelected && (
                                        <div className="bg-primary-500 text-slate-900 rounded-full p-0.5 animate-in zoom-in duration-200">
                                            <Check size={14} strokeWidth={4} />
                                        </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            ) : (
                // Final Step: Review, Quantity, Notes
                <div className="space-y-6 animate-in slide-in-from-right-8 fade-in duration-300">
                     <div className="space-y-6">
                        {/* Summary of selections */}
                        <div className="bg-slate-800/50 rounded-2xl p-4 border border-slate-700/50 space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-slate-400">Base Price</span>
                                <span className="text-slate-200 font-mono">{formatCurrency(product.price)}</span>
                            </div>
                            {/* List modifiers */}
                            {Object.entries(selections).map(([groupId, selectedOps]: [string, ProductOption[]]) => {
                                if (selectedOps.length === 0) return null;
                                return selectedOps.map(op => (
                                     <div key={op.id} className="flex justify-between text-sm">
                                        <span className="text-slate-400 pl-3 border-l-2 border-slate-700">{op.name}</span>
                                        <span className="text-slate-200 font-mono">+{formatCurrency(op.price)}</span>
                                     </div>
                                ));
                            })}
                            <div className="border-t border-slate-700 pt-3 flex justify-between font-bold text-white">
                                <span>Unit Price</span>
                                <span className="text-primary-400">{formatCurrency(calculateBaseTotal())}</span>
                            </div>
                        </div>

                        {/* Notes Input Collapsible */}
                        <div className="border-t border-slate-800 pt-4">
                            <button 
                                onClick={() => setIsNotesOpen(!isNotesOpen)}
                                className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-slate-700/50 hover:bg-slate-800 transition-all group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${notes ? 'bg-primary-500 text-slate-900' : 'bg-slate-700 text-slate-400 group-hover:text-slate-200'}`}>
                                        <AlignLeft size={18} />
                                    </div>
                                    <div className="text-left">
                                        <span className={`block text-sm font-bold ${notes ? 'text-white' : 'text-slate-300'}`}>Special Instructions</span>
                                        {notes && <span className="text-xs text-primary-400 max-w-[200px] truncate block">{notes}</span>}
                                        {!notes && <span className="text-xs text-slate-500">Optional notes for kitchen</span>}
                                    </div>
                                </div>
                                <ChevronDown size={20} className={`text-slate-500 transition-transform duration-200 ${isNotesOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isNotesOpen && (
                                <div className="pt-3 animate-in slide-in-from-top-2 duration-200">
                                    <textarea 
                                        autoFocus
                                        value={notes}
                                        onChange={(e) => setNotes(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors h-24 resize-none placeholder:text-slate-600"
                                        placeholder="Any specific preferences? (e.g. less ice, extra spicy)"
                                    />
                                </div>
                            )}
                        </div>

                         {/* Quantity */}
                         <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between">
                            <span className="text-sm font-bold text-slate-300 uppercase tracking-wide">Quantity</span>
                            <div className="flex items-center bg-slate-950 rounded-xl border border-slate-700 p-1">
                                <button 
                                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                                    className="w-12 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <Minus size={20} />
                                </button>
                                <span className="w-14 text-center text-xl font-bold text-white tabular-nums">{quantity}</span>
                                <button 
                                    onClick={() => setQuantity(quantity + 1)}
                                    className="w-12 h-10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>
                     </div>
                </div>
            )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900 z-10 flex gap-3">
           {currentStep > 0 && (
               <button 
                  onClick={handleBack}
                  className="px-5 h-14 rounded-xl border border-slate-700 text-slate-300 font-bold hover:bg-slate-800 transition-colors flex items-center gap-2"
               >
                  <ArrowLeft size={20} />
                  Back
               </button>
           )}

           {!isFinalStep ? (
               <button 
                onClick={handleNext}
                disabled={!isStepValid()}
                className={`
                    flex-1 h-14 rounded-xl text-lg font-bold flex items-center justify-center gap-2 transition-all
                    ${isStepValid()
                        ? 'bg-slate-100 hover:bg-white text-slate-900 shadow-lg active:scale-[0.98]' 
                        : 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'}
                `}
               >
                   {/* If requirements met, show Next, else visually disabled */}
                   <span>Next Step</span>
                   <ArrowRight size={20} />
               </button>
           ) : (
               <button 
                onClick={handleAddToCart}
                className="flex-1 h-14 rounded-xl text-base sm:text-lg font-bold flex items-center justify-between px-4 sm:px-6 transition-all bg-gradient-to-r from-primary-500 to-primary-600 hover:to-primary-500 text-slate-950 shadow-lg shadow-primary-500/20 active:scale-[0.98]"
               >
                   <span className="flex items-center gap-2">
                       <ShoppingBag size={20} />
                       <span>Add <span className="hidden sm:inline">to Cart</span></span>
                   </span>
                   <span className="px-2 py-1 bg-slate-950/20 rounded-lg text-sm sm:text-base">
                       {formatCurrency(calculateFinalTotal())}
                   </span>
               </button>
           )}
        </div>

      </div>
    </div>
  );
};

export default VariantModal;