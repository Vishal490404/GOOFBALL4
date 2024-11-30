import { DisconnectReason, useMultiFileAuthState, makeWASocket } from "@whiskeysockets/baileys";
import { IDS } from "./ids.js";
import fs from 'fs/promises';


const utcOffset = 5.5 * 60 * 60 * 1000;
async function callDaddyFn(sock, errString){
    try {
        return await sock.sendMessage('919322512338@s.whatsapp.net', { text: errString });
    } catch (err) {
        console.error("Failed to send error message:", err);
        process.exit(56);
    }
}

async function sendReminder() {
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
                return callDaddyFn(sock, "Logged out. Please re-authenticate.");
            }
        } else if (connection === 'open') {
            console.log("Connected!");
            try {
                return await getReminders(sock)
            } catch (error) {
                return callDaddyFn(sock, `Error in reminderService.js: ${error}`);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
}

// sendReminder();



async function getReminders(sock) {
    const ids = IDS;
    try {
        const remindersData = await fs.readFile('reminderFile.txt', 'utf-8');
        const reminders = JSON.parse(`[${remindersData.slice(0, -2)}]`);
        
        const currentTime = new Date();
        currentTime.setTime(currentTime.getTime() + utcOffset)
        const twoMinsLater = new Date(currentTime);
        twoMinsLater.setTime(twoMinsLater.getTime() + 2 * 60000)
        const twoMinsBefore = new Date(currentTime);
        twoMinsBefore.setTime(twoMinsBefore.getTime() - 2 * 60000)
        // console.log(reminders)
        const reminder = reminders.filter(reminder => {
            const reminderTime = new Date(reminder.time);
            reminderTime.setTime(reminderTime.getTime() + utcOffset)
            // console.log(reminderTime, twoMinsLater, twoMinsBefore);
            
            return reminderTime <= twoMinsLater && reminderTime >= twoMinsBefore;
        });
        // console.log(reminder);
        
        if (reminder.length > 0) {
            let message = `🛑 *REMINDER* 🛑\n\n`

            reminder.forEach(element => {
                message += element.message.replace(/\n$/, '');
            });

            // await Promise.all(ids.map(id => sock.sendMessage(id, { text: message })));
            console.log("Reminder Sent Successfully");
            
            process.exit(0)
            
        } else {
            console.log("No reminders within the next 2 minutes.");
            process.exit(0)
        }
    } catch (error) {
        return callDaddyFn(sock, `Error in sendReminder.js: ${error}`);
        // process.exit(0)
    }
}

sendReminder()





