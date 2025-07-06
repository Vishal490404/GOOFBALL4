import { DisconnectReason, useMultiFileAuthState, makeWASocket } from "@whiskeysockets/baileys";
import readline from 'readline';


async function connectionLogic() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');
    

    const sock = makeWASocket({
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
            // try {
            //     const response = await sock.groupFetchAllParticipating();
            //     const rl = readline.createInterface({
            //         input: process.stdin,
            //         output: process.stdout
            //     });
            //     console.log(response);
                
            //     rl.question('Enter the group name: ', (inputName) => {
            //         const group = Object.values(response).find(g => g.subject === inputName);
            //         if (group) {
            //             console.log(group);
            //         } else {
            //             console.log('Group not found.');
            //         }
            //         rl.close();
            //     });
            // } catch (error) {
            //     return error;
            // }
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
