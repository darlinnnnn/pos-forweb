import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import OutletSelector from './components/OutletSelector';
import CategoryPills from './components/CategoryPills';
import ProductCard from './components/ProductCard';
import CartSidebar from './components/CartSidebar';
import TableSelector from './components/TableSelector';
import ShiftModal from './components/ShiftModal';
import VariantModal from './components/VariantModal';
import SettingsModal from './components/SettingsModal';
import CheckoutModal from './components/CheckoutModal';
import ControlCenter from './components/ControlCenter';
import KitchenPreviewModal from './components/KitchenPreviewModal';
import { products as initialProducts, tables as initialTables, initialCategoryGroups, initialDiscounts } from './data';
import { Product, CartItem, Table, ShiftData, SelectedOption, BusinessType, DiscountState, CategoryGroup, DiscountRule, PrinterDevice } from './types';
import { Search, ScanLine, ArrowLeft, ShoppingBag, LayoutGrid, List } from 'lucide-react';

function App() {
  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<{email: string; storeName: string} | null>(null);

  // App UI State
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType>('fnb');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Multi-outlet Mock Data
  const mockOutlets = [
    { id: 'out-1', name: 'Downtown Hub', address: 'Jl. Sudirman No. 45, Jakarta Selatan', isOpen: true, type: 'Flagship Store' },
    { id: 'out-2', name: 'Seaside Pavilion', address: 'Beachfront Road Block B, North Jakarta', isOpen: true, type: 'Cafe Express' },
    { id: 'out-3', name: 'Terrace Garden', address: 'Level 5 Rooftop, Mall Senayan, Jakarta', isOpen: false, type: 'Signature Dining' },
  ];

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>(initialCategoryGroups);
  const [discounts, setDiscounts] = useState<DiscountRule[]>(initialDiscounts);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [printers, setPrinters] = useState<PrinterDevice[]>([
    { id: 'net-002', name: 'Kitchen-Printer', ip: '192.168.1.200', status: 'online', type: 'network', copies: 1, printTypes: ['kitchen'], isActive: true, paperWidth: '80mm' },
    { id: 'esp-001', name: 'Front-POS', ip: '192.168.1.105', status: 'online', type: 'esp32', copies: 1, printTypes: ['receipt'], isActive: true, paperWidth: '80mm' },
  ]);
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [globalDiscount, setGlobalDiscount] = useState<DiscountState>({ type: 'nominal', value: 0 });
  const [tables, setTables] = useState<Table[]>(initialTables);
  const [orderType, setOrderType] = useState<'dine-in' | 'take-away' | 'delivery'>('dine-in');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);

  // Default shift to CLOSED for mandatory open flow
  const [shiftData, setShiftData] = useState<ShiftData>({
    isOpen: false,
    cashierName: 'Sarah J.',
    startCash: 0,
    expectedCash: 0,
  });

  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [selectedProductForVariant, setSelectedProductForVariant] = useState<Product | null>(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  // Kitchen Preview State
  const [isKitchenPreviewOpen, setIsKitchenPreviewOpen] = useState(false);
  const [lastKitchenOrderId, setLastKitchenOrderId] = useState('');
  const [kitchenOrderItems, setKitchenOrderItems] = useState<CartItem[]>([]);
  const [activeKitchenPrinters, setActiveKitchenPrinters] = useState<{name: string, width?: '58mm' | '80mm'}[]>([]);

  const handleLogin = (email: string, storeName: string) => {
    setCurrentUser({ email, storeName });
    setIsAuthenticated(true);
    // Initial cashier name set but shift still closed
    setShiftData(prev => ({ ...prev, cashierName: email.split('@')[0].toUpperCase() }));
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setSelectedOutlet(null);
    setCurrentUser(null);
    setCartItems([]);
    setSelectedTable(null);
    setIsSideMenuOpen(false);
    setShiftData(prev => ({ ...prev, isOpen: false }));
  };

  const handleSelectOutlet = (outlet: any) => {
    setSelectedOutlet(outlet);
    // After outlet selection, we don't automatically open shift, the flow handles it
  };

  const showTableSelector = businessType === 'fnb' && orderType === 'dine-in' && !selectedTable;

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesCategory = activeCategory === 'all' || product.category === activeCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) || product.sku.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const handleProductClick = (product: Product) => {
    if (!shiftData.isOpen) { setIsShiftModalOpen(true); return; }
    const hasOptions = (product.optionGroups && product.optionGroups.length > 0);
    if (hasOptions) { setSelectedProductForVariant(product); setIsVariantModalOpen(true); } else { addToCart(product, [], 1, ''); }
  };

  const addToCart = (product: Product, selectedOptions: SelectedOption[] = [], quantity: number = 1, notes: string = '') => {
    setCartItems((prev) => {
      const existing = prev.find((item) => {
         const sameProduct = item.id === product.id;
         const itemOptionIds = item.selectedOptions.map(o => o.id).sort().join(',');
         const currentOptionIds = selectedOptions.map(o => o.id).sort().join(',');
         return sameProduct && (itemOptionIds === currentOptionIds) && item.isUnsent;
      });
      if (existing) {
        return prev.map((item) => (item.cartId === existing.cartId ? { ...item, quantity: item.quantity + quantity, notes: notes || item.notes, isUnsent: true } : item));
      }
      const finalPrice = product.price + selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
      return [...prev, { ...product, cartId: `${Date.now()}-${Math.random()}`, quantity, selectedOptions, price: finalPrice, notes, discount: 0, isUnsent: true }];
    });
  };

  const removeFromCart = (cartId: string) => setCartItems((prev) => prev.filter((item) => item.cartId !== cartId));
  const updateQuantity = (cartId: string, delta: number) => {
    setCartItems((prev) => prev.map((item) => (item.cartId === cartId ? { ...item, quantity: Math.max(1, item.quantity + delta), isUnsent: item.isUnsent || false } : item)));
  };
  const updateCartItem = (cartId: string, updates: Partial<CartItem>) => setCartItems(prev => prev.map(item => item.cartId === cartId ? { ...item, ...updates } : item));
  const clearCart = () => { setCartItems([]); setGlobalDiscount({ type: 'nominal', value: 0 }); };

  const handleTableSelect = (table: Table) => {
    if (!shiftData.isOpen) { setIsShiftModalOpen(true); return; }
    setSelectedTable(table);
    if (table.status === 'occupied' && table.activeOrder) {
        setCartItems(table.activeOrder.map(item => ({ ...item, isUnsent: false })));
    } else {
        setCartItems([]);
    }
  };

  const handleReselectTable = () => {
    setSelectedTable(null);
    clearCart();
  };

  const handleSendToKitchen = () => {
      if (!selectedTable) return;
      
      const newItems = cartItems.filter(item => item.isUnsent);
      const kitchenPrinters = printers.filter(p => p.isActive && p.printTypes?.includes('kitchen'));
      const orderId = `K-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
      
      if (newItems.length > 0) {
          setLastKitchenOrderId(orderId);
          setKitchenOrderItems(newItems);
          setActiveKitchenPrinters(kitchenPrinters.map(p => ({name: p.name, width: p.paperWidth})));
          setIsKitchenPreviewOpen(true);

          const updatedOrder = cartItems.map(item => ({ ...item, isUnsent: false }));
          const updatedTables = tables.map(t => t.id === selectedTable.id ? { ...t, status: 'occupied', activeOrder: updatedOrder } : t);
          setTables(updatedTables as Table[]);
      }
      
      setSelectedTable(null);
      clearCart();
  };

  const handleAddTable = (newTable: Table) => setTables((prev) => [...prev, newTable]);
  const handleDeleteTable = (tableId: string) => { setTables((prev) => prev.filter((t) => t.id !== tableId)); if (selectedTable?.id === tableId) setSelectedTable(null); };
  const handleShiftUpdate = (updatedData: Partial<ShiftData>) => { 
    setShiftData(prev => ({ ...prev, ...updatedData })); 
    setIsShiftModalOpen(false); 
    setIsSideMenuOpen(false); 
  };
  
  const handleChangeBusinessType = (type: BusinessType) => {
    setBusinessType(type);
    if (type === 'retail') { setOrderType('take-away'); setSelectedTable(null); } else { setOrderType('dine-in'); }
  };

  const handleTransactionComplete = () => {
    if (selectedTable && orderType === 'dine-in') {
        const updatedTables = tables.map(t => t.id === selectedTable.id ? { ...t, status: 'available', activeOrder: undefined } : t);
        setTables(updatedTables as Table[]);
    }

    const receiptPrinters = printers.filter(p => p.isActive && p.printTypes?.includes('receipt'));
    if (receiptPrinters.length > 0) {
        console.log("%c--- PRINTING FINAL RECEIPT ---", "color: #f59e0b; font-weight: bold;");
        receiptPrinters.forEach(printer => {
            for (let i = 0; i < (printer.copies || 1); i++) console.log(`%c[${printer.name}] %cRECEIPT (${printer.paperWidth}) copy ${i+1}`, "color: #fbbf24;", "color: #fff;");
        });
    }
    setIsCheckoutOpen(false);
    setSelectedTable(null);
    clearCart();
  };

  const cartTotalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  const subtotal = cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const itemDiscounts = cartItems.reduce((acc, item) => acc + ((item.discount || 0) * item.quantity), 0);
  const globalDiscountAmount = globalDiscount.type === 'nominal' ? globalDiscount.value : ((subtotal - itemDiscounts) * globalDiscount.value) / 100;
  const totalDiscount = itemDiscounts + globalDiscountAmount;
  const tax = (subtotal - totalDiscount) * 0.11;
  const finalTotal = subtotal - totalDiscount + tax;

  // Flow: Login -> Outlet Select -> Mandatory Open Shift -> Dashboard
  if (!isAuthenticated) {
    return <Login onLogin={handleLogin} />;
  }

  if (isAuthenticated && !selectedOutlet) {
    return (
        <OutletSelector 
            outlets={mockOutlets} 
            onSelect={handleSelectOutlet} 
            onBack={() => setIsAuthenticated(false)} 
            storeName={currentUser?.storeName || 'ElegantPOS'} 
        />
    );
  }

  // Mandatory Open Shift Screen
  if (isAuthenticated && selectedOutlet && !shiftData.isOpen) {
    return (
        <div className="h-screen w-full bg-slate-950 flex flex-col items-center justify-center p-4">
            <ShiftModal 
                isOpen={true} 
                onClose={() => setSelectedOutlet(null)} 
                shiftData={shiftData} 
                onConfirmShift={handleShiftUpdate}
                isInitial={true}
            />
        </div>
    );
  }

  return (
    <div className="flex flex-col lg:flex-row h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-200 overflow-hidden text-[13px] md:text-sm transition-colors duration-500 animate-in fade-in duration-700">
      <div className="flex-1 flex flex-col min-w-0 relative h-full">
        <Header shiftData={shiftData} storeName={`${currentUser?.storeName} - ${selectedOutlet?.name}`} onOpenControlCenter={() => setIsSideMenuOpen(true)} />
        <main className="flex-1 overflow-hidden flex flex-col relative bg-slate-50 dark:bg-slate-950 transition-colors">
          {showTableSelector ? (
            <TableSelector tables={tables} onSelectTable={handleTableSelect} onAddTable={handleAddTable} onDeleteTable={handleDeleteTable} />
          ) : (
            <>
              <div className="p-4 md:p-6 pb-2 shrink-0 z-10 bg-slate-50/95 dark:bg-slate-950/95 backdrop-blur-md sticky top-0 border-b border-slate-200 dark:border-slate-800/50">
                <div className="flex flex-col gap-4">
                  <div className="flex gap-2">
                    {businessType === 'fnb' && orderType === 'dine-in' && selectedTable && (
                       <button onClick={handleReselectTable} className="flex items-center justify-center w-12 h-12 md:w-14 md:h-14 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-300 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-all shadow-sm shrink-0"><ArrowLeft size={20} /></button>
                    )}
                    <div className="relative w-full group">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400 dark:text-slate-500 group-focus-within:text-primary-500 transition-colors"><Search className="w-5 h-5" /></div>
                      <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full h-12 md:h-14 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white rounded-2xl pl-12 pr-14 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500 placeholder:text-slate-300 dark:placeholder:text-slate-700 font-medium text-lg transition-all shadow-sm dark:shadow-none" placeholder="Search menu items..." />
                      <div className="absolute inset-y-0 right-0 pr-2 flex items-center"><button className="p-2 text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors bg-slate-100 dark:bg-slate-800/50 rounded-xl"><ScanLine className="w-5 h-5" /></button></div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <CategoryPills activeCategory={activeCategory} onSelectCategory={setActiveCategory} categoryGroups={categoryGroups} />
                    </div>
                    <div className="flex bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-1 rounded-2xl shrink-0 shadow-sm dark:shadow-none">
                        <button 
                          onClick={() => setViewMode('grid')}
                          className={`size-10 md:size-12 rounded-xl flex items-center justify-center transition-all ${viewMode === 'grid' ? 'bg-primary-500 text-slate-950 shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                        >
                            <LayoutGrid size={20} />
                        </button>
                        <button 
                          onClick={() => setViewMode('list')}
                          className={`size-10 md:size-12 rounded-xl flex items-center justify-center transition-all ${viewMode === 'list' ? 'bg-primary-500 text-slate-950 shadow-lg' : 'text-slate-400 dark:text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                        >
                            <List size={20} />
                        </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 md:p-6 pt-2">
                <div className={`
                    grid gap-3 pb-24 lg:pb-20
                    ${viewMode === 'grid' 
                        ? 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5' 
                        : 'grid-cols-1'
                    }
                `}>
                  {filteredProducts.map((product) => ( 
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      onAdd={handleProductClick} 
                      viewMode={viewMode}
                    /> 
                  ))}
                </div>
              </div>
            </>
          )}
        </main>
        {isMobile && <div className="absolute bottom-6 right-6 z-30"><button onClick={() => setIsMobileCartOpen(true)} className="relative w-16 h-16 bg-primary-500 rounded-full shadow-lg shadow-primary-500/30 text-slate-900 flex items-center justify-center hover:bg-primary-400 active:scale-95 transition-transform"><ShoppingBag size={28} />{cartTotalItems > 0 && <span className="absolute -top-1 -right-1 w-6 h-6 bg-red-500 rounded-full text-white text-xs font-bold flex items-center justify-center border-2 border-slate-50 dark:border-slate-950 transition-colors">{cartTotalItems}</span>}</button></div>}
      </div>
      
      <div className={`fixed inset-0 z-50 lg:static lg:z-auto lg:h-screen lg:flex lg:flex-col transition-transform duration-300 ${isMobile ? (isMobileCartOpen ? 'translate-x-0' : 'translate-x-full') : 'translate-x-0'}`}>
        {isMobile && isMobileCartOpen && <div className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-sm lg:hidden transition-colors" onClick={() => setIsMobileCartOpen(false)}></div>}
        <div className="relative h-full flex flex-col w-full">
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
                onCheckout={() => setIsCheckoutOpen(true)} 
                onSendToKitchen={handleSendToKitchen} 
                discounts={discounts} 
            />
        </div>
      </div>

      <ControlCenter 
        isOpen={isSideMenuOpen} 
        onClose={() => setIsSideMenuOpen(false)} 
        shiftData={shiftData} 
        onOpenShiftModal={() => { setIsSideMenuOpen(false); setIsShiftModalOpen(true); }} 
        onOpenSettings={() => { setIsSideMenuOpen(false); setIsSettingsOpen(true); }}
        theme={theme}
        onToggleTheme={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
        onLogout={handleLogout}
      />
      <ShiftModal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} shiftData={shiftData} onConfirmShift={handleShiftUpdate} />
      <VariantModal isOpen={isVariantModalOpen} onClose={() => setIsVariantModalOpen(false)} product={selectedProductForVariant} onAddToCart={addToCart} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} businessType={businessType} onChangeBusinessType={handleChangeBusinessType} categoryGroups={categoryGroups} onUpdateCategoryGroups={setCategoryGroups} discounts={discounts} onUpdateDiscounts={setDiscounts} printers={printers} onUpdatePrinters={setPrinters} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} total={finalTotal} subtotal={subtotal} tax={tax} discount={totalDiscount} cartItems={cartItems} onComplete={handleTransactionComplete} globalDiscountName={globalDiscount.name} globalDiscountAmount={globalDiscountAmount} />
      
      <KitchenPreviewModal 
        isOpen={isKitchenPreviewOpen} 
        onClose={() => setIsKitchenPreviewOpen(false)} 
        items={kitchenOrderItems} 
        table={selectedTable} 
        orderId={lastKitchenOrderId} 
        cashierName={shiftData.cashierName}
        printers={activeKitchenPrinters}
      />
    </div>
  );
}

export default App;