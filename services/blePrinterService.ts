// BLE Printer Service - Web Bluetooth API for direct BLE thermal printer connection
// Supports RPP02N and similar ESC/POS BLE thermal printers

// Common BLE Printer Service/Characteristic UUIDs
// RPP02N typically uses these UUIDs (may vary by firmware version)
const PRINTER_SERVICE_UUID = 0x18F0; // or '000018f0-0000-1000-8000-00805f9b34fb'
const PRINTER_WRITE_CHAR_UUID = 0x2AF1; // or '00002af1-0000-1000-8000-00805f9b34fb'

// Alternative UUIDs for different printer models
const ALT_SERVICE_UUIDS = [
    0x18F0,
    0xFFE0,  // Common for some Chinese printers
    '49535343-fe7d-4ae5-8fa9-9fafd205e455', // Nordic UART Service
];

const ALT_WRITE_CHAR_UUIDS = [
    0x2AF1,
    0xFFE1,  // Common for some Chinese printers
    '49535343-8841-43f4-a8d4-ecbe34729bb3', // Nordic UART TX
];

export interface BLEPrinterStatus {
    isSupported: boolean;
    isConnected: boolean;
    deviceName: string;
    deviceId: string;
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

type StatusCallback = (status: BLEPrinterStatus) => void;

class BLEPrinterService {
    private device: BluetoothDevice | null = null;
    private server: BluetoothRemoteGATTServer | null = null;
    private writeCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
    private statusListeners: Set<StatusCallback> = new Set();
    private paperWidth = 48; // Characters per line (48 for 80mm, 32 for 58mm)

    // ESC/POS Commands
    private readonly ESC = 0x1B;
    private readonly GS = 0x1D;
    private readonly LF = 0x0A;

    // Check if Web Bluetooth is supported
    isSupported(): boolean {
        return 'bluetooth' in navigator;
    }

    // Get current status
    getStatus(): BLEPrinterStatus {
        return {
            isSupported: this.isSupported(),
            isConnected: this.server?.connected || false,
            deviceName: this.device?.name || '',
            deviceId: this.device?.id || '',
            lastUpdate: Date.now()
        };
    }

    // Subscribe to status changes
    onStatusChange(callback: StatusCallback): () => void {
        this.statusListeners.add(callback);
        callback(this.getStatus());
        return () => this.statusListeners.delete(callback);
    }

    // Notify all listeners
    private notifyStatusChange(): void {
        const status = this.getStatus();
        this.statusListeners.forEach(cb => cb(status));
    }

    // Request device from user (opens browser device picker)
    async requestDevice(): Promise<BluetoothDevice | null> {
        if (!this.isSupported()) {
            console.error('Web Bluetooth is not supported in this browser');
            return null;
        }

        try {
            // Request device with optional services filter
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { namePrefix: 'RPP' },      // RPP02N etc
                    { namePrefix: 'PT-' },      // Some thermal printers
                    { namePrefix: 'Printer' },
                    { namePrefix: 'BT' },       // Bluetooth printer
                    { namePrefix: 'MTP' },      // Mobile Thermal Printer
                ],
                optionalServices: ALT_SERVICE_UUIDS as any
            });

            console.log('[BLE] Device selected:', device.name);
            this.device = device;

            // Listen for disconnection
            device.addEventListener('gattserverdisconnected', () => {
                console.log('[BLE] Device disconnected');
                this.server = null;
                this.writeCharacteristic = null;
                this.notifyStatusChange();
            });

