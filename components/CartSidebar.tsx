import React, { useState, useRef, useEffect } from 'react';
import { CartItem, Table, Customer, BusinessType, DiscountState, DiscountRule } from '../types';
import { User, ChevronDown, Trash2, Edit3, Plus, Minus, ArrowRight, Percent, Trash, ShoppingBag, MapPin, UtensilsCrossed, Bike, Package, ArrowLeftFromLine, ArrowRightFromLine, Tag, UserPlus, X, Check, Mail, Phone, MessageSquare, ArrowLeft, DollarSign, Calculator, AlertCircle } from 'lucide-react';

interface CartSidebarProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onUpdateItem: (id: string, updates: Partial<CartItem>) => void;
  onClear: () => void;
  orderType: 'dine-in' | 'take-away' | 'delivery';
  setOrderType: (type: 'dine-in' | 'take-away' | 'delivery') => void;
  selectedTable: Table | null;
  onReselectTable: () => void;
  businessType: BusinessType;
  isMobile?: boolean;
  onClose?: () => void;
  globalDiscount: DiscountState;
  setGlobalDiscount: (discount: DiscountState) => void;
  onCheckout: () => void;
  discounts: DiscountRule[];
}

// Sub-component for Swipeable Cart Item
const CartItemRow: React.FC<{
  item: CartItem;
  onUpdateQuantity: (id: string, delta: number) => void;
  onRemove: (id: string) => void;
  onEdit: (item: CartItem) => void;
  formatCurrency: (amount: number) => string;
}> = ({ item, onUpdateQuantity, onRemove, onEdit, formatCurrency }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [offsetX, setOffsetX] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const rowRef = useRef<HTMLDivElement>(null);

  // Calculations
  const unitPrice = item.price;
  const unitDiscount = item.discount || 0;
  const originalTotal = unitPrice * item.quantity;
  const discountTotal = unitDiscount * item.quantity; // Total discount for this line item
  const finalTotal = originalTotal - discountTotal;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;

    // Logic: 
    // If closed (isOpen=false), allow drag left (negative diff).
    // If open (isOpen=true), allow drag right (positive diff) to close.
    if (!isOpen) {
        if (diff < 0) setOffsetX(Math.max(diff, -100));
    } else {
        // If open, starting pos is -80. diff is relative to touch start. 
        // We want to move towards 0.
        setOffsetX(Math.min(diff - 80, 0));
    }
  };

  const handleTouchEnd = () => {
    if (!isOpen) {
        // Threshold to open
        if (offsetX < -50) {
            setIsOpen(true);
            setOffsetX(-80); // Snap to open
        } else {
            setOffsetX(0); // Snap back closed
        }
    } else {
        // Threshold to close
        if (offsetX > -60) {
             setIsOpen(false);
             setOffsetX(0);
        } else {
            setOffsetX(-80); // Stay open
        }
    }
    touchStartX.current = null;
  };

  // Close if clicked outside swipe area or reset
  useEffect(() => {
    if (isOpen) {
        const timeout = setTimeout(() => {
             // Optional auto-close functionality could go here
        }, 5000);
        return () => clearTimeout(timeout);
    }
  }, [isOpen]);

  return (
    <div className="relative overflow-hidden mb-1">
      {/* Background Actions Layer */}
      <div className="absolute inset-y-0 right-0 w-[80px] bg-red-500/10 flex items-center justify-center z-0">
         <button 
           onClick={(e) => {
               e.stopPropagation();
               onRemove(item.cartId);
           }}
           className="w-full h-full flex flex-col items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors"
         >
             <Trash2 size={20} />
             <span className="text-[10px] font-bold mt-1">Delete</span>
         </button>
      </div>

      {/* Foreground Content */}
      <div 
        ref={rowRef}
        className="relative bg-slate-900 transition-transform duration-300 ease-out border-b border-slate-800/50 -mx-4 md:-mx-5 z-10"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
            if (isOpen) {
                setIsOpen(false);
                setOffsetX(0);
            } else {
                onEdit(item);
            }
        }}
      >
         <div className="py-3 px-4 md:px-5 flex gap-3">
             {/* Compact Image */}
             <div 
                className="w-14 h-14 rounded-lg bg-cover bg-center shrink-0 border border-slate-700/50 shadow-sm relative overflow-hidden" 
                style={{ backgroundImage: `url('${item.image}')` }}
             ></div>
             
             <div className="flex-1 min-w-0 flex flex-col justify-between">
                 {/* Top Row: Name and Price */}
                 <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-slate-100 leading-tight truncate pr-2 select-none">{item.name}</h4>
                    <div className="text-right shrink-0">
                       <div className="text-sm font-bold text-white tabular-nums">
                            {formatCurrency(finalTotal)}
                       </div>
                       {unitDiscount > 0 && (
                         <div className="text-[10px] text-slate-500 line-through decoration-slate-600 tabular-nums">
                            {formatCurrency(originalTotal)}
                         </div>
                       )}
                    </div>
                 </div>

                 {/* Middle Row: Options & Notes */}
                 <div className="flex flex-col gap-0.5 mb-2 select-none">
                    {/* Display Options Grouped */}
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                        <div className="flex flex-col gap-0.5 mt-0.5">
                            {item.selectedOptions.map((opt, idx) => (
                                <div key={idx} className="text-xs flex justify-between items-baseline">
                                    <div className="flex items-center gap-1.5 min-w-0">
                                        <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0"></span>
                                        <span className="text-slate-400 truncate">
                                            {opt.groupName}: <span className="text-primary-400 font-semibold">{opt.name}</span>
                                        </span>
                                    </div>
                                    {opt.price > 0 && (
                                        <span className="text-[10px] text-slate-500 font-mono ml-2 whitespace-nowrap">
                                            +{formatCurrency(opt.price)}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {item.notes && (
                       <div className="flex items-start gap-1 text-[10px] text-slate-500 italic mt-1 pt-1 border-t border-slate-800/50">
                          <MessageSquare size={10} className="mt-0.5 shrink-0" />
                          <span className="truncate">{item.notes}</span>
                       </div>
                    )}
                    
                    {/* Discount Badge on Item */}
                    {unitDiscount > 0 && (
                         <div className="flex items-center gap-1 mt-1">
                             <Tag size={10} className="text-emerald-500" />
                             <span className="text-[10px] text-emerald-400 font-medium">Discount applied: -{formatCurrency(unitDiscount)}/item</span>
                         </div>
                    )}
                 </div>

                 {/* Bottom Row: Controls */}
                 <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                     
                     {/* Slim Quantity Stepper */}
                     <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 h-7 shadow-sm">
                        <button 
                            onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, -1); }}
                            className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-l-lg transition-colors active:bg-slate-600"
                        >
                            <Minus size={14} strokeWidth={2.5} />
                        </button>
                        <span className="w-8 text-center text-xs font-bold text-white tabular-nums select-none bg-slate-900/50 h-full flex items-center justify-center border-x border-slate-700/50">
                            {item.quantity}
                        </span>
                        <button 
                            onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, 1); }}
                            className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 rounded-r-lg transition-colors active:bg-slate-600"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                        </button>
                     </div>

                     {/* Action Icons */}
                     <div className="flex items-center gap-1">
                         <button 
                            onClick={() => onEdit(item)}
                            className="p-1.5 text-slate-500 hover:text-primary-400 hover:bg-slate-800 rounded-md transition-all"
                         >
                            <Edit3 size={16} strokeWidth={2} />
                         </button>
                     </div>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};

