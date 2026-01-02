// Printer Service - Multi-printer WebSocket communication with ESP32 bridges

import { PrinterDevice } from '../types';
import { blePrinterService } from './blePrinterService';

export interface PrinterStatus {
    appConnected: boolean;      // Web app connected to ESP32
    printerConnected: boolean;  // Printer connected to ESP32
    lastUpdate: number;
}

export interface PrintLine {
    text: string;
    align?: 'left' | 'center' | 'right';
    bold?: boolean;
    size?: 'normal' | 'large' | 'small';
    type?: 'text' | 'separator' | 'barcode' | 'qr';
}

export interface PrintJob {
    lines: PrintLine[];
    cut?: boolean;
    openDrawer?: boolean;
}

type StatusCallback = (printerId: string, status: PrinterStatus) => void;
type PrintResultCallback = (success: boolean, error?: string) => void;

interface PrinterConnection {
    ws: WebSocket | null;
    status: PrinterStatus;
    reconnectTimer: ReturnType<typeof setTimeout> | null;
    statusPollTimer: ReturnType<typeof setInterval> | null;
    printResultCallback: PrintResultCallback | null;
    config: {
        ip: string;
        port: number;
        autoReconnect: boolean;
    };
}

class MultiPrinterService {
    private connections: Map<string, PrinterConnection> = new Map();
    private statusListeners: Set<StatusCallback> = new Set();
    private reconnectInterval = 5000;

    // Subscribe to status changes for all printers
    onStatusChange(callback: StatusCallback): () => void {
        this.statusListeners.add(callback);
        // Immediately call with current status for all connected printers
        this.connections.forEach((conn, printerId) => {
            callback(printerId, conn.status);
        });
        return () => this.statusListeners.delete(callback);
    }

    // Notify all status listeners
    private notifyStatusChange(printerId: string, status: PrinterStatus): void {
        this.statusListeners.forEach(cb => cb(printerId, status));
    }

    // Get status for a specific printer
    getStatus(printerId: string): PrinterStatus {
        const conn = this.connections.get(printerId);
        return conn?.status || { appConnected: false, printerConnected: false, lastUpdate: 0 };
    }

    // Get all printer statuses
    getAllStatuses(): Map<string, PrinterStatus> {
        const statuses = new Map<string, PrinterStatus>();
        this.connections.forEach((conn, id) => {
            statuses.set(id, conn.status);
        });
        return statuses;
    }

    // Connect to a printer
    connect(printer: PrinterDevice): Promise<boolean> {
        return new Promise((resolve) => {
            const printerId = printer.id;
            const ip = printer.ip;
            const port = printer.port || 81;

            if (!ip) {
                console.error(`Printer ${printerId}: IP not configured`);
                resolve(false);
                return;
            }

            // Close existing connection if any
            this.disconnect(printerId, false);

            const connection: PrinterConnection = {
                ws: null,
                status: { appConnected: false, printerConnected: false, lastUpdate: Date.now() },
                reconnectTimer: null,
                statusPollTimer: null,
                printResultCallback: null,
                config: { ip, port, autoReconnect: true }
            };

            this.connections.set(printerId, connection);

            const wsUrl = `ws://${ip}:${port}`;
            console.log(`Connecting to printer ${printerId} at ${wsUrl}...`);

            try {
                connection.ws = new WebSocket(wsUrl);

                const connectionTimeout = setTimeout(() => {
                    if (connection.ws?.readyState !== WebSocket.OPEN) {
                        console.error(`Printer ${printerId}: Connection timeout`);
                        connection.ws?.close();
                        this.updateStatus(printerId, { appConnected: false });
                        resolve(false);
                    }
                }, 5000);

                connection.ws.onopen = () => {
                    clearTimeout(connectionTimeout);
                    console.log(`Printer ${printerId}: Connected`);
                    this.updateStatus(printerId, { appConnected: true });
                    this.requestStatus(printerId);
                    this.startStatusPolling(printerId);
                    resolve(true);
                };

                connection.ws.onmessage = (event) => {
                    this.handleMessage(printerId, event.data);
                };

                connection.ws.onerror = (error) => {
                    console.error(`Printer ${printerId}: WebSocket error`, error);
                };

                connection.ws.onclose = () => {
                    console.log(`Printer ${printerId}: Disconnected`);
                    this.updateStatus(printerId, { appConnected: false, printerConnected: false });
                    this.stopStatusPolling(printerId);

                    // Auto reconnect
                    const conn = this.connections.get(printerId);
                    if (conn?.config.autoReconnect) {
                        this.scheduleReconnect(printerId);
                    }
                };
            } catch (error) {
                console.error(`Printer ${printerId}: Failed to create WebSocket`, error);
                resolve(false);
            }
        });
    }

