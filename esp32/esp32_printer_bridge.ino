/*
  ESP32 Printer Bridge with Captive Portal & Bluetooth
  
  Features:
  - AP Mode with Captive Portal for initial setup
  - Connect to RPP02N Bluetooth Thermal Printer
  - WiFi configuration with Static IP support
  - Auto-reconnect to saved WiFi (1 minute timeout)
  - WebSocket server for POS app communication
  
  Hardware:
  - ESP32 DevKit / Any ESP32 board
  - RPP02N Bluetooth Thermal Printer
  
  Libraries Required:
  - ArduinoJson (by Benoit Blanchon)
  - WebSockets (by Markus Sattler)
  - ESPAsyncWebServer (by Me-No-Dev)
  - AsyncTCP (by Me-No-Dev)
  - BluetoothSerial (built-in)
  
  Install via Arduino Library Manager or PlatformIO.
*/

#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>
#include <Preferences.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <BluetoothSerial.h>

// ==================== CONFIGURATION ====================

// AP Mode settings
const char* AP_SSID = "POS-Printer-Setup";
const char* AP_PASS = "12345678";
const IPAddress AP_IP(192, 168, 4, 1);
const IPAddress AP_GATEWAY(192, 168, 4, 1);
const IPAddress AP_SUBNET(255, 255, 255, 0);

// DNS for captive portal
const byte DNS_PORT = 53;

// WebSocket port
const int WS_PORT = 81;

// WiFi connection timeout (1 minute)
const unsigned long WIFI_TIMEOUT = 60000;

// Paper width (chars): 32 for 58mm, 48 for 80mm
#define PAPER_WIDTH 48

// ========================================================

// Objects
WebServer server(80);
DNSServer dnsServer;
WebSocketsServer webSocket(WS_PORT);
BluetoothSerial SerialBT;
Preferences preferences;

// State
enum DeviceMode { MODE_AP, MODE_STATION };
DeviceMode currentMode = MODE_AP;

bool printerConnected = false;
String printerName = "";
String printerAddress = "";

unsigned long wifiStartTime = 0;
bool wifiConnecting = false;

// Bluetooth PIN for pairing
String btPinCode = "0000";

// ESC/POS Commands
const uint8_t ESC = 0x1B;
const uint8_t GS = 0x1D;
const uint8_t LF = 0x0A;

// SSP Callback for PIN authentication
void BTConfirmRequestCallback(uint32_t numVal) {
    Serial.printf("[BT] Confirm request for %d - auto confirming\n", numVal);
    SerialBT.confirmReply(true);
}

void BTAuthCompleteCallback(boolean success) {
    if (success) {
        Serial.println("[BT] Pairing successful!");
    } else {
        Serial.println("[BT] Pairing failed!");
    }
}

// ==================== HTML PAGES ====================

