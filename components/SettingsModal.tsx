import React, { useState, useEffect } from 'react';
import { X, Utensils, ShoppingBag, Check, Printer, Wifi, WifiOff, RefreshCw, Smartphone, Laptop, Menu, Edit2, Save, Tag, Trash2, Plus, ChevronRight, Cpu, Radio, Activity, Copy, Sliders, ChevronLeft, Power, Ruler, FileText, CheckCircle, XCircle } from 'lucide-react';
import { BusinessType, PrinterDevice, CategoryGroup, DiscountRule } from '../types';
import { printerService, PrinterStatus } from '../services/printerService';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    businessType: BusinessType;
    onChangeBusinessType: (type: BusinessType) => void;
    categoryGroups?: CategoryGroup[];
    onUpdateCategoryGroups?: (groups: CategoryGroup[]) => void;
    discounts?: DiscountRule[];
    onUpdateDiscounts?: (discounts: DiscountRule[]) => void;
    printers?: PrinterDevice[];
    onUpdatePrinters?: (printers: PrinterDevice[]) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    businessType,
    onChangeBusinessType,
    categoryGroups = [],
    onUpdateCategoryGroups,
    discounts = [],
    onUpdateDiscounts,
    printers = [],
    onUpdatePrinters
}) => {
    const [activeTab, setActiveTab] = useState<'general' | 'menu' | 'promotions' | 'hardware'>('general');
    const [isScanning, setIsScanning] = useState(false);
    const [connectedDeviceId, setConnectedDeviceId] = useState<string | null>(printers.find(p => p.isActive)?.id || null);
    const [editingPrinter, setEditingPrinter] = useState<PrinterDevice | null>(null);

    // ESP32 Printer State
    const [espIp, setEspIp] = useState('');
    const [espPort, setEspPort] = useState(81);
    const [espStatus, setEspStatus] = useState<PrinterStatus>({ appConnected: false, printerConnected: false, lastUpdate: 0 });
    const [isConnecting, setIsConnecting] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [espMessage, setEspMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Subscribe to ESP32 printer status
    useEffect(() => {
        const config = printerService.loadConfig();
        setEspIp(config.espIp);
        setEspPort(config.espPort);

        const unsubscribe = printerService.onStatusChange((status) => {
            setEspStatus(status);
        });

        // Auto-connect if previously configured
        if (config.espIp && config.autoReconnect) {
            printerService.connect();
        }

        return () => unsubscribe();
    }, []);

    // ESP32 Connect/Disconnect handler
    const handleEspConnect = async () => {
        if (espStatus.appConnected) {
            printerService.disconnect();
            printerService.saveConfig({ autoReconnect: false });
        } else {
            if (!espIp) {
                setEspMessage({ type: 'error', text: 'Masukkan IP Address ESP32' });
                return;
            }
            setIsConnecting(true);
            setEspMessage(null);

            const success = await printerService.connect(espIp, espPort);
            setIsConnecting(false);

            if (success) {
                setEspMessage({ type: 'success', text: 'Terhubung ke ESP32!' });
                printerService.saveConfig({ espIp, espPort, autoReconnect: true });
            } else {
                setEspMessage({ type: 'error', text: 'Gagal terhubung. Periksa IP dan pastikan ESP32 menyala.' });
            }
        }
    };

    // ESP32 Test Print handler
    const handleEspTestPrint = async () => {
        setIsPrinting(true);
        setEspMessage(null);

        const result = await printerService.printTest();
        setIsPrinting(false);

        if (result.success) {
            setEspMessage({ type: 'success', text: 'Test print berhasil!' });
        } else {
            setEspMessage({ type: 'error', text: result.error || 'Gagal print' });
        }
    };

    if (!isOpen) return null;

    const handleScan = () => {
        setIsScanning(true);
        setTimeout(() => {
            const discovered: PrinterDevice[] = [
                { id: 'esp-001', name: 'Thermal-POS-Front', ip: '192.168.1.105', status: 'online', type: 'esp32', copies: 1, printTypes: ['receipt'], isActive: true, paperWidth: '80mm' },
                { id: 'net-002', name: 'Kitchen-Order-Printer', ip: '192.168.1.200', status: 'online', type: 'network', copies: 1, printTypes: ['kitchen'], isActive: true, paperWidth: '80mm' },
                { id: 'esp-003', name: 'Bar-Thermal-Unit', ip: '192.168.1.110', status: 'offline', type: 'esp32', copies: 1, printTypes: ['receipt'], isActive: false, paperWidth: '58mm' }
            ];
            onUpdatePrinters?.(discovered);
            setIsScanning(false);
        }, 2000);
    };

    const handleConnect = (id: string) => {
        setConnectedDeviceId(id);
    };

    const handleTogglePrinterActive = (printerId: string) => {
        if (!onUpdatePrinters) return;
        onUpdatePrinters(printers.map(p => p.id === printerId ? { ...p, isActive: !p.isActive } : p));
    };

    const handleSavePrinterSettings = (printer: PrinterDevice) => {
        const exists = printers.some(p => p.id === printer.id);
        if (exists) {
            onUpdatePrinters?.(printers.map(d => d.id === printer.id ? printer : d));
        } else {
            onUpdatePrinters?.([...printers, printer]);
        }
        setEditingPrinter(null);
    };

    const togglePrintType = (printer: PrinterDevice, type: 'receipt' | 'kitchen' | 'order') => {
        const current = printer.printTypes || [];
        const updated = current.includes(type)
            ? current.filter(t => t !== type)
            : [...current, type];
        setEditingPrinter({ ...printer, printTypes: updated as any });
    };

    const handleUpdateCopies = (printer: PrinterDevice, delta: number) => {
        const current = printer.copies || 1;
        setEditingPrinter({ ...printer, copies: Math.max(1, current + delta) });
    };

    const tabs = [
        { id: 'general', label: 'General', icon: <Smartphone size={16} /> },
        { id: 'menu', label: 'Menu', icon: <Menu size={16} /> },
        { id: 'promotions', label: 'Promos', icon: <Tag size={16} /> },
        { id: 'hardware', label: 'Hardware', icon: <Cpu size={16} /> },
    ];

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-0 sm:p-4">
            <div className="bg-slate-900 border-t sm:border border-slate-800 rounded-t-3xl sm:rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom sm:zoom-in-95 duration-300 flex flex-col h-full sm:h-auto sm:max-h-[85vh]">

                <div className="p-5 md:p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 shrink-0">
                    <div>
                        <h3 className="text-xl font-bold text-white tracking-tight">System Settings</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">Terminal Configuration</p>
                    </div>
                    <button onClick={onClose} className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-400 hover:text-white transition-all active:scale-90"><X size={24} /></button>
                </div>

                <div className="flex bg-slate-900/80 border-b border-slate-800 overflow-x-auto no-scrollbar px-4 sm:px-6 shrink-0">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`relative flex items-center gap-2.5 py-4 px-4 text-sm font-bold transition-all whitespace-nowrap ${activeTab === tab.id ? 'text-primary-500' : 'text-slate-500 hover:text-slate-300'}`}
                        >
                            {tab.icon} {tab.label}
                            {activeTab === tab.id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500 rounded-full animate-in fade-in duration-300"></div>}
                        </button>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto p-5 md:p-8">
                    {activeTab === 'general' && (
                        <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                            <div className="grid grid-cols-1 gap-4">
                                <button onClick={() => onChangeBusinessType('fnb')} className={`relative p-6 rounded-2xl border-2 text-left transition-all ${businessType === 'fnb' ? 'bg-primary-500/5 border-primary-500' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800'}`}>
                                    <div className="flex gap-5 items-start">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${businessType === 'fnb' ? 'bg-primary-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}><Utensils size={28} /></div>
                                        <div className="flex-1"><h5 className="text-lg font-bold mb-1">Food & Beverage</h5><p className="text-sm text-slate-500 leading-snug">Dining, tables, & modifiers.</p></div>
                                    </div>
                                </button>
                                <button onClick={() => onChangeBusinessType('retail')} className={`relative p-6 rounded-2xl border-2 text-left transition-all ${businessType === 'retail' ? 'bg-emerald-500/5 border-emerald-500' : 'bg-slate-800/40 border-slate-800 hover:bg-slate-800'}`}>
                                    <div className="flex gap-5 items-start">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${businessType === 'retail' ? 'bg-emerald-500 text-slate-950' : 'bg-slate-800 text-slate-500'}`}><ShoppingBag size={28} /></div>
                                        <div className="flex-1"><h5 className="text-lg font-bold mb-1">Retail & Goods</h5><p className="text-sm text-slate-500 leading-snug">Fast scans & simple inventory.</p></div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'hardware' && (
                        <div className="animate-in slide-in-from-right-4 duration-300 space-y-6">
                            {/* ESP32 Printer Bridge Section */}
                            <div className="bg-gradient-to-br from-primary-500/10 to-slate-800/30 border border-primary-500/30 rounded-2xl p-6 space-y-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-primary-500/20 rounded-xl flex items-center justify-center">
                                        <Cpu size={20} className="text-primary-400" />
                                    </div>
                                    <div>
                                        <h4 className="text-lg font-bold text-white">ESP32 Printer Bridge</h4>
                                        <p className="text-xs text-slate-500">WebSocket connection ke thermal printer</p>
                                    </div>
                                </div>

                                {/* Connection Status */}
                                <div className="bg-slate-900/50 rounded-xl p-4 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {espStatus.appConnected ? <Wifi size={18} className="text-emerald-500" /> : <WifiOff size={18} className="text-slate-500" />}
                                            <span className="text-sm font-bold text-slate-400">App ↔ ESP32</span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${espStatus.appConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {espStatus.appConnected ? <><CheckCircle size={12} /> Connected</> : <><XCircle size={12} /> Offline</>}
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Printer size={18} className={espStatus.printerConnected ? 'text-emerald-500' : 'text-slate-500'} />
                                            <span className="text-sm font-bold text-slate-400">ESP32 ↔ Printer</span>
                                        </div>
                                        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${espStatus.printerConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-800 text-slate-500'}`}>
                                            {espStatus.printerConnected ? <><CheckCircle size={12} /> Ready</> : <><XCircle size={12} /> Not Ready</>}
                                        </div>
                                    </div>
                                </div>

                                {/* IP Configuration */}
                                <div className="grid grid-cols-4 gap-3">
                                    <div className="col-span-3">
                                        <input
                                            type="text"
                                            value={espIp}
                                            onChange={(e) => setEspIp(e.target.value)}
                                            placeholder="192.168.1.100"
                                            disabled={espStatus.appConnected}
                                            className="w-full h-12 bg-slate-950 border border-slate-700 rounded-xl px-4 text-white font-mono text-sm focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 placeholder:text-slate-700 disabled:opacity-50"
                                        />
                                        <span className="text-[10px] text-slate-500 ml-2">IP Address</span>
                                    </div>
                                    <div>
                                        <input
                                            type="number"
                                            value={espPort}
                                            onChange={(e) => setEspPort(parseInt(e.target.value) || 81)}
                                            disabled={espStatus.appConnected}
                                            className="w-full h-12 bg-slate-950 border border-slate-700 rounded-xl px-3 text-white font-mono text-sm text-center focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
                                        />
                                        <span className="text-[10px] text-slate-500 ml-2">Port</span>
                                    </div>
                                </div>

                                {/* Message */}
                                {espMessage && (
                                    <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 ${espMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                                        {espMessage.type === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
                                        {espMessage.text}
                                    </div>
                                )}

                                {/* Actions */}
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={handleEspConnect}
                                        disabled={isConnecting}
                                        className={`h-12 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50 ${espStatus.appConnected ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-primary-500 text-slate-950'}`}
                                    >
                                        {isConnecting ? <><RefreshCw size={18} className="animate-spin" /> Connecting...</> : espStatus.appConnected ? <><WifiOff size={18} /> Disconnect</> : <><Wifi size={18} /> Connect</>}
                                    </button>
                                    <button
                                        onClick={handleEspTestPrint}
                                        disabled={!espStatus.appConnected || !espStatus.printerConnected || isPrinting}
                                        className="h-12 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-40"
                                    >
                                        {isPrinting ? <><RefreshCw size={18} className="animate-spin" /> Printing...</> : <><FileText size={18} /> Test Print</>}
                                    </button>
                                </div>
                            </div>

                            {/* Printer Network Section (Original) */}
                            <div className="bg-slate-800/30 border border-slate-800 rounded-2xl p-6">
                                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 text-center sm:text-left">
                                    <div>
                                        <h4 className="text-lg font-bold text-white flex items-center gap-2 justify-center sm:justify-start">
                                            <Printer size={20} className="text-primary-500" /> Printer Network
                                        </h4>
                                        <p className="text-sm text-slate-500 mt-1">Add printers manually by IP address</p>
                                    </div>
                                    <button
                                        onClick={() => {
                                            const newPrinter: PrinterDevice = {
                                                id: `printer-${Date.now()}`,
                                                name: '',
                                                ip: '',
                                                status: 'online',
                                                type: 'network',
                                                copies: 1,
                                                printTypes: ['receipt'],
                                                isActive: true,
                                                paperWidth: '80mm'
                                            };
                                            setEditingPrinter(newPrinter);
                                        }}
                                        className="w-full sm:w-auto px-6 h-12 rounded-xl font-bold flex items-center justify-center gap-3 transition-all bg-primary-500 text-slate-950 shadow-lg shadow-primary-500/20 active:scale-95"
                                    >
                                        <Plus size={18} />
                                        Add Printer
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">Configured Printers</h4>
                                {printers.length === 0 && (
                                    <div className="text-center py-12 text-slate-600">
                                        <Printer size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-sm font-bold">No printers configured</p>
                                        <p className="text-xs mt-1">Click "Add Printer" to add one manually</p>
                                    </div>
                                )}
                                {printers.map(device => {
                                    const isConnected = connectedDeviceId === device.id;
                                    const isActive = device.isActive;
                                    return (
                                        <div key={device.id} className={`p-4 sm:p-5 rounded-2xl border transition-all ${isActive ? 'bg-slate-800/40 border-slate-800' : 'bg-slate-950 border-slate-900 opacity-60'} ${isConnected && isActive ? 'ring-2 ring-primary-500/30 border-primary-500/50' : ''}`}>
                                            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-3.5 rounded-xl border shrink-0 transition-all ${isActive ? (isConnected ? 'bg-primary-500 text-slate-950 border-primary-400' : 'bg-slate-900 text-slate-500 border-slate-800') : 'bg-slate-900 text-slate-700 border-slate-800'}`}><Printer size={24} /></div>
                                                    <div>
                                                        <div className="flex items-center gap-2">
                                                            <h5 className={`font-bold text-sm ${isActive ? 'text-white' : 'text-slate-500'}`}>{device.name || 'Unnamed Printer'}</h5>
                                                            <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tight bg-slate-700 text-slate-300`}>{device.paperWidth || '80mm'}</span>
                                                        </div>
                                                        <p className="text-[10px] font-mono text-slate-500 mt-1">{device.ip || 'No IP'}</p>
                                                    </div>
                                                </div>
                                                <div className="flex w-full sm:w-auto gap-2">
                                                    <button onClick={() => setEditingPrinter(device)} className="flex-1 sm:flex-none h-10 px-4 bg-slate-900 border border-slate-700 rounded-lg text-xs font-bold text-slate-300 hover:bg-slate-800 transition-all flex items-center justify-center gap-2"><Sliders size={14} /> Configure</button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('Delete this printer?')) {
                                                                onUpdatePrinters?.(printers.filter(p => p.id !== device.id));
                                                            }
                                                        }}
                                                        className="h-10 px-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs font-bold text-red-400 hover:bg-red-500/20 transition-all flex items-center justify-center"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>

                {editingPrinter && (
                    <div className="absolute inset-0 z-50 bg-slate-900 animate-in slide-in-from-right duration-300 flex flex-col h-full">
                        <div className="p-5 md:p-6 border-b border-slate-800 flex items-center gap-4 bg-slate-900/80 backdrop-blur-md sticky top-0">
                            <button onClick={() => setEditingPrinter(null)} className="p-2 bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-all"><ChevronLeft size={20} /></button>
                            <div className="flex-1">
                                <h4 className="text-lg font-bold text-white leading-tight">Printer Configuration</h4>
                                <p className="text-xs text-slate-500 font-mono mt-0.5">{editingPrinter.ip}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-6 space-y-8">
                            {/* Printer Name */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Edit2 size={14} /> Printer Name</label>
                                <input
                                    type="text"
                                    value={editingPrinter.name}
                                    onChange={(e) => setEditingPrinter({ ...editingPrinter, name: e.target.value })}
                                    placeholder="e.g. Kitchen Printer"
                                    className="w-full h-14 bg-slate-950 border border-slate-700 rounded-xl px-4 text-white font-bold focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 placeholder:text-slate-700"
                                />
                            </div>

                            {/* IP Address */}
                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Wifi size={14} /> IP Address</label>
                                <input
                                    type="text"
                                    value={editingPrinter.ip}
                                    onChange={(e) => setEditingPrinter({ ...editingPrinter, ip: e.target.value })}
                                    placeholder="e.g. 192.168.1.100"
                                    className="w-full h-14 bg-slate-950 border border-slate-700 rounded-xl px-4 text-white font-mono focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 placeholder:text-slate-700"
                                />
                            </div>

                            {/* Paper Width Selection */}
                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Ruler size={14} /> Paper Width</label>
                                <div className="grid grid-cols-2 gap-3">
                                    {['58mm', '80mm'].map((width) => (
                                        <button
                                            key={width}
                                            onClick={() => setEditingPrinter({ ...editingPrinter, paperWidth: width as any })}
                                            className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${editingPrinter.paperWidth === width ? 'bg-primary-500/10 border-primary-500 text-primary-400' : 'bg-slate-800/50 border-slate-700 text-slate-500 hover:border-slate-500'}`}
                                        >
                                            <span className="text-lg font-black">{width}</span>
                                            <span className="text-[10px] font-bold uppercase">{width === '58mm' ? 'Small / Mobile' : 'Standard POS'}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Copy size={14} /> Auto-Print Copies</label>
                                <div className="flex items-center justify-between p-4 bg-slate-950 border border-slate-700 rounded-2xl">
                                    <p className="text-sm text-slate-300">Receipts per transaction.</p>
                                    <div className="flex items-center gap-4 bg-slate-800 p-1 rounded-xl border border-slate-700 shadow-lg">
                                        <button onClick={() => handleUpdateCopies(editingPrinter, -1)} className="size-10 flex items-center justify-center bg-slate-900 text-slate-400 hover:text-white rounded-lg transition-all active:scale-90"><Minus size={18} /></button>
                                        <span className="w-8 text-center text-xl font-black text-primary-500 tabular-nums">{editingPrinter.copies || 1}</span>
                                        <button onClick={() => handleUpdateCopies(editingPrinter, 1)} className="size-10 flex items-center justify-center bg-slate-900 text-slate-400 hover:text-white rounded-lg transition-all active:scale-90"><Plus size={18} /></button>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">Receipt Allocation</label>
                                <div className="grid grid-cols-1 gap-3">
                                    {[
                                        { id: 'receipt', name: 'Customer Receipt' },
                                        { id: 'kitchen', name: 'Kitchen Order' },
                                        { id: 'order', name: 'Checker / Runner' }
                                    ].map(type => {
                                        const isSelected = editingPrinter.printTypes?.includes(type.id as any);
                                        return (
                                            <button key={type.id} onClick={() => togglePrintType(editingPrinter, type.id as any)} className={`w-full p-4 rounded-xl border-2 text-left transition-all flex items-center justify-between ${isSelected ? 'bg-primary-500/10 border-primary-500' : 'bg-slate-900/50 border-slate-800 hover:bg-slate-700'}`}>
                                                <h5 className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-slate-400'}`}>{type.name}</h5>
                                                <div className={`size-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-primary-500 border-primary-500 text-slate-950' : 'border-slate-700'}`}>{isSelected && <Check size={12} strokeWidth={4} />}</div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-slate-800 bg-slate-900/80 backdrop-blur-md">
                            <button onClick={() => handleSavePrinterSettings(editingPrinter)} className="w-full h-14 bg-primary-500 hover:bg-primary-400 text-slate-950 font-black rounded-2xl shadow-xl shadow-primary-500/10 active:scale-95 transition-all flex items-center justify-center gap-2"><Save size={20} /> Save Configuration</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const Minus = ({ size = 20 }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12" /></svg>
);

export default SettingsModal;