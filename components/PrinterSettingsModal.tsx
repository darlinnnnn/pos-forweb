import React, { useState, useEffect } from 'react';
import { X, Printer, Wifi, WifiOff, CheckCircle, XCircle, RefreshCw, FileText, Settings } from 'lucide-react';
import { printerService, PrinterStatus, PrinterConfig } from '../services/printerService';

interface PrinterSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const PrinterSettingsModal: React.FC<PrinterSettingsModalProps> = ({ isOpen, onClose }) => {
    const [config, setConfig] = useState<PrinterConfig>({
        espIp: '',
        espPort: 81,
        autoReconnect: true,
        reconnectInterval: 5000
    });
    const [status, setStatus] = useState<PrinterStatus>({
        appConnected: false,
        printerConnected: false,
        lastUpdate: 0
    });
    const [isConnecting, setIsConnecting] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    // Load config and subscribe to status on mount
    useEffect(() => {
        const savedConfig = printerService.loadConfig();
        setConfig(savedConfig);

        // Subscribe to status changes
        const unsubscribe = printerService.onStatusChange((newStatus) => {
            setStatus(newStatus);
        });

        // Auto-connect if previously configured
        if (savedConfig.espIp && savedConfig.autoReconnect) {
            printerService.connect();
        }

        return () => unsubscribe();
    }, []);

    // Handle connect/disconnect
    const handleConnect = async () => {
        if (status.appConnected) {
            printerService.disconnect();
            printerService.saveConfig({ autoReconnect: false });
        } else {
            if (!config.espIp) {
                setMessage({ type: 'error', text: 'Masukkan IP Address ESP32' });
                return;
            }

            setIsConnecting(true);
            setMessage(null);

            const success = await printerService.connect(config.espIp, config.espPort);

            setIsConnecting(false);

            if (success) {
                setMessage({ type: 'success', text: 'Terhubung ke ESP32!' });
                printerService.saveConfig({ ...config, autoReconnect: true });
            } else {
                setMessage({ type: 'error', text: 'Gagal terhubung. Periksa IP dan pastikan ESP32 menyala.' });
            }
        }
    };

    // Handle test print
    const handleTestPrint = async () => {
        setIsPrinting(true);
        setMessage(null);

        const result = await printerService.printTest();

        setIsPrinting(false);

        if (result.success) {
            setMessage({ type: 'success', text: 'Test print berhasil!' });
        } else {
            setMessage({ type: 'error', text: result.error || 'Gagal print' });
        }
    };

    // Handle input changes
    const handleIpChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setConfig(prev => ({ ...prev, espIp: value }));
    };

    const handlePortChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value) || 81;
        setConfig(prev => ({ ...prev, espPort: value }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 dark:bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl w-full max-w-md shadow-2xl animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50 rounded-t-3xl">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary-500/10 rounded-xl flex items-center justify-center">
                            <Printer size={20} className="text-primary-500" />
                        </div>
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Printer</h3>
                    </div>
                    <button onClick={onClose} className="size-11 flex items-center justify-center bg-white dark:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white transition-all">
                        <X size={24} />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Connection Status */}
                    <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {status.appConnected ? (
                                    <Wifi size={20} className="text-emerald-500" />
                                ) : (
                                    <WifiOff size={20} className="text-slate-400" />
                                )}
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">App ↔ ESP32</span>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${status.appConnected
                                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                }`}>
                                {status.appConnected ? (
                                    <><CheckCircle size={14} /> Connected</>
                                ) : (
                                    <><XCircle size={14} /> Disconnected</>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Printer size={20} className={status.printerConnected ? 'text-emerald-500' : 'text-slate-400'} />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">ESP32 ↔ Printer</span>
                            </div>
                            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-wider ${status.printerConnected
                                    ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                                }`}>
                                {status.printerConnected ? (
                                    <><CheckCircle size={14} /> Ready</>
                                ) : (
                                    <><XCircle size={14} /> Not Ready</>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Configuration */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] ml-1">ESP32 Configuration</label>

                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2">
                                <input
                                    type="text"
                                    value={config.espIp}
                                    onChange={handleIpChange}
                                    placeholder="192.168.1.100"
                                    disabled={status.appConnected}
                                    className="w-full h-14 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 text-slate-900 dark:text-white font-mono font-bold focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 placeholder:text-slate-300 dark:placeholder:text-slate-700 disabled:opacity-50"
                                />
                                <span className="text-[10px] text-slate-400 ml-2">IP Address</span>
                            </div>
                            <div>
                                <input
                                    type="number"
                                    value={config.espPort}
                                    onChange={handlePortChange}
                                    disabled={status.appConnected}
                                    className="w-full h-14 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl px-4 text-slate-900 dark:text-white font-mono font-bold text-center focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20 disabled:opacity-50"
                                />
                                <span className="text-[10px] text-slate-400 ml-2">Port</span>
                            </div>
                        </div>
                    </div>

                    {/* Message */}
                    {message && (
                        <div className={`p-4 rounded-2xl text-sm font-bold flex items-center gap-3 ${message.type === 'success'
                                ? 'bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                                : 'bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400'
                            }`}>
                            {message.type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
                            {message.text}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 rounded-b-3xl space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={handleConnect}
                            disabled={isConnecting}
                            className={`h-14 font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50 ${status.appConnected
                                    ? 'bg-red-500 hover:bg-red-400 text-white'
                                    : 'bg-primary-500 hover:bg-primary-400 text-slate-900'
                                }`}
                        >
                            {isConnecting ? (
                                <><RefreshCw size={20} className="animate-spin" /> Connecting...</>
                            ) : status.appConnected ? (
                                <><WifiOff size={20} /> Disconnect</>
                            ) : (
                                <><Wifi size={20} /> Connect</>
                            )}
                        </button>

                        <button
                            onClick={handleTestPrint}
                            disabled={!status.appConnected || !status.printerConnected || isPrinting}
                            className="h-14 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {isPrinting ? (
                                <><RefreshCw size={20} className="animate-spin" /> Printing...</>
                            ) : (
                                <><FileText size={20} /> Test Print</>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PrinterSettingsModal;