const char INDEX_HTML[] PROGMEM = R"rawliteral(
<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>POS Printer</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:system-ui;background:#0f172a;color:#f1f5f9;padding:16px}
.c{max-width:400px;margin:0 auto}
h1{color:#fbbf24;text-align:center;padding:20px 0;font-size:1.3rem}
.card{background:#1e293b;border-radius:12px;padding:16px;margin-bottom:12px}
.t{font-size:0.75rem;color:#64748b;margin-bottom:12px;text-transform:uppercase}
input,select{width:100%;padding:12px;background:#0f172a;border:1px solid #334155;border-radius:8px;color:#f1f5f9;margin-bottom:10px;font-size:1rem}
input:focus{outline:none;border-color:#fbbf24}
.btn{width:100%;padding:14px;border:none;border-radius:8px;font-weight:700;cursor:pointer;margin-top:8px}
.p{background:#fbbf24;color:#0f172a}
.s{background:#334155;color:#f1f5f9}
.btn:disabled{opacity:0.5}
.d{padding:10px;background:#0f172a;border-radius:8px;margin:8px 0;cursor:pointer;border:1px solid #334155}
.d:hover{border-color:#fbbf24}
.d.sel{border-color:#10b981;background:#10b98110}
.row{display:flex;justify-content:space-between;padding:6px 0;font-size:0.9rem}
.msg{padding:10px;border-radius:8px;margin-bottom:10px;font-size:0.85rem}
.ok{background:#10b98120;color:#10b981}
.err{background:#ef444420;color:#ef4444}
.info{background:#3b82f620;color:#3b82f6}
.ld{display:inline-block;width:16px;height:16px;border:2px solid transparent;border-top:2px solid currentColor;border-radius:50%;animation:sp 1s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
label{font-size:0.8rem;color:#94a3b8;display:block;margin-bottom:4px}
</style>
</head>
<body>
<div class="c">
<h1>🖨️ POS Printer Bridge</h1>
<div id="msg"></div>

<div class="card">
<div class="t">📡 Status</div>
<div class="row"><span>Mode</span><span id="mode">-</span></div>
<div class="row"><span>IP</span><span id="ip">-</span></div>
<div class="row"><span>Printer</span><span id="pr">-</span></div>
</div>

<div class="card">
<div class="t">🔵 Bluetooth</div>
<button class="btn s" id="scn" onclick="scan()">🔍 Scan Printers</button>
<div id="devs"></div>
<button class="btn p" id="conn" onclick="conn()" disabled>Connect</button>
</div>

<div class="card">
<div class="t">📶 WiFi</div>
<label>SSID</label>
<input id="ssid" placeholder="WiFi name">
<label>Password</label>
<input type="password" id="pass" placeholder="Password">
<label>WebSocket Port</label>
<input type="number" id="port" value="81">
<button class="btn p" onclick="saveWifi()">💾 Save & Connect</button>
</div>

<div class="card">
<button class="btn s" onclick="reset()">🔄 Factory Reset</button>
</div>
</div>

<script>
var sel=null;
document.addEventListener('DOMContentLoaded',load);

function load(){
fetch('/status').then(r=>r.json()).then(d=>{
document.getElementById('mode').textContent=d.mode||'-';
document.getElementById('ip').textContent=d.ip||'-';
document.getElementById('pr').textContent=d.printer||'Not Connected';
if(d.ssid)document.getElementById('ssid').value=d.ssid;
}).catch(e=>console.log(e));
}

function msg(t,c){
document.getElementById('msg').innerHTML='<div class="msg '+c+'">'+t+'</div>';
setTimeout(()=>document.getElementById('msg').innerHTML='',4000);
}

function scan(){
var b=document.getElementById('scn');
b.disabled=true;b.innerHTML='<span class="ld"></span> Scanning...';
document.getElementById('devs').innerHTML='<div class="msg info">Scanning...</div>';
fetch('/bt/scan').then(r=>r.json()).then(d=>{
b.disabled=false;b.innerHTML='🔍 Scan Printers';
if(d.devices&&d.devices.length>0){
var h='';
d.devices.forEach(v=>{
h+='<div class="d" onclick="pick(this,\''+v.address+'\',\''+v.name+'\')"><b>'+(v.name||'Unknown')+'</b><br><small>'+v.address+'</small></div>';
});
document.getElementById('devs').innerHTML=h;
}else{
document.getElementById('devs').innerHTML='<div class="msg info">No devices found</div>';
}
}).catch(e=>{b.disabled=false;b.innerHTML='🔍 Scan Printers';msg('Scan failed','err');});
}

function pick(el,addr,name){
sel={address:addr,name:name};
document.querySelectorAll('.d').forEach(e=>e.classList.remove('sel'));
el.classList.add('sel');
document.getElementById('conn').disabled=false;
}

function conn(){
if(!sel)return;
var b=document.getElementById('conn');
b.disabled=true;b.innerHTML='<span class="ld"></span> Connecting...';
fetch('/bt/connect',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({address:sel.address,name:sel.name})})
.then(r=>r.json()).then(d=>{
b.disabled=false;b.innerHTML='Connect';
if(d.success){msg('Connected!','ok');load();}
else msg('Failed: '+(d.error||'Error'),'err');
}).catch(e=>{b.disabled=false;b.innerHTML='Connect';msg('Failed','err');});
}

function saveWifi(){
var ssid=document.getElementById('ssid').value;
var pass=document.getElementById('pass').value;
var port=document.getElementById('port').value;
if(!ssid){msg('Enter SSID','err');return;}
fetch('/wifi/save',{method:'POST',headers:{'Content-Type':'application/json'},
body:JSON.stringify({ssid:ssid,password:pass,wsPort:parseInt(port)})})
.then(r=>r.json()).then(d=>{
if(d.success){msg('Saved! Rebooting...','ok');setTimeout(()=>location.reload(),5000);}
else msg('Failed','err');
}).catch(e=>msg('Failed','err'));
}

function reset(){
if(confirm('Erase all settings?')){
fetch('/reset',{method:'POST'}).then(r=>r.json()).then(d=>{
msg('Reset done. Rebooting...','ok');setTimeout(()=>location.reload(),3000);
}).catch(e=>msg('Failed','err'));
}
}
</script>
</body>
</html>
)rawliteral";

// ==================== PRINTER FUNCTIONS ====================

void initPrinter() {
    if (!printerConnected) return;
    SerialBT.write(ESC);
    SerialBT.write('@');
    delay(50);
}

void setAlignment(const char* align) {
    if (!printerConnected) return;
    uint8_t mode = 0;
    if (strcmp(align, "center") == 0) mode = 1;
    else if (strcmp(align, "right") == 0) mode = 2;
    
    SerialBT.write(ESC);
    SerialBT.write('a');
    SerialBT.write(mode);
}

void setBold(bool bold) {
    if (!printerConnected) return;
    SerialBT.write(ESC);
    SerialBT.write('E');
    SerialBT.write(bold ? 1 : 0);
}

void setSize(const char* size) {
    if (!printerConnected) return;
    uint8_t mode = 0x00;
    if (strcmp(size, "large") == 0) mode = 0x11;
    
    SerialBT.write(GS);
    SerialBT.write('!');
    SerialBT.write(mode);
}

void printLine(const char* text) {
    if (!printerConnected) return;
    SerialBT.print(text);
    SerialBT.write(LF);
}

void printSeparator() {
    if (!printerConnected) return;
    for (int i = 0; i < PAPER_WIDTH; i++) {
        SerialBT.print("-");
    }
    SerialBT.write(LF);
}

void cutPaper() {
    if (!printerConnected) return;
    SerialBT.write(LF);
    SerialBT.write(LF);
    SerialBT.write(LF);
    SerialBT.write(GS);
    SerialBT.write('V');
    SerialBT.write((uint8_t)66);
    SerialBT.write((uint8_t)3);
}

void openDrawer() {
    if (!printerConnected) return;
    SerialBT.write(ESC);
    SerialBT.write('p');
    SerialBT.write((uint8_t)0);
    SerialBT.write((uint8_t)100);
    SerialBT.write((uint8_t)100);
}

// ==================== WEBSOCKET HANDLERS ====================

void broadcastStatus() {
    StaticJsonDocument<128> doc;
    doc["type"] = "status";
    doc["esp"] = true;
    doc["printer"] = printerConnected;
    
    String json;
    serializeJson(doc, json);
    webSocket.broadcastTXT(json);
}

void handlePrint(JsonDocument& doc, uint8_t clientNum) {
    if (!printerConnected) {
        StaticJsonDocument<128> response;
        response["type"] = "print_result";
        response["success"] = false;
        response["error"] = "Printer not connected";
        
        String json;
        serializeJson(response, json);
        webSocket.sendTXT(clientNum, json);
        return;
    }

    JsonArray lines = doc["lines"].as<JsonArray>();
    bool shouldCut = doc["cut"] | true;
    bool shouldOpenDrawer = doc["drawer"] | false;
    
    initPrinter();
    
    for (JsonObject line : lines) {
        const char* text = line["text"] | "";
        const char* align = line["align"] | "left";
        bool bold = line["bold"] | false;
        const char* size = line["size"] | "normal";
        const char* type = line["type"] | "text";
        
        if (strcmp(type, "separator") == 0) {
            printSeparator();
            continue;
        }
        
        setAlignment(align);
        setBold(bold);
        setSize(size);
        printLine(text);
    }
    
    setBold(false);
    setSize("normal");
    setAlignment("left");
    
    if (shouldCut) cutPaper();
    if (shouldOpenDrawer) openDrawer();
    
    StaticJsonDocument<128> response;
    response["type"] = "print_result";
    response["success"] = true;
    
    String json;
    serializeJson(response, json);
    webSocket.sendTXT(clientNum, json);
}

void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.printf("[WS] Client %u disconnected\n", num);
            break;
            
        case WStype_CONNECTED: {
            Serial.printf("[WS] Client %u connected\n", num);
            
            StaticJsonDocument<128> doc;
            doc["type"] = "status";
            doc["esp"] = true;
            doc["printer"] = printerConnected;
            
            String json;
            serializeJson(doc, json);
            webSocket.sendTXT(num, json);
            break;
        }
        
        case WStype_TEXT: {
            Serial.printf("[WS] Received: %s\n", payload);
            
            StaticJsonDocument<2048> doc;
            if (deserializeJson(doc, payload)) {
                Serial.println("[WS] JSON parse error");
                return;
            }
            
            const char* msgType = doc["type"] | "";
            
            if (strcmp(msgType, "status") == 0) {
                StaticJsonDocument<128> response;
                response["type"] = "status";
                response["esp"] = true;
                response["printer"] = printerConnected;
                
                String json;
                serializeJson(response, json);
                webSocket.sendTXT(num, json);
            }
            else if (strcmp(msgType, "print") == 0) {
                handlePrint(doc, num);
            }
            else if (strcmp(msgType, "ping") == 0) {
                StaticJsonDocument<64> response;
                response["type"] = "pong";
                
                String json;
                serializeJson(response, json);
                webSocket.sendTXT(num, json);
            }
            break;
        }
        
        default:
            break;
    }
}

// ==================== WEB SERVER HANDLERS ====================

void handleRoot() {
    server.send(200, "text/html", INDEX_HTML);
}

void handleStatus() {
    StaticJsonDocument<256> doc;
    doc["mode"] = currentMode == MODE_AP ? "Access Point" : "Station";
    doc["ip"] = WiFi.localIP().toString();
    doc["printer"] = printerConnected ? printerName : "";
    
    preferences.begin("wifi", true);
    doc["ssid"] = preferences.getString("ssid", "");
    preferences.end();
    
    String json;
    serializeJson(doc, json);
    server.send(200, "application/json", json);
}

void handleBluetoothScan() {
    Serial.println("[BT] Starting scan...");
    
    BTScanResults* results = SerialBT.discover(5000);
    
    StaticJsonDocument<1024> doc;
    JsonArray devices = doc.createNestedArray("devices");
    
    if (results) {
        for (int i = 0; i < results->getCount(); i++) {
            BTAdvertisedDevice* device = results->getDevice(i);
            JsonObject dev = devices.createNestedObject();
            dev["name"] = device->getName().c_str();
            dev["address"] = device->getAddress().toString().c_str();
        }
    }
    
    String json;
    serializeJson(doc, json);
    server.send(200, "application/json", json);
    
    Serial.printf("[BT] Found %d devices\n", devices.size());
}

void handleBluetoothConnect() {
    if (!server.hasArg("plain")) {
        server.send(400, "application/json", "{\"success\":false,\"error\":\"No body\"}");
        return;
    }

    StaticJsonDocument<256> doc;
    if (deserializeJson(doc, server.arg("plain"))) {
        server.send(400, "application/json", "{\"success\":false,\"error\":\"Invalid JSON\"}");
        return;
    }

    const char* address = doc["address"] | "";
    const char* name = doc["name"] | "Printer";

    Serial.printf("[BT] Connecting to %s (%s)...\n", name, address);

    // Disconnect if already connected
    if (SerialBT.connected()) {
        SerialBT.disconnect();
        delay(500);
    }

    // Connect to printer
    if (SerialBT.connect(address)) {
        printerConnected = true;
        printerName = String(name);
        printerAddress = String(address);

        // Save to preferences
        preferences.begin("bt", false);
        preferences.putString("addr", printerAddress);
        preferences.putString("name", printerName);
        preferences.end();

        Serial.println("[BT] Connected!");
        server.send(200, "application/json", "{\"success\":true}");
    } else {
        printerConnected = false;
        Serial.println("[BT] Connection failed");
        server.send(200, "application/json", "{\"success\":false,\"error\":\"Connection failed\"}");
    }
}

void handleWiFiSave() {
    if (!server.hasArg("plain")) {
        server.send(400, "application/json", "{\"success\":false,\"error\":\"No body\"}");
        return;
    }

    StaticJsonDocument<512> doc;
    if (deserializeJson(doc, server.arg("plain"))) {
        server.send(400, "application/json", "{\"success\":false,\"error\":\"Invalid JSON\"}");
        return;
    }

    const char* ssid = doc["ssid"] | "";
    const char* password = doc["password"] | "";
    int wsPort = doc["wsPort"] | 81;
    const char* staticIP = doc["staticIP"] | "";
    const char* gateway = doc["gateway"] | "";
    const char* subnet = doc["subnet"] | "";

    preferences.begin("wifi", false);
    preferences.putString("ssid", ssid);
    preferences.putString("pass", password);
    preferences.putInt("wsPort", wsPort);
    preferences.putString("ip", staticIP);
    preferences.putString("gw", gateway);
    preferences.putString("sn", subnet);
    preferences.end();

    Serial.printf("[WiFi] Saved: %s\n", ssid);
    server.send(200, "application/json", "{\"success\":true}");

    delay(1000);
    ESP.restart();
}

void handleReset() {
    preferences.begin("wifi", false);
    preferences.clear();
    preferences.end();

    preferences.begin("bt", false);
    preferences.clear();
    preferences.end();

    Serial.println("[System] Factory reset!");
    server.send(200, "application/json", "{\"success\":true}");

    delay(1000);
    ESP.restart();
}

// Captive portal redirect
void handleNotFound() {
    if (currentMode == MODE_AP) {
        server.sendHeader("Location", "http://192.168.4.1/");
        server.send(302, "text/plain", "");
    } else {
        server.send(404, "text/plain", "Not found");
    }
}

// ==================== SETUP FUNCTIONS ====================

void startAPMode() {
    Serial.println("[WiFi] Starting AP Mode...");
    
    WiFi.mode(WIFI_AP);
    WiFi.softAPConfig(AP_IP, AP_GATEWAY, AP_SUBNET);
    WiFi.softAP(AP_SSID, AP_PASS);
    
    currentMode = MODE_AP;
    
    // Start DNS for captive portal
    dnsServer.start(DNS_PORT, "*", AP_IP);
    
    Serial.printf("[WiFi] AP SSID: %s\n", AP_SSID);
    Serial.printf("[WiFi] AP IP: %s\n", WiFi.softAPIP().toString().c_str());
}

bool connectToWiFi() {
    preferences.begin("wifi", true);
    String ssid = preferences.getString("ssid", "");
    String password = preferences.getString("pass", "");
    String staticIP = preferences.getString("ip", "");
    String gateway = preferences.getString("gw", "");
    String subnet = preferences.getString("sn", "");
    preferences.end();

    if (ssid.length() == 0) {
        Serial.println("[WiFi] No saved credentials");
        return false;
    }

    Serial.printf("[WiFi] Connecting to: %s\n", ssid.c_str());
    
    WiFi.mode(WIFI_STA);

    // Configure static IP if set
    if (staticIP.length() > 0) {
        IPAddress ip, gw, sn;
        if (ip.fromString(staticIP) && gw.fromString(gateway) && sn.fromString(subnet)) {
            WiFi.config(ip, gw, sn);
            Serial.printf("[WiFi] Static IP: %s\n", staticIP.c_str());
        }
    }

    WiFi.begin(ssid.c_str(), password.c_str());

    wifiStartTime = millis();
    wifiConnecting = true;

    while (wifiConnecting && (millis() - wifiStartTime < WIFI_TIMEOUT)) {
        if (WiFi.status() == WL_CONNECTED) {
            Serial.printf("[WiFi] Connected! IP: %s\n", WiFi.localIP().toString().c_str());
            currentMode = MODE_STATION;
            wifiConnecting = false;
            return true;
        }
        delay(500);
        Serial.print(".");
    }

    Serial.println("\n[WiFi] Connection timeout");
    wifiConnecting = false;
    return false;
}

void connectSavedPrinter() {
    preferences.begin("bt", true);
    String addr = preferences.getString("addr", "");
    String name = preferences.getString("name", "");
    preferences.end();

    if (addr.length() > 0) {
        Serial.printf("[BT] Reconnecting to: %s\n", name.c_str());
        
        if (SerialBT.connect(addr.c_str())) {
            printerConnected = true;
            printerName = name;
            printerAddress = addr;
            Serial.println("[BT] Reconnected!");
        } else {
            Serial.println("[BT] Reconnection failed");
        }
    }
}

void setup() {
    Serial.begin(115200);
    Serial.println("\n\n=== ESP32 POS Printer Bridge ===\n");

    // Initialize Bluetooth with SSP callbacks
    if (!SerialBT.begin("POS-Printer", true)) {  // true = master mode
        Serial.println("[BT] Failed to initialize!");
    } else {
        // Register callback for PIN confirmation
        SerialBT.enableSSP();
        SerialBT.onConfirmRequest(BTConfirmRequestCallback);
        SerialBT.onAuthComplete(BTAuthCompleteCallback);
        Serial.println("[BT] Initialized with SSP");
    }

    // Try to connect to saved WiFi
    if (!connectToWiFi()) {
        // Fallback to AP mode
        startAPMode();
    }

    // Setup web server routes
    server.on("/", HTTP_GET, handleRoot);
    server.on("/status", HTTP_GET, handleStatus);
    server.on("/bt/scan", HTTP_GET, handleBluetoothScan);
    server.on("/bt/connect", HTTP_POST, handleBluetoothConnect);
    server.on("/wifi/save", HTTP_POST, handleWiFiSave);
    server.on("/reset", HTTP_POST, handleReset);
    server.onNotFound(handleNotFound);
    
    server.begin();
    Serial.println("[Web] Server started on port 80");

    // Start WebSocket server
    preferences.begin("wifi", true);
    int wsPort = preferences.getInt("wsPort", WS_PORT);
    preferences.end();

    webSocket = WebSocketsServer(wsPort);
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
    Serial.printf("[WS] Server started on port %d\n", wsPort);

    // Try to reconnect to saved printer
    connectSavedPrinter();

    Serial.println("\nReady!\n");
}

// ==================== MAIN LOOP ====================

unsigned long lastStatusBroadcast = 0;

void loop() {
    // Handle DNS for captive portal
    if (currentMode == MODE_AP) {
        dnsServer.processNextRequest();
    }

    // Handle web server
    server.handleClient();

    // Handle WebSocket
    webSocket.loop();

    // Periodic status broadcast
    if (millis() - lastStatusBroadcast >= 5000) {
        broadcastStatus();
        lastStatusBroadcast = millis();
    }

    // Check Bluetooth connection
    printerConnected = SerialBT.connected();

    // Check WiFi connection (auto-reconnect)
    if (currentMode == MODE_STATION && WiFi.status() != WL_CONNECTED) {
        Serial.println("[WiFi] Connection lost, reconnecting...");
        if (!connectToWiFi()) {
            startAPMode();
        }
    }
}