    // Disconnect from a printer
    disconnect(printerId: string, permanent = true): void {
        const conn = this.connections.get(printerId);
        if (!conn) return;

        if (conn.reconnectTimer) {
            clearTimeout(conn.reconnectTimer);
            conn.reconnectTimer = null;
        }

        this.stopStatusPolling(printerId);

        if (conn.ws) {
            conn.ws.onclose = null; // Prevent auto-reconnect trigger
            conn.ws.close();
            conn.ws = null;
        }

        if (permanent) {
            conn.config.autoReconnect = false;
        }

        this.updateStatus(printerId, { appConnected: false, printerConnected: false });
    }

    // Update status for a printer
    private updateStatus(printerId: string, updates: Partial<PrinterStatus>): void {
        const conn = this.connections.get(printerId);
        if (!conn) return;

        conn.status = { ...conn.status, ...updates, lastUpdate: Date.now() };
        this.notifyStatusChange(printerId, conn.status);
    }

    // Schedule reconnection attempt
    private scheduleReconnect(printerId: string): void {
        const conn = this.connections.get(printerId);
        if (!conn || conn.reconnectTimer) return;

        console.log(`Printer ${printerId}: Reconnecting in ${this.reconnectInterval}ms...`);
        conn.reconnectTimer = setTimeout(() => {
            conn.reconnectTimer = null;
            if (conn.config.autoReconnect) {
                // Reconstruct minimal printer object for reconnect
                this.connect({
                    id: printerId,
                    ip: conn.config.ip,
                    port: conn.config.port,
                    name: '',
                    status: 'offline',
                    type: 'esp32'
                });
            }
        }, this.reconnectInterval);
    }

    // Start polling printer status
    private startStatusPolling(printerId: string): void {
        this.stopStatusPolling(printerId);
        const conn = this.connections.get(printerId);
        if (!conn) return;

        conn.statusPollTimer = setInterval(() => {
            this.requestStatus(printerId);
        }, 3000);
    }

    // Stop polling
    private stopStatusPolling(printerId: string): void {
        const conn = this.connections.get(printerId);
        if (!conn?.statusPollTimer) return;

        clearInterval(conn.statusPollTimer);
        conn.statusPollTimer = null;
    }

    // Request status from ESP32
    private requestStatus(printerId: string): void {
        this.send(printerId, { type: 'status' });
    }

    // Send message to ESP32
    private send(printerId: string, data: object): boolean {
        const conn = this.connections.get(printerId);
        if (!conn?.ws || conn.ws.readyState !== WebSocket.OPEN) {
            console.warn(`Printer ${printerId}: WebSocket not connected`);
            return false;
        }
        try {
            conn.ws.send(JSON.stringify(data));
            return true;
        } catch (error) {
            console.error(`Printer ${printerId}: Failed to send message`, error);
            return false;
        }
    }

    // Handle incoming message from ESP32
    private handleMessage(printerId: string, data: string): void {
        const conn = this.connections.get(printerId);
        if (!conn) return;

        try {
            const msg = JSON.parse(data);

            switch (msg.type) {
                case 'status':
                    this.updateStatus(printerId, {
                        printerConnected: msg.printer === true
                    });
                    break;

                case 'print_result':
                    if (conn.printResultCallback) {
                        conn.printResultCallback(msg.success === true, msg.error);
                        conn.printResultCallback = null;
                    }
                    break;

                case 'pong':
                    // Keep-alive response
                    break;

                default:
                    console.log(`Printer ${printerId}: Unknown message type`, msg.type);
            }
        } catch (error) {
            console.error(`Printer ${printerId}: Failed to parse message`, error);
        }
    }