// Edit Item Modal Component
const EditItemModal: React.FC<{
    item: CartItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, updates: Partial<CartItem>) => void;
    formatCurrency: (amount: number) => string;
}> = ({ item, isOpen, onClose, onSave, formatCurrency }) => {
    const [notes, setNotes] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [discountType, setDiscountType] = useState<'nominal' | 'percent'>('nominal');
    const [discountValue, setDiscountValue] = useState('');

    useEffect(() => {
        if (item) {
            setNotes(item.notes || '');
            setQuantity(item.quantity);
            // Assuming item.discount is always a nominal amount per unit stored in item
            setDiscountType('nominal');
            setDiscountValue(item.discount ? item.discount.toString() : '');
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const handleSave = () => {
        let finalDiscount = 0;
        const val = parseInt(discountValue) || 0;
        
        if (discountType === 'nominal') {
            finalDiscount = val;
        } else {
            // Percent
            finalDiscount = (item.price * val) / 100;
        }

        onSave(item.cartId, {
            notes,
            quantity,
            discount: finalDiscount
        });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Edit Item</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                
                <div className="p-5 space-y-5">
                    {/* Item Info */}
                    <div className="flex gap-3">
                         <div 
                            className="w-16 h-16 rounded-lg bg-cover bg-center shrink-0 border border-slate-700" 
                            style={{ backgroundImage: `url('${item.image}')` }}
                         ></div>
                         <div>
                             <h4 className="font-bold text-white leading-tight">{item.name}</h4>
                             <p className="text-sm text-primary-400 font-mono mt-1">{formatCurrency(item.price)}</p>
                         </div>
                    </div>

                    {/* Quantity */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Quantity</label>
                        <div className="flex items-center h-12 bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
                           <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-14 h-full flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                              <Minus size={20} />
                           </button>
                           <span className="flex-1 text-center font-bold text-white text-lg tabular-nums">{quantity}</span>
                           <button onClick={() => setQuantity(quantity + 1)} className="w-14 h-full flex items-center justify-center hover:bg-slate-800 text-slate-400 hover:text-white transition-colors">
                              <Plus size={20} />
                           </button>
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase">Notes</label>
                         <textarea 
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary-500 h-20 resize-none"
                            placeholder="Add special instructions..."
                         />
                    </div>

                    {/* Item Discount */}
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase flex justify-between">
                            <span>Item Discount</span>
                            <span className="text-emerald-500">
                                {discountValue ? (discountType === 'percent' ? `${discountValue}%` : formatCurrency(parseInt(discountValue) || 0)) : 'None'}
                            </span>
                        </label>
                        <div className="flex gap-2">
                            <div className="flex bg-slate-800 rounded-xl p-1 border border-slate-700 shrink-0">
                                <button 
                                    onClick={() => setDiscountType('nominal')}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${discountType === 'nominal' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                >
                                    Rp
                                </button>
                                <button 
                                    onClick={() => setDiscountType('percent')}
                                    className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${discountType === 'percent' ? 'bg-slate-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}
                                >
                                    %
                                </button>
                            </div>
                            <input 
                                type="number"
                                value={discountValue}
                                onChange={(e) => setDiscountValue(e.target.value)}
                                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3 text-white focus:outline-none focus:border-primary-500"
                                placeholder="0"
                            />
                        </div>
                    </div>
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <button 
                        onClick={handleSave}
                        className="w-full h-12 bg-primary-500 hover:bg-primary-400 text-slate-900 font-bold rounded-xl shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all"
                    >
                        Save Changes
                    </button>
                </div>
            </div>
        </div>
    );
};

// Global Discount Modal Component
const GlobalDiscountModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    currentDiscount: DiscountState;
    onApply: (discount: DiscountState) => void;
    subtotal: number;
    formatCurrency: (amount: number) => string;
    discounts: DiscountRule[];
}> = ({ isOpen, onClose, currentDiscount, onApply, subtotal, formatCurrency, discounts }) => {
    const [mode, setMode] = useState<'list' | 'custom'>('list');
    const [type, setType] = useState<'nominal' | 'percent'>('nominal');
    const [value, setValue] = useState('');
    const [customName, setCustomName] = useState('Custom Discount');

    // Init custom state if current discount is custom
    useEffect(() => {
        if(isOpen && currentDiscount.value > 0) {
             const isKnown = discounts.some(d => d.name === currentDiscount.name && d.value === currentDiscount.value && d.type === currentDiscount.type);
             if (!isKnown) {
                 setMode('custom');
                 setType(currentDiscount.type);
                 setValue(currentDiscount.value.toString());
                 setCustomName(currentDiscount.name || 'Custom Discount');
             } else {
                 setMode('list');
             }
        }
    }, [isOpen, currentDiscount, discounts]);

    if (!isOpen) return null;

    const handleApplyCustom = () => {
        onApply({
            type,
            value: parseInt(value) || 0,
            name: customName
        });
        onClose();
    };

    const handleApplyPreset = (rule: DiscountRule) => {
        onApply({
            type: rule.type,
            value: rule.value,
            name: rule.name
        });
        onClose();
    };

    const handleClear = () => {
        onApply({ type: 'nominal', value: 0, name: '' });
        onClose();
    }

    const calculatedCustomAmount = type === 'nominal' 
        ? (parseInt(value) || 0) 
        : (subtotal * (parseInt(value) || 0)) / 100;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center shrink-0">
                    <h3 className="text-lg font-bold text-white">Order Discount</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>

                <div className="flex border-b border-slate-800">
                    <button 
                        onClick={() => setMode('list')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'list' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        Select Promotion
                    </button>
                    <button 
                         onClick={() => setMode('custom')}
                        className={`flex-1 py-3 text-sm font-bold transition-colors ${mode === 'custom' ? 'text-primary-500 border-b-2 border-primary-500' : 'text-slate-400 hover:text-white'}`}
                    >
                        Custom Value
                    </button>
                </div>

                <div className="p-5 overflow-y-auto flex-1">
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 text-center mb-5">
                        <span className="text-xs text-slate-400 uppercase font-bold">Current Subtotal</span>
                        <div className="text-2xl font-bold text-white mt-1">{formatCurrency(subtotal)}</div>
                    </div>

                    {mode === 'list' ? (
                        <div className="space-y-2">
                            {discounts.length === 0 ? (
                                <p className="text-center text-slate-500 text-sm py-4">No promotions found.</p>
                            ) : (
                                discounts.map(rule => (
                                    <button 
                                        key={rule.id}
                                        onClick={() => handleApplyPreset(rule)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all
                                            ${currentDiscount.name === rule.name && currentDiscount.value === rule.value 
                                                ? 'bg-primary-500/10 border-primary-500 ring-1 ring-primary-500' 
                                                : 'bg-slate-800 border-slate-700 hover:border-slate-500'}
                                        `}
                                    >
                                        <div className="text-left">
                                            <div className={`font-bold text-sm ${currentDiscount.name === rule.name ? 'text-primary-400' : 'text-white'}`}>{rule.name}</div>
                                            <div className="text-xs text-slate-500">
                                                {rule.type === 'percent' ? `${rule.value}% Off` : `Rp ${rule.value.toLocaleString()} Off`}
                                            </div>
                                        </div>
                                        {currentDiscount.name === rule.name && <Check size={16} className="text-primary-500" />}
                                    </button>
                                ))
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <input 
                                placeholder="Discount Name (e.g. Manager Override)"
                                value={customName}
                                onChange={e => setCustomName(e.target.value)}
                                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-primary-500"
                            />

                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                onClick={() => setType('percent')}
                                className={`h-12 rounded-xl border flex items-center justify-center gap-2 transition-all
                                    ${type === 'percent' ? 'bg-primary-500 text-slate-900 border-primary-500 font-bold' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}
                                `}
                                >
                                <Percent size={18} /> Percentage
                                </button>
                                <button 
                                onClick={() => setType('nominal')}
                                className={`h-12 rounded-xl border flex items-center justify-center gap-2 transition-all
                                    ${type === 'nominal' ? 'bg-primary-500 text-slate-900 border-primary-500 font-bold' : 'bg-slate-950 border-slate-700 text-slate-400 hover:border-slate-500'}
                                `}
                                >
                                <DollarSign size={18} /> Nominal
                                </button>
                            </div>

                            <div className="relative">
                                <input 
                                    type="number"
                                    value={value}
                                    onChange={(e) => setValue(e.target.value)}
                                    className="w-full h-14 bg-slate-950 border border-slate-700 rounded-xl px-4 text-2xl font-bold text-white focus:outline-none focus:border-primary-500"
                                    placeholder="0"
                                    autoFocus
                                />
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold pointer-events-none">
                                    {type === 'percent' ? '%' : 'Rp'}
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center px-2">
                                <span className="text-sm text-slate-400">Discount Amount:</span>
                                <span className="text-lg font-bold text-red-400">- {formatCurrency(calculatedCustomAmount)}</span>
                            </div>

                            <button 
                                onClick={handleApplyCustom}
                                className="w-full h-12 bg-primary-500 hover:bg-primary-400 text-slate-900 font-bold rounded-xl shadow-lg shadow-primary-500/20 active:scale-[0.98] transition-all"
                            >
                                Apply Custom Discount
                            </button>
                        </div>
                    )}
                </div>

                <div className="p-4 border-t border-slate-800 bg-slate-900 flex justify-between gap-3 shrink-0">
                    <button onClick={handleClear} className="px-4 py-2 text-slate-400 hover:text-red-400 text-sm font-bold flex items-center gap-2">
                        <Trash2 size={16} /> Clear
                    </button>
                    {mode === 'list' && (
                         <button onClick={onClose} className="px-6 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold">
                             Close
                         </button>
                    )}
                </div>
             </div>
        </div>
    );
};

const CartSidebar: React.FC<CartSidebarProps> = ({ 
  cartItems, 
  onUpdateQuantity, 
  onRemove, 
  onUpdateItem,
  onClear,
  orderType,
  setOrderType,
  selectedTable,
  onReselectTable,
  businessType,
  isMobile = false,
  onClose,
  globalDiscount,
  setGlobalDiscount,
  onCheckout,
  discounts
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Modals
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);

  // Swipe to Close Logic (Mobile Sidebar)
  const sidebarTouchStart = useRef<number | null>(null);

  const handleSidebarTouchStart = (e: React.TouchEvent) => {
    if (!isMobile) return;
    sidebarTouchStart.current = e.touches[0].clientX;
  };

  const handleSidebarTouchEnd = (e: React.TouchEvent) => {
    if (!isMobile || !sidebarTouchStart.current) return;
    const endX = e.changedTouches[0].clientX;
    const diff = endX - sidebarTouchStart.current;
    
    // If swiped right significantly (> 100px), close sidebar
    if (diff > 100) {
        onClose?.();
    }
    sidebarTouchStart.current = null;
  };

  // Customer State
  const [customers, setCustomers] = useState<Customer[]>([
    { id: 'walk-in', name: 'Walk-in Customer', type: 'walk-in' },
    { id: 'mem-1', name: 'Budi Santoso', type: 'member', phone: '08123456789' },
    { id: 'mem-2', name: 'Sarah Wijaya', type: 'vip', email: 'sarah@example.com' },
  ]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>(customers[0]);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  
  // Add Customer Modal State
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: '', phone: '', email: '' });
  
  // Refs for click outside
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsCustomerDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handlers
  const handleAddCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomer.name) return;

    const customer: Customer = {
        id: `new-${Date.now()}`,
        name: newCustomer.name,
        phone: newCustomer.phone,
        email: newCustomer.email,
        type: 'member'
    };

    setCustomers(prev => [...prev, customer]);
    setSelectedCustomer(customer);
    setIsAddCustomerOpen(false);
    setNewCustomer({ name: '', phone: '', email: '' });
  };

  // Calculate Totals
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  
  // Sum of item level discounts
  const itemDiscounts = cartItems.reduce((acc, item) => acc + ((item.discount || 0) * item.quantity), 0);
  
  // Global Discount Calculation
  // We apply global discount on the (Subtotal - Item Discounts) to prevent double counting if desired, 
  // OR usually global discount applies to the result.
  const subtotalAfterItemDiscounts = subtotal - itemDiscounts;
  
  const globalDiscountAmount = globalDiscount.type === 'nominal' 
     ? globalDiscount.value 
     : (subtotalAfterItemDiscounts * globalDiscount.value) / 100;

  const totalDiscount = itemDiscounts + globalDiscountAmount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const tax = taxableAmount * 0.11;
  const total = taxableAmount + tax;
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  // Determine width based on state and device
  const getSidebarWidth = () => {
    if (isMobile) return 'w-full max-w-[90vw] sm:max-w-md ml-auto'; // Mobile drawer
    if (isExpanded) return 'w-[600px] xl:w-[700px]';
    return 'w-[400px] xl:w-[450px]';
  };

  return (
    <aside 
      className={`
        bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-40 h-full transition-all duration-300 ease-in-out relative
        ${getSidebarWidth()}
      `}
      onTouchStart={handleSidebarTouchStart}
      onTouchEnd={handleSidebarTouchEnd}
    >
      {/* ... (Previous Header and Cart List code remains unchanged) ... */}
      {/* Mobile Header with Back Navigation */}
      {isMobile && (
        <div className="shrink-0 px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-30 shadow-md">
            <div className="flex items-center gap-3">
                <button
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-full text-slate-300 hover:text-white hover:bg-slate-700 transition-colors border border-slate-700/50 shadow-sm active:scale-95"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                   <h2 className="font-bold text-lg text-white leading-none">Current Order</h2>
                   <p className="text-xs text-slate-500 font-medium mt-0.5">{totalItems} Items</p>
                </div>
            </div>
            <button
                onClick={onClose}
                className="text-xs font-bold text-primary-500 hover:text-primary-400 bg-primary-500/10 px-3 py-2 rounded-lg border border-primary-500/20 active:scale-95 transition-all"
            >
                + Add Items
            </button>
        </div>
      )}

      {/* 1. Controls Section (Customer & Type) */}
      <div className="shrink-0 p-4 bg-slate-900 border-b border-slate-800 z-20 flex flex-col gap-3 shadow-sm relative pt-4 md:pt-5">
        <div className="flex items-center gap-2 md:gap-3">
            
            {/* Custom Flowbite-style Dropdown for Customer */}
            <div className="relative flex-1" ref={dropdownRef}>
                <button 
                    onClick={() => setIsCustomerDropdownOpen(!isCustomerDropdownOpen)}
                    className="w-full inline-flex items-center justify-between text-slate-200 bg-slate-800 border border-slate-700 hover:bg-slate-700 hover:border-slate-600 focus:ring-4 focus:ring-slate-700 font-medium rounded-xl text-sm px-3 md:px-4 py-2.5 focus:outline-none transition-all" 
                    type="button"
                >
                    <div className="flex items-center gap-2 truncate">
                        <User size={16} className="text-primary-500" />
                        <span className="truncate max-w-[80px] sm:max-w-none">{selectedCustomer.name}</span>
                        {selectedCustomer.type !== 'walk-in' && (
                            <span className="text-[10px] bg-primary-500/10 text-primary-400 px-1.5 py-0.5 rounded uppercase tracking-wide font-bold hidden sm:inline-block">
                                {selectedCustomer.type}
                            </span>
                        )}
                    </div>
                    <ChevronDown size={16} className={`text-slate-500 transition-transform duration-200 ${isCustomerDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {isCustomerDropdownOpen && (
                    <div className="absolute z-50 top-full left-0 w-full mt-2 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                        <ul className="py-2 text-sm text-slate-300 max-h-60 overflow-y-auto">
                            {customers.map((customer) => (
                                <li key={customer.id}>
                                    <button 
                                        onClick={() => {
                                            setSelectedCustomer(customer);
                                            setIsCustomerDropdownOpen(false);
                                        }}
                                        className={`flex items-center justify-between w-full px-4 py-2 hover:bg-slate-700 hover:text-white transition-colors ${selectedCustomer.id === customer.id ? 'bg-slate-700/50 text-primary-400 font-semibold' : ''}`}
                                    >
                                        <div className="flex items-center gap-2">
                                            {customer.type === 'walk-in' ? <User size={14} /> : <div className="w-2 h-2 rounded-full bg-emerald-500"></div>}
                                            {customer.name}
                                        </div>
                                        {selectedCustomer.id === customer.id && <Check size={14} />}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <div className="border-t border-slate-700 bg-slate-800/50 p-1">
                            <button 
                                onClick={() => {
                                    setIsCustomerDropdownOpen(false);
                                    setIsAddCustomerOpen(true);
                                }}
                                className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-primary-400 rounded-lg hover:bg-primary-500/10 transition-colors"
                            >
                                <UserPlus size={14} className="mr-2" />
                                Add New Customer
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Order Type Dropdown - ONLY FOR FnB */}
            {businessType === 'fnb' && (
                <div className="relative w-32 md:w-36 shrink-0">
                     <div className="absolute inset-y-0 left-0 pl-2 md:pl-3 flex items-center pointer-events-none text-slate-400">
                        {orderType === 'dine-in' && <UtensilsCrossed size={16} />}
                        {orderType === 'take-away' && <Package size={16} />}
                        {orderType === 'delivery' && <Bike size={16} />}
                    </div>
                    <select 
                        value={orderType}
                        onChange={(e) => setOrderType(e.target.value as any)}
                        className="w-full h-10.5 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl pl-8 md:pl-9 pr-6 md:pr-8 text-xs md:text-sm font-semibold focus:outline-none focus:border-primary-500 appearance-none cursor-pointer hover:bg-slate-750 transition-colors"
                    >
                        <option value="dine-in">Dine In</option>
                        <option value="take-away">Take Away</option>
                        <option value="delivery">Delivery</option>
                    </select>
                     <div className="absolute inset-y-0 right-0 pr-2 md:pr-3 flex items-center pointer-events-none text-slate-500">
                        <ChevronDown size={14} />
                    </div>
                </div>
            )}

            {/* Expand Toggle (Desktop Only) */}
             {!isMobile && (
                 <button 
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-10.5 w-10.5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl border border-slate-700/50 transition-colors"
                  title={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? <ArrowRightFromLine size={18} /> : <ArrowLeftFromLine size={18} />}
                </button>
             )}
        </div>

        {/* Row 2: Table Selection (Only for Dine In AND FnB) */}
        {businessType === 'fnb' && orderType === 'dine-in' && (
             <div className="flex items-center gap-3 bg-slate-800/50 px-4 py-2 rounded-xl border border-slate-800 border-dashed">
                <MapPin size={16} className="text-primary-500 shrink-0" />
                <div className="flex-1 flex items-center justify-between min-w-0">
                    {selectedTable ? (
                        <span className="text-sm font-bold text-white truncate">Table {selectedTable.name} <span className="text-slate-500 font-normal">({selectedTable.section})</span></span>
                    ) : (
                        <span className="text-sm text-amber-500 font-medium animate-pulse">Select a table...</span>
                    )}
                    <button onClick={onReselectTable} className="text-xs font-bold text-primary-400 hover:text-primary-300 ml-2 uppercase tracking-wide whitespace-nowrap px-2 py-1 bg-primary-500/10 rounded-lg">
                        Change
                    </button>
                </div>
             </div>
        )}
      </div>

      {/* 2. Scrollable Cart List */}
      <div className="flex-1 overflow-y-auto px-4 md:px-5 py-2 hover:scrollbar-thumb-slate-700 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {cartItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-slate-500 opacity-60 pb-10 select-none">
            <div className="w-20 h-20 bg-slate-800/50 rounded-full flex items-center justify-center mb-4 border border-slate-700/50">
              <ShoppingBag size={32} />
            </div>
            <p className="font-medium text-base">Cart is empty</p>
            <p className="text-sm mt-1">Add items to start order</p>
          </div>
        ) : (
            <div className="flex flex-col space-y-1">
                {cartItems.map((item) => (
                    <CartItemRow 
                        key={item.cartId}
                        item={item}
                        onUpdateQuantity={onUpdateQuantity}
                        onRemove={onRemove}
                        onEdit={setEditingItem}
                        formatCurrency={formatCurrency}
                    />
                ))}
            </div>
        )}
      </div>

      {/* 3. Comfort Footer */}
      <div className="bg-slate-900 border-t border-slate-800 p-4 md:p-6 z-20 shadow-[0_-4px_20px_rgba(0,0,0,0.3)] safe-area-bottom">
        <div className="space-y-3 mb-6">
          <div className="flex justify-between text-sm font-medium text-slate-400">
            <span>Subtotal</span>
            <span className="text-slate-200 tabular-nums">{formatCurrency(subtotal)}</span>
          </div>
          
          {/* Detailed Discount Breakdown */}
          {itemDiscounts > 0 && (
             <div className="flex justify-between text-sm font-medium text-emerald-500/80">
                <span>Item Discounts</span>
                <span className="tabular-nums">-{formatCurrency(itemDiscounts)}</span>
            </div>
          )}
          {globalDiscountAmount > 0 && (
             <div className="flex justify-between text-sm font-medium text-emerald-400">
                <span>{globalDiscount.name ? `Promo: ${globalDiscount.name}` : 'Order Discount'}</span>
                <span className="tabular-nums">-{formatCurrency(globalDiscountAmount)}</span>
            </div>
          )}

          <div className="flex justify-between text-sm font-medium text-slate-400">
            <span>Tax (11%)</span>
            <span className="text-slate-200 tabular-nums">{formatCurrency(tax)}</span>
          </div>
          
          <div className="pt-4 flex justify-between items-end border-t border-slate-800/50 mt-2">
            <div>
                <span className="text-sm text-slate-500 font-bold uppercase tracking-wider">Total Amount</span>
            </div>
            <span className="text-3xl font-bold text-primary-400 tabular-nums leading-none tracking-tight">{formatCurrency(total)}</span>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
            <button 
                onClick={onClear}
                className="col-span-1 h-12 rounded-xl bg-slate-800 hover:bg-red-900/20 hover:border-red-900/30 border border-slate-700 text-slate-400 hover:text-red-400 flex items-center justify-center transition-all active:scale-95"
                title="Clear Cart"
            >
                <Trash size={20} />
            </button>
            <button 
                onClick={() => setIsDiscountModalOpen(true)}
                className={`col-span-1 h-12 rounded-xl border flex items-center justify-center transition-all active:scale-95
                    ${globalDiscount.value > 0 ? 'bg-primary-500 text-slate-900 border-primary-500 font-bold' : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300'}
                `}
            >
                 <Percent size={20} />
            </button>
            <button 
              onClick={onCheckout}
              disabled={cartItems.length === 0}
              className="col-span-2 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 hover:to-primary-500 text-slate-950 font-bold text-base flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                <span>Checkout</span>
                <ArrowRight size={20} strokeWidth={2.5} />
            </button>
        </div>
      </div>

      {/* Internal Modals */}
      <EditItemModal 
         item={editingItem}
         isOpen={!!editingItem}
         onClose={() => setEditingItem(null)}
         onSave={onUpdateItem}
         formatCurrency={formatCurrency}
      />

      <GlobalDiscountModal
        isOpen={isDiscountModalOpen}
        onClose={() => setIsDiscountModalOpen(false)}
        currentDiscount={globalDiscount}
        onApply={setGlobalDiscount}
        subtotal={subtotalAfterItemDiscounts}
        formatCurrency={formatCurrency}
        discounts={discounts}
      />
    </aside>
  );
};

export default CartSidebar;