            return device;
        } catch (error) {
            console.error('[BLE] Failed to request device:', error);
            return null;
        }
    }

    // Connect to the selected device
    async connect(device?: BluetoothDevice): Promise<boolean> {
        const targetDevice = device || this.device;

        if (!targetDevice) {
            console.error('[BLE] No device selected');
            return false;
        }

        try {
            console.log('[BLE] Connecting to GATT server...');
            this.server = await targetDevice.gatt!.connect();
            this.device = targetDevice;
            console.log('[BLE] Connected to GATT server');

            // Try to find the printer service
            let service: BluetoothRemoteGATTService | null = null;

            for (const serviceUUID of ALT_SERVICE_UUIDS) {
                try {
                    service = await this.server.getPrimaryService(serviceUUID as any);
                    console.log('[BLE] Found service:', serviceUUID);
                    break;
                } catch {
                    // Try next UUID
                }
            }

            if (!service) {
                console.error('[BLE] Could not find printer service');
                return false;
            }

            // Try to find the write characteristic
            for (const charUUID of ALT_WRITE_CHAR_UUIDS) {
                try {
                    this.writeCharacteristic = await service.getCharacteristic(charUUID as any);
                    console.log('[BLE] Found write characteristic:', charUUID);
                    break;
                } catch {
                    // Try next UUID
                }
            }

            if (!this.writeCharacteristic) {
                console.error('[BLE] Could not find write characteristic');
                return false;
            }

            this.notifyStatusChange();
            return true;
        } catch (error) {
            console.error('[BLE] Connection failed:', error);
            return false;
        }
    }

    // Disconnect from printer
    disconnect(): void {
        if (this.server?.connected) {
            this.server.disconnect();
        }
        this.server = null;
        this.writeCharacteristic = null;
        this.notifyStatusChange();
    }

    // Set paper width
    setPaperWidth(width: '58mm' | '80mm'): void {
        this.paperWidth = width === '58mm' ? 32 : 48;
    }

    // Write data to printer (handles chunking for BLE)
    private async writeData(data: Uint8Array): Promise<boolean> {
        if (!this.writeCharacteristic) {
            console.error('[BLE] Not connected to printer');
            return false;
        }

        try {
            // BLE has a max packet size (usually 20 bytes), need to chunk
            const chunkSize = 20;
            for (let i = 0; i < data.length; i += chunkSize) {
                const chunk = data.slice(i, i + chunkSize);
                await this.writeCharacteristic.writeValue(chunk);
                // Small delay between chunks
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            return true;
        } catch (error) {
            console.error('[BLE] Write failed:', error);
            return false;
        }
    }

    // Initialize printer
    private getInitCommand(): Uint8Array {
        return new Uint8Array([this.ESC, 0x40]); // ESC @
    }

    // Set alignment
    private getAlignCommand(align: 'left' | 'center' | 'right'): Uint8Array {
        const mode = align === 'left' ? 0 : align === 'center' ? 1 : 2;
        return new Uint8Array([this.ESC, 0x61, mode]); // ESC a n
    }

    // Set bold
    private getBoldCommand(bold: boolean): Uint8Array {
        return new Uint8Array([this.ESC, 0x45, bold ? 1 : 0]); // ESC E n
    }

    // Set text size
    private getSizeCommand(size: 'normal' | 'large' | 'small'): Uint8Array {
        const mode = size === 'large' ? 0x11 : 0x00; // Double width & height
        return new Uint8Array([this.GS, 0x21, mode]); // GS ! n
    }

    // Create separator line
    private getSeparatorLine(): string {
        return '-'.repeat(this.paperWidth);
    }

    // Cut paper
    private getCutCommand(): Uint8Array {
        return new Uint8Array([this.LF, this.LF, this.LF, this.GS, 0x56, 66, 3]); // Feed + GS V 66 3
    }

    // Open cash drawer
    private getDrawerCommand(): Uint8Array {
        return new Uint8Array([this.ESC, 0x70, 0, 100, 100]); // ESC p 0 100 100
    }

    // Build print data from job
    private buildPrintData(job: PrintJob): Uint8Array {
        const encoder = new TextEncoder();
        const chunks: Uint8Array[] = [];

        // Initialize printer
        chunks.push(this.getInitCommand());

        // Process each line
        for (const line of job.lines) {
            // Handle separator type
            if (line.type === 'separator') {
                chunks.push(encoder.encode(this.getSeparatorLine()));
                chunks.push(new Uint8Array([this.LF]));
                continue;
            }

            // Set formatting
            chunks.push(this.getAlignCommand(line.align || 'left'));
            chunks.push(this.getBoldCommand(line.bold || false));
            chunks.push(this.getSizeCommand(line.size || 'normal'));

            // Print text
            chunks.push(encoder.encode(line.text));
            chunks.push(new Uint8Array([this.LF]));
        }

        // Reset formatting
        chunks.push(this.getBoldCommand(false));
        chunks.push(this.getSizeCommand('normal'));
        chunks.push(this.getAlignCommand('left'));

        // Cut paper if requested
        if (job.cut !== false) {
            chunks.push(this.getCutCommand());
        }

        // Open drawer if requested
        if (job.openDrawer) {
            chunks.push(this.getDrawerCommand());
        }

        // Combine all chunks
        const totalLength = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
        const result = new Uint8Array(totalLength);
        let offset = 0;
        for (const chunk of chunks) {
            result.set(chunk, offset);
            offset += chunk.length;
        }

        return result;
    }

    // Print a job
    async print(job: PrintJob): Promise<{ success: boolean; error?: string }> {
        if (!this.server?.connected || !this.writeCharacteristic) {
            return { success: false, error: 'Printer not connected' };
        }

        try {
            const data = this.buildPrintData(job);
            const success = await this.writeData(data);
            return { success, error: success ? undefined : 'Write failed' };
        } catch (error) {
            console.error('[BLE] Print failed:', error);
            return { success: false, error: String(error) };
        }
    }

    // Print test page
    async printTest(): Promise<{ success: boolean; error?: string }> {
        const testJob: PrintJob = {
            lines: [
                { text: '', type: 'separator' },
                { text: 'BLE PRINTER TEST', align: 'center', bold: true, size: 'large' },
                { text: '', type: 'separator' },
                { text: '' },
                { text: 'Web Bluetooth Connected!', align: 'center' },
                { text: `Device: ${this.device?.name || 'Unknown'}`, align: 'center' },
                { text: `Time: ${new Date().toLocaleString('id-ID')}`, align: 'center' },
                { text: '' },
                { text: 'Font Styles:', bold: true },
                { text: 'Normal text' },
                { text: 'Bold text', bold: true },
                { text: 'Large text', size: 'large' },
                { text: '' },
                { text: 'Alignment:' },
                { text: 'Left', align: 'left' },
                { text: 'Center', align: 'center' },
                { text: 'Right', align: 'right' },
                { text: '' },
                { text: '', type: 'separator' },
                { text: 'Test Complete!', align: 'center', bold: true },
                { text: '', type: 'separator' },
            ],
            cut: true
        };

        return this.print(testJob);
    }

    // Save paired device info to localStorage
    savePairedDevice(): void {
        if (this.device) {
            localStorage.setItem('ble_printer', JSON.stringify({
                id: this.device.id,
                name: this.device.name
            }));
        }
    }

    // Get saved device info
    getSavedDevice(): { id: string; name: string } | null {
        try {
            const saved = localStorage.getItem('ble_printer');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load saved BLE printer:', e);
        }
        return null;
    }

    // Clear saved device
    clearSavedDevice(): void {
        localStorage.removeItem('ble_printer');
    }
}

// Export singleton instance
export const blePrinterService = new BLEPrinterService();
