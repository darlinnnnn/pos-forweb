// Printer Service - WebSocket communication with ESP32 printer bridge

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

export interface PrinterConfig {
    espIp: string;
    espPort: number;
    autoReconnect: boolean;
    reconnectInterval: number;
}

type StatusCallback = (status: PrinterStatus) => void;
type PrintResultCallback = (success: boolean, error?: string) => void;

class PrinterService {
    private ws: WebSocket | null = null;
    private config: PrinterConfig = {
        espIp: '',
        espPort: 81,
        autoReconnect: true,
        reconnectInterval: 5000
    };
    private status: PrinterStatus = {
        appConnected: false,
        printerConnected: false,
        lastUpdate: 0
    };
    private statusListeners: Set<StatusCallback> = new Set();
    private printResultCallback: PrintResultCallback | null = null;
    private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    private statusPollTimer: ReturnType<typeof setInterval> | null = null;

    // Get current config
    getConfig(): PrinterConfig {
        return { ...this.config };
    }

    // Get current status
    getStatus(): PrinterStatus {
        return { ...this.status };
    }

    // Load config from localStorage
    loadConfig(): PrinterConfig {
        try {
            const saved = localStorage.getItem('printer_config');
            if (saved) {
                this.config = { ...this.config, ...JSON.parse(saved) };
            }
        } catch (e) {
            console.error('Failed to load printer config:', e);
        }
        return this.config;
    }

    // Save config to localStorage
    saveConfig(config: Partial<PrinterConfig>): void {
        this.config = { ...this.config, ...config };
        localStorage.setItem('printer_config', JSON.stringify(this.config));
    }

    // Subscribe to status changes
    onStatusChange(callback: StatusCallback): () => void {
        this.statusListeners.add(callback);
        // Immediately call with current status
        callback(this.status);
        // Return unsubscribe function
        return () => this.statusListeners.delete(callback);
    }

    // Notify all status listeners
    private notifyStatusChange(): void {
        this.statusListeners.forEach(cb => cb(this.status));
    }

    // Update status
    private updateStatus(updates: Partial<PrinterStatus>): void {
        this.status = { ...this.status, ...updates, lastUpdate: Date.now() };
        this.notifyStatusChange();
    }

    // Connect to ESP32
    connect(ip?: string, port?: number): Promise<boolean> {
        return new Promise((resolve) => {
            if (ip) this.config.espIp = ip;
            if (port) this.config.espPort = port;

            if (!this.config.espIp) {
                console.error('ESP32 IP not configured');
                resolve(false);
                return;
            }

            // Close existing connection
            this.closeConnection();

            const wsUrl = `ws://${this.config.espIp}:${this.config.espPort}`;
            console.log(`Connecting to ESP32 at ${wsUrl}...`);

            try {
                this.ws = new WebSocket(wsUrl);

                const connectionTimeout = setTimeout(() => {
                    if (this.ws?.readyState !== WebSocket.OPEN) {
                        console.error('Connection timeout');
                        this.ws?.close();
                        this.updateStatus({ appConnected: false });
                        resolve(false);
                    }
                }, 5000);

                this.ws.onopen = () => {
                    clearTimeout(connectionTimeout);
                    console.log('Connected to ESP32');
                    this.updateStatus({ appConnected: true });
                    this.saveConfig({ espIp: this.config.espIp, espPort: this.config.espPort });

                    // Request initial status
                    this.requestStatus();

                    // Start status polling
                    this.startStatusPolling();

                    resolve(true);
                };

                this.ws.onmessage = (event) => {
                    this.handleMessage(event.data);
                };

                this.ws.onerror = (error) => {
                    console.error('WebSocket error:', error);
                };

                this.ws.onclose = () => {
                    console.log('Disconnected from ESP32');
                    this.updateStatus({ appConnected: false, printerConnected: false });
                    this.stopStatusPolling();

                    // Auto reconnect
                    if (this.config.autoReconnect && this.config.espIp) {
                        this.scheduleReconnect();
                    }
                };
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                resolve(false);
            }
        });
    }

