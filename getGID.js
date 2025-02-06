import { DisconnectReason, useMultiFileAuthState, makeWASocket } from "@whiskeysockets/baileys";


async function connectionLogic() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    

    const sock = makeWASocket({
        printQRInTerminal: true,
        auth: state,
    });

    sock.ev.on('connection.update', async (update) => {
        const { connection, lastDisconnect, qr } = update;
        if (qr) {
            console.log("Scan this QR to log in:", qr);
        }

        if (connection === 'close') {
            const shouldReconnect =
                lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;

            console.log(`Connection closed due to ${lastDisconnect?.error}`);
            if (shouldReconnect) {
                console.log("Reconnecting...");
                connectionLogic();
            } else {
                console.log("Logged out. Please re-authenticate.");
            }
        } else if (connection === 'open') {
            console.log("Connected!");
            try {
               
                // process.exit(0)
                
            } catch (error) {
                // return callDaddyFn(sock, `Error in app.js: ${error.message}`);
                return error
            }
        }
    });

    sock.ev.on('messages.update', (messageInfo) => {
        console.log("Chat updated:", messageInfo);
    }); 

    sock.ev.on('messages.upsert', (messageInfo) => {
        console.log("Some Change:", messageInfo?.messages);
    });

    sock.ev.on('creds.update', saveCreds);
}

connectionLogic();
