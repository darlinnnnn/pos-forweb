/*
  Wemos D1 Mini (ESP8266) Printer Bridge
  
  WebSocket server untuk menghubungkan web app POS dengan thermal printer.
  
  Hardware:
  - Wemos D1 Mini (ESP8266)
  - Thermal Printer (58mm or 80mm) connected via Software Serial
    - D6 (GPIO 12) -> Printer RX
    - D5 (GPIO 14) -> Printer TX (optional, for status)
    - GND -> GND
  
  Libraries Required:
  - ArduinoJson (by Benoit Blanchon)
  - WebSockets (by Markus Sattler)
  - SoftwareSerial (built-in)
  
  Install via Arduino Library Manager.
*/

#include <ESP8266WiFi.h>
#include <WebSocketsServer.h>
#include <ArduinoJson.h>
#include <SoftwareSerial.h>

// ==================== CONFIGURATION ====================

// WiFi credentials - UBAH SESUAI WIFI ANDA
const char* ssid = "WIFI_SSID";
const char* password = "WIFI_PASSWORD";

// WebSocket port
const int wsPort = 81;

// Printer Software Serial pins (Wemos D1 Mini)
#define PRINTER_RX_PIN D6  // GPIO12 - Connect to Printer TX
#define PRINTER_TX_PIN D5  // GPIO14 - Connect to Printer RX
#define PRINTER_BAUD 9600

// Paper width (chars): 32 for 58mm, 48 for 80mm
#define PAPER_WIDTH 48

// ========================================================

// WebSocket server
WebSocketsServer webSocket = WebSocketsServer(wsPort);

// Printer Software Serial
SoftwareSerial PrinterSerial(PRINTER_RX_PIN, PRINTER_TX_PIN);

// Status
bool printerConnected = true; // Assume connected for SoftwareSerial
unsigned long lastStatusBroadcast = 0;
const unsigned long statusBroadcastInterval = 5000;

// ESC/POS Commands
const uint8_t ESC = 0x1B;
const uint8_t GS = 0x1D;
const uint8_t LF = 0x0A;

// Initialize printer with default settings
void initPrinter() {
    // Reset printer
    PrinterSerial.write(ESC);
    PrinterSerial.write('@');
    delay(50);
    
    // Set character set
    PrinterSerial.write(ESC);
    PrinterSerial.write('t');
    PrinterSerial.write((uint8_t)0); // PC437
}

// Set text alignment
void setAlignment(const char* align) {
    uint8_t mode = 0; // left
    if (strcmp(align, "center") == 0) mode = 1;
    else if (strcmp(align, "right") == 0) mode = 2;
    
    PrinterSerial.write(ESC);
    PrinterSerial.write('a');
    PrinterSerial.write(mode);
}

// Set text bold
void setBold(bool bold) {
    PrinterSerial.write(ESC);
    PrinterSerial.write('E');
    PrinterSerial.write(bold ? 1 : 0);
}

// Set text size
void setSize(const char* size) {
    uint8_t mode = 0x00; // normal
    if (strcmp(size, "large") == 0) mode = 0x11; // double width + height
    else if (strcmp(size, "small") == 0) mode = 0x00; // normal
    
    PrinterSerial.write(GS);
    PrinterSerial.write('!');
    PrinterSerial.write(mode);
}

// Print line
void printLine(const char* text) {
    PrinterSerial.print(text);
    PrinterSerial.write(LF);
}

// Print separator line
void printSeparator() {
    for (int i = 0; i < PAPER_WIDTH; i++) {
        PrinterSerial.print("-");
    }
    PrinterSerial.write(LF);
}

// Cut paper
void cutPaper() {
    PrinterSerial.write(LF);
    PrinterSerial.write(LF);
    PrinterSerial.write(LF);
    PrinterSerial.write(GS);
    PrinterSerial.write('V');
    PrinterSerial.write((uint8_t)66); // Partial cut
    PrinterSerial.write((uint8_t)3);  // Feed 3 lines
}