    // Close WebSocket connection
    private closeConnection(): void {
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
        this.stopStatusPolling();
        if (this.ws) {
            this.ws.onclose = null; // Prevent auto-reconnect
            this.ws.close();
            this.ws = null;
        }
    }

    // Disconnect from ESP32
    disconnect(): void {
        this.config.autoReconnect = false;
        this.closeConnection();
        this.updateStatus({ appConnected: false, printerConnected: false });
    }

    // Schedule reconnection attempt
    private scheduleReconnect(): void {
        if (this.reconnectTimer) return;

        console.log(`Reconnecting in ${this.config.reconnectInterval}ms...`);
        this.reconnectTimer = setTimeout(() => {
            this.reconnectTimer = null;
            if (this.config.autoReconnect) {
                this.connect();
            }
        }, this.config.reconnectInterval);
    }

    // Start polling printer status
    private startStatusPolling(): void {
        this.stopStatusPolling();
        this.statusPollTimer = setInterval(() => {
            this.requestStatus();
        }, 3000);
    }

    // Stop polling
    private stopStatusPolling(): void {
        if (this.statusPollTimer) {
            clearInterval(this.statusPollTimer);
            this.statusPollTimer = null;
        }
    }

    // Request status from ESP32
    requestStatus(): void {
        this.send({ type: 'status' });
    }

    // Send message to ESP32
    private send(data: object): boolean {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
            console.warn('WebSocket not connected');
            return false;
        }
        try {
            this.ws.send(JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Failed to send message:', error);
            return false;
        }
    }

    // Handle incoming message from ESP32
    private handleMessage(data: string): void {
        try {
            const msg = JSON.parse(data);

            switch (msg.type) {
                case 'status':
                    this.updateStatus({
                        printerConnected: msg.printer === true
                    });
                    break;

                case 'print_result':
                    if (this.printResultCallback) {
                        this.printResultCallback(msg.success === true, msg.error);
                        this.printResultCallback = null;
                    }
                    break;

                case 'pong':
                    // Keep-alive response
                    break;

                default:
                    console.log('Unknown message type:', msg.type);
            }
        } catch (error) {
            console.error('Failed to parse message:', error);
        }
    }

    // Print receipt/document
    print(job: PrintJob): Promise<{ success: boolean; error?: string }> {
        return new Promise((resolve) => {
            if (!this.status.appConnected) {
                resolve({ success: false, error: 'Not connected to ESP32' });
                return;
            }

            if (!this.status.printerConnected) {
                resolve({ success: false, error: 'Printer not connected' });
                return;
            }

            // Set callback for print result
            this.printResultCallback = (success, error) => {
                resolve({ success, error });
            };

            // Send print job
            const sent = this.send({
                type: 'print',
                lines: job.lines,
                cut: job.cut !== false,
                drawer: job.openDrawer === true
            });

            if (!sent) {
                this.printResultCallback = null;
                resolve({ success: false, error: 'Failed to send print job' });
                return;
            }

            // Timeout for print result
            setTimeout(() => {
                if (this.printResultCallback) {
                    this.printResultCallback = null;
                    resolve({ success: false, error: 'Print timeout' });
                }
            }, 10000);
        });
    }

    // Print a simple test page
    printTest(): Promise<{ success: boolean; error?: string }> {
        const testJob: PrintJob = {
            lines: [
                { text: '================================', type: 'separator' },
                { text: 'PRINTER TEST', align: 'center', bold: true, size: 'large' },
                { text: '================================', type: 'separator' },
                { text: '' },
                { text: 'ESP32 Printer Bridge', align: 'center' },
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
        return this.print(testJob);
    }
}

// Export singleton instance
export const printerService = new PrinterService();