    // Print to a specific printer
    print(printerId: string, job: PrintJob): Promise<{ success: boolean; error?: string }> {
        return new Promise((resolve) => {
            const conn = this.connections.get(printerId);

            if (!conn?.status.appConnected) {
                resolve({ success: false, error: 'Not connected to ESP32' });
                return;
            }

            if (!conn.status.printerConnected) {
                resolve({ success: false, error: 'Printer not connected' });
                return;
            }

            // Set callback for print result
            conn.printResultCallback = (success, error) => {
                resolve({ success, error });
            };

            // Send print job
            const sent = this.send(printerId, {
                type: 'print',
                lines: job.lines,
                cut: job.cut !== false,
                drawer: job.openDrawer === true
            });

            if (!sent) {
                conn.printResultCallback = null;
                resolve({ success: false, error: 'Failed to send print job' });
                return;
            }

            // Timeout for print result
            setTimeout(() => {
                if (conn.printResultCallback) {
                    conn.printResultCallback = null;
                    resolve({ success: false, error: 'Print timeout' });
                }
            }, 10000);
        });
    }

    // Print to printers by job type (receipt, kitchen, order)
    async printByType(
        jobType: 'receipt' | 'kitchen' | 'order',
        job: PrintJob,
        availablePrinters: PrinterDevice[]
    ): Promise<{ printerId: string; success: boolean; error?: string }[]> {
        const results: { printerId: string; success: boolean; error?: string }[] = [];

        // Find printers that handle this job type
        const targetPrinters = availablePrinters.filter(p =>
            p.isActive && p.printTypes?.includes(jobType)
        );

        for (const printer of targetPrinters) {
            // Handle BLE printers
            if (printer.type === 'ble') {
                const bleStatus = blePrinterService.getStatus();
                if (bleStatus.isConnected) {
                    const copies = printer.copies || 1;
                    for (let i = 0; i < copies; i++) {
                        const result = await blePrinterService.print(job);
                        results.push({ printerId: printer.id, ...result });
                    }
                } else {
                    results.push({
                        printerId: printer.id,
                        success: false,
                        error: 'BLE printer not connected'
                    });
                }
                continue;
            }

            // Handle ESP32/WebSocket printers
            const status = this.getStatus(printer.id);
            if (status.appConnected && status.printerConnected) {
                // Print multiple copies if configured
                const copies = printer.copies || 1;
                for (let i = 0; i < copies; i++) {
                    const result = await this.print(printer.id, job);
                    results.push({ printerId: printer.id, ...result });
                }
            } else {
                results.push({
                    printerId: printer.id,
                    success: false,
                    error: 'Printer not connected'
                });
            }
        }

        return results;
    }

    // Print a test page to a specific printer
    printTest(printerId: string): Promise<{ success: boolean; error?: string }> {
        const testJob: PrintJob = {
            lines: [
                { text: '================================', type: 'separator' },
                { text: 'PRINTER TEST', align: 'center', bold: true, size: 'large' },
                { text: '================================', type: 'separator' },
                { text: '' },
                { text: 'ESP32 Printer Bridge', align: 'center' },
                { text: `Printer ID: ${printerId}`, align: 'center' },
                { text: `Time: ${new Date().toLocaleString('id-ID')}`, align: 'center' },
                { text: '' },
                { text: 'Font Styles:', bold: true },
                { text: 'Normal text' },
                { text: 'Bold text', bold: true },
                { text: 'Large text', size: 'large' },
                { text: 'Small text', size: 'small' },
                { text: '' },
                { text: 'Alignment:' },
                { text: 'Left', align: 'left' },
                { text: 'Center', align: 'center' },
                { text: 'Right', align: 'right' },
                { text: '' },
                { text: '================================', type: 'separator' },
                { text: 'Test Complete!', align: 'center', bold: true },
                { text: '================================', type: 'separator' },
            ],
            cut: true
        };
        return this.print(printerId, testJob);
    }

    // Connect to all active printers (for auto-connect on app load)
    async connectAll(printers: PrinterDevice[]): Promise<void> {
        const activePrinters = printers.filter(p => p.isActive && p.ip);
        for (const printer of activePrinters) {
            await this.connect(printer);
        }
    }

    // Disconnect from all printers
    disconnectAll(): void {
        this.connections.forEach((_, printerId) => {
            this.disconnect(printerId, true);
        });
    }

    // Save printers config to localStorage
    savePrintersConfig(printers: PrinterDevice[]): void {
        localStorage.setItem('printers_config', JSON.stringify(printers));
    }

    // Load printers config from localStorage
    loadPrintersConfig(): PrinterDevice[] {
        try {
            const saved = localStorage.getItem('printers_config');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load printers config:', e);
        }
        return [];
    }
}

// Export singleton instance
export const printerService = new MultiPrinterService();

// Legacy exports for backward compatibility (deprecated)
export type PrinterConfig = {
    espIp: string;
    espPort: number;
    autoReconnect: boolean;
    reconnectInterval: number;
};
