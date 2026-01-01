# Wemos D1 Mini Printer Bridge

Firmware Arduino untuk Wemos D1 Mini (ESP8266) sebagai bridge antara web app POS dan thermal printer.

## Hardware Requirements

- **Wemos D1 Mini** (ESP8266)
- Thermal Printer (58mm atau 80mm) dengan interface Serial
- Kabel jumper

## Wiring

| Wemos D1 Mini | Printer |
|---------------|---------|
| D5 (GPIO14) | RX (Receive) |
| D6 (GPIO12) | TX (Transmit) - Optional |
| GND | GND |

```
Wemos D1 Mini          Thermal Printer
+-------------+        +-------------+
|         D5  |------->| RX          |
|         D6  |<-------| TX (opt)    |
|        GND  |--------| GND         |
+-------------+        +-------------+
```

> **Note:** Printer membutuhkan power supply terpisah (12V atau 24V).

## Library Dependencies

Install via Arduino Library Manager:

1. **ArduinoJson** by Benoit Blanchon (v6.x)
2. **WebSockets** by Markus Sattler (v2.x)

## Board Setup

1. Buka Arduino IDE
2. File → Preferences → Additional Board Manager URLs, tambahkan:
   ```
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
3. Tools → Board → Boards Manager → search "esp8266" → Install
4. Pilih board: **LOLIN(WEMOS) D1 mini**

## Configuration

Edit `esp32_printer_bridge.ino`:

```cpp
// WiFi credentials - UBAH SESUAI WIFI ANDA
const char* ssid = "WIFI_SSID";
const char* password = "WIFI_PASSWORD";

// Paper width: 32 untuk 58mm, 48 untuk 80mm
#define PAPER_WIDTH 48
```

## Upload Instructions

1. Connect Wemos D1 Mini via USB
2. Pilih board: **LOLIN(WEMOS) D1 mini**
3. Pilih port yang sesuai
4. Klik Upload

## LED Indicator

| LED Status | Meaning |
|------------|---------|
| Blinking fast | Connecting to WiFi |
| Slow blink (1s) | Client connected |
| Off | Ready, no client |

## Usage

1. Upload firmware
2. Buka Serial Monitor (115200 baud)
3. Catat IP address yang ditampilkan
4. Di web app: Settings → Hardware → masukkan IP → Connect

## Troubleshooting

| Problem | Solution |
|---------|----------|
| WiFi tidak connect | Periksa SSID dan password |
| Upload gagal | Tekan RESET saat upload dimulai |
| Printer tidak print | Cek wiring D5→RX |
| Karakter aneh | Sesuaikan PAPER_WIDTH |
