/**
 * Mock ESP8266 Printer Bridge Server
 * 
 * Usage: 
 *   npm install ws
 *   node mock-printer.js
 * 
 * Connect from web app: IP = 127.0.0.1, Port = 81
 */

const WebSocket = require('ws');
const PORT = 81;
let printerConnected = true;

const wss = new WebSocket.Server({ port: PORT });

// Print to console (simulated)
function simulatePrint(lines, cut, drawer) {
    console.log('\n' + '='.repeat(48));
    console.log('    🖨️  SIMULATED PRINT OUTPUT');
    console.log('='.repeat(48));

    for (const line of lines) {
        let text = line.text || '';
        if (line.type === 'separator') {
            console.log('-'.repeat(48));
            continue;
        }
        if (line.bold) text = `** ${text} **`;
        if (line.align === 'center') {
            const pad = Math.floor((48 - text.length) / 2);
            text = ' '.repeat(Math.max(0, pad)) + text;
        }
        console.log(text);
    }

    console.log('='.repeat(48));
    if (cut) console.log('✂️  [PAPER CUT]');
    if (drawer) console.log('💰 [CASH DRAWER OPENED]');
    console.log('');
}

wss.on('connection', (ws) => {
    console.log('[CONNECT] Client connected');

    // Send initial status
    ws.send(JSON.stringify({ type: 'status', esp: true, printer: printerConnected }));

    ws.on('message', (data) => {
        const msg = JSON.parse(data.toString());
        console.log('[RECEIVE]', msg.type);

        switch (msg.type) {
            case 'status':
                ws.send(JSON.stringify({ type: 'status', esp: true, printer: printerConnected }));
                break;
            case 'print':
                simulatePrint(msg.lines || [], msg.cut, msg.drawer);
                ws.send(JSON.stringify({ type: 'print_result', success: true }));
                break;
            case 'ping':
                ws.send(JSON.stringify({ type: 'pong' }));
                break;
        }
    });

    ws.on('close', () => console.log('[DISCONNECT] Client disconnected'));
});

console.log('\n🖨️  MOCK PRINTER SERVER');
console.log('========================');
console.log(`WebSocket: ws://127.0.0.1:${PORT}`);
console.log('\nPress P to toggle printer status, Q to quit\n');

// Keyboard controls
if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (key) => {
        const c = key.toString().toLowerCase();
        if (c === 'p') {
            printerConnected = !printerConnected;
            console.log(`[STATUS] Printer: ${printerConnected ? 'CONNECTED' : 'DISCONNECTED'}`);
            wss.clients.forEach(ws => ws.send(JSON.stringify({ type: 'status', esp: true, printer: printerConnected })));
        }
        if (c === 'q' || c === '\u0003') process.exit(0);
    });
}
