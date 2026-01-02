# ESP32 POS Printer Bridge

Bridge untuk menghubungkan Web App POS dengan Thermal Printer via Bluetooth (RPP02N).

## Features

- 🌐 **Captive Portal** - Setup awal via web interface
- 🔵 **Bluetooth Printer** - Connect ke RPP02N atau thermal printer Bluetooth lainnya
- 📶 **WiFi Configuration** - Connect ke WiFi dengan opsi Static IP
- 🔄 **Auto-Reconnect** - Otomatis connect ke WiFi tersimpan saat boot
- ⏱️ **Timeout 1 Menit** - Jika gagal connect WiFi, kembali ke AP Mode
- 🔌 **WebSocket Server** - Komunikasi real-time dengan POS App

## Hardware Requirements

- **ESP32** (ESP32 DevKit, ESP32-WROOM, atau board ESP32 lainnya)
- **Thermal Printer** dengan Bluetooth (RPP02N, POS-5802, dll)

## Software Requirements

### Arduino IDE
1. Install **ESP32 Board** via Board Manager
2. Install Libraries via Library Manager:
   - `ArduinoJson` by Benoit Blanchon
   - `WebSockets` by Markus Sattler

### PlatformIO
```ini
[env:esp32]
platform = espressif32
board = esp32dev
framework = arduino
lib_deps = 
    bblanchon/ArduinoJson@^6.21.0
    links2004/WebSockets@^2.4.0
```

## Upload Firmware

1. Buka `esp32_printer_bridge.ino` di Arduino IDE
2. Pilih Board: **ESP32 Dev Module**
3. Pilih Port yang sesuai
4. Klik **Upload**

## First Time Setup

1. **Power On ESP32**
   - ESP32 akan memulai dalam AP Mode

2. **Connect ke WiFi ESP32**
   - SSID: `POS-Printer-Setup`
   - Password: `12345678`

3. **Buka Browser**
   - Otomatis redirect ke portal, atau buka `http://192.168.4.1`

4. **Setup Bluetooth Printer**
   - Nyalakan printer dan pastikan Bluetooth aktif
   - Klik **Scan for Printers**
   - Pilih printer dari list
   - Klik **Connect to Printer**

5. **Setup WiFi**
   - Masukkan SSID dan Password WiFi
   - (Opsional) Centang **Use Static IP** dan isi IP yang diinginkan
   - Set WebSocket Port (default: 81)
   - Klik **Save & Connect**

6. **ESP32 akan Reboot**
   - Connect ke WiFi yang diatur
   - WebSocket server siap menerima koneksi dari POS App

## Auto-Connect Behavior

```
┌─────────────────────────────────────────────────────────────┐
│                     ESP32 Power On                          │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌─────────────────────────────┐
              │   Check Saved WiFi Config   │
              └─────────────────────────────┘
                            │
            ┌───────────────┴───────────────┐
            │                               │
            ▼                               ▼
    ┌───────────────┐               ┌───────────────┐
    │  Config Found │               │  No Config    │
    └───────────────┘               └───────────────┘
            │                               │
            ▼                               │
    ┌───────────────┐                       │
    │  Try Connect  │                       │
    │  (1 min max)  │                       │
    └───────────────┘                       │
            │                               │
    ┌───────┴───────┐                       │
    │               │                       │
    ▼               ▼                       │
Connected?      Timeout                     │
    │               │                       │
    ▼               └───────────────────────┘
Station Mode                    │
    │                           ▼
    │               ┌───────────────────────┐
    │               │   Start AP Mode       │
    │               │   192.168.4.1         │
    │               └───────────────────────┘
    │
    ▼
┌─────────────────────────────────────────────────────────────┐
│              WebSocket Server Running                        │
│              Ready for POS App Connection                    │
└─────────────────────────────────────────────────────────────┘
```

## WebSocket API

### Connect
```javascript
const ws = new WebSocket('ws://[ESP32_IP]:81');
```

### Messages

#### Request Status
```json
{ "type": "status" }
```

#### Status Response
```json
{
  "type": "status",
  "esp": true,
  "printer": true
}
```

#### Print Job
```json
{
  "type": "print",
  "lines": [
    { "text": "Hello World", "align": "center", "bold": true, "size": "large" },
    { "text": "Normal text" },
    { "text": "---", "type": "separator" }
  ],
  "cut": true,
  "drawer": false
}
```

#### Print Result
```json
{
  "type": "print_result",
  "success": true
}
```

## Configuration Options

| Option | Default | Description |
|--------|---------|-------------|
| AP SSID | `POS-Printer-Setup` | Access Point name |
| AP Password | `12345678` | Access Point password |
| WebSocket Port | `81` | Port for WebSocket server |
| WiFi Timeout | `60000` (1 min) | Timeout before fallback to AP |

## Troubleshooting

### Printer tidak terdeteksi
- Pastikan printer dalam mode pairing (Bluetooth aktif)
- Coba restart printer dan scan ulang
- Pastikan jarak tidak terlalu jauh (<10m)

### WiFi tidak connect
- Periksa SSID dan password
- Pastikan WiFi 2.4GHz (ESP32 tidak support 5GHz)
- Coba reboot ESP32

### WebSocket tidak connect
- Pastikan ESP32 terhubung ke WiFi yang sama
- Verifikasi IP dan port yang benar
- Check firewall tidak memblokir

### Factory Reset
- Buka browser ke `http://[ESP32_IP]/`
- Klik **Factory Reset**
- Atau: Flash ulang firmware

## LED Indicator

| Status | LED |
|--------|-----|
| AP Mode | Solid On |
| Connecting WiFi | Blinking Fast |
| Station Mode | Off |
| Client Connected | Slow Blink |

## Support

Untuk pertanyaan atau issue, silakan buka GitHub Issue.
