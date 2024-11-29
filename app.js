import { DisconnectReason, useMultiFileAuthState, makeWASocket } from "@whiskeysockets/baileys";
import { fetchData } from "./getContestDetails.js";

async function connectionLogic() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    const ids = ['120363055841239377@g.us', '919322512338@s.whatsapp.net', '917038815102@s.whatsapp.net', '917517756075@s.whatsapp.net'];
    

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
                const payload = await fetchData(); 
                // console.log("Filtered Data:", payload);

                if (payload.length > 0) {
                    await Promise.all(ids.map(id => sock.sendMessage(id, { text: payload })));
                    // await sock.logout();
                    console.log("Message sent successfully.");
                    process.exit(0); 
                } else {
                    console.log("No contests to notify about.");
                }
            } catch (error) {
                console.error("Failed to send message:", error);
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
