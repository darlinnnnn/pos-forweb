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
import { tables as initialTables, initialDiscounts } from './data';
import { Product, CartItem, Table, ShiftData, SelectedOption, BusinessType, DiscountState, CategoryGroup, DiscountRule, PrinterDevice } from './types';
import { Search, ScanLine, ArrowLeft, ShoppingBag, LayoutGrid, List } from 'lucide-react';
import { supaDataService } from './services/supaDataService';

function App() {
  // Storage Keys
  const STORAGE_KEYS = {
    SESSION: 'pos_session',
    HARDWARE: 'pos_hardware',
    USER: 'pos_user'
  };

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedOutlet, setSelectedOutlet] = useState<any>(null);
  const [currentUser, setCurrentUser] = useState<{ email: string; storeName: string; storeId?: string } | null>(null);
  const [registerId, setRegisterId] = useState<string | null>(null);

  // App UI State
  const [isSideMenuOpen, setIsSideMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [businessType, setBusinessType] = useState<BusinessType>('fnb');
  const [isMobileCartOpen, setIsMobileCartOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  // Session restore flag to prevent double-loading
  const [isSessionRestored, setIsSessionRestored] = useState(false);

  // Multi-outlet Mock Data - Removed usage but keeping variable if needed for ref
  const mockOutlets = [];

  // Restore session from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    const savedHardware = localStorage.getItem(STORAGE_KEYS.HARDWARE);

    let restoredUser = null;

    if (savedUser) {
      try {
        restoredUser = JSON.parse(savedUser);
        setCurrentUser(restoredUser);
        setIsAuthenticated(true);
      } catch (e) {
        console.error('Failed to restore user session', e);
      }
    }

    if (savedSession) {
      try {
        const session = JSON.parse(savedSession);
        if (session.outletId) {
          // Set initial partial data from storage to avoid flicker
          setSelectedOutlet({ id: session.outletId, name: session.outletName });

          // Immediately fetch full outlet configuration (receipt settings, etc) from DB
          if (restoredUser?.storeId) {
            supaDataService.getOutlets(restoredUser.storeId).then(outlets => {
              const active = outlets.find(o => o.id === session.outletId);
              if (active) {
                console.log('Restored full outlet config:', active);
                setSelectedOutlet(active);
              }
            });
          }

          setRegisterId(session.registerId);
          if (session.businessType) {
            setBusinessType(session.businessType);
          }
          // Restore shift if it was open
          if (session.shiftId) {
            setShiftData(prev => ({
              ...prev,
              isOpen: true,
              shiftId: session.shiftId,
              cashierId: session.cashierId,
              cashierName: session.cashierName || prev.cashierName
            }));
          }
        }
      } catch (e) {
        console.error('Failed to restore session', e);
      }
    }

    if (savedHardware) {
      try {
        const hw = JSON.parse(savedHardware);
        setPrinters(hw);
      } catch (e) {
        console.error('Failed to restore hardware', e);
      }
    }

    setIsSessionRestored(true);
  }, []);

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

  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>([]);
  const [discounts, setDiscounts] = useState<DiscountRule[]>(initialDiscounts);
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  // Load real data
  useEffect(() => {
    if (isAuthenticated) {
      const fetchData = async () => {
        try {
          const [fetchedCategories, fetchedProducts] = await Promise.all([
            supaDataService.getCategories(),
            supaDataService.getProducts()
          ]);
          setCategoryGroups(fetchedCategories);
          setProducts(fetchedProducts);
        } catch (error) {
          console.error("Failed to load data", error);
        }
      };
      fetchData();
    }
  }, [isAuthenticated]);

  const [printers, setPrinters] = useState<PrinterDevice[]>([]);

  // Save printers to localStorage when they change
  useEffect(() => {
    if (isSessionRestored) {
      localStorage.setItem(STORAGE_KEYS.HARDWARE, JSON.stringify(printers));
    }
  }, [printers, isSessionRestored]);

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
  const [activeKitchenPrinters, setActiveKitchenPrinters] = useState<{ name: string, width?: '58mm' | '80mm' }[]>([]);

  const handleLogin = (email: string, storeName: string, storeId?: string) => {
    const user = { email, storeName, storeId };
    setCurrentUser(user);
    setIsAuthenticated(true);
    // Save to localStorage
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
    // Initial cashier name set but shift still closed
    setShiftData(prev => ({ ...prev, cashierName: email.split('@')[0].toUpperCase() }));
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    // Keep hardware settings even after logout

    setIsAuthenticated(false);
    setSelectedOutlet(null);
    setCurrentUser(null);
    setCartItems([]);
    setSelectedTable(null);
    setIsSideMenuOpen(false);
    setShiftData(prev => ({ ...prev, isOpen: false, shiftId: undefined }));
  };

  const handleSelectOutlet = async (outlet: any) => {
    setSelectedOutlet(outlet);
    if (currentUser?.storeId) {
      const register = await supaDataService.getOrCreateRegister(currentUser.storeId, outlet.id);
      if (register) {
        setRegisterId(register.id);
        setShiftData(prev => ({ ...prev, registerName: register.name }));

        // Apply persisted business type
        let savedType: BusinessType = 'fnb';
        if (register.business_type) {
          savedType = register.business_type as BusinessType;
          setBusinessType(savedType);

          if (savedType === 'retail') {
            setOrderType('take-away');
            setSelectedTable(null);
          } else {
            setOrderType('dine-in');
          }
        }

        // Save session to localStorage
        const session = {
          outletId: outlet.id,
          outletName: outlet.name,
          registerId: register.id,
          businessType: savedType
        };
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
      }
    }
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
      setActiveKitchenPrinters(kitchenPrinters.map(p => ({ name: p.name, width: p.paperWidth })));
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
  const handleShiftUpdate = async (updatedData: Partial<ShiftData>) => {
    // Opening Shift
    if (updatedData.isOpen && !shiftData.isOpen) {
      if (currentUser?.storeId && selectedOutlet?.id && updatedData.cashierId && registerId) {
        try {
          const newShift = await supaDataService.startShift({
            storeId: currentUser.storeId,
            outletId: selectedOutlet.id,
            cashierId: updatedData.cashierId,
            registerId: registerId,
            startCash: updatedData.startCash || 0
          });

          if (newShift) {
            setShiftData(prev => ({
              ...prev,
              ...updatedData,
              shiftId: newShift.id,
              isOpen: true // Ensure it's explicitly set to true
            }));
            setIsShiftModalOpen(false);
            setIsSideMenuOpen(false);

            // Update session in localStorage with shift info
            const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
            if (savedSession) {
              const session = JSON.parse(savedSession);
              session.shiftId = newShift.id;
              session.cashierId = updatedData.cashierId;
              session.cashierName = updatedData.cashierName;
              localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
            }
          } else {
            alert("Failed to start shift. Please try again.");
          }
        } catch (e) {
          console.error(e);
          alert("Error starting shift");
        }
      } else {
        console.error("Missing required data to start shift");
      }
    }
    // Closing Shift
    else if (updatedData.isOpen === false && shiftData.isOpen && shiftData.shiftId) {
      try {
        // Calculate closing cash (start + (sales - expenses)) - simplified for now
        const closingCash = (shiftData.startCash || 0) + (shiftData.expectedCash || 0);
        await supaDataService.closeShift(shiftData.shiftId, closingCash);

        setShiftData(prev => ({ ...prev, isOpen: false, shiftId: undefined }));
        setIsShiftModalOpen(false);
        setIsSideMenuOpen(false);

        // Clear shift info from localStorage session
        const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
        if (savedSession) {
          const session = JSON.parse(savedSession);
          delete session.shiftId;
          delete session.cashierId;
          delete session.cashierName;
          localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
        }
      } catch (e) {
        console.error("Error closing shift", e);
      }
    }
    // Just updating local state (if any other case)
    else {
      setShiftData(prev => ({ ...prev, ...updatedData }));
      setIsShiftModalOpen(false);
      setIsSideMenuOpen(false);
    }
  };

  const handleChangeBusinessType = (type: BusinessType) => {
    setBusinessType(type);
    if (type === 'retail') { setOrderType('take-away'); setSelectedTable(null); } else { setOrderType('dine-in'); }

    // Persist to register settings
    if (registerId) {
      supaDataService.updateRegisterSettings(registerId, { businessType: type });
    }
  };



  const handleConfirmPayment = async (method: string) => {
    if (!currentUser?.storeId || !selectedOutlet?.id || !registerId || !shiftData.shiftId) {
      console.error("Missing order context", { currentUser, selectedOutlet, registerId, shiftData });
      return null;
    }

    try {
      const order = await supaDataService.createOrder({
        storeId: currentUser.storeId,
        outletId: selectedOutlet.id,
        registerId: registerId,
        cashierId: shiftData.cashierId,
        shiftId: shiftData.shiftId,
        paymentMethod: method,
        subtotal: subtotal,
        tax: tax,
        discount: totalDiscount,
        total: finalTotal
      }, cartItems);

      return order ? order.order_number : null;
    } catch (e) {
      console.error("Payment failed", e);
      return null;
    }
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
        for (let i = 0; i < (printer.copies || 1); i++) console.log(`%c[${printer.name}] %cRECEIPT (${printer.paperWidth}) copy ${i + 1}`, "color: #fbbf24;", "color: #fff;");
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
        outlets={[]} // Now optional/managed internally
        onSelect={handleSelectOutlet}
        onBack={() => setIsAuthenticated(false)}
        storeName={currentUser?.storeName || 'ElegantPOS'}
        storeId={currentUser?.storeId}
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
          outletId={selectedOutlet?.id}
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
      <ShiftModal isOpen={isShiftModalOpen} onClose={() => setIsShiftModalOpen(false)} shiftData={shiftData} onConfirmShift={handleShiftUpdate} outletId={selectedOutlet?.id} />
      <VariantModal isOpen={isVariantModalOpen} onClose={() => setIsVariantModalOpen(false)} product={selectedProductForVariant} onAddToCart={addToCart} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} businessType={businessType} onChangeBusinessType={handleChangeBusinessType} categoryGroups={categoryGroups} onUpdateCategoryGroups={setCategoryGroups} discounts={discounts} onUpdateDiscounts={setDiscounts} printers={printers} onUpdatePrinters={setPrinters} />
      <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} total={finalTotal} subtotal={subtotal} tax={tax} discount={totalDiscount} cartItems={cartItems} onComplete={handleTransactionComplete} globalDiscountName={globalDiscount.name} globalDiscountAmount={globalDiscountAmount} onConfirmPayment={handleConfirmPayment} cashierName={shiftData.cashierName} printers={printers} outlet={selectedOutlet} />

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