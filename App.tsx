import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import CategoryPills from './components/CategoryPills';
import ProductCard from './components/ProductCard';
import CartSidebar from './components/CartSidebar';
import TableSelector from './components/TableSelector';
import ShiftModal from './components/ShiftModal';
import VariantModal from './components/VariantModal';
import SettingsModal from './components/SettingsModal';
import CheckoutModal from './components/CheckoutModal';
import { products, tables as initialTables, initialCategoryGroups, initialDiscounts } from './data';
import { Product, CartItem, Table, ShiftData, SelectedOption, BusinessType, DiscountState, CategoryGroup, DiscountRule } from './types';
import { Search, ScanLine, ArrowLeft, Lock, ShoppingBag } from 'lucide-react';

function App() {
  // App Settings State
  const [businessType, setBusinessType] = useState<BusinessType>('fnb');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Responsive State
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>(initialCategoryGroups);
  const [discounts, setDiscounts] = useState<DiscountRule[]>(initialDiscounts);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<DiscountState>({ type: 'nominal', value: 0 });
  
  // State for Table and Order Logic
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [orderType, setOrderType] = useState<'dine-in' | 'take-away' | 'delivery'>('dine-in');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Shift Management State
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [shiftData, setShiftData] = useState<ShiftData>({
    isOpen: true,
    cashierName: 'Sarah J.',
    startCash: 500000,
    expectedCash: 3500000, // Mocked expected cash (start + cash sales)
  });

  // Variant Modal State
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);

  // Checkout Modal State
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Determine which view to show
  const showTableSelector = businessType === 'fnb' && orderType === 'dine-in' && !selectedTable;

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, searchQuery]);

  // Handle Product Click
  const handleProductClick = (product: Product) => {
    if (!shiftData.isOpen) {
      setIsShiftModalOpen(true);
      return;
    }

    const hasOptions = (product.optionGroups && product.optionGroups.length > 0) || 
                       (product.variants && product.variants.length > 0) || 
                       (product.addons && product.addons.length > 0);

    if (hasOptions) {
        setSelectedProductForVariant(product);
        setIsVariantModalOpen(true);
    } else {
        addToCart(product, [], 1, '');
    }
  };

  // Add to Cart Logic
  const addToCart = (product: Product, selectedOptions: SelectedOption[] = [], quantity: number = 1, notes: string = '') => {
    setCartItems((prev) => {
      const existing = prev.find((item) => {
         const sameProduct = item.id === product.id;
         const itemOptionIds = item.selectedOptions.map(o => o.id).sort().join(',');
         const currentOptionIds = selectedOptions.map(o => o.id).sort().join(',');
         return sameProduct && (itemOptionIds === currentOptionIds);
      });

      if (existing) {
        return prev.map((item) => {
           if (item.cartId === existing.cartId) {
               return { ...item, quantity: item.quantity + quantity, notes: notes || item.notes };
           }
           return item;
        });
      }
      
      const optionsPrice = selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
      const finalPrice = product.price + optionsPrice;

      return [...prev, { 
          ...product, 
          cartId: `${Date.now()}-${Math.random()}`, 
          quantity, 
          selectedOptions,
          price: finalPrice, 
          notes,
          discount: 0 // Initialize explicit item discount
      }];
    });
  };

  const removeFromCart = (cartId: string) => {
    setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  };

  const updateQuantity = (cartId: string, delta: number) => {
    setCartItems((prev) => {
      return prev.map((item) => {
        if (item.cartId === cartId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : item;
        }
        return item;
      });
    });
  };

  // New function to update arbitrary item fields (notes, discount)
  const updateCartItem = (cartId: string, updates: Partial<CartItem>) => {
    setCartItems(prev => prev.map(item => item.cartId === cartId ? { ...item, ...updates } : item));
  };

  const clearCart = () => {
      setCartItems([]);
      setGlobalDiscount({ type: 'nominal', value: 0 });
  };

  const handleTableSelect = (table: Table) => {
    if (!shiftData.isOpen) {
        setIsShiftModalOpen(true);
        return;
    }
    setSelectedTable(table);
  };

  const handleReselectTable = () => {
    setSelectedTable(null);
  };

  const handleAddTable = (newTable: Table) => {
    setTables((prev) => [...prev, newTable]);
  };

  const handleDeleteTable = (tableId: string) => {
    setTables((prev) => prev.filter((t) => t.id !== tableId));
    if (selectedTable?.id === tableId) {
      setSelectedTable(null);
    }
  };

  const handleShiftUpdate = (updatedData: Partial<ShiftData>) => {
    setShiftData(prev => ({ ...prev, ...updatedData }));
    setIsShiftModalOpen(false);
  };

  const handleChangeBusinessType = (type: BusinessType) => {
    setBusinessType(type);
    if (type === 'retail') {
        setOrderType('take-away');
        setSelectedTable(null);
    } else {
        setOrderType('dine-in');
    }
  };

  const handleUpdateCategoryGroups = (newGroups: CategoryGroup[]) => {
      setCategoryGroups(newGroups);
  };

  // Checkout Logic
  const handleCheckout = () => {
    setIsCheckoutOpen(true);
  };

  const handleTransactionComplete = () => {
    setIsCheckoutOpen(false);
    clearCart();
  };

  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  // Calculate Total for Checkout
  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const itemDiscounts = cartItems.reduce((acc, item) => acc + ((item.discount || 0) * item.quantity), 0);
  const subtotalAfterItemDiscounts = subtotal - itemDiscounts;
  const globalDiscountAmount = globalDiscount.type === 'nominal' 
     ? globalDiscount.value 
     : (subtotalAfterItemDiscounts * globalDiscount.value) / 100;
  const totalDiscount = itemDiscounts + globalDiscountAmount;
  const taxableAmount = Math.max(0, subtotal - totalDiscount);
  const tax = taxableAmount * 0.11;
  const finalTotal = taxableAmount + tax;


  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-950 text-slate-200 overflow-hidden">
      {/* Left Section: Header + Main Content */}
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <Header 
            shiftData={shiftData}
            onOpenShiftModal={() => setIsShiftModalOpen(true)}
            onOpenSettings={() => setIsSettingsOpen(true)}
        />
        
        <main className="flex-1 overflow-hidden flex flex-col relative bg-slate-950">
          
          {showTableSelector ? (
            <TableSelector 
              tables={tables}
              onSelectTable={handleTableSelect} 
              onAddTable={handleAddTable}
              onDeleteTable={handleDeleteTable}
            />
          ) : (
            <>
              {/* Top Filter Bar */}
              <div className="p-4 md:p-6 pb-2 shrink-0 z-10 bg-slate-950/95 backdrop-blur-md sticky top-0">
                <div className="flex flex-col gap-4 md:gap-5">
                  
                  {/* Search Bar & Back Button */}
                  <div className="flex gap-2 md:gap-3">
                    {businessType === 'fnb' && orderType === 'dine-in' && selectedTable && (
                       <button 
                         onClick={handleReselectTable}
                         className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-slate-800 border border-slate-700 text-slate-300 rounded-xl md:rounded-2xl hover:bg-slate-700 hover:text-white transition-all shadow-sm shrink-0"
                         title="Back to Tables"
                       >
                         <ArrowLeft size={20} className="md:w-6 md:h-6" />
                       </button>
                    )}

                    <div className="relative w-full group">
                      <div className="absolute inset-y-0 left-0 pl-3 md:pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary-500 transition-colors">
                        <Search className="w-4 h-4 md:w-5 md:h-5" />
                      </div>
                      <input 
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-12 md:h-14 bg-slate-900 border border-slate-800 text-white rounded-xl md:rounded-2xl pl-10 md:pl-12 pr-12 md:pr-14 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 placeholder:text-slate-600 transition-all font-medium text-base md:text-lg shadow-inner"
                        placeholder="Search items..."
                      />
                      <div className="absolute inset-y-0 right-0 pr-2 flex items-center">
                        <button className="p-2 text-slate-400 hover:text-white transition-colors bg-slate-800/50 rounded-lg md:rounded-xl hover:bg-slate-700">
                          <ScanLine className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Categories */}
                  <CategoryPills 
                    activeCategory={activeCategory} 
                    onSelectCategory={setActiveCategory}
                    categoryGroups={categoryGroups}
                  />
                </div>
              </div>

              {/* Product Grid Area */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-2">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 pb-24 lg:pb-20">
                  {filteredProducts.map((product) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAdd={handleProductClick} 
                    />
                  ))}
                  {filteredProducts.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-500">
                      <p className="text-lg">No products found.</p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

           {/* Shift Closed Overlay */}
           {!shiftData.isOpen && (
             <div className="absolute inset-0 z-40 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in duration-500">
                <div className="bg-slate-900 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-md w-full text-center space-y-4 relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-red-500 to-red-600"></div>
                    <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto text-slate-500 mb-2">
                        <Lock size={40} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-white">Shift Closed</h2>
                        <p className="text-slate-400 mt-2">The register is currently closed. You must open a new shift to start taking orders and processing transactions.</p>
                    </div>
                    <button 
                        onClick={() => setIsShiftModalOpen(true)}
                        className="w-full h-14 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl text-lg shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98] mt-4"
                    >
                        Open Register Shift
                    </button>
                </div>
             </div>
           )}

        </main>
        
        {/* Mobile Floating Cart Button */}
        {isMobile && (
          <div className="absolute bottom-6 right-6 z-30">
             <button 
               onClick={() => setIsMobileCartOpen(true)}
               className="relative w-16 h-16 bg-primary-500 rounded-full shadow-lg shadow-primary-500/30 text-slate-900 flex items-center justify-center hover:bg-primary-400 transition-transform active:scale-95"
             >
                <ShoppingBag size={28} strokeWidth={2.5} />
                {cartTotalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-slate-950">
                    {cartTotalItems}
                  </span>
                )}
             </button>
          </div>
        )}
      </div>

      {/* Right Section: Sidebar */}
      {/* Desktop: Always visible, Mobile: Slide-over */}
      <div 
        className={`
          fixed inset-0 z-50 lg:static lg:z-auto lg:h-screen lg:flex lg:flex-col
          transition-transform duration-300 ease-in-out
          ${isMobile 
             ? (isMobileCartOpen ? 'translate-x-0' : 'translate-x-full') 
             : 'translate-x-0'
          }
        `}
      >
          {/* Mobile Overlay Background */}
          {isMobile && isMobileCartOpen && (
            <div 
              className="absolute inset-0 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={() => setIsMobileCartOpen(false)}
            ></div>
          )}

          <div className="relative h-full flex flex-col w-full lg:w-auto">
             <CartSidebar 
                cartItems={cartItems} 
                onUpdateQuantity={updateQuantity}
                onRemove={removeFromCart}
                onUpdateItem={updateCartItem}
                onClear={clearCart}
                orderType={orderType}
                setOrderType={setOrderType}
                selectedTable={selectedTable}
                onReselectTable={handleReselectTable}
                businessType={businessType}
                isMobile={isMobile}
                onClose={() => setIsMobileCartOpen(false)}
                globalDiscount={globalDiscount}
                setGlobalDiscount={setGlobalDiscount}
                onCheckout={handleCheckout}
                discounts={discounts}
             />
             
             {/* Sidebar Overlay when shift closed (Desktop) */}
             {!isMobile && !shiftData.isOpen && (
                <div className="absolute inset-0 z-50 bg-slate-950/50 backdrop-blur-[2px] cursor-not-allowed"></div>
             )}
          </div>
      </div>

      {/* Global Modals */}
      <ShiftModal 
        isOpen={isShiftModalOpen}
        onClose={() => setIsShiftModalOpen(false)}
        shiftData={shiftData}
        onConfirmShift={handleShiftUpdate}
      />
      
      <VariantModal 
         isOpen={isVariantModalOpen}
         onClose={() => setIsVariantModalOpen(false)}
         product={selectedProductForVariant}
         onAddToCart={addToCart}
      />

      <SettingsModal 
         isOpen={isSettingsOpen}
         onClose={() => setIsSettingsOpen(false)}
         businessType={businessType}
         onChangeBusinessType={handleChangeBusinessType}
         categoryGroups={categoryGroups}
         onUpdateCategoryGroups={handleUpdateCategoryGroups}
         discounts={discounts}
         onUpdateDiscounts={setDiscounts}
      />
      
      <CheckoutModal
         isOpen={isCheckoutOpen}
         onClose={() => setIsCheckoutOpen(false)}
         total={finalTotal}
         subtotal={subtotal}
         tax={tax}
         discount={totalDiscount}
         cartItems={cartItems}
         onComplete={handleTransactionComplete}
         globalDiscountName={globalDiscount.name}
         globalDiscountAmount={globalDiscountAmount}
      />
    </div>
  );
}

export default App;