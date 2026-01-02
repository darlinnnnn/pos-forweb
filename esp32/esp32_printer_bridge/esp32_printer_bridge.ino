/*
  ESP32 POS Printer Bridge – RPP02N (FINAL FIX)
  - Bluetooth Classic SPP
  - MAC hardcoded
  - Legacy PIN 0000 (ESP32 core 3.x compatible)
  - ESC/POS direct (no Adafruit_Thermal)
*/

#include <WiFi.h>
#include <WebServer.h>
#include <WebSocketsServer.h>
#include <BluetoothSerial.h>
#include <ArduinoJson.h>

// ================= CONFIG =================
#define WS_PORT 81

const char* AP_SSID = "POS-Printer-Setup";
const char* AP_PASS = "12345678";

// RPP02N MAC ADDRESS
uint8_t PRINTER_ADDR[6] = {0x86, 0x67, 0x7A, 0x90, 0x30, 0xE0};
const char* BT_PIN = "0000";

// =========================================

WebServer server(80);
WebSocketsServer webSocket(WS_PORT);
BluetoothSerial SerialBT;

bool printerConnected = false;

// ================= ESC/POS =================
void printerInit() {
  SerialBT.write(0x1B); SerialBT.write('@'); // init
}

void printerCenter() {
  SerialBT.write(0x1B); SerialBT.write('a'); SerialBT.write(1);
}

void printerLeft() {
  SerialBT.write(0x1B); SerialBT.write('a'); SerialBT.write(0);
}

void printerFeed(uint8_t n) {
  for (uint8_t i = 0; i < n; i++) SerialBT.write(0x0A);
}

// ================= HTML =================
const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta name=viewport content="width=device-width,initial-scale=1">
<title>ESP32 Printer</title>
<style>
body{font-family:sans-serif;background:#0f172a;color:#fff;padding:20px}
button{padding:14px;width:100%;font-size:16px;margin:8px 0}
</style>
</head>
<body>
<h2>🖨 ESP32 Printer Bridge</h2>
<button onclick="test()">🧪 Test Print</button>

<script>
function test(){
  fetch('/test').then(()=>alert('Print sent'));
}
</script>
</body>
</html>
)rawliteral";

// ================= HTTP =================
void handleRoot() {
  server.send(200, "text/html", INDEX_HTML);
}

void handleTest() {
  if (!printerConnected) {
    server.send(500, "text/plain", "Printer not connected");
    return;
  }

  printerInit();
  printerCenter();
  SerialBT.println("ESP32 PRINTER OK");
  SerialBT.println("----------------");
  SerialBT.println("RPP02N CONNECTED");
  printerFeed(2);
  printerLeft();

  server.send(200, "text/plain", "OK");
}

// ================= WEBSOCKET =================
void wsEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
  if (type != WStype_TEXT) return;

  StaticJsonDocument<512> doc;
  if (deserializeJson(doc, payload)) return;

  const char* msgType = doc["type"] | "";

  if (strcmp(msgType, "print") == 0 && printerConnected) {
    printerInit();
    printerLeft();

    for (JsonObject line : doc["lines"].as<JsonArray>()) {
      const char* text = line["text"] | "";
      SerialBT.println(text);
    }
    printerFeed(2);
  }
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);

  // Bluetooth setup (ESP32 core 3.x)
  SerialBT.setPin(BT_PIN, 4);
  SerialBT.begin("ESP32-POS", true); // master mode

  Serial.println("[BT] Connecting to printer...");
  if (SerialBT.connect(PRINTER_ADDR)) {
    printerConnected = true;
    Serial.println("[BT] CONNECTED");
  } else {
    Serial.println("[BT] FAILED");
  }

  // WiFi AP
  WiFi.mode(WIFI_AP);
  WiFi.softAP(AP_SSID, AP_PASS);
  Serial.print("[WiFi] AP IP: ");
  Serial.println(WiFi.softAPIP());

  // HTTP
  server.on("/", handleRoot);
  server.on("/test", handleTest);
  server.begin();

  // WebSocket
  webSocket.begin();
  webSocket.onEvent(wsEvent);

  Serial.println("READY");
}

// ================= LOOP =================
void loop() {
  server.handleClient();
  webSocket.loop();

  static unsigned long t;
  if (millis() - t > 1000) {
    t = millis();
    printerConnected = SerialBT.connected();
    Serial.println(printerConnected ? "BT CONNECTED" : "BT NOT CONNECTED");
  }
}
