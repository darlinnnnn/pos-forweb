import React, { useState, useEffect, useRef } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Printer, CheckCircle2, ArrowRight, Receipt, Share2, Copy, RefreshCw, Store } from 'lucide-react';
import { CartItem, PrinterDevice, Outlet } from '../types';
import { printerService, PrintJob, PrintLine } from '../services/printerService';

interface CheckoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    total: number;
    subtotal: number;
    tax: number;
    discount: number;
    cartItems: CartItem[];
    onComplete: () => void;
    globalDiscountName?: string;
    globalDiscountAmount?: number;
    onConfirmPayment: (method: string) => Promise<string | null>;
    cashierName?: string;
    printers: PrinterDevice[];
    outlet?: Outlet;
}

type PaymentMethod = 'cash' | 'card' | 'qris';

const CheckoutModal: React.FC<CheckoutModalProps> = ({
    isOpen,
    onClose,
    total,
    subtotal,
    tax,
    discount,
    cartItems,
    onComplete,
    globalDiscountName,
    globalDiscountAmount = 0,
    onConfirmPayment,
    cashierName = 'Cashier',
    printers,
    outlet
}) => {
    const [view, setView] = useState<'payment' | 'success'>('payment');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [cashGiven, setCashGiven] = useState('');
    const [isPrinting, setIsPrinting] = useState(true);
    const [orderId, setOrderId] = useState('');
    const [changeDue, setChangeDue] = useState(0);
    const [isPrintingNow, setIsPrintingNow] = useState(false);

    // Reset state on open
    useEffect(() => {
        if (isOpen) {
            setView('payment');
            setPaymentMethod('cash');
            setCashGiven('');
            setIsPrinting(true);
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const formatCurrency = (amount: number) => {
        // Use standard space instead of non-breaking space to prevent encoding issues ('Rpa')
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 })
            .format(amount)
            .replace(/\u00a0/g, ' ');
    };

    const cashAmount = parseInt(cashGiven) || 0;
    const change = Math.max(0, cashAmount - total);
    const isSufficient = paymentMethod !== 'cash' || cashAmount >= total;

    // Quick cash buttons
    const suggestions = [total, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000];
    const uniqueSuggestions = Array.from(new Set(suggestions)).filter(s => s >= total);

    // Build receipt print job for thermal printer
    const buildReceiptPrintJob = (orderNumber: string): PrintJob => {
        const lines: PrintLine[] = [];
        const separator = '--------------------------------'; // 32 chars for 58mm

        // Helper for 2-column layout (32 chars)
        const formatLayout = (left: string, right: string) => {
            const width = 32;
            // Ensure at least 1 space
            const maxLeft = width - right.length - 1;
            const safeLeft = left.length > maxLeft ? left.substring(0, maxLeft) : left;

            const spacing = width - safeLeft.length - right.length;
            const spaces = spacing > 0 ? ' '.repeat(spacing) : ' ';
            return safeLeft + spaces + right;
        };

        // Header
        const storeName = outlet?.name?.toUpperCase() || 'ELEGANTPOS';
        const receiptSettings = outlet?.receiptSettings || {};
        // Use 'show_header' from DB json to control address display as per user request mapping
        const showAddress = receiptSettings.show_header !== false;
        const address = outlet?.address || 'Jl. Sudirman No. 123, Jakarta';

        lines.push({ text: storeName, align: 'center' });

        if (showAddress && address) {
            // Split address if too long or just let standard behavior
            // Since manual formatting is hard without knowing font width, we rely on center align
            lines.push({ text: address, align: 'center' });
            lines.push({ text: '0812-3456-7890', align: 'center' }); // Keep phone with address
        }

        lines.push({ text: separator, align: 'center' });
        lines.push({ text: '' });

        // Order info
        lines.push({ text: formatLayout('Tanggal', new Date().toLocaleDateString('id-ID')) });
        lines.push({ text: formatLayout('Waktu', new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB') });

        // Handle potentially long order number
        const shortOrder = orderNumber.length > 15 ? orderNumber.substring(0, 15) + '...' : orderNumber;
        lines.push({ text: formatLayout('No. Transaksi', shortOrder) });
        lines.push({ text: formatLayout('Kasir', cashierName) });
        lines.push({ text: separator, align: 'center' });

        // Items
        cartItems.forEach(item => {
            lines.push({ text: item.name });
            const priceStr = ` ${item.quantity} x ${formatCurrency(item.price)}`;
            const totalStr = formatCurrency(item.price * item.quantity);
            lines.push({ text: formatLayout(priceStr, totalStr) });

            // Options
            item.selectedOptions?.forEach(opt => {
                if (opt.price > 0) {
                    const optName = ` + ${opt.name}`;
                    const optPrice = formatCurrency(opt.price * item.quantity);
                    lines.push({ text: formatLayout(optName, optPrice), size: 'small' });
                }
            });

            // Item discount
            if (item.discount && item.discount > 0) {
                lines.push({ text: formatLayout('  Disc', `-${formatCurrency(item.discount * item.quantity)}`), size: 'small' });
            }
        });

        lines.push({ text: separator, align: 'center' });

        // Totals
        lines.push({ text: formatLayout('Subtotal', formatCurrency(subtotal)) });
        if (totalItemDiscounts > 0) {
            lines.push({ text: formatLayout('Diskon', `-${formatCurrency(totalItemDiscounts)}`) });
        }
        if (globalDiscountAmount > 0) {
            lines.push({ text: formatLayout(globalDiscountName || 'Discount', `-${formatCurrency(globalDiscountAmount)}`) });
        }
        lines.push({ text: formatLayout('Pajak (11%)', formatCurrency(tax)) });
        lines.push({ text: separator, align: 'center' });

        // Final Total
        // Whole line bold for emphasis
        lines.push({ text: formatLayout('Total Bayar', formatCurrency(total)), bold: true, size: 'normal' });
        lines.push({ text: formatLayout('Metode', paymentMethod.toUpperCase()) });

        lines.push({ text: separator, align: 'center' });

        // Footer
        if (receiptSettings.show_footer !== false) {
            lines.push({ text: '' }); // Spacing before footer
            const footerText = receiptSettings.footer_text || 'Terima kasih telah berbelanja.\nBarang yang sudah dibeli\ntidak dapat ditukar.';
            const footerLines = footerText.split('\n');
            footerLines.forEach((line: string) => {
                if (line.trim()) lines.push({ text: line.trim(), align: 'center' });
            });
        }

        // lines.push({ text: '' }); // Single final feed line

        return { lines, cut: true };
    };

    // Print receipt function
    const printReceipt = async (orderNumber: string) => {
        if (printers.length === 0) {
            console.log('[Print] No printers configured');
            return;
        }

        setIsPrintingNow(true);
        const job = buildReceiptPrintJob(orderNumber);

        try {
            const results = await printerService.printByType('receipt', job, printers);
            console.log('[Print] Results:', results);

            const success = results.some(r => r.success);
            if (!success && results.length > 0) {
                console.warn('[Print] All printers failed:', results);
            }
        } catch (e) {
            console.error('[Print] Error:', e);
        }

        setIsPrintingNow(false);
    };

    const handleProcessPayment = async () => {
        // Call parent to create order in DB
        const newOrderId = await onConfirmPayment(paymentMethod);

        if (newOrderId) {
            setOrderId(newOrderId);
            setChangeDue(change);

            // Print receipt if enabled
            if (isPrinting) {
                await printReceipt(newOrderId);
            }

            setView('success');
        } else {
            alert("Failed to create order. Please try again.");
        }
    };

    const handleNewOrder = () => {
        onComplete(); // This clears the cart in parent
    };

    // Calculate distinct Item Discounts for receipt
    const totalItemDiscounts = cartItems.reduce((acc, item) => acc + ((item.discount || 0) * item.quantity), 0);

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">

                {/* VIEW: PAYMENT */}
                {view === 'payment' && (
                    <>
                        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 shrink-0">
                            <div>
                                <h3 className="text-xl font-bold text-white">Checkout</h3>
                                <p className="text-sm text-slate-400">Complete the transaction</p>
                            </div>
                            <button onClick={onClose} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6 flex-1 overflow-y-auto min-h-0">
                            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 text-center mb-6">
                                <span className="text-slate-500 text-sm font-bold uppercase tracking-widest">Total to Pay</span>
                                <div className="text-4xl font-bold text-primary-500 mt-1">{formatCurrency(total)}</div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Payment Method</h4>
                                <div className="grid grid-cols-3 gap-3">
                                    <button
                                        onClick={() => setPaymentMethod('cash')}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'cash' ? 'bg-primary-500 text-slate-900 border-primary-500 font-bold shadow-lg shadow-primary-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                                    >
                                        <DollarSign size={24} />
                                        <span className="text-sm">Cash</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('card')}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'card' ? 'bg-blue-500 text-white border-blue-500 font-bold shadow-lg shadow-blue-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                                    >
                                        <CreditCard size={24} />
                                        <span className="text-sm">Card</span>
                                    </button>
                                    <button
                                        onClick={() => setPaymentMethod('qris')}
                                        className={`p-4 rounded-xl border flex flex-col items-center gap-2 transition-all ${paymentMethod === 'qris' ? 'bg-emerald-500 text-white border-emerald-500 font-bold shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'}`}
                                    >
                                        <Smartphone size={24} />
                                        <span className="text-sm">QRIS</span>
                                    </button>
                                </div>
                            </div>

                            {paymentMethod === 'cash' && (
                                <div className="mt-6 space-y-4 animate-in slide-in-from-top-2">
                                    <div className="space-y-2">
                                        <label className="text-sm font-bold text-slate-400 uppercase">Cash Received</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={cashGiven}
                                                onChange={(e) => setCashGiven(e.target.value)}
                                                className="w-full h-14 bg-slate-800 border border-slate-600 rounded-xl pl-4 pr-4 text-2xl font-bold text-white focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                                                placeholder="0"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
                                        {uniqueSuggestions.map((amount) => (
                                            <button
                                                key={amount}
                                                onClick={() => setCashGiven(amount.toString())}
                                                className="px-3 py-2 bg-slate-800 rounded-lg text-sm text-slate-300 border border-slate-700 hover:bg-slate-700 whitespace-nowrap"
                                            >
                                                {formatCurrency(amount)}
                                            </button>
                                        ))}
                                    </div>

                                    <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700 flex justify-between items-center">
                                        <span className="text-slate-400 font-medium">Change Due</span>
                                        <span className={`text-xl font-bold ${change > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                                            {formatCurrency(change)}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {paymentMethod !== 'cash' && (
                                <div className="mt-6 p-6 bg-slate-800/30 rounded-xl border border-slate-800 border-dashed text-center">
                                    <p className="text-slate-500 text-sm">Waiting for payment terminal / confirmation...</p>
                                </div>
                            )}
                        </div>

                        <div className="p-5 border-t border-slate-800 bg-slate-900 space-y-4 shrink-0">
                            <button
                                onClick={() => setIsPrinting(!isPrinting)}
                                className="flex items-center gap-3 text-slate-400 hover:text-white transition-colors"
                            >
                                <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isPrinting ? 'bg-primary-500 border-primary-500 text-slate-900' : 'border-slate-600'}`}>
                                    {isPrinting && <CheckCircle2 size={14} strokeWidth={4} />}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Printer size={18} />
                                    <span className="text-sm font-medium">Print Receipt automatically</span>
                                </div>
                            </button>

                            <button
                                onClick={handleProcessPayment}
                                disabled={!isSufficient}
                                className="w-full h-14 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:to-emerald-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span>Confirm Payment</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </>
                )}

                {/* VIEW: SUCCESS */}
                {view === 'success' && (
                    <>
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 flex flex-col items-center min-h-0">

                            {/* Success Header */}
                            <div className="text-center space-y-2 mb-6 animate-in zoom-in duration-300">
                                <div className="w-14 h-14 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 mb-3">
                                    <CheckCircle2 size={28} className="text-white" strokeWidth={3} />
                                </div>
                                <h3 className="text-xl font-bold text-white">Payment Successful!</h3>
                            </div>

                            {/* Digital Receipt Review (Styled like Mockup) */}
                            <div className="w-full max-w-[320px] bg-white rounded-lg shadow-xl overflow-hidden mb-6 relative antialiased">
                                {/* Top Edge Decoration (CSS only simulation) */}
                                <div className="h-1 bg-primary-500"></div>

                                <div className="p-5 pb-4">
                                    {/* Store Header */}
                                    <div className="flex flex-col items-center text-center">
                                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3 text-red-500">
                                            <Store size={24} />
                                        </div>
                                        <h2 className="text-slate-900 text-lg font-bold leading-tight">{outlet?.name || 'ELEGANTPOS'}</h2>
                                        {(outlet?.receiptSettings?.show_header !== false) && (
                                            <>
                                                <p className="text-slate-500 text-xs mt-1 max-w-[180px]">{outlet?.address || 'Jl. Jendral Sudirman No. 10, Jakarta Pusat, 10220'}</p>
                                            </>
                                        )}
                                    </div>

                                    <div className="my-4 border-t-2 border-dashed border-slate-200"></div>

                                    {/* Info Grid */}
                                    <div className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs">
                                        <div className="text-slate-500">Tanggal</div>
                                        <div className="text-slate-900 text-right font-medium">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</div>

                                        <div className="text-slate-500">Waktu</div>
                                        <div className="text-slate-900 text-right font-medium">{new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })} WIB</div>

                                        <div className="text-slate-500">No. Transaksi</div>
                                        <div className="text-slate-900 text-right font-medium font-mono">#{orderId.slice(0, 8)}</div>

                                        <div className="text-slate-500">Kasir</div>
                                        <div className="text-slate-900 text-right font-medium">{cashierName}</div>
                                    </div>

                                    <div className="my-4 border-t-2 border-dashed border-slate-200"></div>

                                    {/* Items List */}
                                    <div className="space-y-3">
                                        {cartItems.map((item, idx) => (
                                            <div key={idx} className="flex justify-between items-start gap-4">
                                                <div className="flex-1">
                                                    <p className="text-slate-900 text-sm font-medium leading-tight mb-0.5">{item.name}</p>
                                                    {/* Options or Variant text could go here */}
                                                    {item.selectedOptions?.map((opt, i) => (
                                                        <p key={i} className="text-slate-500 text-[10px] italic"> + {opt.name}</p>
                                                    ))}
                                                    <p className="text-slate-500 text-xs pl-2">{item.quantity} x {formatCurrency(item.price).replace(/\u00a0/g, ' ')}</p>
                                                </div>
                                                <div className="shrink-0">
                                                    <p className="text-slate-900 text-sm font-semibold">{formatCurrency(item.price * item.quantity).replace(/\u00a0/g, ' ')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="my-4 border-t-2 border-dashed border-slate-200"></div>

                                    {/* Summary */}
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Subtotal</span>
                                            <span className="text-slate-900 font-medium">{formatCurrency(subtotal)}</span>
                                        </div>
                                        {totalItemDiscounts > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-slate-500">Item Disc</span>
                                                <span className="text-red-500 font-medium">-{formatCurrency(totalItemDiscounts)}</span>
                                            </div>
                                        )}
                                        {globalDiscountAmount > 0 && (
                                            <div className="flex justify-between">
                                                <span className="text-red-500">{globalDiscountName || 'Discount'}</span>
                                                <span className="text-red-500 font-medium">-{formatCurrency(globalDiscountAmount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between">
                                            <span className="text-slate-500">Pajak (11%)</span>
                                            <span className="text-slate-900 font-medium">{formatCurrency(tax)}</span>
                                        </div>

                                        <div className="h-px bg-slate-100 my-2"></div>

                                        <div className="flex justify-between items-center">
                                            <span className="text-slate-900 text-lg font-bold">Total Bayar</span>
                                            <span className="text-slate-900 text-xl font-bold">{formatCurrency(total)}</span>
                                        </div>

                                        <div className="flex justify-between text-xs mt-2 pt-2 border-t border-slate-100">
                                            <span className="text-slate-500">Metode Pembayaran</span>
                                            <span className="text-slate-900 font-bold uppercase">{paymentMethod}</span>
                                        </div>
                                    </div>
                                </div>

                                {
                                    (outlet?.receiptSettings?.show_footer !== false) && (
                                        <div className="bg-slate-50 p-4 text-center border-t border-slate-100">
                                            <p className="text-[10px] text-slate-400 italic leading-relaxed whitespace-pre-wrap">
                                                {outlet?.receiptSettings?.footer_text || "Terima kasih telah berbelanja.\nBarang yang sudah dibeli tidak dapat ditukar."}
                                            </p>
                                        </div>
                                    )
                                }

                                {/* Jagged Edge Bottom */}
                                <div className="h-3 w-full bg-slate-900 absolute bottom-0" style={{
                                    maskImage: 'radial-gradient(circle at 10px 0, transparent 0, transparent 10px, black 11px)',
                                    maskSize: '20px 20px',
                                    maskRepeat: 'repeat-x',
                                    WebkitMaskImage: 'radial-gradient(circle at 10px 0, transparent 0, transparent 10px, black 11px)',
                                    WebkitMaskSize: '20px 20px',
                                    WebkitMaskRepeat: 'repeat-x',
                                    bottom: '-10px'
                                }}></div>
                            </div>

                        </div>

                        {/* Success Footer Actions */}
                        <div className="p-5 border-t border-slate-800 bg-slate-900 flex gap-3 shrink-0">
                            <button
                                onClick={() => printReceipt(orderId)}
                                disabled={isPrintingNow}
                                className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700 disabled:opacity-50"
                            >
                                {isPrintingNow ? <><RefreshCw size={18} className="animate-spin" /> Printing...</> : <><Printer size={18} /> Re-Print</>}
                            </button>

                            <button
                                onClick={handleNewOrder}
                                className="flex-[2] h-12 bg-primary-500 hover:bg-primary-400 text-slate-900 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 active:scale-95 transition-all"
                            >
                                <span>New Order</span>
                                <ArrowRight size={20} />
                            </button>
                        </div>
                    </>
                )}

            </div>
        </div>
    );
};

export default CheckoutModal;