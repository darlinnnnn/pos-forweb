import React, { useState, useEffect, useRef } from 'react';
import { X, DollarSign, CreditCard, Smartphone, Printer, CheckCircle2, ArrowRight, Receipt, Share2, Copy } from 'lucide-react';
import { CartItem } from '../types';

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
    onConfirmPayment
}) => {
    const [view, setView] = useState<'payment' | 'success'>('payment');
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
    const [cashGiven, setCashGiven] = useState('');
    const [isPrinting, setIsPrinting] = useState(true);
    const [orderId, setOrderId] = useState('');
    const [changeDue, setChangeDue] = useState(0);

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
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(amount);
    };

    const cashAmount = parseInt(cashGiven) || 0;
    const change = Math.max(0, cashAmount - total);
    const isSufficient = paymentMethod !== 'cash' || cashAmount >= total;

    // Quick cash buttons
    const suggestions = [total, Math.ceil(total / 50000) * 50000, Math.ceil(total / 100000) * 100000];
    const uniqueSuggestions = Array.from(new Set(suggestions)).filter(s => s >= total);

    const handleProcessPayment = async () => {
        // Call parent to create order in DB
        const newOrderId = await onConfirmPayment(paymentMethod);

        if (newOrderId) {
            setOrderId(newOrderId);
            setChangeDue(change);

            // If printing enabled, you would trigger print job here
            if (isPrinting) {
                console.log("Printing Receipt for Order:", newOrderId);
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
                        <div className="flex-1 overflow-y-auto p-6 flex flex-col items-center min-h-0">

                            {/* Success Header */}
                            <div className="text-center space-y-2 mb-6 animate-in zoom-in duration-300">
                                <div className="w-16 h-16 bg-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/30 mb-4">
                                    <CheckCircle2 size={32} className="text-white" strokeWidth={3} />
                                </div>
                                <h3 className="text-2xl font-bold text-white">Payment Successful!</h3>
                                <div className="flex items-center justify-center gap-2 text-slate-400">
                                    <span>Order ID:</span>
                                    <span className="font-mono text-white bg-slate-800 px-2 py-0.5 rounded border border-slate-700 select-all">{orderId}</span>
                                </div>
                                {changeDue > 0 && (
                                    <div className="inline-block bg-slate-800/50 rounded-lg px-4 py-2 mt-2 border border-slate-700">
                                        <span className="text-sm text-slate-400 block text-xs uppercase font-bold">Change Due</span>
                                        <span className="text-xl font-bold text-emerald-400">{formatCurrency(changeDue)}</span>
                                    </div>
                                )}
                            </div>

                            {/* Thermal Receipt Preview */}
                            <div className="w-full max-w-xs bg-white text-slate-900 p-4 font-mono text-xs shadow-xl leading-tight opacity-90 rounded-sm mb-4 relative">
                                {/* Paper Jagged Edge Top */}
                                <div className="text-center mb-3 border-b-2 border-dashed border-slate-300 pb-3">
                                    <h2 className="font-bold text-lg uppercase mb-1">ElegantPOS</h2>
                                    <p>Jl. Sudirman No. 123</p>
                                    <p>Jakarta, Indonesia</p>
                                    <p className="mt-1">0812-3456-7890</p>
                                </div>

                                <div className="mb-3 flex justify-between">
                                    <span>{new Date().toLocaleDateString()}</span>
                                    <span>{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                </div>
                                <div className="mb-3">
                                    <p>Order: {orderId}</p>
                                    <p>Cashier: Sarah J.</p>
                                </div>

                                {/* Items List */}
                                <div className="border-b-2 border-dashed border-slate-300 pb-2 mb-2">
                                    {cartItems.map((item, idx) => {
                                        const itemTotal = item.price * item.quantity;
                                        const itemDiscountTotal = (item.discount || 0) * item.quantity;

                                        return (
                                            <div key={idx} className="mb-2">
                                                {/* Main Item Line */}
                                                <div className="flex justify-between font-bold">
                                                    <span>{item.name}</span>
                                                </div>

                                                {/* Qty x Price */}
                                                <div className="flex justify-between text-slate-600">
                                                    <span>{item.quantity} x {formatCurrency(item.price)}</span>
                                                    <span>{formatCurrency(itemTotal)}</span>
                                                </div>

                                                {/* Options */}
                                                {item.selectedOptions?.map((opt, i) => (
                                                    <div key={i} className="flex justify-between text-[10px] text-slate-500 pl-2">
                                                        <span>+ {opt.name}</span>
                                                        {opt.price > 0 && <span>{formatCurrency(opt.price * item.quantity)}</span>}
                                                    </div>
                                                ))}

                                                {/* Item Discount Line */}
                                                {item.discount && item.discount > 0 && (
                                                    <div className="flex justify-between text-[10px] text-slate-500 pl-2 italic">
                                                        <span>Disc. (Per Item)</span>
                                                        <span>-{formatCurrency(itemDiscountTotal)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Footer Totals */}
                                <div className="space-y-1 mb-3">
                                    <div className="flex justify-between">
                                        <span>Subtotal</span>
                                        <span>{formatCurrency(subtotal)}</span>
                                    </div>

                                    {/* Item Discounts Summary */}
                                    {totalItemDiscounts > 0 && (
                                        <div className="flex justify-between text-slate-600 italic">
                                            <span>Item Discounts</span>
                                            <span>-{formatCurrency(totalItemDiscounts)}</span>
                                        </div>
                                    )}

                                    {/* Global / Order Discount */}
                                    {globalDiscountAmount > 0 && (
                                        <div className="flex justify-between text-slate-600 italic">
                                            <span>{globalDiscountName || 'Order Discount'}</span>
                                            <span>-{formatCurrency(globalDiscountAmount)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between">
                                        <span>Tax (11%)</span>
                                        <span>{formatCurrency(tax)}</span>
                                    </div>

                                    <div className="flex justify-between font-bold text-sm border-t border-dashed border-slate-300 pt-1 mt-1">
                                        <span>TOTAL</span>
                                        <span>{formatCurrency(total)}</span>
                                    </div>
                                </div>

                                <div className="text-center pt-2 border-t-2 border-dashed border-slate-300">
                                    <p>Thank you for visiting!</p>
                                    <p className="mt-1 text-[10px]">Follow us @elegantpos</p>
                                </div>

                                {/* Paper Jagged Edge Bottom (Visual) */}
                                <div className="absolute -bottom-2 left-0 w-full h-4 bg-slate-900" style={{ clipPath: 'polygon(0% 0%, 5% 100%, 10% 0%, 15% 100%, 20% 0%, 25% 100%, 30% 0%, 35% 100%, 40% 0%, 45% 100%, 50% 0%, 55% 100%, 60% 0%, 65% 100%, 70% 0%, 75% 100%, 80% 0%, 85% 100%, 90% 0%, 95% 100%, 100% 0%)' }}></div>
                            </div>
                        </div>

                        {/* Success Footer Actions */}
                        <div className="p-5 border-t border-slate-800 bg-slate-900 flex gap-3 shrink-0">
                            <button className="flex-1 h-12 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-colors border border-slate-700">
                                <Printer size={18} />
                                <span>Re-Print</span>
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