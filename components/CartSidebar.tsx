import React, { useState, useRef, useEffect } from 'react';
import { CartItem, Table, Customer, BusinessType, DiscountState, DiscountRule } from '../types';
import { User, ChevronDown, Trash2, Edit3, Plus, Minus, ArrowRight, Percent, Trash, ShoppingBag, MapPin, UtensilsCrossed, Bike, Package, ArrowLeftFromLine, ArrowRightFromLine, Tag, UserPlus, X, Check, Mail, Phone, MessageSquare, ArrowLeft, DollarSign, Calculator, AlertCircle, ChefHat } from 'lucide-react';

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
  onSendToKitchen: () => void;
  discounts: DiscountRule[];
}

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

  const unitPrice = item.price;
  const unitDiscount = item.discount || 0;
  const originalTotal = unitPrice * item.quantity;
  const discountTotal = unitDiscount * item.quantity; 
  const finalTotal = originalTotal - discountTotal;

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const currentX = e.touches[0].clientX;
    const diff = currentX - touchStartX.current;
    if (!isOpen) {
        if (diff < 0) setOffsetX(Math.max(diff, -100));
    } else {
        setOffsetX(Math.min(diff - 80, 0));
    }
  };

  const handleTouchEnd = () => {
    if (!isOpen) {
        if (offsetX < -50) {
            setIsOpen(true);
            setOffsetX(-80);
        } else {
            setOffsetX(0);
        }
    } else {
        if (offsetX > -60) {
             setIsOpen(false);
             setOffsetX(0);
        } else {
            setOffsetX(-80);
        }
    }
    touchStartX.current = null;
  };

  return (
    <div className="relative overflow-hidden mb-1.5 group/item">
      <div className="absolute inset-y-0 right-0 w-[80px] bg-red-500/10 flex items-center justify-center z-0">
         <button onClick={(e) => { e.stopPropagation(); onRemove(item.cartId); }} className="w-full h-full flex flex-col items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors">
             <Trash2 size={24} />
             <span className="text-[10px] font-black uppercase mt-1">Delete</span>
         </button>
      </div>
      <div 
        className="relative bg-white dark:bg-slate-900 transition-all duration-300 ease-out border-b border-slate-100 dark:border-slate-800/50 -mx-4 md:-mx-5 z-10 hover:bg-slate-50 dark:hover:bg-slate-850 shadow-sm dark:shadow-none"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (isOpen) { setIsOpen(false); setOffsetX(0); } else { onEdit(item); } }}
      >
         <div className="py-4 px-4 md:px-5 flex gap-4">
             <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0 border border-slate-200 dark:border-slate-700/50 shadow-md relative overflow-hidden transition-transform group-hover/item:scale-105" style={{ backgroundImage: `url('${item.image}')` }}></div>
                {item.isUnsent && (
                    <div className="absolute top-[-4px] right-[-4px] w-4 h-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full animate-pulse shadow-lg"></div>
                )}
             </div>
             <div className="flex-1 min-w-0 flex flex-col justify-between">
                 <div className="flex justify-between items-start">
                    <h4 className="text-base font-black text-slate-900 dark:text-slate-100 leading-tight truncate pr-4 select-none group-hover/item:text-primary-500 transition-colors">{item.name}</h4>
                    <div className="text-right shrink-0">
                       <div className="text-base font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">{formatCurrency(finalTotal)}</div>
                    </div>
                 </div>
                 
                 <div className="flex flex-col gap-1 mb-3 select-none mt-1">
                    {item.selectedOptions?.map((opt, idx) => (
                        <div key={idx} className="text-[11px] flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0"></span>
                            <span className="text-slate-500 dark:text-slate-400 truncate">{opt.groupName}: <span className="text-slate-900 dark:text-primary-400 font-bold uppercase">{opt.name}</span></span>
                        </div>
                    ))}
                    {item.notes && <div className="text-[11px] text-primary-600 dark:text-slate-500 italic mt-1.5 font-medium truncate flex items-center gap-2 bg-primary-50 dark:bg-transparent px-2 py-0.5 rounded border border-primary-100 dark:border-none"><MessageSquare size={12} className="shrink-0" />{item.notes}</div>}
                 </div>

                 {/* INCREASED TAP TARGETS FOR BUTTONS */}
                 <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                     <div className="flex items-center bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 h-11 shadow-inner">
                        <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, -1); }} className="size-11 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-l-2xl transition-all active:scale-90"><Minus size={18} strokeWidth={3} /></button>
                        <span className="w-10 text-center text-sm font-black text-slate-900 dark:text-white tabular-nums">{item.quantity}</span>
                        <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, 1); }} className="size-11 flex items-center justify-center text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-r-2xl transition-all active:scale-90"><Plus size={18} strokeWidth={3} /></button>
                     </div>
                     <div className="flex items-center gap-3">
                        {item.isUnsent && <span className="text-[9px] font-black uppercase tracking-widest text-emerald-600 dark:text-emerald-500 bg-emerald-100 dark:bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-200 dark:border-none shadow-sm dark:shadow-none">New Order</span>}
                        <button onClick={() => onEdit(item)} className="size-11 flex items-center justify-center bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-500 dark:text-slate-400 hover:text-primary-500 dark:hover:text-primary-400 transition-all active:scale-90 shadow-sm dark:shadow-none"><Edit3 size={20} /></button>
                     </div>
                 </div>
             </div>
         </div>
      </div>
    </div>
  );
};