// Open cash drawer
void openDrawer() {
    PrinterSerial.write(ESC);
    PrinterSerial.write('p');
    PrinterSerial.write((uint8_t)0);
    PrinterSerial.write((uint8_t)100);
    PrinterSerial.write((uint8_t)100);
}

// Send status to all WebSocket clients
void broadcastStatus() {
    StaticJsonDocument<128> doc;
    doc["type"] = "status";
    doc["esp"] = true;
    doc["printer"] = printerConnected;
    
    String json;
    serializeJson(doc, json);
    webSocket.broadcastTXT(json);
}

// Handle print job from web app
void handlePrint(JsonDocument& doc, uint8_t clientNum) {
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
    
    // Reset formatting
    setBold(false);
    setSize("normal");
    setAlignment("left");
    
    if (shouldCut) {
        cutPaper();
    }
    
    if (shouldOpenDrawer) {
        openDrawer();
    }
    
    // Send success response
    StaticJsonDocument<128> response;
    response["type"] = "print_result";
    response["success"] = true;
    
    String json;
    serializeJson(response, json);
    webSocket.sendTXT(clientNum, json);
}

// WebSocket event handler
void webSocketEvent(uint8_t num, WStype_t type, uint8_t* payload, size_t length) {
    switch (type) {
        case WStype_DISCONNECTED:
            Serial.printf("[%u] Disconnected!\n", num);
            break;
            
        case WStype_CONNECTED: {
            IPAddress ip = webSocket.remoteIP(num);
            Serial.printf("[%u] Connected from %s\n", num, ip.toString().c_str());
            
            // Send status immediately
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
            Serial.printf("[%u] Received: %s\n", num, payload);
            
            StaticJsonDocument<2048> doc;
            DeserializationError error = deserializeJson(doc, payload);
            
            if (error) {
                Serial.printf("JSON parse error: %s\n", error.c_str());
                return;
            }
            
            const char* msgType = doc["type"] | "";
            
            if (strcmp(msgType, "status") == 0) {
                // Send current status
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
        
        case WStype_PING:
        case WStype_PONG:
            break;
    }
}

void setup() {
    // Initialize Serial for debugging
    Serial.begin(115200);
    Serial.println("\n\n=== Wemos D1 Mini Printer Bridge ===\n");
    
    // Initialize Printer Software Serial
    PrinterSerial.begin(PRINTER_BAUD);
    Serial.println("Printer serial initialized");
    Serial.printf("TX: D5 (GPIO14), RX: D6 (GPIO12)\n");
    
    // Connect to WiFi
    Serial.printf("Connecting to WiFi: %s\n", ssid);
    WiFi.mode(WIFI_STA);
    WiFi.begin(ssid, password);
    
    // Blink built-in LED while connecting
    pinMode(LED_BUILTIN, OUTPUT);
    while (WiFi.status() != WL_CONNECTED) {
        digitalWrite(LED_BUILTIN, LOW);
        delay(250);
        digitalWrite(LED_BUILTIN, HIGH);
        delay(250);
        Serial.print(".");
    }
    digitalWrite(LED_BUILTIN, HIGH); // LED off (active low)
    
    Serial.println();
    Serial.printf("Connected! IP: %s\n", WiFi.localIP().toString().c_str());
    Serial.printf("WebSocket server on port: %d\n", wsPort);
    
    // Start WebSocket server
    webSocket.begin();
    webSocket.onEvent(webSocketEvent);
    
    Serial.println("\nReady! Waiting for connections...\n");
}

void loop() {
    webSocket.loop();
    
    // Periodic status broadcast
    if (millis() - lastStatusBroadcast >= statusBroadcastInterval) {
        broadcastStatus();
        lastStatusBroadcast = millis();
    }
    
    // Blink LED when client connected
    static unsigned long lastBlink = 0;
    if (webSocket.connectedClients() > 0) {
        if (millis() - lastBlink >= 1000) {
            digitalWrite(LED_BUILTIN, !digitalRead(LED_BUILTIN));
            lastBlink = millis();
        }
    } else {
        digitalWrite(LED_BUILTIN, HIGH); // LED off
    }
}
