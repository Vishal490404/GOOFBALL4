import { DisconnectReason, useMultiFileAuthState, makeWASocket } from "@whiskeysockets/baileys";
import { fetchData } from "./getContestDetails.js";
import { IDS } from "./ids.js";



export async function callDaddyFn(sock, errString){
    try {
        return await sock.sendMessage('919322512338@s.whatsapp.net', { text: errString });
    } catch (err) {
        console.error("Failed to send error message:", err);
        process.exit(56);
    }
}
async function connectionLogic() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const ids = IDS;
    

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
                return callDaddyFn(sock, "Logged out. Please re-authenticate.");
            }
        } else if (connection === 'open') {
            console.log("Connected!");
            try {
                const payload = await fetchData(sock); 
                // console.log("Filtered Data:", payload);

                if (payload.length > 0) {
                    // await Promise.all(ids.map(id => sock.sendMessage(id, { text: payload })));
                    for (const id of ids) {
                        try {
                          await sock.sendMessage(id, { text: payload });
                          console.log(`Message sent to: ${id}`);
                        } catch (error) {
                          console.error(`Failed to send message to: ${id}`, error);
                        }
                    }
                    // await sock.logout();
                    console.log("Message sent successfully.");
                    process.exit(0); 
                } else {
                    console.log("No contests to notify about.");
                    return callDaddyFn(sock, "No contests found or error occurred in app.js");
                }
            } catch (error) {
                return callDaddyFn(sock, `Error in app.js: ${error.message}`);
            }
        }
    });

    // sock.ev.on('messages.update', (messageInfo) => {
    //     console.log("Chat updated:", messageInfo);
    // });

    // sock.ev.on('messages.upsert', (messageInfo) => {
    //     console.log("Some Change:", messageInfo?.messages);
    // });

    sock.ev.on('creds.update', saveCreds);
}

connectionLogic();