const EditItemModal: React.FC<{
    item: CartItem | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, updates: Partial<CartItem>) => void;
    formatCurrency: (amount: number) => string;
}> = ({ item, isOpen, onClose, onSave, formatCurrency }) => {
    const [notes, setNotes] = useState('');
    const [quantity, setQuantity] = useState(1);
    const [discountValue, setDiscountValue] = useState('');

    useEffect(() => {
        if (item) {
            setNotes(item.notes || '');
            setQuantity(item.quantity);
            setDiscountValue(item.discount ? item.discount.toString() : '');
        }
    }, [item]);

    if (!isOpen || !item) return null;

    const handleSave = () => {
        onSave(item.cartId, { notes, quantity, discount: parseInt(discountValue) || 0 });
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-white dark:bg-slate-900 border-t sm:border border-slate-200 dark:border-slate-700 rounded-t-3xl sm:rounded-3xl w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Edit Item</h3>
                    <button onClick={onClose} className="size-11 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white active:scale-90 transition-all"><X size={24}/></button>
                </div>
                <div className="p-6 space-y-6">
                    <div className="flex gap-5 items-center bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-inner">
                         <div className="w-20 h-20 rounded-2xl bg-cover bg-center shrink-0 border border-slate-200 dark:border-slate-700 shadow-md" style={{ backgroundImage: `url('${item.image}')` }}></div>
                         <div className="flex flex-col gap-1">
                            <h4 className="font-black text-lg text-slate-900 dark:text-white leading-tight">{item.name}</h4>
                            <p className="text-primary-600 dark:text-primary-400 font-black font-mono text-base">{formatCurrency(item.price)}</p>
                         </div>
                    </div>
                     <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Quantity</label>
                        <div className="flex items-center h-16 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-inner">
                           <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-20 h-full flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"><Minus size={24} strokeWidth={3} /></button>
                           <span className="flex-1 text-center font-black text-slate-900 dark:text-white text-2xl tabular-nums">{quantity}</span>
                           <button onClick={() => setQuantity(quantity + 1)} className="w-20 h-full flex items-center justify-center hover:bg-white dark:hover:bg-slate-800 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all active:scale-90"><Plus size={24} strokeWidth={3} /></button>
                        </div>
                    </div>
                    <div className="space-y-3">
                         <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">Order Notes</label>
                         <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 text-sm text-slate-900 dark:text-white focus:outline-none focus:border-primary-500 h-28 resize-none shadow-inner placeholder:text-slate-300 dark:placeholder:text-slate-800" placeholder="Add specific instructions for the staff..."/>
                    </div>
                </div>
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                    <button onClick={handleSave} className="w-full h-14 bg-primary-500 hover:bg-primary-400 text-slate-900 font-black rounded-2xl active:scale-[0.98] transition-all shadow-lg shadow-primary-500/20 text-base">Update Order</button>
                </div>
            </div>
        </div>
    );
};

const GlobalDiscountModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    currentDiscount: DiscountState;
    onApply: (discount: DiscountState) => void;
    subtotal: number;
    formatCurrency: (amount: number) => string;
    discounts: DiscountRule[];
}> = ({ isOpen, onClose, currentDiscount, onApply, subtotal, formatCurrency, discounts }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-3xl">
                    <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Order Discount</h3>
                    <button onClick={onClose} className="size-11 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all"><X size={24}/></button>
                </div>
                <div className="p-6 space-y-3">
                    {discounts.map(rule => (
                        <button key={rule.id} onClick={() => { onApply({ type: rule.type, value: rule.value, name: rule.name }); onClose(); }} className={`w-full flex items-center justify-between p-5 rounded-2xl border-2 transition-all active:scale-[0.98] ${currentDiscount.name === rule.name ? 'bg-primary-500/10 border-primary-500 shadow-lg' : 'bg-slate-50 dark:bg-slate-800/50 border-slate-100 dark:border-slate-700 hover:border-primary-500/30 dark:hover:border-slate-500'}`}>
                            <div className="text-left"><div className="font-black text-base text-slate-900 dark:text-white">{rule.name}</div><div className="text-xs text-primary-600 dark:text-slate-500 font-bold uppercase tracking-widest mt-0.5">{rule.type === 'percent' ? `${rule.value}% Off Entire Order` : `${formatCurrency(rule.value)} Nominal Discount`}</div></div>
                            {currentDiscount.name === rule.name && <div className="size-8 bg-primary-500 rounded-full flex items-center justify-center text-slate-950"><Check size={20} strokeWidth={4} /></div>}
                        </button>
                    ))}
                    <button onClick={() => { onApply({ type: 'nominal', value: 0 }); onClose(); }} className="w-full h-14 text-xs text-slate-400 dark:text-slate-500 font-black uppercase tracking-[0.2em] hover:text-red-500 transition-colors mt-4">Remove Discount</button>
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
  onSendToKitchen,
  discounts
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [editingItem, setEditingItem] = useState<CartItem | null>(null);
  const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState({ id: 'walk-in', name: 'Walk-in Customer', type: 'walk-in' });

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const itemDiscounts = cartItems.reduce((acc, item) => acc + ((item.discount || 0) * item.quantity), 0);
  const subtotalAfterItemDiscounts = subtotal - itemDiscounts;
  const globalDiscountAmount = globalDiscount.type === 'nominal' ? globalDiscount.value : (subtotalAfterItemDiscounts * globalDiscount.value) / 100;
  const totalDiscount = itemDiscounts + globalDiscountAmount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const tax = taxableAmount * 0.11;
  const total = taxableAmount + tax;
  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
  };

  const isDineIn = businessType === 'fnb' && orderType === 'dine-in';
  const hasUnsentItems = cartItems.some(item => item.isUnsent);
  const isOccupiedTable = selectedTable?.status === 'occupied';

  return (
    <aside className={`bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 flex flex-col shadow-2xl z-40 h-full transition-all duration-300 ${isMobile ? 'w-full max-w-[95vw] ml-auto' : (isExpanded ? 'w-[600px]' : 'w-[420px]')}`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="shrink-0 px-5 py-4 bg-white dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between z-30 shadow-sm transition-colors">
            <button onClick={onClose} className="size-12 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-300 active:scale-90 transition-all"><ArrowLeft size={24} /></button>
            <div className="text-center"><h2 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Basket <span className="text-primary-500 font-mono ml-1">{totalItems}</span></h2></div>
            <button onClick={onClose} className="text-[10px] font-black text-primary-600 dark:text-primary-500 bg-primary-500/10 px-4 py-2.5 rounded-xl border border-primary-500/20 uppercase tracking-widest active:scale-95 transition-all">Add Items</button>
        </div>
      )}

      {/* Settings Row */}
      <div className="shrink-0 p-5 border-b border-slate-100 dark:border-slate-800 space-y-4 bg-slate-50 dark:bg-transparent transition-colors">
        <div className="flex gap-3">
            <button className="flex-1 flex items-center justify-between text-slate-900 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl px-5 h-12 text-sm font-black shadow-sm dark:shadow-none transition-all hover:border-primary-500/50">
                <div className="flex items-center gap-3"><User size={20} className="text-primary-500" />{selectedCustomer.name}</div>
                <ChevronDown size={16} className="text-slate-400" />
            </button>
            {businessType === 'fnb' && (
                <div className="relative w-36 shrink-0">
                    <select value={orderType} onChange={(e) => setOrderType(e.target.value as any)} className="w-full h-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-200 rounded-2xl pl-10 pr-6 text-xs font-black uppercase tracking-wider appearance-none cursor-pointer shadow-sm dark:shadow-none focus:ring-2 focus:ring-primary-500/30 transition-all">
                        <option value="dine-in">Dine In</option>
                        <option value="take-away">Take Away</option>
                        <option value="delivery">Delivery</option>
                    </select>
                    <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-primary-500">
                        {orderType === 'dine-in' ? <UtensilsCrossed size={18} /> : <Package size={18} />}
                    </div>
                </div>
            )}
            {!isMobile && <button onClick={() => setIsExpanded(!isExpanded)} className="size-12 flex items-center justify-center text-slate-400 hover:text-primary-500 border border-slate-200 dark:border-slate-700 rounded-2xl bg-white dark:bg-slate-800 transition-all">{isExpanded ? <ArrowRightFromLine size={20} /> : <ArrowLeftFromLine size={20} />}</button>}
        </div>
        {isDineIn && (
             <div className={`flex items-center gap-4 px-5 py-3 rounded-2xl border transition-all ${isOccupiedTable ? 'bg-primary-500/5 border-primary-500 shadow-md shadow-primary-500/5' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 border-dashed'}`}>
                <MapPin size={20} className={isOccupiedTable ? 'text-primary-500' : 'text-slate-400'} />
                <div className="flex-1 flex items-center justify-between">
                    <span className={`text-sm font-black tracking-tight ${isOccupiedTable ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'}`}>{selectedTable ? `TABLE ${selectedTable.name}` : 'Select a Table'}</span>
                    <button onClick={onReselectTable} className="text-[10px] font-black uppercase tracking-[0.15em] text-primary-600 dark:text-primary-400 bg-primary-500/10 px-3 py-1.5 rounded-xl border border-primary-500/20 hover:bg-primary-500 hover:text-slate-950 transition-all">Switch</button>
                </div>
             </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-4 space-y-1 no-scrollbar transition-colors">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-20 select-none text-slate-400 dark:text-slate-600"><ShoppingBag size={80} strokeWidth={1} className="mb-4" /><p className="font-black uppercase tracking-[0.3em] text-sm">Basket is Empty</p></div>
        ) : (
            cartItems.map((item) => (
                <CartItemRow key={item.cartId} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} onEdit={setEditingItem} formatCurrency={formatCurrency} />
            ))
        )}
      </div>

      {/* Footer */}
      <div className="p-6 md:p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] dark:shadow-[0_-10px_40px_rgba(0,0,0,0.5)] transition-all">
        <div className="space-y-2 mb-8">
            <div className="flex justify-between text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><span>Gross Subtotal</span><span className="text-slate-700 dark:text-slate-300 font-mono text-xs">{formatCurrency(subtotal)}</span></div>
            {totalDiscount > 0 && <div className="flex justify-between text-[11px] font-black text-emerald-600 dark:text-emerald-500 uppercase tracking-widest bg-emerald-50 dark:bg-emerald-500/5 px-2 py-1 rounded-lg"><span>Applied Savings</span><span className="font-mono text-xs">-{formatCurrency(totalDiscount)}</span></div>}
            <div className="flex justify-between text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest"><span>VAT / Tax (11%)</span><span className="text-slate-700 dark:text-slate-300 font-mono text-xs">{formatCurrency(tax)}</span></div>
            <div className="pt-6 flex justify-between items-end border-t border-slate-100 dark:border-slate-800 mt-4">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black uppercase text-slate-400 dark:text-slate-500 tracking-[0.25em] leading-none mb-1">Total Payable</span>
                    <span className="text-4xl font-black text-primary-600 dark:text-primary-500 tabular-nums leading-none tracking-tighter">{formatCurrency(total)}</span>
                </div>
                {totalItems > 0 && (
                    <div className="bg-slate-50 dark:bg-slate-800 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-700 text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest shadow-sm">
                        {totalItems} Items
                    </div>
                )}
            </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
            <button onClick={onClear} title="Clear Cart" className="size-14 bg-slate-50 dark:bg-slate-800 text-slate-400 hover:text-red-500 rounded-2xl flex items-center justify-center border border-slate-100 dark:border-slate-700 transition-all active:scale-90"><Trash size={24} /></button>
            <button onClick={() => setIsDiscountModalOpen(true)} title="Apply Discount" className={`size-14 rounded-2xl border flex items-center justify-center transition-all active:scale-90 ${globalDiscount.value > 0 ? 'bg-primary-500 text-slate-950 border-primary-500 shadow-lg shadow-primary-500/20' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700'}`}><Percent size={24} strokeWidth={3} /></button>
            
            {isDineIn && (hasUnsentItems || !isOccupiedTable) ? (
                <button 
                  onClick={onSendToKitchen}
                  disabled={cartItems.length === 0}
                  className="col-span-2 h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40 uppercase tracking-widest text-sm"
                >
                    <ChefHat size={24} strokeWidth={2.5} />
                    <span>Send Order</span>
                </button>
            ) : (
                <button 
                  onClick={onCheckout}
                  disabled={cartItems.length === 0}
                  className="col-span-2 h-14 bg-primary-500 hover:bg-primary-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-primary-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40 uppercase tracking-widest text-sm"
                >
                    <span>Checkout</span>
                    <ArrowRight size={24} strokeWidth={2.5} />
                </button>
            )}
        </div>
      </div>

      <EditItemModal item={editingItem} isOpen={!!editingItem} onClose={() => setEditingItem(null)} onSave={onUpdateItem} formatCurrency={formatCurrency} />
      <GlobalDiscountModal isOpen={isDiscountModalOpen} onClose={() => setIsDiscountModalOpen(false)} currentDiscount={globalDiscount} onApply={setGlobalDiscount} subtotal={subtotalAfterItemDiscounts} formatCurrency={formatCurrency} discounts={discounts} />
    </aside>
  );
};

export default CartSidebar;