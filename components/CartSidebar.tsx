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
    <div className="relative overflow-hidden mb-1">
      <div className="absolute inset-y-0 right-0 w-[80px] bg-red-500/10 flex items-center justify-center z-0">
         <button onClick={(e) => { e.stopPropagation(); onRemove(item.cartId); }} className="w-full h-full flex flex-col items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-colors">
             <Trash2 size={20} />
             <span className="text-[10px] font-bold mt-1">Delete</span>
         </button>
      </div>
      <div 
        className="relative bg-slate-900 transition-transform duration-300 ease-out border-b border-slate-800/50 -mx-4 md:-mx-5 z-10"
        style={{ transform: `translateX(${offsetX}px)` }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={() => { if (isOpen) { setIsOpen(false); setOffsetX(0); } else { onEdit(item); } }}
      >
         <div className="py-3 px-4 md:px-5 flex gap-3">
             <div className="relative">
                <div className="w-14 h-14 rounded-lg bg-cover bg-center shrink-0 border border-slate-700/50 shadow-sm relative overflow-hidden" style={{ backgroundImage: `url('${item.image}')` }}></div>
                {item.isUnsent && (
                    <div className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full animate-pulse"></div>
                )}
             </div>
             <div className="flex-1 min-w-0 flex flex-col justify-between">
                 <div className="flex justify-between items-start mb-0.5">
                    <h4 className="text-sm font-bold text-slate-100 leading-tight truncate pr-2 select-none">{item.name}</h4>
                    <div className="text-right shrink-0">
                       <div className="text-sm font-bold text-white tabular-nums">{formatCurrency(finalTotal)}</div>
                    </div>
                 </div>
                 <div className="flex flex-col gap-0.5 mb-2 select-none">
                    {item.selectedOptions?.map((opt, idx) => (
                        <div key={idx} className="text-[10px] flex items-center gap-1.5">
                            <span className="w-1 h-1 rounded-full bg-slate-600 shrink-0"></span>
                            <span className="text-slate-400 truncate">{opt.groupName}: <span className="text-primary-400 font-semibold">{opt.name}</span></span>
                        </div>
                    ))}
                    {item.notes && <div className="text-[10px] text-slate-500 italic mt-1 truncate"><MessageSquare size={10} className="inline mr-1" />{item.notes}</div>}
                 </div>
                 <div className="flex justify-between items-center" onClick={(e) => e.stopPropagation()}>
                     <div className="flex items-center bg-slate-800 rounded-lg border border-slate-700 h-7">
                        <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, -1); }} className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-white rounded-l-lg transition-colors"><Minus size={14} /></button>
                        <span className="w-8 text-center text-xs font-bold text-white">{item.quantity}</span>
                        <button onClick={(e) => { e.stopPropagation(); onUpdateQuantity(item.cartId, 1); }} className="w-8 h-full flex items-center justify-center text-slate-400 hover:text-white rounded-r-lg transition-colors"><Plus size={14} /></button>
                     </div>
                     <div className="flex items-center gap-2">
                        {item.isUnsent && <span className="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">New</span>}
                        <button onClick={() => onEdit(item)} className="p-1.5 text-slate-500 hover:text-primary-400 transition-all"><Edit3 size={16} /></button>
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
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-t-2xl sm:rounded-2xl w-full max-w-sm shadow-2xl animate-in slide-in-from-bottom duration-300">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Edit Item</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-5 space-y-5">
                    <div className="flex gap-3">
                         <div className="w-16 h-16 rounded-lg bg-cover bg-center shrink-0 border border-slate-700" style={{ backgroundImage: `url('${item.image}')` }}></div>
                         <div><h4 className="font-bold text-white">{item.name}</h4><p className="text-sm text-primary-400 font-mono">{formatCurrency(item.price)}</p></div>
                    </div>
                     <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-500 uppercase">Quantity</label>
                        <div className="flex items-center h-12 bg-slate-950 border border-slate-700 rounded-xl overflow-hidden">
                           <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-14 h-full flex items-center justify-center hover:bg-slate-800 text-slate-400"><Minus size={20} /></button>
                           <span className="flex-1 text-center font-bold text-white text-lg">{quantity}</span>
                           <button onClick={() => setQuantity(quantity + 1)} className="w-14 h-full flex items-center justify-center hover:bg-slate-800 text-slate-400"><Plus size={20} /></button>
                        </div>
                    </div>
                    <div className="space-y-2">
                         <label className="text-xs font-bold text-slate-500 uppercase">Notes</label>
                         <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-primary-500 h-20 resize-none" placeholder="Add instructions..."/>
                    </div>
                </div>
                <div className="p-4 border-t border-slate-800 bg-slate-900/50">
                    <button onClick={handleSave} className="w-full h-12 bg-primary-500 text-slate-900 font-bold rounded-xl active:scale-[0.98] transition-all">Save Changes</button>
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
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
             <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                    <h3 className="text-lg font-bold text-white">Order Discount</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white"><X size={20}/></button>
                </div>
                <div className="p-5 space-y-4">
                    {discounts.map(rule => (
                        <button key={rule.id} onClick={() => { onApply({ type: rule.type, value: rule.value, name: rule.name }); onClose(); }} className={`w-full flex items-center justify-between p-4 rounded-xl border ${currentDiscount.name === rule.name ? 'bg-primary-500/10 border-primary-500' : 'bg-slate-800 border-slate-700 hover:border-slate-500'}`}>
                            <div className="text-left"><div className="font-bold text-sm text-white">{rule.name}</div><div className="text-xs text-slate-500">{rule.type === 'percent' ? `${rule.value}% Off` : `Rp ${rule.value.toLocaleString()} Off`}</div></div>
                            {currentDiscount.name === rule.name && <Check size={16} className="text-primary-500" />}
                        </button>
                    ))}
                    <button onClick={() => { onApply({ type: 'nominal', value: 0 }); onClose(); }} className="w-full p-3 text-xs text-slate-500 font-bold uppercase tracking-widest hover:text-red-400 transition-colors">Clear Discount</button>
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
    <aside className={`bg-slate-900 border-l border-slate-800 flex flex-col shadow-2xl z-40 h-full transition-all duration-300 ${isMobile ? 'w-full max-w-[90vw] ml-auto' : (isExpanded ? 'w-[600px]' : 'w-[400px]')}`}>
      {/* Mobile Header */}
      {isMobile && (
        <div className="shrink-0 px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between z-30 shadow-md">
            <button onClick={onClose} className="w-10 h-10 flex items-center justify-center bg-slate-800 rounded-full text-slate-300"><ArrowLeft size={20} /></button>
            <div className="text-center"><h2 className="font-bold text-white">Current Order</h2><p className="text-[10px] text-slate-500 uppercase font-bold">{totalItems} Items</p></div>
            <button onClick={onClose} className="text-xs font-bold text-primary-500 bg-primary-500/10 px-3 py-2 rounded-lg border border-primary-500/20 uppercase tracking-tighter">Add More</button>
        </div>
      )}

      {/* Settings Row */}
      <div className="shrink-0 p-4 border-b border-slate-800 space-y-3">
        <div className="flex gap-2">
            <button className="flex-1 flex items-center justify-between text-slate-200 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-bold">
                <div className="flex items-center gap-2"><User size={16} className="text-primary-500" />{selectedCustomer.name}</div>
                <ChevronDown size={14} className="text-slate-500" />
            </button>
            {businessType === 'fnb' && (
                <div className="relative w-32 shrink-0">
                    <select value={orderType} onChange={(e) => setOrderType(e.target.value as any)} className="w-full h-10 bg-slate-800 border border-slate-700 text-slate-200 rounded-xl pl-8 pr-6 text-xs font-bold appearance-none cursor-pointer">
                        <option value="dine-in">Dine In</option>
                        <option value="take-away">Take Away</option>
                        <option value="delivery">Delivery</option>
                    </select>
                    <div className="absolute inset-y-0 left-2.5 flex items-center pointer-events-none text-slate-400">
                        {orderType === 'dine-in' ? <UtensilsCrossed size={14} /> : <Package size={14} />}
                    </div>
                </div>
            )}
            {!isMobile && <button onClick={() => setIsExpanded(!isExpanded)} className="h-10 w-10 flex items-center justify-center text-slate-400 border border-slate-700 rounded-xl">{isExpanded ? <ArrowRightFromLine size={18} /> : <ArrowLeftFromLine size={18} />}</button>}
        </div>
        {isDineIn && (
             <div className={`flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all ${isOccupiedTable ? 'bg-primary-500/5 border-primary-500' : 'bg-slate-800 border-slate-700 border-dashed'}`}>
                <MapPin size={16} className={isOccupiedTable ? 'text-primary-500' : 'text-slate-500'} />
                <div className="flex-1 flex items-center justify-between">
                    <span className={`text-sm font-bold ${isOccupiedTable ? 'text-white' : 'text-slate-500'}`}>{selectedTable ? `Table ${selectedTable.name} (${selectedTable.section})` : 'No Table Selected'}</span>
                    <button onClick={onReselectTable} className="text-[10px] font-black uppercase tracking-widest text-primary-400 bg-primary-500/10 px-2 py-1 rounded-lg">Change</button>
                </div>
             </div>
        )}
      </div>

      {/* Cart Items */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
        {cartItems.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center opacity-30 select-none"><ShoppingBag size={48} className="mb-4" /><p className="font-black uppercase tracking-widest text-xs">Order List Empty</p></div>
        ) : (
            cartItems.map((item) => (
                <CartItemRow key={item.cartId} item={item} onUpdateQuantity={onUpdateQuantity} onRemove={onRemove} onEdit={setEditingItem} formatCurrency={formatCurrency} />
            ))
        )}
      </div>

      {/* Footer */}
      <div className="p-4 md:p-6 bg-slate-900 border-t border-slate-800 shadow-[0_-4px_30px_rgba(0,0,0,0.4)]">
        <div className="space-y-2 mb-6">
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest"><span>Subtotal</span><span className="text-slate-300">{formatCurrency(subtotal)}</span></div>
            {totalDiscount > 0 && <div className="flex justify-between text-xs font-bold text-emerald-500 uppercase tracking-widest"><span>Total Discounts</span><span>-{formatCurrency(totalDiscount)}</span></div>}
            <div className="flex justify-between text-xs font-bold text-slate-500 uppercase tracking-widest"><span>Tax (11%)</span><span className="text-slate-300">{formatCurrency(tax)}</span></div>
            <div className="pt-4 flex justify-between items-end border-t border-slate-800 mt-2">
                <span className="text-xs font-black uppercase text-slate-500 tracking-[0.2em]">Total Amount</span>
                <span className="text-3xl font-black text-primary-400 tabular-nums leading-none tracking-tight">{formatCurrency(total)}</span>
            </div>
        </div>

        <div className="grid grid-cols-4 gap-3">
            <button onClick={onClear} className="h-14 bg-slate-800 text-slate-500 hover:text-red-400 rounded-2xl flex items-center justify-center border border-slate-700 transition-all"><Trash size={20} /></button>
            <button onClick={() => setIsDiscountModalOpen(true)} className={`h-14 rounded-2xl border flex items-center justify-center transition-all ${globalDiscount.value > 0 ? 'bg-primary-500 text-slate-950 border-primary-500' : 'bg-slate-800 text-slate-400 border-slate-700'}`}><Percent size={20} /></button>
            
            {isDineIn && (hasUnsentItems || !isOccupiedTable) ? (
                <button 
                  onClick={onSendToKitchen}
                  disabled={cartItems.length === 0}
                  className="col-span-2 h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-emerald-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40"
                >
                    <ChefHat size={24} />
                    <span>Send Order</span>
                </button>
            ) : (
                <button 
                  onClick={onCheckout}
                  disabled={cartItems.length === 0}
                  className="col-span-2 h-14 bg-primary-500 hover:bg-primary-400 text-slate-950 font-black rounded-2xl shadow-lg shadow-primary-500/10 active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-40"
                >
                    <span>Checkout</span>
                    <ArrowRight size={24} />
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